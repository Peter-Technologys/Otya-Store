import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// GET /latest — returns version.json from R2
// Used by the in-app update checker (UpdateService.checkForUpdate)
export async function GET(_req: NextRequest) {
  try {
    const { env } = await getCloudflareContext()
    const r2 = (env as Record<string, unknown>).R2 as {
      get(key: string): Promise<{ text(): Promise<string>; size: number } | null>
    } | undefined

    if (!r2) {
      return NextResponse.json({ error: 'Storage not available' }, { status: 503 })
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

    return new NextResponse(JSON.stringify(data), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch {
    return NextResponse.json({ error: 'Failed to fetch version info' }, { status: 500 })
  }
}
