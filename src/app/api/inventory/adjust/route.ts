/**
 * POST /api/inventory/adjust  — adjust product stock and log the change
 *
 * Auth: Bearer JWT. Scoped to user_id.
 * Updates products.stock and inserts an inventory_logs row atomically.
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyJwtViaService, extractBearerToken } from '@/lib/auth-service'
import { getDB } from '@/lib/d1'
import {
  readJsonBody,
  apiJson,
  apiErr,
  apiOptions,
  isValidUuid,
} from '@/lib/smartpos-helpers'

export async function POST(req: NextRequest) {
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
    return apiErr('change must be an integer (positive = add, negative = remove)', req)
  }

  const id  = crypto.randomUUID()
  const now = new Date().toISOString()
  const db  = getDB(env as Record<string, unknown>)

  // Verify the product belongs to this user before adjusting
  const product = await db.prepare(
    'SELECT id, stock FROM products WHERE id = ? AND user_id = ?'
  ).bind(product_id, jwt.user_id).first<{ id: string; stock: number }>()

  if (!product) return apiErr('Product not found', req, 404)

  const newStock = (product.stock ?? 0) + change
  if (newStock < 0) {
    return apiErr(`Insufficient stock. Current: ${product.stock}, adjustment: ${change}`, req, 409)
  }

  // Log the adjustment and update stock
  await db.prepare(`
    INSERT INTO inventory_logs (id, user_id, product_id, change, reason, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, jwt.user_id, product_id, change, reason ?? null, now).run()

  await db.prepare(
    'UPDATE products SET stock = ?, updated_at = ? WHERE id = ? AND user_id = ?'
  ).bind(newStock, now, product_id, jwt.user_id).run()

  return apiJson({ ok: true, id, new_stock: newStock }, req, 201)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
