import { verifyJwt } from './crypto'
import { ensureSchema, type D1Database } from './db'

interface KVNamespaceLike {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

export interface TelegramLoginEnv {
  AUTH_DB: D1Database
  AUTH_KV: KVNamespaceLike
  AUTH_JWT_SECRET: string
  TELEGRAM_LOGIN_CLIENT_ID?: string
  TELEGRAM_LOGIN_CLIENT_SECRET?: string
  TELEGRAM_LOGIN_REDIRECT_URI?: string
}

type TelegramClaims = {
  iss?: string
  aud?: string | string[]
  sub?: string
  exp?: number
  nonce?: string
  name?: string
  preferred_username?: string
  phone_number?: string
  phone_number_verified?: boolean
}

const OIDC_AUTH = 'https://oauth.telegram.org/auth'
const OIDC_TOKEN = 'https://oauth.telegram.org/token'
const OIDC_JWKS = 'https://oauth.telegram.org/.well-known/jwks.json'
const DEFAULT_REDIRECT = 'https://petersmartlink.com/auth/telegram/callback'
const STATE_TTL = 10 * 60

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

function randomUrlSafe(bytes = 32): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes))
  let binary = ''
  for (const byte of data) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

function decodeBase64Url(value: string): Uint8Array {
  const b64 = value.replace(/-/g, '+').replace(/_/g, '/')
  const padded = b64 + '='.repeat((4 - b64.length % 4) % 4)
  const binary = atob(padded)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  const bytes = new Uint8Array(digest)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function requireUser(request: Request, env: TelegramLoginEnv): Promise<string | null> {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const payload = await verifyJwt(auth.slice(7), env.AUTH_JWT_SECRET)
  return payload?.sub ?? null
}

function normalizePhone(raw: string | undefined): string | null {
  if (!raw) return null
  const compact = raw.replace(/[\s()-]/g, '')
  const normalized = compact.startsWith('+') ? compact : `+${compact}`
  return /^\+[1-9]\d{7,14}$/.test(normalized) ? normalized : null
}

async function validateIdToken(idToken: string, clientId: string, nonce: string): Promise<TelegramClaims> {
  const parts = idToken.split('.')
  if (parts.length !== 3) throw new Error('Malformed Telegram ID token')
  const header = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[0]))) as { alg?: string; kid?: string }
  const claims = JSON.parse(new TextDecoder().decode(decodeBase64Url(parts[1]))) as TelegramClaims
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Unsupported Telegram token algorithm')

  const jwksResponse = await fetch(OIDC_JWKS, { headers: { Accept: 'application/json' } })
  if (!jwksResponse.ok) throw new Error('Telegram keys unavailable')
  const jwks = await jwksResponse.json() as { keys?: JsonWebKey[] }
  const jwk = (jwks.keys ?? []).find(key => key.kid === header.kid)
  if (!jwk) throw new Error('Telegram signing key not found')

  const key = await crypto.subtle.importKey(
    'jwk',
    jwk,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['verify'],
  )
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    decodeBase64Url(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  )
  if (!valid) throw new Error('Invalid Telegram token signature')

  const now = Math.floor(Date.now() / 1000)
  const audience = Array.isArray(claims.aud) ? claims.aud : [claims.aud]
  if (claims.iss !== 'https://oauth.telegram.org') throw new Error('Invalid Telegram token issuer')
  if (!audience.includes(clientId)) throw new Error('Invalid Telegram token audience')
  if (!claims.exp || claims.exp <= now) throw new Error('Expired Telegram token')
  if (!claims.sub) throw new Error('Telegram subject missing')
  if (claims.nonce !== nonce) throw new Error('Telegram nonce mismatch')
  return claims
}

