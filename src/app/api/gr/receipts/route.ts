/**
 * GET /api/gr/receipts  — retrieve a stored receipt from R2
 *
 * Query params:
 *   group      string  required  — group code
 *   account    string  optional  — filter by account number
 *   tx_id      string  optional  — specific transaction UUID
 *
 * Auth: Group-level (X-Group-Secret header).
 * Rate limiting: 100 req/min per group_code.
 *
 * If tx_id is provided: returns the receipt text for that transaction.
 * Otherwise: returns a list of transactions with receipt_r2_key set.
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDB, getKV } from '@/lib/d1'
import {
  parsePagination,
  apiJson,
  apiErr,
  apiOptions,
  verifyGroupSecret,
  checkGrRateLimit,
  isValidUuid,
} from '@/lib/smartpos-helpers'

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const url       = new URL(req.url)
  const groupCode = url.searchParams.get('group')?.trim().toUpperCase()
  const account   = url.searchParams.get('account') ?? null
  const txId      = url.searchParams.get('tx_id')   ?? null

  if (!groupCode) return apiErr('group query parameter is required', req)

  // Rate limit
  const kv      = getKV(env as Record<string, unknown>)
  const allowed = await checkGrRateLimit(kv, groupCode)
  if (!allowed) return apiErr('Rate limit exceeded. Try again in 1 minute.', req, 429)

  // Auth
  const provided = req.headers.get('X-Group-Secret')
  if (!provided) return apiErr('X-Group-Secret header required', req, 401)

  const db    = getDB(env as Record<string, unknown>)
  const group = await db.prepare(
    'SELECT secret_hash FROM gr_groups WHERE code = ?'
  ).bind(groupCode).first<{ secret_hash: string }>()

  if (!group) return apiErr('Group not found', req, 404)

  const valid = await verifyGroupSecret(provided, group.secret_hash)
  if (!valid) return apiErr('Invalid group secret', req, 401)

  // ── Single receipt fetch ──────────────────────────────────────────────────
  if (txId) {
    if (!isValidUuid(txId)) return apiErr('tx_id must be a valid UUID', req)

    const tx = await db.prepare(
      'SELECT receipt_r2_key FROM gr_transactions WHERE id = ? AND group_code = ?'
    ).bind(txId, groupCode).first<{ receipt_r2_key: string | null }>()

    if (!tx) return apiErr('Transaction not found', req, 404)
    if (!tx.receipt_r2_key) return apiErr('No receipt stored for this transaction', req, 404)

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const r2 = (env as any).GR_RECEIPTS as R2Bucket | undefined
    if (!r2) return apiErr('Receipt storage not available', req, 503)

    const obj = await r2.get(tx.receipt_r2_key)
    if (!obj) return apiErr('Receipt file not found in storage', req, 404)

    const text = await obj.text()
    return apiJson({ ok: true, receipt_text: text, r2_key: tx.receipt_r2_key }, req)
  }

  // ── List receipts ─────────────────────────────────────────────────────────
  const { page, limit, offset } = parsePagination(url)

  let rows: unknown[]
  let total: number

  if (account) {
    const [dataRes, countRes] = await Promise.all([
      db.prepare(
        'SELECT id, ref, account_number, type, amount, receipt_r2_key, created_at FROM gr_transactions WHERE group_code = ? AND account_number = ? AND receipt_r2_key IS NOT NULL ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(groupCode, account, limit, offset).all(),
      db.prepare(
        'SELECT COUNT(*) as cnt FROM gr_transactions WHERE group_code = ? AND account_number = ? AND receipt_r2_key IS NOT NULL'
      ).bind(groupCode, account).first<{ cnt: number }>(),
    ])
    rows  = dataRes.results
    total = countRes?.cnt ?? 0
  } else {
    const [dataRes, countRes] = await Promise.all([
      db.prepare(
        'SELECT id, ref, account_number, type, amount, receipt_r2_key, created_at FROM gr_transactions WHERE group_code = ? AND receipt_r2_key IS NOT NULL ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(groupCode, limit, offset).all(),
      db.prepare(
        'SELECT COUNT(*) as cnt FROM gr_transactions WHERE group_code = ? AND receipt_r2_key IS NOT NULL'
      ).bind(groupCode).first<{ cnt: number }>(),
    ])
    rows  = dataRes.results
    total = countRes?.cnt ?? 0
  }

  return apiJson({ receipts: rows, total, page, limit }, req)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
