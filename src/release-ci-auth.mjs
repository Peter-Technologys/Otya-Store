const MAX_SKEW_SECONDS = 5 * 60

function constantTimeEqual(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}

function hex(bytes) {
  return Array.from(bytes).map(byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function verifyReleaseCiRequest(request, env) {
  const secret = String(env.OTYA_STORE_ADMIN_TOKEN || '').trim()
  const timestamp = String(request.headers.get('X-Otya-Timestamp') || '').trim()
  const signature = String(request.headers.get('X-Otya-Signature') || '').trim().toLowerCase()
  if (!secret || !timestamp || !/^[0-9a-f]{64}$/.test(signature)) return false

  const now = Math.floor(Date.now() / 1000)
  const issuedAt = Number.parseInt(timestamp, 10)
  if (!Number.isSafeInteger(issuedAt) || Math.abs(now - issuedAt) > MAX_SKEW_SECONDS) return false

  const url = new URL(request.url)
  const signingString = `${request.method.toUpperCase()}:${url.pathname}:${timestamp}`
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const mac = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(signingString))
  return constantTimeEqual(hex(new Uint8Array(mac)), signature)
}
