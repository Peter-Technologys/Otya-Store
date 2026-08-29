import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { extractFirebaseOwnedClientConfig } from '@/lib/client_config'
import { publishOtyaClientConfig } from '@/lib/firebase_remote_config'

const KEY = 'app:remote-config'
const FIREBASE_SYNC_KEY = 'app:remote-config:firebase-sync'
const MAX_BYTES = 64 * 1024

type KvLike = {
  get(key: string, type?: 'json'): Promise<unknown>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

function authorized(req: NextRequest, env: Record<string, unknown>) {
  const expected = env.ADMIN_TOKEN as string | undefined
  const actual = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  return !!expected && actual === expected
}

function firebaseSettings(env: Record<string, unknown>) {
  return {
    serviceAccountJson: env.FCM_SERVICE_ACCOUNT_JSON as string | undefined,
    projectId: env.FIREBASE_PROJECT_ID as string | undefined,
  }
}

async function syncFirebaseClientConfig(
  env: Record<string, unknown>,
  kv: KvLike,
  config: Record<string, unknown>,
  revision: number,
): Promise<{ configured: boolean; synced: boolean }> {
  const { serviceAccountJson, projectId } = firebaseSettings(env)
  if (!serviceAccountJson) {
    const status = { configured: false, synced: false, revision, updatedAt: new Date().toISOString() }
    await kv.put(FIREBASE_SYNC_KEY, JSON.stringify(status))
    return { configured: false, synced: false }
  }

  try {
    await publishOtyaClientConfig(
      serviceAccountJson,
      extractFirebaseOwnedClientConfig(config),
      revision,
      projectId,
    )
    const status = { configured: true, synced: true, revision, updatedAt: new Date().toISOString() }
    await kv.put(FIREBASE_SYNC_KEY, JSON.stringify(status))
    return { configured: true, synced: true }
  } catch (error) {
    console.error('[admin/app-config] Firebase Remote Config sync failed:', (error as Error)?.message)
    const status = { configured: true, synced: false, revision, updatedAt: new Date().toISOString() }
    await kv.put(FIREBASE_SYNC_KEY, JSON.stringify(status))
    return { configured: true, synced: false }
  }
}

export async function GET(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>
  if (!authorized(req, recordEnv)) return errorJson('Unauthorized', 401)
  const kv = recordEnv.KV as KvLike
  const [config, firebase] = await Promise.all([
    kv.get(KEY, 'json'),
    kv.get(FIREBASE_SYNC_KEY, 'json'),
  ])
  return secureJson({ ok: true, config, firebase })
}

export async function PUT(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>
  if (!authorized(req, recordEnv)) return errorJson('Unauthorized', 401)

  const raw = await req.text()
  if (!raw || raw.length > MAX_BYTES) return errorJson('Config body is empty or too large', 400)

  let body: Record<string, unknown>
  try {
    body = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return errorJson('Invalid JSON', 400)
  }
  if (typeof body.schemaVersion !== 'number') return errorJson('schemaVersion is required', 400)
  if (typeof body.revision !== 'number') return errorJson('revision is required', 400)

  const kv = recordEnv.KV as KvLike
  const revision = body.revision

  // Cloudflare stores the full safety/fallback snapshot first. Firebase owns
  // the client-experiment subset, but a failed Firebase sync must never make
  // the admin lose a valid safety config or make the app unavailable.
  await kv.put(KEY, JSON.stringify(body))
  const firebase = await syncFirebaseClientConfig(recordEnv, kv, body, revision)

  return secureJson({
    ok: true,
    revision,
    firebase,
    updatedAt: new Date().toISOString(),
  })
}

export async function DELETE(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const recordEnv = env as Record<string, unknown>
  if (!authorized(req, recordEnv)) return errorJson('Unauthorized', 401)

  const kv = recordEnv.KV as KvLike
  const current = await kv.get(KEY, 'json') as Record<string, unknown> | null
  const nextRevision = typeof current?.revision === 'number'
    ? current.revision + 1
    : Date.now()

  await kv.delete(KEY)

  // Publish an empty Firebase client layer so old client experiments do not
  // survive a deliberate reset. Failure is non-fatal because Cloudflare
  // defaults remain the safety source.
  const firebase = await syncFirebaseClientConfig(
    recordEnv,
    kv,
    { schemaVersion: 1, revision: nextRevision },
    nextRevision,
  )

  return secureJson({ ok: true, resetToDefaults: true, firebase })
}
