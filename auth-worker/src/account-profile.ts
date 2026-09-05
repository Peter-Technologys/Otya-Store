import { verifyJwt } from './crypto'
import { assertSchemaReady, getUserByEmail, type D1Database } from './db'

interface Env {
  AUTH_DB: D1Database
  AUTH_JWT_SECRET: string
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

async function userIdFromRequest(request: Request, env: Env): Promise<string | null> {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  return (await verifyJwt(auth.slice(7), env.AUTH_JWT_SECRET))?.sub ?? null
}

const clean = (value: unknown, max: number): string | null => {
  if (value === null) return null
  if (typeof value !== 'string') return null
  const normalized = value.trim().slice(0, max)
  return normalized || null
}

const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,23}$/

function normalizeUsername(value: unknown): string | null {
  const username = clean(value, 24)?.replace(/^@+/, '').toLowerCase() ?? null
  return username && USERNAME_PATTERN.test(username) ? username : null
}

function validEmail(value: string | null): value is string {
  return value !== null && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validRecoveryEmail(value: string | null): boolean {
  return value === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function validCountryCode(value: string | null): boolean {
  return value === null || /^[A-Z]{2}$/.test(value)
}

function validLocale(value: string | null): boolean {
  return value === null || /^[A-Za-z]{2,3}(?:[-_][A-Za-z0-9]{2,8})*$/.test(value)
}

function validTimezone(value: string | null): boolean {
  if (value === null) return true
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: value }).format()
    return true
  } catch {
    return false
  }
}

function isUniqueConstraintError(error: unknown): boolean {
  const message = String(error).toLowerCase()
  return message.includes('unique constraint') ||
    message.includes('constraint failed') ||
    message.includes('sqlite_constraint')
}

