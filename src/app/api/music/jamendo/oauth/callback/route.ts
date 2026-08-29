import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

export const dynamic = 'force-dynamic'

const STATE_COOKIE = '__Host-otya_jamendo_state'
const REDIRECT_URI = 'https://petersmartlink.com/api/music/jamendo/oauth/callback'

type KvLike = {
  get(key: string, type?: 'json'): Promise<unknown>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete?(key: string): Promise<void>
}

type StateRecord = { accountKey?: string; createdAt?: number }
type TokenPayload = {
  access_token?: string
  refresh_token?: string
  expires_in?: number
  token_type?: string
  scope?: string
  error?: string
  error_description?: string
}

function finish(message: string, success: boolean) {
  const url = new URL('/account', 'https://petersmartlink.com')
  url.searchParams.set('jamendo', success ? 'connected' : 'error')
  url.searchParams.set('message', message.slice(0, 180))
  const response = NextResponse.redirect(url)
  response.headers.set('Cache-Control', 'no-store')
  response.cookies.set(STATE_COOKIE, '', {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    expires: new Date(0),
  })
  return response
}

export async function GET(request: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>
  const clientId = String(recordEnv.JAMENDO_CLIENT_ID ?? '').trim()
  const clientSecret = String(recordEnv.JAMENDO_CLIENT_SECRET ?? '').trim()
  const kv = recordEnv.KV as KvLike | undefined

  if (!clientId || !clientSecret || !kv) {
    return finish('Jamendo account linking is not configured.', false)
  }

  const url = new URL(request.url)
  const providerError = (url.searchParams.get('error') ?? '').trim()
  if (providerError) {
    return finish('Jamendo connection was cancelled or denied.', false)
  }

  const code = (url.searchParams.get('code') ?? '').trim()
  const state = (url.searchParams.get('state') ?? '').trim()
  const cookieState = request.cookies.get(STATE_COOKIE)?.value ?? ''
  if (!code || !state || !cookieState || state !== cookieState) {
    return finish('Jamendo connection could not be verified. Please try again.', false)
  }

  const stored = await kv.get(`jamendo:oauth:state:${state}`, 'json') as StateRecord | null
  const accountKey = String(stored?.accountKey ?? '').trim()
  if (!accountKey) {
    return finish('Jamendo connection expired. Please try again.', false)
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'authorization_code',
    code,
    redirect_uri: REDIRECT_URI,
  })

  let tokenResponse: Response
  try {
    tokenResponse = await fetch('https://api.jamendo.com/v3.0/oauth/grant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
      },
      body,
    })
  } catch {
    return finish('Jamendo is temporarily unavailable. Please try again.', false)
  }

  const token = await tokenResponse.json().catch(() => ({})) as TokenPayload
  if (!tokenResponse.ok || !token.access_token || !token.refresh_token) {
    return finish(token.error_description || 'Jamendo did not complete the connection.', false)
  }

  const expiresIn = Math.max(60, Number(token.expires_in ?? 7200))
  const record = {
    provider: 'jamendo',
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + expiresIn * 1000,
    scope: token.scope || 'music',
    tokenType: token.token_type || 'bearer',
    connectedAt: Date.now(),
  }

  await kv.put(`jamendo:account:${accountKey}`, JSON.stringify(record))
  await kv.delete?.(`jamendo:oauth:state:${state}`)
  return finish('Jamendo connected successfully.', true)
}
