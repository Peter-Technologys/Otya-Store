import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { requireAppToken } from '@/lib/auth'
import { getDB, getR2 } from '@/lib/d1'

// GET /check-update
// Called by OtyaService.checkAppUpdate() in the Flutter app.
// Returns the latest release from D1, falls back to R2 version.json.
//
// Response shape (matches what OtyaService expects):
// {
//   build_number:  7,
//   version:       "1.4.0",
//   force_update:  false,
//   release_notes: "Bug fixes...",
//   download_url:  "https://petersmartlink.com/download/otya-player"
// }
export async function GET(req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const authErr = requireAppToken(req, env as Record<string, unknown>)
    if (authErr) return authErr

    const db = getDB(env as Record<string, unknown>)
    const r2 = getR2(env as Record<string, unknown>)

    // Try D1 first
    let row: Record<string, unknown> | null = null
    try {
      row = await db.prepare(`
        SELECT version_code, version, changelog, force_update, download_url
        FROM   releases
        ORDER  BY version_code DESC
        LIMIT  1
      `).first<Record<string, unknown>>() ?? null
    } catch { /* D1 not seeded yet — fall through */ }

    const CORS = { 'Cache-Control': 'public, max-age=300', 'Access-Control-Allow-Origin': 'https://petersmartlink.com' }

    if (row) {
      return NextResponse.json({
        build_number:  row.version_code,
        version:       row.version,
        force_update:  Boolean(row.force_update),
        release_notes: row.changelog ?? 'Bug fixes and improvements.',
        download_url:  row.download_url ?? 'https://petersmartlink.com/download/otya-player',
      }, { headers: CORS })
    }

    // Fallback: R2 version.json
    const obj = await r2.get('version.json')
    if (obj) {
      const data = JSON.parse(await obj.text()) as Record<string, unknown>
      return NextResponse.json({
        build_number:  data.versionCode ?? 0,
        version:       data.version ?? '',
        force_update:  false,
        release_notes: data.changelog ?? 'Bug fixes and improvements.',
        download_url:  'https://petersmartlink.com/download/otya-player',
      }, { headers: CORS })
    }

    return NextResponse.json({ error: 'No release info available' }, { status: 404 })
  } catch (err) {
    console.error('[check-update]', err)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}
