/**
 * System health monitoring helpers.
 * Used by the scheduled cron handler in queue-worker.mjs and admin API routes.
 */

import { D1, KVNamespaceLocal } from '@/lib/d1'

// ── Types ─────────────────────────────────────────────────────────────────────

export interface EndpointHealth {
  url:     string
  status:  number
  latency: number   // ms
  ok:      boolean
}

export interface SystemStats {
  totalDownloads: number
  last24h:        number
  last7d:         number
  topAbi:         string
  topVersion:     string
  activeDevices:  number
}

// ── Endpoint health check ─────────────────────────────────────────────────────

/**
 * Ping each endpoint with a HEAD request and record status + latency.
 * Never throws — failed fetches are recorded as status 0.
 */
export async function checkEndpointHealth(endpoints: string[]): Promise<EndpointHealth[]> {
  return Promise.all(
    endpoints.map(async (url) => {
      const start = Date.now()
      try {
        const res = await fetch(url, {
          method:  'HEAD',
          signal:  AbortSignal.timeout(8000),
          headers: { 'User-Agent': 'OtyaStore-HealthCheck/1.0' },
        })
        return { url, status: res.status, latency: Date.now() - start, ok: res.ok }
      } catch (e) {
        console.error('[monitor] health check failed for', url, (e as Error)?.message)
        return { url, status: 0, latency: Date.now() - start, ok: false }
      }
    }),
  )
}

// ── Rate-limit abuse detection ────────────────────────────────────────────────

/**
 * Query the downloads table for IPs that made >100 requests in the last hour.
 * Returns an array of abusive IP strings.
 */
export async function detectRateLimitAbuse(
  db: D1,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  _env: any,
): Promise<string[]> {
  try {
    const { results } = await db.prepare(`
      SELECT ip, COUNT(*) as count
      FROM downloads
      WHERE created_at >= datetime('now', '-1 hour')
        AND ip IS NOT NULL
        AND ip != 'unknown'
      GROUP BY ip
      HAVING count > 100
      ORDER BY count DESC
      LIMIT 50
    `).all<{ ip: string; count: number }>()
    return results.map(r => r.ip)
  } catch (e) {
    console.error('[monitor] detectRateLimitAbuse failed:', (e as Error)?.message)
    return []
  }
}

// ── IP blocking via KV ────────────────────────────────────────────────────────

/** Store a blocked IP in KV with a 24-hour TTL. */
export async function blockIp(kv: KVNamespaceLocal, ip: string): Promise<void> {
  try {
    await kv.put(`blocked:${ip}`, '1', { expirationTtl: 86400 })
  } catch (e) {
    console.error('[monitor] blockIp failed for', ip, (e as Error)?.message)
  }
}

/** Return true if the IP is currently blocked in KV. */
export async function isIpBlocked(kv: KVNamespaceLocal, ip: string): Promise<boolean> {
  try {
    const val = await kv.get(`blocked:${ip}`)
    return val !== null
  } catch (e) {
    console.error('[monitor] isIpBlocked check failed for', ip, (e as Error)?.message)
    return false   // fail open — don't block legitimate traffic on KV errors
  }
}

// ── System stats ──────────────────────────────────────────────────────────────

/**
 * Aggregate download and device stats from D1.
 * Returns zeroed-out stats if any query fails.
 */
export async function getSystemStats(db: D1): Promise<SystemStats> {
  const zero: SystemStats = {
    totalDownloads: 0,
    last24h:        0,
    last7d:         0,
    topAbi:         'unknown',
    topVersion:     'unknown',
    activeDevices:  0,
  }

  try {
    const [totalRow, last24hRow, last7dRow, topAbiRow, topVersionRow, activeRow] =
      await Promise.all([
        db.prepare('SELECT COUNT(*) as count FROM downloads').first<{ count: number }>(),
        db.prepare(
          "SELECT COUNT(*) as count FROM downloads WHERE created_at >= datetime('now', '-1 day')"
        ).first<{ count: number }>(),
        db.prepare(
          "SELECT COUNT(*) as count FROM downloads WHERE created_at >= datetime('now', '-7 days')"
        ).first<{ count: number }>(),
        db.prepare(
          'SELECT abi, COUNT(*) as count FROM downloads GROUP BY abi ORDER BY count DESC LIMIT 1'
        ).first<{ abi: string; count: number }>(),
        db.prepare(
          'SELECT version, COUNT(*) as count FROM downloads GROUP BY version ORDER BY count DESC LIMIT 1'
        ).first<{ version: string; count: number }>(),
        db.prepare(
          "SELECT COUNT(*) as count FROM devices WHERE last_seen_at >= datetime('now', '-30 days')"
        ).first<{ count: number }>(),
      ])

    return {
      totalDownloads: totalRow?.count      ?? 0,
      last24h:        last24hRow?.count    ?? 0,
      last7d:         last7dRow?.count     ?? 0,
      topAbi:         topAbiRow?.abi       ?? 'unknown',
      topVersion:     topVersionRow?.version ?? 'unknown',
      activeDevices:  activeRow?.count     ?? 0,
    }
  } catch (e) {
    console.error('[monitor] getSystemStats failed:', (e as Error)?.message)
    return zero
  }
}

// ── Email helpers ─────────────────────────────────────────────────────────────

/**
 * Send a weekly digest email with stats and feedback summary.
 * Mirrors the sendErrorAlert pattern from src/index.js.
 */
export async function sendWeeklyDigest(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  env: any,
  stats: SystemStats,
  feedbackSummary: string,
): Promise<void> {
  const subject = `[Otya Store] Weekly Digest — ${new Date().toDateString()}`
  const text = [
    '=== OTYA Store Weekly Digest ===',
    '',
    '📊 Download Stats',
    `  Total downloads : ${stats.totalDownloads}`,
    `  Last 24 hours   : ${stats.last24h}`,
    `  Last 7 days     : ${stats.last7d}`,
    `  Top ABI         : ${stats.topAbi}`,
    `  Top version     : ${stats.topVersion}`,
    `  Active devices  : ${stats.activeDevices}`,
    '',
    '💬 Feedback Summary',
    feedbackSummary,
    '',
    `Generated: ${new Date().toISOString()}`,
  ].join('\n')

  await sendAlertEmail(env, subject, text)
}

/**
 * Send an alert email using the EMAIL binding.
 * Reuses the same pattern as sendErrorAlert in src/index.js.
 */
export async function sendAlertEmail(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  env: any,
  subject: string,
  body: string,
): Promise<void> {
  try {
    await env.EMAIL.send({
      from:    { email: 'worker@petersmartlink.com', name: 'Otya Store Worker' },
      to:      [{ email: 'petersmartlink@gmail.com' }],
      subject,
      text:    body,
    })
  } catch (e) {
    console.error('[monitor] sendAlertEmail failed:', (e as Error)?.message)
  }
}
