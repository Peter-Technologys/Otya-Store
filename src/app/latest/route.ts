import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getKV, getR2 } from '@/lib/d1'

// GET /latest — returns version.json from R2 with KV read-through cache.
// Used by the website download page and in-app update checker.
const KV_CACHE_KEY  = 'version:current'
const KV_TTL        = 300 // 5 minutes

export async function GET(_req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const kv = getKV(env as Record<string, unknown>)
    const r2 = getR2(env as Record<string, unknown>)

    // KV cache first — avoids R2 read on every request
    const cached = await kv.get(KV_CACHE_KEY)
    if (cached) {
      return new NextResponse(cached, {
        headers: {
          'Content-Type':                'application/json',
          'Cache-Control':               `public, max-age=${KV_TTL}`,
          'Access-Control-Allow-Origin': '*',
          'X-Cache':                     'HIT',
        },
      })
    }

    const object = await r2.get('version.json')
    if (!object) {
      return NextResponse.json(
        { error: 'version.json not found in R2. Upload it via wrangler or the dashboard.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const text = await object.text()
    const data = JSON.parse(text) as Record<string, unknown>

    // Always rewrite download URLs to the canonical domain
    if (data.downloads && typeof data.downloads === 'object') {
      const dl = data.downloads as Record<string, string>
      dl.arm64 = 'https://petersmartlink.com/apk/arm64'
      dl.arm32 = 'https://petersmartlink.com/apk/arm32'
      dl.auto  = 'https://petersmartlink.com/apk/arm64'
    }

    const body = JSON.stringify(data)
    // Warm KV cache — fire and forget so a KV write failure never blocks the response
    kv.put(KV_CACHE_KEY, body, { expirationTtl: KV_TTL }).catch(() => {})

    return new NextResponse(body, {
      headers: {
        'Content-Type':                'application/json',
        'Cache-Control':               `public, max-age=${KV_TTL}`,
        'Access-Control-Allow-Origin': '*',
        'X-Cache':                     'MISS',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch version info' }, { status: 500 })
  }
}
