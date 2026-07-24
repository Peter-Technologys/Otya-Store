import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDB } from '@/lib/d1'

// GET /api/stats — download analytics
export async function GET(_req: NextRequest) {
  const { env } = await getCloudflareContext()
  const db = getDB(env as Record<string, unknown>)

  const [totalRow, byAbi, byVersion, recent] = await Promise.all([
    db.prepare('SELECT COUNT(*) as total FROM downloads').first<{ total: number }>(),
    db.prepare('SELECT abi, COUNT(*) as count FROM downloads GROUP BY abi').all(),
    db.prepare('SELECT version, COUNT(*) as count FROM downloads GROUP BY version ORDER BY count DESC LIMIT 10').all(),
    db.prepare('SELECT abi, version, created_at FROM downloads ORDER BY created_at DESC LIMIT 20').all(),
  ])

  return NextResponse.json({
    total:      totalRow?.total ?? 0,
    by_abi:     byAbi.results,
    by_version: byVersion.results,
    recent:     recent.results,
  }, {
    headers: {
      'Cache-Control':               'public, max-age=60',
      'Access-Control-Allow-Origin': 'https://petersmartlink.com',
    },
  })
}
