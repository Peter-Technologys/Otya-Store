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

// POST /api/feedback — body: { device_id, app_version, version_code, category?, description, user_email? }
// Inserts into feedback table and queues AI categorization via AI_QUEUE.
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
  if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)

  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const { device_id, app_version, version_code, category, description, user_email } = body

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return errorJson('description is required', 400)
  }

  const db = getDB(env as Record<string, unknown>)

  // ── Insert feedback row ───────────────────────────────────────────────────
  const result = await db.prepare(`
    INSERT INTO feedback (device_id, app_version, version_code, category, description, user_email)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    device_id   ?? null,
    app_version ?? null,
    version_code != null ? Number(version_code) : null,
    category    ?? null,
    description.trim(),
    user_email  ?? null,
  ).run()

  // ── Queue AI categorization + moderation ─────────────────────────────────
  const feedbackId = (result.meta as Record<string, unknown>)?.last_row_id as number | undefined
  const aiQueue = (env as Record<string, unknown>).AI_QUEUE as { send(body: unknown): Promise<void> } | undefined

  if (feedbackId && aiQueue) {
    // Queue moderation check (runs first — will delete row if spam/abuse)
    try {
      await aiQueue.send({
        type:        'moderate_feedback',
        feedbackId,
        description: description.trim(),
      })
    } catch (e) {
      console.error('[feedback] Failed to queue AI moderation:', (e as Error)?.message)
    }

    // Queue categorization (runs after moderation; if row was deleted, UPDATE is a no-op)
    try {
      await aiQueue.send({
        type:        'categorize_feedback',
        feedbackId,
        description: description.trim(),
      })
    } catch (e) {
      // Non-fatal — feedback is already saved
      console.error('[feedback] Failed to queue AI categorization:', (e as Error)?.message)
    }
  }

  return secureJson({ ok: true, ts: Date.now() })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
