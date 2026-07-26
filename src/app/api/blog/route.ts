import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

// GET /api/blog — public endpoint, no auth required (blog posts are public content)
export async function GET() {
  const { env } = await getCloudflareContext()

  const db = getDB(env as Record<string, unknown>)
  try {
    const { results } = await db.prepare(
      'SELECT * FROM blog_posts WHERE isPublished = 1 ORDER BY createdAt DESC LIMIT 50'
    ).all()
    return secureJson({ posts: results })
  } catch (err) {
    console.error('[blog] D1 query failed:', err)
    return errorJson('Failed to load posts', 500)
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
