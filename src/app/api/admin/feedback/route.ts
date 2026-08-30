import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'
import { verifyAdminSession } from '@/lib/admin_auth'

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>
  if (!await verifyAdminSession(req, recordEnv)) return errorJson('Unauthorized', 401)

  const url = new URL(req.url)
  const requested = Number(url.searchParams.get('limit') ?? 30)
  const limit = Number.isFinite(requested) ? Math.max(1, Math.min(100, Math.trunc(requested))) : 30
  const db = getDB(recordEnv)

  const { results } = await db.prepare(`
    SELECT id, device_id, app_version, version_code, category, description,
           user_email, sentiment, created_at
    FROM feedback
    ORDER BY created_at DESC
    LIMIT ?
  `).bind(limit).all<Record<string, unknown>>().catch(() => ({ results: [] as Record<string, unknown>[] }))

  return secureJson({ ok: true, feedback: results, total: results.length, ts: Date.now() }, { cache: 'no-store' })
}
