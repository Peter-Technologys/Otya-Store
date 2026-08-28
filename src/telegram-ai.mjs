const TELEGRAM_API = 'https://api.telegram.org'
const DEFAULT_MODEL = '@cf/meta/llama-3.1-8b-instruct-fast'

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}

function cleanText(value, max = 3500) {
  return String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, max)
}

async function telegram(env, method, body) {
  if (!env.TELEGRAM_BOT_TOKEN) throw new Error('TELEGRAM_BOT_TOKEN is not configured')
  const response = await fetch(`${TELEGRAM_API}/bot${env.TELEGRAM_BOT_TOKEN}/${method}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data.ok === false) throw new Error(`Telegram ${method} failed`)
  return data
}

function extractAiText(result) {
  if (typeof result?.response === 'string') return result.response
  const content = result?.choices?.[0]?.message?.content
  if (typeof content === 'string') return content
  return ''
}

async function answerWithAi(env, userText) {
  if (!env.AI?.run) return 'OTYA AI support is temporarily unavailable. Please contact support@petersmartlink.com.'
  const system = `You are OTYA Support, the official AI support assistant for OTYA Player.
Answer clearly and briefly. Help with OTYA Player usage, playback, downloads, account access, verification, updates, privacy, Terms, and troubleshooting.
Never ask for or reveal passwords, OTP codes, JWTs, API keys, bot tokens, secrets, payment credentials, or private backend configuration.
Never claim to have changed an account unless an approved backend action actually confirms it.
For account-specific or destructive actions, explain that identity verification is required and direct the user to the OTYA app or support@petersmartlink.com.
Do not invent outage status, account status, release versions, policies, or backend facts. If you lack verified information, say so.
Official community channel: https://t.me/otyaplayer.
Human support: support@petersmartlink.com.`
  const result = await env.AI.run(env.OTYA_AI_MODEL || DEFAULT_MODEL, {
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: userText },
    ],
  })
  return cleanText(extractAiText(result) || 'I could not generate a reliable answer. Please contact support@petersmartlink.com.')
}

export async function handleTelegramAi(request, env) {
  const url = new URL(request.url)
  if (url.pathname === '/api/telegram/status' && request.method === 'GET') {
    return json({
      ok: true,
      bot: '@OtyaPlayerBot',
      channel: 'https://t.me/otyaplayer',
      ai: Boolean(env.AI?.run),
      token_configured: Boolean(env.TELEGRAM_BOT_TOKEN),
      webhook_secret_configured: Boolean(env.TELEGRAM_WEBHOOK_SECRET),
    })
  }
  if (url.pathname !== '/api/telegram/webhook') return null
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  if (!env.TELEGRAM_WEBHOOK_SECRET) return json({ error: 'Telegram webhook is not configured' }, 503)
  const supplied = request.headers.get('X-Telegram-Bot-Api-Secret-Token') || ''
  if (supplied !== env.TELEGRAM_WEBHOOK_SECRET) return json({ error: 'Unauthorized' }, 401)

  let update
  try { update = await request.json() } catch { return json({ error: 'Invalid JSON' }, 400) }
  const message = update?.message
  const chatId = message?.chat?.id
  const text = cleanText(message?.text, 2000)
  if (!chatId || !text) return json({ ok: true })

  let reply
  if (text === '/start') {
    reply = 'Welcome to OTYA Support. I am the OTYA AI assistant. Ask me about OTYA Player, playback, accounts, updates, privacy, or troubleshooting. Never send passwords or verification codes here.'
  } else if (text === '/privacy') {
    reply = 'For privacy-sensitive or account-specific requests, use the OTYA app or contact support@petersmartlink.com. Never send passwords, OTPs, or secret keys to this bot.'
  } else if (text === '/channel') {
    reply = 'Official OTYA channel: https://t.me/otyaplayer'
  } else {
    try { reply = await answerWithAi(env, text) }
    catch (error) {
      console.error('[telegram-ai] inference failed:', error?.message ?? error)
      reply = 'I cannot answer that reliably right now. Please contact support@petersmartlink.com.'
    }
  }

  try {
    await telegram(env, 'sendMessage', {
      chat_id: chatId,
      text: cleanText(reply),
      disable_web_page_preview: true,
    })
  } catch (error) {
    console.error('[telegram-ai] send failed:', error?.message ?? error)
    return json({ error: 'Reply delivery failed' }, 502)
  }
  return json({ ok: true })
}
