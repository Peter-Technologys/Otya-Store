import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

// GET /api/stats — download analytics
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
  if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)

  const db = getDB(env as Record<string, unknown>)

  const [totalRow, byAbi, byVersion, recent] = await Promise.all([
    db.prepare('SELECT COUNT(*) as total FROM downloads').first<{ total: number }>(),
    db.prepare('SELECT abi, COUNT(*) as count FROM downloads GROUP BY abi').all(),
    db.prepare('SELECT version, COUNT(*) as count FROM downloads GROUP BY version ORDER BY count DESC LIMIT 10').all(),
    db.prepare('SELECT abi, version, created_at FROM downloads ORDER BY created_at DESC LIMIT 20').all(),
  ])

  return secureJson({
    total:      totalRow?.total ?? 0,
    by_abi:     byAbi.results,
    by_version: byVersion.results,
    recent:     recent.results,
  }, {
    cache: 'public, max-age=60',
  })
}
