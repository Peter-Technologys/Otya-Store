// app/api/user/theme/route.ts
// GET  /api/user/theme  — return user's saved theme preference
// POST /api/user/theme  — save user's theme preference
//
// Requires JWT auth (Authorization: Bearer <token>).
// Stores preferences in the user_preferences D1 table.

import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyJwtViaService, extractBearerToken } from '@/lib/auth-service'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const VALID_THEMES = ['dark', 'light', 'amoled'] as const
type ThemeValue = typeof VALID_THEMES[number]

// GET /api/user/theme
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return errorJson('Authorization header required', 401)

  const jwtResult = await verifyJwtViaService(env as Record<string, unknown>, token)
  if (!jwtResult.ok) return errorJson(jwtResult.error ?? 'Unauthorized', 401)

  const db  = getDB(env as Record<string, unknown>)
  const row = await db.prepare(
    'SELECT theme, accent_color, updated_at FROM user_preferences WHERE user_id = ?'
  ).bind(jwtResult.user_id!).first<{ theme: string | null; accent_color: string | null; updated_at: string }>()

  return secureJson({
    user_id:      jwtResult.user_id,
    theme:        row?.theme        ?? null,
    accent_color: row?.accent_color ?? null,
    updated_at:   row?.updated_at   ?? null,
    ts:           Date.now(),
  })
}

// POST /api/user/theme — body: { theme, accent_color }
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return errorJson('Authorization header required', 401)

  const jwtResult = await verifyJwtViaService(env as Record<string, unknown>, token)
  if (!jwtResult.ok) return errorJson(jwtResult.error ?? 'Unauthorized', 401)

  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return errorJson('Invalid JSON body', 400) }

  const { theme, accent_color } = body as { theme?: string; accent_color?: string }

  if (theme && !VALID_THEMES.includes(theme as ThemeValue)) {
    return errorJson(`theme must be one of: ${VALID_THEMES.join(', ')}`, 400)
  }

  // Validate accent_color is a hex color if provided
  if (accent_color && !/^#[0-9a-fA-F]{6}$/.test(accent_color)) {
    return errorJson('accent_color must be a 6-digit hex color (e.g. #6366f1)', 400)
  }

  const db  = getDB(env as Record<string, unknown>)
  const now = new Date().toISOString()

  await db.prepare(`
    INSERT INTO user_preferences (user_id, theme, accent_color, updated_at)
    VALUES (?, ?, ?, ?)
    ON CONFLICT(user_id) DO UPDATE SET
      theme        = COALESCE(excluded.theme,        user_preferences.theme),
      accent_color = COALESCE(excluded.accent_color, user_preferences.accent_color),
      updated_at   = excluded.updated_at
  `).bind(
    jwtResult.user_id!,
    theme        ?? null,
    accent_color ?? null,
    now,
  ).run()

  return secureJson({ ok: true, ts: Date.now() })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
