import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'
import { isAdminAuthorized } from '@/lib/admin_auth'

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>
  if (!await isAdminAuthorized(req, recordEnv)) return errorJson('Unauthorized', 401)

  const url = new URL(req.url)
  const requested = Number(url.searchParams.get('limit') ?? 30)
  const limit = Number.isFinite(requested) ? Math.max(1, Math.min(100, Math.trunc(requested))) : 30
  const db = getDB(recordEnv)

  const [recent, groups] = await Promise.all([
    db.prepare(`
      SELECT id, device_id, user_id, app_version, version_code, error_type,
             description, group_id, ai_processed, created_at
      FROM crash_reports
      ORDER BY created_at DESC
      LIMIT ?
    `).bind(limit).all<Record<string, unknown>>().catch(() => ({ results: [] as Record<string, unknown>[] })),
    db.prepare(`
      SELECT COALESCE(group_id, error_type, 'Unknown') AS group_id,
             error_type, COUNT(*) AS count, MAX(created_at) AS latest
      FROM crash_reports
      GROUP BY COALESCE(group_id, error_type, 'Unknown'), error_type
      ORDER BY latest DESC
      LIMIT 30
    `).all<Record<string, unknown>>().catch(() => ({ results: [] as Record<string, unknown>[] })),
  ])

  return secureJson({
    ok: true,
    crashes: recent.results,
    groups: groups.results,
    ts: Date.now(),
  }, { cache: 'no-store' })
}
