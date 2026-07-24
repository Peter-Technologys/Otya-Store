/**
 * Wrangler entrypoint for otya-store.
 *
 * Wraps the OpenNext worker (which handles all HTTP/fetch traffic) and adds a
 * queue() handler so the [[queues.consumers]] binding in wrangler.toml can be
 * satisfied.  Without this handler Cloudflare refuses to register the consumer
 * and the deploy fails with:
 *   ✘ [ERROR] Some triggers failed to deploy for otya-store:
 *       - A request to the Cloudflare API (/accounts/.../queues/.../consumers) failed.
 *
 * Build order (package.json "deploy" script):
 *   1. opennextjs-cloudflare build  →  produces .open-next/worker.js
 *   2. wrangler deploy              →  bundles THIS file (which imports the
 *                                      above artifact) and deploys
 */
import openNextWorker from '../.open-next/worker.js'

export default {
  // ── HTTP handler — delegate entirely to OpenNext ──────────────────────────
  fetch: openNextWorker.fetch.bind(openNextWorker),

  // ── Queue consumer — process push notification messages ───────────────────
  async queue(batch, env, ctx) {
    for (const message of batch.messages) {
      try {
        await handlePushMessage(message.body, env)
        message.ack()
      } catch (e) {
        console.error('[PUSH_QUEUE] Failed to process message:', e?.message ?? e)
        message.retry()
      }
    }
  },
}

// ── Push message handler ──────────────────────────────────────────────────────

/**
 * @param {{ title: string, body: string, url?: string, deviceId?: string }} msg
 * @param {Record<string, unknown>} env
 */
async function handlePushMessage(msg, env) {
  const { title, body, url, deviceId } = msg

  if (!title || !body) throw new Error('Missing required fields: title, body')

  const serviceAccountJson = env.FCM_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) throw new Error('FCM_SERVICE_ACCOUNT_JSON secret is not set')

  const sa = JSON.parse(serviceAccountJson)
  const accessToken = await getFcmAccessToken(serviceAccountJson)
  const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`
  const link = url ?? env.WEBSITE_URL ?? 'https://petersmartlink.com/download'

  // Resolve target FCM tokens from D1
  let tokens = []
  if (deviceId) {
    const row = await env.DB.prepare(
      'SELECT fcm_token FROM devices WHERE device_id = ? AND fcm_token IS NOT NULL',
    ).bind(deviceId).first()
    if (row?.fcm_token) tokens = [row.fcm_token]
  } else {
    const { results } = await env.DB.prepare(
      'SELECT fcm_token FROM devices WHERE fcm_token IS NOT NULL LIMIT 500',
    ).all()
    tokens = results.map(r => r.fcm_token)
  }

  if (tokens.length === 0) {
    console.log('[PUSH_QUEUE] No registered devices — skipping.')
    return
  }

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
          data: { url: link },
          android: { priority: 'high' },
        },
      }),
    })
    if (res.ok) sent++; else failed++
  }

  console.log(`[PUSH_QUEUE] Sent: ${sent}, Failed: ${failed}, Total: ${tokens.length}`)
}

// ── FCM helpers (plain JS — this file runs outside the Next.js bundler) ───────
// These mirror src/lib/fcm.ts exactly so there is a single source of truth for
// the algorithm; only the module format differs.

function base64urlEncode(buf) {
  const bytes = new Uint8Array(buf)
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function encodeUtf8(str) {
  const encoded = new TextEncoder().encode(str)
  return encoded.buffer.slice(encoded.byteOffset, encoded.byteOffset + encoded.byteLength)
}

async function getFcmAccessToken(serviceAccountJson) {
  const sa = JSON.parse(serviceAccountJson)
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
    throw new Error(`OAuth2 token exchange failed: ${tokenRes.status} ${await tokenRes.text()}`)
  }

  const data = await tokenRes.json()
  return data.access_token
}
