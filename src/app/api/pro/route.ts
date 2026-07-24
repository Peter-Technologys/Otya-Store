import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
}

// GET /api/pro?user_id=xxx
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
  if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return errorJson('user_id required', 400)
  const db = getDB(env as Record<string, unknown>)
  const row = await db.prepare(
    'SELECT expiry_ms FROM pro_status WHERE user_id = ?'
  ).bind(userId).first<{ expiry_ms: number }>()
  return secureJson({ expiry_ms: row?.expiry_ms ?? 0, ts: Date.now() })
}

// POST /api/pro — body: { user_id, expiry_ms }
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
  if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)
  const { user_id, expiry_ms } = await req.json() as Record<string, unknown>
  if (!user_id) return errorJson('user_id required', 400)
  const db  = getDB(env as Record<string, unknown>)
  const now = new Date().toISOString()
  await db.prepare(`
    INSERT INTO pro_status (user_id, expiry_ms, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      expiry_ms  = excluded.expiry_ms,
      updated_at = excluded.updated_at
  `).bind(user_id, Number(expiry_ms ?? 0), now).run()
  return secureJson({ ok: true, ts: Date.now() })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
