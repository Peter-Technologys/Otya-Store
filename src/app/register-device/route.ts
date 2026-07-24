import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

// POST /register-device
// Called by OtyaService.registerDevicePushToken() in the Flutter app.
// Stores deviceId + FCM token in D1 so the Worker can send push notifications.
export async function POST(req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()

    const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
    if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)

    const body        = await req.json() as Record<string, unknown>
    const deviceId    = body.deviceId    as string | undefined
    const fcmToken    = body.fcmToken    as string | undefined
    const userId      = (body.userId     as string | undefined) ?? null
    const appVersion  = (body.appVersion as string | undefined) ?? ''
    const versionCode = Number(body.versionCode ?? 0)
    const abi         = (body.abi        as string | undefined) ?? 'arm64'
    const platform    = (body.platform   as string | undefined) ?? 'android'

    if (!deviceId) return errorJson('deviceId is required', 400)

    const db  = getDB(env as Record<string, unknown>)
    const now = new Date().toISOString()

    await db.prepare(`
      INSERT INTO devices
        (device_id, user_id, fcm_token, app_version, version_code, abi, platform, registered_at, last_seen_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(device_id) DO UPDATE SET
        fcm_token    = COALESCE(excluded.fcm_token, devices.fcm_token),
        user_id      = COALESCE(excluded.user_id,   devices.user_id),
        app_version  = excluded.app_version,
        version_code = excluded.version_code,
        last_seen_at = excluded.last_seen_at
    `).bind(deviceId, userId, fcmToken ?? null, appVersion, versionCode, abi, platform, now, now).run()

    return secureJson({ ok: true })
  } catch (err) {
    console.error('[register-device]', err)
    return errorJson('Internal error', 500)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      'Access-Control-Allow-Origin':  'https://petersmartlink.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
    },
  })
}
