import { verifyJwt } from './crypto'
import { deleteUser, getUserById, type D1Database } from './db'
import { sessionIdForRefreshIndexSuffix } from './refresh-token-store'

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
      const suffix = key.name.slice(`rt_user:${userId}:`.length)
      if (!suffix) continue
      const sessionId = await sessionIdForRefreshIndexSuffix(suffix)
      await Promise.all([
        env.AUTH_KV.delete(key.name),
        env.AUTH_KV.delete(`rt:${suffix}`),
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

async function notifyStoreDeletion(
  env: SecureAccountEnv,
  userId: string,
  userEmail: string | null,
): Promise<void> {
  if (!env.OTYA_STORE_INTERNAL_URL || !env.INTERNAL_SECRET) {
    throw new Error('Product-data cleanup channel is not configured')
  }

  const base = env.OTYA_STORE_INTERNAL_URL.replace(/\/$/, '')
  const response = await fetch(`${base}/api/internal/delete-user`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Internal-Secret': env.INTERNAL_SECRET,
    },
    body: JSON.stringify({ user_id: userId, ...(userEmail ? { user_email: userEmail } : {}) }),
    signal: AbortSignal.timeout(8000),
  })

  const result = await response.clone().json().catch(() => ({})) as { ok?: boolean; error?: string }
  if (!response.ok || result.ok !== true) {
    throw new Error(result.error || `OTYA Store cleanup failed with HTTP ${response.status}`)
  }
}

async function deleteAuthDbChildIfPresent(
  db: D1Database,
  table: 'user_consents' | 'account_two_factor',
  userId: string,
): Promise<void> {
  const found = await db.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table' AND name = ? LIMIT 1",
  ).bind(table).first<{ name?: string }>()
  if (found?.name) await db.prepare(`DELETE FROM ${table} WHERE user_id = ?`).bind(userId).run()
}

async function purgeDirectAuthState(env: SecureAccountEnv, userId: string): Promise<void> {
  const keys = [
    `drive_file:${userId}`,
    `drive_backup_at:${userId}`,
    `last_login_ip:${userId}`,
    `verify_otp:${userId}`,
    `2fa_pending:${userId}`,
    `phone_verify_pending:${userId}`,
    `admin_mfa_otp:${userId}`,
    `admin_mfa_telegram:${userId}`,
    `admin_mfa_complete:${userId}`,
  ]
  await Promise.all(keys.map(key => env.AUTH_KV.delete(key)))
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

  // Delete product data first. If the store cannot prove cleanup, preserve the
  // auth identity so the user can retry instead of being locked out while
  // server-side product data remains orphaned.
  try {
    await notifyStoreDeletion(env, payload.sub, user.email?.toLowerCase() ?? null)
  } catch (error) {
    console.error('[auth/delete-account] Product-data cleanup failed:', (error as Error)?.message)
    return json({
      error: 'Account deletion could not complete safely. Please try again.',
      code: 'ACCOUNT_DATA_CLEANUP_FAILED',
    }, 503)
  }

  try {
    // Revoke credentials before removing the identity so no refresh/session
    // credential survives a successful deletion. The production refresh-safe
    // KV wrapper returns both legacy and digest-backed indexes through this
    // compatibility prefix, so account deletion covers the migration window.
    await revokeEveryRefreshSession(env, payload.sub)
    await purgeDirectAuthState(env, payload.sub)
    await deleteAuthDbChildIfPresent(env.AUTH_DB, 'user_consents', payload.sub)
    await deleteAuthDbChildIfPresent(env.AUTH_DB, 'account_two_factor', payload.sub)
    await deleteUser(env.AUTH_DB, payload.sub)
  } catch (error) {
    console.error('[auth/delete-account] Auth cleanup failed:', (error as Error)?.message)
    return json({
      error: 'Product data was removed, but account security cleanup needs to be retried.',
      code: 'ACCOUNT_AUTH_CLEANUP_FAILED',
    }, 503)
  }

  return json({ ok: true, message: 'Account deleted.' })
}
