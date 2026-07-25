import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'
import { sendFcmToTokens } from '@/lib/fcm'

// POST /api/push — Admin-only: send FCM push notification
// Uses the same HMAC auth as all other endpoints (X-Otya-Timestamp + X-Otya-Signature).
//
// Body:
// {
//   "title":    "New update!",
//   "body":     "OTYA Player v1.5.0 is available.",
//   "url":      "https://petersmartlink.com/download",  // optional
//   "deviceId": "abc123"                                // optional — omit to broadcast all
// }
//
// Uses FCM HTTP v1 API with OAuth2 service account credentials.
// Set FCM_SERVICE_ACCOUNT_JSON to the Firebase service account JSON key (Worker secret).

const CHUNK_SIZE = 100  // FCM v1 processes tokens in batches; keep chunks small for reliability

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  // ── 1. Verify HMAC (consistent with all other endpoints) ─────────────────
  const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
  if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)

  const serviceAccountJson = (env as Record<string, unknown>).FCM_SERVICE_ACCOUNT_JSON as string | undefined
  if (!serviceAccountJson) {
    return errorJson('FCM_SERVICE_ACCOUNT_JSON not configured', 503)
  }

  const body = await req.json() as Record<string, string>
  const { title, body: msgBody, url, deviceId } = body
  if (!title || !msgBody) {
    return errorJson('title and body required', 400)
  }

  const db = getDB(env as Record<string, unknown>)

  // ── 2. Fetch FCM tokens (paginated — no hardcoded LIMIT 500) ─────────────
  let tokens: string[] = []
  if (deviceId) {
    const row = await db.prepare(
      'SELECT fcm_token FROM devices WHERE device_id = ? AND fcm_token IS NOT NULL'
    ).bind(deviceId).first<{ fcm_token: string }>()
    if (row?.fcm_token) tokens = [row.fcm_token]
  } else {
    // Paginate through all devices in batches of 1000
    let offset = 0
    const pageSize = 1000
    while (true) {
      const { results } = await db.prepare(
        'SELECT fcm_token FROM devices WHERE fcm_token IS NOT NULL LIMIT ? OFFSET ?'
      ).bind(pageSize, offset).all<{ fcm_token: string }>()
      tokens.push(...results.map(r => r.fcm_token))
      if (results.length < pageSize) break
      offset += pageSize
    }
  }

  if (tokens.length === 0) {
    return secureJson({ ok: true, sent: 0, message: 'No registered devices', ts: Date.now() })
  }

  const sa = JSON.parse(serviceAccountJson) as { project_id: string }
  const link = url ?? 'https://petersmartlink.com/download'

  // ── 3. Send in chunks — single pass through sendFcmToTokens per chunk ────
  let totalSent   = 0
  let totalFailed = 0

  for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
    const chunk = tokens.slice(i, i + CHUNK_SIZE)
    try {
      const { sent, failed } = await sendFcmToTokens(
        chunk,
        title,
        msgBody,
        link,
        serviceAccountJson,
        sa.project_id,
      )
      totalSent   += sent
      totalFailed += failed
    } catch (e) {
      console.error(`[push] chunk ${i}–${i + CHUNK_SIZE} failed:`, e)
      totalFailed += chunk.length
    }
  }

  return secureJson({ ok: true, sent: totalSent, failed: totalFailed, total: tokens.length, ts: Date.now() })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
