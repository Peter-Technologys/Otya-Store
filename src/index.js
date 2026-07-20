/**
 * OTYA Player — Cloudflare Worker
 *
 * Bindings (wrangler.toml):
 *   R2           — APK file storage  (otya-player-releases)
 *   KV           — version info cache
 *   DB           — D1 download analytics
 *   RATE_LIMITER — per-IP rate limiting on download endpoints
 *   EMAIL        — error alert emails
 *   ASSETS       — OpenNext / Next.js static assets
 *
 * R2 layout (written by scripts/publish_r2.sh):
 *   version.json                    ← { version, versionCode, date, arm64, arm32, changelog, ... }
 *   OtyaPlayer-arm64.apk             ← current arm64 APK (flat root)
 *   OtyaPlayer-arm32.apk             ← current arm32 APK (flat root)
 *   releases/v1.x.x/...            ← archived previous versions
 */

// ── Constants ─────────────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

const KV_VERSION_KEY = 'version:current'
const KV_VERSION_TTL = 600          // 10 min — version only changes on release
const APK_CACHE_TTL  = 86400        // 1 day  — APKs are immutable per version

// Worker-isolate-level flag: initDb() runs once per cold start, not per request
let dbInitialised = false

// ── ABI detection ─────────────────────────────────────────────────────────────

function detectAbi(request) {
  const url   = new URL(request.url)
  const param = url.searchParams.get('abi')
  if (param === 'arm64') return 'arm64'
  if (param === 'arm32') return 'arm32'

  // Client Hints (Android Chrome 90+)
  const arch = (request.headers.get('Sec-CH-UA-Arch') || '').toLowerCase()
  if (arch.includes('arm64') || arch.includes('aarch64')) return 'arm64'
  if (arch.includes('arm'))                                return 'arm32'

  // User-Agent fallback
  const ua = (request.headers.get('User-Agent') || '').toLowerCase()
  if (ua.includes('arm64') || ua.includes('aarch64') || ua.includes('armv8')) return 'arm64'
  if (ua.includes('armv7') || ua.includes('armeabi'))                          return 'arm32'

  return 'arm64'  // safe default — most phones since 2015 are arm64
}

// ── Version info (KV-cached, R2-sourced) ─────────────────────────────────────

async function getVersionInfo(env) {
  // 1. KV cache (fast path)
  try {
    const cached = await env.KV.get(KV_VERSION_KEY, 'json')
    if (cached) return cached
  } catch (e) {
    console.error('[KV] cache read failed:', e?.message)
  }

  // 2. R2 source of truth
  try {
    const obj = await env.R2.get('version.json')
    if (!obj) return null
    const info = await obj.json()
    // Backfill KV — fire-and-forget, don't block the response
    env.KV.put(KV_VERSION_KEY, JSON.stringify(info), { expirationTtl: KV_VERSION_TTL })
      .catch(e => console.error('[KV] cache write failed:', e?.message))
    return info
  } catch (e) {
    console.error('[R2] version.json read failed:', e?.message)
    return null
  }
}

// ── APK key resolution ────────────────────────────────────────────────────────
// publish_r2.sh stores APKs at the ROOT of the bucket with flat filenames:
//   app-arm64-v8a-release.apk
//   app-armeabi-v7a-release.apk
// version.json.arm64 / .arm32 fields contain just the filename (no path).
// We serve from the flat root key directly.

function resolveApkKey(info, abi) {
  if (!info) return null
  if (abi === 'arm64') {
    return info.arm64 || 'OtyaPlayer-arm64.apk'
  }
  return info.arm32 || 'OtyaPlayer-arm32.apk'
}

// ── APK streaming from R2 ─────────────────────────────────────────────────────

async function serveApk(env, key, version) {
  let obj
  try {
    obj = await env.R2.get(key)
  } catch (e) {
    console.error('[R2] get failed for key:', key, e?.message)
    return new Response(
      JSON.stringify({ error: 'Storage error. Please try again.' }),
      { status: 502, headers: { 'Content-Type': 'application/json', ...CORS } }
    )
  }

  if (!obj) {
    console.error('[R2] key not found:', key)
    return new Response(
      JSON.stringify({ error: `APK not found. Please contact support.`, key }),
      { status: 404, headers: { 'Content-Type': 'application/json', ...CORS } }
    )
  }

  const headers  = new Headers(CORS)
  obj.writeHttpMetadata(headers)
  headers.set('Content-Type',        'application/vnd.android.package-archive')
  headers.set('Content-Disposition', 'attachment; filename="OtyaPlayer.apk"')
  headers.set('Cache-Control',       `public, max-age=${APK_CACHE_TTL}, immutable`)
  headers.set('ETag',                obj.httpEtag)
  // Set Content-Length so browsers show download progress
  if (obj.size) headers.set('Content-Length', String(obj.size))
  // X-Version header for debugging
  if (version) headers.set('X-OTYA-Version', version)

  return new Response(obj.body, { headers })
}

