/**
 * otya-core queue/cron wrapper.
 *
 * The dedicated otya-next Worker owns AI inference, AI queue consumption and
 * AI-only schedules. This file intentionally handles only the core-owned
 * push queue and the hourly abuse-maintenance schedule.
 */
import openNextWorker from '../.open-next/worker.js'

export default {
  fetch: openNextWorker.fetch.bind(openNextWorker),

  async queue(batch, env) {
    if (batch.queue !== 'otya-push') {
      throw new Error(`otya-core received unexpected queue: ${batch.queue}`)
    }

    for (const message of batch.messages) {
      try {
        await handlePushMessage(message.body, env)
        message.ack()
      } catch (error) {
        console.error('[PUSH_QUEUE] Failed to process message:', error?.message ?? error)
        message.retry()
      }
    }
  },

  async scheduled(event, env, ctx) {
    if (event.cron !== '0 * * * *') {
      console.warn('[CRON] otya-core received unexpected cron:', event.cron)
      return
    }
    ctx.waitUntil(handleHourlyMaintenance(env))
  },
}

async function handleHourlyMaintenance(env) {
  await runAbuseDetection(env)
  if (new Date().getUTCHours() === 0) {
    await sendDailyAbuseReport(env)
  }
}

/** Detect IPs with >100 downloads in the last hour and block them for 24h. */
async function runAbuseDetection(env) {
  try {
    const { results = [] } = await env.DB.prepare(`
      SELECT ip, COUNT(*) AS count
      FROM downloads
      WHERE created_at >= datetime('now', '-1 hour')
        AND ip IS NOT NULL
        AND ip != 'unknown'
      GROUP BY ip
      HAVING count > 100
      ORDER BY count DESC
      LIMIT 50
    `).all()

    for (const row of results) {
      try {
        await env.KV.put(`blocked:${row.ip}`, '1', { expirationTtl: 86400 })
        console.log(`[CRON] Blocked IP: ${row.ip} (${row.count} downloads/hour)`)
      } catch (error) {
        console.error('[CRON] Failed to block IP', row.ip, error?.message)
      }
    }

    if (results.length === 0) console.log('[CRON] Abuse detection: no abusive IPs found.')
    else console.log(`[CRON] Abuse detection: blocked ${results.length} IP(s).`)
  } catch (error) {
    console.error('[CRON] runAbuseDetection failed:', error?.message)
  }
}

async function sendDailyAbuseReport(env) {
  try {
    if (!env.RESEND_API_KEY) {
      console.warn('[CRON] Daily abuse report skipped: RESEND_API_KEY is not configured.')
      return
    }
    const { keys = [] } = await env.KV.list({ prefix: 'blocked:', limit: 1000 })
    const row = await env.DB.prepare(
      "SELECT COUNT(*) AS count FROM downloads WHERE created_at >= datetime('now', '-1 day')",
    ).first()
    const text = [
      'OTYA Backend Daily Abuse Report',
      '',
      `Currently blocked IPs: ${keys.length}`,
      `Downloads (last 24h): ${row?.count ?? 0}`,
      '',
      `Generated: ${new Date().toISOString()}`,
    ].join('\n')

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'OTYA Backend <noreply@petersmartlink.com>',
        to: [env.ADMIN_REPORT_EMAIL || 'petersmartlink@gmail.com'],
        subject: `[OTYA Backend] Daily Abuse Report — ${new Date().toDateString()}`,
        text,
      }),
    })
    if (!response.ok) {
      throw new Error(`Resend abuse report failed: HTTP ${response.status}`)
    }
    console.log('[CRON] Daily abuse report sent through Resend.')
  } catch (error) {
    console.error('[CRON] sendDailyAbuseReport failed:', error?.message)
  }
}

/**
 * Send one push message.
 *
 * Target priority:
 *   1. deviceId — exactly one device
 *   2. user_id/userId — every registered device for exactly one OTYA user
 *   3. no target — intentional broadcast to all registered devices
 */
