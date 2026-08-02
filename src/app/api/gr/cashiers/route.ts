/**
 * POST /api/gr/cashiers  — register a cashier for a VSLA group
 *
 * Auth: Group-level (X-Group-Secret + group_code in body).
 * Rate limiting: 100 req/min per group_code.
 *
 * Body:
 *   group_code  string  required
 *   name        string  required
 *   phone       string  optional
 *   pin         string  required  — 4–8 digit PIN; stored as SHA-256 hash
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDB, getKV } from '@/lib/d1'
import {
  readJsonBody,
  apiJson,
  apiErr,
  apiOptions,
  verifyGroupSecret,
  hashGroupSecret,
  checkGrRateLimit,
} from '@/lib/smartpos-helpers'

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const body = await readJsonBody(req)
  if (!body.ok) return apiErr(body.error, req, body.status)

  const { group_code, name, phone, pin } = body.data as {
    group_code?: string
    name?:       string
    phone?:      string
    pin?:        string
  }

  if (!group_code || typeof group_code !== 'string') {
    return apiErr('group_code is required', req)
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return apiErr('name is required', req)
  }
  if (!pin || typeof pin !== 'string' || !/^\d{4,8}$/.test(pin)) {
    return apiErr('pin must be 4–8 digits', req)
  }

  const code = group_code.trim().toUpperCase()

  const kv      = getKV(env as Record<string, unknown>)
  const allowed = await checkGrRateLimit(kv, code)
  if (!allowed) return apiErr('Rate limit exceeded. Try again in 1 minute.', req, 429)

  // Auth
  const provided = req.headers.get('X-Group-Secret')
  if (!provided) return apiErr('X-Group-Secret header required', req, 401)

  const db    = getDB(env as Record<string, unknown>)
  const group = await db.prepare(
    'SELECT secret_hash FROM gr_groups WHERE code = ?'
  ).bind(code).first<{ secret_hash: string }>()

  if (!group) return apiErr('Group not found', req, 404)

  const valid = await verifyGroupSecret(provided, group.secret_hash)
  if (!valid) return apiErr('Invalid group secret', req, 401)

  const pinHash = await hashGroupSecret(pin)
  const id      = crypto.randomUUID()
  const now     = new Date().toISOString()

  await db.prepare(`
    INSERT INTO gr_cashiers (id, group_code, name, phone, pin_hash, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(id, code, name.trim(), phone ?? null, pinHash, now).run()

  return apiJson({ ok: true, id }, req, 201)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
