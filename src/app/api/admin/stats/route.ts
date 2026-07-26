// app/api/admin/stats/route.ts
// GET /api/admin/stats
// Protected by ADMIN_TOKEN (Authorization: Bearer <token> or ?token=<token>).
// Returns comprehensive stats: downloads, devices, feedback, crashes, system health, pro users.

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'
import { getSystemStats, checkEndpointHealth } from '@/lib/monitor'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
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

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  if (!isAuthorized(req, env as Record<string, unknown>)) {
    return errorJson('Unauthorized', 401)
  }

  const db = getDB(env as Record<string, unknown>)

  // ── Gather all stats in parallel ─────────────────────────────────────────
  const [
    systemStats,
    feedbackRows,
    crashRows,
    proCount,
    ratingRows,
    endpointHealth,
  ] = await Promise.all([
    getSystemStats(db),

    // Feedback summary: count by category
    db.prepare(
      'SELECT category, COUNT(*) as count FROM feedback GROUP BY category ORDER BY count DESC'
    ).all<{ category: string; count: number }>().catch(() => ({ results: [] })),

    // Crash summary: count by error_type, last 7 days
    db.prepare(`
      SELECT error_type, COUNT(*) as count
      FROM crash_reports
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY error_type
      ORDER BY count DESC
      LIMIT 10
    `).all<{ error_type: string; count: number }>().catch(() => ({ results: [] })),

    // Pro users count
    db.prepare(
      'SELECT COUNT(*) as count FROM pro_status WHERE expiry_ms > ?'
    ).bind(Date.now()).first<{ count: number }>().catch(() => null),

    // Average rating
    db.prepare(
      'SELECT AVG(stars) as avg, COUNT(*) as total FROM ratings'
    ).first<{ avg: number; total: number }>().catch(() => null),

    // Health check key endpoints
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
    devices: {
      active30d: systemStats.activeDevices,
    },
    feedback: {
      byCategory: feedbackRows.results,
    },
    crashes: {
      last7d: crashRows.results,
    },
    pro: {
      activeUsers: proCount?.count ?? 0,
    },
    ratings: {
      average: ratingRows?.avg   != null ? Math.round(ratingRows.avg * 10) / 10 : null,
      total:   ratingRows?.total ?? 0,
    },
    health: endpointHealth,
    ts: Date.now(),
  }, { cache: 'no-store' })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
