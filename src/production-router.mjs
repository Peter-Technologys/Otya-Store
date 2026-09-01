import worker from './entrypoint.mjs'
export { OtyaReleaseWorkflow } from './entrypoint.mjs'

const DOCS_HOST = 'docs.petersmartlink.com'
const STATUS_HOST = 'status.petersmartlink.com'
const SPACE_HOST = 'space.petersmartlink.com'

function routedRequest(request, url, pathname, marker) {
  url.pathname = pathname
  const headers = new Headers(request.headers)
  headers.set('X-OTYA-Surface', marker)
  return new Request(url, { method: request.method, headers })
}

/**
 * Outer production router for compatibility aliases and custom-domain roots.
 *
 * Host routing is intentionally narrow: only the root (and Docs content paths)
 * are rewritten. `/_next`, APIs, images and other asset requests keep their
 * original paths so OpenNext can serve them normally on every custom hostname.
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
