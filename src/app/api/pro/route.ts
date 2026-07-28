import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { dualAuth } from '@/lib/auth-service'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
}

// GET /api/pro?user_id=xxx
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const auth = await dualAuth(req, env, verifyRequest)
  if (auth.mode === 'none') return errorJson(auth.error ?? 'Unauthorized', 401)

  const userId = auth.mode === 'jwt'
    ? auth.user_id
    : req.nextUrl.searchParams.get('user_id')
  if (!userId) return errorJson('user_id required', 400)

  const db = getDB(env as Record<string, unknown>)
  const row = await db.prepare(
    'SELECT expiry_ms FROM pro_status WHERE user_id = ?'
  ).bind(userId).first<{ expiry_ms: number }>()
  return secureJson({ expiry_ms: row?.expiry_ms ?? 0, ts: Date.now() })
}

// POST /api/pro — body: { user_id, expiry_ms }
// Note: setting pro status is an admin/payment-processor action.
// JWT users can only read their own status (GET). POST requires HMAC for admin use.
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const auth = await dualAuth(req, env, verifyRequest)
  if (auth.mode === 'none') return errorJson(auth.error ?? 'Unauthorized', 401)
  if (auth.mode === 'jwt') return errorJson('Forbidden', 403)

  const body = await req.json() as Record<string, unknown>
  const resolvedUserId = body.user_id as string | undefined
  if (!resolvedUserId) return errorJson('user_id required', 400)

  const { expiry_ms } = body
  const db  = getDB(env as Record<string, unknown>)
  const now = new Date().toISOString()
  await db.prepare(`
    INSERT INTO pro_status (user_id, expiry_ms, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      expiry_ms  = excluded.expiry_ms,
      updated_at = excluded.updated_at
  `).bind(resolvedUserId, Number(expiry_ms ?? 0), now).run()
  return secureJson({ ok: true, ts: Date.now() })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
