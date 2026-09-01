import authWorker from './entrypoint'
import { ensureSchema } from './db'
import { handleAdminMfa, type AdminMfaEnv } from './admin-mfa'
import { handleTelegramLogin, type TelegramLoginEnv } from './telegram-login'
import {
  handleSecureOtpRoute,
  hardenRegistrationVerification,
  type SecureOtpEnv,
} from './secure-otp'
import {
  handleSecureAccountRoute,
  type SecureAccountEnv,
} from './secure-account'

interface GoogleTokenPayload {
  aud?: string
  iss?: string
  exp?: string | number
  email?: string
  email_verified?: string | boolean
}

type ProductionEnv = Record<string, unknown> & AdminMfaEnv & TelegramLoginEnv & SecureOtpEnv & SecureAccountEnv & {
  GOOGLE_CLIENT_ID?: string
  GOOGLE_WEB_CLIENT_ID?: string
}

let identitySchemaReady: Promise<void> | null = null

function configuredGoogleAudiences(env: ProductionEnv): Set<string> {
  return new Set(
    [env.GOOGLE_CLIENT_ID, env.GOOGLE_WEB_CLIENT_ID]
      .map((value) => typeof value === 'string' ? value.trim() : '')
      .filter(Boolean),
  )
}

export function isAllowedGoogleAudience(audience: string | undefined, env: ProductionEnv): boolean {
  if (!audience) return false
  return configuredGoogleAudiences(env).has(audience)
}

function authError(message: string, status: number, code?: string): Response {
  return new Response(JSON.stringify({ error: message, ...(code ? { code } : {}) }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function googleError(message: string, status: number): Response {
  return authError(message, status)
}

async function ensureIdentitySchema(env: ProductionEnv): Promise<void> {
  if (!identitySchemaReady) {
    identitySchemaReady = ensureSchema(env.AUTH_DB).catch((error) => {
      identitySchemaReady = null
      throw error
    })
  }
  await identitySchemaReady
}

async function verifiedGoogleAudience(request: Request, env: ProductionEnv): Promise<string | Response> {
  const audiences = configuredGoogleAudiences(env)
  if (audiences.size === 0) return googleError('Google auth not configured', 503)

  let body: Record<string, unknown>
  try {
    body = await request.clone().json() as Record<string, unknown>
  } catch {
    return googleError('Invalid JSON body', 400)
  }

  const idToken = body.id_token
  if (typeof idToken !== 'string' || !idToken) return googleError('id_token is required', 400)

  try {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`)
    if (!response.ok) return googleError('Invalid Google ID token', 401)

    const payload = await response.json() as GoogleTokenPayload
    const verifiedEmail = payload.email_verified === true || payload.email_verified === 'true'
    const issuerOk = payload.iss === 'accounts.google.com' || payload.iss === 'https://accounts.google.com'
    const expiry = Number(payload.exp ?? 0)
    const now = Math.floor(Date.now() / 1000)

    if (
      !isAllowedGoogleAudience(payload.aud, env)
      || !issuerOk
      || !Number.isFinite(expiry)
      || expiry <= now
      || !verifiedEmail
      || !payload.email
    ) {
      return googleError('Google account verification failed', 401)
    }

    return payload.aud as string
  } catch {
    return googleError('Google verification service unavailable', 503)
  }
}

/**
 * Keep every production auth response on one account shape. The internal UUID
 * remains available for existing clients, but user-facing code should use the
 * immutable public `otya_id` (2IS########).
 */
async function normalizeAccountResponse(response: Response, env: ProductionEnv): Promise<Response> {
  if (!response.ok) return response
  const contentType = response.headers.get('content-type') ?? ''
  if (!contentType.includes('application/json')) return response

  let data: Record<string, unknown>
  try {
    data = await response.clone().json() as Record<string, unknown>
  } catch {
    return response
  }

  const user = data.user
  if (!user || typeof user !== 'object' || Array.isArray(user)) return response

  const account = user as Record<string, unknown>
  const id = typeof account.id === 'string' ? account.id : ''
  if (!id || typeof account.otya_id === 'string') return response

  try {
    const row = await env.AUTH_DB.prepare(
      'SELECT otya_id FROM users WHERE id = ? LIMIT 1',
    ).bind(id).first<{ otya_id?: string | null }>()
    if (!row?.otya_id) return response

    const headers = new Headers(response.headers)
    headers.set('Cache-Control', 'no-store')
    return new Response(JSON.stringify({
      ...data,
      user: { ...account, otya_id: row.otya_id },
    }), {
      status: response.status,
      statusText: response.statusText,
      headers,
    })
  } catch (error) {
    console.error('[auth] Could not attach public Otya ID:', (error as Error)?.message)
    return response
  }
}

export default {
  async fetch(request: Request, env: ProductionEnv): Promise<Response> {
    const url = new URL(request.url)

    // OPTIONS never needs D1 and should remain cheap for browser preflight.
    if (request.method !== 'OPTIONS') {
      try {
        await ensureIdentitySchema(env)
      } catch (error) {
        console.error('[auth] Identity schema unavailable:', (error as Error)?.message)
        return authError(
          'OTYA Account is temporarily unavailable. Please try again shortly.',
          503,
          'AUTH_SCHEMA_UNAVAILABLE',
        )
      }
    }

    if (url.pathname.startsWith('/auth/admin/')) {
      const response = await handleAdminMfa(request, env)
      if (response) return response
    }

    // Keep Telegram on the production wrapper so admin step-up and normal
    // account linking share the exact same OIDC verifier and AUTH_KV state.
    if (url.pathname.startsWith('/auth/telegram/')) {
      const response = await handleTelegramLogin(request, env)
      if (response) return response
    }

    // Account deletion must revoke every refresh token and recorded device
    // session with correct KV pagination before the D1 identity is removed.
    const secureAccountResponse = await handleSecureAccountRoute(request, env)
    if (secureAccountResponse) return secureAccountResponse

    // Password-reset and email-verification codes are purpose-bound, HMAC
    // protected in KV, rate-limited, expiring and single-use.
    const secureOtpResponse = await handleSecureOtpRoute(request, env)
    if (secureOtpResponse) return secureOtpResponse

    if (request.method === 'POST' && url.pathname === '/auth/google') {
      const audience = await verifiedGoogleAudience(request, env)
      if (audience instanceof Response) return audience

      // The legacy core performs its own issuer/expiry/audience validation.
      // Override only GOOGLE_CLIENT_ID for this single request with the audience
      // we already verified is one of the two explicitly configured clients.
      const requestEnv = { ...env, GOOGLE_CLIENT_ID: audience }
      const response = await authWorker.fetch(
        request,
        requestEnv as Parameters<typeof authWorker.fetch>[1],
      )
      return normalizeAccountResponse(response, env)
    }

    const response = await authWorker.fetch(
      request,
      env as Parameters<typeof authWorker.fetch>[1],
    )

    // Registration remains on the compatibility core because it also owns
    // consent/session orchestration. Immediately replace its short-lived
    // plaintext verification code with a purpose-bound HMAC record.
    if (request.method === 'POST' && url.pathname === '/auth/register' && response.ok) {
      await hardenRegistrationVerification(response, env)
    }

    return normalizeAccountResponse(response, env)
  },
}
