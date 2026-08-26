/**
 * OTYA System transactional email transport.
 *
 * The Resend API key is a Cloudflare Worker secret and must never be placed
 * in Flutter, source control, Wrangler vars, or logs.
 */

const RESEND_API_URL = 'https://api.resend.com/emails'

export interface OtyaEmail {
  to: string
  subject: string
  text: string
  html?: string
  from?: string
}

export async function sendResendEmail(
  apiKey: string | undefined,
  email: OtyaEmail,
): Promise<void> {
  if (!apiKey) {
    throw new Error('RESEND_API_KEY is not configured')
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: email.from ?? 'OTYA System <noreply@petersmartlink.com>',
      to: [email.to],
      subject: email.subject,
      text: email.text,
      ...(email.html ? { html: email.html } : {}),
    }),
  })

  if (!response.ok) {
    // Never include the API key or authorization header in the error.
    const detail = await response.text().catch(() => '')
    const safeDetail = detail.length > 300 ? `${detail.slice(0, 300)}…` : detail
    throw new Error(
      `Resend email request failed (${response.status})${safeDetail ? `: ${safeDetail}` : ''}`,
    )
  }
}
