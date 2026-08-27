// app/api/notifications/reengage/route.ts
// POST /api/notifications/reengage
// Admin-only audit endpoint for dormant-device re-engagement eligibility.
//
// IMPORTANT: OTYA does not currently persist explicit marketing consent.
// Feedback/support email addresses must never be repurposed for marketing.
// Until a dedicated consent + unsubscribe model exists, this route is audit-only
// and refuses live sends. This prevents accidental non-consensual campaigns.

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': 'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

function isAuthorized(req: NextRequest, env: Record<string, unknown>): boolean {
  const adminToken = env.ADMIN_TOKEN as string | undefined
  if (!adminToken) return false
  const url = new URL(req.url)
  const token =
    url.searchParams.get('token') ??
    req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  return token === adminToken
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  if (!isAuthorized(req, env as Record<string, unknown>)) {
    return errorJson('Unauthorized', 401)
  }

  let body: Record<string, unknown> = {}
  try {
    const text = await req.text()
    if (text.trim()) body = JSON.parse(text) as Record<string, unknown>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const dryRun = body.dryRun === true
  const db = getDB(env as Record<string, unknown>)

  // Count dormant installations only. Do not expose or use feedback email
  // addresses as a marketing list because no explicit marketing consent is
  // currently stored in the OTYA schema.
  const row = await db.prepare(`
    SELECT COUNT(*) AS count
    FROM devices
    WHERE last_seen_at < datetime('now', '-30 days')
  `).first<{ count: number }>()

  const eligibleDormantDevices = row?.count ?? 0

  if (dryRun) {
    return secureJson({
      dryRun: true,
      sent: 0,
      eligibleDormantDevices,
      marketingEnabled: false,
      reason: 'Explicit marketing consent and unsubscribe state are not yet persisted.',
      ts: Date.now(),
    })
  }

  return errorJson(
    'Re-engagement email sending is disabled until explicit marketing consent and unsubscribe state are implemented.',
    409,
  )
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
