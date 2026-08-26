/**
 * OTYA Auth production entrypoint.
 *
 * The existing authentication handlers still call env.EMAIL. Rather than
 * rewriting the large authentication module in one risky operation, this
 * entrypoint supplies a compatible EMAIL adapter backed by Resend.
 *
 * This keeps all authentication behavior intact while moving the actual
 * transactional email transport to the server-side RESEND_API_KEY secret.
 */

import legacyWorker from './index'
import { sendResendEmail, type ResendEmail } from './resend'

interface LegacyEmailMessage {
  from: { email: string; name?: string }
  to: { email: string }[]
  subject: string
  text: string
}

interface ResendEnv extends Record<string, unknown> {
  RESEND_API_KEY?: string
}

function normalizeEmailText(text: string): string {
  return text.replace(
    '(1 letter + 3 digits — enter it exactly as shown)',
    '(1 uppercase letter + 4 digits — enter it exactly as shown, e.g. A1234)',
  )
}

function createEmailAdapter(apiKey: string | undefined) {
  return {
    async send(message: LegacyEmailMessage): Promise<void> {
      const from = message.from.name
        ? `${message.from.name} <${message.from.email}>`
        : message.from.email
      const email: ResendEmail = {
        from,
        to: message.to.map((recipient) => recipient.email),
        subject: message.subject,
        text: normalizeEmailText(message.text),
      }
      await sendResendEmail(apiKey, email)
    },
  }
}

export default {
  async fetch(request: Request, env: ResendEnv): Promise<Response> {
    const resendEnv = {
      ...env,
      EMAIL: createEmailAdapter(env.RESEND_API_KEY),
    }

    return legacyWorker.fetch(
      request,
      resendEnv as Parameters<typeof legacyWorker.fetch>[1],
    )
  },
}
