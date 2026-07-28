// app/api/bookmarks/route.ts
// GET    /api/bookmarks          — list user's bookmarks
// POST   /api/bookmarks          — upsert a bookmark (resume position)
// DELETE /api/bookmarks          — delete a bookmark by id
//
// Cloud sync of bookmarked media positions for resume playback.
// Requires JWT auth (Authorization: Bearer <token>).
//
// D1 table: bookmarks
//   id          TEXT PRIMARY KEY  — client-generated UUID
//   user_id     TEXT NOT NULL
//   media_id    TEXT NOT NULL     — unique identifier for the media file
//   file_path   TEXT              — local file path on device
//   position_ms INTEGER           — playback position in milliseconds
//   duration_ms INTEGER           — total duration in milliseconds
//   title       TEXT              — display title
//   updated_at  TEXT

import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyJwtViaService, extractBearerToken } from '@/lib/auth-service'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// GET /api/bookmarks
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return errorJson('Authorization header required', 401)

  const jwtResult = await verifyJwtViaService(env as Record<string, unknown>, token)
  if (!jwtResult.ok) return errorJson(jwtResult.error ?? 'Unauthorized', 401)

  const db = getDB(env as Record<string, unknown>)
  const { results } = await db.prepare(
    'SELECT * FROM bookmarks WHERE user_id = ? ORDER BY updated_at DESC'
  ).bind(jwtResult.user_id!).all()

  return secureJson({ bookmarks: results, ts: Date.now() })
}

// POST /api/bookmarks — body: { id, media_id, file_path?, position_ms, duration_ms?, title? }
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return errorJson('Authorization header required', 401)

  const jwtResult = await verifyJwtViaService(env as Record<string, unknown>, token)
  if (!jwtResult.ok) return errorJson(jwtResult.error ?? 'Unauthorized', 401)

  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return errorJson('Invalid JSON body', 400) }

  const { id, media_id, file_path, position_ms, duration_ms, title } = body as {
    id?:          string
    media_id?:    string
    file_path?:   string
    position_ms?: number
    duration_ms?: number
    title?:       string
  }

  if (!id || !media_id) {
    return errorJson('id and media_id are required', 400)
  }
  if (position_ms == null || isNaN(Number(position_ms))) {
    return errorJson('position_ms is required and must be a number', 400)
  }

  const db  = getDB(env as Record<string, unknown>)
  const now = new Date().toISOString()

  await db.prepare(`
    INSERT INTO bookmarks (id, user_id, media_id, file_path, position_ms, duration_ms, title, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      media_id    = excluded.media_id,
      file_path   = excluded.file_path,
      position_ms = excluded.position_ms,
      duration_ms = excluded.duration_ms,
      title       = excluded.title,
      updated_at  = excluded.updated_at
  `).bind(
    id,
    jwtResult.user_id!,
    media_id,
    file_path   ?? null,
    Number(position_ms),
    duration_ms != null ? Number(duration_ms) : null,
    title       ?? null,
    now,
  ).run()

  return secureJson({ ok: true, ts: Date.now() })
}

// DELETE /api/bookmarks — body: { id }
export async function DELETE(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return errorJson('Authorization header required', 401)

  const jwtResult = await verifyJwtViaService(env as Record<string, unknown>, token)
  if (!jwtResult.ok) return errorJson(jwtResult.error ?? 'Unauthorized', 401)

  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return errorJson('Invalid JSON body', 400) }

  const { id } = body as { id?: string }
  if (!id) return errorJson('id is required', 400)

  const db = getDB(env as Record<string, unknown>)
  // Scope deletion to user_id to prevent cross-user deletion
  await db.prepare(
    'DELETE FROM bookmarks WHERE id = ? AND user_id = ?'
  ).bind(id, jwtResult.user_id!).run()

  return secureJson({ ok: true, ts: Date.now() })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
