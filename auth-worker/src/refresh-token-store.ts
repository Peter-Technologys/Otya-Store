export interface RefreshTokenKv {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
  list?(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string }[]
    list_complete: boolean
    cursor?: string
  }>
}

const TOKEN_DIGEST_PATTERN = /^[a-f0-9]{64}$/

function hex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/**
 * Derive a one-way index identifier for a bearer refresh token.
 *
 * The digest is safe to expose in a KV key name: listing keys no longer
 * reveals the credential needed to authenticate a refresh request.
 */
export async function refreshTokenDigest(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  )
  return hex(new Uint8Array(digest))
}

export async function refreshTokenSessionId(token: string): Promise<string> {
  return (await refreshTokenDigest(token)).slice(0, 32)
}

/**
 * Convert an rt_user suffix into the session id used by auth_session records.
 * New suffixes are SHA-256 digests; legacy suffixes are the raw bearer token.
 */
export async function sessionIdForRefreshIndexSuffix(
  suffix: string,
): Promise<string> {
  if (TOKEN_DIGEST_PATTERN.test(suffix)) return suffix.slice(0, 32)
  return refreshTokenSessionId(suffix)
}

export async function storeRefreshTokenIndex(
  kv: RefreshTokenKv,
  userId: string,
  token: string,
  ttlSeconds: number,
): Promise<string> {
  const digest = await refreshTokenDigest(token)
  await Promise.all([
    kv.put(`rt:${digest}`, userId, { expirationTtl: ttlSeconds }),
    kv.put(`rt_user:${userId}:${digest}`, '1', { expirationTtl: ttlSeconds }),
  ])
  return digest
}

/**
 * Read a refresh-token index without extending legacy token lifetime.
 *
 * New digest-backed keys are checked first. The raw-key fallback exists only
 * for sessions issued before this migration and can disappear naturally when
 * their original KV TTL expires.
 */
export async function lookupRefreshTokenUser(
  kv: RefreshTokenKv,
  token: string,
): Promise<string | null> {
  const digest = await refreshTokenDigest(token)
  const current = await kv.get(`rt:${digest}`)
  if (current) return current
  return kv.get(`rt:${token}`)
}

export async function revokeRefreshTokenIndex(
  kv: RefreshTokenKv,
  token: string,
  knownUserId?: string | null,
): Promise<void> {
  const digest = await refreshTokenDigest(token)
  const userId = knownUserId
    ?? await kv.get(`rt:${digest}`)
    ?? await kv.get(`rt:${token}`)

  const removals: Promise<void>[] = [
    kv.delete(`rt:${digest}`),
    kv.delete(`rt:${token}`),
  ]
  if (userId) {
    removals.push(
      kv.delete(`rt_user:${userId}:${digest}`),
      kv.delete(`rt_user:${userId}:${token}`),
    )
  }
  await Promise.all(removals)
}

export async function revokeAllUserRefreshTokenIndexes(
  kv: RefreshTokenKv,
  userId: string,
): Promise<void> {
  if (!kv.list) throw new Error('KV list() is required for account-wide revocation')

  const prefix = `rt_user:${userId}:`
  let cursor: string | undefined
  do {
    const page = await kv.list({ prefix, limit: 1000, cursor })
    for (const key of page.keys) {
      const suffix = key.name.slice(prefix.length)
      if (!suffix) continue
      await Promise.all([
        kv.delete(key.name),
        kv.delete(`rt:${suffix}`),
      ])
    }
    cursor = page.list_complete ? undefined : page.cursor
  } while (cursor)
}
