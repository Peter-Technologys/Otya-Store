import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'
import { getDB, getR2 } from '@/lib/d1'

// GET /check-update
// Called by OtyaService.checkAppUpdate() in the Flutter app.
// Returns the latest release from D1, falls back to R2 version.json.
export async function GET(req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()

    const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
    if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)

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

    if (row) {
      return secureJson({
        build_number:  row.version_code,
        version:       row.version,
        force_update:  Boolean(row.force_update),
        release_notes: row.changelog ?? 'Bug fixes and improvements.',
        download_url:  row.download_url ?? 'https://petersmartlink.com/download/otya-player',
      }, { cache: 'public, max-age=300, stale-while-revalidate=60' })
    }

    // Fallback: R2 version.json
    const obj = await r2.get('version.json')
    if (obj) {
      const data = JSON.parse(await obj.text()) as Record<string, unknown>
      return secureJson({
        build_number:  data.versionCode ?? 0,
        version:       data.version ?? '',
        force_update:  false,
        release_notes: data.changelog ?? 'Bug fixes and improvements.',
        download_url:  'https://petersmartlink.com/download/otya-player',
      }, { cache: 'public, max-age=300, stale-while-revalidate=60' })
    }

    return errorJson('No release info available', 404)
  } catch (err) {
    console.error('[check-update]', err)
    return errorJson('Internal error', 500)
  }
}
