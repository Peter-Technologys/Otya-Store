// app/api/crash-report/route.ts
// POST /api/crash-report
// Accepts crash reports from the Flutter app, inserts into D1, and queues
// AI processing (grouping via Vectorize) via AI_QUEUE.
//
// Crash capture runs before login, so anonymous telemetry is supported.
// A verified JWT may associate a report with its user; anonymous requests can
// never supply or spoof a trusted user identity.

import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { dualAuth } from '@/lib/auth-service'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
}

function text(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const cleaned = value.trim()
  return cleaned ? cleaned.slice(0, max) : null
}

function integer(value: unknown): number | null {
  if (value == null) return null
  const parsed = Number(value)
  return Number.isFinite(parsed) ? Math.max(0, Math.trunc(parsed)) : null
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  // JWT/HMAC are used when available, but crash capture must also work before
  // sign-in. Never trust a body user_id; only a verified JWT establishes it.
  const auth = await dualAuth(req, env, verifyRequest)

  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const deviceId    = text(body.device_id, 128)
  const appVersion  = text(body.app_version, 64)
  const versionCode = integer(body.version_code)
  const errorType   = text(body.error_type, 160)
  const stackTrace  = text(body.stack_trace, 4000)
  const description = text(body.description, 2000)

  if (!description && !errorType) {
    return errorJson('description or error_type is required', 400)
  }

  const userId = auth.mode === 'jwt' ? auth.user_id : null
  const db = getDB(env as Record<string, unknown>)

  try {
    await db.prepare(`
      CREATE TABLE IF NOT EXISTS crash_reports (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        device_id    TEXT,
        user_id      TEXT,
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
    console.error('[crash-report] CREATE TABLE failed:', (e as Error)?.message)
  }

  let crashId: number | null = null
  try {
    const result = await db.prepare(`
      INSERT INTO crash_reports
        (device_id, user_id, app_version, version_code, error_type, stack_trace, description)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      deviceId,
      userId,
      appVersion,
      versionCode,
      errorType,
      stackTrace,
      description,
    ).run()

    crashId = (result.meta as Record<string, unknown>)?.last_row_id as number ?? null
  } catch (e) {
    console.error('[crash-report] INSERT failed:', (e as Error)?.message)
    return errorJson('Failed to save crash report', 500)
  }

  if (crashId !== null) {
    const aiQueue = (env as Record<string, unknown>).AI_QUEUE as { send(body: unknown): Promise<void> } | undefined
    if (aiQueue) {
      try {
        await aiQueue.send({
          type:        'process_crash',
          crashId,
          errorType,
          stackTrace,
          description,
        })
      } catch (e) {
        console.error('[crash-report] Failed to queue AI processing:', (e as Error)?.message)
      }
    }
  }

  return secureJson({
    ok: true,
    authenticated: auth.mode !== 'none',
    ts: Date.now(),
  })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
