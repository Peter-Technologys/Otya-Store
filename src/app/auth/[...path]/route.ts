import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

type AuthBinding = {
  fetch(request: Request): Promise<Response>
}

async function proxyAuth(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> },
): Promise<Response> {
  const { env } = await getCloudflareContext({ async: true })
  const auth = (env as Record<string, unknown>).AUTH as AuthBinding | undefined
  if (!auth) {
    return Response.json(
      { error: 'Authentication service unavailable' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const { path } = await context.params
  const suffix = Array.isArray(path) ? path.map(encodeURIComponent).join('/') : ''
  const sourceUrl = new URL(req.url)
  const targetUrl = new URL(`https://auth/auth/${suffix}`)
  targetUrl.search = sourceUrl.search

  const headers = new Headers(req.headers)
  headers.delete('host')
  headers.delete('content-length')
  headers.set('X-Forwarded-Host', sourceUrl.host)
  headers.set('X-Forwarded-Proto', 'https')

  const init: RequestInit = {
    method: req.method,
    headers,
    redirect: 'manual',
  }

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = await req.arrayBuffer()
  }

  const upstream = await auth.fetch(new Request(targetUrl.toString(), init))
  const responseHeaders = new Headers(upstream.headers)
  responseHeaders.set('Cache-Control', 'no-store')
  responseHeaders.set('X-Content-Type-Options', 'nosniff')

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: responseHeaders,
  })
}

export const GET = proxyAuth
export const POST = proxyAuth
export const PATCH = proxyAuth
export const DELETE = proxyAuth
export const OPTIONS = proxyAuth
