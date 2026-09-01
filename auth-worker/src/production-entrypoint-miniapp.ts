import worker from './production-entrypoint'
import { handleTelegramMiniApp } from './telegram-miniapp'

export default {
  ...worker,
  async fetch(request: Request, env: Parameters<typeof worker.fetch>[1]): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/auth/telegram/miniapp') {
      const response = await handleTelegramMiniApp(request, env as Parameters<typeof handleTelegramMiniApp>[1])
      if (response) return response
    }

    // The centralized bot token belongs to Bot API/webhook + Mini App HMAC.
    // Browser Telegram Sign-In remains OIDC + PKCE only. Do not let the legacy
    // Login Widget fallback interpret a Secrets Store binding object as a raw
    // token or create a second credential-distribution path.
    if (url.pathname.startsWith('/auth/telegram/')) {
      const oidcEnv = { ...env, TELEGRAM_BOT_TOKEN: undefined }
      return worker.fetch(request, oidcEnv as Parameters<typeof worker.fetch>[1])
    }

    return worker.fetch(request, env)
  },
}
