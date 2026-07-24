import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getKV, getR2 } from '@/lib/d1'

const KV_CACHE_KEY = 'version:current'
const KV_TTL       = 300

// GET /version — returns version.json from KV cache or R2.
// Public endpoint (no HMAC) — used by the website download page.
export async function GET(_req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const kv = getKV(env as Record<string, unknown>)
    const r2 = getR2(env as Record<string, unknown>)

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

    const obj = await r2.get('version.json')
    if (!obj) return NextResponse.json({ error: 'version.json not found' }, { status: 404 })

    const text = await obj.text()
    const data = JSON.parse(text) as Record<string, unknown>
    if (data.downloads && typeof data.downloads === 'object') {
      const dl = data.downloads as Record<string, string>
      dl.arm64 = 'https://petersmartlink.com/apk/arm64'
      dl.arm32 = 'https://petersmartlink.com/apk/arm32'
      dl.auto  = 'https://petersmartlink.com/apk/arm64'
    }
    const body = JSON.stringify(data)
    // Warm KV cache — fire and forget
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
