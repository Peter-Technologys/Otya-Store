import worker from './entrypoint.mjs'
export { OtyaReleaseWorkflow } from './entrypoint.mjs'

const APP_HOST = 'petersmartlink.com'
const DOCS_HOST = 'docs.petersmartlink.com'
const STATUS_HOST = 'status.petersmartlink.com'
const SPACE_HOST = 'space.petersmartlink.com'

function routedRequest(request, url, pathname, marker) {
  // OpenNext routes are compiled for the canonical application origin. Keep the
  // browser on the custom hostname, but resolve the internal route through the
  // apex host so /help, /status and /sign-in are matched by the generated app.
  url.hostname = APP_HOST
  url.pathname = pathname
  const headers = new Headers(request.headers)
  headers.set('X-OTYA-Surface', marker)
  return new Request(url, { method: request.method, headers })
}

/**
 * Outer production router for compatibility aliases and custom-domain roots.
 *
 * Host routing is intentionally narrow: only user-facing document routes are
 * rewritten. Framework assets, APIs, images and metadata keep their original
 * paths so OpenNext can serve them normally on every custom hostname.
 */
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
      if (host === DOCS_HOST) {
        if (url.pathname === '/' || url.pathname === '') {
          return worker.fetch(routedRequest(request, url, '/help', 'docs'), env, ctx)
        }
        if (
          !url.pathname.startsWith('/_next/') &&
          !url.pathname.startsWith('/api/') &&
          !url.pathname.startsWith('/docs/') &&
          url.pathname !== '/favicon.ico' &&
          url.pathname !== '/robots.txt' &&
          url.pathname !== '/sitemap.xml'
        ) {
          return worker.fetch(
            routedRequest(request, url, `/docs${url.pathname}`, 'docs'),
            env,
            ctx,
          )
        }
      }

      if (host === STATUS_HOST && (url.pathname === '/' || url.pathname === '')) {
        return worker.fetch(routedRequest(request, url, '/status', 'status'), env, ctx)
      }

      if (host === SPACE_HOST && (url.pathname === '/' || url.pathname === '')) {
        return worker.fetch(routedRequest(request, url, '/sign-in', 'space'), env, ctx)
      }
    }

    return worker.fetch(request, env, ctx)
  },
}
