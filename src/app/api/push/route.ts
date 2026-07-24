import { NextRequest, NextResponse } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'

// POST /api/push — Admin-only: send FCM push notification
// Header: Authorization: Bearer YOUR_ADMIN_TOKEN
//
// Body:
// {
//   "title":    "New update!",
//   "body":     "OTYA Player v1.5.0 is available.",
//   "url":      "https://petersmartlink.com/download",  // optional
//   "deviceId": "abc123"                                // optional — omit to broadcast all
// }
//
// Uses FCM HTTP v1 API with OAuth2 service account credentials.
// Set FCM_SERVICE_ACCOUNT_JSON to the Firebase service account JSON key (Worker secret).

// ── JWT / OAuth2 helpers (Web Crypto API — no Node.js crypto) ────────────────

function base64urlEncode(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

/**
 * Mint a short-lived OAuth2 access token for the FCM v1 API using a
 * Firebase service account JSON key. Signs the JWT with RS256 via the
 * Web Crypto API so it works in Cloudflare Workers (no Node.js crypto).
 */
async function getFcmAccessToken(serviceAccountJson: string): Promise<string> {
  const sa = JSON.parse(serviceAccountJson) as {
    client_email: string
    private_key: string
    token_uri?: string
  }

  const now = Math.floor(Date.now() / 1000)
  const tokenUri = sa.token_uri ?? 'https://oauth2.googleapis.com/token'

  // Build JWT header + payload
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

  // Import the RSA private key (PKCS#8 PEM → CryptoKey)
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

  // Exchange JWT for an access token
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

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext()
  const adminToken        = (env as Record<string, unknown>).ADMIN_TOKEN as string | undefined
  const serviceAccountJson = (env as Record<string, unknown>).FCM_SERVICE_ACCOUNT_JSON as string | undefined

  // Auth
  const auth = req.headers.get('authorization') ?? ''
  if (!adminToken || auth !== `Bearer ${adminToken}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  if (!serviceAccountJson) {
    return NextResponse.json({ error: 'FCM_SERVICE_ACCOUNT_JSON not configured' }, { status: 503 })
  }

  const body = await req.json() as Record<string, string>
  const { title, body: msgBody, url, deviceId } = body
  if (!title || !msgBody) {
    return NextResponse.json({ error: 'title and body required' }, { status: 400 })
  }

  const db = (env as Record<string, unknown>).DB as import('@/lib/d1').D1

  // Fetch FCM tokens
  let tokens: string[] = []
  if (deviceId) {
    const row = await db.prepare(
      'SELECT fcm_token FROM devices WHERE device_id = ? AND fcm_token IS NOT NULL'
    ).bind(deviceId).first<{ fcm_token: string }>()
    if (row?.fcm_token) tokens = [row.fcm_token]
  } else {
    const { results } = await db.prepare(
      'SELECT fcm_token FROM devices WHERE fcm_token IS NOT NULL LIMIT 500'
    ).all<{ fcm_token: string }>()
    tokens = results.map(r => r.fcm_token)
  }

  if (tokens.length === 0) {
    return NextResponse.json({ ok: true, sent: 0, message: 'No registered devices', ts: Date.now() })
  }

  // Mint OAuth2 access token once for all sends
  let accessToken: string
  try {
    accessToken = await getFcmAccessToken(serviceAccountJson)
  } catch (e) {
    return NextResponse.json({ error: `Failed to obtain FCM access token: ${e}` }, { status: 503 })
  }

  // Extract project_id from service account JSON
  const sa = JSON.parse(serviceAccountJson) as { project_id: string }
  const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`
  const link = url ?? 'https://petersmartlink.com/download'

  // FCM v1 sends one message per token
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
          notification: { title, body: msgBody },
          data: { url: link },
          android: { priority: 'high' },
        },
      }),
    })
    if (res.ok) {
      sent++
    } else {
      failed++
    }
  }

  return NextResponse.json({ ok: true, sent, failed, total: tokens.length, ts: Date.now() })
}
