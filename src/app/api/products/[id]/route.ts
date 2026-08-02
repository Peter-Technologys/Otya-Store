/**
 * PATCH  /api/products/[id]  — update a product
 * DELETE /api/products/[id]  — delete a product
 *
 * Auth: Bearer JWT. All queries scoped to user_id.
 * UUID validated before use in D1 queries.
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyJwtViaService, extractBearerToken } from '@/lib/auth-service'
import { getDB, getKV } from '@/lib/d1'
import {
  readJsonBody,
  apiJson,
  apiErr,
  apiOptions,
  kvInvalidate,
  isValidUuid,
} from '@/lib/smartpos-helpers'

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { env } = await getCloudflareContext({ async: true })

  if (!isValidUuid(id)) return apiErr('Invalid product id', req, 400)

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const body = await readJsonBody(req)
  if (!body.ok) return apiErr(body.error, req, body.status)

  const { name, description, price, stock, category, image_url, is_published } =
    body.data as {
      name?:         string
      description?:  string
      price?:        number
      stock?:        number
      category?:     string
      image_url?:    string
      is_published?: number
    }

  // Build SET clause dynamically — only update provided fields
  const setClauses: string[] = ['updated_at = ?']
  const binds: unknown[]     = [new Date().toISOString()]

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return apiErr('name must be a non-empty string', req)
    }
    setClauses.push('name = ?')
    binds.push(name.trim())
  }
  if (description !== undefined) { setClauses.push('description = ?'); binds.push(description) }
  if (price !== undefined) {
    if (typeof price !== 'number' || isNaN(price) || price < 0) {
      return apiErr('price must be a non-negative number', req)
    }
    setClauses.push('price = ?'); binds.push(price)
  }
  if (stock !== undefined) {
    setClauses.push('stock = ?')
    binds.push(typeof stock === 'number' ? Math.floor(stock) : 0)
  }
  if (category     !== undefined) { setClauses.push('category = ?');     binds.push(category) }
  if (image_url    !== undefined) { setClauses.push('image_url = ?');    binds.push(image_url) }
  if (is_published !== undefined) { setClauses.push('is_published = ?'); binds.push(is_published ? 1 : 0) }

  if (setClauses.length === 1) return apiErr('No fields to update', req)

  // Scope update to user_id — prevents cross-user modification
  binds.push(id, jwt.user_id)

  const db = getDB(env as Record<string, unknown>)
  const result = await db.prepare(
    `UPDATE products SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...binds).run()

  if (result.meta.changes === 0) return apiErr('Product not found', req, 404)

  // Invalidate cache
  const kv = getKV(env as Record<string, unknown>)
  kvInvalidate(kv, `products:${jwt.user_id}:p1:l20:cat`)

  return apiJson({ ok: true }, req)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { env } = await getCloudflareContext({ async: true })

  if (!isValidUuid(id)) return apiErr('Invalid product id', req, 400)

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const db = getDB(env as Record<string, unknown>)
  const result = await db.prepare(
    'DELETE FROM products WHERE id = ? AND user_id = ?'
  ).bind(id, jwt.user_id).run()

  if (result.meta.changes === 0) return apiErr('Product not found', req, 404)

  const kv = getKV(env as Record<string, unknown>)
  kvInvalidate(kv, `products:${jwt.user_id}:p1:l20:cat`)

  return apiJson({ ok: true }, req)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
