import worker from './queue-worker.mjs'

export default {
  ...worker,

  async fetch(request, env, ctx) {
    const url = new URL(request.url)

    if (url.pathname === '/auth' || url.pathname.startsWith('/auth/')) {
      if (!env.AUTH?.fetch) {
        return new Response(
          JSON.stringify({ error: 'Authentication service unavailable' }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'no-store',
            },
          },
        )
      }
      return env.AUTH.fetch(request)
    }

    return worker.fetch(request, env, ctx)
  },
}
