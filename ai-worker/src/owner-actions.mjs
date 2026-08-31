const TELEGRAM_API = 'https://api.telegram.org'
const RESEND_API = 'https://api.resend.com/emails'
const ACTION_TTL_SECONDS = 15 * 60
const LATEST_ACTION_KEY = 'owner-action:latest'

const clean = (value, max = 4000) => String(value ?? '')
  .replace(/[\u0000-\u001f]/g, ' ')
  .trim()
  .slice(0, max)

const json = (data, status = 200) => new Response(JSON.stringify(data), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  },
})

function authorized(request, env) {
  return Boolean(env.INTERNAL_SECRET)
    && (request.headers.get('X-OTYA-Internal-Secret') || '') === env.INTERNAL_SECRET
}

function actionKey(id) {
  return `owner-action:${id}`
}

function telegramTarget(env) {
  const explicit = clean(env.TELEGRAM_CHANNEL_ID, 120)
  if (explicit) return explicit
  try {
    const url = new URL(env.TELEGRAM_CHANNEL_URL || 'https://t.me/otyaplayer')
    const handle = url.pathname.split('/').filter(Boolean)[0]
    return handle ? `@${handle}` : '@otyaplayer'
  } catch {
    return '@otyaplayer'
  }
}

function normalizeAction(type, payload, env) {
  if (type === 'telegram_post') {
    const text = clean(payload?.text, 3500)
    if (!text) throw new Error('Telegram message is required')
    return {
      type,
      summary: `Post to ${telegramTarget(env)}`,
      payload: { text },
    }
  }

  if (type === 'owner_email') {
    const subject = clean(payload?.subject, 180)
    const text = clean(payload?.text, 12000)
    if (!subject || !text) throw new Error('Email subject and message are required')
    return {
      type,
      summary: `Email ${env.ADMIN_REPORT_EMAIL || 'the OTYA owner'}`,
      payload: { subject, text },
    }
  }

  throw new Error('Unsupported owner action')
}

