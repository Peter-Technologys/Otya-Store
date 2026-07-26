// app/api/equalizer/route.ts
// GET    /api/equalizer          — list user's EQ presets
// POST   /api/equalizer          — upsert an EQ preset
// DELETE /api/equalizer          — delete an EQ preset by id
//
// Cloud sync of user's equalizer presets.
// Requires JWT auth (Authorization: Bearer <token>).
//
// D1 table: eq_presets
//   id          TEXT PRIMARY KEY  — client-generated UUID
//   user_id     TEXT NOT NULL
//   preset_name TEXT NOT NULL
//   bands       TEXT NOT NULL     — JSON array of { freq: number, gain: number }
//   is_default  INTEGER DEFAULT 0
//   created_at  TEXT

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

interface EqBand {
  freq: number
  gain: number
}

// GET /api/equalizer
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return errorJson('Authorization header required', 401)

  const jwtResult = await verifyJwtViaService(env as Record<string, unknown>, token)
  if (!jwtResult.ok) return errorJson(jwtResult.error ?? 'Unauthorized', 401)

  const db = getDB(env as Record<string, unknown>)
  const { results } = await db.prepare(
    'SELECT * FROM eq_presets WHERE user_id = ? ORDER BY is_default DESC, created_at DESC'
  ).bind(jwtResult.user_id!).all<{
    id: string; user_id: string; preset_name: string; bands: string; is_default: number; created_at: string
  }>()

  // Parse bands JSON for each preset
  const presets = results.map(row => ({
    ...row,
    bands: (() => {
      try { return JSON.parse(row.bands) as EqBand[] }
      catch { return [] }
    })(),
  }))

  return secureJson({ presets, ts: Date.now() })
}

// POST /api/equalizer — body: { id, preset_name, bands, is_default? }
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return errorJson('Authorization header required', 401)

  const jwtResult = await verifyJwtViaService(env as Record<string, unknown>, token)
  if (!jwtResult.ok) return errorJson(jwtResult.error ?? 'Unauthorized', 401)

  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return errorJson('Invalid JSON body', 400) }

  const { id, preset_name, bands, is_default } = body as {
    id?:          string
    preset_name?: string
    bands?:       EqBand[]
    is_default?:  boolean | number
  }

  if (!id || !preset_name) {
    return errorJson('id and preset_name are required', 400)
  }
  if (!Array.isArray(bands)) {
    return errorJson('bands must be an array of { freq, gain } objects', 400)
  }

  // Validate bands
  for (const band of bands) {
    if (typeof band.freq !== 'number' || typeof band.gain !== 'number') {
      return errorJson('Each band must have numeric freq and gain fields', 400)
    }
  }

  const db         = getDB(env as Record<string, unknown>)
  const bandsJson  = JSON.stringify(bands)
  const isDefault  = is_default ? 1 : 0
  const now        = new Date().toISOString()

  // If setting as default, clear existing default for this user
  if (isDefault) {
    await db.prepare(
      'UPDATE eq_presets SET is_default = 0 WHERE user_id = ?'
    ).bind(jwtResult.user_id!).run()
  }

  await db.prepare(`
    INSERT INTO eq_presets (id, user_id, preset_name, bands, is_default, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(id) DO UPDATE SET
      preset_name = excluded.preset_name,
      bands       = excluded.bands,
      is_default  = excluded.is_default
  `).bind(
    id,
    jwtResult.user_id!,
    preset_name,
    bandsJson,
    isDefault,
    now,
  ).run()

  return secureJson({ ok: true, ts: Date.now() })
}

// DELETE /api/equalizer — body: { id }
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
  await db.prepare(
    'DELETE FROM eq_presets WHERE id = ? AND user_id = ?'
  ).bind(id, jwtResult.user_id!).run()

  return secureJson({ ok: true, ts: Date.now() })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
