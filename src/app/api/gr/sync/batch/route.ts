/**
 * POST /api/gr/sync/batch  — batch sync for offline GR App data
 *
 * Auth: Group-level (X-Group-Secret + group_code in body).
 * Rate limiting: 100 req/min per group_code.
 *
 * Body:
 *   group_code    string        required
 *   transactions  Transaction[] optional  — array of transaction objects
 *   members       Member[]      optional  — array of member objects
 *
 * Each item is upserted (INSERT OR IGNORE) so duplicate syncs are idempotent.
 * Returns counts of inserted rows per entity type.
 *
 * This endpoint is designed for offline-first sync: the app queues operations
 * locally and sends them in a batch when connectivity is restored.
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
} from '@/lib/smartpos-helpers'

interface SyncTransaction {
  id?:             string
  ref?:            string
  account_number?: string
  member_name?:    string
  cashier_name?:   string
  type?:           string
  amount?:         number
  denominations?:  Record<string, number>
  notes?:          string
  created_at?:     string
}

interface SyncMember {
  id?:             string
  account_number?: string
  name?:           string
  phone?:          string
  gender?:         string
  joined_at?:      string
  created_at?:     string
}

const VALID_TX_TYPES = new Set(['deposit', 'withdrawal', 'loan', 'repayment', 'fine', 'other'])

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const body = await readJsonBody(req)
  if (!body.ok) return apiErr(body.error, req, body.status)

  const { group_code, transactions, members } = body.data as {
    group_code?:   string
    transactions?: SyncTransaction[]
    members?:      SyncMember[]
  }

  if (!group_code || typeof group_code !== 'string') {
    return apiErr('group_code is required', req)
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

  const now = new Date().toISOString()
  let txInserted  = 0
  let memInserted = 0
  const errors: string[] = []

  // ── Sync transactions ─────────────────────────────────────────────────────
  if (Array.isArray(transactions)) {
    for (const tx of transactions) {
      if (!tx.account_number || !tx.type || tx.amount == null) {
        errors.push(`Skipped transaction (missing required fields): ${JSON.stringify(tx)}`)
        continue
      }
      if (!VALID_TX_TYPES.has(tx.type)) {
        errors.push(`Skipped transaction (invalid type "${tx.type}"): ref=${tx.ref}`)
        continue
      }

      const id  = tx.id  ?? crypto.randomUUID()
      const ref = tx.ref ?? `TX-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

      try {
        const result = await db.prepare(`
          INSERT OR IGNORE INTO gr_transactions
            (id, ref, group_code, account_number, member_name, cashier_name, type, amount, denominations_json, notes, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          ref,
          code,
          tx.account_number.trim(),
          tx.member_name  ?? null,
          tx.cashier_name ?? null,
          tx.type,
          tx.amount,
          JSON.stringify(tx.denominations ?? {}),
          tx.notes ?? null,
          tx.created_at ?? now,
        ).run()
        txInserted += result.meta.changes ?? 0
      } catch (e) {
        errors.push(`Transaction error (ref=${ref}): ${(e as Error)?.message}`)
      }
    }
  }

  // ── Sync members ──────────────────────────────────────────────────────────
  if (Array.isArray(members)) {
    for (const m of members) {
      if (!m.account_number || !m.name) {
        errors.push(`Skipped member (missing required fields): ${JSON.stringify(m)}`)
        continue
      }

      const id = m.id ?? crypto.randomUUID()

      try {
        const result = await db.prepare(`
          INSERT OR IGNORE INTO gr_members
            (id, group_code, account_number, name, phone, gender, joined_at, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          id,
          code,
          m.account_number.trim(),
          m.name.trim(),
          m.phone     ?? null,
          m.gender    ?? null,
          m.joined_at ?? null,
          m.created_at ?? now,
        ).run()
        memInserted += result.meta.changes ?? 0
      } catch (e) {
        errors.push(`Member error (account=${m.account_number}): ${(e as Error)?.message}`)
      }
    }
  }

  return apiJson({
    ok: true,
    inserted: {
      transactions: txInserted,
      members:      memInserted,
    },
    errors: errors.length > 0 ? errors : undefined,
  }, req)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
