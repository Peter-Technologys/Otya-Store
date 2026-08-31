import { handleConsoleAdmin } from './console-tools.mjs'
import { handleOwnerActions, latestPendingOwnerAction } from './owner-actions.mjs'

const clean = (value, max = 5000) => String(value ?? '')
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

const aiText = (result) => typeof result?.response === 'string'
  ? result.response
  : (typeof result?.choices?.[0]?.message?.content === 'string'
      ? result.choices[0].message.content
      : '')

const parse = (value) => {
  try {
    const match = String(value || '').match(/\{[\s\S]*\}/)
    return match ? JSON.parse(match[0]) : null
  } catch {
    return null
  }
}

function internalAuthorized(request, env) {
  return Boolean(env.INTERNAL_SECRET)
    && (request.headers.get('X-OTYA-Internal-Secret') || '') === env.INTERNAL_SECRET
}

function isChatPath(url, method) {
  return method === 'POST'
    && (url.pathname.endsWith('/chat') || url.pathname.endsWith('/command'))
}

function approvalIntent(message) {
  return /^(approve|approve it|yes approve|yes, approve|go ahead|send it|post it|publish it|do it)$/i
    .test(message.trim())
}

function cancellationIntent(message) {
  return /^(cancel|cancel it|don't send it|do not send it|don't post it|do not post it)$/i
    .test(message.trim())
}

function mayContainWriteIntent(message) {
  return /\b(telegram|channel|email|send|post|publish|announce|announcement)\b/i.test(message)
}

async function actionRequest(request, path, body) {
  const headers = new Headers({ 'Content-Type': 'application/json' })
  const secret = request.headers.get('X-OTYA-Internal-Secret')
  if (secret) headers.set('X-OTYA-Internal-Secret', secret)
  return new Request(`https://otya.internal${path}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })
}

async function routeWriteIntent(env, message) {
  if (!env.AI?.run || !mayContainWriteIntent(message)) return null
  const system = `You route explicit owner write requests for OTYA. Return JSON only.
Supported actions:
- telegram_post: only when the owner clearly asks to post/publish/send an announcement to the official OTYA Telegram channel.
- owner_email: only when the owner clearly asks OTYA to email the owner themself. Never use this for emailing another person.
- none: questions, drafts, plans, suggestions, reading email, asking what could be posted, or any ambiguous request.
For telegram_post return {"action":"telegram_post","payload":{"text":"exact professional friendly message to post"}}.
For owner_email return {"action":"owner_email","payload":{"subject":"short subject","text":"exact email body"}}.
Otherwise return {"action":"none"}.
Never claim anything has been sent. Keep the owner's meaning; do not invent release dates, outage facts or product claims.`
  try {
    const result = await env.AI.run(env.OTYA_AI_MODEL || '@cf/meta/llama-3.1-8b-instruct-fast', {
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: clean(message, 3500) },
      ],
    })
    const routed = parse(aiText(result))
    return routed && ['telegram_post', 'owner_email', 'none'].includes(routed.action)
      ? routed
      : null
  } catch {
    return null
  }
}

async function approveLatest(request, env) {
  const pending = await latestPendingOwnerAction(env)
  if (!pending) {
    return json({
      ok: true,
      answer: 'There is no pending owner action to approve. Tell me what you want to send or post first.',
      action: null,
    })
  }

  const response = await handleOwnerActions(
    await actionRequest(request, '/api/admin/ai/actions/approve', {
      id: pending.id,
      approval_token: pending.approval_token,
    }),
    env,
  )
  const data = await response.json().catch(() => ({}))
  if (!response.ok) return json(data, response.status)
  return json({
    ok: true,
    answer: `Done. ${data.action?.summary || 'The approved owner action'} was executed and verified by the provider response.`,
    action: data.action,
  })
}

async function cancelLatest(request, env) {
  const pending = await latestPendingOwnerAction(env)
  if (!pending) {
    return json({ ok: true, answer: 'There is no pending owner action to cancel.', action: null })
  }
  const response = await handleOwnerActions(
    await actionRequest(request, '/api/admin/ai/actions/cancel', { id: pending.id }),
    env,
  )
  const data = await response.json().catch(() => ({}))
  return json({
    ok: response.ok,
    answer: response.ok
      ? `Cancelled. ${pending.summary} will not be executed.`
      : 'I could not cancel that pending action.',
    action: data.action || null,
  }, response.status)
}

async function prepareFromChat(request, env, routed) {
  const response = await handleOwnerActions(
    await actionRequest(request, '/api/admin/ai/actions/prepare', {
      type: routed.action,
      payload: routed.payload || {},
    }),
    env,
  )
  const data = await response.json().catch(() => ({}))
  if (!response.ok) return json(data, response.status)
  const action = data.action
  return json({
    ok: true,
    answer: `I prepared this action but have not executed it yet. ${action.summary}. Review the exact content below, then say “approve” or “go ahead” to execute it.`,
    approval_required: true,
    action,
  })
}

export async function handleOwnerConsole(request, env) {
  const url = new URL(request.url)
  if (!isChatPath(url, request.method)) return handleConsoleAdmin(request, env)
  if (!internalAuthorized(request, env)) return json({ error: 'Unauthorized' }, 401)

  const body = await request.json().catch(() => ({}))
  const message = clean(body?.message, 4000)
  if (!message) return json({ error: 'message is required' }, 400)

  if (approvalIntent(message)) return approveLatest(request, env)
  if (cancellationIntent(message)) return cancelLatest(request, env)

  const routed = await routeWriteIntent(env, message)
  if (routed?.action && routed.action !== 'none') {
    return prepareFromChat(request, env, routed)
  }

  // The body was consumed for write-intent routing, so rebuild the request
  // before handing ordinary conversation back to the established Console AI.
  const forwarded = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: JSON.stringify(body),
  })
  return handleConsoleAdmin(forwarded, env)
}
