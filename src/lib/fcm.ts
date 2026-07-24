// FCM HTTP v1 helpers — Web Crypto API only (no Node.js crypto).
// Used by both the Next.js API route and the queue-worker entrypoint.

// ── JWT / OAuth2 primitives ───────────────────────────────────────────────────

export function base64urlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

export function encodeUtf8(str: string): ArrayBuffer {
  const encoded = new TextEncoder().encode(str)
  return encoded.buffer.slice(
    encoded.byteOffset,
    encoded.byteOffset + encoded.byteLength,
  ) as ArrayBuffer
}

/**
 * Mint a short-lived OAuth2 access token for the FCM v1 API using a
 * Firebase service account JSON key. Signs the JWT with RS256 via the
 * Web Crypto API so it works in Cloudflare Workers (no Node.js crypto).
 */
export async function getFcmAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson) as {
    client_email: string
    private_key: string
    token_uri?: string
  }

  const now = Math.floor(Date.now() / 1000)
  const tokenUri = sa.token_uri ?? 'https://oauth2.googleapis.com/token'

  const header  = base64urlEncode(encodeUtf8(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
  const payload = base64urlEncode(encodeUtf8(JSON.stringify({
    iss: sa.client_email,
    sub: sa.client_email,
    aud: tokenUri,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    iat: now,
    exp: now + 3600,
  })))

  const signingInput = `${header}.${payload}`

  const pemBody = sa.private_key
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s+/g, '')
  const derBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    derBytes.buffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    encodeUtf8(signingInput),
  )

  const jwt = `${signingInput}.${base64urlEncode(signature)}`

  const tokenRes = await fetch(tokenUri, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt,
    }),
  })

  if (!tokenRes.ok) {
    const err = await tokenRes.text()
    throw new Error(`OAuth2 token exchange failed: ${tokenRes.status} ${err}`)
  }

  const tokenData = await tokenRes.json() as { access_token: string }
  return tokenData.access_token
}

// ── High-level send helper ────────────────────────────────────────────────────

export interface FcmSendResult {
  sent: number
  failed: number
}

/**
 * Send an FCM push notification to one or more device tokens.
 * Returns counts of successful and failed sends.
 */
export async function sendFcmToTokens(
  tokens: string[],
  title: string,
  body: string,
  url: string,
  serviceAccountJson: string,
  projectId: string,
): Promise<FcmSendResult> {
  const accessToken = await getFcmAccessToken(serviceAccountJson)
  const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`

  let sent = 0, failed = 0
  for (const token of tokens) {
    const res = await fetch(fcmEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data: { url },
          android: { priority: 'high' },
        },
      }),
    })
    if (res.ok) sent++; else failed++
  }

  return { sent, failed }
}
