/**
 * otya-auth — Cloudflare Worker
 *
 * Handles all user authentication for the Otya ecosystem.
 * Called by the main otya-store worker via Service Binding (env.AUTH).
 *
 * Routes:
 *   POST /auth/register        — email + password signup
 *   POST /auth/login           — email + password login
 *   POST /auth/refresh         — refresh access token
 *   POST /auth/logout          — revoke refresh token
 *   POST /auth/google          — Google ID token login/signup
 *   POST /auth/forgot-password — send OTP via email
 *   POST /auth/reset-password  — verify OTP, update password
 *   POST /auth/delete-account  — delete user account
 *   GET  /auth/verify          — validate JWT (called by otya-store via Service Binding)
 *
 * Bindings (wrangler.toml):
 *   AUTH_DB  — D1 database
 *   AUTH_KV  — KV namespace (refresh tokens, OTPs)
 *   EMAIL    — Email binding (Cloudflare Email Workers)
 *
 * Secrets (wrangler secret put):
 *   AUTH_JWT_SECRET  — HS256 signing secret for JWTs
 *   GOOGLE_CLIENT_ID — Google OAuth client ID for ID token verification
 */

import {
  generateUuid,
  hashPassword,
  verifyPassword,
  signJwt,
  verifyJwt,
  generateOtp,
  generateRefreshToken,
  type JwtPayload,
} from './crypto'

import {
  ensureSchema,
  getUserByEmail,
  getUserById,
  getUserByGoogleId,
  insertUser,
  upsertGoogleUser,
  updatePasswordHash,
  deleteUser,
  type D1Database,
} from './db'

// ── Env interface ─────────────────────────────────────────────────────────────

interface Env {
  AUTH_DB:         D1Database
  AUTH_KV:         KVNamespace
  EMAIL?:          { send(msg: EmailMessage): Promise<void> }
  AUTH_JWT_SECRET: string
  GOOGLE_CLIENT_ID: string
  CORS_ORIGIN?:    string
}

interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
  list(options?: { prefix?: string; limit?: number }): Promise<{ keys: { name: string }[] }>
}

interface EmailMessage {
  from:    { email: string; name?: string }
  to:      { email: string }[]
  subject: string
  text:    string
}

// ── Token TTLs ────────────────────────────────────────────────────────────────

const ACCESS_TOKEN_TTL_SECS  = 15 * 60          // 15 minutes
const REFRESH_TOKEN_TTL_SECS = 30 * 24 * 60 * 60 // 30 days
const OTP_TTL_SECS           = 10 * 60           // 10 minutes

// ── CORS headers ──────────────────────────────────────────────────────────────

function corsHeaders(env: Env): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':  env.CORS_ORIGIN ?? 'https://petersmartlink.com',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  }
}

// ── Response helpers ──────────────────────────────────────────────────────────

function jsonOk(data: unknown, env: Env, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      ...corsHeaders(env),
    },
  })
}

function jsonErr(message: string, env: Env, status = 400): Response {
  return jsonOk({ error: message }, env, status)
}

// ── JWT helpers ───────────────────────────────────────────────────────────────

async function issueAccessToken(userId: string, email: string, secret: string): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  return signJwt({ sub: userId, email, iat: now, exp: now + ACCESS_TOKEN_TTL_SECS }, secret)
}

async function issueRefreshToken(kv: KVNamespace, userId: string): Promise<string> {
  const token = generateRefreshToken()
  await kv.put(`rt:${token}`, userId, { expirationTtl: REFRESH_TOKEN_TTL_SECS })
  return token
}

async function revokeAllRefreshTokens(kv: KVNamespace, userId: string): Promise<void> {
  // List all refresh tokens and delete those belonging to this user
  let cursor: string | undefined
  do {
    const result = await kv.list({ prefix: 'rt:', limit: 1000 }) as {
      keys: { name: string }[]
      list_complete: boolean
      cursor?: string
    }
    for (const key of result.keys) {
      const val = await kv.get(key.name)
      if (val === userId) {
        await kv.delete(key.name)
      }
    }
    cursor = result.list_complete ? undefined : result.cursor
  } while (cursor)
}

