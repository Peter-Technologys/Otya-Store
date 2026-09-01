import worker from './entrypoint.mjs'
export { OtyaReleaseWorkflow } from './entrypoint.mjs'

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
  // Temporary during v1 so the dedicated host can later become a fully native
  // surface without browsers caching a permanent redirect.
  return Response.redirect(target.toString(), 302)
}

/**
 * Outer production router for compatibility aliases and public custom domains.
 *
 * The OpenNext build is canonicalized to petersmartlink.com. Cloudflare custom
 * domains still provide memorable entry points, but their roots redirect to a
 * real compiled page instead of attempting an internal host rewrite that can
 * fall through to OpenNext's 404 route.
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
        return publicSurfaceRedirect(url, '/help')
      }
      if (host === STATUS_HOST) {
        return publicSurfaceRedirect(url, '/status')
      }
      if (host === SPACE_HOST) {
        return publicSurfaceRedirect(url, '/sign-in')
      }
    }

    return worker.fetch(request, env, ctx)
  },
}
