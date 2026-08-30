import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
  adminConfigured,
  adminSessionCookie,
  clearAdminSessionCookie,
  cookieValue,
  createAdminSession,
  getOtyaAccountAdminEmail,
  verifyAdminSession,
} from '@/lib/admin_auth'

const ACCESS_COOKIE = '__Host-otya_access'

type AuthBinding = { fetch(request: Request): Promise<Response> }

async function authStep(
  request: NextRequest,
  recordEnv: Record<string, unknown>,
  path: string,
  body?: unknown,
): Promise<Response> {
  const auth = recordEnv.AUTH as AuthBinding | undefined
  const accessToken = cookieValue(request, ACCESS_COOKIE)
  if (!auth?.fetch || !accessToken) {
    return NextResponse.json({ error: 'Sign in to your Otya account first.' }, { status: 401 })
  }

  return auth.fetch(new Request(`https://auth${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: body === undefined ? '{}' : JSON.stringify(body),
  }))
}

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>
  const configured = adminConfigured(recordEnv)
  const authenticated = configured ? await verifyAdminSession(request, recordEnv) : false
  const accountAdmin = configured ? Boolean(await getOtyaAccountAdminEmail(request, recordEnv)) : false

  return NextResponse.json(
    { ok: true, configured, authenticated, accountAdmin },
    { headers: { 'Cache-Control': 'no-store' } },
  )
}

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>
  if (!adminConfigured(recordEnv)) {
    return NextResponse.json({ error: 'Admin verification is not configured.' }, { status: 503 })
  }

  const accountEmail = await getOtyaAccountAdminEmail(request, recordEnv)
  if (!accountEmail) {
    return NextResponse.json({ error: 'Sign in with an allowed Otya administrator account first.' }, { status: 401 })
  }

  const body = await request.json().catch(() => ({})) as { action?: string; otp?: string }
  const action = body.action ?? ''

  if (action === 'start') {
    const upstream = await authStep(request, recordEnv, '/auth/admin/start')
    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, { status: upstream.status, headers: { 'Cache-Control': 'no-store' } })
  }

  if (action === 'verify-otp') {
    const upstream = await authStep(request, recordEnv, '/auth/admin/verify-otp', { otp: body.otp })
    const data = await upstream.json().catch(() => ({}))
    return NextResponse.json(data, { status: upstream.status, headers: { 'Cache-Control': 'no-store' } })
  }

  if (action === 'complete') {
    const upstream = await authStep(request, recordEnv, '/auth/admin/consume')
    const data = await upstream.json().catch(() => ({})) as { ok?: boolean; email?: string; error?: string }
    if (!upstream.ok || data.ok !== true || data.email?.toLowerCase() !== accountEmail) {
      return NextResponse.json({ error: data.error ?? 'Complete Telegram verification first.' }, { status: 401 })
    }

    const session = await createAdminSession(recordEnv, accountEmail)
    return NextResponse.json({ ok: true }, {
      headers: {
        'Set-Cookie': adminSessionCookie(session),
        'Cache-Control': 'no-store',
      },
    })
  }

  return NextResponse.json({ error: 'Unsupported admin verification step.' }, { status: 400 })
}

export async function DELETE() {
  return NextResponse.json({ ok: true }, {
    headers: {
      'Set-Cookie': clearAdminSessionCookie(),
      'Cache-Control': 'no-store',
    },
  })
}
