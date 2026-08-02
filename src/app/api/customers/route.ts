/**
 * GET  /api/customers  — list customers (paginated, KV-cached 5 min)
 * POST /api/customers  — create a customer
 *
 * Auth: Bearer JWT. All queries scoped to user_id.
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyJwtViaService, extractBearerToken } from '@/lib/auth-service'
import { getDB, getKV } from '@/lib/d1'
import {
  readJsonBody,
  parsePagination,
  apiJson,
  apiErr,
  apiOptions,
  withEtag,
  kvGetJson,
  kvSetJson,
  kvInvalidate,
} from '@/lib/smartpos-helpers'

const CACHE_TTL = 5 * 60 // 5 minutes

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const url    = new URL(req.url)
  const { page, limit, offset } = parsePagination(url)

  const kv       = getKV(env as Record<string, unknown>)
  const cacheKey = `customers:${jwt.user_id}:p${page}:l${limit}`

  const cached = await kvGetJson<{ customers: unknown[]; total: number }>(kv, cacheKey)
  if (cached) return withEtag({ ...cached, page, limit, cached: true }, req)

  const db = getDB(env as Record<string, unknown>)
  const [dataRes, countRes] = await Promise.all([
    db.prepare(
      'SELECT * FROM customers WHERE user_id = ? ORDER BY name ASC LIMIT ? OFFSET ?'
    ).bind(jwt.user_id, limit, offset).all(),
    db.prepare(
      'SELECT COUNT(*) as cnt FROM customers WHERE user_id = ?'
    ).bind(jwt.user_id).first<{ cnt: number }>(),
  ])

  const payload = { customers: dataRes.results, total: countRes?.cnt ?? 0, page, limit }
  kvSetJson(kv, cacheKey, { customers: dataRes.results, total: countRes?.cnt ?? 0 }, CACHE_TTL)

  return withEtag(payload, req)
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const body = await readJsonBody(req)
  if (!body.ok) return apiErr(body.error, req, body.status)

  const { name, phone, email, notes } = body.data as {
    name?:  string
    phone?: string
    email?: string
    notes?: string
  }

  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return apiErr('name is required', req)
  }

  const id  = crypto.randomUUID()
  const now = new Date().toISOString()
  const db  = getDB(env as Record<string, unknown>)

  await db.prepare(`
    INSERT INTO customers (id, user_id, name, phone, email, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(id, jwt.user_id, name.trim(), phone ?? null, email ?? null, notes ?? null, now, now).run()

  const kv = getKV(env as Record<string, unknown>)
  kvInvalidate(kv, `customers:${jwt.user_id}:p1:l20`)

  return apiJson({ ok: true, id }, req, 201)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
