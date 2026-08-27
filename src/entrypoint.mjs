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

function createResendEmailAdapter(env) {
  return {
    async send(message) {
      if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured')
      const from = message?.from?.name
        ? `${message.from.name} <${message.from.email}>`
        : message?.from?.email
      const to = Array.isArray(message?.to)
        ? message.to.map((recipient) => recipient.email).filter(Boolean)
        : []
      if (!from || to.length === 0) throw new Error('Invalid email envelope')

      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to,
          subject: message.subject,
          text: message.text,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.id) {
        throw new Error(`Resend email failed: ${data.message ?? data.name ?? `HTTP ${response.status}`}`)
      }
    },
  }
}

function withProductionAdapters(env) {
  return {
    ...env,
    EMAIL: createResendEmailAdapter(env),
  }
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
    const runtimeEnv = withProductionAdapters(env)
    const startedAt = Date.now()
    const url = new URL(request.url)
    let response

    if (url.pathname === '/api/admin/release-workflow' && request.method === 'POST') {
      if (!isAdmin(request, runtimeEnv)) {
        response = json({ error: 'Unauthorized' }, 401)
      } else if (!runtimeEnv.OTYA_RELEASE_WORKFLOW?.create) {
        response = json({ error: 'Release workflow binding unavailable' }, 503)
      } else {
        try {
          const params = await request.json()
          const instance = await runtimeEnv.OTYA_RELEASE_WORKFLOW.create({ params })
          response = json({ ok: true, instanceId: instance.id, status: 'queued' }, 202)
        } catch (error) {
          response = json({
            error: 'Could not start release workflow',
            detail: error instanceof Error ? error.message : 'Invalid request',
          }, 400)
        }
      }
      writeRequestAnalytics(runtimeEnv, request, response, startedAt)
      return response
    }

    if (url.pathname === '/api/admin/release-workflow/status' && request.method === 'GET') {
      if (!isAdmin(request, runtimeEnv)) {
        response = json({ error: 'Unauthorized' }, 401)
      } else if (!runtimeEnv.OTYA_RELEASE_WORKFLOW?.get) {
        response = json({ error: 'Release workflow binding unavailable' }, 503)
      } else {
        const id = url.searchParams.get('id')
        if (!id) {
          response = json({ error: 'id is required' }, 400)
        } else {
          try {
            const instance = await runtimeEnv.OTYA_RELEASE_WORKFLOW.get(id)
            response = json({ ok: true, instanceId: id, workflow: await instance.status() })
          } catch {
            response = json({ error: 'Workflow instance not found' }, 404)
          }
        }
      }
      writeRequestAnalytics(runtimeEnv, request, response, startedAt)
      return response
    }

    if (url.pathname === '/auth' || url.pathname.startsWith('/auth/')) {
      if (!runtimeEnv.AUTH?.fetch) {
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
        response = await runtimeEnv.AUTH.fetch(request)
      }
      writeRequestAnalytics(runtimeEnv, request, response, startedAt)
      return response
    }

    response = await worker.fetch(request, runtimeEnv, ctx)
    writeRequestAnalytics(runtimeEnv, request, response, startedAt)
    return response
  },

  async queue(batch, env, ctx) {
    return worker.queue(batch, withProductionAdapters(env), ctx)
  },

  async scheduled(event, env, ctx) {
    return worker.scheduled(event, withProductionAdapters(env), ctx)
  },
}
