// app/api/themes/route.ts
// GET /api/themes
// Returns the list of available themes from R2.

import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'

export const runtime = 'edge'

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

  // ── 2. List themes from R2 ───────────────────────────────────────────────
  const r2 = (env as Record<string, unknown>).R2 as R2Bucket

  try {
    const listed = await r2.list({ prefix: 'themes/' })
    const themes = listed.objects
      .filter((obj) => obj.key.endsWith('.json'))
      .map((obj) => ({
        id:   obj.key.replace('themes/', '').replace('.json', ''),
        key:  obj.key,
        size: obj.size,
        uploaded: obj.uploaded,
      }))

    return secureJson({ themes, total: themes.length })
  } catch (e) {
    return errorJson(`Failed to list themes: ${e}`, 500)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
