import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const CORS = { 'Access-Control-Allow-Origin': '*' }

// GET /api/playlists?user_id=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  const { env } = await getCloudflareContext()
  const db = (env as Record<string, unknown>).DB as D1Database
  const { results } = await db.prepare(
    'SELECT * FROM playlists WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(userId).all()
  return NextResponse.json({ playlists: results }, { headers: CORS })
}

// POST /api/playlists — upsert
export async function POST(req: NextRequest) {
  const body = await req.json() as Record<string, string>
  const { id, user_id, name, media_ids } = body
  if (!id || !user_id || !name) {
    return NextResponse.json({ error: 'id, user_id, name required' }, { status: 400 })
  }
  const { env } = await getCloudflareContext()
  const db  = (env as Record<string, unknown>).DB as D1Database
  const now = new Date().toISOString()
  await db.prepare(`
    INSERT INTO playlists (id, user_id, name, media_ids, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      name       = excluded.name,
      media_ids  = excluded.media_ids,
      updated_at = excluded.updated_at
  `).bind(id, user_id, name, media_ids ?? '[]', now, now).run()
  return NextResponse.json({ ok: true }, { headers: CORS })
}

// DELETE /api/playlists — body: { id, user_id }
export async function DELETE(req: NextRequest) {
  const { id, user_id } = await req.json() as Record<string, string>
  if (!id || !user_id) return NextResponse.json({ error: 'id, user_id required' }, { status: 400 })
  const { env } = await getCloudflareContext()
  const db = (env as Record<string, unknown>).DB as D1Database
  await db.prepare('DELETE FROM playlists WHERE id = ? AND user_id = ?').bind(id, user_id).run()
  return NextResponse.json({ ok: true }, { headers: CORS })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      ...CORS,
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
