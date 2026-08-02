/**
 * POST /api/gr/transactions  — record a VSLA transaction
 * GET  /api/gr/transactions  — list transactions for a group (paginated)
 *
 * Auth: Group-level — X-Group-Secret header + group_code in body/query.
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

/** Verify group secret from X-Group-Secret header against stored hash. */
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

  const {
    group_code,
    account_number,
    member_name,
    cashier_name,
    type,
    amount,
    denominations,
    notes,
    ref,
  } = body.data as {
    group_code?:     string
    account_number?: string
    member_name?:    string
    cashier_name?:   string
    type?:           string
    amount?:         number
    denominations?:  Record<string, number>
    notes?:          string
    ref?:            string
  }

  // ── Input validation ──────────────────────────────────────────────────────
  if (!group_code || typeof group_code !== 'string') {
    return apiErr('group_code is required', req)
  }
  if (!account_number || typeof account_number !== 'string') {
    return apiErr('account_number is required', req)
  }
  if (!type || !['deposit', 'withdrawal', 'loan', 'repayment', 'fine', 'other'].includes(type)) {
    return apiErr('type must be one of: deposit, withdrawal, loan, repayment, fine, other', req)
  }
  if (amount == null || typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    return apiErr('amount must be a positive number', req)
  }

  const code = group_code.trim().toUpperCase()

  // Rate limit
  const kv      = getKV(env as Record<string, unknown>)
  const allowed = await checkGrRateLimit(kv, code)
  if (!allowed) return apiErr('Rate limit exceeded. Try again in 1 minute.', req, 429)

  // Auth
  const auth = await authGroup(req, code, env)
  if (!auth.ok) return apiErr(auth.error, req, auth.status)

  const id  = crypto.randomUUID()
  const txRef = ref ?? `TX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`
  const now = new Date().toISOString()
  const db  = getDB(env as Record<string, unknown>)

  try {
    await db.prepare(`
      INSERT INTO gr_transactions
        (id, ref, group_code, account_number, member_name, cashier_name, type, amount, denominations_json, notes, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      txRef,
      code,
      account_number.trim(),
      member_name  ?? null,
      cashier_name ?? null,
      type,
      amount,
      JSON.stringify(denominations ?? {}),
      notes ?? null,
      now,
    ).run()
  } catch (e) {
    const msg = (e as Error)?.message ?? ''
    if (msg.includes('UNIQUE') || msg.includes('unique')) {
      return apiErr('Transaction ref already exists', req, 409)
    }
    throw e
  }

  return apiJson({ ok: true, id, ref: txRef }, req, 201)
}

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const url       = new URL(req.url)
  const groupCode = url.searchParams.get('group_code')?.trim().toUpperCase()

  if (!groupCode) return apiErr('group_code query parameter is required', req)

  // Rate limit
  const kv      = getKV(env as Record<string, unknown>)
  const allowed = await checkGrRateLimit(kv, groupCode)
  if (!allowed) return apiErr('Rate limit exceeded. Try again in 1 minute.', req, 429)

  // Auth
  const auth = await authGroup(req, groupCode, env)
  if (!auth.ok) return apiErr(auth.error, req, auth.status)

  const { page, limit, offset } = parsePagination(url)
  const account = url.searchParams.get('account_number') ?? null

  const db = getDB(env as Record<string, unknown>)

  let rows: unknown[]
  let total: number

  if (account) {
    const [dataRes, countRes] = await Promise.all([
      db.prepare(
        'SELECT * FROM gr_transactions WHERE group_code = ? AND account_number = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(groupCode, account, limit, offset).all(),
      db.prepare(
        'SELECT COUNT(*) as cnt FROM gr_transactions WHERE group_code = ? AND account_number = ?'
      ).bind(groupCode, account).first<{ cnt: number }>(),
    ])
    rows  = dataRes.results
    total = countRes?.cnt ?? 0
  } else {
    const [dataRes, countRes] = await Promise.all([
      db.prepare(
        'SELECT * FROM gr_transactions WHERE group_code = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(groupCode, limit, offset).all(),
      db.prepare(
        'SELECT COUNT(*) as cnt FROM gr_transactions WHERE group_code = ?'
      ).bind(groupCode).first<{ cnt: number }>(),
    ])
    rows  = dataRes.results
    total = countRes?.cnt ?? 0
  }

  return withEtag({ transactions: rows, total, page, limit }, req)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
