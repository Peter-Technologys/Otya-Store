/**
 * src/lib/smartpos-helpers.ts
 *
 * Shared helpers for SmartPOS and GR App API routes.
 *
 * Covers:
 *  - UUID validation (prevent SQL injection via ID params)
 *  - Request body size limiting (1 MB cap)
 *  - Pagination parsing (page/limit with max-limit guard)
 *  - KV caching helpers
 *  - CORS headers for mobile + web origins
 *  - ETag generation for conditional requests
 */

// ── UUID validation ───────────────────────────────────────────────────────────

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

/**
 * Returns true if `id` is a valid RFC-4122 UUID.
 * Use before passing any client-supplied ID into a D1 query.
 */
export function isValidUuid(id: unknown): id is string {
  return typeof id === 'string' && UUID_RE.test(id)
}

// ── Request body size limit ───────────────────────────────────────────────────

const MAX_BODY_BYTES = 1 * 1024 * 1024 // 1 MB

/**
 * Read and parse the request body as JSON, enforcing a 1 MB size limit.
 *
 * Returns `{ ok: true, data }` on success, or `{ ok: false, error }` on failure.
 */
export async function readJsonBody<T = Record<string, unknown>>(
  req: Request,
): Promise<{ ok: true; data: T } | { ok: false; error: string; status: number }> {
  const contentLength = req.headers.get('Content-Length')
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return { ok: false, error: 'Request body too large (max 1 MB)', status: 413 }
  }

  let text: string
  try {
    // Clone so the body can be read once
    const clone = req.clone()
    const buf   = await clone.arrayBuffer()
    if (buf.byteLength > MAX_BODY_BYTES) {
      return { ok: false, error: 'Request body too large (max 1 MB)', status: 413 }
    }
    text = new TextDecoder().decode(buf)
  } catch {
    return { ok: false, error: 'Failed to read request body', status: 400 }
  }

  try {
    const data = JSON.parse(text) as T
    return { ok: true, data }
  } catch {
    return { ok: false, error: 'Invalid JSON body', status: 400 }
  }
}

// ── Pagination ────────────────────────────────────────────────────────────────

export interface PaginationParams {
  page:   number  // 1-indexed
  limit:  number  // rows per page
  offset: number  // SQL OFFSET
}

const MAX_PAGE_LIMIT = 100

/**
 * Parse `page` and `limit` from URL search params.
 * Clamps limit to [1, 100]. Defaults: page=1, limit=20.
 */
export function parsePagination(url: URL): PaginationParams {
  const rawPage  = parseInt(url.searchParams.get('page')  ?? '1',  10)
  const rawLimit = parseInt(url.searchParams.get('limit') ?? '20', 10)

  const page  = isNaN(rawPage)  || rawPage  < 1 ? 1 : rawPage
  const limit = isNaN(rawLimit) || rawLimit < 1 ? 20
              : rawLimit > MAX_PAGE_LIMIT        ? MAX_PAGE_LIMIT
              : rawLimit

  return { page, limit, offset: (page - 1) * limit }
}

// ── CORS headers ──────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = new Set([
  'https://petersmartlink.com',
  'https://www.petersmartlink.com',
])

const PRIMARY_ORIGIN = 'https://petersmartlink.com'

/**
 * Return CORS headers appropriate for the request origin.
 * Mobile apps send no Origin header — they receive the primary origin.
 */
export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin') ?? null
  const allowedOrigin =
    origin && ALLOWED_ORIGINS.has(origin) ? origin : PRIMARY_ORIGIN

  return {
    'Access-Control-Allow-Origin':  allowedOrigin,
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Group-Secret',
    'Vary': 'Origin',
  }
}

/** Build a JSON Response with CORS + security headers. */
export function apiJson(
  data: unknown,
  req: Request,
  status = 200,
  extraHeaders?: Record<string, string>,
): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type':           'application/json; charset=utf-8',
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control':          'no-store',
      ...getCorsHeaders(req),
      ...extraHeaders,
    },
  })
}

