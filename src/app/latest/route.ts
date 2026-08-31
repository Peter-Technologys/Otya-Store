import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getKV, getR2 } from '@/lib/d1'

// GET /latest — returns version.json from R2 with KV read-through cache.
// Used by the website download page and in-app update checker.
const KV_CACHE_KEY  = 'version:current'
const KV_TTL        = 300 // 5 minutes
const DOWNLOAD_PAGE = 'https://petersmartlink.com/download/otya'
const ARM64_APK     = 'https://petersmartlink.com/apk/arm64'
const ARM32_APK     = 'https://petersmartlink.com/apk/arm32'

export async function GET(_req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const kv = getKV(env as Record<string, unknown>)
    const r2 = getR2(env as Record<string, unknown>)

    try {
      const latestRaw = await kv.get('LATEST_BUILD_INFO')
      if (latestRaw) {
        const info = JSON.parse(latestRaw) as Record<string, unknown>
        const data: Record<string, unknown> = {
          version:     info.version,
          versionCode: info.build_number ?? info.versionCode,
          changelog:   info.release_notes ?? info.changelog ?? '',
          date:        info.date,
          minSdk:      info.minSdk ?? 21,
          targetSdk:   info.targetSdk ?? 36,
          downloads: {
            arm64: ARM64_APK,
            arm32: ARM32_APK,
            auto:  DOWNLOAD_PAGE,
          },
        }
        return new NextResponse(JSON.stringify(data), {
          headers: {
            'Content-Type':                'application/json',
            'Cache-Control':               `public, max-age=${KV_TTL}`,
            'Access-Control-Allow-Origin': '*',
            'X-Source':                    'kv-latest-build-info',
          },
        })
      }
    } catch { /* fall through to R2 */ }

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
        { error: 'No Otya release is available yet.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const text = await object.text()
    const data = JSON.parse(text) as Record<string, unknown>

    if (data.downloads && typeof data.downloads === 'object') {
      const dl = data.downloads as Record<string, string>
      dl.arm64 = ARM64_APK
      dl.arm32 = ARM32_APK
      dl.auto  = DOWNLOAD_PAGE
      dl.page  = DOWNLOAD_PAGE
    }

    const body = JSON.stringify(data)
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
    return NextResponse.json({ error: 'Could not load the latest Otya version.' }, { status: 500 })
  }
}
