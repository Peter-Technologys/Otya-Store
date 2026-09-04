export interface RefreshTokenKv {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string }[]
    list_complete: boolean
    cursor?: string
  }>
}

const CURRENT_TOKEN_PREFIX = 'rt2:'
const CURRENT_USER_PREFIX = 'rt_user2:'
const LEGACY_TOKEN_PREFIX = 'rt:'
const LEGACY_USER_PREFIX = 'rt_user:'
const SYNTHETIC_V2_SUFFIX = 'v2.'
const MAX_USER_REFRESH_INDEXES = 5000

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('')
}

/** One-way identifier used in KV keys instead of the bearer credential. */
export async function refreshTokenDigest(token: string): Promise<string> {
  const digest = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(token),
  )
  return toHex(new Uint8Array(digest))
}

export async function refreshTokenSessionId(token: string): Promise<string> {
  return (await refreshTokenDigest(token)).slice(0, 32)
}

/**
 * rt_user list compatibility suffixes are either:
 * - legacy raw refresh tokens, or
 * - v2.<sha256 digest> synthetic identifiers emitted by the safe KV wrapper.
 */
export async function sessionIdForRefreshIndexSuffix(suffix: string): Promise<string> {
  if (suffix.startsWith(SYNTHETIC_V2_SUFFIX)) {
    const digest = suffix.slice(SYNTHETIC_V2_SUFFIX.length)
    if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error('Invalid v2 refresh-token index')
    return digest.slice(0, 32)
  }
  return refreshTokenSessionId(suffix)
}

async function listAll(kv: RefreshTokenKv, prefix: string): Promise<{ name: string }[]> {
  const keys: { name: string }[] = []
  let cursor: string | undefined
  do {
    const page = await kv.list({ prefix, limit: 1000, cursor })
    keys.push(...page.keys)
    if (keys.length > MAX_USER_REFRESH_INDEXES) {
      throw new Error('Refresh-token index limit exceeded during account-wide revocation')
    }
    cursor = page.list_complete ? undefined : page.cursor
    if (!page.list_complete && !cursor) {
      throw new Error('Refresh-token KV pagination ended without a cursor')
    }
  } while (cursor)
  return keys
}

/**
 * Production compatibility wrapper.
 *
 * Existing auth modules still address `rt:{token}` / `rt_user:{uid}:{token}`.
 * This wrapper translates new writes into versioned SHA-256 indexes while
 * retaining read/delete compatibility for legacy raw-key sessions until their
 * original 30-day KV TTL expires. A digest is never accepted as a bearer token:
 * `get(rt:...)` always hashes the supplied value before checking the v2 index.
 */
