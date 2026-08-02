/**
 * GET /api/reports/daily  — daily sales summary for the authenticated user
 *
 * Query params:
 *   date  — ISO date string (YYYY-MM-DD). Defaults to today (UTC).
 *
 * Auth: Bearer JWT. All queries scoped to user_id.
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyJwtViaService, extractBearerToken } from '@/lib/auth-service'
import { getDB } from '@/lib/d1'
import { apiJson, apiErr, apiOptions, withEtag } from '@/lib/smartpos-helpers'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const url  = new URL(req.url)
  const date = url.searchParams.get('date') ?? new Date().toISOString().slice(0, 10)

  if (!DATE_RE.test(date)) return apiErr('date must be in YYYY-MM-DD format', req)

  const from = `${date}T00:00:00.000Z`
  const to   = `${date}T23:59:59.999Z`

  const db = getDB(env as Record<string, unknown>)

  const [salesRes, topProductsRes] = await Promise.all([
    db.prepare(`
      SELECT
        COUNT(*)        AS sale_count,
        COALESCE(SUM(total), 0) AS revenue,
        payment_method
      FROM sales
      WHERE user_id = ? AND created_at >= ? AND created_at <= ?
      GROUP BY payment_method
    `).bind(jwt.user_id, from, to).all<{
      sale_count: number
      revenue:    number
      payment_method: string
    }>(),

    // Top 5 products by revenue (from items_json — parsed in app layer)
    db.prepare(`
      SELECT id, total, items_json
      FROM sales
      WHERE user_id = ? AND created_at >= ? AND created_at <= ?
      ORDER BY total DESC
      LIMIT 50
    `).bind(jwt.user_id, from, to).all<{ id: string; total: number; items_json: string }>(),
  ])

  const totalRevenue  = salesRes.results.reduce((s, r) => s + r.revenue, 0)
  const totalSales    = salesRes.results.reduce((s, r) => s + r.sale_count, 0)
  const byPayment     = salesRes.results

  return withEtag({
    date,
    total_sales:   totalSales,
    total_revenue: totalRevenue,
    by_payment:    byPayment,
    recent_sales:  topProductsRes.results,
  }, req)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