async function handlePushMessage(msg, env) {
  const { title, body, url, deviceId } = msg ?? {}
  const userId = msg?.user_id ?? msg?.userId ?? null

  if (!title || !body) throw new Error('Missing required fields: title, body')

  const serviceAccountJson = env.FCM_SERVICE_ACCOUNT_JSON
  if (!serviceAccountJson) throw new Error('FCM_SERVICE_ACCOUNT_JSON secret is not set')

  const sa = JSON.parse(serviceAccountJson)
  const accessToken = await getFcmAccessToken(serviceAccountJson)
  const fcmEndpoint = `https://fcm.googleapis.com/v1/projects/${sa.project_id}/messages:send`
  const link = url ?? env.WEBSITE_URL ?? 'https://petersmartlink.com/download/otya-player'

  const data = { url: String(link) }
  for (const [key, value] of Object.entries(msg?.data ?? {})) {
    if (value !== undefined && value !== null) data[String(key)] = String(value)
  }
  for (const key of ['type', 'version', 'download_url', 'release_notes']) {
    if (msg?.[key] !== undefined && msg?.[key] !== null) data[key] = String(msg[key])
  }

  let tokens = []
  if (deviceId) {
    const row = await env.DB.prepare(
      'SELECT fcm_token FROM devices WHERE device_id = ? AND fcm_token IS NOT NULL',
    ).bind(deviceId).first()
    if (row?.fcm_token) tokens = [row.fcm_token]
  } else if (userId) {
    const { results = [] } = await env.DB.prepare(
      'SELECT DISTINCT fcm_token FROM devices WHERE user_id = ? AND fcm_token IS NOT NULL',
    ).bind(userId).all()
    tokens = results.map((row) => row.fcm_token).filter(Boolean)
  } else {
    let offset = 0
    const pageSize = 1000
    while (true) {
      const { results = [] } = await env.DB.prepare(
        'SELECT DISTINCT fcm_token FROM devices WHERE fcm_token IS NOT NULL LIMIT ? OFFSET ?',
      ).bind(pageSize, offset).all()
      tokens.push(...results.map((row) => row.fcm_token).filter(Boolean))
      if (results.length < pageSize) break
      offset += pageSize
    }
  }

  tokens = [...new Set(tokens)]
  if (tokens.length === 0) {
    console.log('[PUSH_QUEUE] No matching registered devices — skipping.')
    return
  }

  let sent = 0
  let failed = 0
  let removed = 0
  for (const token of tokens) {
    const response = await fetch(fcmEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        message: {
          token,
          notification: { title, body },
          data,
          android: {
            priority: 'high',
            notification: { channel_id: 'otya_updates' },
          },
        },
      }),
    })
    if (response.ok) {
      sent++
      continue
    }

    failed++
    const errorBody = await response.json().catch(() => null)
    const details = errorBody?.error?.details ?? []
    const unregistered = details.some((item) => item?.errorCode === 'UNREGISTERED')
    if (unregistered) {
      try {
        await env.DB.prepare(
          'UPDATE devices SET fcm_token = NULL WHERE fcm_token = ?',
        ).bind(token).run()
        removed++
      } catch (cleanupError) {
        console.error('[PUSH_QUEUE] Failed to clear unregistered token:', cleanupError?.message)
      }
    } else {
      console.warn('[PUSH_QUEUE] FCM send failed:', response.status, errorBody?.error?.status ?? 'unknown')
    }
  }

  const scope = deviceId ? `device:${deviceId}` : userId ? `user:${userId}` : 'broadcast'
  console.log(`[PUSH_QUEUE] Scope=${scope}, Sent=${sent}, Failed=${failed}, Removed=${removed}, Total=${tokens.length}`)
}

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

  const header = base64urlEncode(encodeUtf8(JSON.stringify({ alg: 'RS256', typ: 'JWT' })))
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
  const derBytes = Uint8Array.from(atob(pemBody), (c) => c.charCodeAt(0))

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
      grant_type: 'urn:ietf:params:oauth-type:jwt-bearer',
      assertion: jwt,
    }),
  })
  if (!tokenRes.ok) {
    throw new Error(`OAuth2 token exchange failed: ${tokenRes.status}`)
  }

  const tokenData = await tokenRes.json()
  if (!tokenData.access_token) throw new Error('OAuth2 token exchange returned no access token')
  return tokenData.access_token
}
