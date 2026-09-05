import { NextRequest, NextResponse } from 'next/server'

import { verifyTurnstileToken } from '@/lib/turnstile'

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  let body: { token?: unknown }
  try {
    body = await request.json() as { token?: unknown }
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid request.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  const result = await verifyTurnstileToken(body.token, request)
  if (!result.ok) {
    return NextResponse.json(
      { ok: false, error: result.error, code: result.code },
      { status: result.status, headers: { 'Cache-Control': 'no-store' } },
    )
  }

  return NextResponse.json(
    { ok: true },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}
