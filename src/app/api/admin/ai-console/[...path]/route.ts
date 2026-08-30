import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyAdminSession } from '@/lib/admin_auth'

type Context = { params: Promise<{ path: string[] }> }

async function forward(request: NextRequest, context: Context) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown> & {
    AI_SUPPORT?: { fetch(request: Request): Promise<Response> }
    INTERNAL_SECRET?: string
    ADMIN_EMAIL?: string
  }

  if (!(await verifyAdminSession(request, recordEnv))) {
    return NextResponse.json({ error: 'Administrator sign-in required' }, { status: 401 })
  }
  if (!recordEnv.AI_SUPPORT?.fetch || !recordEnv.INTERNAL_SECRET) {
    return NextResponse.json({ error: 'Admin Otya service is not configured' }, { status: 503 })
  }

  const { path } = await context.params
  const incoming = new URL(request.url)
  const target = new URL(`/api/admin/ai/console/${path.join('/')}`, incoming.origin)
  target.search = incoming.search

  const headers = new Headers(request.headers)
  headers.delete('authorization')
  headers.delete('cookie')
  headers.set('X-OTYA-Internal-Secret', recordEnv.INTERNAL_SECRET)
  headers.set('X-OTYA-Admin-ID', 'primary')
  headers.set('X-OTYA-Admin-Email', String(recordEnv.ADMIN_EMAIL ?? 'admin'))

  const body = request.method === 'GET' || request.method === 'HEAD'
    ? undefined
    : await request.arrayBuffer()

  const response = await recordEnv.AI_SUPPORT.fetch(new Request(target, {
    method: request.method,
    headers,
    body,
    redirect: 'manual',
  }))

  const outHeaders = new Headers(response.headers)
  outHeaders.set('Cache-Control', 'no-store')
  return new NextResponse(response.body, { status: response.status, headers: outHeaders })
}

export async function GET(request: NextRequest, context: Context) { return forward(request, context) }
export async function POST(request: NextRequest, context: Context) { return forward(request, context) }
