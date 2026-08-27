import worker from './queue-worker.mjs'
export { OtyaReleaseWorkflow } from './release-workflow.mjs'

function isAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return false
  const header = request.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') && header.slice(7) === env.ADMIN_TOKEN
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

function analyticsPath(pathname) {
  if (pathname.startsWith('/auth/')) return '/auth/*'
  if (pathname.startsWith('/apk/')) return '/apk/*'
  if (pathname.startsWith('/api/admin/')) return '/api/admin/*'
  if (pathname.startsWith('/api/')) return '/api/*'
  return pathname === '/' ? '/' : '/other'
}

function writeRequestAnalytics(env, request, response, startedAt) {
  if (!env.OTYA_ANALYTICS?.writeDataPoint) return
  try {
    const url = new URL(request.url)
    env.OTYA_ANALYTICS.writeDataPoint({
      blobs: [
        'request',
        request.method,
        analyticsPath(url.pathname),
        request.cf?.colo ?? 'unknown',
      ],
      doubles: [response.status, Date.now() - startedAt],
      indexes: [analyticsPath(url.pathname)],
    })
  } catch {
    // Analytics is best-effort and must never affect user requests.
  }
}

export default {
  ...worker,

  async fetch(request, env, ctx) {
    const startedAt = Date.now()
    const url = new URL(request.url)
    let response

    if (url.pathname === '/api/admin/release-workflow' && request.method === 'POST') {
      if (!isAdmin(request, env)) {
        response = json({ error: 'Unauthorized' }, 401)
      } else if (!env.OTYA_RELEASE_WORKFLOW?.create) {
        response = json({ error: 'Release workflow binding unavailable' }, 503)
      } else {
        try {
          const params = await request.json()
          const instance = await env.OTYA_RELEASE_WORKFLOW.create({ params })
          response = json({ ok: true, instanceId: instance.id, status: 'queued' }, 202)
        } catch (error) {
          response = json({
            error: 'Could not start release workflow',
            detail: error instanceof Error ? error.message : 'Invalid request',
          }, 400)
        }
      }
      writeRequestAnalytics(env, request, response, startedAt)
      return response
    }

    if (url.pathname === '/api/admin/release-workflow/status' && request.method === 'GET') {
      if (!isAdmin(request, env)) {
        response = json({ error: 'Unauthorized' }, 401)
      } else if (!env.OTYA_RELEASE_WORKFLOW?.get) {
        response = json({ error: 'Release workflow binding unavailable' }, 503)
      } else {
        const id = url.searchParams.get('id')
        if (!id) {
          response = json({ error: 'id is required' }, 400)
        } else {
          try {
            const instance = await env.OTYA_RELEASE_WORKFLOW.get(id)
            response = json({ ok: true, instanceId: id, workflow: await instance.status() })
          } catch {
            response = json({ error: 'Workflow instance not found' }, 404)
          }
        }
      }
      writeRequestAnalytics(env, request, response, startedAt)
      return response
    }

    if (url.pathname === '/auth' || url.pathname.startsWith('/auth/')) {
      if (!env.AUTH?.fetch) {
        response = new Response(
          JSON.stringify({ error: 'Authentication service unavailable' }),
          {
            status: 503,
            headers: {
              'Content-Type': 'application/json; charset=utf-8',
              'Cache-Control': 'no-store',
            },
          },
        )
      } else {
        response = await env.AUTH.fetch(request)
      }
      writeRequestAnalytics(env, request, response, startedAt)
      return response
    }

    response = await worker.fetch(request, env, ctx)
    writeRequestAnalytics(env, request, response, startedAt)
    return response
  },
}
