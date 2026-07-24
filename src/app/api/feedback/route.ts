import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { verifyRequest } from '@/lib/auth'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, X-Otya-Timestamp, X-Otya-Signature, X-Otya-Device-Id',
}

// POST /api/feedback — body: { device_id, app_version, version_code, category, description, user_email? }
export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const auth = await verifyRequest(req, env as { OTYA_STORE_ADMIN_TOKEN: string })
  if (!auth.ok) return errorJson(auth.error ?? 'Unauthorized', 401)

  const body = await req.json() as Record<string, unknown>
  const { device_id, app_version, version_code, category, description, user_email } = body

  if (!description || typeof description !== 'string' || description.trim().length === 0) {
    return errorJson('description is required', 400)
  }

  const db = getDB(env as Record<string, unknown>)
  await db.prepare(`
    INSERT INTO feedback (device_id, app_version, version_code, category, description, user_email)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    device_id   ?? null,
    app_version ?? null,
    version_code != null ? Number(version_code) : null,
    category    ?? null,
    description.trim(),
    user_email  ?? null,
  ).run()

  return secureJson({ ok: true, ts: Date.now() })
}

export async function OPTIONS() {
  return new NextResponse(null, { headers: CORS_HEADERS })
}
