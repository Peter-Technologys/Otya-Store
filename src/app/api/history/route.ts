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

// GET /api/history?user_id=xxx
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const auth = await dualAuth(req, env, verifyRequest)
  if (auth.mode === 'none') return errorJson(auth.error ?? 'Unauthorized', 401)

  // JWT auth: user_id comes from the token; HMAC: from query param
  const userId = auth.mode === 'jwt'
    ? auth.user_id
    : req.nextUrl.searchParams.get('user_id')
  if (!userId) return errorJson('user_id required', 400)

  const db = getDB(env as Record<string, unknown>)
  const { results } = await db.prepare(
    'SELECT * FROM play_history WHERE user_id = ? ORDER BY last_played_at DESC LIMIT 200'
  ).bind(userId).all()
  return secureJson({ history: results, ts: Date.now() })
}

// POST /api/history — upsert a history item
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const auth = await dualAuth(req, env, verifyRequest)
  if (auth.mode === 'none') return errorJson(auth.error ?? 'Unauthorized', 401)

  const body = await req.json() as Record<string, string>
  const { id, user_id, title, artist, file_path, is_video, last_played_at } = body

  // JWT auth: use user_id from token (body user_id is ignored for security)
  const resolvedUserId = auth.mode === 'jwt' ? auth.user_id : user_id
  if (!id || !resolvedUserId || !file_path) {
    return errorJson('id, user_id, file_path required', 400)
  }
  const db  = getDB(env as Record<string, unknown>)
  const now = new Date().toISOString()
  await db.prepare(`
    INSERT INTO play_history (id, user_id, title, artist, file_path, is_video, last_played_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET last_played_at = excluded.last_played_at
  `).bind(
    id, resolvedUserId, title ?? '', artist ?? '', file_path,
    is_video === 'true' || is_video === '1' ? 1 : 0,
    last_played_at ?? now
  ).run()
  return secureJson({ ok: true, ts: Date.now() })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
