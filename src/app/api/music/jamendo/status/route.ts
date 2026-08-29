import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export async function GET() {
  const { env } = await getCloudflareContext({ async: true })
  const runtime = env as Record<string, unknown>

  const hasClientId = Boolean(String(runtime.JAMENDO_CLIENT_ID ?? '').trim())
  const hasClientSecret = Boolean(String(runtime.JAMENDO_CLIENT_SECRET ?? '').trim())
  const hasRedirect = Boolean(String(runtime.JAMENDO_REDIRECT_URL ?? '').trim())

  return NextResponse.json(
    {
      ok: true,
      provider: 'jamendo',
      catalogConfigured: hasClientId,
      oauthConfigured: hasClientId && hasClientSecret && hasRedirect,
      oauthRequiresRedirectUrl: hasClientId && hasClientSecret && !hasRedirect,
      accountLinking: {
        enabled: false,
        reason: hasRedirect
          ? 'Account linking remains disabled until the explicit OAuth flow is released.'
          : 'Set JAMENDO_REDIRECT_URL and the same redirect URL in Jamendo before enabling OAuth account linking.',
      },
    },
    {
      headers: {
        'Cache-Control': 'no-store',
        'X-Content-Type-Options': 'nosniff',
      },
    },
  )
}
