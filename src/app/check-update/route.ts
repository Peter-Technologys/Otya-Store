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

export async function GET(_req: NextRequest) {
  try {
    const { env } = await getCloudflareContext({ async: true })

    // 1. KV — fastest, written by publish_r2.sh immediately after upload
    try {
      const kv  = getKV(env as Record<string, unknown>)
      const raw = await kv.get('LATEST_BUILD_INFO')
      if (raw) {
        const data = JSON.parse(raw) as Record<string, unknown>
        return NextResponse.json({
          versionCode:   data.versionCode   ?? 0,
          version:       data.version       ?? '',
          changelog:     data.changelog     ?? 'Bug fixes and improvements.',
          force_update:  data.force_update  ?? false,
          download_url:  data.workerUrl
            ? `${data.workerUrl}/download/otya-player`
            : 'https://petersmartlink.com/download/otya-player',
        }, {
          headers: {
            ...CORS_HEADERS,
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
          },
        })
      }
    } catch { /* fall through */ }

    // 2. D1 releases table
    try {
      const db  = getDB(env as Record<string, unknown>)
      const row = await db.prepare(
        'SELECT version_code, version, changelog, force_update, download_url FROM releases ORDER BY version_code DESC LIMIT 1'
      ).first<Record<string, unknown>>()
      if (row) {
        return NextResponse.json({
          versionCode:  row.version_code,
          version:      row.version,
          changelog:    row.changelog     ?? 'Bug fixes and improvements.',
          force_update: Boolean(row.force_update),
          download_url: row.download_url  ?? 'https://petersmartlink.com/download/otya-player',
        }, {
          headers: {
            ...CORS_HEADERS,
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
          },
        })
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
        return NextResponse.json({
          versionCode:  data.versionCode ?? 0,
          version:      data.version     ?? '',
          changelog:    data.changelog   ?? 'Bug fixes and improvements.',
          force_update: false,
          download_url: 'https://petersmartlink.com/download/otya-player',
        }, {
          headers: {
            ...CORS_HEADERS,
            'Cache-Control': 'public, max-age=300, stale-while-revalidate=60',
          },
        })
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
