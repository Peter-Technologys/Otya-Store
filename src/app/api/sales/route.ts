/**
 * GET  /api/sales  — list sales for the authenticated user (paginated)
 * POST /api/sales  — record a new sale
 *
 * Auth: Bearer JWT. All queries scoped to user_id.
 * items_json is stored as a JSON string (D1 has no native JSON column type).
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
  isValidUuid,
} from '@/lib/smartpos-helpers'

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const url    = new URL(req.url)
  const { page, limit, offset } = parsePagination(url)

  // Optional date range filter (ISO strings)
  const from = url.searchParams.get('from') ?? null
  const to   = url.searchParams.get('to')   ?? null

  const db = getDB(env as Record<string, unknown>)

  let rows: unknown[]
  let total: number

  if (from && to) {
    const [dataRes, countRes] = await Promise.all([
      db.prepare(
        'SELECT * FROM sales WHERE user_id = ? AND created_at >= ? AND created_at <= ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(jwt.user_id, from, to, limit, offset).all(),
      db.prepare(
        'SELECT COUNT(*) as cnt FROM sales WHERE user_id = ? AND created_at >= ? AND created_at <= ?'
      ).bind(jwt.user_id, from, to).first<{ cnt: number }>(),
    ])
    rows  = dataRes.results
    total = countRes?.cnt ?? 0
  } else {
    const [dataRes, countRes] = await Promise.all([
      db.prepare(
        'SELECT * FROM sales WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(jwt.user_id, limit, offset).all(),
      db.prepare(
        'SELECT COUNT(*) as cnt FROM sales WHERE user_id = ?'
      ).bind(jwt.user_id).first<{ cnt: number }>(),
    ])
    rows  = dataRes.results
    total = countRes?.cnt ?? 0
  }

  return withEtag({ sales: rows, total, page, limit }, req)
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const body = await readJsonBody(req)
  if (!body.ok) return apiErr(body.error, req, body.status)

  const { total, items, customer_id, payment_method, notes } = body.data as {
    total?:          number
    items?:          unknown[]
    customer_id?:    string
    payment_method?: string
    notes?:          string
  }

  // ── Input validation ──────────────────────────────────────────────────────
  if (total == null || typeof total !== 'number' || isNaN(total) || total < 0) {
    return apiErr('total must be a non-negative number', req)
  }
  if (!Array.isArray(items)) {
    return apiErr('items must be an array', req)
  }
  if (customer_id && !isValidUuid(customer_id)) {
    return apiErr('customer_id must be a valid UUID', req)
  }

  const id  = crypto.randomUUID()
  const now = new Date().toISOString()
  const db  = getDB(env as Record<string, unknown>)

  await db.prepare(`
    INSERT INTO sales (id, user_id, customer_id, total, items_json, payment_method, notes, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    jwt.user_id,
    customer_id    ?? null,
    total,
    JSON.stringify(items),
    payment_method ?? 'cash',
    notes          ?? null,
    now,
  ).run()

  return apiJson({ ok: true, id }, req, 201)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