/** Shorthand for error responses. */
export function apiErr(
  message: string,
  req: Request,
  status = 400,
): Response {
  return apiJson({ error: message }, req, status)
}

/** OPTIONS preflight response. */
export function apiOptions(req: Request): Response {
  return new Response(null, { status: 204, headers: getCorsHeaders(req) })
}

// ── ETag helpers ──────────────────────────────────────────────────────────────

/**
 * Generate a weak ETag from a serialisable value.
 * Uses a simple djb2 hash — fast and good enough for cache invalidation.
 */
export function makeEtag(data: unknown): string {
  const str  = JSON.stringify(data)
  let   hash = 5381
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) + hash) ^ str.charCodeAt(i)
    hash = hash >>> 0 // keep unsigned 32-bit
  }
  return `W/"${hash.toString(16)}"`
}

/**
 * Return a 304 Not Modified if the client's If-None-Match matches the etag,
 * otherwise return the full response with ETag header.
 */
export function withEtag(
  data: unknown,
  req: Request,
  status = 200,
): Response {
  const etag = makeEtag(data)
  if (req.headers.get('If-None-Match') === etag) {
    return new Response(null, {
      status: 304,
      headers: { ETag: etag, ...getCorsHeaders(req) },
    })
  }
  return apiJson(data, req, status, { ETag: etag })
}

// ── KV caching helpers ────────────────────────────────────────────────────────

export interface KVCache {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

/**
 * Read a cached JSON value from KV.
 * Returns null on miss or parse error.
 */
export async function kvGetJson<T>(kv: KVCache, key: string): Promise<T | null> {
  try {
    const raw = await kv.get(key)
    if (!raw) return null
    return JSON.parse(raw) as T
  } catch {
    return null
  }
}

/**
 * Write a JSON value to KV with a TTL.
 */
export async function kvSetJson(
  kv: KVCache,
  key: string,
  data: unknown,
  ttlSeconds: number,
): Promise<void> {
  try {
    await kv.put(key, JSON.stringify(data), { expirationTtl: ttlSeconds })
  } catch (e) {
    console.error('[kv] kvSetJson failed:', (e as Error)?.message)
  }
}

/**
 * Invalidate a KV cache key (fire-and-forget).
 */
export function kvInvalidate(kv: KVCache, key: string): void {
  kv.delete(key).catch(e => console.error('[kv] kvInvalidate failed:', (e as Error)?.message))
}

// ── GR App group-secret auth ──────────────────────────────────────────────────

/**
 * Verify a GR App group secret.
 * The secret is stored as a bcrypt-style hash in the gr_groups table.
 * For simplicity we use SHA-256 (no salt) — the secret is long and random.
 *
 * Returns true if the provided secret matches the stored hash.
 */
export async function verifyGroupSecret(
  provided: string,
  storedHash: string,
): Promise<boolean> {
  try {
    const buf  = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(provided))
    const hex  = Array.from(new Uint8Array(buf))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    return hex === storedHash
  } catch {
    return false
  }
}

/**
 * Hash a group secret for storage.
 */
export async function hashGroupSecret(secret: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

// ── GR App rate limiting (per group_code) ────────────────────────────────────

const GR_RATE_LIMIT     = 100  // requests per minute per group_code
const GR_RATE_TTL_SECS  = 60

/**
 * Check GR App rate limit for a group_code.
 * Uses the KV namespace from the main app (env.KV).
 * Returns true if the request is allowed.
 */
export async function checkGrRateLimit(
  kv: KVCache,
  groupCode: string,
): Promise<boolean> {
  const key = `gr_rate:${groupCode}`
  try {
    const raw   = await kv.get(key)
    const count = raw ? parseInt(raw, 10) : 0
    if (count >= GR_RATE_LIMIT) return false
    await kv.put(key, String(count + 1), { expirationTtl: GR_RATE_TTL_SECS })
    return true
  } catch {
    // On KV error, allow the request (fail open)
    return true
  }
}