// ── Google ID token verification ──────────────────────────────────────────────

interface GoogleTokenPayload {
  sub:            string
  email:          string
  email_verified: boolean
  name?:          string
  picture?:       string
  aud:            string
  iss:            string
  exp:            number
  iat:            number
}

/**
 * Verify a Google ID token by fetching Google's public keys and validating
 * the RS256 signature. Uses the tokeninfo endpoint as a simpler alternative
 * that doesn't require fetching JWKS.
 */
async function verifyGoogleIdToken(
  idToken: string,
  clientId: string,
): Promise<GoogleTokenPayload | null> {
  try {
    // Use Google's tokeninfo endpoint — validates signature server-side
    const res = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    )
    if (!res.ok) return null

    const payload = await res.json() as GoogleTokenPayload

    // Validate audience matches our client ID
    if (payload.aud !== clientId) return null

    // Validate issuer
    if (payload.iss !== 'accounts.google.com' && payload.iss !== 'https://accounts.google.com') {
      return null
    }

    // Validate expiry
    const now = Math.floor(Date.now() / 1000)
    if (payload.exp < now) return null

    return payload
  } catch {
    return null
  }
}

// ── Route handlers ────────────────────────────────────────────────────────────

/** POST /auth/register */
async function handleRegister(req: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return jsonErr('Invalid JSON body', env) }

  const { email, password, name } = body as { email?: string; password?: string; name?: string }

  if (!email || typeof email !== 'string' || !email.includes('@')) {
    return jsonErr('Valid email is required', env)
  }
  if (!password || typeof password !== 'string' || password.length < 8) {
    return jsonErr('Password must be at least 8 characters', env)
  }

  const normalizedEmail = email.toLowerCase().trim()

  // Check if user already exists
  const existing = await getUserByEmail(env.AUTH_DB, normalizedEmail)
  if (existing) return jsonErr('Email already registered', env, 409)

  const userId       = generateUuid()
  const passwordHash = await hashPassword(password)

  await insertUser(env.AUTH_DB, {
    id:            userId,
    email:         normalizedEmail,
    password_hash: passwordHash,
    google_id:     null,
    name:          typeof name === 'string' ? name.trim() : null,
    avatar_url:    null,
  })

  // Issue tokens
  const accessToken  = await issueAccessToken(userId, normalizedEmail, env.AUTH_JWT_SECRET)
  const refreshToken = await issueRefreshToken(env.AUTH_KV, userId)

  // Send welcome email (non-fatal)
  if (env.EMAIL) {
    try {
      await env.EMAIL.send({
        from:    { email: 'noreply@petersmartlink.com', name: 'OTYA Player' },
        to:      [{ email: normalizedEmail }],
        subject: 'Welcome to OTYA Player!',
        text: [
          `Hi ${name ?? 'there'}!`,
          '',
          'Welcome to OTYA Player. Your account has been created successfully.',
          '',
          'Enjoy your music!',
          '— The OTYA Team',
        ].join('\n'),
      })
    } catch (e) {
      console.error('[auth/register] Failed to send welcome email:', (e as Error)?.message)
    }
  }

  return jsonOk({
    ok:            true,
    access_token:  accessToken,
    refresh_token: refreshToken,
    user: {
      id:    userId,
      email: normalizedEmail,
      name:  typeof name === 'string' ? name.trim() : null,
    },
  }, env, 201)
}

/** POST /auth/login */
async function handleLogin(req: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return jsonErr('Invalid JSON body', env) }

  const { email, password } = body as { email?: string; password?: string }

  if (!email || !password) return jsonErr('email and password are required', env)

  const normalizedEmail = (email as string).toLowerCase().trim()
  const user = await getUserByEmail(env.AUTH_DB, normalizedEmail)

  if (!user || !user.password_hash) {
    return jsonErr('Invalid email or password', env, 401)
  }

  const valid = await verifyPassword(password as string, user.password_hash)
  if (!valid) return jsonErr('Invalid email or password', env, 401)

  const accessToken  = await issueAccessToken(user.id, user.email, env.AUTH_JWT_SECRET)
  const refreshToken = await issueRefreshToken(env.AUTH_KV, user.id)

  return jsonOk({
    ok:            true,
    access_token:  accessToken,
    refresh_token: refreshToken,
    user: {
      id:         user.id,
      email:      user.email,
      name:       user.name,
      avatar_url: user.avatar_url,
    },
  }, env)
}

