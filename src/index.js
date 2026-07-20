/**
 * OTYA Player — Cloudflare Worker
 *
 * Bindings used:
 *   R2           — APK file storage (otya-player-releases)
 *   KV           — version info cache & session store
 *   DB           — D1 download analytics & version history
 *   RATE_LIMITER — per-IP rate limiting on download endpoints
 *   EMAIL        — error alerts & download notifications
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const KV_VERSION_KEY  = 'version:current'
const KV_VERSION_TTL  = 300  // 5 min cache

// ── ABI detection ─────────────────────────────────────────────────────────────

function detectAbi(request) {
  const url   = new URL(request.url)
  const param = url.searchParams.get('abi')
  if (param === 'arm64') return 'arm64'
  if (param === 'arm32') return 'arm32'

  const arch = request.headers.get('Sec-CH-UA-Arch') || ''
  if (arch.includes('arm64') || arch.includes('aarch64')) return 'arm64'
  if (arch.includes('arm')) return 'arm32'

  const ua = (request.headers.get('User-Agent') || '').toLowerCase()
  if (ua.includes('arm64') || ua.includes('aarch64') || ua.includes('armv8')) return 'arm64'
  if (ua.includes('armv7') || ua.includes('armeabi')) return 'arm32'

  return 'arm64'
}

// ── Version info (KV-cached, R2-sourced) ─────────────────────────────────────

async function getVersionInfo(env) {
  // 1. Try KV cache first
  try {
    const cached = await env.KV.get(KV_VERSION_KEY, 'json')
    if (cached) return cached
  } catch (_) {}

  // 2. Fall back to R2
  try {
    const obj = await env.R2.get('version.json')
    if (!obj) return null
    const info = await obj.json()
    // Store in KV cache
    await env.KV.put(KV_VERSION_KEY, JSON.stringify(info), { expirationTtl: KV_VERSION_TTL })
    return info
  } catch (_) {
    return null
  }
}

function buildApkKey(info, abi) {
  if (!info?.tag) return null
  const filename = abi === 'arm64'
    ? (info.arm64 || `otya-player-${info.tag}-arm64.apk`)
    : (info.arm32 || `otya-player-${info.tag}-arm32.apk`)
  return `releases/${info.tag}/${filename}`
}

// ── APK streaming from R2 ─────────────────────────────────────────────────────

async function serveApk(env, key) {
  const obj = await env.R2.get(key)
  if (!obj) {
    return new Response(`APK not found: ${key}`, { status: 404 })
  }
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('etag', obj.httpEtag)
  headers.set('Content-Type', 'application/vnd.android.package-archive')
  headers.set('Content-Disposition', `attachment; filename="${key.split('/').pop()}"`)
  headers.set('Cache-Control', 'public, max-age=300')
  return new Response(obj.body, { headers })
}

// ── D1 analytics ──────────────────────────────────────────────────────────────

async function initDb(env) {
  // Create tables if they don't exist (runs fast after first call)
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS downloads (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      abi        TEXT    NOT NULL,
      version    TEXT,
      ip         TEXT,
      user_agent TEXT,
      created_at TEXT    DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS version_history (
      tag        TEXT PRIMARY KEY,
      version    TEXT,
      released_at TEXT DEFAULT (datetime('now'))
    );
  `)
}

async function trackDownload(env, request, abi, version) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
    const ua = (request.headers.get('User-Agent') || '').substring(0, 200)
    await env.DB.prepare(
      `INSERT INTO downloads (abi, version, ip, user_agent) VALUES (?, ?, ?, ?)`
    ).bind(abi, version || 'unknown', ip, ua).run()
  } catch (_) {
    // Non-critical — don't fail the request if analytics errors
  }
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

async function checkRateLimit(env, request) {
  try {
    const { success } = await env.RATE_LIMITER.limit({ key: request.headers.get('CF-Connecting-IP') || 'unknown' })
    return success
  } catch (_) {
    return true // Fail open if rate limiter errors
  }
}

// ── Email alerts ──────────────────────────────────────────────────────────────

async function sendErrorAlert(env, subject, body) {
  try {
    const { EmailMessage } = await import('cloudflare:email')
    const msg = new EmailMessage(
      'worker@petersmartlink.com',
      'petersmartlink@gmail.com',
      {
        subject,
        text: body,
        headers: { 'Content-Type': 'text/plain' },
      }
    )
    await env.EMAIL.send(msg)
  } catch (_) {
    // Email is best-effort
  }
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env) {
    const url  = new URL(request.url)
    const path = url.pathname.replace(/\/+$/, '') || '/'

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }
    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    // Init D1 tables (no-op after first run)
    try { await initDb(env) } catch (_) {}

    // Root and all non-API paths → pass through to Next.js (ASSETS binding)
    // The Worker only owns its specific API routes listed below.
    const apiRoutes = ['/version', '/latest', '/stats', '/download', '/apk/arm64', '/apk/arm32']
    if (!apiRoutes.includes(path)) {
      return env.ASSETS.fetch(request)
    }

    // ── /version ─────────────────────────────────────────────────────────────
    if (path === '/version') {
      const info = await getVersionInfo(env)
      if (!info) {
        return new Response(
          JSON.stringify({ error: 'version info not available yet' }),
          { status: 503, headers: { 'Content-Type': 'application/json', ...CORS } }
        )
      }
      return new Response(JSON.stringify(info), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...CORS }
      })
    }

    // ── /latest ───────────────────────────────────────────────────────────────
    if (path === '/latest') {
      const info = await getVersionInfo(env)
      const payload = {
        version:     info?.version     ?? 'unknown',
        versionCode: info?.versionCode ?? null,
        tag:         info?.tag         ?? null,
        date:        info?.date        ?? null,
        changelog:   info?.changelog   ?? null,
        downloads: {
          auto:  `https://${url.hostname}/download`,
          arm64: `https://${url.hostname}/apk/arm64`,
          arm32: `https://${url.hostname}/apk/arm32`,
        },
      }
      return new Response(JSON.stringify(payload), {
        headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300', ...CORS }
      })
    }

    // ── /stats — download analytics from D1 ──────────────────────────────────
    if (path === '/stats') {
      try {
        const [total, byAbi, byVersion] = await Promise.all([
          env.DB.prepare('SELECT COUNT(*) as count FROM downloads').first(),
          env.DB.prepare('SELECT abi, COUNT(*) as count FROM downloads GROUP BY abi').all(),
          env.DB.prepare('SELECT version, COUNT(*) as count FROM downloads GROUP BY version ORDER BY count DESC LIMIT 10').all(),
        ])
        return new Response(JSON.stringify({
          total:     total?.count ?? 0,
          by_abi:    byAbi.results,
          by_version: byVersion.results,
        }), {
          headers: { 'Content-Type': 'application/json', ...CORS }
        })
      } catch (e) {
        return new Response(JSON.stringify({ error: 'Stats unavailable' }), {
          status: 500, headers: { 'Content-Type': 'application/json', ...CORS }
        })
      }
    }

    // ── /download & /apk/* — rate-limited APK serving ─────────────────────────
    if (path === '/download' || path === '/apk/arm64' || path === '/apk/arm32') {
      // Rate limiting
      const allowed = await checkRateLimit(env, request)
      if (!allowed) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please wait before downloading again.' }),
          { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60', ...CORS } }
        )
      }

      if (path === '/download') {
        const abi = detectAbi(request)
        return Response.redirect(`https://${url.hostname}/apk/${abi}`, 302)
      }

      const abi  = path === '/apk/arm64' ? 'arm64' : 'arm32'
      const info = await getVersionInfo(env)
      if (!info) {
        await sendErrorAlert(env, 'Otya Store: version.json missing', 'A download was attempted but version.json is missing from R2.')
        return new Response(
          JSON.stringify({ error: 'version info not available' }),
          { status: 503, headers: { 'Content-Type': 'application/json', ...CORS } }
        )
      }

      const key = buildApkKey(info, abi)
      if (!key) {
        return new Response('Could not determine APK path', { status: 500 })
      }

      // Track download in D1
      await trackDownload(env, request, abi, info.version)

      return serveApk(env, key)
    }

    // Fallback — pass through to Next.js assets
    return env.ASSETS.fetch(request)
  },
}
