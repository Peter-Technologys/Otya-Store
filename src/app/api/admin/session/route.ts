import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import {
  adminConfigured,
  adminEmail,
  adminSessionCookie,
  clearAdminSessionCookie,
  createAdminSession,
  validAdminCredentials,
  verifyAdminSession,
} from '@/lib/admin_auth'

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>
  const configured = adminConfigured(recordEnv)
  const authenticated = configured
    ? await verifyAdminSession(request, recordEnv)
    : false

  const headers: Record<string, string> = { 'Cache-Control': 'no-store' }
  if (authenticated) {
    // Sliding renewal: only a session that has already passed signature, email,
    // and expiry verification receives a fresh signed cookie.
    const renewed = await createAdminSession(recordEnv, adminEmail(recordEnv))
    headers['Set-Cookie'] = adminSessionCookie(renewed)
  }

  return NextResponse.json({ ok: true, configured, authenticated }, { headers })
}

export async function POST(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>
  if (!adminConfigured(recordEnv)) {
    return NextResponse.json({ error: 'Admin login is not configured' }, { status: 503 })
  }

  const body = await request.json().catch(() => ({})) as { email?: string; password?: string }
  const email = typeof body.email === 'string' ? body.email : ''
  const password = typeof body.password === 'string' ? body.password : ''
  if (!validAdminCredentials(recordEnv, email, password)) {
    return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 })
  }

  const session = await createAdminSession(recordEnv, email)
  return NextResponse.json({ ok: true }, {
    headers: {
      'Set-Cookie': adminSessionCookie(session),
      'Cache-Control': 'no-store',
    },
  })
}

export async function DELETE() {
  return NextResponse.json({ ok: true }, {
    headers: {
      'Set-Cookie': clearAdminSessionCookie(),
      'Cache-Control': 'no-store',
    },
  })
}
