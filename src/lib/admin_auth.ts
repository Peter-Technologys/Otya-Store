const COOKIE_NAME = 'otya_admin_session'
const ACCOUNT_ACCESS_COOKIE = '__Host-otya_access'
// Legacy direct-admin sessions remain supported during migration. The preferred
// browser path is now one Otya account whose email is granted the admin role.
const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60

type AuthBinding = { fetch(request: Request): Promise<Response> }
type AdminEnv = Record<string, unknown> & { AUTH?: AuthBinding }

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

function cookieValue(request: Request, name: string): string {
  const cookie = request.headers.get('cookie') ?? ''
  return cookie.split(';').map(v => v.trim()).find(v => v.startsWith(`${name}=`))?.slice(name.length + 1) ?? ''
}

function adminEmails(env: AdminEnv): Set<string> {
  const values = [text(env.ADMIN_EMAIL), ...text(env.ADMIN_EMAILS).split(',')]
  return new Set(values.map(v => v.trim().toLowerCase()).filter(Boolean))
}

export function adminConfigured(env: AdminEnv): boolean {
  // An admin identity can be authorized by the normal Otya account session even
  // when the legacy direct-admin password is not configured.
  return adminEmails(env).size > 0 && Boolean(env.AUTH?.fetch || (text(env.ADMIN_PASSWORD) && text(env.ADMIN_SESSION_SECRET)))
}

export function adminEmail(env: AdminEnv): string {
  return text(env.ADMIN_EMAIL).toLowerCase()
}

export function validAdminCredentials(env: AdminEnv, email: string, password: string): boolean {
  const expectedEmail = adminEmail(env)
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

async function verifyLegacyAdminCookie(request: Request, env: AdminEnv): Promise<boolean> {
  const secret = text(env.ADMIN_SESSION_SECRET)
  const expectedEmail = adminEmail(env)
  if (!secret || !expectedEmail) return false

  const raw = cookieValue(request, COOKIE_NAME)
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

async function verifyOtyaAccountAdmin(request: Request, env: AdminEnv): Promise<boolean> {
  const accessToken = cookieValue(request, ACCOUNT_ACCESS_COOKIE)
  const allowed = adminEmails(env)
  if (!accessToken || !allowed.size || !env.AUTH?.fetch) return false
  try {
    const upstream = await env.AUTH.fetch(new Request('https://auth/auth/account', {
      method: 'GET',
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    }))
    if (!upstream.ok) return false
    const data = await upstream.json().catch(() => ({})) as { email?: string; user?: { email?: string } }
    const email = String(data.user?.email ?? data.email ?? '').trim().toLowerCase()
    return Boolean(email) && allowed.has(email)
  } catch {
    return false
  }
}

/**
 * Canonical browser authorization for Otya Admin.
 *
 * Preferred path: one normal Otya account session plus an admin email/role
 * allowlist. Legacy signed admin cookies remain valid during migration.
 */
export async function verifyAdminSession(request: Request, env: AdminEnv): Promise<boolean> {
  if (await verifyOtyaAccountAdmin(request, env)) return true
  return verifyLegacyAdminCookie(request, env)
}

function legacyAdminTokenAuthorized(request: Request, env: AdminEnv): boolean {
  const expected = text(env.ADMIN_TOKEN)
  if (!expected) return false
  const actual = request.headers.get('Authorization')?.replace(/^Bearer\s+/i, '').trim() ?? ''
  return Boolean(actual) && timingSafeEqual(actual, expected)
}

export async function isAdminAuthorized(request: Request, env: AdminEnv): Promise<boolean> {
  if (await verifyAdminSession(request, env)) return true
  return legacyAdminTokenAuthorized(request, env)
}

export function adminSessionCookie(session: string): string {
  return `${COOKIE_NAME}=${session}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}`
}

export function clearAdminSessionCookie(): string {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`
}
