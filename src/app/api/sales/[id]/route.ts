/**
 * GET /api/sales/[id]  — fetch a single sale by ID
 *
 * Auth: Bearer JWT. Scoped to user_id.
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyJwtViaService, extractBearerToken } from '@/lib/auth-service'
import { getDB } from '@/lib/d1'
import { apiJson, apiErr, apiOptions, isValidUuid } from '@/lib/smartpos-helpers'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params
  const { env } = await getCloudflareContext({ async: true })

  if (!isValidUuid(id)) return apiErr('Invalid sale id', req, 400)

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const db   = getDB(env as Record<string, unknown>)
  const sale = await db.prepare(
    'SELECT * FROM sales WHERE id = ? AND user_id = ?'
  ).bind(id, jwt.user_id).first()

  if (!sale) return apiErr('Sale not found', req, 404)

  return apiJson({ sale }, req)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
