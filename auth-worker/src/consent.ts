import { verifyJwt } from './crypto'

interface D1Statement {
  bind(...values: unknown[]): D1Statement
  first<T = Record<string, unknown>>(): Promise<T | null>
  run(): Promise<{ meta: { changes: number } }>
}

interface D1Database {
  prepare(query: string): D1Statement
  exec(query: string): Promise<unknown>
}

interface Env {
  AUTH_DB: D1Database
  AUTH_JWT_SECRET: string
}

const TERMS_VERSION = '2026-08-28'
const PRIVACY_VERSION = '2026-08-28'

async function ensureConsentSchema(db: D1Database): Promise<void> {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_consents (
      user_id TEXT PRIMARY KEY,
      terms_accepted INTEGER NOT NULL DEFAULT 0,
      terms_version TEXT,
      terms_accepted_at TEXT,
      privacy_accepted INTEGER NOT NULL DEFAULT 0,
      privacy_version TEXT,
      privacy_accepted_at TEXT,
      marketing_consent INTEGER NOT NULL DEFAULT 0,
      marketing_updated_at TEXT,
      updated_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

async function userIdFromRequest(request: Request, env: Env): Promise<string | null> {
  const header = request.headers.get('Authorization')
  if (!header?.startsWith('Bearer ')) return null
  const payload = await verifyJwt(header.slice(7), env.AUTH_JWT_SECRET)
  return payload?.sub ?? null
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

export async function recordRegistrationConsent(
  env: Env,
  userId: string,
  marketingConsent: boolean,
): Promise<void> {
  await ensureConsentSchema(env.AUTH_DB)
  await env.AUTH_DB.prepare(`
    INSERT INTO user_consents (
      user_id, terms_accepted, terms_version, terms_accepted_at,
      privacy_accepted, privacy_version, privacy_accepted_at,
      marketing_consent, marketing_updated_at, updated_at
    ) VALUES (?, 1, ?, datetime('now'), 1, ?, datetime('now'), ?, datetime('now'), datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      terms_accepted = 1,
      terms_version = excluded.terms_version,
      terms_accepted_at = datetime('now'),
      privacy_accepted = 1,
      privacy_version = excluded.privacy_version,
      privacy_accepted_at = datetime('now'),
      marketing_consent = excluded.marketing_consent,
      marketing_updated_at = datetime('now'),
      updated_at = datetime('now')
  `).bind(userId, TERMS_VERSION, PRIVACY_VERSION, marketingConsent ? 1 : 0).run()
}

export async function handleConsentRoute(request: Request, env: Env): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/auth/consent') return null

  const userId = await userIdFromRequest(request, env)
  if (!userId) return json({ error: 'Authorization required' }, 401)
  await ensureConsentSchema(env.AUTH_DB)

  if (request.method === 'GET') {
    const row = await env.AUTH_DB.prepare(
      'SELECT * FROM user_consents WHERE user_id = ?'
    ).bind(userId).first<Record<string, unknown>>()
    return json({
      ok: true,
      terms_version: TERMS_VERSION,
      privacy_version: PRIVACY_VERSION,
      consent: row ?? {
        user_id: userId,
        terms_accepted: 0,
        privacy_accepted: 0,
        marketing_consent: 0,
      },
    })
  }

  if (request.method === 'PATCH') {
    let body: Record<string, unknown>
    try { body = await request.json() as Record<string, unknown> }
    catch { return json({ error: 'Invalid JSON body' }, 400) }

    if (typeof body.marketing_consent !== 'boolean') {
      return json({ error: 'marketing_consent must be true or false' }, 400)
    }

    await env.AUTH_DB.prepare(`
      INSERT INTO user_consents (user_id, marketing_consent, marketing_updated_at, updated_at)
      VALUES (?, ?, datetime('now'), datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        marketing_consent = excluded.marketing_consent,
        marketing_updated_at = datetime('now'),
        updated_at = datetime('now')
    `).bind(userId, body.marketing_consent ? 1 : 0).run()

    return json({ ok: true, marketing_consent: body.marketing_consent })
  }

  return json({ error: 'Method not allowed' }, 405)
}
