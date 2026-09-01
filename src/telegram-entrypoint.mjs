import worker from './entrypoint.mjs'
import { handleTelegramAdmin, handleTelegramWebhook } from './lib/telegram-bot.mjs'
export { OtyaReleaseWorkflow } from './entrypoint.mjs'

const ACCESS_COOKIE = '__Host-otya_access'
const ADMIN_COOKIE = 'otya_admin_session'
const APP_ORIGIN = 'https://petersmartlink.com'

function json(data, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } })
}
function cookieValue(request, name) {
  const cookie = request.headers.get('cookie') || ''
  return cookie.split(';').map(value => value.trim()).find(value => value.startsWith(`${name}=`))?.slice(name.length + 1) || ''
}
function equal(a, b) {
  if (a.length !== b.length) return false
  let diff = 0
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i)
  return diff === 0
}
function decodeB64url(value) {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  return Uint8Array.from(atob(base64), c => c.charCodeAt(0))
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const mac = new Uint8Array(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(value)))
  let binary = ''
  for (const byte of mac) binary += String.fromCharCode(byte)
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '')
}
async function adminUser(request, env) {
  const token = cookieValue(request, ACCESS_COOKIE)
  if (!token || !env.AUTH?.fetch) return null
  const response = await env.AUTH.fetch(new Request('https://auth/auth/verify', { headers: { Authorization: `Bearer ${token}` } }))
  const data = await response.json().catch(() => ({}))
  if (!response.ok || data?.ok !== true || !data?.email) return null
  const email = String(data.email).toLowerCase()
  const admins = new Set(String(env.ADMIN_EMAILS || env.ADMIN_REPORT_EMAIL || '').split(',').map(x => x.trim().toLowerCase()).filter(Boolean))
  return admins.has(email) ? { email, id: String(data.user_id || '') } : null
}
async function elevated(request, env) {
  const secret = String(env.ADMIN_SESSION_SECRET || '').trim()
  const raw = cookieValue(request, ADMIN_COOKIE)
  if (!secret || !raw) return false
  const [encoded, signature] = raw.split('.')
  if (!encoded || !signature || !equal(signature, await sign(encoded, secret))) return false
  try {
    const payload = JSON.parse(new TextDecoder().decode(decodeB64url(encoded)))
    return payload?.mfa === true && Number(payload?.exp || 0) > Math.floor(Date.now() / 1000)
  } catch { return false }
}
async function authorizeAdmin(request, env) {
  const origin = request.headers.get('Origin')
  if (request.method !== 'GET' && origin && origin !== APP_ORIGIN) return json({ error: 'Invalid origin' }, 403)
  const user = await adminUser(request, env)
  if (!user) return json({ error: 'Administrator access required' }, 403)
  if (!await elevated(request, env)) return json({ error: 'Elevated administrator verification required' }, 403)
  if (request.method !== 'GET' && request.headers.get('X-OTYA-Admin-Action') !== 'telegram') return json({ error: 'Admin action confirmation required' }, 403)
  return null
}

export default {
  ...worker,
  async fetch(request, env, ctx) {
    const url = new URL(request.url)
    if (url.pathname === '/api/telegram/webhook') return handleTelegramWebhook(request, env, ctx)
    if (url.pathname === '/api/admin/telegram/test' || url.pathname === '/api/admin/telegram/webhook') {
      const denied = await authorizeAdmin(request, env)
      if (denied) return denied
      const action = url.pathname.endsWith('/test') ? 'test' : 'webhook'
      try { return await handleTelegramAdmin(request, env, action) }
      catch (error) {
        console.error('[telegram-admin]', error instanceof Error ? error.message : 'unknown error')
        return json({ error: 'Telegram admin action failed', code: 'TELEGRAM_ADMIN_FAILED' }, 502)
      }
    }
    return worker.fetch(request, env, ctx)
  },
}
