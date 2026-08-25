// app/api/notifications/reengage/route.ts
// POST /api/notifications/reengage
// Protected by ADMIN_TOKEN (Authorization: Bearer <token> or ?token=<token>).
//
// Queries D1 for devices with last_seen_at < now - 30 days that have an email
// on record (via the feedback table), then sends a re-engagement email via the
// Cloudflare EMAIL binding (send_email).
//
// Body: { dryRun?: boolean }
// Response: { sent: number, dryRun: boolean }

import { NextRequest } from 'next/server'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { secureJson, errorJson } from '@/lib/response'
import { getDB } from '@/lib/d1'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin':  'https://petersmartlink.com',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

/** Check ADMIN_TOKEN from Authorization header or ?token= query param. */
function isAuthorized(req: NextRequest, env: Record<string, unknown>): boolean {
  const adminToken = env.ADMIN_TOKEN as string | undefined
  if (!adminToken) return false
  const url   = new URL(req.url)
  const token =
    url.searchParams.get('token') ??
    req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
  return token === adminToken
}

/** Build the HTML body for the re-engagement email. */
function buildEmailHtml(_email: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>We miss you in OTYA Player!</title>
  <style>
    body { margin: 0; padding: 0; background: #0d0d2e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
    .wrapper { max-width: 560px; margin: 0 auto; padding: 32px 16px; }
    .card { background: #1a1a3e; border-radius: 20px; padding: 40px 32px; border: 1px solid rgba(123,97,255,0.2); }
    .logo { width: 72px; height: 72px; border-radius: 18px; display: block; margin: 0 auto 24px; }
    h1 { color: #ffffff; font-size: 24px; font-weight: 900; text-align: center; margin: 0 0 8px; }
    .subtitle { color: #a0a0c0; font-size: 14px; text-align: center; margin: 0 0 28px; }
    .feature { display: flex; align-items: flex-start; gap: 12px; margin-bottom: 16px; }
    .feature-icon { font-size: 22px; flex-shrink: 0; }
    .feature-text { color: #c0c0e0; font-size: 13px; line-height: 1.5; }
    .feature-title { color: #ffffff; font-weight: 700; font-size: 14px; margin-bottom: 2px; }
    .cta { display: block; background: linear-gradient(135deg, #7b61ff, #06b6d4); color: #ffffff; text-decoration: none; text-align: center; font-weight: 800; font-size: 15px; padding: 14px 32px; border-radius: 14px; margin: 32px 0 0; }
    .footer { color: #606080; font-size: 11px; text-align: center; margin-top: 24px; line-height: 1.6; }
    .footer a { color: #7b61ff; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <img src="https://petersmartlink.com/played-icon.png" alt="OTYA Player" class="logo" />
      <h1>We miss you! 👋</h1>
      <p class="subtitle">It's been a while since you last opened OTYA Player. Here's what's new:</p>

      <div class="feature">
        <span class="feature-icon">🎵</span>
        <div class="feature-text">
          <div class="feature-title">Offline Music &amp; Video</div>
          Play your entire library without internet — no buffering, no ads.
        </div>
      </div>
      <div class="feature">
        <span class="feature-icon">⚡</span>
        <div class="feature-text">
          <div class="feature-title">Flash Share</div>
          Share files with nearby devices at lightning speed — no Wi-Fi needed.
        </div>
      </div>
      <div class="feature">
        <span class="feature-icon">🔒</span>
        <div class="feature-text">
          <div class="feature-title">Private Vault</div>
          Keep your private photos and videos locked behind a PIN or fingerprint.
        </div>
      </div>
      <div class="feature">
        <span class="feature-icon">🎧</span>
        <div class="feature-text">
          <div class="feature-title">5-Band Equalizer</div>
          Fine-tune your sound with a built-in EQ — bass boost, treble, and more.
        </div>
      </div>

      <a href="https://petersmartlink.com/download" class="cta">Download OTYA Player — Free</a>
    </div>
    <p class="footer">
      You're receiving this because you previously used OTYA Player.<br />
      <a href="mailto:support@petersmartlink.com">Unsubscribe</a> · 
      <a href="https://petersmartlink.com">petersmartlink.com</a>
    </p>
  </div>
</body>
</html>`
}

export async function POST(req: NextRequest) {
  const { env } = await getCloudflareContext({ async: true })

  if (!isAuthorized(req, env as Record<string, unknown>)) {
    return errorJson('Unauthorized', 401)
  }

  // ── Parse body ────────────────────────────────────────────────────────────
  let body: Record<string, unknown> = {}
  try {
    const text = await req.text()
    if (text.trim()) body = JSON.parse(text) as Record<string, unknown>
  } catch {
    return errorJson('Invalid JSON body', 400)
  }

  const dryRun = body.dryRun === true

  const db = getDB(env as Record<string, unknown>)

  // ── Find inactive devices with an email on record ─────────────────────────
  // Devices inactive for 30+ days, joined with feedback to get user_email.
  // We deduplicate by email so each address only gets one message.
  const { results } = await db.prepare(`
    SELECT DISTINCT f.user_email
    FROM devices d
    JOIN feedback f ON f.device_id = d.device_id
    WHERE d.last_seen_at < datetime('now', '-30 days')
      AND f.user_email IS NOT NULL
      AND f.user_email != ''
    LIMIT 500
  `).all<{ user_email: string }>()

  if (dryRun) {
    return secureJson({ sent: 0, dryRun: true, emails: results.map((r) => r.user_email) })
  }

  if (results.length === 0) {
    return secureJson({ sent: 0, dryRun: false })
  }

  // ── Send emails via Cloudflare EMAIL binding ──────────────────────────────
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const emailBinding = (env as Record<string, unknown>).EMAIL as any

  if (!emailBinding) {
    return errorJson('EMAIL binding not configured', 500)
  }

  let sent = 0

  for (const row of results) {
    const email = row.user_email.trim()
    if (!email.includes('@')) continue

    try {
      await emailBinding.send({
        from:    { email: 'worker@petersmartlink.com', name: 'OTYA Player' },
        to:      [{ email }],
        subject: 'We miss you in OTYA Player! 🎵',
        html:    buildEmailHtml(email),
        text: [
          "We miss you! 👋",
          '',
          "It's been a while since you last opened OTYA Player. Here's what's new:",
          '',
          '🎵 Offline Music & Video — play your entire library without internet.',
          '⚡ Flash Share — share files with nearby devices at lightning speed.',
          '🔒 Private Vault — keep private media locked behind a PIN or fingerprint.',
          '🎧 5-Band Equalizer — fine-tune your sound with a built-in EQ.',
          '',
          'Download OTYA Player for free: https://petersmartlink.com/download',
          '',
          'To unsubscribe, reply to this email.',
          'PeterSmart Technologies · Mbirizi, Uganda',
        ].join('\n'),
      })
      sent++
    } catch (e) {
      console.error('[reengage] Failed to send email to', email, (e as Error)?.message)
    }
  }

  return secureJson({ sent, dryRun: false })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
