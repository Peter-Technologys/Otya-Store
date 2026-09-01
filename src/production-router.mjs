import worker from './telegram-entrypoint.mjs'
export { OtyaReleaseWorkflow } from './telegram-entrypoint.mjs'

const APP_HOST = 'petersmartlink.com'
const DOCS_HOST = 'docs.petersmartlink.com'
const STATUS_HOST = 'status.petersmartlink.com'
const SPACE_HOST = 'space.petersmartlink.com'

function publicSurfaceRedirect(url, pathname) {
  const target = new URL(url)
  target.protocol = 'https:'
  target.hostname = APP_HOST
  target.pathname = pathname
  target.search = ''
  target.hash = ''
  return Response.redirect(target.toString(), 302)
}

export default {
  ...worker,
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const host = url.hostname.toLowerCase()

    if (url.pathname === '/api/version' || url.pathname === '/api/version/') {
      url.pathname = '/latest'
      const headers = new Headers(request.headers)
      headers.set('X-OTYA-Version-Alias', 'api-version')
      return worker.fetch(new Request(url, { method: request.method, headers }), env, ctx)
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      if (host === DOCS_HOST) return publicSurfaceRedirect(url, '/help')
      if (host === STATUS_HOST) return publicSurfaceRedirect(url, '/status')
      if (host === SPACE_HOST) {
        // Telegram Mini App must remain on the exact space.petersmartlink.com
        // origin configured in BotFather. Everything else keeps the temporary
        // Space -> canonical account redirect until Space is fully native.
        if (url.pathname === '/telegram' || url.pathname === '/telegram/') {
          const target = new URL(url)
          target.hostname = APP_HOST
          target.protocol = 'https:'
          return worker.fetch(new Request(target, request), env, ctx)
        }
        return publicSurfaceRedirect(url, '/sign-in')
      }
    }

    return worker.fetch(request, env, ctx)
  },
}
