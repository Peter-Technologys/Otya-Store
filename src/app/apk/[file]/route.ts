import { NextRequest, NextResponse } from 'next/server'

declare const R2: R2Bucket

// Must match the keys publish_r2.sh uploads to R2
const LATEST_MAP: Record<string, string> = {
  'arm64': 'OtyaPlayer-arm64.apk',
  'arm32': 'OtyaPlayer-arm32.apk',
}

export const runtime = 'edge'

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params

  if (file !== 'arm64' && file !== 'arm32') {
    return new NextResponse('Not found', { status: 404 })
  }

  // Support versioned downloads: /apk/arm64?v=1.2.0
  const version = req.nextUrl.searchParams.get('v')

  let key: string
  if (version) {
    // Validate version format
    if (!/^\d+\.\d+\.\d+$/.test(version)) {
      return new NextResponse('Invalid version', { status: 400 })
    }
    // Matches publish_r2.sh backup path: releases/v1.2.0/OtyaPlayer-arm64.apk
    key = `releases/v${version}/OtyaPlayer-${file}.apk`
  } else {
    key = LATEST_MAP[file]
  }

  try {
    const object = await R2.get(key)

    if (!object) {
      return new NextResponse('APK not found in storage', { status: 404 })
    }

    const filename = version
      ? `OtyaPlayer-v${version}-${file}.apk`
      : 'OtyaPlayer.apk'

    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.android.package-archive')
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    if (object.size) headers.set('Content-Length', String(object.size))
    headers.set('Cache-Control', 'public, max-age=3600')

    return new NextResponse(object.body as ReadableStream, { headers })
  } catch {
    return new NextResponse('Download failed. Please try again.', { status: 500 })
  }
}
