export const NEXT_BRAND = Object.freeze({
  product: 'Otya',
  assistant: 'Next',
  company: 'PeterSmart Link',
})

export const NEXT_ROLES = Object.freeze({
  guest: 'guest',
  user: 'user',
  owner: 'owner',
})

export const NEXT_PUBLIC_BETA_MODELS = Object.freeze([
  'llama-fast',
  'otya-smart',
  'gemma-4',
  'granite',
])

export const NEXT_DEGRADED_MESSAGE =
  'Next is temporarily unavailable. Your local Otya music, video, Library, Private and Transfer features are still available.'

export function normalizeNextRole(value) {
  const role = String(value || '').trim().toLowerCase()
  if (role === NEXT_ROLES.owner) return NEXT_ROLES.owner
  if (role === NEXT_ROLES.user) return NEXT_ROLES.user
  return NEXT_ROLES.guest
}

export function canUseOwnerTools(role) {
  return normalizeNextRole(role) === NEXT_ROLES.owner
}

export function publicBetaModels(value) {
  const configured = String(value || '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)

  if (!configured.length) return [...NEXT_PUBLIC_BETA_MODELS]

  const economical = configured.filter((id) => NEXT_PUBLIC_BETA_MODELS.includes(id))
  return economical.length ? [...new Set(economical)] : [...NEXT_PUBLIC_BETA_MODELS]
}

export function classifyNextFailure(error) {
  const message = String(error?.message || error || '').toLowerCase()
  const status = Number(error?.status || error?.statusCode || 0)

  if (
    status === 429 ||
    message.includes('quota') ||
    message.includes('rate limit') ||
    message.includes('neurons') ||
    message.includes('daily limit') ||
    message.includes('usage limit')
  ) {
    return 'quota'
  }

  if (
    status === 503 ||
    message.includes('ai unavailable') ||
    message.includes('binding unavailable') ||
    message.includes('model unavailable') ||
    message.includes('temporarily unavailable')
  ) {
    return 'unavailable'
  }

  return 'unknown'
}

export function safeNextFailureResponse(error) {
  return {
    ok: false,
    code: classifyNextFailure(error),
    message: NEXT_DEGRADED_MESSAGE,
    local_features_available: true,
    retryable: true,
  }
}
