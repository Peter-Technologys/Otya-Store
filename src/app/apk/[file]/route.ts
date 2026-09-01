import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getDB } from '@/lib/d1'

const LATEST_MAP: Record<string, string> = {
  arm64: 'Otya-arm64.apk',
  arm32: 'Otya-arm32.apk',
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
    key = `releases/v${version}/Otya-${file}.apk`
  } else {
    key = LATEST_MAP[file]
  }

  try {
    const { env } = await getCloudflareContext()
    const r2 = (env as Record<string, unknown>).R2 as {
      get(key: string): Promise<{
        body: ReadableStream
        size: number
        httpMetadata?: { contentType?: string }
      } | null>
    } | undefined

    if (!r2) {
      return new NextResponse('Storage is not available.', { status: 503 })
    }

    const object = await r2.get(key)
    if (!object) {
      return NextResponse.redirect(
        'https://petersmartlink.com/download/otya-player',
        { status: 302 }
      )
    }

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

    const filename = `Otya-${file}.apk`
    const headers = new Headers()
    const contentType = object.httpMetadata?.contentType ?? 'application/vnd.android.package-archive'
    headers.set('Content-Type', contentType)
    headers.set('Content-Disposition', `attachment; filename="${filename}"`)
    if (object.size > 0) headers.set('Content-Length', String(object.size))
    headers.set('Cache-Control', 'public, max-age=3600')
    headers.set('Access-Control-Allow-Origin', '*')

    return new NextResponse(object.body, { headers })
  } catch {
    return new NextResponse('Download failed. Try again.', { status: 500 })
  }
}
