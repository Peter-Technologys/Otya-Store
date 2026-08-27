import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDB, getKV, getR2 } from '@/lib/d1'

// GET /check-update
// Public endpoint — no auth required.
// Called by UpdateCheckWorker.kt (Android WorkManager) every 24 hours.
// Priority: KV (LATEST_BUILD_INFO) → D1 releases table → R2 version.json

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const CACHE_HEADERS = {
  ...CORS_HEADERS,
  'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
}

function asVersionCode(data: Record<string, unknown>): number {
  const raw = data.versionCode ?? data.build_number ?? data.version_code ?? 0
  if (typeof raw === 'number') return Number.isFinite(raw) ? Math.trunc(raw) : 0
  if (typeof raw === 'string') {
    const parsed = Number.parseInt(raw, 10)
    return Number.isFinite(parsed) ? parsed : 0
  }
  return 0
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' && value.trim() ? value : fallback
}

function normaliseRelease(data: Record<string, unknown>) {
  const workerUrl = asString(data.workerUrl, 'https://petersmartlink.com').replace(/\/$/, '')
  return {
    versionCode:  asVersionCode(data),
    version:      asString(data.version),
    changelog:    asString(data.changelog ?? data.release_notes, 'Bug fixes and improvements.'),
    force_update: Boolean(data.force_update),
    download_url: asString(data.download_url, `${workerUrl}/download/otya-player`),
  }
}

export async function GET(_req: NextRequest) {
  try {
    const { env } = await getCloudflareContext({ async: true })

    // 1. KV — fastest, written by publish_r2.sh immediately after upload.
    // publish_r2.sh historically used build_number/release_notes, so normalize
    // those names here to the exact versionCode/changelog contract Android reads.
    try {
      const kv  = getKV(env as Record<string, unknown>)
      const raw = await kv.get('LATEST_BUILD_INFO')
      if (raw) {
        const data = JSON.parse(raw) as Record<string, unknown>
        const release = normaliseRelease(data)
        if (release.versionCode > 0 && release.version) {
          return NextResponse.json(release, { headers: CACHE_HEADERS })
        }
      }
    } catch { /* fall through */ }

    // 2. D1 releases table
    try {
      const db  = getDB(env as Record<string, unknown>)
      const row = await db.prepare(
        'SELECT version_code, version, changelog, force_update, download_url FROM releases ORDER BY version_code DESC LIMIT 1'
      ).first<Record<string, unknown>>()
      if (row) {
        const release = normaliseRelease(row)
        if (release.versionCode > 0 && release.version) {
          return NextResponse.json(release, { headers: CACHE_HEADERS })
        }
      }
    } catch { /* fall through */ }

    // 3. R2 version.json fallback
    try {
      const r2  = getR2(env as Record<string, unknown>) as unknown as {
        get(key: string): Promise<{ text(): Promise<string> } | null>
      }
      const obj = await r2.get('version.json')
      if (obj) {
        const data = JSON.parse(await obj.text()) as Record<string, unknown>
        const release = normaliseRelease(data)
        if (release.versionCode > 0 && release.version) {
          return NextResponse.json(release, { headers: CACHE_HEADERS })
        }
      }
    } catch { /* fall through */ }

    return NextResponse.json(
      { error: 'Version info not available' },
      { status: 404, headers: CORS_HEADERS },
    )
  } catch (e) {
    console.error('[check-update] Unexpected error:', e)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500, headers: CORS_HEADERS },
    )
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
