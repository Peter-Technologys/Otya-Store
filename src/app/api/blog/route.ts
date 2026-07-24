import { NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { API_CORS } from '@/lib/auth'
import { getDB } from '@/lib/d1'

const CORS = API_CORS

// GET /api/blog — public, no auth required
export async function GET() {
  try {
    const { env } = await getCloudflareContext()
    const db = getDB(env as Record<string, unknown>)
    const { results } = await db.prepare(
      'SELECT * FROM blog_posts WHERE isPublished = 1 ORDER BY createdAt DESC LIMIT 50'
    ).all()
    return NextResponse.json({ posts: results }, { headers: CORS })
  } catch {
    return NextResponse.json({ posts: [] }, { headers: CORS })
  }
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS })
}
