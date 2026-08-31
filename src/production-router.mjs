import worker from './entrypoint.mjs'
export { OtyaReleaseWorkflow } from './entrypoint.mjs'

/**
 * Small outer production router.
 *
 * `/api/version` is kept for older Android builds, but OpenNext has twice
 * compiled that route into a broken runtime path while `/latest` remained the
 * canonical working implementation. Resolve the alias before the request ever
 * reaches the generated Next.js route table so both URLs use the same code.
 */
export default {
  ...worker,
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (url.pathname === '/api/version' || url.pathname === '/api/version/') {
      url.pathname = '/latest'
      const headers = new Headers(request.headers)
      headers.set('X-OTYA-Version-Alias', 'api-version')
      return worker.fetch(new Request(url, { method: request.method, headers }), env, ctx)
    }
    return worker.fetch(request, env, ctx)
  },
}
