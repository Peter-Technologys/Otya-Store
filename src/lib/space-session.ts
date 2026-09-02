'use client'

export type SpaceUser = {
  id?: string
  otya_id?: string | null
  email?: string | null
  name?: string | null
  avatar_url?: string | null
  is_verified?: boolean | number
}

export type SpaceSession = {
  ok?: boolean
  authenticated?: boolean
  user?: SpaceUser
  identities?: Array<{ provider?: string; provider_username?: string | null }>
  products?: Array<{ product_id?: string; status?: string }>
  error?: string
}

let cached: SpaceSession | null = null
let inFlight: Promise<SpaceSession> | null = null

export async function getSpaceSession(force = false): Promise<SpaceSession> {
  if (!force && cached) return cached
  if (!force && inFlight) return inFlight

  const request = fetch('/api/account-session/session', {
    credentials: 'same-origin',
    cache: 'no-store',
    headers: { Accept: 'application/json' },
  }).then(async response => {
    const data = await response.json().catch(() => ({})) as SpaceSession
    const session = { ...data, ok: response.ok }
    if (response.ok && data.authenticated === true) cached = session
    else cached = null
    return session
  }).finally(() => {
    inFlight = null
  })

  inFlight = request
  return request
}

export function seedSpaceSession(session: SpaceSession): void {
  if (session.authenticated === true) cached = session
}

export function clearSpaceSessionCache(): void {
  cached = null
  inFlight = null
}