export async function handleTelegramLogin(request: Request, env: TelegramLoginEnv): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/auth/telegram/start' && url.pathname !== '/auth/telegram/callback') return null

  if (!env.TELEGRAM_LOGIN_CLIENT_ID || !env.TELEGRAM_LOGIN_CLIENT_SECRET) {
    return json({ error: 'Telegram account linking is not configured yet' }, 503)
  }

  await ensureSchema(env.AUTH_DB)
  const redirectUri = env.TELEGRAM_LOGIN_REDIRECT_URI || DEFAULT_REDIRECT

  if (url.pathname === '/auth/telegram/start') {
    if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
    const userId = await requireUser(request, env)
    if (!userId) return json({ error: 'Sign in to OTYA first' }, 401)

    const state = randomUrlSafe(24)
    const verifier = randomUrlSafe(48)
    const nonce = randomUrlSafe(24)
    const challenge = await sha256Base64Url(verifier)
    await env.AUTH_KV.put(`telegram_oidc:${state}`, JSON.stringify({ userId, verifier, nonce }), { expirationTtl: STATE_TTL })

    const authUrl = new URL(OIDC_AUTH)
    authUrl.searchParams.set('client_id', env.TELEGRAM_LOGIN_CLIENT_ID)
    authUrl.searchParams.set('redirect_uri', redirectUri)
    authUrl.searchParams.set('response_type', 'code')
    authUrl.searchParams.set('scope', 'openid profile phone')
    authUrl.searchParams.set('state', state)
    authUrl.searchParams.set('nonce', nonce)
    authUrl.searchParams.set('code_challenge', challenge)
    authUrl.searchParams.set('code_challenge_method', 'S256')
    return json({ ok: true, authorization_url: authUrl.toString() })
  }

  if (request.method !== 'GET') return json({ error: 'Method not allowed' }, 405)
  const state = url.searchParams.get('state') || ''
  const code = url.searchParams.get('code') || ''
  if (!state || !code) return Response.redirect('https://petersmartlink.com/my-account?telegram=cancelled', 302)

  const stored = await env.AUTH_KV.get(`telegram_oidc:${state}`)
  await env.AUTH_KV.delete(`telegram_oidc:${state}`)
  if (!stored) return Response.redirect('https://petersmartlink.com/my-account?telegram=expired', 302)

  try {
    const { userId, verifier, nonce } = JSON.parse(stored) as { userId: string; verifier: string; nonce: string }
    const basic = btoa(`${env.TELEGRAM_LOGIN_CLIENT_ID}:${env.TELEGRAM_LOGIN_CLIENT_SECRET}`)
    const tokenResponse = await fetch(OIDC_TOKEN, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: env.TELEGRAM_LOGIN_CLIENT_ID,
        code_verifier: verifier,
      }).toString(),
    })
    const tokenData = await tokenResponse.json().catch(() => ({})) as { id_token?: string; error?: string }
    if (!tokenResponse.ok || !tokenData.id_token) throw new Error(tokenData.error || 'Telegram token exchange failed')

    const claims = await validateIdToken(tokenData.id_token, env.TELEGRAM_LOGIN_CLIENT_ID, nonce)
    const existingIdentity = await env.AUTH_DB.prepare(
      'SELECT user_id FROM linked_identities WHERE provider = ? AND provider_subject = ? LIMIT 1',
    ).bind('telegram', claims.sub).first<{ user_id: string }>()
    if (existingIdentity && existingIdentity.user_id !== userId) throw new Error('This Telegram account is already linked to another OTYA account')

    await env.AUTH_DB.prepare(`
      INSERT INTO linked_identities (user_id, provider, provider_subject, provider_username)
      VALUES (?, 'telegram', ?, ?)
      ON CONFLICT(user_id, provider) DO UPDATE SET
        provider_subject = excluded.provider_subject,
        provider_username = excluded.provider_username,
        last_used_at = datetime('now')
    `).bind(userId, claims.sub, claims.preferred_username ?? null).run()

    const phone = claims.phone_number_verified === true ? normalizePhone(claims.phone_number) : null
    if (phone) {
      const owner = await env.AUTH_DB.prepare('SELECT id FROM users WHERE phone_number = ? AND id <> ? LIMIT 1').bind(phone, userId).first<{ id: string }>()
      if (owner) throw new Error('This phone number is already verified on another OTYA account')
      await env.AUTH_DB.prepare(`
        UPDATE users SET
          phone_number = ?,
          phone_verified_at = datetime('now'),
          phone_verification_method = 'telegram_oidc',
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(phone, userId).run()
    }

    return Response.redirect(`https://petersmartlink.com/my-account?telegram=${phone ? 'verified' : 'linked'}`, 302)
  } catch (error) {
    console.error('[telegram-login]', (error as Error)?.message)
    return Response.redirect('https://petersmartlink.com/my-account?telegram=error', 302)
  }
}
