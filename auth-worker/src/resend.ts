/**
 * Server-side Resend transport for OTYA authentication emails.
 *
 * The API key must be provided as the Cloudflare Worker secret
 * RESEND_API_KEY. It must never be embedded in source or sent to clients.
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
    return `<div style="margin:18px 0;padding:16px 18px;border-radius:14px;background:#11152f;border:1px solid #7638ff;text-align:center;font-size:30px;font-weight:800;letter-spacing:9px;color:#ffffff">${safe}</div>`
  }

  const isSignature = line.trim().startsWith('—')
  return `<p style="margin:0 0 12px;line-height:1.65;color:${isSignature ? '#a9abc0' : '#e9e9f4'};font-size:15px">${safe}</p>`
}

function renderEmailHtml(subject: string, text: string): string {
  const body = text.split('\n').map(renderParagraph).join('')
  return `<!doctype html>
<html>
<body style="margin:0;padding:0;background:#07091a;font-family:Inter,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#07091a;padding:28px 14px">
    <tr><td align="center">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#0d1026;border:1px solid #25294b;border-radius:22px;overflow:hidden">
        <tr><td style="padding:26px 28px;background:linear-gradient(135deg,#16c8ff 0%,#7b2cff 52%,#ff19ae 100%)">
          <div style="font-size:24px;font-weight:900;color:#ffffff;letter-spacing:.3px">OTYA</div>
          <div style="margin-top:5px;font-size:13px;color:#f4edff">One account across OTYA products.</div>
        </td></tr>
        <tr><td style="padding:28px">
          <h1 style="margin:0 0 22px;font-size:22px;line-height:1.3;color:#ffffff">${escapeHtml(subject)}</h1>
          ${body}
          <div style="margin-top:26px;padding-top:20px;border-top:1px solid #272b4d;color:#8f92aa;font-size:12px;line-height:1.6">
            This is an automated OTYA account message. For help, contact
            <a href="mailto:${OTYA_SUPPORT_EMAIL}" style="color:#a56cff;text-decoration:none">${OTYA_SUPPORT_EMAIL}</a>.
          </div>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`
}

export async function sendResendEmail(
  apiKey: string | undefined,
  email: ResendEmail,
): Promise<string> {
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: email.from,
      to: email.to,
      subject: email.subject,
      text: email.text,
      html: renderEmailHtml(email.subject, email.text),
      reply_to: email.replyTo ?? OTYA_SUPPORT_EMAIL,
    }),
  })

  let data: ResendResponse = {}
  try {
    data = await response.json() as ResendResponse
  } catch {
    // Keep the provider status as the primary error below.
  }

  if (!response.ok || !data.id) {
    const reason = data.message ?? data.name ?? `HTTP ${response.status}`
    throw new Error(`Resend email failed: ${reason}`)
  }

  return data.id
}
