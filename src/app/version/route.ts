import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const KV_CACHE_KEY  = 'version:current'
const KV_TTL        = 300

// GET /version — returns version.json from KV cache or R2.
// Serves the same data as /latest but via a direct KV/R2 read
// instead of an internal HTTP round-trip, which adds latency and
// can fail when the Worker is cold-starting.
export async function GET(_req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const kv = (env as Record<string, unknown>).KV as KVNamespace | undefined
    const r2 = (env as Record<string, unknown>).R2 as {
      get(key: string): Promise<{ text(): Promise<string> } | null>
    } | undefined

    if (kv) {
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
    }

    if (!r2) return NextResponse.json({ error: 'Storage not available' }, { status: 503 })
    const obj = await r2.get('version.json')
    if (!obj) return NextResponse.json({ error: 'version.json not found' }, { status: 404 })

    const text = await obj.text()
    const data = JSON.parse(text)
    if (data.downloads) {
      data.downloads.arm64 = 'https://petersmartlink.com/apk/arm64'
      data.downloads.arm32 = 'https://petersmartlink.com/apk/arm32'
      data.downloads.auto  = 'https://petersmartlink.com/apk/arm64'
    }
    const body = JSON.stringify(data)
    if (kv) await kv.put(KV_CACHE_KEY, body, { expirationTtl: KV_TTL })

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
