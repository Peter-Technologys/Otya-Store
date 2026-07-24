// app/api/theme/route.ts
// GET /api/theme?id=<id>
// Returns the active theme — auto seasonal or a specific theme by ID.
// Reads from KV (config:theme, config:seasonal-schedule) and R2 (otya-player-releases).

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'

export const runtime = 'edge'

interface SeasonalEntry {
  id: string
  start: string // "MM-DD"
  end: string   // "MM-DD"
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

  const kv = (env as Record<string, unknown>).KV as KVNamespace
  const r2 = (env as Record<string, unknown>).R2 as R2Bucket

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

  // Auto: check seasonal schedule
  if (!themeData) {
    try {
      const scheduleRaw = await kv.get('config:seasonal-schedule')
      if (scheduleRaw) {
        const schedule = JSON.parse(scheduleRaw) as SeasonalEntry[]
        const now = new Date()
        for (const entry of schedule) {
          if (isDateInRange(now, entry.start, entry.end)) {
            const obj = await r2.get(`themes/${entry.id}.json`)
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
