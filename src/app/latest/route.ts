import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// GET /latest — returns version.json from R2 with KV read-through cache.
// Used by the in-app update checker (UpdateService.checkForUpdate).
//
// BUG 3: Added KV read-through cache with 5-minute TTL so repeated calls
// from many devices do not hit R2 on every request. KV key: 'version:current'.
// This matches the README description of KV being used for version caching.
const KV_CACHE_KEY = 'version:current'
const KV_TTL_SECONDS = 300 // 5 minutes

export async function GET(_req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const kv = (env as Record<string, unknown>).KV as KVNamespace | undefined
    const r2 = (env as Record<string, unknown>).R2 as {
      get(key: string): Promise<{ text(): Promise<string>; size: number } | null>
    } | undefined

    if (!r2) {
      return NextResponse.json({ error: 'Storage not available' }, { status: 503 })
    }

    // BUG 3: Check KV cache first — avoids R2 read on every request.
    if (kv) {
      const cached = await kv.get(KV_CACHE_KEY)
      if (cached) {
        return new NextResponse(cached, {
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': `public, max-age=${KV_TTL_SECONDS}`,
            'Access-Control-Allow-Origin': '*',
            'X-Cache': 'HIT',
          },
        })
      }
    }

    const object = await r2.get('version.json')
    if (!object) {
      // Fallback so the app never crashes on a missing version.json
      return NextResponse.json({
        version: '1.4.0',
        versionCode: 7,
        date: new Date().toISOString(),
        changelog: 'See petersmartlink.com/download/otya-player for details.',
        downloads: {
          arm64: 'https://petersmartlink.com/apk/arm64',
          arm32: 'https://petersmartlink.com/apk/arm32',
          auto:  'https://petersmartlink.com/apk/arm64',
        },
      }, {
        headers: { 'Cache-Control': 'public, max-age=60', 'Access-Control-Allow-Origin': '*' },
      })
    }

    const text = await object.text()
    const data = JSON.parse(text)

    // Always rewrite download URLs to petersmartlink.com
    // (old version.json files may still reference the old subdomain)
    if (data.downloads) {
      data.downloads.arm64 = 'https://petersmartlink.com/apk/arm64'
      data.downloads.arm32 = 'https://petersmartlink.com/apk/arm32'
      data.downloads.auto  = 'https://petersmartlink.com/apk/arm64'
    }

    const responseBody = JSON.stringify(data)

    // BUG 3: Store in KV with TTL so subsequent requests are served from cache.
    if (kv) {
      await kv.put(KV_CACHE_KEY, responseBody, { expirationTtl: KV_TTL_SECONDS })
    }

    return new NextResponse(responseBody, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${KV_TTL_SECONDS}`,
        'Access-Control-Allow-Origin': '*',
        'X-Cache': 'MISS',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch version info' }, { status: 500 })
  }
}
