import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const CORS = { 'Access-Control-Allow-Origin': '*' }

// GET /api/history?user_id=xxx
export async function GET(req: NextRequest) {
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  const { env } = await getCloudflareContext()
  const db = (env as Record<string, unknown>).DB as D1Database
  const { results } = await db.prepare(
    'SELECT * FROM play_history WHERE user_id = ? ORDER BY last_played_at DESC LIMIT 200'
  ).bind(userId).all()
  return NextResponse.json({ history: results }, { headers: CORS })
}

// POST /api/history — upsert a history item
export async function POST(req: NextRequest) {
  const body = await req.json() as Record<string, unknown>
  const { id, user_id, title, artist, file_path, is_video, last_played_at } =
    body as Record<string, string>
  if (!id || !user_id || !file_path) {
    return NextResponse.json({ error: 'id, user_id, file_path required' }, { status: 400 })
  }
  const { env } = await getCloudflareContext()
  const db  = (env as Record<string, unknown>).DB as D1Database
  const now = new Date().toISOString()
  await db.prepare(`
    INSERT INTO play_history (id, user_id, title, artist, file_path, is_video, last_played_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET last_played_at = excluded.last_played_at
  `).bind(
    id, user_id, title ?? '', artist ?? '', file_path,
    is_video === 'true' || is_video === '1' ? 1 : 0,
    last_played_at ?? now
  ).run()
  return NextResponse.json({ ok: true }, { headers: CORS })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    headers: {
      ...CORS,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  })
}
