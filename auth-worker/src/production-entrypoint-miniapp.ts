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

    // Browser Telegram Sign-In is OIDC + PKCE only. The centralized bot token
    // is exposed to this Worker only through TELEGRAM_MINIAPP_BOT_TOKEN and is
    // mapped into the verifier above; it never enters the legacy widget path.
    if (url.pathname.startsWith('/auth/telegram/')) {
      const oidcEnv = { ...env, TELEGRAM_BOT_TOKEN: undefined }
      return worker.fetch(request, oidcEnv as Parameters<typeof worker.fetch>[1])
    }

    return worker.fetch(request, env)
  },
}
