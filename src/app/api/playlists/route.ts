import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { dualAuth } from '@/lib/auth-service'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
}

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const auth = await dualAuth(req, env, verifyRequest)
  if (auth.mode === 'none') return errorJson(auth.error ?? 'Unauthorized', 401)

  const userId = auth.mode === 'jwt'
    ? auth.user_id
    : req.nextUrl.searchParams.get('user_id')
  if (!userId) return errorJson('user_id required', 400)

  const db = getDB(env as Record<string, unknown>)
  const { results } = await db.prepare(
    'SELECT * FROM playlists WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(userId).all()
  return secureJson({ playlists: results, ts: Date.now() })
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const auth = await dualAuth(req, env, verifyRequest)
  if (auth.mode === 'none') return errorJson(auth.error ?? 'Unauthorized', 401)

  let body: Record<string, string>
  try {
    body = await req.json() as Record<string, string>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const id = body.id?.trim()
  const name = body.name?.trim()
  const mediaIds = body.media_ids ?? '[]'
  const resolvedUserId = auth.mode === 'jwt' ? auth.user_id : body.user_id?.trim()
  if (!id || !resolvedUserId || !name) {
    return errorJson('id, user_id, name required', 400)
  }

  const db  = getDB(env as Record<string, unknown>)
  const now = new Date().toISOString()
  await db.prepare(`
    INSERT INTO playlists (id, user_id, name, media_ids, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name       = excluded.name,
      media_ids  = excluded.media_ids,
      updated_at = excluded.updated_at
  `).bind(id, resolvedUserId, name.slice(0, 200), mediaIds, now, now).run()
  return secureJson({ ok: true, ts: Date.now() })
}

// Flutter sends DELETE query parameters. Accept an optional JSON body as a
// backwards-compatible fallback, but ownership always comes from JWT when used.
export async function DELETE(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const auth = await dualAuth(req, env, verifyRequest)
  if (auth.mode === 'none') return errorJson(auth.error ?? 'Unauthorized', 401)

  let id = req.nextUrl.searchParams.get('id')?.trim() ?? ''
  let legacyUserId = req.nextUrl.searchParams.get('user_id')?.trim() ?? ''

  if (!id) {
    try {
      const body = await req.json() as Record<string, string>
      id = body.id?.trim() ?? ''
      legacyUserId = legacyUserId || body.user_id?.trim() || ''
    } catch { /* query-string form needs no body */ }
  }

  const resolvedUserId = auth.mode === 'jwt' ? auth.user_id : legacyUserId
  if (!id || !resolvedUserId) return errorJson('id and user_id required', 400)

  const db = getDB(env as Record<string, unknown>)
  await db.prepare('DELETE FROM playlists WHERE id = ? AND user_id = ?')
    .bind(id, resolvedUserId)
    .run()
  return secureJson({ ok: true, ts: Date.now() })
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
