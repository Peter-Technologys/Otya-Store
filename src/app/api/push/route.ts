import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'
import { getFcmAccessToken, sendFcmToTokens } from '@/lib/fcm'

// POST /api/push — Admin-only: send FCM push notification
// Header: Authorization: Bearer YOUR_ADMIN_TOKEN
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

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const adminToken         = (env as Record<string, unknown>).ADMIN_TOKEN as string | undefined
  const serviceAccountJson = (env as Record<string, unknown>).FCM_SERVICE_ACCOUNT_JSON as string | undefined

  // Auth
  const authHeader = req.headers.get('authorization') ?? ''
  if (!adminToken || authHeader !== `Bearer ${adminToken}`) {
    return errorJson('Unauthorized', 401)
  }
  if (!serviceAccountJson) {
    return errorJson('FCM_SERVICE_ACCOUNT_JSON not configured', 503)
  }

  const body = await req.json() as Record<string, string>
  const { title, body: msgBody, url, deviceId } = body
  if (!title || !msgBody) {
    return errorJson('title and body required', 400)
  }

  const db = getDB(env as Record<string, unknown>)

  // Fetch FCM tokens
  let tokens: string[] = []
  if (deviceId) {
    const row = await db.prepare(
      'SELECT fcm_token FROM devices WHERE device_id = ? AND fcm_token IS NOT NULL'
    ).bind(deviceId).first<{ fcm_token: string }>()
    if (row?.fcm_token) tokens = [row.fcm_token]
  } else {
    const { results } = await db.prepare(
      'SELECT fcm_token FROM devices WHERE fcm_token IS NOT NULL LIMIT 500'
    ).all<{ fcm_token: string }>()
    tokens = results.map(r => r.fcm_token)
  }

  if (tokens.length === 0) {
    return secureJson({ ok: true, sent: 0, message: 'No registered devices', ts: Date.now() })
  }

  // Validate FCM credentials before sending (mints a token; sendFcmToTokens will mint again)
  try {
    await getFcmAccessToken(serviceAccountJson)
  } catch (e) {
    return errorJson(`Failed to obtain FCM access token: ${e}`, 503)
  }

  // Extract project_id from service account JSON
  const sa = JSON.parse(serviceAccountJson) as { project_id: string }
  const link = url ?? 'https://petersmartlink.com/download'

  // Send via shared FCM helper
  const { sent, failed } = await sendFcmToTokens(
    tokens,
    title,
    msgBody,
    link,
    serviceAccountJson,
    sa.project_id,
  )

  return secureJson({ ok: true, sent, failed, total: tokens.length, ts: Date.now() })
}
