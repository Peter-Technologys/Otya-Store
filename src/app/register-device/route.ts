import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAppToken, API_CORS } from '@/lib/auth'
import { getDB } from '@/lib/d1'

// POST /register-device
// Called by OtyaService.registerDevicePushToken() in the Flutter app.
// Stores deviceId + FCM token in D1 so the Worker can send push notifications.
//
// Body: { deviceId, fcmToken, userId?, appVersion?, versionCode?, abi?, platform? }
export async function POST(req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const authErr = requireAppToken(req, env as Record<string, unknown>)
    if (authErr) return authErr

    const body        = await req.json() as Record<string, unknown>
    const deviceId    = body.deviceId    as string | undefined
    const fcmToken    = body.fcmToken    as string | undefined
    const userId      = (body.userId     as string | undefined) ?? null
    const appVersion  = (body.appVersion as string | undefined) ?? ''
    const versionCode = Number(body.versionCode ?? 0)
    const abi         = (body.abi        as string | undefined) ?? 'arm64'
    const platform    = (body.platform   as string | undefined) ?? 'android'

    if (!deviceId) {
      return NextResponse.json({ error: 'deviceId is required' }, { status: 400 })
    }

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

    return NextResponse.json({ ok: true }, { headers: API_CORS })
  } catch (err) {
    console.error('[register-device]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: API_CORS })
}
