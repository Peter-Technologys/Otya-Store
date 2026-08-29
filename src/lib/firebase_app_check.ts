const JWKS_URL = 'https://firebaseappcheck.googleapis.com/v1/jwks'
const JWKS_CACHE_KEY = 'firebase:app-check:jwks:v1'
const JWKS_CACHE_TTL_SECS = 6 * 60 * 60

type Jwk = JsonWebKey & { kid?: string; alg?: string; use?: string }
type Jwks = { keys?: Jwk[] }
type KvLike = {
  get(key: string, type?: 'json'): Promise<unknown>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
}

export type AppCheckResult = {
  configured: boolean
  present: boolean
  valid: boolean
  appId?: string
  reason?: string
}

function decodeBase64Url(value: string): ArrayBuffer {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/')
    .padEnd(Math.ceil(value.length / 4) * 4, '=')
  const bytes = Uint8Array.from(atob(base64), (char) => char.charCodeAt(0))
  return bytes.buffer.slice(
    bytes.byteOffset,
    bytes.byteOffset + bytes.byteLength,
  ) as ArrayBuffer
}

function decodeJson(value: string): Record<string, unknown> | null {
  try {
    return JSON.parse(new TextDecoder().decode(decodeBase64Url(value))) as Record<string, unknown>
  } catch {
    return null
  }
}

function validJwks(value: unknown): value is Jwks {
  if (!value || typeof value !== 'object') return false
  const keys = (value as Jwks).keys
  return Array.isArray(keys) && keys.some((key) => key && typeof key === 'object' && typeof key.kid === 'string')
}

async function fetchJwks(kv?: KvLike, forceRefresh = false): Promise<Jwks> {
  if (kv && !forceRefresh) {
    const cached = await kv.get(JWKS_CACHE_KEY, 'json').catch(() => null)
    if (validJwks(cached)) return cached
  }

  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 5000)
  try {
    const response = await fetch(JWKS_URL, { signal: controller.signal })
    if (!response.ok) throw new Error(`JWKS HTTP ${response.status}`)
    const jwks = await response.json() as Jwks
    if (!validJwks(jwks)) {
      throw new Error('Firebase App Check JWKS is empty or malformed')
    }
    if (kv) {
      await kv.put(JWKS_CACHE_KEY, JSON.stringify(jwks), {
        expirationTtl: JWKS_CACHE_TTL_SECS,
      }).catch(() => {})
    }
    return jwks
  } finally {
    clearTimeout(timeout)
  }
}

export async function verifyFirebaseAppCheck(
  request: Request,
  env: Record<string, unknown>,
): Promise<AppCheckResult> {
  const projectNumber = String(env.FIREBASE_PROJECT_NUMBER ?? '').trim()
  const expectedAppId = String(env.FIREBASE_ANDROID_APP_ID ?? '').trim()
  if (!projectNumber) {
    return { configured: false, present: false, valid: false, reason: 'project-number-not-configured' }
  }

  const token = request.headers.get('X-Firebase-AppCheck')?.trim()
  if (!token) {
    return { configured: true, present: false, valid: false, reason: 'missing-token' }
  }

  const parts = token.split('.')
  if (parts.length !== 3) {
    return { configured: true, present: true, valid: false, reason: 'invalid-jwt-shape' }
  }

  const header = decodeJson(parts[0])
  const payload = decodeJson(parts[1])
  if (!header || !payload) {
    return { configured: true, present: true, valid: false, reason: 'invalid-jwt-json' }
  }
  if (header.alg !== 'RS256' || header.typ !== 'JWT' || typeof header.kid !== 'string') {
    return { configured: true, present: true, valid: false, reason: 'invalid-jwt-header' }
  }

  const kv = env.KV as KvLike | undefined
  let jwks: Jwks
  try {
    jwks = await fetchJwks(kv)
  } catch {
    return { configured: true, present: true, valid: false, reason: 'jwks-unavailable' }
  }

  let jwk = jwks.keys?.find((key) => key.kid === header.kid)
  if (!jwk) {
    try {
      jwks = await fetchJwks(kv, true)
      jwk = jwks.keys?.find((key) => key.kid === header.kid)
    } catch {
      return { configured: true, present: true, valid: false, reason: 'jwks-unavailable' }
    }
  }
  if (!jwk) {
    return { configured: true, present: true, valid: false, reason: 'unknown-key' }
  }

  try {
    const publicKey = await crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify'],
    )
    const verified = await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      decodeBase64Url(parts[2]),
      new TextEncoder().encode(`${parts[0]}.${parts[1]}`).buffer as ArrayBuffer,
    )
    if (!verified) {
      return { configured: true, present: true, valid: false, reason: 'bad-signature' }
    }
  } catch {
    return { configured: true, present: true, valid: false, reason: 'signature-verification-failed' }
  }

  const now = Math.floor(Date.now() / 1000)
  const exp = typeof payload.exp === 'number' ? payload.exp : Number(payload.exp)
  if (!Number.isFinite(exp) || exp <= now) {
    return { configured: true, present: true, valid: false, reason: 'expired' }
  }
  const iat = typeof payload.iat === 'number' ? payload.iat : Number(payload.iat)
  if (Number.isFinite(iat) && iat > now + 120) {
    return { configured: true, present: true, valid: false, reason: 'issued-in-future' }
  }
  if (payload.iss !== `https://firebaseappcheck.googleapis.com/${projectNumber}`) {
    return { configured: true, present: true, valid: false, reason: 'wrong-issuer' }
  }
  const audiences = Array.isArray(payload.aud) ? payload.aud.map(String) : [String(payload.aud ?? '')]
  if (!audiences.includes(`projects/${projectNumber}`)) {
    return { configured: true, present: true, valid: false, reason: 'wrong-audience' }
  }
  const appId = typeof payload.sub === 'string' ? payload.sub : undefined
  if (expectedAppId && appId !== expectedAppId) {
    return { configured: true, present: true, valid: false, appId, reason: 'wrong-app-id' }
  }

  return { configured: true, present: true, valid: true, appId }
}

export function appCheckEnforced(env: Record<string, unknown>): boolean {
  return String(env.FIREBASE_APP_CHECK_MODE ?? 'monitor').toLowerCase() === 'enforce'
}
