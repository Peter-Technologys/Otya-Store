// app/api/admin/stats/route.ts
// GET /api/admin/stats
// Protected by a signed HttpOnly OTYA admin session. Legacy ADMIN_TOKEN support
// is retained temporarily for older tooling while the dashboard migrates.

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'
import { getSystemStats, checkEndpointHealth } from '@/lib/monitor'
import { verifyAdminSession } from '@/lib/admin_auth'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function legacyTokenAuthorized(req: NextRequest, env: Record<string, unknown>): boolean {
  const adminToken = env.ADMIN_TOKEN as string | undefined
  if (!adminToken) return false
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  return token === adminToken
}

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>

  const authorized = await verifyAdminSession(req, recordEnv)
    || legacyTokenAuthorized(req, recordEnv)
  if (!authorized) return errorJson('Unauthorized', 401)

  const db = getDB(recordEnv)

  const [
    systemStats,
    feedbackRows,
    crashRows,
    proCount,
    ratingRows,
    endpointHealth,
  ] = await Promise.all([
    getSystemStats(db),
    db.prepare(
      'SELECT category, COUNT(*) as count FROM feedback GROUP BY category ORDER BY count DESC'
    ).all<{ category: string; count: number }>().catch(() => ({ results: [] })),
    db.prepare(`
      SELECT error_type, COUNT(*) as count
      FROM crash_reports
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY error_type
      ORDER BY count DESC
      LIMIT 10
    `).all<{ error_type: string; count: number }>().catch(() => ({ results: [] })),
    db.prepare(
      'SELECT COUNT(*) as count FROM pro_status WHERE expiry_ms > ?'
    ).bind(Date.now()).first<{ count: number }>().catch(() => null),
    db.prepare(
      'SELECT AVG(stars) as avg, COUNT(*) as total FROM ratings'
    ).first<{ avg: number; total: number }>().catch(() => null),
    checkEndpointHealth([
      'https://petersmartlink.com',
      'https://petersmartlink.com/version',
      'https://petersmartlink.com/download',
    ]),
  ])

  return secureJson({
    downloads: {
      total:         systemStats.totalDownloads,
      last24h:       systemStats.last24h,
      last7d:        systemStats.last7d,
      topAbi:        systemStats.topAbi,
      topVersion:    systemStats.topVersion,
    },
    devices: { active30d: systemStats.activeDevices },
    feedback: { byCategory: feedbackRows.results },
    crashes: { last7d: crashRows.results },
    pro: { activeUsers: proCount?.count ?? 0 },
    ratings: {
      average: ratingRows?.avg != null ? Math.round(ratingRows.avg * 10) / 10 : null,
      total: ratingRows?.total ?? 0,
    },
    health: endpointHealth,
    ts: Date.now(),
  }, { cache: 'no-store' })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
