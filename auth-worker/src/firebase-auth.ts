import { generateRefreshToken, generateUuid, signJwt } from './crypto'
import { assertSchemaReady, getUserByEmail, insertUser, touchUserProduct, type D1Database } from './db'
import { PRIVACY_VERSION, recordRegistrationConsent, TERMS_VERSION } from './consent'
import { verifySecondFactor } from './two-factor'

interface KVNamespaceLike {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string }[]
    list_complete: boolean
    cursor?: string
  }>
}

export interface FirebaseAuthEnv {
  AUTH_DB: D1Database
  AUTH_KV: KVNamespaceLike
  AUTH_JWT_SECRET: string
  FIREBASE_API_KEY?: string
  ACCOUNT_ENCRYPTION_KEY?: string
  CORS_ORIGIN?: string
}

interface FirebaseAccount {
  localId?: string
  email?: string
  emailVerified?: boolean
  displayName?: string
  photoUrl?: string
  providerUserInfo?: Array<{
    providerId?: string
    rawId?: string
    email?: string
    displayName?: string
    photoUrl?: string
  }>
}

interface FirebaseLookupResponse {
  users?: FirebaseAccount[]
}

const ACCESS_TOKEN_TTL_SECS = 15 * 60
const REFRESH_TOKEN_TTL_SECS = 30 * 24 * 60 * 60
const RATE_LIMIT_TTL_SECS = 15 * 60
const RATE_LIMIT_MAX = 20
const PRIMARY_ORIGIN = 'https://petersmartlink.com'

function headers(env: FirebaseAuthEnv): Record<string, string> {
  return {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Access-Control-Allow-Origin': env.CORS_ORIGIN ?? PRIMARY_ORIGIN,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Vary': 'Origin',
  }
}

function json(env: FirebaseAuthEnv, data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), { status, headers: headers(env) })
}

function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? 'unknown'
}

async function checkRateLimit(request: Request, env: FirebaseAuthEnv): Promise<boolean> {
  const key = `firebase_auth_rate:${clientIp(request)}`
  const raw = await env.AUTH_KV.get(key)
  const count = raw ? Number.parseInt(raw, 10) : 0
  if (count >= RATE_LIMIT_MAX) return false
  await env.AUTH_KV.put(key, String(count + 1), { expirationTtl: RATE_LIMIT_TTL_SECS })
  return true
}

