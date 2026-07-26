// app/api/crash-report/route.ts
// POST /api/crash-report
// Accepts crash reports from the Flutter app, inserts into D1, and queues
// AI processing (grouping via Vectorize) via AI_QUEUE.

import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  // ── 1. Verify HMAC signature ─────────────────────────────────────────────
  const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
  if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)

  // ── 2. Parse body ────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const { device_id, app_version, version_code, error_type, stack_trace, description } = body

  // description or error_type is required to be useful
  if (!description && !error_type) {
    return errorJson('description or error_type is required', 400)
  }

  const db = getDB(env as Record<string, unknown>)

  // ── 3. Ensure crash_reports table exists (idempotent) ────────────────────
  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS crash_reports (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id    TEXT,
        app_version  TEXT,
        version_code INTEGER,
        error_type   TEXT,
        stack_trace  TEXT,
        description  TEXT,
        group_id     TEXT,
        ai_processed INTEGER DEFAULT 0,
        created_at   TEXT DEFAULT (datetime('now'))
      )
    `).run()
  } catch (e) {
    // Table may already exist — not fatal
    console.error('[crash-report] CREATE TABLE failed (may already exist):', (e as Error)?.message)
  }

  // ── 4. Insert crash report ────────────────────────────────────────────────
  let crashId: number | null = null
  try {
    const result = await db.prepare(`
      INSERT INTO crash_reports
        (device_id, app_version, version_code, error_type, stack_trace, description)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      device_id    ?? null,
      app_version  ?? null,
      version_code != null ? Number(version_code) : null,
      error_type   ?? null,
      typeof stack_trace === 'string' ? stack_trace.substring(0, 4000) : null,
      typeof description === 'string' ? description.substring(0, 2000) : null,
    ).run()

    // D1 returns last_row_id in meta
    crashId = (result.meta as Record<string, unknown>)?.last_row_id as number ?? null
  } catch (e) {
    console.error('[crash-report] INSERT failed:', (e as Error)?.message)
    return errorJson('Failed to save crash report', 500)
  }

  // ── 5. Queue AI processing ────────────────────────────────────────────────
  if (crashId !== null) {
    const aiQueue = (env as Record<string, unknown>).AI_QUEUE as { send(body: unknown): Promise<void> } | undefined
    if (aiQueue) {
      try {
        await aiQueue.send({
          type:        'process_crash',
          crashId,
          errorType:   error_type   ?? null,
          stackTrace:  stack_trace  ?? null,
          description: description  ?? null,
        })
      } catch (e) {
        // Non-fatal — crash is already saved
        console.error('[crash-report] Failed to queue AI processing:', (e as Error)?.message)
      }
    }
  }

  return secureJson({ ok: true, ts: Date.now() })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
