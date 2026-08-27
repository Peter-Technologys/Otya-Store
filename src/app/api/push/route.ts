import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'
import { getFcmAccessToken, sendFcmWithToken } from '@/lib/fcm'

// POST /api/push — Admin-only: send FCM push notification.
// Admin requests remain protected by the Worker-side HMAC/admin secret; this
// secret is never embedded in the Flutter APK.
//
// Body:
// {
//   "title":    "New update!",
//   "body":     "OTYA Player v1.5.0 is available.",
//   "url":      "https://petersmartlink.com/download/otya-player", // optional
//   "deviceId": "abc123"                                         // optional
// }

const CHUNK_SIZE = 100
const OTYA_DOWNLOAD_URL = 'https://petersmartlink.com/download/otya-player'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
  if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)

  const serviceAccountJson = (env as Record<string, unknown>).FCM_SERVICE_ACCOUNT_JSON as string | undefined
  if (!serviceAccountJson) {
    return errorJson('FCM_SERVICE_ACCOUNT_JSON not configured', 503)
  }

  let body: Record<string, string>
  try {
    body = await req.json() as Record<string, string>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const { title, body: msgBody, url, deviceId } = body
  if (!title || !msgBody) {
    return errorJson('title and body required', 400)
  }

  const db = getDB(env as Record<string, unknown>)

  let tokens: string[] = []
  if (deviceId) {
    const row = await db.prepare(
      'SELECT fcm_token FROM devices WHERE device_id = ? AND fcm_token IS NOT NULL'
    ).bind(deviceId).first<{ fcm_token: string }>()
    if (row?.fcm_token) tokens = [row.fcm_token]
  } else {
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

  // Avoid duplicate sends when the same token was accidentally registered on
  // more than one stale device row.
  tokens = [...new Set(tokens.filter(Boolean))]

  if (tokens.length === 0) {
    return secureJson({ ok: true, sent: 0, message: 'No registered devices', ts: Date.now() })
  }

  const sa = JSON.parse(serviceAccountJson) as { project_id: string }
  const link = url?.trim() || OTYA_DOWNLOAD_URL

  let accessToken: string
  try {
    accessToken = await getFcmAccessToken(serviceAccountJson)
  } catch (e) {
    console.error('[push] Failed to obtain FCM access token:', e)
    return errorJson('FCM authentication failed', 503)
  }

  let totalSent   = 0
  let totalFailed = 0

  for (let i = 0; i < tokens.length; i += CHUNK_SIZE) {
    const chunk = tokens.slice(i, i + CHUNK_SIZE)
    try {
      const { sent, failed } = await sendFcmWithToken(
        chunk,
        title,
        msgBody,
        link,
        accessToken,
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
