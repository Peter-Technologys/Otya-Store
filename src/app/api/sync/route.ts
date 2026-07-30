// app/api/sync/route.ts
// POST /api/sync
// Called by the app when the user comes online.
// Updates last_seen_at, optionally updates fcm_token, checks for outdated version,
// and queues targeted push/welcome-back notifications via AI_QUEUE.
//
// Auth: JWT (Bearer token) takes priority — user_id is linked from the token.
//       Falls back to HMAC for backward compatibility.

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

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  // ── 1. Dual auth: JWT first, then HMAC ───────────────────────────────────
  const auth = await dualAuth(req, env, verifyRequest)
  if (auth.mode === 'none') return errorJson(auth.error ?? 'Unauthorized', 401)

  // ── 2. Parse body ────────────────────────────────────────────────────────
  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const { device_id, version_code, app_version, abi, fcm_token } = body

  if (!device_id || typeof device_id !== 'string') {
    return errorJson('device_id is required', 400)
  }

  const versionCodeNum = version_code != null ? Number(version_code) : 0
  // JWT auth: link device to authenticated user_id (cannot be spoofed)
  const resolvedUserId = auth.mode === 'jwt' ? auth.user_id : null
  const db = getDB(env as Record<string, unknown>)

  // ── 3. Fetch current device record ───────────────────────────────────────
  const existing = await db.prepare(
    'SELECT last_seen_at, version_code FROM devices WHERE device_id = ?'
  ).bind(device_id).first<{ last_seen_at: string; version_code: number }>()

  // ── 4. Upsert device — update last_seen_at and optionally fcm_token/user_id
  await db.prepare(`
    INSERT INTO devices
      (device_id, user_id, app_version, version_code, abi, fcm_token, last_seen_at, registered_at)
    VALUES
      (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))
    ON CONFLICT(device_id) DO UPDATE SET
      user_id      = COALESCE(?2,  devices.user_id),
      app_version  = COALESCE(?3,  devices.app_version),
      version_code = COALESCE(?4,  devices.version_code),
      abi          = COALESCE(?5,  devices.abi),
      fcm_token    = COALESCE(?6,  devices.fcm_token),
      last_seen_at = datetime('now')
  `).bind(
    device_id,
    resolvedUserId   ?? null,
    app_version      ?? null,
    versionCodeNum   || null,
    abi              ?? null,
    fcm_token        ?? null,
  ).run()

  // ── 5. Fetch latest release from D1 (graceful fallback if table empty) ───
  const latestRelease = await db.prepare(
    'SELECT version, version_code, changelog FROM releases ORDER BY version_code DESC LIMIT 1'
  ).first<{ version: string; version_code: number; changelog: string | null }>()
    .catch(() => null)   // table may not exist yet in dev / fresh deploy

  const latestVersionCode = latestRelease?.version_code ?? 0
  const latestVersion     = latestRelease?.version      ?? '0.0.0'
  const upToDate          = versionCodeNum >= latestVersionCode

  // ── 6. Queue notifications if needed (fire-and-forget, never throws) ─────
  const aiQueue = (env as Record<string, unknown>).AI_QUEUE as
    | { send(body: unknown): Promise<void> }
    | undefined

  if (aiQueue) {
    if (!upToDate && latestRelease) {
      void aiQueue.send({
        type:      'send_update_notification',
        version:   latestRelease.version,
        changelog: latestRelease.changelog ?? '',
        deviceId:  device_id,
      }).catch(() => { /* non-fatal */ })
    }

    if (existing?.last_seen_at) {
      const daysSince = Math.floor(
        (Date.now() - new Date(existing.last_seen_at).getTime()) / 86_400_000,
      )
      if (daysSince >= 7) {
        void aiQueue.send({
          type:      'send_update_notification',
          version:   latestVersion,
          changelog: `Welcome back! It's been ${daysSince} days. Check out what's new.`,
          deviceId:  device_id,
        }).catch(() => { /* non-fatal */ })
      }
    }
  }

  // ── 7. Respond ────────────────────────────────────────────────────────────
  return secureJson({
    upToDate,
    latestVersion,
    latestVersionCode,
    message: upToDate
      ? 'You are up to date.'
      : `Update available: ${latestVersion}`,
    ts: Date.now(),
  })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
