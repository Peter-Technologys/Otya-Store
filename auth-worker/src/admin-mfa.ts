import { generateOtp, verifyJwt } from './crypto'
import { sendResendEmail } from './resend'
import { assertSchemaReady, getUserById, type D1Database } from './db'

interface KVNamespaceLike {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

export interface AdminMfaEnv {
  AUTH_DB: D1Database
  AUTH_KV: KVNamespaceLike
  AUTH_JWT_SECRET: string
  RESEND_API_KEY?: string
  ADMIN_EMAILS?: string
}

const OTP_TTL = 10 * 60
const OTP_WINDOW_TTL = 15 * 60
const OTP_MAX_SENDS = 5
const OTP_MAX_ATTEMPTS = 8
const TELEGRAM_WINDOW_TTL = 10 * 60
const COMPLETE_TTL = 5 * 60

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

function allowlist(env: AdminMfaEnv): Set<string> {
  return new Set((env.ADMIN_EMAILS ?? '').split(',').map(v => v.trim().toLowerCase()).filter(Boolean))
}

async function currentUser(request: Request, env: AdminMfaEnv) {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const payload = await verifyJwt(auth.slice(7), env.AUTH_JWT_SECRET)
  if (!payload?.sub) return null
  await assertSchemaReady(env.AUTH_DB)
  return getUserById(env.AUTH_DB, payload.sub)
}

async function bump(env: AdminMfaEnv, key: string, max: number, ttl: number): Promise<boolean> {
  const raw = await env.AUTH_KV.get(key)
  const count = raw ? Number.parseInt(raw, 10) : 0
  if (count >= max) return false
  await env.AUTH_KV.put(key, String(count + 1), { expirationTtl: ttl })
  return true
}

function randomToken(bytes = 24): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes))
  let binary = ''
  for (const byte of data) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function otpDigest(userId: string, otp: string): Promise<string> {
  const normalized = otp.trim().toUpperCase()
  const data = new TextEncoder().encode(`otya-admin-mfa:${userId}:${normalized}`)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return toHex(new Uint8Array(digest))
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

async function requireAllowedAdmin(request: Request, env: AdminMfaEnv) {
  const user = await currentUser(request, env)
  if (!user?.email || !allowlist(env).has(user.email!.toLowerCase())) return null
  return user
}

export async function consumeAdminMfaCompletion(request: Request, env: AdminMfaEnv): Promise<{ ok: boolean; email?: string }> {
  const user = await requireAllowedAdmin(request, env)
  if (!user) return { ok: false }
  const marker = await env.AUTH_KV.get(`admin_mfa_complete:${user.id}`)
  if (!marker) return { ok: false }
  await env.AUTH_KV.delete(`admin_mfa_complete:${user.id}`)
  return { ok: true, email: user.email!.toLowerCase() }
}

export async function markAdminTelegramComplete(env: AdminMfaEnv, userId: string): Promise<void> {
  const pending = await env.AUTH_KV.get(`admin_mfa_telegram:${userId}`)
  if (!pending) throw new Error('Admin email verification expired')
  await env.AUTH_KV.delete(`admin_mfa_telegram:${userId}`)
  await env.AUTH_KV.put(`admin_mfa_complete:${userId}`, randomToken(), { expirationTtl: COMPLETE_TTL })
}

export async function adminTelegramPending(env: AdminMfaEnv, userId: string): Promise<boolean> {
  return Boolean(await env.AUTH_KV.get(`admin_mfa_telegram:${userId}`))
}

export async function handleAdminMfa(request: Request, env: AdminMfaEnv): Promise<Response | null> {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/auth/admin/')) return null
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const user = await requireAllowedAdmin(request, env)
  if (!user) return json({ error: 'Additional verification is required.' }, 403)

  if (url.pathname === '/auth/admin/start') {
    if (!env.RESEND_API_KEY) return json({ error: 'Admin verification email is unavailable.' }, 503)
    if (!(await bump(env, `admin_mfa_send:${user.id}`, OTP_MAX_SENDS, OTP_WINDOW_TTL))) {
      return json({ error: 'Too many verification requests. Try again later.' }, 429)
    }

    const otp = generateOtp()
    await env.AUTH_KV.put(`admin_mfa_otp:${user.id}`, await otpDigest(user.id, otp), { expirationTtl: OTP_TTL })
    await sendResendEmail(env.RESEND_API_KEY, {
      from: 'OTYA <noreply@petersmartlink.com>',
      to: [user.email!],
      subject: 'Your Otya Admin verification code',
      text: [
        'A request was made to open Otya Admin.',
        '',
        `Verification code: ${otp}`,
        '',
        'This code expires in 10 minutes. Telegram verification is also required before admin access is granted.',
        '',
        'If you did not request this, do not share the code and review your Otya account security.',
      ].join('\n'),
    })
    return json({ ok: true, next: 'otp' })
  }

  if (url.pathname === '/auth/admin/verify-otp') {
    if (!(await bump(env, `admin_mfa_attempt:${user.id}`, OTP_MAX_ATTEMPTS, OTP_WINDOW_TTL))) {
      return json({ error: 'Too many verification attempts. Request a new code later.' }, 429)
    }
    const body = await request.json().catch(() => ({})) as { otp?: string }
    const supplied = String(body.otp ?? '').trim().toUpperCase()
    if (!/^[A-Z][0-9]{4}$/.test(supplied)) return json({ error: 'Invalid or expired verification code.' }, 401)

    const storedDigest = await env.AUTH_KV.get(`admin_mfa_otp:${user.id}`)
    const suppliedDigest = await otpDigest(user.id, supplied)
    if (!storedDigest || !timingSafeEqual(suppliedDigest, storedDigest)) {
      return json({ error: 'Invalid or expired verification code.' }, 401)
    }

    await env.AUTH_KV.delete(`admin_mfa_otp:${user.id}`)
    await env.AUTH_KV.delete(`admin_mfa_attempt:${user.id}`)
    await env.AUTH_KV.put(`admin_mfa_telegram:${user.id}`, randomToken(), { expirationTtl: TELEGRAM_WINDOW_TTL })
    return json({ ok: true, next: 'telegram' })
  }

  if (url.pathname === '/auth/admin/consume') {
    const marker = await env.AUTH_KV.get(`admin_mfa_complete:${user.id}`)
    if (!marker) return json({ error: 'Complete Telegram verification first.' }, 401)
    await env.AUTH_KV.delete(`admin_mfa_complete:${user.id}`)
    return json({ ok: true, email: user.email!.toLowerCase() })
  }

  return json({ error: 'Not found' }, 404)
}
