import { generateOtp, verifyJwt } from './crypto'
import { getUserById, type D1Database } from './db'
import { sendResendEmail } from './resend'

interface KVLike {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

export interface ProductionEmailEnv {
  AUTH_DB: D1Database
  AUTH_KV: KVLike
  AUTH_JWT_SECRET: string
  RESEND_API_KEY?: string
}

const VERIFY_TTL = 10 * 60
const LAST_LOGIN_IP_TTL = 90 * 24 * 60 * 60

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function verificationDigest(env: ProductionEmailEnv, userId: string, code: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(env.AUTH_JWT_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    new TextEncoder().encode(`otya-otp:verify-email:${userId}:${code.trim().toUpperCase()}`),
  )
  return `hmac-sha256:${toHex(new Uint8Array(signature))}`
}

function userFromResponse(response: Response): Promise<{ id?: string; email?: string | null; name?: string | null } | null> {
  return response.clone().json()
    .then(data => {
      if (!data || typeof data !== 'object' || Array.isArray(data)) return null
      const user = (data as { user?: unknown }).user
      return user && typeof user === 'object' && !Array.isArray(user)
        ? user as { id?: string; email?: string | null; name?: string | null }
        : null
    })
    .catch(() => null)
}

/**
 * Registration sends exactly one transactional message in the critical path:
 * the code the user must enter before continuing. The welcome message is sent
 * only after successful email verification, avoiding two back-to-back signup
 * emails and making the account journey explicit.
 */
export async function deliverRegistrationVerification(response: Response, env: ProductionEmailEnv): Promise<void> {
  if (!response.ok) return
  const user = await userFromResponse(response)
  const userId = String(user?.id ?? '').trim()
  const email = String(user?.email ?? '').trim().toLowerCase()
  if (!userId || !email) return
  if (!env.RESEND_API_KEY) throw new Error('Verification email is unavailable')

  const name = String(user?.name ?? '').trim() || 'there'
  const code = generateOtp()
  const key = `verify_otp:${userId}`
  await env.AUTH_KV.put(key, await verificationDigest(env, userId, code), { expirationTtl: VERIFY_TTL })

  try {
    await sendResendEmail(env.RESEND_API_KEY, {
      from: 'Otya <noreply@petersmartlink.com>',
      to: [email],
      subject: 'Your Otya verification code',
      text: [
        `Hi ${name},`,
        '',
        'Use this code to verify your Otya email address:',
        '',
        code,
        '',
        'This code expires in 10 minutes.',
        'It contains 1 uppercase letter followed by 4 digits.',
        '',
        'If you did not create this Otya account, you can ignore this message.',
        '— The Otya Team',
      ].join('\n'),
    })
  } catch (error) {
    await env.AUTH_KV.delete(key)
    console.error('[auth/email] Registration verification delivery failed:', (error as Error)?.message)
    throw error
  }
}

export async function deliverVerifiedWelcome(request: Request, env: ProductionEmailEnv): Promise<void> {
  if (!env.RESEND_API_KEY) return
  const authorization = request.headers.get('Authorization')
  if (!authorization?.startsWith('Bearer ')) return
  const payload = await verifyJwt(authorization.slice(7), env.AUTH_JWT_SECRET)
  if (!payload?.sub) return

  const user = await getUserById(env.AUTH_DB, payload.sub)
  const email = String(user?.email ?? '').trim().toLowerCase()
  if (!user || !email) return
  const name = String(user.name ?? '').trim() || 'there'

  await sendResendEmail(env.RESEND_API_KEY, {
    from: 'Otya <noreply@petersmartlink.com>',
    to: [email],
    subject: 'Welcome to Otya',
    text: [
      `Hi ${name},`,
      '',
      'Your email is verified and your Otya account is ready.',
      '',
      'Local music and video remain usable without signing in. Your Otya account adds the connected services, security and recovery features you choose to use.',
      '',
      '— The Otya Team',
    ].join('\n'),
  })
}

function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? 'unknown'
}

export async function deliverNewDeviceAlert(request: Request, response: Response, env: ProductionEmailEnv): Promise<void> {
  if (!response.ok) return
  const user = await userFromResponse(response)
  const userId = String(user?.id ?? '').trim()
  const email = String(user?.email ?? '').trim().toLowerCase()
  if (!userId || !email) return

  const ip = clientIp(request)
  // Keep this state separate until the obsolete env.EMAIL implementation is
  // removed. The legacy helper updates last_login_ip even when it cannot send,
  // which would otherwise suppress the first real Resend alert.
  const key = `resend_last_login_ip:${userId}`
  let previous: string | null = null
  try {
    previous = await env.AUTH_KV.get(key)
    await env.AUTH_KV.put(key, ip, { expirationTtl: LAST_LOGIN_IP_TTL })
  } catch (error) {
    console.error('[auth/email] New-device state update failed:', (error as Error)?.message)
    return
  }
  if (!previous || previous === ip) return

  try {
    await sendResendEmail(env.RESEND_API_KEY, {
      from: 'Otya Security <noreply@petersmartlink.com>',
      to: [email],
      subject: 'New login to your Otya account',
      text: [
        'We detected a login to your Otya account from a different network.',
        '',
        `IP address : ${ip}`,
        `Time       : ${new Date().toUTCString()}`,
        '',
        'If this was you, no action is needed.',
        'If it was not you, review your Otya account security and active sessions.',
        '',
        '— The Otya Security Team',
      ].join('\n'),
    })
  } catch (error) {
    console.error('[auth/email] New-device alert delivery failed:', (error as Error)?.message)
  }
}