export function createRefreshSafeKv(kv: RefreshTokenKv): RefreshTokenKv {
  return {
    async get(key: string): Promise<string | null> {
      if (key.startsWith(LEGACY_TOKEN_PREFIX) && !key.startsWith(LEGACY_USER_PREFIX)) {
        const token = key.slice(LEGACY_TOKEN_PREFIX.length)
        const digest = await refreshTokenDigest(token)
        const current = await kv.get(`${CURRENT_TOKEN_PREFIX}${digest}`)
        if (current) return current
        return kv.get(key)
      }
      return kv.get(key)
    },

    async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
      if (key.startsWith(LEGACY_TOKEN_PREFIX) && !key.startsWith(LEGACY_USER_PREFIX)) {
        const token = key.slice(LEGACY_TOKEN_PREFIX.length)
        const digest = await refreshTokenDigest(token)
        await kv.put(`${CURRENT_TOKEN_PREFIX}${digest}`, value, options)
        return
      }
      if (key.startsWith(LEGACY_USER_PREFIX)) {
        const rest = key.slice(LEGACY_USER_PREFIX.length)
        const separator = rest.indexOf(':')
        if (separator > 0) {
          const userId = rest.slice(0, separator)
          const token = rest.slice(separator + 1)
          const digest = await refreshTokenDigest(token)
          await kv.put(`${CURRENT_USER_PREFIX}${userId}:${digest}`, value, options)
          return
        }
      }
      await kv.put(key, value, options)
    },

    async delete(key: string): Promise<void> {
      if (key.startsWith(LEGACY_TOKEN_PREFIX) && !key.startsWith(LEGACY_USER_PREFIX)) {
        const suffix = key.slice(LEGACY_TOKEN_PREFIX.length)
        if (suffix.startsWith(SYNTHETIC_V2_SUFFIX)) {
          await kv.delete(`${CURRENT_TOKEN_PREFIX}${suffix.slice(SYNTHETIC_V2_SUFFIX.length)}`)
          return
        }
        const digest = await refreshTokenDigest(suffix)
        await Promise.all([
          kv.delete(`${CURRENT_TOKEN_PREFIX}${digest}`),
          kv.delete(key),
        ])
        return
      }
      if (key.startsWith(LEGACY_USER_PREFIX)) {
        const rest = key.slice(LEGACY_USER_PREFIX.length)
        const separator = rest.indexOf(':')
        if (separator > 0) {
          const userId = rest.slice(0, separator)
          const suffix = rest.slice(separator + 1)
          if (suffix.startsWith(SYNTHETIC_V2_SUFFIX)) {
            await kv.delete(`${CURRENT_USER_PREFIX}${userId}:${suffix.slice(SYNTHETIC_V2_SUFFIX.length)}`)
            return
          }
          const digest = await refreshTokenDigest(suffix)
          await Promise.all([
            kv.delete(`${CURRENT_USER_PREFIX}${userId}:${digest}`),
            kv.delete(key),
          ])
          return
        }
      }
      await kv.delete(key)
    },

    async list(options = {}) {
      const prefix = options.prefix ?? ''
      if (prefix.startsWith(LEGACY_USER_PREFIX) && prefix.endsWith(':')) {
        const userId = prefix.slice(LEGACY_USER_PREFIX.length, -1)
        if (userId) {
          // Return a complete logical page so older callers that forgot to pass
          // their cursor still revoke every session. The underlying pagination
          // is handled here with a fail-closed upper bound.
          const [legacy, current] = await Promise.all([
            listAll(kv, `${LEGACY_USER_PREFIX}${userId}:`),
            listAll(kv, `${CURRENT_USER_PREFIX}${userId}:`),
          ])
          return {
            keys: [
              ...legacy,
              ...current.map((entry) => ({
                name: `${LEGACY_USER_PREFIX}${userId}:${SYNTHETIC_V2_SUFFIX}${entry.name.slice(`${CURRENT_USER_PREFIX}${userId}:`.length)}`,
              })),
            ],
            list_complete: true,
          }
        }
      }
      return kv.list(options)
    },
  }
}

/**
 * Revoke a session when only its one-way digest is retained in the session
 * record. New indexes are direct; legacy raw indexes are located by hashing the
 * user's bounded list rather than persisting the bearer token anywhere else.
 */
export async function revokeRefreshTokenByDigest(
  kv: RefreshTokenKv,
  userId: string,
  digest: string,
): Promise<void> {
  if (!/^[a-f0-9]{64}$/.test(digest)) throw new Error('Invalid refresh-token digest')

  await Promise.all([
    kv.delete(`${CURRENT_TOKEN_PREFIX}${digest}`),
    kv.delete(`${CURRENT_USER_PREFIX}${userId}:${digest}`),
  ])

  const legacy = await listAll(kv, `${LEGACY_USER_PREFIX}${userId}:`)
  for (const entry of legacy) {
    const token = entry.name.slice(`${LEGACY_USER_PREFIX}${userId}:`.length)
    if (!token || token.startsWith(SYNTHETIC_V2_SUFFIX)) continue
    if (await refreshTokenDigest(token) !== digest) continue
    await Promise.all([
      kv.delete(entry.name),
      kv.delete(`${LEGACY_TOKEN_PREFIX}${token}`),
    ])
  }
}
