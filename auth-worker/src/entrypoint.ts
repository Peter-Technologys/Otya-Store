/**
 * OTYA Auth production entrypoint.
 *
 * The large auth module still calls env.EMAIL internally. This wrapper replaces
 * that interface with a server-side Resend adapter and adds production guards
 * that can be applied without risking a broad auth rewrite.
 */

import legacyWorker from './index'
import { sendResendEmail, type ResendEmail } from './resend'

interface LegacyEmailMessage {
  from: { email: string; name?: string }
  to: { email: string }[]
  subject: string
  text: string
}

interface KVNamespace {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
}

interface ResendEnv extends Record<string, unknown> {
  RESEND_API_KEY?: string
  GOOGLE_CLIENT_ID?: string
  AUTH_KV?: KVNamespace
  CORS_ORIGIN?: string
}

const GOOGLE_RATE_LIMIT = 20
const GOOGLE_RATE_TTL = 15 * 60
const PRIMARY_ORIGIN = 'https://petersmartlink.com'

function normalizeEmailText(text: string): string {
  return text.replace(
    '(1 letter + 3 digits — enter it exactly as shown)',
    '(1 uppercase letter + 4 digits — enter it exactly as shown, e.g. A1234)',
  )
}

function createEmailAdapter(apiKey: string | undefined) {
  return {
    async send(message: LegacyEmailMessage): Promise<void> {
      const from = message.from.name
        ? `${message.from.name} <${message.from.email}>`
        : message.from.email
      const email: ResendEmail = {
        from,
        to: message.to.map((recipient) => recipient.email),
        subject: message.subject,
        text: normalizeEmailText(message.text),
      }
      await sendResendEmail(apiKey, email)
    },
  }
}

function jsonError(message: string, status: number, env: ResendEnv): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      'Access-Control-Allow-Origin': env.CORS_ORIGIN ?? PRIMARY_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Vary': 'Origin',
    },
  })
}

function clientIp(request: Request): string {
  return request.headers.get('CF-Connecting-IP')
    ?? request.headers.get('X-Forwarded-For')?.split(',')[0]?.trim()
    ?? 'unknown'
}

async function checkGoogleRateLimit(request: Request, env: ResendEnv): Promise<boolean> {
  if (!env.AUTH_KV) return true
  const key = `google_ip_rate:${clientIp(request)}`
  const raw = await env.AUTH_KV.get(key)
  const current = raw ? Number.parseInt(raw, 10) : 0
  if (current >= GOOGLE_RATE_LIMIT) return false
  await env.AUTH_KV.put(key, String(current + 1), { expirationTtl: GOOGLE_RATE_TTL })
  return true
}

interface GoogleTokenPayload {
  aud?: string
  iss?: string
  exp?: string | number
  email?: string
  email_verified?: string | boolean
}

async function validateGoogleRequest(
  request: Request,
  env: ResendEnv,
): Promise<{ request?: Request; error?: Response }> {
  if (!env.GOOGLE_CLIENT_ID) {
    return { error: jsonError('Google auth not configured', 503, env) }
  }
  if (!(await checkGoogleRateLimit(request, env))) {
    return { error: jsonError('Too many Google sign-in attempts. Try again later.', 429, env) }
  }

  let bodyText: string
  let body: Record<string, unknown>
  try {
    bodyText = await request.text()
    body = JSON.parse(bodyText) as Record<string, unknown>
  } catch {
    return { error: jsonError('Invalid JSON body', 400, env) }
  }

  const idToken = body.id_token
  if (typeof idToken !== 'string' || !idToken) {
    return { error: jsonError('id_token is required', 400, env) }
  }

  try {
    const response = await fetch(
      `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`,
    )
    if (!response.ok) return { error: jsonError('Invalid Google ID token', 401, env) }

    const payload = await response.json() as GoogleTokenPayload
    const verified = payload.email_verified === true || payload.email_verified === 'true'
    const issuerOk = payload.iss === 'accounts.google.com'
      || payload.iss === 'https://accounts.google.com'
    const expiry = Number(payload.exp ?? 0)
    const now = Math.floor(Date.now() / 1000)

    if (payload.aud !== env.GOOGLE_CLIENT_ID || !issuerOk || expiry <= now || !verified) {
      return { error: jsonError('Google account verification failed', 401, env) }
    }
  } catch {
    return { error: jsonError('Google verification service unavailable', 503, env) }
  }

  // Rebuild the consumed request body for the existing auth handler. No Google
  // token values are logged or persisted by this wrapper.
  return {
    request: new Request(request, { body: bodyText }),
  }
}

export default {
  async fetch(request: Request, env: ResendEnv): Promise<Response> {
    const resendEnv = {
      ...env,
      EMAIL: createEmailAdapter(env.RESEND_API_KEY),
    }

    let forwardedRequest = request
    const url = new URL(request.url)
    if (request.method === 'POST' && url.pathname === '/auth/google') {
      const checked = await validateGoogleRequest(request, env)
      if (checked.error) return checked.error
      forwardedRequest = checked.request ?? request
    }

    return legacyWorker.fetch(
      forwardedRequest,
      resendEnv as Parameters<typeof legacyWorker.fetch>[1],
    )
  },
}
