import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAppToken, API_CORS } from '@/lib/auth'
import { getDB } from '@/lib/d1'

const CORS = API_CORS

// GET /api/pro?user_id=xxx
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const authErr = requireAppToken(req, env as Record<string, unknown>)
  if (authErr) return authErr
  const userId = req.nextUrl.searchParams.get('user_id')
  if (!userId) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  const db = getDB(env as Record<string, unknown>)
  const row = await db.prepare(
    'SELECT expiry_ms FROM pro_status WHERE user_id = ?'
  ).bind(userId).first<{ expiry_ms: number }>()
  return NextResponse.json({ expiry_ms: row?.expiry_ms ?? 0, ts: Date.now() }, { headers: CORS })
}

// POST /api/pro — body: { user_id, expiry_ms }
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const authErr = requireAppToken(req, env as Record<string, unknown>)
  if (authErr) return authErr
  const { user_id, expiry_ms } = await req.json() as Record<string, unknown>
  if (!user_id) return NextResponse.json({ error: 'user_id required' }, { status: 400 })
  const db  = getDB(env as Record<string, unknown>)
  const now = new Date().toISOString()
  await db.prepare(`
    INSERT INTO pro_status (user_id, expiry_ms, updated_at)
    VALUES (?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      expiry_ms  = excluded.expiry_ms,
      updated_at = excluded.updated_at
  `).bind(user_id, Number(expiry_ms ?? 0), now).run()
  return NextResponse.json({ ok: true, ts: Date.now() }, { headers: CORS })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}
