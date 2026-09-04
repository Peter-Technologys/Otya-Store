export type AdminSessionSnapshot = {
  configured: boolean
  authenticated: boolean
  accountAdmin: boolean
}

const CACHE_TTL_MS = 15_000
const REQUEST_TIMEOUT_MS = 9_000
const MAX_RETRY_DELAY_MS = 3_000

let cached: { expiresAt: number; value: AdminSessionSnapshot } | null = null
let inflight: Promise<AdminSessionSnapshot> | null = null
let generation = 0

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

function retryDelayMs(response: Response): number {
  const raw = response.headers.get('Retry-After')?.trim() ?? ''
  if (!raw) return 750

  const seconds = Number(raw)
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.min(MAX_RETRY_DELAY_MS, Math.max(250, seconds * 1000))
  }

  const retryAt = Date.parse(raw)
  if (Number.isFinite(retryAt)) {
    return Math.min(MAX_RETRY_DELAY_MS, Math.max(250, retryAt - Date.now()))
  }

  return 750
}

async function requestAdminSession(): Promise<AdminSessionSnapshot> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const response = await fetch('/api/admin/session', {
      credentials: 'same-origin',
      cache: 'no-store',
      headers: { Accept: 'application/json' },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })

    if (response.status === 429 && attempt === 0) {
      await sleep(retryDelayMs(response))
      continue
    }

    const body = await response.json().catch(() => ({})) as {
      configured?: boolean
      authenticated?: boolean
      accountAdmin?: boolean
      error?: string
    }

    if (!response.ok) {
      const detail = body.error?.trim()
      throw new Error(detail ? `${detail} (HTTP ${response.status})` : `Admin session check failed (HTTP ${response.status})`)
    }

    return {
      configured: body.configured === true,
      authenticated: body.authenticated === true,
      accountAdmin: body.accountAdmin === true,
    }
  }

  throw new Error('Admin session check failed')
}

export async function getAdminSession(): Promise<AdminSessionSnapshot> {
  const now = Date.now()
  if (cached && cached.expiresAt > now) return cached.value
  if (inflight) return inflight

  const requestGeneration = generation
  const request = requestAdminSession()
    .then(value => {
      if (generation === requestGeneration) {
        cached = { value, expiresAt: Date.now() + CACHE_TTL_MS }
      }
      return value
    })
    .finally(() => {
      if (inflight === request) inflight = null
    })

  inflight = request
  return request
}

export function clearAdminSessionCache(): void {
  generation += 1
  cached = null
  inflight = null
}
