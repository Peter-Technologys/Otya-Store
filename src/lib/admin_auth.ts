const COOKIE_NAME = 'otya_admin_session'
const SESSION_TTL_SECONDS = 12 * 60 * 60

type AdminEnv = Record<string, unknown>

function text(value: unknown): string {
  return typeof value === 'string' ? value.trim() : ''
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function b64url(value: Uint8Array): string {
  let binary = ''
  for (const byte of value) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function fromB64url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}

async function sign(value: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value))
  return b64url(new Uint8Array(mac))
}

export function adminConfigured(env: AdminEnv): boolean {
  return Boolean(text(env.ADMIN_EMAIL) && text(env.ADMIN_PASSWORD) && text(env.ADMIN_SESSION_SECRET))
}

export function validAdminCredentials(env: AdminEnv, email: string, password: string): boolean {
  const expectedEmail = text(env.ADMIN_EMAIL).toLowerCase()
  const expectedPassword = text(env.ADMIN_PASSWORD)
  return Boolean(expectedEmail && expectedPassword)
    && timingSafeEqual(email.trim().toLowerCase(), expectedEmail)
    && timingSafeEqual(password, expectedPassword)
}

export async function createAdminSession(env: AdminEnv, email: string): Promise<string> {
  const secret = text(env.ADMIN_SESSION_SECRET)
  if (!secret) throw new Error('ADMIN_SESSION_SECRET is not configured')
  const payload = JSON.stringify({
    email: email.trim().toLowerCase(),
    exp: Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS,
  })
  const encoded = b64url(new TextEncoder().encode(payload))
  return `${encoded}.${await sign(encoded, secret)}`
}

export async function verifyAdminSession(request: Request, env: AdminEnv): Promise<boolean> {
  const secret = text(env.ADMIN_SESSION_SECRET)
  const expectedEmail = text(env.ADMIN_EMAIL).toLowerCase()
  if (!secret || !expectedEmail) return false

  const cookie = request.headers.get('cookie') ?? ''
  const raw = cookie.split(';').map(v => v.trim()).find(v => v.startsWith(`${COOKIE_NAME}=`))?.slice(COOKIE_NAME.length + 1)
  if (!raw) return false
  const [encoded, signature] = raw.split('.')
  if (!encoded || !signature) return false
  const expectedSignature = await sign(encoded, secret)
  if (!timingSafeEqual(signature, expectedSignature)) return false

  try {
    const payload = JSON.parse(new TextDecoder().decode(fromB64url(encoded))) as { email?: string; exp?: number }
    return payload.email === expectedEmail
      && typeof payload.exp === 'number'
      && payload.exp > Math.floor(Date.now() / 1000)
  } catch {
    return false
  }
}

export function adminSessionCookie(session: string): string {
  return `${COOKIE_NAME}=${session}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`
}

export function clearAdminSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
}
