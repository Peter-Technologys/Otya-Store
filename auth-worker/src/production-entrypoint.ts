import authWorker from './entrypoint'
import { handleAdminMfa } from './admin-mfa'
import { handleTelegramLogin } from './telegram-login'

interface GoogleTokenPayload {
  aud?: string
  iss?: string
  exp?: string | number
  email?: string
  email_verified?: string | boolean
}

interface ProductionEnv extends Record<string, unknown> {
  GOOGLE_CLIENT_ID?: string
  GOOGLE_WEB_CLIENT_ID?: string
  ADMIN_EMAILS?: string
}

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

function googleError(message: string, status: number): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
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

export default {
  async fetch(request: Request, env: ProductionEnv): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname.startsWith('/auth/admin/')) {
      const response = await handleAdminMfa(
        request,
        env as Parameters<typeof handleAdminMfa>[1],
      )
      if (response) return response
    }

    // Keep Telegram on the production wrapper so admin step-up and normal
    // account linking share the exact same OIDC verifier and AUTH_KV state.
    if (url.pathname.startsWith('/auth/telegram/')) {
      const response = await handleTelegramLogin(
        request,
        env as Parameters<typeof handleTelegramLogin>[1],
      )
      if (response) return response
    }

    if (request.method === 'POST' && url.pathname === '/auth/google') {
      const audience = await verifiedGoogleAudience(request, env)
      if (audience instanceof Response) return audience

      // The legacy core performs its own issuer/expiry/audience validation.
      // Override only GOOGLE_CLIENT_ID for this single request with the audience
      // we already verified is one of the two explicitly configured clients.
      const requestEnv = { ...env, GOOGLE_CLIENT_ID: audience }
      return authWorker.fetch(
        request,
        requestEnv as Parameters<typeof authWorker.fetch>[1],
      )
    }

    return authWorker.fetch(
      request,
      env as Parameters<typeof authWorker.fetch>[1],
    )
  },
}