/** POST /auth/refresh */
async function handleRefresh(req: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return jsonErr('Invalid JSON body', env) }

  const { refresh_token } = body as { refresh_token?: string }
  if (!refresh_token) return jsonErr('refresh_token is required', env)

  const userId = await env.AUTH_KV.get(`rt:${refresh_token}`)
  if (!userId) return jsonErr('Invalid or expired refresh token', env, 401)

  const user = await getUserById(env.AUTH_DB, userId)
  if (!user) {
    await env.AUTH_KV.delete(`rt:${refresh_token}`)
    return jsonErr('User not found', env, 401)
  }

  const accessToken = await issueAccessToken(user.id, user.email, env.AUTH_JWT_SECRET)

  return jsonOk({
    ok:           true,
    access_token: accessToken,
    user: {
      id:         user.id,
      email:      user.email,
      name:       user.name,
      avatar_url: user.avatar_url,
    },
  }, env)
}

/** POST /auth/logout */
async function handleLogout(req: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return jsonErr('Invalid JSON body', env) }

  const { refresh_token } = body as { refresh_token?: string }
  if (!refresh_token) return jsonErr('refresh_token is required', env)

  await env.AUTH_KV.delete(`rt:${refresh_token}`)
  return jsonOk({ ok: true }, env)
}

/** POST /auth/google */
async function handleGoogle(req: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return jsonErr('Invalid JSON body', env) }

  const { id_token } = body as { id_token?: string }
  if (!id_token) return jsonErr('id_token is required', env)

  if (!env.GOOGLE_CLIENT_ID) {
    return jsonErr('Google auth not configured', env, 503)
  }

  const googlePayload = await verifyGoogleIdToken(id_token, env.GOOGLE_CLIENT_ID)
  if (!googlePayload) return jsonErr('Invalid Google ID token', env, 401)

  const { sub: googleId, email, name, picture } = googlePayload
  const normalizedEmail = email.toLowerCase().trim()

  // Upsert user
  const user = await upsertGoogleUser(env.AUTH_DB, {
    id:         generateUuid(),
    email:      normalizedEmail,
    google_id:  googleId,
    name:       name ?? null,
    avatar_url: picture ?? null,
  })

  if (!user) return jsonErr('Failed to create or update user', env, 500)

  const accessToken  = await issueAccessToken(user.id, user.email, env.AUTH_JWT_SECRET)
  const refreshToken = await issueRefreshToken(env.AUTH_KV, user.id)

  return jsonOk({
    ok:            true,
    access_token:  accessToken,
    refresh_token: refreshToken,
    user: {
      id:         user.id,
      email:      user.email,
      name:       user.name,
      avatar_url: user.avatar_url,
    },
  }, env)
}

/** POST /auth/forgot-password */
async function handleForgotPassword(req: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return jsonErr('Invalid JSON body', env) }

  const { email } = body as { email?: string }
  if (!email) return jsonErr('email is required', env)

  const normalizedEmail = (email as string).toLowerCase().trim()

  // Always return success to prevent email enumeration
  const user = await getUserByEmail(env.AUTH_DB, normalizedEmail)
  if (!user) {
    return jsonOk({ ok: true, message: 'If that email exists, an OTP has been sent.' }, env)
  }

  const otp = generateOtp()
  await env.AUTH_KV.put(`otp:${normalizedEmail}`, otp, { expirationTtl: OTP_TTL_SECS })

  if (env.EMAIL) {
    try {
      await env.EMAIL.send({
        from:    { email: 'noreply@petersmartlink.com', name: 'OTYA Player' },
        to:      [{ email: normalizedEmail }],
        subject: 'Your OTYA Player password reset code',
        text: [
          'You requested a password reset for your OTYA Player account.',
          '',
          `Your one-time code is: ${otp}`,
          '',
          'This code expires in 10 minutes.',
          '',
          'If you did not request this, please ignore this email.',
          '— The OTYA Team',
        ].join('\n'),
      })
    } catch (e) {
      console.error('[auth/forgot-password] Failed to send OTP email:', (e as Error)?.message)
    }
  }

  return jsonOk({ ok: true, message: 'If that email exists, an OTP has been sent.' }, env)
}

