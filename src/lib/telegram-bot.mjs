const TELEGRAM_API = 'https://api.telegram.org'
const MINI_APP_URL = 'https://space.petersmartlink.com/telegram'
const CHANNEL = '@otyaplayer'
const UPDATE_TTL = 24 * 60 * 60
const MAX_TEXT = 3900

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function clean(value, max = 4096) {
  return String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max)
}

async function secretValue(binding, name) {
  if (!binding || typeof binding.get !== 'function') throw new Error(`${name} is unavailable`)
  const value = await binding.get()
  if (!value) throw new Error(`${name} is unavailable`)
  return value
}

function constantTimeEqual(a, b) {
  const left = new TextEncoder().encode(String(a ?? ''))
  const right = new TextEncoder().encode(String(b ?? ''))
  if (left.length !== right.length) return false
  let diff = 0
  for (let i = 0; i < left.length; i++) diff |= left[i] ^ right[i]
  return diff === 0
}

async function telegramApi(method, body, env) {
  const token = await secretValue(env.TELEGRAM_BOT_TOKEN, 'Telegram bot credential')
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 12000)
  try {
    const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || data?.ok !== true) throw new Error(`Telegram ${method} failed`)
    return data.result
  } finally {
    clearTimeout(timeout)
  }
}

export async function sendTelegramMessage(chatId, text, env, options = {}) {
  return telegramApi('sendMessage', {
    chat_id: chatId,
    text: clean(text, 4096),
    link_preview_options: { is_disabled: true },
    ...options,
  }, env)
}

export async function setTelegramWebhook(env) {
  const secret = await secretValue(env.TELEGRAM_WEBHOOK_SECRET, 'Telegram webhook secret')
  return telegramApi('setWebhook', {
    url: 'https://petersmartlink.com/api/telegram/webhook',
    secret_token: secret,
    allowed_updates: ['message', 'edited_message', 'channel_post', 'callback_query'],
  }, env)
}

export async function getTelegramWebhookInfo(env) {
  return telegramApi('getWebhookInfo', {}, env)
}

export async function sendOtyaChannelAnnouncement(text, env) {
  return sendTelegramMessage(CHANNEL, text, env)
}

function splitTelegramText(text) {
  const source = clean(text, 16000)
  if (source.length <= MAX_TEXT) return [source]
  const chunks = []
  let rest = source
  while (rest.length > MAX_TEXT) {
    let cut = rest.lastIndexOf('\n', MAX_TEXT)
    if (cut < MAX_TEXT * 0.6) cut = rest.lastIndexOf(' ', MAX_TEXT)
    if (cut < MAX_TEXT * 0.6) cut = MAX_TEXT
    chunks.push(rest.slice(0, cut).trim())
    rest = rest.slice(cut).trim()
  }
  if (rest) chunks.push(rest)
  return chunks
}

async function askNext(text, env) {
  if (!env.AI_SUPPORT?.fetch) throw new Error('Next service unavailable')
  const headers = new Headers({ 'Content-Type': 'application/json', Accept: 'application/json', 'X-OTYA-Channel': 'telegram' })
  if (env.INTERNAL_SECRET) headers.set('X-OTYA-Internal-Secret', env.INTERNAL_SECRET)
  const response = await env.AI_SUPPORT.fetch(new Request('https://internal/api/ai/chat', {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: clean(text, 3000), channel: 'telegram' }),
  }))
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error('Next request failed')
  const answer = clean(data?.answer ?? data?.response ?? data?.message, 16000)
  if (!answer) throw new Error('Next returned an empty response')
  return answer
}

function commandReply(text) {
  if (text === '/start' || text.startsWith('/start ')) return {
    text: 'Welcome to Next by OTYA. Ask a question, search music, or open OTYA.',
    reply_markup: { inline_keyboard: [[{ text: 'Open OTYA', web_app: { url: MINI_APP_URL } }]] },
  }
  if (text === '/help') return { text: 'Ask Next anything, use /music <query>, /account for OTYA Account, /updates for release status, or /privacy for privacy information.' }
  if (text === '/account') return { text: `Open your OTYA Account: ${MINI_APP_URL}` }
  if (text === '/privacy') return { text: 'OTYA Privacy: https://petersmartlink.com/privacy' }
  return null
}

