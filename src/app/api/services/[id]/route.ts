/**
 * PATCH  /api/services/[id]  — update a service
 * DELETE /api/services/[id]  — delete a service
 *
 * Auth: Bearer JWT. Scoped to user_id.
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { env } = await getCloudflareContext({ async: true })

  if (!isValidUuid(id)) return apiErr('Invalid service id', req, 400)

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

  const setClauses: string[] = ['updated_at = ?']
  const binds: unknown[]     = [new Date().toISOString()]

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return apiErr('name must be a non-empty string', req)
    }
    setClauses.push('name = ?'); binds.push(name.trim())
  }
  if (description  !== undefined) { setClauses.push('description = ?');  binds.push(description) }
  if (price        !== undefined) {
    if (typeof price !== 'number' || isNaN(price) || price < 0) {
      return apiErr('price must be a non-negative number', req)
    }
    setClauses.push('price = ?'); binds.push(price)
  }
  if (is_published !== undefined) { setClauses.push('is_published = ?'); binds.push(is_published ? 1 : 0) }

  if (setClauses.length === 1) return apiErr('No fields to update', req)

  binds.push(id, jwt.user_id)

  const db     = getDB(env as Record<string, unknown>)
  const result = await db.prepare(
    `UPDATE services SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...binds).run()

  if (result.meta.changes === 0) return apiErr('Service not found', req, 404)

  return apiJson({ ok: true }, req)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { env } = await getCloudflareContext({ async: true })

  if (!isValidUuid(id)) return apiErr('Invalid service id', req, 400)

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const db     = getDB(env as Record<string, unknown>)
  const result = await db.prepare(
    'DELETE FROM services WHERE id = ? AND user_id = ?'
  ).bind(id, jwt.user_id).run()

  if (result.meta.changes === 0) return apiErr('Service not found', req, 404)

  return apiJson({ ok: true }, req)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
