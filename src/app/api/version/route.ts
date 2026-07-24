// app/api/version/route.ts
// GET /api/version
// Returns the latest build info from KV (LATEST_BUILD_INFO).
// ETag format: "version-buildnumber"

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'
import { getKV } from '@/lib/d1'

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

  // ── 2. Read version info from KV ─────────────────────────────────────────
  const kv  = getKV(env as Record<string, unknown>)
  const raw = await kv.get('LATEST_BUILD_INFO')
  if (!raw) return errorJson('Version info not found', 404)

  let data: Record<string, unknown>
  try {
    data = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return errorJson('Version info is malformed', 500)
  }

  // ── 3. ETag: "version-buildnumber" ───────────────────────────────────────
  const version     = data.version     ?? data.versionName ?? ''
  const buildNumber = data.build_number ?? data.versionCode ?? data.buildNumber ?? ''
  const etag = `"${version}-${buildNumber}"`

  if (request.headers.get('If-None-Match') === etag) {
    return new Response(null, { status: 304 })
  }

  return secureJson(data, {
    cache: 'public, max-age=300, stale-while-revalidate=60',
  })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
