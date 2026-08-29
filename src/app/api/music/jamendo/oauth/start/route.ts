import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

const ACCESS_COOKIE = '__Host-otya_access'
const STATE_COOKIE = '__Host-otya_jamendo_state'
const REDIRECT_URI = 'https://petersmartlink.com/api/music/jamendo/oauth/callback'
const STATE_TTL_SECONDS = 10 * 60

type AuthBinding = { fetch(request: Request): Promise<Response> }
type KvLike = { put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> }

function base64Url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '')
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest)).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>
  const clientId = String(recordEnv.JAMENDO_CLIENT_ID ?? '').trim()
  const auth = recordEnv.AUTH as AuthBinding | undefined
  const kv = recordEnv.KV as KvLike | undefined

  if (!clientId || !auth || !kv) {
    return NextResponse.json(
      { ok: false, error: 'Jamendo account linking is not configured.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value ?? ''
  if (!accessToken) {
    return NextResponse.json(
      { ok: false, error: 'Sign in to OTYA before connecting Jamendo.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const accountResponse = await auth.fetch(new Request('https://auth/auth/account', {
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  }))
  if (!accountResponse.ok) {
    return NextResponse.json(
      { ok: false, error: 'Your OTYA session expired. Sign in again, then connect Jamendo.' },
      { status: 401, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const account = await accountResponse.json() as Record<string, unknown>
  const identity = String(account.id ?? account.user_id ?? account.email ?? '').trim()
  if (!identity) {
    return NextResponse.json(
      { ok: false, error: 'OTYA could not identify this account.' },
      { status: 502, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const state = base64Url(crypto.getRandomValues(new Uint8Array(32)))
  const accountKey = await sha256(identity.toLowerCase())
  await kv.put(
    `jamendo:oauth:state:${state}`,
    JSON.stringify({ accountKey, createdAt: Date.now() }),
    { expirationTtl: STATE_TTL_SECONDS },
  )

  const authorize = new URL('https://api.jamendo.com/v3.0/oauth/authorize')
  authorize.searchParams.set('client_id', clientId)
  authorize.searchParams.set('redirect_uri', REDIRECT_URI)
  authorize.searchParams.set('scope', 'music')
  authorize.searchParams.set('response_type', 'code')
  authorize.searchParams.set('state', state)

  const response = NextResponse.redirect(authorize)
  response.headers.set('Cache-Control', 'no-store')
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: STATE_TTL_SECONDS,
  })
  return response
}
