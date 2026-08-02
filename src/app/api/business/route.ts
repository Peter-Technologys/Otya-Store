/**
 * GET   /api/business  — get business profile for the authenticated user
 * PATCH /api/business  — upsert business profile
 *
 * Auth: Bearer JWT. Scoped to user_id (business_profile.user_id is the PK).
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyJwtViaService, extractBearerToken } from '@/lib/auth-service'
import { getDB } from '@/lib/d1'
import { readJsonBody, apiJson, apiErr, apiOptions } from '@/lib/smartpos-helpers'

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const db      = getDB(env as Record<string, unknown>)
  const profile = await db.prepare(
    'SELECT * FROM business_profile WHERE user_id = ?'
  ).bind(jwt.user_id).first()

  return apiJson({ profile: profile ?? null }, req)
}

export async function PATCH(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const body = await readJsonBody(req)
  if (!body.ok) return apiErr(body.error, req, body.status)

  const { name, phone, email, address, logo_url } = body.data as {
    name?:     string
    phone?:    string
    email?:    string
    address?:  string
    logo_url?: string
  }

  const now = new Date().toISOString()
  const db  = getDB(env as Record<string, unknown>)

  // UPSERT — create or update the profile row
  await db.prepare(`
    INSERT INTO business_profile (user_id, name, phone, email, address, logo_url, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      name       = COALESCE(excluded.name,     name),
      phone      = COALESCE(excluded.phone,    phone),
      email      = COALESCE(excluded.email,    email),
      address    = COALESCE(excluded.address,  address),
      logo_url   = COALESCE(excluded.logo_url, logo_url),
      updated_at = excluded.updated_at
  `).bind(
    jwt.user_id,
    name     ?? null,
    phone    ?? null,
    email    ?? null,
    address  ?? null,
    logo_url ?? null,
    now,
  ).run()

  const profile = await db.prepare(
    'SELECT * FROM business_profile WHERE user_id = ?'
  ).bind(jwt.user_id).first()

  return apiJson({ ok: true, profile }, req)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
