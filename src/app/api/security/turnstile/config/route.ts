import { NextResponse } from 'next/server'

import { getTurnstilePublicConfig } from '@/lib/turnstile'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const config = await getTurnstilePublicConfig()
    return NextResponse.json(config, {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    })
  } catch {
    return NextResponse.json(
      { turnstile: false, siteKey: '' },
      {
        status: 503,
        headers: {
          'Cache-Control': 'no-store',
          'X-Content-Type-Options': 'nosniff',
        },
      },
    )
  }
}
