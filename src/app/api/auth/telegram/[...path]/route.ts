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
  admin_mfa?: boolean
  access_token?: string
  refresh_token?: string
  provider_mode?: 'oidc' | 'widget'
  bot_username?: string
  widget_auth_url?: string
}

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: true,
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  }
}

function safeWidgetPage(request: NextRequest, data: TelegramLoginPayload): string | null {
  if (data.provider_mode !== 'widget' || !data.bot_username || !data.widget_auth_url) return null
  if (!/^[A-Za-z0-9_]{5,32}$/.test(data.bot_username)) return null
  let callback: URL
  try {
    callback = new URL(data.widget_auth_url)
  } catch {
    return null
  }
  if (
    callback.protocol !== 'https:'
    || callback.hostname !== 'petersmartlink.com'
    || callback.pathname !== '/api/auth/telegram/widget/callback'
    || !callback.searchParams.get('state')
  ) return null

  const page = new URL('/telegram-login', request.url)
  page.searchParams.set('bot', data.bot_username)
  page.searchParams.set('auth', callback.toString())
  return page.toString()
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
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value
  if (accessToken && !headers.has('Authorization')) headers.set('Authorization', `Bearer ${accessToken}`)

  const upstream = await auth.fetch(new Request(authUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  }))

  if (publicUrl.pathname.endsWith('/start') && upstream.ok) {
    const contentType = upstream.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await upstream.clone().json().catch(() => ({})) as TelegramLoginPayload
      const widgetPage = safeWidgetPage(request, data)
      if (widgetPage) {
        return NextResponse.json(
          { ...data, authorization_url: widgetPage },
          { status: upstream.status, headers: { 'Cache-Control': 'no-store' } },
        )
      }
    }
  }

  if (publicUrl.pathname.endsWith('/callback') && upstream.ok) {
    const contentType = upstream.headers.get('content-type') || ''
    if (contentType.includes('application/json')) {
      const data = await upstream.clone().json().catch(() => ({})) as TelegramLoginPayload

      // Admin Telegram is a privilege step-up for the existing signed-in
      // browser. It must not replace the normal access/refresh cookies with a
      // second, untracked account session.
      if (data.telegram_login === true && data.admin_mfa === true) {
        const response = NextResponse.redirect(new URL('/admin?telegram=verified', request.url), 302)
        response.headers.set('Cache-Control', 'no-store')
        return response
      }

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
