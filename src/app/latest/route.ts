import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getKV, getR2 } from '@/lib/d1'

// GET /latest — returns version.json from R2 with KV read-through cache.
// Used by the website download page and in-app update checker.
const KV_CACHE_KEY  = 'version:current'
const KV_TTL        = 300 // 5 minutes
const DOWNLOAD_PAGE = 'https://petersmartlink.com/download/otya-player'
const ARM64_APK     = 'https://petersmartlink.com/apk/arm64'
const ARM32_APK     = 'https://petersmartlink.com/apk/arm32'

export async function GET(_req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const kv = getKV(env as Record<string, unknown>)
    const r2 = getR2(env as Record<string, unknown>)

    // ── 1. KV LATEST_BUILD_INFO — always reflects the latest published release ──
    // Prefer this over R2 version.json because it is updated atomically when a
    // new release is published and always has the correct changelog.
    try {
      const latestRaw = await kv.get('LATEST_BUILD_INFO')
      if (latestRaw) {
        const info = JSON.parse(latestRaw) as Record<string, unknown>
        // Normalise to version.json schema that the Flutter UpdateService reads:
        //   versionCode (not build_number), changelog (not release_notes)
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
            // `auto` must never silently mean ARM64. Architecture-aware app
            // clients use arm64/arm32 directly; generic callers get the safe
            // download page where the correct build can be selected.
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

    // ── 2. Short-lived KV cache of R2 version.json ────────────────────────────
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

    // ── 3. R2 version.json fallback ───────────────────────────────────────────
    const object = await r2.get('version.json')
    if (!object) {
      return NextResponse.json(
        { error: 'version.json not found in R2. Upload it via wrangler or the dashboard.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } },
      )
    }

    const text = await object.text()
    const data = JSON.parse(text) as Record<string, unknown>

    // Always rewrite download URLs to the canonical domain. `auto` intentionally
    // points at the download page rather than assuming a CPU architecture.
    if (data.downloads && typeof data.downloads === 'object') {
      const dl = data.downloads as Record<string, string>
      dl.arm64 = ARM64_APK
      dl.arm32 = ARM32_APK
      dl.auto  = DOWNLOAD_PAGE
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