async function executeTelegram(env, payload) {
  if (!env.TELEGRAM_BOT_TOKEN) throw new Error('Telegram bot is not configured')
  const response = await fetch(`${TELEGRAM_API}/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chat_id: telegramTarget(env),
      text: payload.text,
      disable_web_page_preview: true,
    }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.ok === false) throw new Error('Telegram post failed')
  return {
    provider: 'telegram',
    message_id: data?.result?.message_id ?? null,
    target: telegramTarget(env),
  }
}

async function executeOwnerEmail(env, payload) {
  if (!env.RESEND_API_KEY) throw new Error('Resend is not configured')
  const to = env.ADMIN_REPORT_EMAIL || 'petersmartlink@gmail.com'
  const response = await fetch(RESEND_API, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'OTYA <noreply@petersmartlink.com>',
      to: [to],
      reply_to: 'support@petersmartlink.com',
      subject: payload.subject,
      text: payload.text,
    }),
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(`Resend HTTP ${response.status}`)
  return { provider: 'resend', email_id: data?.id ?? null, to }
}

async function execute(env, action) {
  if (action.type === 'telegram_post') return executeTelegram(env, action.payload)
  if (action.type === 'owner_email') return executeOwnerEmail(env, action.payload)
  throw new Error('Unsupported owner action')
}

async function prepare(env, body) {
  if (!env.KV) throw new Error('KV is required for owner action approval')
  const normalized = normalizeAction(clean(body?.type, 80), body?.payload || {}, env)
  const id = crypto.randomUUID()
  const approvalToken = crypto.randomUUID()
  const now = new Date()
  const record = {
    id,
    approval_token: approvalToken,
    status: 'pending',
    created_at: now.toISOString(),
    expires_at: new Date(now.getTime() + ACTION_TTL_SECONDS * 1000).toISOString(),
    type: normalized.type,
    summary: normalized.summary,
    payload: normalized.payload,
  }
  await env.KV.put(actionKey(id), JSON.stringify(record), { expirationTtl: ACTION_TTL_SECONDS })
  await env.KV.put(LATEST_ACTION_KEY, JSON.stringify({
    id,
    approval_token: approvalToken,
    created_at: record.created_at,
    expires_at: record.expires_at,
  }), { expirationTtl: ACTION_TTL_SECONDS })
  return {
    id,
    approval_token: approvalToken,
    status: 'pending',
    type: record.type,
    summary: record.summary,
    payload: record.payload,
    expires_at: record.expires_at,
  }
}

async function readPending(env, id) {
  if (!env.KV) return null
  const raw = await env.KV.get(actionKey(id))
  if (!raw) return null
  try { return JSON.parse(raw) } catch { return null }
}

export async function latestPendingOwnerAction(env) {
  if (!env.KV) return null
  const raw = await env.KV.get(LATEST_ACTION_KEY)
  if (!raw) return null
  try {
    const pointer = JSON.parse(raw)
    const action = await readPending(env, clean(pointer?.id, 80))
    if (!action || action.status !== 'pending') return null
    return {
      id: action.id,
      approval_token: clean(pointer?.approval_token, 120),
      type: action.type,
      summary: action.summary,
      payload: action.payload,
      created_at: action.created_at,
      expires_at: action.expires_at,
    }
  } catch {
    return null
  }
}

async function approve(env, body) {
  const id = clean(body?.id, 80)
  const token = clean(body?.approval_token, 120)
  if (!id || !token) throw new Error('Action ID and approval token are required')

  const action = await readPending(env, id)
  if (!action) throw new Error('Owner action expired or was not found')
  if (action.status !== 'pending') throw new Error('Owner action is no longer pending')
  if (action.approval_token !== token) throw new Error('Approval token does not match')

  // Mark first so an accidental retry cannot execute the same external write twice.
  action.status = 'executing'
  action.approval_token = null
  await env.KV.put(actionKey(id), JSON.stringify(action), { expirationTtl: ACTION_TTL_SECONDS })

  try {
    const result = await execute(env, action)
    action.status = 'completed'
    action.completed_at = new Date().toISOString()
    action.result = result
    await env.KV.put(actionKey(id), JSON.stringify(action), { expirationTtl: 86400 })
    return {
      id,
      status: action.status,
      type: action.type,
      summary: action.summary,
      result,
      completed_at: action.completed_at,
    }
  } catch (error) {
    action.status = 'failed'
    action.failed_at = new Date().toISOString()
    action.error = clean(error?.message, 300)
    await env.KV.put(actionKey(id), JSON.stringify(action), { expirationTtl: 86400 })
    throw error
  }
}

async function cancel(env, body) {
  const id = clean(body?.id, 80)
  if (!id) throw new Error('Action ID is required')
  const action = await readPending(env, id)
  if (!action) return { id, status: 'not_found' }
  if (action.status !== 'pending') return { id, status: action.status }
  action.status = 'cancelled'
  action.approval_token = null
  action.cancelled_at = new Date().toISOString()
  await env.KV.put(actionKey(id), JSON.stringify(action), { expirationTtl: 86400 })
  return { id, status: 'cancelled' }
}

function publicRecord(action) {
  if (!action) return null
  return {
    id: action.id,
    status: action.status,
    type: action.type,
    summary: action.summary,
    payload: action.payload,
    created_at: action.created_at,
    expires_at: action.expires_at,
    completed_at: action.completed_at,
    failed_at: action.failed_at,
    cancelled_at: action.cancelled_at,
    result: action.result,
    error: action.error,
  }
}

export async function handleOwnerActions(request, env) {
  if (!authorized(request, env)) return json({ error: 'Unauthorized' }, 401)
  const url = new URL(request.url)

  try {
    if (url.pathname.endsWith('/prepare') && request.method === 'POST') {
      const body = await request.json().catch(() => ({}))
      return json({ ok: true, action: await prepare(env, body) }, 201)
    }

    if (url.pathname.endsWith('/approve') && request.method === 'POST') {
      const body = await request.json().catch(() => ({}))
      return json({ ok: true, action: await approve(env, body) })
    }

    if (url.pathname.endsWith('/cancel') && request.method === 'POST') {
      const body = await request.json().catch(() => ({}))
      return json({ ok: true, action: await cancel(env, body) })
    }

    if (url.pathname.endsWith('/status') && request.method === 'GET') {
      const id = clean(url.searchParams.get('id'), 80)
      if (!id) return json({ error: 'id is required' }, 400)
      const action = publicRecord(await readPending(env, id))
      return action ? json({ ok: true, action }) : json({ error: 'Not found' }, 404)
    }

    return json({ error: 'Not found' }, 404)
  } catch (error) {
    console.error('[owner-action]', clean(error?.message, 300))
    return json({ error: clean(error?.message, 300) || 'Owner action failed' }, 400)
  }
}
