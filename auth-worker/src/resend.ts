/**
 * Server-side Resend transport for Otya authentication emails.
 *
 * Cloudflare owns delivery decisions and secure values. Resend can own the
 * presentation of known transactional messages through published templates,
 * but template availability must never block account-critical email delivery.
 */

export interface ResendEmail {
  from: string
  to: string[]
  subject: string
  text: string
  replyTo?: string
}

interface ResendResponse {
  id?: string
  message?: string
  name?: string
  statusCode?: number
}

interface TemplateSelection {
  id: string
  variables: Record<string, string | number>
}

const OTYA_SUPPORT_EMAIL = 'support@petersmartlink.com'
const OTYA_LOGO_URL = 'https://petersmartlink.com/web-app-manifest-192x192.png'

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function renderParagraph(line: string): string {
  const safe = escapeHtml(line.trim())
  if (!safe) return '<div style="height:12px"></div>'

  const isOtp = /^[A-Z][0-9]{4}$/.test(line.trim())
  if (isOtp) {
    return `<div style="margin:22px 0;padding:18px;border-radius:16px;background:#211a46;border:1px solid #8c78ff;text-align:center;font-size:32px;font-weight:900;letter-spacing:10px;color:#ffffff">${safe}</div>`
  }

  const isSignature = line.trim().startsWith('—')
  return `<p style="margin:0 0 12px;line-height:1.65;color:${isSignature ? '#b0a9c7' : '#f4f1ff'};font-size:15px">${safe}</p>`
}

