/**
 * PATCH  /api/customers/[id]  — update a customer
 * DELETE /api/customers/[id]  — delete a customer
 *
 * Auth: Bearer JWT. Scoped to user_id.
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

  if (!isValidUuid(id)) return apiErr('Invalid customer id', req, 400)

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

  const setClauses: string[] = ['updated_at = ?']
  const binds: unknown[]     = [new Date().toISOString()]

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return apiErr('name must be a non-empty string', req)
    }
    setClauses.push('name = ?'); binds.push(name.trim())
  }
  if (phone !== undefined) { setClauses.push('phone = ?'); binds.push(phone) }
  if (email !== undefined) { setClauses.push('email = ?'); binds.push(email) }
  if (notes !== undefined) { setClauses.push('notes = ?'); binds.push(notes) }

  if (setClauses.length === 1) return apiErr('No fields to update', req)

  binds.push(id, jwt.user_id)

  const db     = getDB(env as Record<string, unknown>)
  const result = await db.prepare(
    `UPDATE customers SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...binds).run()

  if (result.meta.changes === 0) return apiErr('Customer not found', req, 404)

  const kv = getKV(env as Record<string, unknown>)
  kvInvalidate(kv, `customers:${jwt.user_id}:p1:l20`)

  return apiJson({ ok: true }, req)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { env } = await getCloudflareContext({ async: true })

  if (!isValidUuid(id)) return apiErr('Invalid customer id', req, 400)

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const db     = getDB(env as Record<string, unknown>)
  const result = await db.prepare(
    'DELETE FROM customers WHERE id = ? AND user_id = ?'
  ).bind(id, jwt.user_id).run()

  if (result.meta.changes === 0) return apiErr('Customer not found', req, 404)

  const kv = getKV(env as Record<string, unknown>)
  kvInvalidate(kv, `customers:${jwt.user_id}:p1:l20`)

  return apiJson({ ok: true }, req)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
