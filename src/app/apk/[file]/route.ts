import { NextRequest, NextResponse } from 'next/server'

// R2 bucket is bound as "R2" in wrangler.toml
declare const R2: R2Bucket

const FILE_MAP: Record<string, string> = {
  'arm64': 'otya-player-arm64.apk',
  'arm32': 'otya-player-arm32.apk',
}

export const runtime = 'edge'

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ file: string }> }
) {
  const { file } = await params
  const key = FILE_MAP[file]

  if (!key) {
    return new NextResponse('Not found', { status: 404 })
  }

  try {
    const object = await R2.get(key)

    if (!object) {
      return new NextResponse('APK not found in storage', { status: 404 })
    }

    const headers = new Headers()
    headers.set('Content-Type', 'application/vnd.android.package-archive')
    headers.set('Content-Disposition', `attachment; filename="OtyaPlayer.apk"`)
    if (object.size) headers.set('Content-Length', String(object.size))
    headers.set('Cache-Control', 'public, max-age=3600')

    return new NextResponse(object.body as ReadableStream, { headers })
  } catch {
    return new NextResponse('Download failed. Please try again.', { status: 500 })
  }
}
