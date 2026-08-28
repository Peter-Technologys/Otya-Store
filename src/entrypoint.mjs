import worker from './queue-worker.mjs'
export { OtyaReleaseWorkflow } from './release-workflow.mjs'

const HEALTH_CHECK_CRON = '*/5 * * * *'
const HEALTH_INCIDENT_KEY = 'monitor:health:incident:v2'
const HEALTH_PATHS = ['/', '/download/otya-player', '/api/version', '/latest']
const OTYA_NOREPLY_EMAIL = 'noreply@petersmartlink.com'

function isAdmin(request, env) {
  if (!env.ADMIN_TOKEN) return false
  const header = request.headers.get('Authorization') ?? ''
  return header.startsWith('Bearer ') && header.slice(7) === env.ADMIN_TOKEN
}

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}

function createResendEmailAdapter(env) {
  return { async send(message) {
    if (!env.RESEND_API_KEY) throw new Error('RESEND_API_KEY is not configured')
    const to = Array.isArray(message?.to) ? message.to.map((recipient) => recipient.email).filter(Boolean) : []
    if (to.length === 0) throw new Error('Invalid email envelope')
    const response = await fetch('https://api.resend.com/emails', { method: 'POST', headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ from: `OTYA Player <${OTYA_NOREPLY_EMAIL}>`, to, subject: message.subject, text: message.text }) })
    const data = await response.json().catch(() => ({}))
    if (!response.ok || !data.id) throw new Error(`Resend email failed: ${data.message ?? data.name ?? `HTTP ${response.status}`}`)
  } }
}

function withProductionAdapters(env) { return { ...env, EMAIL: createResendEmailAdapter(env) } }
function analyticsPath(pathname) {
  if (pathname.startsWith('/auth/')) return '/auth/*'
  if (pathname.startsWith('/apk/')) return '/apk/*'
  if (pathname.startsWith('/api/admin/')) return '/api/admin/*'
  if (pathname.startsWith('/api/telegram/')) return '/api/telegram/*'
  if (pathname.startsWith('/api/')) return '/api/*'
  return pathname === '/' ? '/' : '/other'
}
function writeRequestAnalytics(env, request, response, startedAt) {
  if (!env.OTYA_ANALYTICS?.writeDataPoint) return
  try { const url = new URL(request.url); env.OTYA_ANALYTICS.writeDataPoint({ blobs: ['request', request.method, analyticsPath(url.pathname), request.cf?.colo ?? 'unknown'], doubles: [response.status, Date.now() - startedAt], indexes: [analyticsPath(url.pathname)] }) } catch {}
}
async function readHealthIncident(env) { try { return await env.KV?.get?.(HEALTH_INCIDENT_KEY) ?? null } catch { return null } }
async function writeHealthIncident(env, value) { try { await env.KV?.put?.(HEALTH_INCIDENT_KEY, value, { expirationTtl: 86400 }) } catch {} }
async function clearHealthIncident(env) { try { await env.KV?.delete?.(HEALTH_INCIDENT_KEY) } catch {} }
async function sendHealthEmail(env, subject, text) {
  try { await env.EMAIL.send({ from: { email: OTYA_NOREPLY_EMAIL, name: 'OTYA Backend' }, to: [{ email: env.ADMIN_REPORT_EMAIL || 'petersmartlink@gmail.com' }], subject, text }) }
  catch (error) { console.error('[health] Could not send Resend health notification:', error?.message ?? error) }
}
async function runProductionHealthCheck(env, ctx) {
  const baseUrl = env.WEBSITE_URL || 'https://petersmartlink.com'; const results = []
  for (const path of HEALTH_PATHS) { const startedAt = Date.now(); try { const request = new Request(new URL(path, baseUrl), { method: 'GET', headers: { 'User-Agent': 'OTYA-Internal-HealthCheck/2.0' } }); const response = await worker.fetch(request, env, ctx); const ok = response.status >= 200 && response.status < 400; results.push({ path, status: response.status, latency: Date.now() - startedAt, ok }); try { await response.body?.cancel?.() } catch {} } catch (error) { results.push({ path, status: 0, latency: Date.now() - startedAt, ok: false, error: error?.message ?? 'request failed' }) } }
  const down = results.filter((result) => !result.ok); const previousIncident = await readHealthIncident(env)
  if (down.length === 0) { console.log('[health] Production route check: all routes OK'); if (previousIncident) { await clearHealthIncident(env); await sendHealthEmail(env, '[OTYA Backend] Production routes recovered', ['OTYA production route health has recovered.', '', ...results.map((r) => `${r.path} — ${r.status} (${r.latency}ms)`), '', `Checked at: ${new Date().toISOString()}`].join('\n')) } return }
  const signature = JSON.stringify(down.map(({ path, status }) => [path, status])); console.warn('[health] Production routes unhealthy:', down); if (signature === previousIncident) return; await writeHealthIncident(env, signature); await sendHealthEmail(env, `[OTYA Backend] ${down.length} production route(s) unhealthy`, ['OTYA production route health alert', '', ...down.map((r) => `${r.path} — status ${r.status}, latency ${r.latency}ms${r.error ? ` (${r.error})` : ''}`), '', `Checked at: ${new Date().toISOString()}`].join('\n'))
}

