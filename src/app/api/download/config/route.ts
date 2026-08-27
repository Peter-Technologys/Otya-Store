import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { env } = await getCloudflareContext()
    const siteKey = (env as Record<string, unknown>).TURNSTILE_SITE_KEY
    return NextResponse.json({
      turnstile: typeof siteKey === 'string' && siteKey.length > 0,
      siteKey: typeof siteKey === 'string' ? siteKey : null,
    }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  } catch {
    return NextResponse.json({ turnstile: false, siteKey: null }, {
      headers: { 'Cache-Control': 'no-store' },
    })
  }
}
