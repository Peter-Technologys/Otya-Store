// app/api/pro/churn/route.ts
// POST /api/pro/churn
// Protected by ADMIN_TOKEN (Authorization: Bearer <token> or ?token=<token>).
//
// Queries D1 for all pro users expiring within 72 hours and sends each an
// FCM push notification via the Firebase v1 API using a service account JWT.
//
// Body: { dryRun?: boolean }
// Response: { sent: number, dryRun: boolean, users: string[] }

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'
import { getFcmAccessToken, sendFcmWithToken } from '@/lib/fcm'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/** Check ADMIN_TOKEN from Authorization header or ?token= query param. */
function isAuthorized(req: NextRequest, env: Record<string, unknown>): boolean {
  const adminToken = env.ADMIN_TOKEN as string | undefined
  if (!adminToken) return false
  const url   = new URL(req.url)
  const token =
    url.searchParams.get('token') ??
    req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  return token === adminToken
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  if (!isAuthorized(req, env as Record<string, unknown>)) {
    return errorJson('Unauthorized', 401)
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown> = {}
  try {
    const text = await req.text()
    if (text.trim()) body = JSON.parse(text) as Record<string, unknown>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const dryRun = body.dryRun === true

  const db = getDB(env as Record<string, unknown>)
  const now = Date.now()
  const in72h = now + 72 * 60 * 60 * 1000

  // ── Query pro users expiring within 72 hours ──────────────────────────────
  // Join pro_status with devices to get the FCM token for each user.
  // A user may have multiple devices — send to each.
  const { results } = await db.prepare(`
    SELECT
      p.user_id,
      p.expiry_ms,
      d.device_id,
      d.fcm_token
    FROM pro_status p
    JOIN devices d ON d.user_id = p.user_id
    WHERE p.expiry_ms > ?
      AND p.expiry_ms <= ?
      AND d.fcm_token IS NOT NULL
      AND d.fcm_token != ''
    ORDER BY p.expiry_ms ASC
    LIMIT 500
  `).bind(now, in72h).all<{
    user_id: string
    expiry_ms: number
    device_id: string
    fcm_token: string
  }>()

  const userIds = [...new Set(results.map((r) => r.user_id))]

  if (dryRun) {
    return secureJson({
      sent:   0,
      dryRun: true,
      users:  userIds,
    })
  }

  if (results.length === 0) {
    return secureJson({ sent: 0, dryRun: false, users: [] })
  }

  // ── Send FCM pushes ───────────────────────────────────────────────────────
  const serviceAccountJson = (env as Record<string, unknown>).FIREBASE_SERVICE_ACCOUNT as string | undefined
  const projectId          = (env as Record<string, unknown>).FIREBASE_PROJECT_ID as string | undefined

  if (!serviceAccountJson || !projectId) {
    return errorJson('FIREBASE_SERVICE_ACCOUNT or FIREBASE_PROJECT_ID not configured', 500)
  }

  let accessToken: string
  try {
    accessToken = await getFcmAccessToken(serviceAccountJson)
  } catch (e) {
    console.error('[pro/churn] Failed to get FCM access token:', (e as Error)?.message)
    return errorJson('Failed to authenticate with Firebase', 500)
  }

  let totalSent = 0

  for (const row of results) {
    const daysLeft = Math.ceil((row.expiry_ms - now) / 86_400_000)
    const title    = '⚠️ Pro subscription expiring soon'
    const body     = daysLeft <= 1
      ? 'Your OTYA Player Pro access expires today — renew now to keep premium features!'
      : `Your Pro subscription expires in ${daysLeft} days — renew now!`

    try {
      const result = await sendFcmWithToken(
        [row.fcm_token],
        title,
        body,
        'https://petersmartlink.com',
        accessToken,
        projectId,
      )
      totalSent += result.sent
    } catch (e) {
      console.error('[pro/churn] FCM send failed for', row.user_id, (e as Error)?.message)
    }
  }

  return secureJson({
    sent:   totalSent,
    dryRun: false,
    users:  userIds,
  })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