export async function handleAccountProfile(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/auth/account') return null
  if (request.method !== 'GET' && request.method !== 'PATCH') return json({ error: 'Method not allowed' }, 405)

  let userId: string | null = null
  try {
    userId = await userIdFromRequest(request, env)
  } catch (error) {
    console.error('[auth/account] Token verification failed:', (error as Error)?.message)
    return json({ error: 'Your Otya session could not be verified. Please sign in again.' }, 401)
  }
  if (!userId) return json({ error: 'Sign in required' }, 401)

  try {
    await assertSchemaReady(env.AUTH_DB)
    await env.AUTH_DB.prepare(
      'SELECT username, user_id FROM user_public_usernames LIMIT 0',
    ).all()
  } catch (error) {
    console.error('[auth/account] Schema readiness check failed:', (error as Error)?.message)
    return json({ error: 'Otya account storage is temporarily unavailable. Please try again.' }, 503)
  }

  try {
    const lookupRaw = url.searchParams.get('lookup_username')
    if (request.method === 'GET' && lookupRaw !== null) {
      const username = normalizeUsername(lookupRaw)
      if (!username) {
        return json({
          error: 'Enter a valid OTYA username.',
          code: 'INVALID_USERNAME',
        }, 400)
      }

      const found = await env.AUTH_DB.prepare(`
        SELECT u.otya_id, p.username, u.name, u.avatar_url
        FROM user_public_usernames p
        JOIN users u ON u.id = p.user_id
        WHERE p.username = ? COLLATE NOCASE
        LIMIT 1
      `).bind(username).first<Record<string, unknown>>()

      if (!found) {
        return json({ error: 'OTYA user not found.', code: 'USERNAME_NOT_FOUND' }, 404)
      }
      return json({ ok: true, user: found })
    }

    if (request.method === 'PATCH') {
      const body = await request.json().catch(() => null) as Record<string, unknown> | null
      if (!body) return json({ error: 'Invalid JSON body' }, 400)

      const allowed = ['email', 'name', 'avatar_url', 'recovery_email', 'country_code', 'locale', 'timezone', 'username'] as const
      if (!allowed.some(key => Object.prototype.hasOwnProperty.call(body, key))) {
        return json({ error: 'No supported profile fields supplied' }, 400)
      }

      const updates: string[] = ["updated_at = datetime('now')"]
      const values: unknown[] = []

      if ('email' in body) {
        const email = clean(body.email, 254)?.toLowerCase() ?? null
        if (!validEmail(email)) return json({ error: 'Enter a valid email address.' }, 400)

        const current = await env.AUTH_DB.prepare('SELECT email FROM users WHERE id = ? LIMIT 1')
          .bind(userId)
          .first<{ email?: string | null }>()
        if (!current) return json({ error: 'Account not found. Please sign in again.' }, 404)

        const currentEmail = current.email?.trim().toLowerCase() ?? null
        if (currentEmail && currentEmail !== email) {
          return json({
            error: 'Changing an existing primary email requires the dedicated verified email-change flow.',
            code: 'EMAIL_CHANGE_REQUIRES_VERIFICATION',
          }, 409)
        }

        const owner = await getUserByEmail(env.AUTH_DB, email)
        if (owner && owner.id !== userId) {
          return json({ error: 'That email is already connected to another OTYA account.', code: 'EMAIL_IN_USE' }, 409)
        }

        if (!currentEmail) {
          updates.push('email = ?', 'is_verified = 0')
          values.push(email)
        }
      }

      if ('name' in body) {
        updates.push('name = ?')
        values.push(clean(body.name, 120))
      }
      if ('avatar_url' in body) {
        const avatar = clean(body.avatar_url, 1000)
        if (avatar && !/^https:\/\//i.test(avatar)) return json({ error: 'avatar_url must use HTTPS' }, 400)
        updates.push('avatar_url = ?')
        values.push(avatar)
      }
      if ('recovery_email' in body) {
        const recovery = clean(body.recovery_email, 254)?.toLowerCase() ?? null
        if (!validRecoveryEmail(recovery)) return json({ error: 'Invalid recovery email' }, 400)
        updates.push('recovery_email = ?', 'recovery_email_verified_at = NULL')
        values.push(recovery)
      }
      if ('country_code' in body) {
        const country = clean(body.country_code, 2)?.toUpperCase() ?? null
        if (!validCountryCode(country)) return json({ error: 'country_code must be a two-letter code' }, 400)
        updates.push('country_code = ?')
        values.push(country)
      }
      if ('locale' in body) {
        const locale = clean(body.locale, 35)
        if (!validLocale(locale)) return json({ error: 'Invalid locale' }, 400)
        updates.push('locale = ?')
        values.push(locale)
      }
      if ('timezone' in body) {
        const timezone = clean(body.timezone, 80)
        if (!validTimezone(timezone)) return json({ error: 'Invalid timezone' }, 400)
        updates.push('timezone = ?')
        values.push(timezone)
      }

      if ('username' in body) {
        const username = normalizeUsername(body.username)
        if (!username) {
          return json({
            error: 'Use 3–24 characters, start with a letter, and use only letters, numbers or underscore.',
            code: 'INVALID_USERNAME',
          }, 400)
        }
        try {
          await env.AUTH_DB.prepare(`
            INSERT INTO user_public_usernames (username, user_id, created_at, updated_at)
            VALUES (?, ?, datetime('now'), datetime('now'))
            ON CONFLICT(user_id) DO UPDATE SET
              username = excluded.username,
              updated_at = datetime('now')
          `).bind(username, userId).run()
        } catch (error) {
          if (isUniqueConstraintError(error)) {
            return json({
              error: 'That OTYA username is already taken.',
              code: 'USERNAME_TAKEN',
            }, 409)
          }
          throw error
        }
      }

      if (updates.length > 1) {
        values.push(userId)
        await env.AUTH_DB.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).bind(...values).run()
      }
    }

    const user = await env.AUTH_DB.prepare(`
      SELECT id, otya_id, email, name, avatar_url, is_verified, phone_number, phone_verified_at,
             phone_verification_method, recovery_email, recovery_email_verified_at,
             country_code, locale, timezone, created_at, updated_at
      FROM users WHERE id = ?
    `).bind(userId).first<Record<string, unknown>>()
    if (!user) return json({ error: 'Account not found. Please sign in again.' }, 404)

    const usernameRow = await env.AUTH_DB.prepare(
      'SELECT username FROM user_public_usernames WHERE user_id = ? LIMIT 1',
    ).bind(userId).first<{ username?: string }>()
    const publicUser = { ...user, username: usernameRow?.username ?? null }

    // Connected identities and product history are useful account metadata, but
    // they must never make the primary account profile unavailable if a legacy
    // deployment is still completing its schema migration.
    let identities: Record<string, unknown>[] = []
    let products: Record<string, unknown>[] = []
    try {
      identities = (await env.AUTH_DB.prepare(`
        SELECT provider, provider_username, linked_at, last_used_at
        FROM linked_identities WHERE user_id = ? ORDER BY provider
      `).bind(userId).all<Record<string, unknown>>()).results
    } catch (error) {
      console.error('[auth/account] Linked identities read failed:', (error as Error)?.message)
    }
    try {
      products = (await env.AUTH_DB.prepare(`
        SELECT product_id, status, first_seen_at, last_seen_at
        FROM user_products WHERE user_id = ? ORDER BY last_seen_at DESC
      `).bind(userId).all<Record<string, unknown>>()).results
    } catch (error) {
      console.error('[auth/account] Product history read failed:', (error as Error)?.message)
    }

    return json({ ok: true, user: publicUser, identities, products })
  } catch (error) {
    console.error('[auth/account] Account request failed:', (error as Error)?.message)
    return json({ error: 'Could not load your Otya account. Please try again.' }, 503)
  }
}
