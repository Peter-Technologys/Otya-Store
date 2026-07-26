import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// ── Auth helper ───────────────────────────────────────────────────────────────

function isAdminAuthorized(req: NextRequest, env: Record<string, unknown>): boolean {
  const adminToken = env.ADMIN_TOKEN as string | undefined
  if (!adminToken) return false
  const authHeader = req.headers.get('Authorization')
  const token = authHeader?.replace(/^Bearer\s+/i, '') ?? ''
  return token === adminToken
}

// ── Slug generator ────────────────────────────────────────────────────────────

function slugify(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

// ── GET /api/blog — public, no auth ──────────────────────────────────────────

export async function GET() {
  const { env } = await getCloudflareContext({ async: true })
  const db = getDB(env as Record<string, unknown>)
  try {
    const { results } = await db.prepare(
      'SELECT id, slug, title, excerpt, cover_image_url, createdAt FROM blog_posts WHERE isPublished = 1 ORDER BY createdAt DESC LIMIT 50'
    ).all()
    return secureJson({ posts: results })
  } catch (err) {
    console.error('[blog] D1 query failed:', err)
    return errorJson('Failed to load posts', 500)
  }
}

// ── POST /api/blog — create post (admin only) ─────────────────────────────────

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const envMap  = env as Record<string, unknown>

  if (!isAdminAuthorized(req, envMap)) return errorJson('Unauthorized', 401)

  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return errorJson('Invalid JSON body') }

  const { title, content, slug: rawSlug, excerpt, cover_image_url } = body as {
    title?:           string
    content?:         string
    slug?:            string
    excerpt?:         string
    cover_image_url?: string
  }

  if (!title || typeof title !== 'string' || !title.trim()) {
    return errorJson('title is required')
  }
  if (!content || typeof content !== 'string' || !content.trim()) {
    return errorJson('content is required')
  }

  const slug = (rawSlug && typeof rawSlug === 'string' && rawSlug.trim())
    ? rawSlug.trim()
    : slugify(title)

  const db = getDB(envMap)

  try {
    const result = await db.prepare(`
      INSERT INTO blog_posts (slug, title, content, excerpt, cover_image_url, isPublished, createdAt)
      VALUES (?, ?, ?, ?, ?, 1, datetime('now'))
    `).bind(
      slug,
      title.trim(),
      content.trim(),
      excerpt?.trim() ?? null,
      cover_image_url?.trim() ?? null,
    ).run()

    const post = await db.prepare('SELECT * FROM blog_posts WHERE id = ?')
      .bind(result.meta.last_row_id)
      .first()

    return secureJson({ ok: true, post }, { status: 201 })
  } catch (err) {
    console.error('[blog POST] D1 insert failed:', err)
    // Slug conflict
    if (String(err).includes('UNIQUE')) {
      return errorJson('A post with this slug already exists', 409)
    }
    return errorJson('Failed to create post', 500)
  }
}

// ── PATCH /api/blog — update post (admin only) ────────────────────────────────

export async function PATCH(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const envMap  = env as Record<string, unknown>

  if (!isAdminAuthorized(req, envMap)) return errorJson('Unauthorized', 401)

  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return errorJson('Invalid JSON body') }

  const { id, title, content, excerpt, cover_image_url, isPublished } = body as {
    id?:              number
    title?:           string
    content?:         string
    excerpt?:         string
    cover_image_url?: string
    isPublished?:     number
  }

  if (!id) return errorJson('id is required')

  const db = getDB(envMap)

  const setClauses: string[] = ["updatedAt = datetime('now')"]
  const binds: unknown[]     = []

  if (title !== undefined)           { setClauses.push('title = ?');           binds.push(title) }
  if (content !== undefined)         { setClauses.push('content = ?');         binds.push(content) }
  if (excerpt !== undefined)         { setClauses.push('excerpt = ?');         binds.push(excerpt) }
  if (cover_image_url !== undefined) { setClauses.push('cover_image_url = ?'); binds.push(cover_image_url) }
  if (isPublished !== undefined)     { setClauses.push('isPublished = ?');     binds.push(isPublished ? 1 : 0) }

  if (setClauses.length === 1) return errorJson('No fields to update')

  binds.push(id)

  try {
    await db.prepare(`UPDATE blog_posts SET ${setClauses.join(', ')} WHERE id = ?`)
      .bind(...binds).run()

    const post = await db.prepare('SELECT * FROM blog_posts WHERE id = ?').bind(id).first()
    if (!post) return errorJson('Post not found', 404)

    return secureJson({ ok: true, post })
  } catch (err) {
    console.error('[blog PATCH] D1 update failed:', err)
    return errorJson('Failed to update post', 500)
  }
}

// ── DELETE /api/blog — soft delete (admin only) ───────────────────────────────

export async function DELETE(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const envMap  = env as Record<string, unknown>

  if (!isAdminAuthorized(req, envMap)) return errorJson('Unauthorized', 401)

  let body: Record<string, unknown>
  try { body = await req.json() as Record<string, unknown> }
  catch { return errorJson('Invalid JSON body') }

  const { id, slug } = body as { id?: number; slug?: string }
  if (!id && !slug) return errorJson('id or slug is required')

  const db = getDB(envMap)

  try {
    if (id) {
      await db.prepare("UPDATE blog_posts SET isPublished = 0, updatedAt = datetime('now') WHERE id = ?")
        .bind(id).run()
    } else {
      await db.prepare("UPDATE blog_posts SET isPublished = 0, updatedAt = datetime('now') WHERE slug = ?")
        .bind(slug).run()
    }
    return secureJson({ ok: true, message: 'Post unpublished (soft delete)' })
  } catch (err) {
    console.error('[blog DELETE] D1 update failed:', err)
    return errorJson('Failed to delete post', 500)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS })
}
