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
    return worker.fetch(request, env)
  },
}
