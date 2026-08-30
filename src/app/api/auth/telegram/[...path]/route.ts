import { getCloudflareContext } from '@opennextjs/cloudflare'
import { NextRequest, NextResponse } from 'next/server'

const PUBLIC_PREFIX = '/api/auth/telegram/'
const AUTH_PREFIX = '/auth/telegram/'

type AuthService = {
  fetch(request: Request): Promise<Response>
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

  return auth.fetch(new Request(authUrl, {
    method: request.method,
    headers,
    body: request.method === 'GET' || request.method === 'HEAD' ? undefined : request.body,
    redirect: 'manual',
  }))
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
