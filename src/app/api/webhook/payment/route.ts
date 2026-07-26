/**
 * POST /api/webhook/payment
 *
 * Handles real-time payment notifications from:
 *   1. Google Play Billing (RTDN — Real-time Developer Notifications)
 *   2. Flutterwave webhooks
 *
 * Differentiated by request headers:
 *   - Google Play: body is base64-encoded Pub/Sub message JSON
 *   - Flutterwave: X-Flutterwave-Signature header present
 */

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { errorJson, secureJson } from '@/lib/response'
import { getDB, getKV } from '@/lib/d1'
import {
  verifyGooglePlayPurchase,
  verifyFlutterwaveSignature,
  setProStatus,
  expireProStatus,
} from '@/lib/payment'

// ── Google Play notification types ────────────────────────────────────────────

const GPLAY_SUBSCRIPTION_PURCHASED = 2
const GPLAY_SUBSCRIPTION_RENEWED   = 4
const GPLAY_SUBSCRIPTION_CANCELED  = 3
const GPLAY_SUBSCRIPTION_EXPIRED   = 13

interface GooglePlaySubscriptionNotification {
  version:          string
  notificationType: number
  purchaseToken:    string
  subscriptionId:   string
}

interface GooglePlayNotification {
  version:                      string
  packageName:                  string
  eventTimeMillis:              string
  subscriptionNotification?:    GooglePlaySubscriptionNotification
}

interface GooglePubSubMessage {
  message: {
    data:       string   // base64-encoded JSON
    messageId:  string
    publishTime: string
  }
  subscription: string
}

// ── Flutterwave notification types ────────────────────────────────────────────

interface FlutterwaveWebhook {
  event: string
  data: {
    id:       number
    amount:   number
    currency: string
    status:   string
    customer: { email: string }
    meta?:    { user_id?: string }
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })
  const envMap  = env as Record<string, unknown>

  const db = getDB(envMap)
  const kv = getKV(envMap)

  const rawBody = await req.text()

  // ── Flutterwave ───────────────────────────────────────────────────────────
  const flwSignature = req.headers.get('X-Flutterwave-Signature')
  if (flwSignature) {
    return handleFlutterwave(rawBody, flwSignature, envMap, db)
  }

  // ── Google Play (Pub/Sub push) ────────────────────────────────────────────
  return handleGooglePlay(rawBody, envMap, db, kv)
}

// ── Google Play handler ───────────────────────────────────────────────────────

