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

function b64url(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function encryptionKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(`OTYA Jamendo OAuth token storage v1\n${secret}`),
  )
  return crypto.subtle.importKey('raw', digest, { name: 'AES-GCM' }, false, ['encrypt'])
}

async function encryptTokenRecord(record: Record<string, unknown>, secret: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const key = await encryptionKey(secret)
  const plaintext = new TextEncoder().encode(JSON.stringify(record))
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext)
  return JSON.stringify({
    v: 1,
    alg: 'A256GCM',
    iv: b64url(iv),
    ciphertext: b64url(new Uint8Array(ciphertext)),
  })
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

  const stateKey = `jamendo:oauth:state:${state}`
  const stored = await kv.get(stateKey, 'json') as StateRecord | null
  const accountKey = String(stored?.accountKey ?? '').trim()
  const createdAt = Number(stored?.createdAt ?? 0)
  if (!accountKey || !Number.isFinite(createdAt) || Date.now() - createdAt > 10 * 60 * 1000) {
    await kv.delete?.(stateKey).catch(() => undefined)
    return finish('Jamendo connection expired. Please try again.', false)
  }

  // Consume state before the provider call so the callback cannot be replayed.
  await kv.delete?.(stateKey).catch(() => undefined)

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

  const parsedExpiry = Number(token.expires_in ?? 7200)
  const expiresIn = Number.isFinite(parsedExpiry) ? Math.max(60, Math.min(parsedExpiry, 24 * 60 * 60)) : 7200
  const record = {
    provider: 'jamendo',
    accessToken: token.access_token,
    refreshToken: token.refresh_token,
    expiresAt: Date.now() + expiresIn * 1000,
    scope: token.scope || 'music',
    tokenType: token.token_type || 'bearer',
    connectedAt: Date.now(),
  }

  try {
    const encrypted = await encryptTokenRecord(record, clientSecret)
    await kv.put(`jamendo:account:${accountKey}`, encrypted)
  } catch {
    return finish('OTYA could not securely save the Jamendo connection. Please try again.', false)
  }

  return finish('Jamendo connected successfully.', true)
}