// ── D1 analytics ──────────────────────────────────────────────────────────────

async function initDb(env) {
  if (dbInitialised) return
  await env.DB.exec(`
    CREATE TABLE IF NOT EXISTS downloads (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      abi        TEXT    NOT NULL,
      version    TEXT,
      country    TEXT,
      ip         TEXT,
      user_agent TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS version_history (
      tag         TEXT PRIMARY KEY,
      version     TEXT,
      released_at TEXT DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_downloads_created ON downloads(created_at);
    CREATE INDEX IF NOT EXISTS idx_downloads_abi     ON downloads(abi);
  `)
  dbInitialised = true
}

// Fire-and-forget — never blocks the APK response
function trackDownload(env, ctx, request, abi, version) {
  ctx.waitUntil(
    (async () => {
      try {
        const ip      = request.headers.get('CF-Connecting-IP') || 'unknown'
        const country = request.headers.get('CF-IPCountry')     || 'unknown'
        const ua      = (request.headers.get('User-Agent') || '').substring(0, 250)
        await env.DB.prepare(
          `INSERT INTO downloads (abi, version, country, ip, user_agent) VALUES (?, ?, ?, ?, ?)`
        ).bind(abi, version || 'unknown', country, ip, ua).run()
      } catch (e) {
        console.error('[D1] trackDownload failed:', e?.message)
      }
    })()
  )
}

// ── Rate limiting ─────────────────────────────────────────────────────────────

async function checkRateLimit(env, request) {
  try {
    const ip = request.headers.get('CF-Connecting-IP') || 'unknown'
    const { success } = await env.RATE_LIMITER.limit({ key: ip })
    return success
  } catch (e) {
    console.error('[RATE_LIMITER] error:', e?.message)
    return true  // fail open — never block downloads due to rate limiter errors
  }
}

// ── Email alerts ──────────────────────────────────────────────────────────────

async function sendErrorAlert(env, subject, body) {
  try {
    // cloudflare:email is a static binding — dynamic import not needed
    await env.EMAIL.send({
      from:    { email: 'worker@petersmartlink.com', name: 'Otya Store Worker' },
      to:      [{ email: 'petersmartlink@gmail.com' }],
      subject,
      text:    body,
    })
  } catch (e) {
    console.error('[EMAIL] send failed:', e?.message)
  }
}

// ── ETag helpers ──────────────────────────────────────────────────────────────

function jsonResponse(data, status = 200, extraHeaders = {}) {
  const body = JSON.stringify(data)
  const etag = `"${simpleHash(body)}"`
  return new Response(body, {
    status,
    headers: {
      'Content-Type':  'application/json',
      'Cache-Control': 'public, max-age=300',
      'ETag':          etag,
      ...CORS,
      ...extraHeaders,
    },
  })
}

function simpleHash(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0
  }
  return (h >>> 0).toString(16)
}

function notModified(request, etag) {
  const ifNoneMatch = request.headers.get('If-None-Match')
  return ifNoneMatch === etag
}

// ── Main handler ──────────────────────────────────────────────────────────────

