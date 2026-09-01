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

function isSpaceAppPath(pathname) {
  return pathname === '/telegram'
    || pathname === '/telegram/'
    || pathname.startsWith('/_next/')
    || pathname.startsWith('/api/')
    || pathname === '/favicon.ico'
    || pathname === '/robots.txt'
    || /\.(?:svg|png|webp|jpg|jpeg|gif|ico|css|js|woff2?)$/i.test(pathname)
}

function dispatchCanonical(request, url, env, ctx) {
  const target = new URL(url)
  target.protocol = 'https:'
  target.hostname = APP_HOST
  const headers = new Headers(request.headers)
  headers.set('X-Forwarded-Host', url.hostname)
  headers.set('X-Forwarded-Proto', 'https')
  const init = {
    method: request.method,
    headers,
    redirect: 'manual',
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body
  return worker.fetch(new Request(target.toString(), init), env, ctx)
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

    if (host === SPACE_HOST) {
      // Keep the Telegram Mini App, its Next.js assets, and its API calls on the
      // exact Space origin configured in BotFather. OpenNext still resolves the
      // compiled application against the canonical apex internally.
      if (isSpaceAppPath(url.pathname)) return dispatchCanonical(request, url, env, ctx)
      if (request.method === 'GET' || request.method === 'HEAD') return publicSurfaceRedirect(url, '/sign-in')
      return dispatchCanonical(request, url, env, ctx)
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      if (host === DOCS_HOST) return publicSurfaceRedirect(url, '/help')
      if (host === STATUS_HOST) return publicSurfaceRedirect(url, '/status')
    }

    return worker.fetch(request, env, ctx)
  },
}
