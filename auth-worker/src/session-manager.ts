import { verifyJwt } from './crypto'

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

export interface SessionEnv {
  AUTH_KV: KVNamespaceLike
  AUTH_JWT_SECRET: string
}

type SessionRecord = {
  id: string
  userId: string
  refreshToken: string
  createdAt: string
  lastUsedAt: string
  ip?: string
  userAgent?: string
}

const SESSION_TTL = 30 * 24 * 60 * 60

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

async function requireUser(request: Request, env: SessionEnv): Promise<string | null> {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const payload = await verifyJwt(auth.slice(7), env.AUTH_JWT_SECRET)
  return payload?.sub ?? null
}

function clientIp(request: Request): string | undefined {
  const value = request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
  return value || undefined
}

function sessionIdForToken(refreshToken: string): Promise<string> {
  return crypto.subtle.digest('SHA-256', new TextEncoder().encode(refreshToken)).then((digest) => {
    const bytes = new Uint8Array(digest).slice(0, 16)
    return Array.from(bytes).map((byte) => byte.toString(16).padStart(2, '0')).join('')
  })
}

function tokenIndexKey(refreshToken: string): Promise<string> {
  return sessionIdForToken(refreshToken).then((id) => `auth_session_token:${id}`)
}

async function readSession(kv: KVNamespaceLike, userId: string, id: string): Promise<SessionRecord | null> {
  const raw = await kv.get(`auth_session:${userId}:${id}`)
  if (!raw) return null
  try {
    return JSON.parse(raw) as SessionRecord
  } catch {
    return null
  }
}

async function deleteSessionRecord(kv: KVNamespaceLike, session: SessionRecord): Promise<void> {
  await Promise.all([
    kv.delete(`rt:${session.refreshToken}`),
    kv.delete(`rt_user:${session.userId}:${session.refreshToken}`),
    kv.delete(`auth_session:${session.userId}:${session.id}`),
    kv.delete(await tokenIndexKey(session.refreshToken)),
  ])
}

export async function recordSessionFromAuthResponse(
  request: Request,
  response: Response,
  env: SessionEnv,
): Promise<void> {
  if (!response.ok) return
  try {
    const data = await response.clone().json() as {
      refresh_token?: string
      user?: { id?: string }
    }
    const refreshToken = data.refresh_token
    const userId = data.user?.id
    if (!refreshToken || !userId) return

    const id = await sessionIdForToken(refreshToken)
    const now = new Date().toISOString()
    const record: SessionRecord = {
      id,
      userId,
      refreshToken,
      createdAt: now,
      lastUsedAt: now,
      ip: clientIp(request),
      userAgent: request.headers.get('User-Agent')?.slice(0, 240) || undefined,
    }
    await Promise.all([
      env.AUTH_KV.put(`auth_session:${userId}:${id}`, JSON.stringify(record), { expirationTtl: SESSION_TTL }),
      env.AUTH_KV.put(await tokenIndexKey(refreshToken), JSON.stringify({ userId, id }), { expirationTtl: SESSION_TTL }),
    ])
  } catch (error) {
    console.error('[auth/session] Could not record session:', (error as Error)?.message)
  }
}

export async function touchSessionFromRefresh(
  request: Request,
  refreshToken: string,
  env: SessionEnv,
): Promise<void> {
  try {
    const indexRaw = await env.AUTH_KV.get(await tokenIndexKey(refreshToken))
    if (!indexRaw) return
    const index = JSON.parse(indexRaw) as { userId?: string; id?: string }
    if (!index.userId || !index.id) return
    const session = await readSession(env.AUTH_KV, index.userId, index.id)
    if (!session) return
    session.lastUsedAt = new Date().toISOString()
    session.ip = clientIp(request) ?? session.ip
    session.userAgent = request.headers.get('User-Agent')?.slice(0, 240) || session.userAgent
    await env.AUTH_KV.put(`auth_session:${session.userId}:${session.id}`, JSON.stringify(session), { expirationTtl: SESSION_TTL })
  } catch (error) {
    console.error('[auth/session] Could not touch session:', (error as Error)?.message)
  }
}

export async function removeSessionFromLogout(refreshToken: string, env: SessionEnv): Promise<void> {
  try {
    const indexRaw = await env.AUTH_KV.get(await tokenIndexKey(refreshToken))
    if (!indexRaw) return
    const index = JSON.parse(indexRaw) as { userId?: string; id?: string }
    if (!index.userId || !index.id) return
    const session = await readSession(env.AUTH_KV, index.userId, index.id)
    if (session) await deleteSessionRecord(env.AUTH_KV, session)
  } catch (error) {
    console.error('[auth/session] Could not remove session:', (error as Error)?.message)
  }
}

async function listUserSessions(kv: KVNamespaceLike, userId: string): Promise<SessionRecord[]> {
  const rows: SessionRecord[] = []
  let cursor: string | undefined
  do {
    const page = await kv.list({ prefix: `auth_session:${userId}:`, limit: 1000, cursor })
    for (const key of page.keys) {
      const raw = await kv.get(key.name)
      if (!raw) continue
      try {
        const row = JSON.parse(raw) as SessionRecord
        if (row.userId === userId) rows.push(row)
      } catch {}
    }
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor)
  rows.sort((a, b) => b.lastUsedAt.localeCompare(a.lastUsedAt))
  return rows
}

export async function handleSessionRoute(request: Request, env: SessionEnv): Promise<Response | null> {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/auth/sessions')) return null
  const userId = await requireUser(request, env)
  if (!userId) return json({ error: 'Sign in to OTYA first' }, 401)

  if (request.method === 'GET' && url.pathname === '/auth/sessions') {
    const sessions = await listUserSessions(env.AUTH_KV, userId)
    return json({
      ok: true,
      sessions: sessions.map((session) => ({
        id: session.id,
        created_at: session.createdAt,
        last_used_at: session.lastUsedAt,
        ip: session.ip ?? null,
        user_agent: session.userAgent ?? null,
      })),
    })
  }

  if (request.method === 'DELETE' && url.pathname === '/auth/sessions') {
    let body: { session_id?: string }
    try {
      body = await request.json() as { session_id?: string }
    } catch {
      return json({ error: 'Invalid JSON body' }, 400)
    }
    if (!body.session_id) return json({ error: 'session_id is required' }, 400)
    const session = await readSession(env.AUTH_KV, userId, body.session_id)
    if (!session) return json({ error: 'Session not found' }, 404)
    await deleteSessionRecord(env.AUTH_KV, session)
    return json({ ok: true })
  }

  if (request.method === 'POST' && url.pathname === '/auth/sessions/revoke-all') {
    const sessions = await listUserSessions(env.AUTH_KV, userId)
    for (const session of sessions) await deleteSessionRecord(env.AUTH_KV, session)
    return json({ ok: true, revoked: sessions.length })
  }

  return json({ error: 'Method not allowed' }, 405)
}