async function handleGooglePlay(
  rawBody: string,
  env:     Record<string, unknown>,
  db:      ReturnType<typeof getDB>,
  kv:      ReturnType<typeof getKV>,
): Promise<Response> {
  try {
    const pubsub = JSON.parse(rawBody) as GooglePubSubMessage

    // Decode the base64 Pub/Sub message data
    const decoded = atob(pubsub.message.data)
    const notification = JSON.parse(decoded) as GooglePlayNotification

    const sub = notification.subscriptionNotification
    if (!sub) {
      // Not a subscription notification (could be test notification)
      return secureJson({ ok: true, message: 'Non-subscription notification ignored' })
    }

    const { notificationType, purchaseToken, subscriptionId } = sub
    const packageName = notification.packageName

    // ── Purchase / Renewal ────────────────────────────────────────────────
    if (
      notificationType === GPLAY_SUBSCRIPTION_PURCHASED ||
      notificationType === GPLAY_SUBSCRIPTION_RENEWED
    ) {
      const serviceAccountJson = env.GOOGLE_PLAY_SERVICE_ACCOUNT as string | undefined
      const configuredPackage  = env.GOOGLE_PLAY_PACKAGE_NAME    as string | undefined

      if (!serviceAccountJson || !configuredPackage) {
        console.error('[webhook/payment] Google Play service account not configured')
        return errorJson('Payment provider not configured', 503)
      }

      const result = await verifyGooglePlayPurchase(
        serviceAccountJson,
        packageName || configuredPackage,
        subscriptionId,
        purchaseToken,
      )

      if (!result.valid) {
        console.warn('[webhook/payment] Google Play purchase verification failed')
        return secureJson({ ok: false, message: 'Purchase verification failed' })
      }

      // Look up user_id from KV (set when user links their purchase)
      let userId = result.userId
      if (!userId) {
        userId = await kv.get(`gplay_token:${purchaseToken}`) ?? undefined
      }

      if (!userId) {
        console.warn('[webhook/payment] No user_id for purchase token:', purchaseToken.slice(0, 20))
        // Store the token so it can be linked later
        await kv.put(`gplay_token_pending:${purchaseToken}`, JSON.stringify({
          subscriptionId,
          expiryMs: result.expiryMs,
          ts: Date.now(),
        }), { expirationTtl: 90 * 24 * 60 * 60 })
        return secureJson({ ok: true, message: 'Purchase recorded, awaiting user link' })
      }

      await setProStatus(db, userId, result.expiryMs)
      // Cache the token → user_id mapping
      await kv.put(`gplay_token:${purchaseToken}`, userId, { expirationTtl: 90 * 24 * 60 * 60 })

      console.log(`[webhook/payment] Google Play: set pro for ${userId} until ${new Date(result.expiryMs).toISOString()}`)
      return secureJson({ ok: true })
    }

    // ── Cancellation / Expiry ─────────────────────────────────────────────
    if (
      notificationType === GPLAY_SUBSCRIPTION_CANCELED ||
      notificationType === GPLAY_SUBSCRIPTION_EXPIRED
    ) {
      const userId = await kv.get(`gplay_token:${purchaseToken}`)
      if (userId) {
        await expireProStatus(db, userId)
        console.log(`[webhook/payment] Google Play: expired pro for ${userId}`)
      }
      return secureJson({ ok: true })
    }

    // Other notification types — acknowledge without action
    return secureJson({ ok: true, message: `Notification type ${notificationType} acknowledged` })
  } catch (e) {
    console.error('[webhook/payment] Google Play handler error:', (e as Error)?.message)
    return errorJson('Failed to process Google Play notification', 500)
  }
}

// ── Flutterwave handler ───────────────────────────────────────────────────────

async function handleFlutterwave(
  rawBody:      string,
  signature:    string,
  env:          Record<string, unknown>,
  db:           ReturnType<typeof getDB>,
): Promise<Response> {
  const secretHash = env.FLUTTERWAVE_SECRET_HASH as string | undefined
  if (!secretHash) {
    console.error('[webhook/payment] FLUTTERWAVE_SECRET_HASH not configured')
    return errorJson('Payment provider not configured', 503)
  }

  // Verify signature
  const valid = await verifyFlutterwaveSignature(rawBody, signature, secretHash)
  if (!valid) {
    console.warn('[webhook/payment] Flutterwave signature verification failed')
    return errorJson('Invalid signature', 401)
  }

  try {
    const webhook = JSON.parse(rawBody) as FlutterwaveWebhook
    const { event, data } = webhook

    // ── Successful charge ─────────────────────────────────────────────────
    if (event === 'charge.completed' && data.status === 'successful') {
      const userId = data.meta?.user_id ?? data.customer?.email
      if (!userId) {
        console.warn('[webhook/payment] Flutterwave: no user_id in webhook data')
        return secureJson({ ok: true, message: 'No user_id — cannot update pro status' })
      }

      // Grant 30 days of pro from now
      const expiryMs = Date.now() + 30 * 24 * 60 * 60 * 1000
      await setProStatus(db, userId, expiryMs)

      console.log(`[webhook/payment] Flutterwave: set pro for ${userId} until ${new Date(expiryMs).toISOString()}`)
      return secureJson({ ok: true })
    }

    // ── Subscription cancelled ────────────────────────────────────────────
    if (event === 'subscription.cancelled') {
      const userId = data.meta?.user_id ?? data.customer?.email
      if (userId) {
        await expireProStatus(db, userId)
        console.log(`[webhook/payment] Flutterwave: expired pro for ${userId}`)
      }
      return secureJson({ ok: true })
    }

    // Other events — acknowledge
    return secureJson({ ok: true, message: `Event ${event} acknowledged` })
  } catch (e) {
    console.error('[webhook/payment] Flutterwave handler error:', (e as Error)?.message)
    return errorJson('Failed to process Flutterwave notification', 500)
  }
}

export async function OPTIONS() {
  return new Response(null, { status: 204 })
}
