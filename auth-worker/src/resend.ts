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
}

interface ResendResponse {
  id?: string
  message?: string
  name?: string
  statusCode?: number
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
