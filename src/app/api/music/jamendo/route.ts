import { NextRequest, NextResponse } from 'next/server'

const JAMENDO_API = 'https://api.jamendo.com/v3.0/tracks/'
const DEFAULT_LIMIT = 24
const MAX_LIMIT = 50

function clampInt(value: string | null, fallback: number, min: number, max: number) {
  const parsed = Number.parseInt(value ?? '', 10)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(max, Math.max(min, parsed))
}

function safeText(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export async function GET(request: NextRequest) {
  const clientId = process.env.JAMENDO_CLIENT_ID?.trim()
  if (!clientId) {
    return NextResponse.json(
      { ok: false, error: 'Online music is not configured.' },
      { status: 503 },
    )
  }

  const { searchParams } = new URL(request.url)
  const query = (searchParams.get('q') ?? '').trim().slice(0, 120)
  const limit = clampInt(searchParams.get('limit'), DEFAULT_LIMIT, 1, MAX_LIMIT)
  const offset = clampInt(searchParams.get('offset'), 0, 0, 10_000)
  const order = searchParams.get('order') === 'popularity_total' ? 'popularity_total' : 'popularity_week'

  const upstream = new URL(JAMENDO_API)
  upstream.searchParams.set('client_id', clientId)
  upstream.searchParams.set('format', 'json')
  upstream.searchParams.set('limit', String(limit))
  upstream.searchParams.set('offset', String(offset))
  upstream.searchParams.set('order', `${order}_desc`)
  upstream.searchParams.set('include', 'musicinfo')
  upstream.searchParams.set('audioformat', 'mp32')
  upstream.searchParams.set('type', 'single albumtrack')
  if (query) upstream.searchParams.set('search', query)

  let response: Response
  try {
    response = await fetch(upstream, {
      headers: { Accept: 'application/json' },
      cf: { cacheTtl: query ? 300 : 900, cacheEverything: true },
    } as RequestInit)
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Online music is temporarily unavailable.' },
      { status: 502 },
    )
  }

  if (!response.ok) {
    return NextResponse.json(
      { ok: false, error: 'Online music provider returned an error.' },
      { status: 502 },
    )
  }

  const payload = await response.json() as {
    headers?: { status?: string; code?: number; error_message?: string }
    results?: Array<Record<string, unknown>>
  }

  if (payload.headers?.status && payload.headers.status !== 'success') {
    return NextResponse.json(
      { ok: false, error: payload.headers.error_message || 'Online music provider returned an error.' },
      { status: 502 },
    )
  }

  const tracks = (payload.results ?? []).map((track) => ({
    id: safeText(track.id),
    title: safeText(track.name),
    artistId: safeText(track.artist_id),
    artist: safeText(track.artist_name),
    albumId: safeText(track.album_id),
    album: safeText(track.album_name),
    artwork: safeText(track.image) || safeText(track.album_image),
    durationSeconds: Number(track.duration ?? 0),
    streamUrl: safeText(track.audio),
    downloadAllowed: track.audiodownload_allowed === true,
    downloadUrl: track.audiodownload_allowed === true ? safeText(track.audiodownload) : '',
    shareUrl: safeText(track.shareurl),
    licenseUrl: safeText(track.license_ccurl),
    provider: 'jamendo',
  })).filter((track) => track.id && track.title && track.streamUrl)

  return NextResponse.json(
    {
      ok: true,
      provider: 'jamendo',
      query,
      offset,
      limit,
      tracks,
    },
    {
      headers: {
        'Cache-Control': query
          ? 'public, max-age=60, s-maxage=300, stale-while-revalidate=1800'
          : 'public, max-age=120, s-maxage=900, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  })
}
