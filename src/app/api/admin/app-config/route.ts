import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'

const KEY = 'app:remote-config'
const MAX_BYTES = 64 * 1024

function authorized(req: NextRequest, env: Record<string, unknown>) {
  const expected = env.ADMIN_TOKEN as string | undefined
  const actual = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  return !!expected && actual === expected
}

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  if (!authorized(req, env as Record<string, unknown>)) return errorJson('Unauthorized', 401)
  const kv = (env as Record<string, unknown>).KV as { get(key: string, type?: 'json'): Promise<unknown> }
  return secureJson({ ok: true, config: await kv.get(KEY, 'json') })
}

export async function PUT(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  if (!authorized(req, env as Record<string, unknown>)) return errorJson('Unauthorized', 401)
  const raw = await req.text()
  if (!raw || raw.length > MAX_BYTES) return errorJson('Config body is empty or too large', 400)
  let body: Record<string, unknown>
  try { body = JSON.parse(raw) as Record<string, unknown> } catch { return errorJson('Invalid JSON', 400) }
  if (typeof body.schemaVersion !== 'number') return errorJson('schemaVersion is required', 400)
  if (typeof body.revision !== 'number') return errorJson('revision is required', 400)
  const kv = (env as Record<string, unknown>).KV as { put(key: string, value: string): Promise<void> }
  await kv.put(KEY, JSON.stringify(body))
  return secureJson({ ok: true, revision: body.revision, updatedAt: new Date().toISOString() })
}

export async function DELETE(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  if (!authorized(req, env as Record<string, unknown>)) return errorJson('Unauthorized', 401)
  const kv = (env as Record<string, unknown>).KV as { delete(key: string): Promise<void> }
  await kv.delete(KEY)
  return secureJson({ ok: true, resetToDefaults: true })
}
