import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
}

// GET /api/playlists?user_id=xxx
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
  if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return errorJson('user_id required', 400)
  const db = getDB(env as Record<string, unknown>)
  const { results } = await db.prepare(
    'SELECT * FROM playlists WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(userId).all()
  return secureJson({ playlists: results, ts: Date.now() })
}

// POST /api/playlists — upsert
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
  if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)
  const body = await req.json() as Record<string, string>
  const { id, user_id, name, media_ids } = body
  if (!id || !user_id || !name) {
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
  `).bind(id, user_id, name, media_ids ?? '[]', now, now).run()
  return secureJson({ ok: true, ts: Date.now() })
}

// DELETE /api/playlists — body: { id, user_id }
export async function DELETE(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
  if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)
  const { id, user_id } = await req.json() as Record<string, string>
  if (!id || !user_id) return errorJson('id, user_id required', 400)
  const db = getDB(env as Record<string, unknown>)
  await db.prepare('DELETE FROM playlists WHERE id = ? AND user_id = ?').bind(id, user_id).run()
  return secureJson({ ok: true, ts: Date.now() })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
