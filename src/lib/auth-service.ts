/**
 * Auth Service helper — calls the otya-auth worker via Service Binding.
 *
 * The AUTH binding is a Cloudflare Service Binding configured in wrangler.toml:
 *   [[services]]
 *   binding = "AUTH"
 *   service = "otya-auth"
 *
 * This avoids a real HTTP round-trip — the call is handled in-process by
 * the Cloudflare runtime, making it fast and free.
 *
 * Usage in route handlers:
 *   const jwtResult = await verifyJwtViaService(env, token)
 *   if (!jwtResult.ok) return errorJson(jwtResult.error ?? 'Unauthorized', 401)
 *   const { user_id, email } = jwtResult
 */

export interface JwtVerifyResult {
  ok:       boolean
  user_id?: string
  email?:   string
  error?:   string
}

/**
 * Verify a JWT by calling GET /auth/verify on the otya-auth worker.
 * Returns { ok: true, user_id, email } on success, or { ok: false, error } on failure.
 *
 * Falls back gracefully if the AUTH binding is not configured (e.g. local dev).
 */
export async function verifyJwtViaService(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  env: any,
  token: string,
): Promise<JwtVerifyResult> {
  const authService = env.AUTH as { fetch(req: Request): Promise<Response> } | undefined

  if (!authService) {
    console.warn('[auth-service] AUTH binding not configured — JWT verification skipped.')
    return { ok: false, error: 'Auth service not available' }
  }

  try {
    const res = await authService.fetch(
      new Request('https://auth/auth/verify', {
        method:  'GET',
        headers: { Authorization: `Bearer ${token}` },
      }),
    )

    const data = await res.json() as JwtVerifyResult
    return data
  } catch (e) {
    console.error('[auth-service] verifyJwtViaService failed:', (e as Error)?.message)
    return { ok: false, error: 'Auth service error' }
  }
}

/**
 * Extract a Bearer token from an Authorization header.
 * Returns null if the header is missing or not in Bearer format.
 */
export function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) return null
  const match = authHeader.match(/^Bearer\s+(.+)$/i)
  return match ? match[1] : null
}

/**
 * Dual-auth helper: try JWT first (Bearer token), fall back to HMAC.
 *
 * Returns:
 *   { mode: 'jwt', user_id, email }  — JWT auth succeeded
 *   { mode: 'hmac' }                 — HMAC auth succeeded (legacy)
 *   { mode: 'none', error }          — both failed
 *
 * Usage:
 *   const authResult = await dualAuth(req, env)
 *   if (authResult.mode === 'none') return errorJson(authResult.error ?? 'Unauthorized', 401)
 */
export type DualAuthResult =
  | { mode: 'jwt';  user_id: string; email: string }
  | { mode: 'hmac' }
  | { mode: 'none'; error: string }

export async function dualAuth(
  // Accept NextRequest (subtype of Request) or plain Request
  req: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  env: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hmacVerify: (req: Request, env: any) => Promise<{ ok: boolean; error?: string }>,
): Promise<DualAuthResult> {
  // ── Try JWT first ─────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  const token      = extractBearerToken(authHeader)

  if (token) {
    const result = await verifyJwtViaService(env, token)
    if (result.ok && result.user_id && result.email) {
      return { mode: 'jwt', user_id: result.user_id, email: result.email }
    }
    // JWT present but invalid — don't fall through to HMAC
    return { mode: 'none', error: result.error ?? 'Invalid token' }
  }

  // ── Fall back to HMAC (legacy Flutter app) ────────────────────────────────
  // Cast to plain Request so hmacVerify (which expects Request, not NextRequest)
  // receives the correct type regardless of what the caller passes in.
  const hmacResult = await hmacVerify(req as Request, env)
  if (hmacResult.ok) {
    return { mode: 'hmac' }
  }

  return { mode: 'none', error: hmacResult.error ?? 'Unauthorized' }
}
