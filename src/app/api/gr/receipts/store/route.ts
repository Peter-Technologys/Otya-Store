/**
 * POST /api/gr/receipts/store  — store a receipt text in R2
 *
 * Auth: Group-level (X-Group-Secret + group_code in body).
 * Rate limiting: 100 req/min per group_code.
 *
 * Body:
 *   group_code     string  required
 *   transaction_id string  required  — UUID of the gr_transactions row
 *   receipt_text   string  required  — plain-text receipt content
 *
 * Stores the receipt in R2 under key: gr-receipts/{group_code}/{transaction_id}.txt
 * Updates gr_transactions.receipt_r2_key with the R2 key.
 *
 * Requires R2 binding GR_RECEIPTS in wrangler.toml (main app).
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
  checkGrRateLimit,
  isValidUuid,
} from '@/lib/smartpos-helpers'

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const body = await readJsonBody(req)
  if (!body.ok) return apiErr(body.error, req, body.status)

  const { group_code, transaction_id, receipt_text } = body.data as {
    group_code?:     string
    transaction_id?: string
    receipt_text?:   string
  }

  // ── Input validation ──────────────────────────────────────────────────────
  if (!group_code || typeof group_code !== 'string') {
    return apiErr('group_code is required', req)
  }
  if (!transaction_id || !isValidUuid(transaction_id)) {
    return apiErr('transaction_id must be a valid UUID', req)
  }
  if (!receipt_text || typeof receipt_text !== 'string' || receipt_text.trim().length === 0) {
    return apiErr('receipt_text is required', req)
  }

  const code = group_code.trim().toUpperCase()

  // Rate limit
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

  // Verify the transaction belongs to this group
  const tx = await db.prepare(
    'SELECT id FROM gr_transactions WHERE id = ? AND group_code = ?'
  ).bind(transaction_id, code).first<{ id: string }>()

  if (!tx) return apiErr('Transaction not found', req, 404)

  // ── Store in R2 ───────────────────────────────────────────────────────────
  const r2Key = `gr-receipts/${code}/${transaction_id}.txt`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const r2 = (env as any).GR_RECEIPTS as R2Bucket | undefined

  if (!r2) {
    console.error('[gr/receipts/store] GR_RECEIPTS R2 binding not configured')
    return apiErr('Receipt storage not available', req, 503)
  }

  await r2.put(r2Key, receipt_text.trim(), {
    httpMetadata: { contentType: 'text/plain; charset=utf-8' },
    customMetadata: { group_code: code, transaction_id },
  })

  // Update the transaction row with the R2 key
  await db.prepare(
    'UPDATE gr_transactions SET receipt_r2_key = ? WHERE id = ? AND group_code = ?'
  ).bind(r2Key, transaction_id, code).run()

  return apiJson({ ok: true, r2_key: r2Key }, req, 201)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
