import { verifyJwt } from './crypto'
import { deleteUser, getUserById, type D1Database } from './db'

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

export interface SecureAccountEnv {
  AUTH_DB: D1Database
  AUTH_KV: KVNamespaceLike
  AUTH_JWT_SECRET: string
  OTYA_STORE_INTERNAL_URL?: string
  INTERNAL_SECRET?: string
}

const CANONICAL_STORE_URL = 'https://petersmartlink.com'

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

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

async function sessionIdForToken(refreshToken: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(refreshToken))
  return toHex(new Uint8Array(digest).slice(0, 16))
}

async function revokeEveryRefreshSession(env: SecureAccountEnv, userId: string): Promise<number> {
  let cursor: string | undefined
  let revoked = 0

  do {
    const page = await env.AUTH_KV.list({
      prefix: `rt_user:${userId}:`,
      limit: 1000,
      cursor,
    })

    for (const key of page.keys) {
      const token = key.name.slice(`rt_user:${userId}:`.length)
      if (!token) continue
      const sessionId = await sessionIdForToken(token)
      await Promise.all([
        env.AUTH_KV.delete(key.name),
        env.AUTH_KV.delete(`rt:${token}`),
        env.AUTH_KV.delete(`auth_session:${userId}:${sessionId}`),
        env.AUTH_KV.delete(`auth_session_token:${sessionId}`),
      ])
      revoked++
    }

    cursor = page.list_complete ? undefined : page.cursor
    if (!page.list_complete && !cursor) {
      throw new Error('AUTH_KV pagination ended without a cursor')
    }
  } while (cursor)

  return revoked
}

async function deleteStoreData(
  env: SecureAccountEnv,
  user: { id: string; email: string | null },
): Promise<void> {
  if (!env.INTERNAL_SECRET) throw new Error('Account deletion service is not configured')
  const base = (env.OTYA_STORE_INTERNAL_URL?.trim() || CANONICAL_STORE_URL).replace(/\/$/, '')

  const response = await fetch(`${base}/api/internal/delete-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': env.INTERNAL_SECRET,
    },
    body: JSON.stringify({ user_id: user.id, user_email: user.email }),
    signal: AbortSignal.timeout(8000),
  })
  const data = await response.json().catch(() => ({})) as { ok?: boolean }
  if (!response.ok || data.ok !== true) {
    throw new Error(`Otya product-data cleanup failed (${response.status})`)
  }
}

export async function handleSecureAccountRoute(
  request: Request,
  env: SecureAccountEnv,
): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/auth/delete-account') return null
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)

  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) {
    return json({ error: 'Authorization header required or token invalid' }, 401)
  }

  const payload = await verifyJwt(auth.slice(7), env.AUTH_JWT_SECRET)
  if (!payload?.sub) {
    return json({ error: 'Authorization header required or token invalid' }, 401)
  }

  const user = await getUserById(env.AUTH_DB, payload.sub)
  if (!user) return json({ error: 'User not found' }, 404)

  // Product cleanup comes first and is idempotent. If the core service cannot
  // prove cleanup succeeded, keep the identity intact and return a retryable
  // failure instead of claiming the account was fully deleted.
  try {
    await deleteStoreData(env, { id: user.id, email: user.email })
  } catch (error) {
    console.error('[auth/delete-account] Product cleanup incomplete:', (error as Error)?.message)
    return json({
      error: 'Account deletion could not be completed. Please try again.',
      code: 'ACCOUNT_DELETION_INCOMPLETE',
    }, 503)
  }

  // After product cleanup is proven, revoke every refresh/session record before
  // deleting the identity. Retrying remains safe because core cleanup is
  // idempotent and all deletes below are naturally repeatable.
  await revokeEveryRefreshSession(env, payload.sub)
  await deleteUser(env.AUTH_DB, payload.sub)
  await env.AUTH_KV.delete(`drive_file:${payload.sub}`)

  return json({ ok: true, message: 'Account deleted.' })
}
