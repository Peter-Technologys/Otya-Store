// app/api/device/route.ts
// POST /api/device
// Upserts device info into D1 `devices` table.
// Called on first launch / version change by the Flutter app.
//
// Authentication model:
//   - Verified JWT: links the installation to the token's user_id.
//   - Legacy HMAC: accepted for older trusted clients.
//   - Anonymous: allowed for non-sensitive installation metadata only; user_id
//     is always forced to null so an unauthenticated caller cannot impersonate
//     or link itself to another account.

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { dualAuth } from '@/lib/auth-service'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

export interface DevicePayload {
  device_id:        string
  app_version:      string
  version_code?:    number
  app_build?:       number
  abi?:             string
  arch?:            string
  fcm_token?:       string
  user_id?:         string
  platform?:        string
  model?:           string
  android_version?: string
  locale?:          string
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
}

function cleanText(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  if (!text) return null
  return text.slice(0, maxLength)
}

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  // Attempt authenticated modes, but do not reject a clean anonymous install.
  // dualAuth's error is intentionally ignored for anonymous registration.
  const auth = await dualAuth(request, env, verifyRequest)

  let body: DevicePayload
  try {
    body = await request.json() as DevicePayload
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const deviceId = cleanText(body.device_id, 128)
  if (!deviceId) return errorJson('device_id is required', 400)

  const rawVersionCode = body.version_code ?? body.app_build ?? 0
  const versionCode = Number.isFinite(Number(rawVersionCode))
    ? Math.max(0, Math.trunc(Number(rawVersionCode)))
    : 0

  const abi = cleanText(body.abi ?? body.arch, 32) ?? 'arm64'
  const platform = cleanText(body.platform, 32) ?? 'android'

  // Never trust body.user_id for an unauthenticated installation. JWT is the
  // only modern path that may establish account ownership. Legacy HMAC keeps
  // its historical user_id behavior for older trusted releases.
  const resolvedUserId = auth.mode === 'jwt'
    ? auth.user_id
    : auth.mode === 'hmac'
      ? cleanText(body.user_id, 128)
      : null

  const db = getDB(env as Record<string, unknown>)

  await db.prepare(`
    INSERT INTO devices
      (device_id, user_id, fcm_token, app_version, version_code, abi, platform,
       model, android_version, locale, registered_at, last_seen_at)
    VALUES
      (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, datetime('now'), datetime('now'))
    ON CONFLICT(device_id) DO UPDATE SET
      app_version     = excluded.app_version,
      version_code    = excluded.version_code,
      abi             = excluded.abi,
      platform        = excluded.platform,
      model           = COALESCE(excluded.model,           devices.model),
      android_version = COALESCE(excluded.android_version, devices.android_version),
      locale          = COALESCE(excluded.locale,          devices.locale),
      fcm_token       = COALESCE(excluded.fcm_token,       devices.fcm_token),
      user_id         = COALESCE(excluded.user_id,         devices.user_id),
      last_seen_at    = datetime('now')
  `).bind(
    deviceId,
    resolvedUserId,
    cleanText(body.fcm_token, 4096),
    cleanText(body.app_version, 64) ?? '0.0.0',
    versionCode,
    abi,
    platform,
    cleanText(body.model, 256),
    cleanText(body.android_version, 64),
    cleanText(body.locale, 32),
  ).run()

  return secureJson({ ok: true, authenticated: auth.mode !== 'none' })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
