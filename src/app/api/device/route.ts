// app/api/device/route.ts
// POST /api/device
// Upserts device info into D1 `devices` table.
// Called once on first launch / version change by the Flutter app.
//
// Auth: JWT (Bearer token) takes priority — user_id is extracted from the token.
//       Falls back to HMAC + body user_id for backward compatibility.

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { dualAuth } from '@/lib/auth-service'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

export interface DevicePayload {
  device_id:        string   // stable UUID (stored in SharedPreferences)
  app_version:      string   // e.g. "1.5.0"
  version_code?:    number   // e.g. 8
  app_build?:       number   // back-compat alias for version_code
  abi?:             string   // "arm64" | "arm32"
  arch?:            string   // back-compat alias for abi
  fcm_token?:       string   // FCM token — optional
  user_id?:         string   // optional user identifier (ignored when JWT present)
  platform?:        string   // "android" (default)
  model?:           string   // e.g. "Samsung SM-G991B"
  android_version?: string   // e.g. "14"
  locale?:          string   // e.g. "en_UG"
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
}

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  // ── 1. Dual auth: JWT first, then HMAC ───────────────────────────────────
  const auth = await dualAuth(request, env, verifyRequest)
  if (auth.mode === 'none') return errorJson(auth.error ?? 'Unauthorized', 401)

  // ── 2. Parse body ────────────────────────────────────────────────────────
  let body: DevicePayload
  try {
    body = await request.json() as DevicePayload
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  if (!body.device_id || typeof body.device_id !== 'string') {
    return errorJson('device_id is required', 400)
  }

  // Resolve back-compat aliases
  const versionCode = body.version_code ?? body.app_build ?? 0
  const abi         = body.abi          ?? body.arch      ?? 'arm64'
  const platform    = body.platform     ?? 'android'

  // JWT auth: user_id comes from the verified token (cannot be spoofed).
  // HMAC auth: user_id comes from the request body (legacy behavior).
  const resolvedUserId = auth.mode === 'jwt' ? auth.user_id : (body.user_id ?? null)

  // ── 3. Upsert — columns match the actual D1 schema ───────────────────────
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
      model           = COALESCE(excluded.model,           devices.model),
      android_version = COALESCE(excluded.android_version, devices.android_version),
      locale          = COALESCE(excluded.locale,          devices.locale),
      fcm_token       = COALESCE(excluded.fcm_token,       devices.fcm_token),
      user_id         = COALESCE(excluded.user_id,         devices.user_id),
      last_seen_at    = datetime('now')
  `).bind(
    body.device_id,
    resolvedUserId,
    body.fcm_token       ?? null,
    body.app_version     ?? '0.0.0',
    versionCode,
    abi,
    platform,
    body.model           ?? null,
    body.android_version ?? null,
    body.locale          ?? null,
  ).run()

  return secureJson({ ok: true })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
