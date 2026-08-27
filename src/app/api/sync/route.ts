// app/api/sync/route.ts
// POST /api/sync
// Called when the app comes online. Anonymous installation sync is supported;
// a verified JWT is required only to link a device to an account.

import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { dualAuth } from '@/lib/auth-service'
import { secureJson, errorJson } from '@/lib/response'
import { getDB, getKV } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Otya-Device-Id',
}

function cleanText(value: unknown, max: number): string | null {
  if (typeof value !== 'string') return null
  const text = value.trim()
  return text ? text.slice(0, max) : null
}

function versionCode(value: unknown): number {
  const n = Number(value)
  return Number.isFinite(n) ? Math.max(0, Math.trunc(n)) : 0
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const auth = await dualAuth(req, env, verifyRequest)

  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const deviceId = cleanText(body.device_id, 128)
  if (!deviceId) return errorJson('device_id is required', 400)

  const currentVersionCode = versionCode(body.version_code)
  const appVersion = cleanText(body.app_version, 64)
  const abi = cleanText(body.abi, 32)
  const fcmToken = cleanText(body.fcm_token, 4096)
  const resolvedUserId = auth.mode === 'jwt' ? auth.user_id : null
  const db = getDB(env as Record<string, unknown>)

  const existing = await db.prepare(
    'SELECT last_seen_at, version_code FROM devices WHERE device_id = ?'
  ).bind(deviceId).first<{ last_seen_at: string; version_code: number }>()

  await db.prepare(`
    INSERT INTO devices
      (device_id, user_id, app_version, version_code, abi, fcm_token, last_seen_at, registered_at)
    VALUES
      (?1, ?2, ?3, ?4, ?5, ?6, datetime('now'), datetime('now'))
    ON CONFLICT(device_id) DO UPDATE SET
      user_id      = COALESCE(?2, devices.user_id),
      app_version  = COALESCE(?3, devices.app_version),
      version_code = CASE WHEN ?4 > 0 THEN ?4 ELSE devices.version_code END,
      abi          = COALESCE(?5, devices.abi),
      fcm_token    = COALESCE(?6, devices.fcm_token),
      last_seen_at = datetime('now')
  `).bind(
    deviceId,
    resolvedUserId,
    appVersion,
    currentVersionCode,
    abi,
    fcmToken,
  ).run()

  let latestVersion = '0.0.0'
  let latestVersionCode = 0
  let latestChangelog = ''

  // Prefer the releases table, then fall back to the release metadata written
  // atomically by the GitHub → R2 publisher.
  const latestRelease = await db.prepare(
    'SELECT version, version_code, changelog FROM releases ORDER BY version_code DESC LIMIT 1'
  ).first<{ version: string; version_code: number; changelog: string | null }>()
    .catch(() => null)

  if (latestRelease) {
    latestVersion = latestRelease.version
    latestVersionCode = latestRelease.version_code
    latestChangelog = latestRelease.changelog ?? ''
  } else {
    try {
      const raw = await getKV(env as Record<string, unknown>).get('LATEST_BUILD_INFO')
      if (raw) {
        const info = JSON.parse(raw) as Record<string, unknown>
        latestVersion = cleanText(info.version, 64) ?? latestVersion
        latestVersionCode = versionCode(info.versionCode ?? info.build_number ?? info.version_code)
        latestChangelog = cleanText(info.changelog ?? info.release_notes, 2000) ?? ''
      }
    } catch { /* keep safe defaults */ }
  }

  const upToDate = latestVersionCode <= 0 || currentVersionCode >= latestVersionCode

  let daysSince = 0
  if (existing?.last_seen_at) {
    const previous = new Date(existing.last_seen_at).getTime()
    if (Number.isFinite(previous)) {
      daysSince = Math.max(0, Math.floor((Date.now() - previous) / 86_400_000))
    }
  }
  const welcomeBack = daysSince >= 7

  const aiQueue = (env as Record<string, unknown>).AI_QUEUE as
    | { send(body: unknown): Promise<void> }
    | undefined

  if (aiQueue) {
    if (!upToDate && latestVersionCode > 0) {
      void aiQueue.send({
        type: 'send_update_notification',
        version: latestVersion,
        changelog: latestChangelog,
        deviceId,
      }).catch(() => {})
    }

    if (welcomeBack) {
      void aiQueue.send({
        type: 'send_update_notification',
        version: latestVersion,
        changelog: `Welcome back! It's been ${daysSince} days. Check out what's new.`,
        deviceId,
      }).catch(() => {})
    }
  }

  return secureJson({
    upToDate,
    latestVersion,
    latestVersionCode,
    welcomeBack,
    message: upToDate
      ? (welcomeBack ? 'Welcome back! You are up to date.' : 'You are up to date.')
      : `Update available: ${latestVersion}`,
    authenticated: auth.mode !== 'none',
    ts: Date.now(),
  })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
