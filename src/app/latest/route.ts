import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getKV, getR2 } from '@/lib/d1'

// GET /latest — returns the current public release state.
// Before the first approved release it deliberately returns HTTP 200 with
// published:false rather than inventing version metadata or treating the clean
// pre-release R2 bucket as an operational error.
const KV_CACHE_KEY  = 'version:current'
const KV_TTL        = 300 // 5 minutes
const DOWNLOAD_PAGE = 'https://petersmartlink.com/download/otya-player'
const ARM64_APK     = 'https://petersmartlink.com/apk/arm64'
const ARM32_APK     = 'https://petersmartlink.com/apk/arm32'

function releaseDownloads() {
  return {
    arm64: ARM64_APK,
    arm32: ARM32_APK,
    auto: DOWNLOAD_PAGE,
  }
}

function noPublicRelease() {
  return NextResponse.json(
    {
      published: false,
      version: null,
      versionCode: null,
      tag: null,
      date: null,
      changelog: '',
      minSdk: 21,
      targetSdk: 36,
      downloads: releaseDownloads(),
    },
    {
      status: 200,
      headers: {
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': '*',
        'X-OTYA-Release-State': 'pre-release',
      },
    },
  )
}

export async function GET(_req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const kv = getKV(env as Record<string, unknown>)
    const r2 = getR2(env as Record<string, unknown>)

    // 1. Atomic release metadata written only after an approved publication.
    try {
      const latestRaw = await kv.get('LATEST_BUILD_INFO')
      if (latestRaw) {
        const info = JSON.parse(latestRaw) as Record<string, unknown>
        const data: Record<string, unknown> = {
          published: true,
          version:     info.version,
          versionCode: info.build_number ?? info.versionCode,
          changelog:   info.release_notes ?? info.changelog ?? '',
          date:        info.date,
          minSdk:      info.minSdk ?? 21,
          targetSdk:   info.targetSdk ?? 36,
          downloads:   releaseDownloads(),
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
    } catch { /* fall through to cache/R2 */ }

    // 2. Short-lived cache of an already-published R2 version.json.
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

    // 3. R2 fallback. Missing metadata is normal before first release.
    const object = await r2.get('version.json')
    if (!object) return noPublicRelease()

    const text = await object.text()
    const data = JSON.parse(text) as Record<string, unknown>
    data.published = true

    if (data.downloads && typeof data.downloads === 'object') {
      const dl = data.downloads as Record<string, string>
      dl.arm64 = ARM64_APK
      dl.arm32 = ARM32_APK
      dl.auto  = DOWNLOAD_PAGE
    } else {
      data.downloads = releaseDownloads()
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
    return NextResponse.json({ error: 'Failed to fetch version info' }, { status: 500 })
  }
}
