import openNextWorker from '../.open-next/worker.js'
import backendWorker from './telegram-entrypoint.mjs'
export { OtyaReleaseWorkflow } from './telegram-entrypoint.mjs'

const APP_HOST = 'petersmartlink.com'
const DOCS_HOST = 'docs.petersmartlink.com'
const STATUS_HOST = 'status.petersmartlink.com'
const SPACE_HOST = 'space.petersmartlink.com'

const CANONICAL_CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' https://accounts.google.com https://telegram.org https://challenges.cloudflare.com https://pagead2.googlesyndication.com https://partner.googleadservices.com https://tpc.googlesyndication.com",
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://challenges.cloudflare.com",
  "font-src 'self' https://fonts.gstatic.com",
  "img-src 'self' data: blob: https: https://pagead2.googlesyndication.com",
  "connect-src 'self' https://petersmartlink.com https://accounts.google.com https://telegram.org https://oauth.telegram.org https://challenges.cloudflare.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net https://www.google-analytics.com",
  "frame-src https://accounts.google.com https://oauth.telegram.org https://challenges.cloudflare.com https://googleads.g.doubleclick.net https://tpc.googlesyndication.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ')

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

function isCoreTelegramRoute(pathname) {
  return pathname === '/api/telegram/webhook'
    || pathname === '/api/admin/telegram/test'
    || pathname === '/api/admin/telegram/webhook'
    || pathname.startsWith('/api/telegram/')
}

function applyCanonicalBrowserPolicy(response) {
  const contentType = response.headers.get('content-type') || ''
  if (!contentType.toLowerCase().includes('text/html')) return response
  const headers = new Headers(response.headers)
  headers.set('Content-Security-Policy', CANONICAL_CSP)
  headers.set('Cross-Origin-Opener-Policy', 'same-origin-allow-popups')
  headers.set('X-Content-Type-Options', 'nosniff')
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}

async function dispatchOpenNext(request, env, ctx) {
  return applyCanonicalBrowserPolicy(await openNextWorker.fetch(request, env, ctx))
}

async function dispatchCanonical(request, url, env, ctx) {
  const target = new URL(url)
  target.protocol = 'https:'
  target.hostname = APP_HOST
  const headers = new Headers(request.headers)
  headers.set('X-Forwarded-Host', url.hostname)
  headers.set('X-Forwarded-Proto', 'https')
  const init = { method: request.method, headers, redirect: 'manual' }
  if (request.method !== 'GET' && request.method !== 'HEAD') init.body = request.body
  return dispatchOpenNext(new Request(target.toString(), init), env, ctx)
}

export default {
  ...backendWorker,
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    const host = url.hostname.toLowerCase()

    // Telegram Bot API/webhook/admin Telegram routes are intentionally owned by
    // otya-core and are not Next.js application routes.
    if (isCoreTelegramRoute(url.pathname)) return backendWorker.fetch(request, env, ctx)

    if (url.pathname === '/api/version' || url.pathname === '/api/version/') {
      url.pathname = '/latest'
      const headers = new Headers(request.headers)
      headers.set('X-OTYA-Version-Alias', 'api-version')
      return dispatchOpenNext(new Request(url, { method: request.method, headers }), env, ctx)
    }

    if (host === SPACE_HOST) {
      if (isSpaceAppPath(url.pathname)) return dispatchCanonical(request, url, env, ctx)
      if (request.method === 'GET' || request.method === 'HEAD') return publicSurfaceRedirect(url, '/sign-in')
      return dispatchCanonical(request, url, env, ctx)
    }

    if (request.method === 'GET' || request.method === 'HEAD') {
      if (host === DOCS_HOST) return publicSurfaceRedirect(url, '/help')
      if (host === STATUS_HOST) return publicSurfaceRedirect(url, '/status')
    }

    return dispatchOpenNext(request, env, ctx)
  },
}
