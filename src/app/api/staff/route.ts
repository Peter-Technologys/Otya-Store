/**
 * GET  /api/staff  — list staff members (paginated)
 * POST /api/staff  — add a staff member
 *
 * Auth: Bearer JWT. All queries scoped to user_id.
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyJwtViaService, extractBearerToken } from '@/lib/auth-service'
import { getDB } from '@/lib/d1'
import {
  readJsonBody,
  parsePagination,
  apiJson,
  apiErr,
  apiOptions,
  withEtag,
} from '@/lib/smartpos-helpers'

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const url    = new URL(req.url)
  const { page, limit, offset } = parsePagination(url)

  const db = getDB(env as Record<string, unknown>)
  const [dataRes, countRes] = await Promise.all([
    db.prepare(
      'SELECT * FROM staff WHERE user_id = ? ORDER BY name ASC LIMIT ? OFFSET ?'
    ).bind(jwt.user_id, limit, offset).all(),
    db.prepare(
      'SELECT COUNT(*) as cnt FROM staff WHERE user_id = ?'
    ).bind(jwt.user_id).first<{ cnt: number }>(),
  ])

  return withEtag({ staff: dataRes.results, total: countRes?.cnt ?? 0, page, limit }, req)
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const body = await readJsonBody(req)
  if (!body.ok) return apiErr(body.error, req, body.status)

  const { name, role, phone, email } = body.data as {
    name?:  string
    role?:  string
    phone?: string
    email?: string
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return apiErr('name is required', req)
  }

  const id  = crypto.randomUUID()
  const now = new Date().toISOString()
  const db  = getDB(env as Record<string, unknown>)

  await db.prepare(`
    INSERT INTO staff (id, user_id, name, role, phone, email, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, jwt.user_id, name.trim(), role ?? null, phone ?? null, email ?? null, now, now).run()

  return apiJson({ ok: true, id }, req, 201)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
