import worker from './production-entrypoint'
import { handleTelegramMiniApp } from './telegram-miniapp'
import { handleTelegramPrimaryLogin, type TelegramPrimaryLoginEnv } from './telegram-primary-login'

type AuthEnv = Parameters<typeof worker.fetch>[1] & TelegramPrimaryLoginEnv & {
  TELEGRAM_MINIAPP_BOT_TOKEN?: unknown
}

export default {
  ...worker,
  async fetch(request: Request, env: Parameters<typeof worker.fetch>[1]): Promise<Response> {
    const authEnv = env as AuthEnv
    const url = new URL(request.url)

    if (url.pathname === '/auth/telegram/miniapp') {
      const miniEnv = {
        ...env,
        TELEGRAM_BOT_TOKEN: authEnv.TELEGRAM_MINIAPP_BOT_TOKEN,
      }
      const response = await handleTelegramMiniApp(request, miniEnv as Parameters<typeof handleTelegramMiniApp>[1])
      if (response) return response
    }

    // Browser Telegram login is a first-class OTYA provider: start uses KV +
    // PKCE only; callback verifies Telegram OIDC and creates or reuses exactly
    // one D1 OTYA user before issuing the normal OTYA session.
    const primaryLogin = await handleTelegramPrimaryLogin(request, authEnv)
    if (primaryLogin) return primaryLogin

    // Link/admin/widget compatibility routes remain on the established worker.
    return worker.fetch(request, env)
  },
}
