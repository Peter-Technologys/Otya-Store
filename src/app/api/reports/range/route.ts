/**
 * GET /api/reports/range  — sales summary over a date range
 *
 * Query params:
 *   from  — ISO date string (YYYY-MM-DD), required
 *   to    — ISO date string (YYYY-MM-DD), required
 *
 * Auth: Bearer JWT. All queries scoped to user_id.
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyJwtViaService, extractBearerToken } from '@/lib/auth-service'
import { getDB } from '@/lib/d1'
import { apiErr, apiOptions, withEtag } from '@/lib/smartpos-helpers'

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const url  = new URL(req.url)
  const from = url.searchParams.get('from')
  const to   = url.searchParams.get('to')

  if (!from || !DATE_RE.test(from)) return apiErr('from must be in YYYY-MM-DD format', req)
  if (!to   || !DATE_RE.test(to))   return apiErr('to must be in YYYY-MM-DD format', req)
  if (from > to) return apiErr('from must be before or equal to to', req)

  const fromTs = `${from}T00:00:00.000Z`
  const toTs   = `${to}T23:59:59.999Z`

  const db = getDB(env as Record<string, unknown>)

  const [summaryRes, dailyRes] = await Promise.all([
    db.prepare(`
      SELECT
        COUNT(*)                AS total_sales,
        COALESCE(SUM(total), 0) AS total_revenue,
        COALESCE(AVG(total), 0) AS avg_sale,
        payment_method
      FROM sales
      WHERE user_id = ? AND created_at >= ? AND created_at <= ?
      GROUP BY payment_method
    `).bind(jwt.user_id, fromTs, toTs).all<{
      total_sales:   number
      total_revenue: number
      avg_sale:      number
      payment_method: string
    }>(),

    // Daily breakdown
    db.prepare(`
      SELECT
        substr(created_at, 1, 10)   AS day,
        COUNT(*)                    AS sale_count,
        COALESCE(SUM(total), 0)     AS revenue
      FROM sales
      WHERE user_id = ? AND created_at >= ? AND created_at <= ?
      GROUP BY day
      ORDER BY day ASC
    `).bind(jwt.user_id, fromTs, toTs).all<{
      day:        string
      sale_count: number
      revenue:    number
    }>(),
  ])

  const totalRevenue = summaryRes.results.reduce((s, r) => s + r.total_revenue, 0)
  const totalSales   = summaryRes.results.reduce((s, r) => s + r.total_sales,   0)

  return withEtag({
    from,
    to,
    total_sales:   totalSales,
    total_revenue: totalRevenue,
    by_payment:    summaryRes.results,
    daily:         dailyRes.results,
  }, req)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