function renderEmailHtml(subject: string, text: string): string {
  const body = text.split('\n').map(renderParagraph).join('')
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#100d1d;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#100d1d;padding:28px 14px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:linear-gradient(145deg,#1b1730,#151224);border:1px solid #332b55;border-radius:22px;overflow:hidden">
        <tr><td style="padding:24px 28px;border-bottom:1px solid #332b55">
          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
            <td style="width:44px;height:44px;vertical-align:middle"><img src="${OTYA_LOGO_URL}" alt="Otya" width="44" height="44" style="display:block;border:0;border-radius:12px" /></td>
            <td style="padding-left:12px"><div style="font-size:23px;font-weight:900;color:#ffffff;letter-spacing:.4px">Otya</div><div style="margin-top:3px;font-size:12px;color:#b0a9c7">Your media. Your way.</div></td>
          </tr></table>
          <div style="height:3px;margin-top:20px;border-radius:3px;background:linear-gradient(90deg,#8c78ff,#d66cff,#69c7ff)"></div>
        </td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 22px;font-size:22px;line-height:1.3;color:#ffffff">${escapeHtml(subject)}</h1>
          ${body}
          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #332b55;color:#aaa2bf;font-size:12px;line-height:1.65">
            <strong style="color:#ddd7ee">Otya · PeterSmart Link</strong><br/>
            This is an automated Otya account or security message. Never share passwords, OTPs or recovery codes.<br/>
            Need help? <a href="mailto:${OTYA_SUPPORT_EMAIL}" style="color:#a996ff;text-decoration:none">${OTYA_SUPPORT_EMAIL}</a>
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

function extractOtp(text: string): string | null {
  return text.match(/\b[A-Z][0-9]{4}\b/)?.[0] ?? null
}

function extractMinutes(text: string, fallback = 10): number {
  const match = text.match(/expires? in\s+(\d+)\s+minutes?/i)
  const value = match ? Number.parseInt(match[1], 10) : fallback
  return Number.isFinite(value) && value > 0 ? value : fallback
}

function extractName(text: string): string {
  const name = text.match(/\b(?:Hi|Hello|Welcome)\s+([^,\n.!]+)/i)?.[1]?.trim()
  if (!name || name.length > 80 || /^(to|your|the|otya)$/i.test(name)) return 'there'
  return name
}

function extractFirstMessageLine(text: string): string {
  return text
    .split('\n')
    .map(line => line.trim())
    .find(line => line && !/^hi\b/i.test(line) && !/^hello\b/i.test(line) && !/^need help\?/i.test(line))
    ?? 'We have an update about your Otya service.'
}

function selectTemplate(email: ResendEmail): TemplateSelection | null {
  const subject = email.subject.toLowerCase()
  const otp = extractOtp(email.text)
  const name = extractName(email.text)

  if (subject.includes('verification code') && otp) {
    return { id: 'otya-verification-code', variables: { NAME: name, CODE: otp, MINUTES: extractMinutes(email.text) } }
  }

  if ((subject.includes('password') || subject.includes('reset')) && otp) {
    return { id: 'otya-password-reset', variables: { NAME: name, CODE: otp, MINUTES: extractMinutes(email.text) } }
  }

  if (subject.includes('welcome')) {
    return { id: 'otya-welcome', variables: { NAME: name } }
  }

  if (subject.includes('security') || subject.includes('new login')) {
    const ip = email.text.match(/IP address\s*:\s*([^\n]+)/i)?.[1]?.trim()
    const time = email.text.match(/Time\s*:\s*([^\n]+)/i)?.[1]?.trim()
    const device = email.text.match(/Device\s*:\s*([^\n]+)/i)?.[1]?.trim()
    const location = email.text.match(/Location\s*:\s*([^\n]+)/i)?.[1]?.trim()
    const message = email.text
      .split('\n')
      .map(line => line.trim())
      .find(line => /detected|security|login|signed in/i.test(line) && !/^hi\b/i.test(line))
      ?? 'We detected security-related activity on your Otya account.'

    return {
      id: 'otya-security-alert',
      variables: {
        NAME: name,
        MESSAGE: message,
        DEVICE: device || 'Otya app or web account',
        LOCATION: location || (ip ? `IP ${ip}` : 'Unknown location'),
        TIME: time || new Date().toUTCString(),
      },
    }
  }

  if (subject.includes('service') || subject.includes('notice') || subject.includes('maintenance')) {
    return {
      id: 'otya-service-notice',
      variables: {
        NAME: name,
        MESSAGE: extractFirstMessageLine(email.text),
        STATUS: subject.includes('maintenance') ? 'Maintenance' : 'Information',
      },
    }
  }

  return null
}

async function postEmail(apiKey: string, payload: Record<string, unknown>): Promise<ResendResponse> {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  let data: ResendResponse = {}
  try { data = await response.json() as ResendResponse } catch { /* provider status below is primary */ }

  if (!response.ok || !data.id) {
    const reason = data.message ?? data.name ?? `HTTP ${response.status}`
    throw new Error(`Resend email failed: ${reason}`)
  }
  return data
}

function fallbackPayload(email: ResendEmail): Record<string, unknown> {
  return {
    from: email.from,
    to: email.to,
    subject: email.subject.replaceAll('OTYA', 'Otya'),
    text: email.text.replaceAll('OTYA', 'Otya'),
    html: renderEmailHtml(
      email.subject.replaceAll('OTYA', 'Otya'),
      email.text.replaceAll('OTYA', 'Otya'),
    ),
    reply_to: email.replyTo ?? OTYA_SUPPORT_EMAIL,
  }
}

export async function sendResendEmail(apiKey: string | undefined, email: ResendEmail): Promise<string> {
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured')

  const template = selectTemplate(email)
  if (template) {
    try {
      const data = await postEmail(apiKey, {
        from: email.from,
        to: email.to,
        template,
        reply_to: email.replyTo ?? OTYA_SUPPORT_EMAIL,
      })
      return data.id!
    } catch (error) {
      // Published template aliases can be removed, renamed or temporarily
      // unavailable. Authentication email delivery is more important than the
      // template presentation, so always retry once with self-contained HTML.
      console.error('[auth/email] Resend template failed; using fallback:', (error as Error)?.message)
    }
  }

  const data = await postEmail(apiKey, fallbackPayload(email))
  return data.id!
}
