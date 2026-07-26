// app/api/internal/delete-user/route.ts
// POST /internal/delete-user
//
// Internal endpoint called by the Auth Worker after a user deletes their account.
// Deletes all user data from Otya-Store's D1 database.
//
// Auth: INTERNAL_SECRET header (shared secret between Auth Worker and Otya-Store).
//       NOT exposed to the public — only callable by the Auth Worker via fetch().
//
// Body: { user_id: string }
// Response: { ok: true, deleted: { table: string, rows: number }[] }

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

// Tables to purge when a user deletes their account.
// Order matters: delete from child tables before parent tables if there are FKs.
const USER_TABLES = [
  'play_history',
  'playlists',
  'bookmarks',
  'eq_presets',
  'user_preferences',
  'pro_status',
  'ratings',
  'feedback',
  'crash_reports',
  'devices',
] as const

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  // ── 1. Verify internal secret ────────────────────────────────────────────
  const internalSecret = (env as Record<string, unknown>).INTERNAL_SECRET as string | undefined
  if (!internalSecret) {
    console.error('[internal/delete-user] INTERNAL_SECRET not configured')
    return errorJson('Internal server error', 500)
  }

  const providedSecret =
    req.headers.get('X-Internal-Secret') ??
    req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')

  if (!providedSecret || providedSecret !== internalSecret) {
    return errorJson('Unauthorized', 401)
  }

  // ── 2. Parse body ────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const { user_id } = body as { user_id?: string }
  if (!user_id || typeof user_id !== 'string') {
    return errorJson('user_id is required', 400)
  }

  const db = getDB(env as Record<string, unknown>)

  // ── 3. Delete all user data ───────────────────────────────────────────────
  const deleted: { table: string; rows: number }[] = []

  for (const table of USER_TABLES) {
    try {
      const result = await db.prepare(
        `DELETE FROM ${table} WHERE user_id = ?`
      ).bind(user_id).run()
      deleted.push({ table, rows: result.meta.changes ?? 0 })
    } catch (e) {
      // Table may not exist yet (e.g. crash_reports on a fresh DB) — not fatal
      console.error(`[internal/delete-user] DELETE from ${table} failed:`, (e as Error)?.message)
      deleted.push({ table, rows: 0 })
    }
  }

  console.log(`[internal/delete-user] Deleted all data for user ${user_id}:`, deleted)

  return secureJson({ ok: true, user_id, deleted })
}
