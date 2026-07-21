import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// Must match the keys publish_r2.sh uploads to R2
const LATEST_MAP: Record<string, string> = {
  arm64: 'OtyaPlayer-arm64.apk',
  arm32: 'OtyaPlayer-arm32.apk',
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params

  if (file !== 'arm64' && file !== 'arm32') {
    return new NextResponse('Not found', { status: 404 })
  }

  const version = req.nextUrl.searchParams.get('v')

  let key: string
  if (version) {
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      return new NextResponse('Invalid version', { status: 400 })
    }
    key = `releases/v${version}/OtyaPlayer-${file}.apk`
  } else {
    key = LATEST_MAP[file]
  }

  try {
    const { env } = await getCloudflareContext()
    const r2 = (env as Record<string, unknown>).R2 as {
      get(key: string): Promise<{ body: ReadableStream; size: number } | null>
    } | undefined

    if (!r2) {
      return new NextResponse('Storage not available', { status: 503 })
    }

    const object = await r2.get(key)
    if (!object) {
      return new NextResponse('APK not found', { status: 404 })
    }

    const filename = version
      ? `OtyaPlayer-v${version}-${file}.apk`
      : 'OtyaPlayer.apk'

    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.android.package-archive')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    if (object.size) headers.set('Content-Length', String(object.size))
    headers.set('Cache-Control', 'public, max-age=3600')

    return new NextResponse(object.body, { headers })
  } catch {
    return new NextResponse('Download failed. Please try again.', { status: 500 })
  }
}
