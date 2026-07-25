import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
}

// GET /api/blog
export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext()

  // Auth checked before anything else — a 401 must not be masked as an empty list
  const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
  if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)

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
