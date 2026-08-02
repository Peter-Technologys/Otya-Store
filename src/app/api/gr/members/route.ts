/**
 * POST /api/gr/members  — register a new VSLA group member
 * GET  /api/gr/members  — list members for a group
 *
 * Auth: Group-level (X-Group-Secret + group_code in body/query).
 * Rate limiting: 100 req/min per group_code.
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDB, getKV } from '@/lib/d1'
import {
  readJsonBody,
  parsePagination,
  apiJson,
  apiErr,
  apiOptions,
  withEtag,
  verifyGroupSecret,
  checkGrRateLimit,
} from '@/lib/smartpos-helpers'

async function authGroup(
  req: NextRequest,
  groupCode: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  env: any,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const provided = req.headers.get('X-Group-Secret')
  if (!provided) return { ok: false, error: 'X-Group-Secret header required', status: 401 }

  const db    = getDB(env as Record<string, unknown>)
  const group = await db.prepare(
    'SELECT secret_hash FROM gr_groups WHERE code = ?'
  ).bind(groupCode).first<{ secret_hash: string }>()

  if (!group) return { ok: false, error: 'Group not found', status: 404 }

  const valid = await verifyGroupSecret(provided, group.secret_hash)
  if (!valid) return { ok: false, error: 'Invalid group secret', status: 401 }

  return { ok: true }
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const body = await readJsonBody(req)
  if (!body.ok) return apiErr(body.error, req, body.status)

  const { group_code, account_number, name, phone, gender, joined_at } = body.data as {
    group_code?:     string
    account_number?: string
    name?:           string
    phone?:          string
    gender?:         string
    joined_at?:      string
  }

  if (!group_code || typeof group_code !== 'string') {
    return apiErr('group_code is required', req)
  }
  if (!account_number || typeof account_number !== 'string' || account_number.trim().length === 0) {
    return apiErr('account_number is required', req)
  }
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return apiErr('name is required', req)
  }

  const code = group_code.trim().toUpperCase()

  const kv      = getKV(env as Record<string, unknown>)
  const allowed = await checkGrRateLimit(kv, code)
  if (!allowed) return apiErr('Rate limit exceeded. Try again in 1 minute.', req, 429)

  const auth = await authGroup(req, code, env)
  if (!auth.ok) return apiErr(auth.error, req, auth.status)

  const id  = crypto.randomUUID()
  const now = new Date().toISOString()
  const db  = getDB(env as Record<string, unknown>)

  try {
    await db.prepare(`
      INSERT INTO gr_members (id, group_code, account_number, name, phone, gender, joined_at, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      code,
      account_number.trim(),
      name.trim(),
      phone     ?? null,
      gender    ?? null,
      joined_at ?? null,
      now,
    ).run()
  } catch (e) {
    const msg = (e as Error)?.message ?? ''
    if (msg.includes('UNIQUE') || msg.includes('unique')) {
      return apiErr('Member with this account number already exists in the group', req, 409)
    }
    throw e
  }

  return apiJson({ ok: true, id }, req, 201)
}

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const url       = new URL(req.url)
  const groupCode = url.searchParams.get('group')?.trim().toUpperCase()

  if (!groupCode) return apiErr('group query parameter is required', req)

  const kv      = getKV(env as Record<string, unknown>)
  const allowed = await checkGrRateLimit(kv, groupCode)
  if (!allowed) return apiErr('Rate limit exceeded. Try again in 1 minute.', req, 429)

  const auth = await authGroup(req, groupCode, env)
  if (!auth.ok) return apiErr(auth.error, req, auth.status)

  const { page, limit, offset } = parsePagination(url)
  const db = getDB(env as Record<string, unknown>)

  const [dataRes, countRes] = await Promise.all([
    db.prepare(
      'SELECT * FROM gr_members WHERE group_code = ? ORDER BY name ASC LIMIT ? OFFSET ?'
    ).bind(groupCode, limit, offset).all(),
    db.prepare(
      'SELECT COUNT(*) as cnt FROM gr_members WHERE group_code = ?'
    ).bind(groupCode).first<{ cnt: number }>(),
  ])

  return withEtag({ members: dataRes.results, total: countRes?.cnt ?? 0, page, limit }, req)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