async function dynamicCommandReply(text, env) {
  if (text.startsWith('/music ')) return askNext(`Search OTYA music for: ${text.slice(7).trim()}`, env)
  if (text === '/updates') {
    const response = await fetch('https://petersmartlink.com/api/bootstrap', { headers: { Accept: 'application/json' } })
    if (!response.ok) return 'OTYA update information is temporarily unavailable.'
    const data = await response.json().catch(() => ({}))
    const release = data?.release ?? data?.latest ?? data
    if (release?.published === false) return 'There is no public OTYA release yet.'
    const version = clean(release?.version ?? release?.versionName, 80)
    return version ? `Current public OTYA release: ${version}.` : 'OTYA update information is available in the Mini App.'
  }
  return null
}

async function isDuplicate(updateId, env) {
  if (!env.KV || !Number.isSafeInteger(updateId)) return false
  const key = `telegram:update:${updateId}`
  const seen = await env.KV.get(key)
  if (seen) return true
  await env.KV.put(key, '1', { expirationTtl: UPDATE_TTL })
  return false
}

async function processPrivateMessage(message, env) {
  if (!message || message?.from?.is_bot === true || message?.chat?.type !== 'private') return
  const chatId = message?.chat?.id
  const text = clean(message?.text, 3000)
  if (!chatId || !text) return
  let reply = commandReply(text)
  if (!reply) {
    const dynamic = await dynamicCommandReply(text, env)
    if (dynamic) reply = { text: dynamic }
  }
  if (!reply) {
    try { reply = { text: await askNext(text, env) } }
    catch { reply = { text: 'Next is temporarily unavailable. Please try again shortly.' } }
  }
  const chunks = splitTelegramText(reply.text)
  for (let i = 0; i < chunks.length; i++) {
    await sendTelegramMessage(chatId, chunks[i], env, i === 0 && reply.reply_markup ? { reply_markup: reply.reply_markup } : {})
  }
}

export async function handleTelegramWebhook(request, env, ctx) {
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  let expected
  try { expected = await secretValue(env.TELEGRAM_WEBHOOK_SECRET, 'Telegram webhook secret') }
  catch { return json({ error: 'Telegram webhook is not configured' }, 503) }
  const provided = request.headers.get('X-Telegram-Bot-Api-Secret-Token') || ''
  if (!constantTimeEqual(provided, expected)) return json({ error: 'Unauthorized' }, 401)
  const update = await request.json().catch(() => null)
  if (!update || !Number.isSafeInteger(update.update_id)) return json({ ok: true })
  if (await isDuplicate(update.update_id, env)) return json({ ok: true, duplicate: true })
  const work = async () => {
    try {
      if (update.callback_query?.id) {
        await telegramApi('answerCallbackQuery', { callback_query_id: update.callback_query.id }, env).catch(() => undefined)
      }
      const message = update.message ?? update.edited_message
      await processPrivateMessage(message, env)
    } catch (error) {
      console.error('[telegram] update processing failed:', error instanceof Error ? error.message : 'unknown error')
    }
  }
  if (ctx?.waitUntil) ctx.waitUntil(work())
  else await work()
  return json({ ok: true })
}

export async function handleTelegramAdmin(request, env, action) {
  if (action === 'test') {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
    const body = await request.json().catch(() => ({}))
    if (body?.destination !== 'channel') return json({ error: 'Unsupported destination' }, 400)
    const text = clean(body?.text, 3000)
    if (!text) return json({ error: 'text is required' }, 400)
    const result = await sendOtyaChannelAnnouncement(text, env)
    return json({ ok: true, message_id: result?.message_id ?? null })
  }
  if (action === 'webhook') {
    if (request.method === 'POST') {
      const result = await setTelegramWebhook(env)
      return json({ ok: true, webhook_registered: Boolean(result) })
    }
    if (request.method === 'GET') {
      const info = await getTelegramWebhookInfo(env)
      return json({ ok: true, url: info?.url ?? '', pending_update_count: Number(info?.pending_update_count ?? 0), last_error_date: info?.last_error_date ?? null })
    }
    return json({ error: 'Method not allowed' }, 405)
  }
  return json({ error: 'Not found' }, 404)
}
