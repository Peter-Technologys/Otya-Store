import { verifyJwt } from './crypto'
import { assertSchemaReady, getUserByEmail, getUserByGoogleId, getUserById, touchUserProduct, type D1Database, type UserRow } from './db'

interface GoogleLinkEnv {
  AUTH_DB: D1Database
  AUTH_JWT_SECRET: string
  GOOGLE_CLIENT_ID?: string
  GOOGLE_WEB_CLIENT_ID?: string
}

type GoogleTokenPayload = {
  sub?: string
  aud?: string
  iss?: string
  exp?: string | number
  email?: string
  email_verified?: string | boolean
  name?: string
  picture?: string
}

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

function audiences(env: GoogleLinkEnv): Set<string> {
  return new Set([env.GOOGLE_CLIENT_ID, env.GOOGLE_WEB_CLIENT_ID].map(value => value?.trim() ?? '').filter(Boolean))
}

async function currentUserId(request: Request, env: GoogleLinkEnv): Promise<string | null> {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return (await verifyJwt(auth.slice(7), env.AUTH_JWT_SECRET))?.sub ?? null
}

async function verifiedGoogleToken(request: Request, env: GoogleLinkEnv): Promise<GoogleTokenPayload | Response> {
  const configured = audiences(env)
  if (configured.size === 0) return json({ error: 'Google linking is temporarily unavailable.' }, 503)

  let body: { id_token?: string }
  try { body = await request.json() as { id_token?: string } } catch { return json({ error: 'Invalid request.' }, 400) }
  const idToken = String(body.id_token ?? '').trim()
  if (!idToken) return json({ error: 'Google did not return a valid credential.' }, 400)

  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`, {
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return json({ error: 'Google account verification failed.' }, 401)
    const payload = await response.json() as GoogleTokenPayload
    const verifiedEmail = payload.email_verified === true || payload.email_verified === 'true'
    const issuerOk = payload.iss === 'accounts.google.com' || payload.iss === 'https://accounts.google.com'
    const expiry = Number(payload.exp ?? 0)
    const now = Math.floor(Date.now() / 1000)
    if (!payload.sub || !payload.aud || !configured.has(payload.aud) || !issuerOk || !verifiedEmail || !payload.email || !Number.isFinite(expiry) || expiry <= now) {
      return json({ error: 'Google account verification failed.' }, 401)
    }
    return payload
  } catch {
    return json({ error: 'Google verification service is temporarily unavailable.' }, 503)
  }
}

function conflict(message: string): Response {
  return json({ error: message, code: 'GOOGLE_IDENTITY_CONFLICT' }, 409)
}

async function linkedGoogleOwner(env: GoogleLinkEnv, subject: string): Promise<string | null> {
  const row = await env.AUTH_DB.prepare(
    "SELECT user_id FROM linked_identities WHERE provider = 'google' AND provider_subject = ? LIMIT 1",
  ).bind(subject).first<{ user_id?: string }>()
  return row?.user_id ?? null
}

async function googleSubjectForUser(env: GoogleLinkEnv, userId: string): Promise<string | null> {
  const row = await env.AUTH_DB.prepare(
    "SELECT provider_subject FROM linked_identities WHERE user_id = ? AND provider = 'google' LIMIT 1",
  ).bind(userId).first<{ provider_subject?: string }>()
  return row?.provider_subject ?? null
}

async function attachGoogleIdentity(env: GoogleLinkEnv, user: UserRow, payload: GoogleTokenPayload): Promise<UserRow> {
  const subject = payload.sub!
  const email = payload.email!.trim().toLowerCase()

  const [subjectOwner, userSubject, legacyOwner, emailOwner] = await Promise.all([
    linkedGoogleOwner(env, subject),
    googleSubjectForUser(env, user.id),
    getUserByGoogleId(env.AUTH_DB, subject),
    getUserByEmail(env.AUTH_DB, email),
  ])

  if (subjectOwner && subjectOwner !== user.id) throw new Error('GOOGLE_SUBJECT_OWNED')
  if (userSubject && userSubject !== subject) throw new Error('GOOGLE_PROVIDER_ALREADY_LINKED')
  if (legacyOwner && legacyOwner.id !== user.id) throw new Error('GOOGLE_SUBJECT_OWNED')
  if (emailOwner && emailOwner.id !== user.id) throw new Error('GOOGLE_EMAIL_OWNED')
  if (user.google_id && user.google_id !== subject) throw new Error('GOOGLE_PROVIDER_ALREADY_LINKED')

  const samePrimaryEmail = user.email?.trim().toLowerCase() === email
  await env.AUTH_DB.prepare(`
    UPDATE users SET
      google_id = ?,
      email = COALESCE(email, ?),
      is_verified = CASE WHEN email IS NULL OR lower(email) = ? THEN 1 ELSE is_verified END,
      name = COALESCE(name, ?),
      avatar_url = COALESCE(avatar_url, ?),
      updated_at = datetime('now')
    WHERE id = ?
  `).bind(subject, email, email, payload.name?.trim() || null, payload.picture?.trim() || null, user.id).run()

  await env.AUTH_DB.prepare(`
    INSERT INTO linked_identities (user_id, provider, provider_subject, provider_username, provider_email, linked_at, last_used_at)
    VALUES (?, 'google', ?, NULL, ?, datetime('now'), datetime('now'))
    ON CONFLICT(provider, provider_subject) DO UPDATE SET
      provider_email = excluded.provider_email,
      last_used_at = datetime('now')
  `).bind(user.id, subject, email).run()

  await touchUserProduct(env.AUTH_DB, user.id, 'otya')
  const updated = await getUserById(env.AUTH_DB, user.id)
  if (!updated) throw new Error('GOOGLE_LINK_ACCOUNT_MISSING')
  if (!samePrimaryEmail && user.email) return updated
  return updated
}

export async function handleGoogleLink(request: Request, env: GoogleLinkEnv): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/auth/google/link') return null
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const userId = await currentUserId(request, env).catch(() => null)
  if (!userId) return json({ error: 'Sign in to OTYA first.' }, 401)

  try {
    await assertSchemaReady(env.AUTH_DB)
  } catch {
    return json({ error: 'Otya account storage is temporarily unavailable. Please try again.' }, 503)
  }

  const payload = await verifiedGoogleToken(request, env)
  if (payload instanceof Response) return payload

  const user = await getUserById(env.AUTH_DB, userId)
  if (!user) return json({ error: 'Account not found. Please sign in again.' }, 401)

  try {
    const updated = await attachGoogleIdentity(env, user, payload)
    return json({
      ok: true,
      linked: true,
      provider: 'google',
      user: {
        id: updated.id,
        otya_id: updated.otya_id,
        email: updated.email,
        name: updated.name,
        avatar_url: updated.avatar_url,
        is_verified: updated.is_verified,
      },
    })
  } catch (error) {
    const code = (error as Error)?.message ?? ''
    if (['GOOGLE_SUBJECT_OWNED', 'GOOGLE_PROVIDER_ALREADY_LINKED', 'GOOGLE_EMAIL_OWNED'].includes(code)) {
      return conflict('That Google account is already connected to another OTYA identity or this OTYA account already has a different Google identity.')
    }
    console.error('[auth/google/link]', code)
    return json({ error: 'Google could not be connected right now.' }, 503)
  }
}
