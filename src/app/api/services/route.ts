/**
 * GET  /api/services  — list services (paginated)
 * POST /api/services  — create a service
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
      'SELECT * FROM services WHERE user_id = ? ORDER BY name ASC LIMIT ? OFFSET ?'
    ).bind(jwt.user_id, limit, offset).all(),
    db.prepare(
      'SELECT COUNT(*) as cnt FROM services WHERE user_id = ?'
    ).bind(jwt.user_id).first<{ cnt: number }>(),
  ])

  return withEtag({ services: dataRes.results, total: countRes?.cnt ?? 0, page, limit }, req)
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const body = await readJsonBody(req)
  if (!body.ok) return apiErr(body.error, req, body.status)

  const { name, description, price, is_published } = body.data as {
    name?:         string
    description?:  string
    price?:        number
    is_published?: number
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return apiErr('name is required', req)
  }
  if (price != null && (typeof price !== 'number' || isNaN(price) || price < 0)) {
    return apiErr('price must be a non-negative number', req)
  }

  const id  = crypto.randomUUID()
  const now = new Date().toISOString()
  const db  = getDB(env as Record<string, unknown>)

  await db.prepare(`
    INSERT INTO services (id, user_id, name, description, price, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    jwt.user_id,
    name.trim(),
    description  ?? null,
    price        ?? null,
    is_published != null ? (is_published ? 1 : 0) : 1,
    now,
    now,
  ).run()

  return apiJson({ ok: true, id }, req, 201)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
