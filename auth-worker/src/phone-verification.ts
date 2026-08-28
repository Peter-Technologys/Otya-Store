import { verifyJwt } from './crypto'
import { ensureSchema, type D1Database } from './db'

interface KVNamespaceLike {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

export interface PhoneVerificationEnv {
  AUTH_DB: D1Database
  AUTH_KV: KVNamespaceLike
  AUTH_JWT_SECRET: string
  TELEGRAM_GATEWAY_TOKEN?: string
}

const API = 'https://gatewayapi.telegram.org'
const PENDING_TTL = 10 * 60
const RATE_TTL = 60 * 60
const MAX_SENDS_PER_HOUR = 3

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

async function userIdFromRequest(request: Request, env: PhoneVerificationEnv): Promise<string | null> {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return (await verifyJwt(auth.slice(7), env.AUTH_JWT_SECRET))?.sub ?? null
}

function normalizePhone(raw: unknown): string | null {
  if (typeof raw !== 'string') return null
  const compact = raw.trim().replace(/[\s()-]/g, '')
  const phone = compact.startsWith('+') ? compact : `+${compact}`
  return /^\+[1-9]\d{7,14}$/.test(phone) ? phone : null
}

async function gateway(env: PhoneVerificationEnv, method: string, body: Record<string, unknown>): Promise<Record<string, any>> {
  if (!env.TELEGRAM_GATEWAY_TOKEN) throw new Error('Telegram Gateway is not configured')
  const response = await fetch(`${API}/${method}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.TELEGRAM_GATEWAY_TOKEN}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(body),
  })
  const data = await response.json().catch(() => ({})) as Record<string, any>
  if (!response.ok || data.ok !== true || !data.result) {
    throw new Error(String(data.error || `Telegram Gateway HTTP ${response.status}`))
  }
  return data.result as Record<string, any>
}

async function takeSendSlot(env: PhoneVerificationEnv, userId: string): Promise<boolean> {
  const key = `phone_verify_rate:${userId}`
  const count = Number(await env.AUTH_KV.get(key) || 0)
  if (count >= MAX_SENDS_PER_HOUR) return false
  await env.AUTH_KV.put(key, String(count + 1), { expirationTtl: RATE_TTL })
  return true
}

export async function handlePhoneVerification(request: Request, env: PhoneVerificationEnv): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/auth/phone/request' && url.pathname !== '/auth/phone/verify') return null
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const userId = await userIdFromRequest(request, env)
  if (!userId) return json({ error: 'Sign in required' }, 401)
  await ensureSchema(env.AUTH_DB)

  if (url.pathname === '/auth/phone/request') {
    if (!env.TELEGRAM_GATEWAY_TOKEN) {
      return json({ error: 'Telegram code verification is not configured. Try Verify with Telegram instead.' }, 503)
    }
    if (!(await takeSendSlot(env, userId))) {
      return json({ error: 'Too many verification requests. Try again later.' }, 429)
    }
    const body = await request.json().catch(() => null) as Record<string, unknown> | null
    const phone = normalizePhone(body?.phone_number)
    if (!phone) return json({ error: 'Use a valid international phone number, for example +2567…' }, 400)

    const owner = await env.AUTH_DB.prepare('SELECT id FROM users WHERE phone_number = ? AND id <> ? LIMIT 1').bind(phone, userId).first<{ id: string }>()
    if (owner) return json({ error: 'This phone number is already verified on another OTYA account' }, 409)

    try {
      const result = await gateway(env, 'sendVerificationMessage', {
        phone_number: phone,
        code_length: 6,
        ttl: PENDING_TTL,
        payload: 'otya-account-phone',
      })
      const requestId = String(result.request_id || '')
      if (!requestId) throw new Error('Telegram did not return a request ID')
      await env.AUTH_KV.put(`phone_verify_pending:${userId}`, JSON.stringify({ requestId, phone }), { expirationTtl: PENDING_TTL })
      return json({ ok: true, method: 'telegram_gateway', message: 'Verification code sent in Telegram.' })
    } catch (error) {
      console.error('[phone/request]', (error as Error)?.message)
      return json({ error: 'Could not send a Telegram verification code. The number may not be reachable through Telegram.' }, 502)
    }
  }

  const body = await request.json().catch(() => null) as Record<string, unknown> | null
  const code = typeof body?.code === 'string' ? body.code.trim() : ''
  if (!/^\d{4,8}$/.test(code)) return json({ error: 'Enter the numeric verification code' }, 400)
  const pendingRaw = await env.AUTH_KV.get(`phone_verify_pending:${userId}`)
  if (!pendingRaw) return json({ error: 'No active phone verification request' }, 400)

  try {
    const pending = JSON.parse(pendingRaw) as { requestId: string; phone: string }
    const result = await gateway(env, 'checkVerificationStatus', { request_id: pending.requestId, code })
    const status = result.verification_status?.status
    if (status !== 'code_valid') {
      const expired = status === 'expired' || status === 'code_max_attempts_exceeded'
      if (expired) await env.AUTH_KV.delete(`phone_verify_pending:${userId}`)
      return json({ error: expired ? 'Verification expired. Request a new code.' : 'Incorrect verification code' }, 401)
    }

    const owner = await env.AUTH_DB.prepare('SELECT id FROM users WHERE phone_number = ? AND id <> ? LIMIT 1').bind(pending.phone, userId).first<{ id: string }>()
    if (owner) return json({ error: 'This phone number is already verified on another OTYA account' }, 409)

    await env.AUTH_DB.prepare(`
      UPDATE users SET phone_number = ?, phone_verified_at = datetime('now'),
        phone_verification_method = 'telegram_gateway', updated_at = datetime('now')
      WHERE id = ?
    `).bind(pending.phone, userId).run()
    await env.AUTH_KV.delete(`phone_verify_pending:${userId}`)
    return json({ ok: true, phone_number: pending.phone, verified: true, method: 'telegram_gateway' })
  } catch (error) {
    console.error('[phone/verify]', (error as Error)?.message)
    return json({ error: 'Phone verification failed' }, 502)
  }
}