export default {
  ...worker,
  async fetch(request, env, ctx) {
    const runtimeEnv = withProductionAdapters(env); const startedAt = Date.now(); const url = new URL(request.url); let response
    if (url.pathname.startsWith('/api/admin/ai/')) {
      if (!isAdmin(request, runtimeEnv)) response = json({ error: 'Unauthorized' }, 401)
      else if (!runtimeEnv.AI_SUPPORT?.fetch) response = json({ error: 'AI support service unavailable' }, 503)
      else if (!runtimeEnv.INTERNAL_SECRET) response = json({ error: 'AI admin channel is not configured' }, 503)
      else {
        const headers = new Headers(request.headers)
        headers.set('X-OTYA-Internal-Secret', runtimeEnv.INTERNAL_SECRET)
        const forwarded = new Request(request, { headers })
        response = await runtimeEnv.AI_SUPPORT.fetch(forwarded)
      }
      writeRequestAnalytics(runtimeEnv, request, response, startedAt); return response
    }
    if (url.pathname.startsWith('/api/telegram/')) {
      if (!runtimeEnv.AI_SUPPORT?.fetch) response = json({ error: 'AI support service unavailable' }, 503)
      else response = await runtimeEnv.AI_SUPPORT.fetch(request)
      writeRequestAnalytics(runtimeEnv, request, response, startedAt); return response
    }
    if (url.pathname === '/api/admin/release-workflow' && request.method === 'POST') {
      if (!isAdmin(request, runtimeEnv)) response = json({ error: 'Unauthorized' }, 401)
      else if (!runtimeEnv.OTYA_RELEASE_WORKFLOW?.create) response = json({ error: 'Release workflow binding unavailable' }, 503)
      else { try { const params = await request.json(); const instance = await runtimeEnv.OTYA_RELEASE_WORKFLOW.create({ params }); response = json({ ok: true, instanceId: instance.id, status: 'queued' }, 202) } catch (error) { response = json({ error: 'Could not start release workflow', detail: error instanceof Error ? error.message : 'Invalid request' }, 400) } }
      writeRequestAnalytics(runtimeEnv, request, response, startedAt); return response
    }
    if (url.pathname === '/api/admin/release-workflow/status' && request.method === 'GET') {
      if (!isAdmin(request, runtimeEnv)) response = json({ error: 'Unauthorized' }, 401)
      else if (!runtimeEnv.OTYA_RELEASE_WORKFLOW?.get) response = json({ error: 'Release workflow binding unavailable' }, 503)
      else { const id = url.searchParams.get('id'); if (!id) response = json({ error: 'id is required' }, 400); else { try { const instance = await runtimeEnv.OTYA_RELEASE_WORKFLOW.get(id); response = json({ ok: true, instanceId: id, workflow: await instance.status() }) } catch { response = json({ error: 'Workflow instance not found' }, 404) } } }
      writeRequestAnalytics(runtimeEnv, request, response, startedAt); return response
    }
    if (url.pathname === '/auth' || url.pathname.startsWith('/auth/')) {
      if (!runtimeEnv.AUTH?.fetch) response = json({ error: 'Authentication service unavailable' }, 503)
      else response = await runtimeEnv.AUTH.fetch(request)
      writeRequestAnalytics(runtimeEnv, request, response, startedAt); return response
    }
    response = await worker.fetch(request, runtimeEnv, ctx); writeRequestAnalytics(runtimeEnv, request, response, startedAt); return response
  },
  async queue(batch, env, ctx) { return worker.queue(batch, withProductionAdapters(env), ctx) },
  async scheduled(event, env, ctx) { const runtimeEnv = withProductionAdapters(env); if (event.cron === HEALTH_CHECK_CRON) return runProductionHealthCheck(runtimeEnv, ctx); return worker.scheduled(event, runtimeEnv, ctx) },
}