/** POST /auth/reset-password */
async function handleResetPassword(req: Request, env: Env): Promise<Response> {
  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return jsonErr('Invalid JSON body', env) }

  const { email, otp, new_password } = body as {
    email?: string
    otp?: string
    new_password?: string
  }

  if (!email || !otp || !new_password) {
    return jsonErr('email, otp, and new_password are required', env)
  }
  if ((new_password as string).length < 8) {
    return jsonErr('Password must be at least 8 characters', env)
  }

  const normalizedEmail = (email as string).toLowerCase().trim()
  const storedOtp       = await env.AUTH_KV.get(`otp:${normalizedEmail}`)

  if (!storedOtp || storedOtp !== otp) {
    return jsonErr('Invalid or expired OTP', env, 401)
  }

  const user = await getUserByEmail(env.AUTH_DB, normalizedEmail)
  if (!user) return jsonErr('User not found', env, 404)

  const newHash = await hashPassword(new_password as string)
  await updatePasswordHash(env.AUTH_DB, user.id, newHash)
  await env.AUTH_KV.delete(`otp:${normalizedEmail}`)

  return jsonOk({ ok: true, message: 'Password updated successfully.' }, env)
}

/** POST /auth/delete-account */
async function handleDeleteAccount(req: Request, env: Env): Promise<Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonErr('Authorization header required', env, 401)
  }

  const token   = authHeader.slice(7)
  const payload = await verifyJwt(token, env.AUTH_JWT_SECRET)
  if (!payload) return jsonErr('Invalid or expired token', env, 401)

  await deleteUser(env.AUTH_DB, payload.sub)
  await revokeAllRefreshTokens(env.AUTH_KV, payload.sub)

  return jsonOk({ ok: true, message: 'Account deleted.' }, env)
}

/** GET /auth/verify — called by otya-store via Service Binding */
async function handleVerify(req: Request, env: Env): Promise<Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonErr('Authorization header required', env, 401)
  }

  const token   = authHeader.slice(7)
  const payload = await verifyJwt(token, env.AUTH_JWT_SECRET)

  if (!payload) {
    return jsonOk({ ok: false, error: 'Invalid or expired token' }, env, 401)
  }

  return jsonOk({
    ok:      true,
    user_id: payload.sub,
    email:   payload.email,
  }, env)
}

// ── Main fetch handler ────────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Ensure schema on every cold start (idempotent)
    try {
      await ensureSchema(env.AUTH_DB)
    } catch (e) {
      console.error('[auth] ensureSchema failed:', (e as Error)?.message)
    }

    const url    = new URL(request.url)
    const path   = url.pathname
    const method = request.method.toUpperCase()

    // Handle CORS preflight
    if (method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(env),
      })
    }

    try {
      if (method === 'POST' && path === '/auth/register') {
        return handleRegister(request, env)
      }
      if (method === 'POST' && path === '/auth/login') {
        return handleLogin(request, env)
      }
      if (method === 'POST' && path === '/auth/refresh') {
        return handleRefresh(request, env)
      }
      if (method === 'POST' && path === '/auth/logout') {
        return handleLogout(request, env)
      }
      if (method === 'POST' && path === '/auth/google') {
        return handleGoogle(request, env)
      }
      if (method === 'POST' && path === '/auth/forgot-password') {
        return handleForgotPassword(request, env)
      }
      if (method === 'POST' && path === '/auth/reset-password') {
        return handleResetPassword(request, env)
      }
      if (method === 'POST' && path === '/auth/delete-account') {
        return handleDeleteAccount(request, env)
      }
      if (method === 'GET' && path === '/auth/verify') {
        return handleVerify(request, env)
      }

      return jsonErr('Not found', env, 404)
    } catch (e) {
      console.error('[auth] Unhandled error:', (e as Error)?.message, (e as Error)?.stack)
      return jsonErr('Internal server error', env, 500)
    }
  },
} satisfies ExportedHandler<Env>
