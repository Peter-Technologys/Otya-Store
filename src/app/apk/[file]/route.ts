import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDB } from '@/lib/d1'

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
      get(key: string): Promise<{
        body: ReadableStream
        size: number
        // PERFORMANCE 1: httpMetadata carries the stored Content-Type from R2
        // so we can serve the correct MIME type without hardcoding it.
        httpMetadata?: { contentType?: string }
      } | null>
    } | undefined

    if (!r2) {
      return new NextResponse('Storage not available', { status: 503 })
    }

    const object = await r2.get(key)
    if (!object) {
      return NextResponse.json({
        error: 'APK not found',
        message: 'This APK has not been uploaded yet.',
        downloadPage: 'https://petersmartlink.com/download/otya-player',
      }, { status: 404 })
    }

    // Track download in D1 (non-fatal)
    try {
      const db = getDB(env as Record<string, unknown>)
      await db.prepare(
          'INSERT INTO downloads (abi, version, ip, user_agent) VALUES (?, ?, ?, ?)'
        ).bind(
          file,
          version ?? 'latest',
          req.headers.get('cf-connecting-ip') ?? req.headers.get('x-forwarded-for') ?? '',
          req.headers.get('user-agent') ?? ''
        ).run()
    } catch { /* non-fatal */ }

    const filename = version
      ? `OtyaPlayer-v${version}-${file}.apk`
      : `OtyaPlayer-v1.4.0-${file}.apk`

    const headers = new Headers()

    // PERFORMANCE 1: Use httpMetadata content-type from R2 object if available,
    // falling back to the known APK MIME type. R2 objects always have a size,
    // so Content-Length is set unconditionally when size > 0.
    const contentType = object.httpMetadata?.contentType ?? 'application/vnd.android.package-archive'
    headers.set('Content-Type', contentType)
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    if (object.size > 0) headers.set('Content-Length', String(object.size))
    headers.set('Cache-Control', 'public, max-age=3600')
    headers.set('Access-Control-Allow-Origin', '*')

    return new NextResponse(object.body, { headers })
  } catch {
    return new NextResponse('Download failed. Please try again.', { status: 500 })
  }
}
