/**
 * Server-side Resend transport for OTYA authentication emails.
 *
 * Cloudflare owns delivery decisions and secure values. Resend owns the
 * presentation of known transactional messages through published templates.
 * Unknown/legacy messages keep a safe HTML+text fallback so email delivery can
 * never be blocked by a template rollout.
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
    return `<div style="margin:22px 0;padding:18px;border-radius:16px;background:#11182a;border:1px solid #7c3cff;text-align:center;font-size:32px;font-weight:900;letter-spacing:10px;color:#ffffff">${safe}</div>`
  }

  const isSignature = line.trim().startsWith('—')
  return `<p style="margin:0 0 12px;line-height:1.65;color:${isSignature ? '#9ca5bb' : '#edf2ff'};font-size:15px">${safe}</p>`
}

function renderEmailHtml(subject: string, text: string): string {
  const body = text.split('\n').map(renderParagraph).join('')
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#080b12;font-family:Arial,Helvetica,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#080b12;padding:28px 14px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#0f1420;border:1px solid #252d40;border-radius:22px;overflow:hidden">
        <tr><td style="padding:24px 28px;border-bottom:1px solid #252d40">
          <table role="presentation" cellspacing="0" cellpadding="0"><tr>
            <td style="width:38px;height:38px;border-radius:19px;background:#7c3cff;text-align:center;vertical-align:middle;color:#ffffff;font-size:22px;font-weight:900">O</td>
            <td style="padding-left:11px"><div style="font-size:23px;font-weight:900;color:#ffffff;letter-spacing:1.4px">TYA</div><div style="margin-top:3px;font-size:12px;color:#9ca5bb">Your media. Your way.</div></td>
          </tr></table>
          <div style="height:3px;margin-top:20px;border-radius:3px;background:#7c3cff"></div>
        </td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 22px;font-size:22px;line-height:1.3;color:#ffffff">${escapeHtml(subject)}</h1>
          ${body}
          <div style="margin-top:28px;padding-top:20px;border-top:1px solid #252d40;color:#8993a8;font-size:12px;line-height:1.65">
            <strong style="color:#c9d1e3">OTYA · PeterSmart Link</strong><br/>
            This is an automated OTYA account or security message. Never share passwords, OTPs or recovery codes.<br/>
            Need help? <a href="mailto:${OTYA_SUPPORT_EMAIL}" style="color:#9b7cff;text-decoration:none">${OTYA_SUPPORT_EMAIL}</a>
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

function selectTemplate(email: ResendEmail): TemplateSelection | null {
  const subject = email.subject.toLowerCase()
  const otp = extractOtp(email.text)

  if (subject.includes('verification code') && otp) {
    return { id: 'otya-verification-code', variables: { CODE: otp, MINUTES: extractMinutes(email.text) } }
  }

  if ((subject.includes('password') || subject.includes('reset')) && otp) {
    return { id: 'otya-password-reset', variables: { CODE: otp, MINUTES: extractMinutes(email.text) } }
  }

  if (subject.includes('welcome')) {
    const name = email.text.match(/\bHi\s+([^,\n]+),/i)?.[1]?.trim() || 'there'
    return { id: 'otya-welcome', variables: { NAME: name } }
  }

  if (subject.includes('security') || subject.includes('new login')) {
    const ip = email.text.match(/IP address\s*:\s*([^\n]+)/i)?.[1]?.trim()
    const time = email.text.match(/Time\s*:\s*([^\n]+)/i)?.[1]?.trim()
    const message = email.text
      .split('\n')
      .map(line => line.trim())
      .find(line => /detected|security|login/i.test(line) && !/^hi\b/i.test(line))
      ?? 'We detected security-related activity on your OTYA account.'

    return {
      id: 'otya-security-alert',
      variables: {
        MESSAGE: message,
        DEVICE: 'OTYA app or web account',
        LOCATION: ip ? `IP ${ip}` : 'Unknown location',
        TIME: time || new Date().toUTCString(),
      },
    }
  }

  return null
}

export async function sendResendEmail(apiKey: string | undefined, email: ResendEmail): Promise<string> {
  if (!apiKey) throw new Error('RESEND_API_KEY is not configured')

  const template = selectTemplate(email)
  const payload = template
    ? { from: email.from, to: email.to, template, reply_to: email.replyTo ?? OTYA_SUPPORT_EMAIL }
    : {
        from: email.from,
        to: email.to,
        subject: email.subject,
        text: email.text,
        html: renderEmailHtml(email.subject, email.text),
        reply_to: email.replyTo ?? OTYA_SUPPORT_EMAIL,
      }

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

  return data.id
}
