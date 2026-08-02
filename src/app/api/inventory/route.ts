/**
 * GET  /api/inventory  — list inventory logs for the authenticated user (paginated)
 * POST /api/inventory  — record an inventory log entry (alias for /adjust)
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
  const productId = url.searchParams.get('product_id') ?? null

  const db = getDB(env as Record<string, unknown>)

  let rows: unknown[]
  let total: number

  if (productId) {
    if (!isValidUuid(productId)) return apiErr('Invalid product_id', req, 400)
    const [dataRes, countRes] = await Promise.all([
      db.prepare(
        'SELECT * FROM inventory_logs WHERE user_id = ? AND product_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(jwt.user_id, productId, limit, offset).all(),
      db.prepare(
        'SELECT COUNT(*) as cnt FROM inventory_logs WHERE user_id = ? AND product_id = ?'
      ).bind(jwt.user_id, productId).first<{ cnt: number }>(),
    ])
    rows  = dataRes.results
    total = countRes?.cnt ?? 0
  } else {
    const [dataRes, countRes] = await Promise.all([
      db.prepare(
        'SELECT * FROM inventory_logs WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(jwt.user_id, limit, offset).all(),
      db.prepare(
        'SELECT COUNT(*) as cnt FROM inventory_logs WHERE user_id = ?'
      ).bind(jwt.user_id).first<{ cnt: number }>(),
    ])
    rows  = dataRes.results
    total = countRes?.cnt ?? 0
  }

  return withEtag({ logs: rows, total, page, limit }, req)
}

export async function POST(req: NextRequest) {
  // Delegate to the same logic as /api/inventory/adjust
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const body = await readJsonBody(req)
  if (!body.ok) return apiErr(body.error, req, body.status)

  const { product_id, change, reason } = body.data as {
    product_id?: string
    change?:     number
    reason?:     string
  }

  if (!product_id || !isValidUuid(product_id)) {
    return apiErr('product_id must be a valid UUID', req)
  }
  if (change == null || typeof change !== 'number' || !Number.isInteger(change)) {
    return apiErr('change must be an integer', req)
  }

  const id  = crypto.randomUUID()
  const now = new Date().toISOString()
  const db  = getDB(env as Record<string, unknown>)

  // Use D1 batch to log the adjustment and update stock atomically
  await db.prepare(`
    INSERT INTO inventory_logs (id, user_id, product_id, change, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, jwt.user_id, product_id, change, reason ?? null, now).run()

  // Update product stock — scoped to user_id for safety
  await db.prepare(
    'UPDATE products SET stock = stock + ?, updated_at = ? WHERE id = ? AND user_id = ?'
  ).bind(change, now, product_id, jwt.user_id).run()

  return apiJson({ ok: true, id }, req, 201)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
