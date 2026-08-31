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

async function notifyStoreDeletion(env: SecureAccountEnv, userId: string): Promise<void> {
  if (!env.OTYA_STORE_INTERNAL_URL || !env.INTERNAL_SECRET) return

  const base = env.OTYA_STORE_INTERNAL_URL.replace(/\/$/, '')
  try {
    const response = await fetch(`${base}/api/internal/delete-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': env.INTERNAL_SECRET,
      },
      body: JSON.stringify({ user_id: userId }),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) {
      console.error('[auth/delete-account] OTYA Store cleanup failed:', response.status)
    }
  } catch (error) {
    console.error('[auth/delete-account] OTYA Store cleanup unavailable:', (error as Error)?.message)
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

  // Revoke first. If D1 deletion later fails, the account remains recoverable but
  // its old sessions are no longer usable. This is safer than deleting the D1
  // user first and potentially leaving refresh/session credentials alive.
  await revokeEveryRefreshSession(env, payload.sub)
  await deleteUser(env.AUTH_DB, payload.sub)
  await env.AUTH_KV.delete(`drive_file:${payload.sub}`)

  // Product-data cleanup is best effort here so a temporary store outage does
  // not resurrect the auth account. The store owns its own deletion auditing.
  await notifyStoreDeletion(env, payload.sub)

  return json({ ok: true, message: 'Account deleted.' })
}
