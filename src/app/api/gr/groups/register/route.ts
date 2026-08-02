/**
 * POST /api/gr/groups/register  — register a new VSLA group
 *
 * Auth: None (public endpoint — group is created with a secret that is then
 *       used for all subsequent GR App requests).
 *
 * Body:
 *   name     string  required  — group display name
 *   code     string  required  — unique short code (e.g. "GRP001")
 *   location string  optional
 *   secret   string  required  — group secret (min 12 chars); stored as SHA-256 hash
 *
 * Rate limiting: 100 req/min per group_code (via KV).
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDB, getKV } from '@/lib/d1'
import {
  readJsonBody,
  apiJson,
  apiErr,
  apiOptions,
  hashGroupSecret,
  checkGrRateLimit,
} from '@/lib/smartpos-helpers'

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const body = await readJsonBody(req)
  if (!body.ok) return apiErr(body.error, req, body.status)

  const { name, code, location, secret } = body.data as {
    name?:     string
    code?:     string
    location?: string
    secret?:   string
  }

  // ── Input validation ──────────────────────────────────────────────────────
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return apiErr('name is required', req)
  }
  if (!code || typeof code !== 'string' || code.trim().length === 0) {
    return apiErr('code is required', req)
  }
  if (!/^[A-Z0-9_-]{3,20}$/i.test(code.trim())) {
    return apiErr('code must be 3–20 alphanumeric characters (hyphens/underscores allowed)', req)
  }
  if (!secret || typeof secret !== 'string' || secret.length < 12) {
    return apiErr('secret must be at least 12 characters', req)
  }

  // Rate limit by code
  const kv = getKV(env as Record<string, unknown>)
  const allowed = await checkGrRateLimit(kv, code.trim().toUpperCase())
  if (!allowed) return apiErr('Rate limit exceeded. Try again in 1 minute.', req, 429)

  const secretHash = await hashGroupSecret(secret)
  const id         = crypto.randomUUID()
  const now        = new Date().toISOString()
  const db         = getDB(env as Record<string, unknown>)

  try {
    await db.prepare(`
      INSERT INTO gr_groups (id, name, code, location, secret_hash, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      name.trim(),
      code.trim().toUpperCase(),
      location ?? null,
      secretHash,
      now,
    ).run()
  } catch (e) {
    const msg = (e as Error)?.message ?? ''
    if (msg.includes('UNIQUE') || msg.includes('unique')) {
      return apiErr('Group code already exists', req, 409)
    }
    throw e
  }

  return apiJson({ ok: true, id, code: code.trim().toUpperCase() }, req, 201)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
