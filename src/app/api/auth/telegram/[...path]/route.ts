import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PREFIX = '/api/auth/telegram/'
const AUTH_PREFIX = '/auth/telegram/'
const ACCESS_COOKIE = '__Host-otya_access'
const REFRESH_COOKIE = '__Host-otya_refresh'
const ACCESS_MAX_AGE = 15 * 60
const REFRESH_MAX_AGE = 30 * 24 * 60 * 60

type AuthService = {
  fetch(request: Request): Promise<Response>
}

type TelegramLoginPayload = {
  telegram_login?: boolean
  access_token?: string
  refresh_token?: string
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: true,
    // OAuth/OIDC returns arrive as top-level navigations from another origin.
    // Lax keeps the session protected from normal cross-site subrequests while
    // allowing the browser to complete Google/Telegram-style sign-in returns.
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

async function forward(request: NextRequest): Promise<Response> {
  const { env } = await getCloudflareContext({ async: true })
  const auth = (env as Record<string, unknown>).AUTH as AuthService | undefined
  if (!auth?.fetch) {
    return NextResponse.json(
      { error: 'Authentication service unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const publicUrl = new URL(request.url)
  if (!publicUrl.pathname.startsWith(PUBLIC_PREFIX)) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const authUrl = new URL(request.url)
  authUrl.pathname = `${AUTH_PREFIX}${publicUrl.pathname.slice(PUBLIC_PREFIX.length)}`

  const headers = new Headers(request.headers)
  headers.set('X-OTYA-Public-Auth-Route', publicUrl.pathname)

  const upstream = await auth.fetch(new Request(authUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  }))

  if (publicUrl.pathname.endsWith('/callback') && upstream.ok) {
    const contentType = upstream.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await upstream.clone().json().catch(() => ({})) as TelegramLoginPayload
      if (data.telegram_login === true && data.access_token && data.refresh_token) {
        const response = NextResponse.redirect(new URL('/account?telegram=signed-in', request.url), 302)
        response.cookies.set(ACCESS_COOKIE, data.access_token, cookieOptions(ACCESS_MAX_AGE))
        response.cookies.set(REFRESH_COOKIE, data.refresh_token, cookieOptions(REFRESH_MAX_AGE))
        response.headers.set('Cache-Control', 'no-store')
        return response
      }
    }
  }

  return upstream
}

export async function GET(request: NextRequest) {
  return forward(request)
}

export async function POST(request: NextRequest) {
  return forward(request)
}

export async function OPTIONS(request: NextRequest) {
  return forward(request)
}
