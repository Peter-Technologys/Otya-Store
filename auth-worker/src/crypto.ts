/**
 * Cryptographic helpers for the auth worker.
 * Uses Web Crypto API only — no Node.js crypto, no external libraries.
 * Runs on Cloudflare Workers runtime.
 */

// ── UUID v4 ───────────────────────────────────────────────────────────────────
export function generateUuid(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  bytes[6] = (bytes[6] & 0x0f) | 0x40
  bytes[8] = (bytes[8] & 0x3f) | 0x80
  const hex = Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
  return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-')
}

// ── PBKDF2 password hashing ───────────────────────────────────────────────────
const PBKDF2_ITERATIONS = 100_000
const PBKDF2_HASH = 'SHA-256'
const PBKDF2_KEY_LEN = 32

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: PBKDF2_HASH }, keyMaterial, PBKDF2_KEY_LEN * 8)
  return `pbkdf2:${PBKDF2_ITERATIONS}:${bufToBase64(salt)}:${bufToBase64(new Uint8Array(derived))}`
}

export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split(':')
  if (parts.length !== 4 || parts[0] !== 'pbkdf2') return false
  const iterations = parseInt(parts[1], 10)
  const salt = base64ToBuf(parts[2])
  const expected = base64ToBuf(parts[3])
  if (isNaN(iterations) || !salt || !expected) return false
  const keyMaterial = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits'])
  const derived = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt, iterations, hash: PBKDF2_HASH }, keyMaterial, expected.byteLength * 8)
  return timingSafeEqual(new Uint8Array(derived), expected)
}

// ── JWT (HS256) ───────────────────────────────────────────────────────────────
export interface JwtPayload {
  sub: string
  email: string | null
  iat: number
  exp: number
}

export async function signJwt(payload: JwtPayload, secret: string): Promise<string> {
  const header = base64urlEncode(new TextEncoder().encode(JSON.stringify({ alg: 'HS256', typ: 'JWT' })))
  const body = base64urlEncode(new TextEncoder().encode(JSON.stringify(payload)))
  const signing = `${header}.${body}`
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signing))
  return `${signing}.${base64urlEncode(new Uint8Array(sig))}`
}

export async function verifyJwt(token: string, secret: string): Promise<JwtPayload | null> {
  const parts = token.split('.')
  if (parts.length !== 3 || !secret) return null
  const [headerB64, payloadB64, sigB64] = parts
  const signing = `${headerB64}.${payloadB64}`
  try {
    // Fail closed on malformed or misleading JWT metadata. We always issue
    // HS256 JWTs, so accepting any other declared algorithm/type is needless
    // ambiguity even though Web Crypto below already pins HMAC-SHA256.
    const header = JSON.parse(new TextDecoder().decode(base64urlDecode(headerB64))) as unknown
    if (
      typeof header !== 'object' ||
      header === null ||
      (header as { alg?: unknown }).alg !== 'HS256' ||
      (header as { typ?: unknown }).typ !== 'JWT'
    ) {
      return null
    }

    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify'])
    const valid = await crypto.subtle.verify('HMAC', key, base64urlDecode(sigB64), new TextEncoder().encode(signing))
    if (!valid) return null

    const decoded = JSON.parse(new TextDecoder().decode(base64urlDecode(payloadB64))) as unknown
    if (typeof decoded !== 'object' || decoded === null) return null

    const payload = decoded as Partial<JwtPayload>
    const now = Math.floor(Date.now() / 1000)
    if (typeof payload.sub !== 'string' || payload.sub.trim().length === 0) return null
    if (payload.email !== null && typeof payload.email !== 'string') return null
    if (!Number.isSafeInteger(payload.iat) || !Number.isSafeInteger(payload.exp)) return null
    if ((payload.iat as number) > now + 300) return null
    if ((payload.exp as number) <= now || (payload.exp as number) <= (payload.iat as number)) return null

    return payload as JwtPayload
  } catch {
    return null
  }
}

// ── OTP ───────────────────────────────────────────────────────────────────────

/** Generate an OTP in the OTYA contract format: A1234 (1 uppercase letter + 4 digits). */
export function generateOtp(): string {
  // Exclude I and O — visually confusing with 1 and 0.
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'

  // Rejection sampling avoids modulo bias. For each range, discard the high
  // tail that cannot be divided evenly by the target size.
  const randomBelow = (maxExclusive: number): number => {
    const limit = Math.floor(0x100000000 / maxExclusive) * maxExclusive
    while (true) {
      const bytes = crypto.getRandomValues(new Uint8Array(4))
      const value = (((bytes[0] << 24) >>> 0) + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3]) >>> 0
      if (value < limit) return value % maxExclusive
    }
  }

  const letter = letters[randomBelow(letters.length)]
  const number = randomBelow(10_000)
  return `${letter}${String(number).padStart(4, '0')}`
}

// ── Refresh token ─────────────────────────────────────────────────────────────
export function generateRefreshToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('')
}

// ── Internal helpers ──────────────────────────────────────────────────────────
function bufToBase64(buf: Uint8Array): string {
  let str = ''
  for (const b of buf) str += String.fromCharCode(b)
  return btoa(str)
}

function base64ToBuf(b64: string): Uint8Array {
  const bin = atob(b64)
  const buf = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) buf[i] = bin.charCodeAt(i)
  return buf
}

function base64urlEncode(buf: Uint8Array): string {
  return bufToBase64(buf).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function base64urlDecode(str: string): Uint8Array {
  const b64 = str.replace(/-/g, '+').replace(/_/g, '/')
  const pad = (4 - (b64.length % 4)) % 4
  return base64ToBuf(b64 + '='.repeat(pad))
}

function timingSafeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false
  let result = 0
  for (let i = 0; i < a.length; i++) result |= a[i] ^ b[i]
  return result === 0
}
