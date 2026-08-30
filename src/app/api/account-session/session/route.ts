import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

const ACCESS_COOKIE = '__Host-otya_access'
const REFRESH_COOKIE = '__Host-otya_refresh'
const ACCESS_MAX_AGE = 15 * 60
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60

type AuthBinding = { fetch(request: Request): Promise<Response> }
type JsonRecord = Record<string, unknown>

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

function clearSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, '', { ...cookieOptions(0), expires: new Date(0) })
  response.cookies.set(REFRESH_COOKIE, '', { ...cookieOptions(0), expires: new Date(0) })
}

function setSessionCookies(response: NextResponse, accessToken: string, refreshToken?: string) {
  response.cookies.set(ACCESS_COOKIE, accessToken, cookieOptions(ACCESS_MAX_AGE))
  if (refreshToken) response.cookies.set(REFRESH_COOKIE, refreshToken, cookieOptions(REFRESH_MAX_AGE))
}

async function getAuthBinding() {
  const { env } = await getCloudflareContext({ async: true })
  return (env as Record<string, unknown>).AUTH as AuthBinding | undefined
}

async function decode(response: Response): Promise<JsonRecord> {
  try {
    const value = await response.json()
    return value && typeof value === 'object' && !Array.isArray(value)
      ? value as JsonRecord
      : {}
  } catch {
    return {}
  }
}

async function refreshBrowserSession(auth: AuthBinding, request: NextRequest) {
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value
  if (!refreshToken) return null

  const upstream = await auth.fetch(new Request('https://auth/auth/refresh', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  }))
  if (!upstream.ok) return null

  const data = await decode(upstream)
  const accessToken = typeof data.access_token === 'string' ? data.access_token : ''
  const rotatedRefresh = typeof data.refresh_token === 'string' ? data.refresh_token : undefined
  return accessToken ? { accessToken, refreshToken: rotatedRefresh } : null
}

async function validateAccessToken(auth: AuthBinding, accessToken: string) {
  // Session validation must not depend on D1 profile/schema reads. /auth/sessions
  // verifies the JWT and returns 200 even when the user has no recorded session rows.
  return auth.fetch(new Request('https://auth/auth/sessions', {
    method: 'GET',
    headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
  }))
}

export async function GET(request: NextRequest) {
  const auth = await getAuthBinding()
  if (!auth) {
    return NextResponse.json(
      { ok: false, authenticated: false, error: 'Authentication service unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  let accessToken = request.cookies.get(ACCESS_COOKIE)?.value ?? ''
  let refreshed: { accessToken: string; refreshToken?: string } | null = null

  if (!accessToken) {
    refreshed = await refreshBrowserSession(auth, request)
    accessToken = refreshed?.accessToken ?? ''
  }

  if (!accessToken) {
    const response = NextResponse.json({ ok: true, authenticated: false })
    clearSessionCookies(response)
    response.headers.set('Cache-Control', 'no-store')
    return response
  }

  let validation = await validateAccessToken(auth, accessToken)
  if (validation.status === 401 || validation.status === 403) {
    refreshed = await refreshBrowserSession(auth, request)
    if (!refreshed) {
      const response = NextResponse.json({ ok: true, authenticated: false })
      clearSessionCookies(response)
      response.headers.set('Cache-Control', 'no-store')
      return response
    }
    accessToken = refreshed.accessToken
    validation = await validateAccessToken(auth, accessToken)
  }

  if (!validation.ok) {
    const data = await decode(validation)
    return NextResponse.json(
      { ok: false, authenticated: false, error: data.error || 'Could not verify Otya session' },
      { status: validation.status, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  // The full profile is useful metadata, but it is deliberately optional here.
  // A D1/profile migration problem must not invalidate an otherwise valid login.
  let profile: JsonRecord = {}
  try {
    const account = await auth.fetch(new Request('https://auth/auth/account', {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: 'application/json' },
    }))
    if (account.ok) profile = await decode(account)
  } catch {}

  const response = NextResponse.json({ ok: true, authenticated: true, ...profile })
  setSessionCookies(response, accessToken, refreshed?.refreshToken)
  response.headers.set('Cache-Control', 'no-store')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  return response
}
