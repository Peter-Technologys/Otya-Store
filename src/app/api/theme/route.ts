// app/api/theme/route.ts
// GET /api/theme?id=<id>
// Returns the active theme — auto seasonal or a specific theme by ID.
// Reads from KV (config:theme, config:seasonal-schedule) and R2 (otya-player-releases).

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'
import { getKV, getR2 } from '@/lib/d1'

interface SeasonalEntry {
  id: string
  // Old format (plain array)
  start?: string // "MM-DD"
  end?: string   // "MM-DD"
  // New KV format ({ themes: [...] })
  active_from?: string // "MM-DD"
  active_to?: string   // "MM-DD"
  r2_path?: string     // explicit R2 key, e.g. "configs/seasonal/xmas.json"
  priority?: number    // higher wins when overlapping seasons
}

function isDateInRange(now: Date, start: string, end: string): boolean {
  const [sm, sd] = start.split('-').map(Number)
  const [em, ed] = end.split('-').map(Number)
  const month = now.getMonth() + 1
  const day   = now.getDate()

  const nowVal   = month * 100 + day
  const startVal = sm * 100 + sd
  const endVal   = em * 100 + ed

  if (startVal <= endVal) {
    return nowVal >= startVal && nowVal <= endVal
  }
  // Wraps across year boundary (e.g. Dec–Jan)
  return nowVal >= startVal || nowVal <= endVal
}

async function hashJson(data: unknown): Promise<string> {
  const bytes  = new TextEncoder().encode(JSON.stringify(data))
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest))
    .slice(0, 8)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
}

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  // ── 1. Verify HMAC signature ─────────────────────────────────────────────
  const auth = await verifyRequest(request, env as { OTYA_STORE_ADMIN_TOKEN: string })
  if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)

  // ── 2. Resolve theme ─────────────────────────────────────────────────────
  const { searchParams } = new URL(request.url)
  const requestedId = searchParams.get('id')
  let themeData: unknown = null
  let source = 'default'

  const kv = getKV(env as Record<string, unknown>)
  const r2 = getR2(env as Record<string, unknown>)

  // Try to load a specific theme by ID from R2
  if (requestedId && requestedId !== 'auto') {
    try {
      const obj = await r2.get(`themes/${requestedId}.json`)
      if (obj) {
        const text = await obj.text()
        themeData = JSON.parse(text)
        source = `r2:${requestedId}`
      }
    } catch {
      // Fall through to auto/default
    }
  }

  // Auto: check seasonal schedule from KV
  // KV stores either a plain array OR { themes: [...] } with active_from/active_to
  // and an explicit r2_path. Handle both formats so old and new KV data both work.
  if (!themeData) {
    try {
      const scheduleRaw = await kv.get('config:seasonal-schedule')
      if (scheduleRaw) {
        const parsed = JSON.parse(scheduleRaw) as SeasonalEntry[] | { themes?: SeasonalEntry[] }
        const entries: SeasonalEntry[] = Array.isArray(parsed)
          ? parsed
          : ((parsed as { themes?: SeasonalEntry[] }).themes ?? [])

        // Sort by priority descending so higher-priority seasons win
        const sorted = [...entries].sort((a, b) => (b.priority ?? 0) - (a.priority ?? 0))
        const now = new Date()

        for (const entry of sorted) {
          // Support both start/end (old) and active_from/active_to (new KV format)
          const startDate = entry.start ?? entry.active_from
          const endDate   = entry.end   ?? entry.active_to
          if (!startDate || !endDate) continue

          if (isDateInRange(now, startDate, endDate)) {
            // Prefer explicit r2_path; fall back to themes/{id}.json convention
            const r2Key = entry.r2_path ?? `themes/${entry.id}.json`
            const obj = await r2.get(r2Key)
            if (obj) {
              const text = await obj.text()
              themeData = JSON.parse(text)
              source = `seasonal:${entry.id}`
              break
            }
          }
        }
      }
    } catch {
      // Fall through to default
    }
  }

  // Default theme from KV
  if (!themeData) {
    try {
      const raw = await kv.get('config:theme')
      if (raw) {
        themeData = JSON.parse(raw)
        source = 'kv:default'
      }
    } catch {
      // Nothing available
    }
  }

  if (!themeData) {
    return errorJson('Theme not found', 404)
  }

  // ── 3. ETag for conditional GET ──────────────────────────────────────────
  const etag = `"${await hashJson(themeData)}"`
  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304 })
  }

  return secureJson(themeData, {
    cache: 'public, max-age=3600, stale-while-revalidate=600',
    source,
  })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
