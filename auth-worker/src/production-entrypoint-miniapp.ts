import worker from './production-entrypoint'
import { handleTelegramMiniApp } from './telegram-miniapp'

export default {
  ...worker,
  async fetch(request: Request, env: Parameters<typeof worker.fetch>[1]): Promise<Response> {
    const url = new URL(request.url)
    if (url.pathname === '/auth/telegram/miniapp') {
      const miniEnv = {
        ...env,
        TELEGRAM_BOT_TOKEN: (env as Record<string, unknown>).TELEGRAM_MINIAPP_BOT_TOKEN,
      }
      const response = await handleTelegramMiniApp(request, miniEnv as Parameters<typeof handleTelegramMiniApp>[1])
      if (response) return response
    }

    // All browser Telegram Sign-In routes continue through the original
    // production auth Worker unchanged. The bot credential is not exposed
    // under TELEGRAM_BOT_TOKEN in Wrangler, so the legacy widget fallback
    // remains unconfigured while OIDC + PKCE keeps the real runtime bindings.
    return worker.fetch(request, env)
  },
}