export default {
  async fetch(request, env, ctx) {
    const url  = new URL(request.url)
    const path = url.pathname.replace(/\/+$/, '') || '/'

    // ── CORS preflight ────────────────────────────────────────────────────
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }
    if (request.method !== 'GET') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { 'Content-Type': 'application/json', ...CORS } }
      )
    }

    // ── Route: only handle known API paths; everything else → Next.js ────
    const apiRoutes = ['/version', '/latest', '/stats', '/download', '/apk/arm64', '/apk/arm32']
    if (!apiRoutes.includes(path)) {
      // Try to serve the static asset first.
      // If the asset is not found (404), fall back to the root index.html
      // so Next.js client-side routing can handle the path.
      const assetRes = await env.ASSETS.fetch(request)
      if (assetRes.status === 404) {
        // Serve root index.html for all unmatched paths (SPA fallback)
        const indexReq = new Request(new URL('/', request.url).toString(), request)
        const indexRes = await env.ASSETS.fetch(indexReq)
        // Return index.html with 200 so the browser doesn't cache the 404
        return new Response(indexRes.body, {
          status: 200,
          headers: indexRes.headers,
        })
      }
      return assetRes
    }

    // ── Lazy DB init (once per isolate, not per request) ──────────────────
    try { await initDb(env) } catch (e) {
      console.error('[D1] initDb failed:', e?.message)
    }

    // ── /version ──────────────────────────────────────────────────────────
    if (path === '/version') {
      const info = await getVersionInfo(env)
      if (!info) {
        return new Response(
          JSON.stringify({ error: 'Version info not available. APK may not be uploaded yet.' }),
          { status: 503, headers: { 'Content-Type': 'application/json', ...CORS } }
        )
      }
      const res = jsonResponse(info)
      const etag = res.headers.get('ETag')
      if (notModified(request, etag)) return new Response(null, { status: 304, headers: CORS })
      return res
    }

    // ── /latest ───────────────────────────────────────────────────────────
    if (path === '/latest') {
      const info = await getVersionInfo(env)
      const payload = {
        version:     info?.version     ?? null,
        versionCode: info?.versionCode ?? null,
        tag:         info?.tag         ?? null,
        date:        info?.date        ?? null,
        changelog:   info?.changelog   ?? null,
        minSdk:      info?.minSdk      ?? 21,
        targetSdk:   info?.targetSdk   ?? 36,
        downloads: {
          auto:  `https://${url.hostname}/download`,
          arm64: `https://${url.hostname}/apk/arm64`,
          arm32: `https://${url.hostname}/apk/arm32`,
        },
      }
      const res = jsonResponse(payload)
      const etag = res.headers.get('ETag')
      if (notModified(request, etag)) return new Response(null, { status: 304, headers: CORS })
      return res
    }

    // ── /stats ────────────────────────────────────────────────────────────
    if (path === '/stats') {
      // Require admin token to prevent public scraping
      const token = url.searchParams.get('token') ||
                    request.headers.get('Authorization')?.replace('Bearer ', '')
      if (!env.ADMIN_TOKEN || token !== env.ADMIN_TOKEN) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized' }),
          { status: 401, headers: { 'Content-Type': 'application/json', ...CORS } }
        )
      }
      try {
        const [total, byAbi, byVersion, byCountry, recent] = await Promise.all([
          env.DB.prepare('SELECT COUNT(*) as count FROM downloads').first(),
          env.DB.prepare('SELECT abi, COUNT(*) as count FROM downloads GROUP BY abi ORDER BY count DESC').all(),
          env.DB.prepare('SELECT version, COUNT(*) as count FROM downloads GROUP BY version ORDER BY count DESC LIMIT 10').all(),
          env.DB.prepare('SELECT country, COUNT(*) as count FROM downloads GROUP BY country ORDER BY count DESC LIMIT 20').all(),
          env.DB.prepare('SELECT abi, version, country, created_at FROM downloads ORDER BY id DESC LIMIT 20').all(),
        ])
        return jsonResponse({
          total:      total?.count ?? 0,
          by_abi:     byAbi.results,
          by_version: byVersion.results,
          by_country: byCountry.results,
          recent:     recent.results,
        }, 200, { 'Cache-Control': 'no-store' })
      } catch (e) {
        console.error('[D1] stats query failed:', e?.message)
        return new Response(
          JSON.stringify({ error: 'Stats unavailable', detail: e?.message }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
        )
      }
    }

    // ── /download + /apk/* — rate-limited APK serving ─────────────────────
    if (path === '/download' || path === '/apk/arm64' || path === '/apk/arm32') {
      const allowed = await checkRateLimit(env, request)
      if (!allowed) {
        return new Response(
          JSON.stringify({ error: 'Too many requests. Please wait 60 seconds and try again.' }),
          { status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': '60', ...CORS } }
        )
      }

      if (path === '/download') {
        const abi = detectAbi(request)
        // 307 = temporary redirect, preserves method; no-store so ABI is re-detected each time
        return new Response(null, {
          status: 307,
          headers: {
            Location:        `https://${url.hostname}/apk/${abi}`,
            'Cache-Control': 'no-store',
            ...CORS,
          },
        })
      }

      const abi  = path === '/apk/arm64' ? 'arm64' : 'arm32'
      const info = await getVersionInfo(env)

      if (!info) {
        // Alert only once per isolate to avoid email spam
        ctx.waitUntil(
          sendErrorAlert(
            env,
            'Otya Store: version.json missing from R2',
            `A ${abi} download was attempted but version.json is missing from R2 bucket.\nTime: ${new Date().toISOString()}`
          )
        )
        return new Response(
          JSON.stringify({ error: 'APK not available yet. Please try again later or contact support.' }),
          { status: 503, headers: { 'Content-Type': 'application/json', ...CORS } }
        )
      }

      const key = resolveApkKey(info, abi)
      if (!key) {
        return new Response(
          JSON.stringify({ error: 'Could not resolve APK path from version info.' }),
          { status: 500, headers: { 'Content-Type': 'application/json', ...CORS } }
        )
      }

      // Track download AFTER starting the response (non-blocking)
      trackDownload(env, ctx, request, abi, info.version)

      return serveApk(env, key, info.version)
    }

    // Fallback — should not be reached, but pass through to Next.js
    return env.ASSETS.fetch(request)
  },
}
