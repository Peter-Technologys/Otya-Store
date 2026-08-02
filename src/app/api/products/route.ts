/**
 * GET  /api/products  — list products for the authenticated user (paginated, KV-cached 2 min)
 * POST /api/products  — create a new product
 *
 * Auth: Bearer JWT (verified via AUTH Service Binding → GET /auth/verify)
 * All queries are scoped to user_id to prevent cross-user data leakage.
 * Only parameterised D1 queries are used (no string concatenation).
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyJwtViaService, extractBearerToken } from '@/lib/auth-service'
import { getDB, getKV } from '@/lib/d1'
import {
  readJsonBody,
  parsePagination,
  apiJson,
  apiErr,
  apiOptions,
  withEtag,
  kvGetJson,
  kvSetJson,
  kvInvalidate,
  isValidUuid,
} from '@/lib/smartpos-helpers'

const CACHE_TTL = 2 * 60 // 2 minutes

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const url    = new URL(req.url)
  const { page, limit, offset } = parsePagination(url)
  const category = url.searchParams.get('category') ?? null

  const kv       = getKV(env as Record<string, unknown>)
  const cacheKey = `products:${jwt.user_id}:p${page}:l${limit}:cat${category ?? ''}`

  // ── KV cache read ─────────────────────────────────────────────────────────
  const cached = await kvGetJson<{ products: unknown[]; total: number }>(kv, cacheKey)
  if (cached) return withEtag({ ...cached, page, limit, cached: true }, req)

  const db = getDB(env as Record<string, unknown>)

  // ── Parameterised query — no string concatenation ─────────────────────────
  let rows: unknown[]
  let total: number

  if (category) {
    const [dataRes, countRes] = await Promise.all([
      db.prepare(
        'SELECT * FROM products WHERE user_id = ? AND category = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(jwt.user_id, category, limit, offset).all(),
      db.prepare(
        'SELECT COUNT(*) as cnt FROM products WHERE user_id = ? AND category = ?'
      ).bind(jwt.user_id, category).first<{ cnt: number }>(),
    ])
    rows  = dataRes.results
    total = countRes?.cnt ?? 0
  } else {
    const [dataRes, countRes] = await Promise.all([
      db.prepare(
        'SELECT * FROM products WHERE user_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?'
      ).bind(jwt.user_id, limit, offset).all(),
      db.prepare(
        'SELECT COUNT(*) as cnt FROM products WHERE user_id = ?'
      ).bind(jwt.user_id).first<{ cnt: number }>(),
    ])
    rows  = dataRes.results
    total = countRes?.cnt ?? 0
  }

  const payload = { products: rows, total, page, limit }

  // ── KV cache write (fire-and-forget) ──────────────────────────────────────
  kvSetJson(kv, cacheKey, { products: rows, total }, CACHE_TTL)

  return withEtag(payload, req)
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  const token = extractBearerToken(req.headers.get('Authorization'))
  if (!token) return apiErr('Authorization header required', req, 401)

  const jwt = await verifyJwtViaService(env, token)
  if (!jwt.ok || !jwt.user_id) return apiErr(jwt.error ?? 'Unauthorized', req, 401)

  const body = await readJsonBody(req)
  if (!body.ok) return apiErr(body.error, req, body.status)

  const { name, description, price, stock, category, image_url, is_published } =
    body.data as {
      name?:         string
      description?:  string
      price?:        number
      stock?:        number
      category?:     string
      image_url?:    string
      is_published?: number
    }

  // ── Input validation ──────────────────────────────────────────────────────
  if (!name || typeof name !== 'string' || name.trim().length === 0) {
    return apiErr('name is required', req)
  }
  if (price == null || typeof price !== 'number' || isNaN(price) || price < 0) {
    return apiErr('price must be a non-negative number', req)
  }

  const id  = crypto.randomUUID()
  const now = new Date().toISOString()
  const db  = getDB(env as Record<string, unknown>)

  await db.prepare(`
    INSERT INTO products (id, user_id, name, description, price, stock, category, image_url, is_published, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    id,
    jwt.user_id,
    name.trim(),
    description ?? null,
    price,
    typeof stock === 'number' ? Math.floor(stock) : 0,
    category    ?? null,
    image_url   ?? null,
    is_published != null ? (is_published ? 1 : 0) : 1,
    now,
    now,
  ).run()

  // Invalidate list cache for this user
  const kv = getKV(env as Record<string, unknown>)
  kvInvalidate(kv, `products:${jwt.user_id}:p1:l20:cat`)

  return apiJson({ ok: true, id }, req, 201)
}

export async function OPTIONS(req: NextRequest) {
  return apiOptions(req)
}
