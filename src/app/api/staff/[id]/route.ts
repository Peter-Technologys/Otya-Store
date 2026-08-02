/**
 * PATCH  /api/staff/[id]  — update a staff member
 * DELETE /api/staff/[id]  — remove a staff member
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

  if (!isValidUuid(id)) return apiErr('Invalid staff id', req, 400)

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

  const setClauses: string[] = ['updated_at = ?']
  const binds: unknown[]     = [new Date().toISOString()]

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return apiErr('name must be a non-empty string', req)
    }
    setClauses.push('name = ?'); binds.push(name.trim())
  }
  if (role  !== undefined) { setClauses.push('role = ?');  binds.push(role) }
  if (phone !== undefined) { setClauses.push('phone = ?'); binds.push(phone) }
  if (email !== undefined) { setClauses.push('email = ?'); binds.push(email) }

  if (setClauses.length === 1) return apiErr('No fields to update', req)

  binds.push(id, jwt.user_id)

  const db     = getDB(env as Record<string, unknown>)
  const result = await db.prepare(
    `UPDATE staff SET ${setClauses.join(', ')} WHERE id = ? AND user_id = ?`
  ).bind(...binds).run()

  if (result.meta.changes === 0) return apiErr('Staff member not found', req, 404)

  return apiJson({ ok: true }, req)
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { env } = await getCloudflareContext({ async: true })

  if (!isValidUuid(id)) return apiErr('Invalid staff id', req, 400)

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const db     = getDB(env as Record<string, unknown>)
  const result = await db.prepare(
    'DELETE FROM staff WHERE id = ? AND user_id = ?'
  ).bind(id, jwt.user_id).run()

  if (result.meta.changes === 0) return apiErr('Staff member not found', req, 404)

  return apiJson({ ok: true }, req)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
