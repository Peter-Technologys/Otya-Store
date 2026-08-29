// app/api/admin/release/route.ts
// POST /api/admin/release — create/update OTYA release metadata.

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'
import { isAdminAuthorized } from '@/lib/admin_auth'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>
  if (!await isAdminAuthorized(req, recordEnv)) return errorJson('Unauthorized', 401)

  let body: Record<string, unknown>
  try {
    body = await req.json() as Record<string, unknown>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const { tag, version, version_code, changelog, commits, force_update } = body
  if (!tag || typeof tag !== 'string') return errorJson('tag is required', 400)
  if (!version || typeof version !== 'string') return errorJson('version is required', 400)
  if (version_code == null || !Number.isFinite(Number(version_code))) {
    return errorJson('version_code is required and must be a number', 400)
  }

  const versionCodeNum = Math.max(1, Math.trunc(Number(version_code)))
  const forceUpdateNum = force_update === true ? 1 : 0
  const releaseDate = new Date().toISOString().split('T')[0]
  const db = getDB(recordEnv)
  const changelogStr = typeof changelog === 'string' && changelog.trim() ? changelog.trim().slice(0, 8000) : null
  const cleanTag = tag.trim().slice(0, 120)
  const cleanVersion = version.trim().slice(0, 64)
  if (!cleanTag || !cleanVersion) return errorJson('tag and version cannot be blank', 400)

  await db.prepare(`
    INSERT INTO releases
      (tag, version, version_code, date, changelog, force_update,
       download_url, arm64_url, arm32_url, released_at)
    VALUES
      (?1, ?2, ?3, ?4, ?5, ?6,
       'https://petersmartlink.com/download/otya-player',
       'https://petersmartlink.com/apk/arm64',
       'https://petersmartlink.com/apk/arm32',
       datetime('now'))
    ON CONFLICT(tag) DO UPDATE SET
      version = excluded.version,
      version_code = excluded.version_code,
      date = excluded.date,
      changelog = COALESCE(excluded.changelog, releases.changelog),
      force_update = excluded.force_update,
      download_url = excluded.download_url,
      arm64_url = excluded.arm64_url,
      arm32_url = excluded.arm32_url,
      released_at = excluded.released_at
  `).bind(cleanTag, cleanVersion, versionCodeNum, releaseDate, changelogStr, forceUpdateNum).run()

  const aiQueue = recordEnv.AI_QUEUE as { send(body: unknown): Promise<void> } | undefined
  if (!changelogStr && Array.isArray(commits) && commits.length > 0 && aiQueue) {
    try {
      await aiQueue.send({ type: 'generate_changelog', tag: cleanTag, commits: commits.slice(0, 50) })
    } catch (e) {
      console.error('[admin/release] Failed to queue changelog generation:', (e as Error)?.message)
    }
  }

  if (aiQueue) {
    try {
      await aiQueue.send({
        type: 'send_update_notification',
        version: cleanVersion,
        changelog: changelogStr ?? `OTYA ${cleanVersion} is now available.`,
      })
    } catch (e) {
      console.error('[admin/release] Failed to queue update notification:', (e as Error)?.message)
    }
  }

  const release = await db.prepare('SELECT * FROM releases WHERE tag = ?')
    .bind(cleanTag).first<Record<string, unknown>>()

  return secureJson({ ok: true, release, ts: Date.now() })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
