/**
 * src/lib/payment.ts
 * Payment verification helpers for Google Play Billing and Flutterwave.
 */

import type { D1 } from './d1'

// ── Google Play ───────────────────────────────────────────────────────────────

/**
 * Verify a Google Play subscription purchase using the Play Developer API.
 * Uses a service account JSON for OAuth2 authentication.
 */
export async function verifyGooglePlayPurchase(
  serviceAccountJson: string,
  packageName:         string,
  subscriptionId:      string,
  purchaseToken:       string,
): Promise<{ valid: boolean; expiryMs: number; userId?: string }> {
  try {
    const sa = JSON.parse(serviceAccountJson) as {
      client_email: string
      private_key:  string
      token_uri:    string
    }

    // Get OAuth2 access token via JWT assertion
    const accessToken = await getServiceAccountToken(sa.client_email, sa.private_key, sa.token_uri)
    if (!accessToken) return { valid: false, expiryMs: 0 }

    // Call Play Developer API
    const url = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${encodeURIComponent(packageName)}/purchases/subscriptions/${encodeURIComponent(subscriptionId)}/tokens/${encodeURIComponent(purchaseToken)}`

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    })

    if (!res.ok) {
      console.error('[payment] Play API error:', res.status, await res.text())
      return { valid: false, expiryMs: 0 }
    }

    const data = await res.json() as {
      expiryTimeMillis?: string
      cancelReason?:     number
      paymentState?:     number
      obfuscatedExternalAccountId?: string
    }

    const expiryMs = parseInt(data.expiryTimeMillis ?? '0', 10)
    const now      = Date.now()

    // paymentState: 0 = payment pending, 1 = payment received, 2 = free trial
    const valid = expiryMs > now && (data.paymentState === 1 || data.paymentState === 2)

    return {
      valid,
      expiryMs,
      userId: data.obfuscatedExternalAccountId,
    }
  } catch (e) {
    console.error('[payment] verifyGooglePlayPurchase failed:', (e as Error)?.message)
    return { valid: false, expiryMs: 0 }
  }
}

/**
 * Verify a Flutterwave webhook signature.
 * HMAC-SHA256 of the raw request body using the secret hash.
 */
export async function verifyFlutterwaveSignature(
  payload:    string,
  signature:  string,
  secretHash: string,
): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secretHash),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    )
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload))
    const computed = Array.from(new Uint8Array(sig))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('')
    return computed === signature.toLowerCase()
  } catch (e) {
    console.error('[payment] verifyFlutterwaveSignature failed:', (e as Error)?.message)
    return false
  }
}

/**
 * Upsert pro_status for a user with the given expiry timestamp.
 */
export async function setProStatus(db: D1, userId: string, expiryMs: number): Promise<void> {
  await db.prepare(`
    INSERT INTO pro_status (user_id, expiry_ms, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(user_id) DO UPDATE SET
      expiry_ms  = excluded.expiry_ms,
      updated_at = datetime('now')
  `).bind(userId, expiryMs).run()
}

/**
 * Expire pro_status for a user immediately.
 */
export async function expireProStatus(db: D1, userId: string): Promise<void> {
  await setProStatus(db, userId, Date.now())
}

// ── Internal: Google Service Account JWT ─────────────────────────────────────

async function getServiceAccountToken(
  clientEmail: string,
  privateKey:  string,
  tokenUri:    string,
): Promise<string | null> {
  try {
    const now = Math.floor(Date.now() / 1000)
    const header  = base64urlEncode(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
    const payload = base64urlEncode(JSON.stringify({
      iss:   clientEmail,
      scope: 'https://www.googleapis.com/auth/androidpublisher',
      aud:   tokenUri,
      iat:   now,
      exp:   now + 3600,
    }))

    const signing = `${header}.${payload}`

    // Import the RSA private key (PEM format)
    const pemBody = privateKey
      .replace(/-----BEGIN PRIVATE KEY-----/, '')
      .replace(/-----END PRIVATE KEY-----/, '')
      .replace(/\s/g, '')
    const keyBytes = Uint8Array.from(atob(pemBody), c => c.charCodeAt(0))

    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBytes,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['sign'],
    )

    const sig = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(signing),
    )

    const jwt = `${signing}.${base64urlEncode(new Uint8Array(sig))}`

    // Exchange JWT for access token
    const res = await fetch(tokenUri, {
      method:  'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body:    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
    })

    if (!res.ok) return null
    const data = await res.json() as { access_token?: string }
    return data.access_token ?? null
  } catch (e) {
    console.error('[payment] getServiceAccountToken failed:', (e as Error)?.message)
    return null
  }
}

function base64urlEncode(input: string | Uint8Array): string {
  const bytes = typeof input === 'string'
    ? new TextEncoder().encode(input)
    : input
  let str = ''
  for (const b of bytes) str += String.fromCharCode(b)
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}