async function verifyFirebaseIdToken(
  idToken: string,
  env: FirebaseAuthEnv,
): Promise<FirebaseAccount | null> {
  if (!env.FIREBASE_API_KEY) return null

  const response = await fetch(
    `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${encodeURIComponent(env.FIREBASE_API_KEY)}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
      signal: AbortSignal.timeout(8000),
    },
  )
  if (!response.ok) return null
  const data = await response.json() as FirebaseLookupResponse
  const account = data.users?.[0]
  if (!account?.localId || !account.email) return null
  return account
}

async function issueRefreshToken(env: FirebaseAuthEnv, userId: string): Promise<string> {
  const token = generateRefreshToken()
  await Promise.all([
    env.AUTH_KV.put(`rt:${token}`, userId, { expirationTtl: REFRESH_TOKEN_TTL_SECS }),
    env.AUTH_KV.put(`rt_user:${userId}:${token}`, '1', { expirationTtl: REFRESH_TOKEN_TTL_SECS }),
  ])
  return token
}

async function linkFirebaseIdentity(
  env: FirebaseAuthEnv,
  userId: string,
  firebaseUid: string,
  email: string,
): Promise<boolean> {
  // Ownership is immutable: once a Firebase subject belongs to an OTYA user,
  // a concurrent/replayed request must never move that subject to another user.
  await env.AUTH_DB.prepare(`
    INSERT INTO linked_identities (
      user_id, provider, provider_subject, provider_email, linked_at, last_used_at
    ) VALUES (?, 'firebase', ?, ?, datetime('now'), datetime('now'))
    ON CONFLICT(provider, provider_subject) DO UPDATE SET
      provider_email = CASE
        WHEN linked_identities.user_id = excluded.user_id THEN excluded.provider_email
        ELSE linked_identities.provider_email
      END,
      last_used_at = CASE
        WHEN linked_identities.user_id = excluded.user_id THEN datetime('now')
        ELSE linked_identities.last_used_at
      END
  `).bind(userId, firebaseUid, email).run()

  const link = await env.AUTH_DB.prepare(
    "SELECT user_id FROM linked_identities WHERE provider = 'firebase' AND provider_subject = ? LIMIT 1",
  ).bind(firebaseUid).first<{ user_id?: string }>()
  return link?.user_id === userId
}

function legalAccepted(body: Record<string, unknown>): boolean {
  return body.terms_accepted === true
    && body.privacy_accepted === true
    && body.terms_version === TERMS_VERSION
    && body.privacy_version === PRIVACY_VERSION
}

export async function handleFirebaseLogin(
  request: Request,
  env: FirebaseAuthEnv,
): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/auth/firebase') return null

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: headers(env) })
  }
  if (request.method !== 'POST') return json(env, { error: 'Method not allowed' }, 405)
  if (!env.FIREBASE_API_KEY) {
    return json(env, { error: 'Firebase sign-in is not configured' }, 503)
  }
  if (!(await checkRateLimit(request, env))) {
    return json(env, { error: 'Too many sign-in attempts. Try again later.' }, 429)
  }

  let body: Record<string, unknown>
  try { body = await request.json() as Record<string, unknown> }
  catch { return json(env, { error: 'Invalid JSON body' }, 400) }

  const idToken = typeof body.id_token === 'string' ? body.id_token : ''
  if (!idToken) return json(env, { error: 'id_token is required' }, 400)

  let account: FirebaseAccount | null = null
  try { account = await verifyFirebaseIdToken(idToken, env) }
  catch (error) {
    console.error('[auth/firebase] Firebase verification unavailable:', (error as Error)?.message)
    return json(env, { error: 'Firebase verification service unavailable' }, 503)
  }
  if (!account?.localId || !account.email || account.emailVerified !== true) {
    return json(env, { error: 'Firebase account verification failed' }, 401)
  }

  await assertSchemaReady(env.AUTH_DB)
  const email = account.email.toLowerCase().trim()
  let user = await getUserByEmail(env.AUTH_DB, email)
  const isNewUser = !user

  if (isNewUser) {
    if (!legalAccepted(body)) {
      return json(env, {
        error: 'Accept the current Terms of Service and Privacy Policy to create your OTYA account.',
        code: 'LEGAL_ACCEPTANCE_REQUIRED',
        terms_version: TERMS_VERSION,
        privacy_version: PRIVACY_VERSION,
      }, 428)
    }

    const provider = account.providerUserInfo?.[0]
    await insertUser(env.AUTH_DB, {
      id: generateUuid(),
      email,
      password_hash: null,
      google_id: null,
      name: account.displayName ?? provider?.displayName ?? null,
      avatar_url: account.photoUrl ?? provider?.photoUrl ?? null,
    })
    user = await getUserByEmail(env.AUTH_DB, email)
    if (!user) return json(env, { error: 'Could not create OTYA account' }, 500)
    await env.AUTH_DB.prepare(
      "UPDATE users SET is_verified = 1, updated_at = datetime('now') WHERE id = ?",
    ).bind(user.id).run()
    await recordRegistrationConsent(env, user.id, body.marketing_consent === true)
  }

  if (!user) return json(env, { error: 'OTYA account not found' }, 404)

  const existingLink = await env.AUTH_DB.prepare(
    "SELECT user_id FROM linked_identities WHERE provider = 'firebase' AND provider_subject = ? LIMIT 1",
  ).bind(account.localId).first<{ user_id?: string }>()
  if (existingLink?.user_id && existingLink.user_id !== user.id) {
    return json(env, { error: 'This Firebase identity is linked to another OTYA account' }, 409)
  }

  const secondFactor = await verifySecondFactor(
    env,
    user.id,
    typeof body.totp_code === 'string' ? body.totp_code : undefined,
    typeof body.recovery_code === 'string' ? body.recovery_code : undefined,
  )
  if (secondFactor === 'unavailable') {
    return json(env, { error: 'Two-step verification is temporarily unavailable', code: 'TWO_FACTOR_UNAVAILABLE' }, 503)
  }
  if (secondFactor === 'required') {
    return json(env, { error: 'Enter your authenticator code or a recovery code.', code: 'TWO_FACTOR_REQUIRED' }, 401)
  }
  if (secondFactor === 'invalid') {
    return json(env, { error: 'The authenticator or recovery code is invalid.', code: 'TWO_FACTOR_INVALID' }, 401)
  }

  if (!(await linkFirebaseIdentity(env, user.id, account.localId, email))) {
    return json(env, { error: 'This Firebase identity is linked to another OTYA account' }, 409)
  }
  await touchUserProduct(env.AUTH_DB, user.id, 'otya')

  const now = Math.floor(Date.now() / 1000)
  const accessToken = await signJwt(
    { sub: user.id, email, iat: now, exp: now + ACCESS_TOKEN_TTL_SECS },
    env.AUTH_JWT_SECRET,
  )
  const refreshToken = await issueRefreshToken(env, user.id)

  return json(env, {
    access_token: accessToken,
    refresh_token: refreshToken,
    expires_in: ACCESS_TOKEN_TTL_SECS,
    token_type: 'Bearer',
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar_url: user.avatar_url,
      is_verified: true,
      firebase_uid: account.localId,
    },
    identity_provider: 'firebase',
  })
}
