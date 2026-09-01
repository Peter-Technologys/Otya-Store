import worker from './production-entrypoint'
import { handleTelegramMiniApp } from './telegram-miniapp'

type AuthEnv = Parameters<typeof worker.fetch>[1] & {
  AUTH_KV: { put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> }
  TELEGRAM_LOGIN_CLIENT_ID?: string
  TELEGRAM_LOGIN_CLIENT_SECRET?: string
  TELEGRAM_LOGIN_REDIRECT_URI?: string
  TELEGRAM_MINIAPP_BOT_TOKEN?: unknown
}

const TELEGRAM_OIDC_AUTH = 'https://oauth.telegram.org/auth'
const TELEGRAM_REDIRECT = 'https://petersmartlink.com/api/auth/telegram/callback'
const TELEGRAM_STATE_TTL = 10 * 60

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function randomUrlSafe(bytes = 32): string {
  const data = crypto.getRandomValues(new Uint8Array(bytes))
  let binary = ''
  for (const byte of data) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function sha256Base64Url(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  const bytes = new Uint8Array(digest)
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}

async function startTelegramOidcLogin(request: Request, env: AuthEnv): Promise<Response | null> {
  const url = new URL(request.url)
  if (url.pathname !== '/auth/telegram/start' || url.searchParams.get('mode') !== 'login') return null
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405)
  if (!env.TELEGRAM_LOGIN_CLIENT_ID || !env.TELEGRAM_LOGIN_CLIENT_SECRET) return null

  const state = randomUrlSafe(24)
  const verifier = randomUrlSafe(48)
  const nonce = randomUrlSafe(24)
  const challenge = await sha256Base64Url(verifier)
  await env.AUTH_KV.put(
    `telegram_oidc:${state}`,
    JSON.stringify({ mode: 'login', verifier, nonce }),
    { expirationTtl: TELEGRAM_STATE_TTL },
  )

  const authorization = new URL(TELEGRAM_OIDC_AUTH)
  authorization.searchParams.set('client_id', env.TELEGRAM_LOGIN_CLIENT_ID)
  authorization.searchParams.set('redirect_uri', env.TELEGRAM_LOGIN_REDIRECT_URI || TELEGRAM_REDIRECT)
  authorization.searchParams.set('response_type', 'code')
  authorization.searchParams.set('scope', 'openid profile phone')
  authorization.searchParams.set('state', state)
  authorization.searchParams.set('nonce', nonce)
  authorization.searchParams.set('code_challenge', challenge)
  authorization.searchParams.set('code_challenge_method', 'S256')

  return json({
    ok: true,
    mode: 'login',
    provider_mode: 'oidc',
    authorization_url: authorization.toString(),
  })
}

export default {
  ...worker,
  async fetch(request: Request, env: Parameters<typeof worker.fetch>[1]): Promise<Response> {
    const authEnv = env as AuthEnv
    const url = new URL(request.url)

    if (url.pathname === '/auth/telegram/miniapp') {
      const miniEnv = {
        ...env,
        TELEGRAM_BOT_TOKEN: authEnv.TELEGRAM_MINIAPP_BOT_TOKEN,
      }
      const response = await handleTelegramMiniApp(request, miniEnv as Parameters<typeof handleTelegramMiniApp>[1])
      if (response) return response
    }

    // Login-start only needs KV to persist OIDC PKCE state. Avoid coupling this
    // public provider redirect to D1 schema availability or database load.
    const telegramStart = await startTelegramOidcLogin(request, authEnv)
    if (telegramStart) return telegramStart

    return worker.fetch(request, env)
  },
}
