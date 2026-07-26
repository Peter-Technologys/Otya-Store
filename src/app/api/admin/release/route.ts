// app/api/admin/release/route.ts
// POST /api/admin/release
// Protected by ADMIN_TOKEN (Authorization: Bearer <token> or ?token=<token>).
// Inserts/updates a release in D1, optionally queues AI changelog generation,
// and queues an update notification to all devices via AI_QUEUE.

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

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
  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const { tag, version, version_code, changelog, commits, force_update } = body

  if (!tag || typeof tag !== 'string') {
    return errorJson('tag is required', 400)
  }
  if (!version || typeof version !== 'string') {
    return errorJson('version is required', 400)
  }
  if (version_code == null || isNaN(Number(version_code))) {
    return errorJson('version_code is required and must be a number', 400)
  }

  const versionCodeNum = Number(version_code)
  const forceUpdateNum = force_update ? 1 : 0
  const releaseDate    = new Date().toISOString().split('T')[0]
  const db             = getDB(env as Record<string, unknown>)

  // ── Upsert release into D1 ────────────────────────────────────────────────
  const changelogStr = typeof changelog === 'string' && changelog.trim()
    ? changelog.trim()
    : null   // will be filled by AI if commits provided

  await db.prepare(`
    INSERT INTO releases
      (tag, version, version_code, date, changelog, force_update,
       download_url, arm64_url, arm32_url, released_at)
    VALUES
      (?1, ?2, ?3, ?4, ?5, ?6,
       'https://petersmartlink.com/download',
       'https://petersmartlink.com/apk/arm64',
       'https://petersmartlink.com/apk/arm32',
       datetime('now'))
    ON CONFLICT(tag) DO UPDATE SET
      version      = excluded.version,
      version_code = excluded.version_code,
      date         = excluded.date,
      changelog    = COALESCE(excluded.changelog, releases.changelog),
      force_update = excluded.force_update,
      released_at  = excluded.released_at
  `).bind(
    tag,
    version,
    versionCodeNum,
    releaseDate,
    changelogStr,
    forceUpdateNum,
  ).run()

  const aiQueue = (env as Record<string, unknown>).AI_QUEUE as { send(body: unknown): Promise<void> } | undefined

  // ── Queue AI changelog generation if no changelog provided ────────────────
  if (!changelogStr && Array.isArray(commits) && commits.length > 0 && aiQueue) {
    try {
      await aiQueue.send({
        type:    'generate_changelog',
        tag,
        commits: commits.slice(0, 50),
      })
    } catch (e) {
      console.error('[admin/release] Failed to queue changelog generation:', (e as Error)?.message)
    }
  }

  // ── Queue update notification to all devices ──────────────────────────────
  if (aiQueue) {
    try {
      await aiQueue.send({
        type:      'send_update_notification',
        version,
        changelog: changelogStr ?? `OTYA Player ${version} is now available.`,
        // No deviceId → broadcast to all
      })
    } catch (e) {
      console.error('[admin/release] Failed to queue update notification:', (e as Error)?.message)
    }
  }

  // ── Return the created/updated release ────────────────────────────────────
  const release = await db.prepare(
    'SELECT * FROM releases WHERE tag = ?'
  ).bind(tag).first<Record<string, unknown>>()

  return secureJson({
    ok:      true,
    release: release ?? { tag, version, version_code: versionCodeNum, date: releaseDate, force_update: forceUpdateNum },
    ts:      Date.now(),
  })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
