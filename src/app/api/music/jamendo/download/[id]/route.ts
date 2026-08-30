import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

const JAMENDO_API = 'https://api.jamendo.com/v3.0/tracks/'

type JamendoTrack = Record<string, unknown>
type JamendoPayload = {
  headers?: { status?: string; error_message?: string }
  results?: JamendoTrack[]
}

function safeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function safeFilePart(value: string) {
  return value
    .normalize('NFKD')
    .replace(/[^a-zA-Z0-9._ -]+/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80) || 'track'
}

function isJamendoMediaUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && (url.hostname === 'jamendo.com' || url.hostname.endsWith('.jamendo.com'))
  } catch {
    return false
  }
}

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params
  if (!/^\d{1,20}$/.test(id)) return new Response('Invalid track', { status: 400 })

  const { env } = await getCloudflareContext({ async: true })
  const clientId = String((env as Record<string, unknown>).JAMENDO_CLIENT_ID ?? '').trim()
  if (!clientId) return new Response('Online music is not configured', { status: 503 })

  const lookup = new URL(JAMENDO_API)
  lookup.searchParams.set('client_id', clientId)
  lookup.searchParams.set('format', 'json')
  lookup.searchParams.set('id', id)
  lookup.searchParams.set('limit', '1')
  lookup.searchParams.set('include', 'musicinfo')
  lookup.searchParams.set('audioformat', 'mp32')

  const lookupResponse = await fetch(lookup, {
    headers: { Accept: 'application/json' },
    cf: { cacheTtl: 900, cacheEverything: true },
  } as RequestInit)
  if (!lookupResponse.ok) return new Response('Track lookup failed', { status: 502 })

  const payload = await lookupResponse.json().catch(() => null) as JamendoPayload | null
  if (!payload || payload.headers?.status === 'failed') return new Response('Track unavailable', { status: 404 })

  const track = Array.isArray(payload.results) ? payload.results[0] : undefined
  if (!track || track.audiodownload_allowed !== true) return new Response('Download is not allowed for this track', { status: 403 })

  const downloadUrl = safeText(track.audiodownload)
  if (!isJamendoMediaUrl(downloadUrl)) return new Response('Invalid provider download URL', { status: 502 })

  const upstream = await fetch(downloadUrl, {
    headers: {
      Accept: 'audio/mpeg,audio/*;q=0.9,*/*;q=0.5',
      'User-Agent': 'OTYA/1.0 licensed-download',
    },
  })
  if (!upstream.ok || !upstream.body) return new Response('Download temporarily unavailable', { status: 502 })

  const artist = safeFilePart(safeText(track.artist_name) || 'Unknown Artist')
  const title = safeFilePart(safeText(track.name) || `Track ${id}`)
  const filename = `${artist} - ${title}.mp3`

  const headers = new Headers()
  headers.set('Content-Type', 'audio/mpeg')
  headers.set('Content-Disposition', `attachment; filename="${filename.replace(/"/g, '')}"`)
  headers.set('Cache-Control', 'private, no-store')
  headers.set('X-Content-Type-Options', 'nosniff')
  const length = upstream.headers.get('Content-Length')
  if (length) headers.set('Content-Length', length)

  return new Response(upstream.body, { status: 200, headers })
}
