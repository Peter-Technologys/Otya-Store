/**
 * OTYA Player — Cloudflare Worker
 * Serves APKs from R2 via binding (versioned folder structure)
 */

const WEBSITE = 'https://petersmartlink.com/download/otya-player'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function detectAbi(request) {
  const url   = new URL(request.url)
  const param = url.searchParams.get('abi')
  if (param === 'arm64') return 'arm64'
  if (param === 'arm32') return 'arm32'

  const arch = request.headers.get('Sec-CH-UA-Arch') || ''
  if (arch.indexOf('arm64')   !== -1) return 'arm64'
  if (arch.indexOf('aarch64') !== -1) return 'arm64'
  if (arch.indexOf('arm')     !== -1) return 'arm32'

  const ua = (request.headers.get('User-Agent') || '').toLowerCase()
  if (ua.indexOf('arm64')   !== -1) return 'arm64'
  if (ua.indexOf('aarch64') !== -1) return 'arm64'
  if (ua.indexOf('armv8')   !== -1) return 'arm64'
  if (ua.indexOf('armv7')   !== -1) return 'arm32'
  if (ua.indexOf('armeabi') !== -1) return 'arm32'

  return 'arm64'
}

async function getVersionInfo(env) {
  try {
    const obj = await env.R2.get('version.json')
    if (!obj) return null
    return await obj.json()
  } catch (e) {
    return null
  }
}

function buildApkKey(info, abi) {
  if (!info || !info.tag) return null
  const filename = abi === 'arm64'
    ? (info.arm64 || 'otya-player-' + info.tag + '-arm64.apk')
    : (info.arm32 || 'otya-player-' + info.tag + '-arm32.apk')
  return 'releases/' + info.tag + '/' + filename
}

async function serveApk(env, key) {
  const obj = await env.R2.get(key)
  if (!obj) {
    return new Response('APK not found: ' + key, { status: 404 })
  }
  const headers = new Headers()
  obj.writeHttpMetadata(headers)
  headers.set('etag', obj.httpEtag)
  headers.set('Content-Type', 'application/vnd.android.package-archive')
  headers.set('Content-Disposition', 'attachment; filename="' + key.split('/').pop() + '"')
  headers.set('Cache-Control', 'public, max-age=300')
  return new Response(obj.body, { headers })
}

export default {
  async fetch(request, env) {
    const url  = new URL(request.url)
    const path = url.pathname.replace(/\/+$/, '') || '/'

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS })
    }

    if (request.method !== 'GET') {
      return new Response('Method not allowed', { status: 405 })
    }

    if (path === '' || path === '/') {
      return Response.redirect(WEBSITE, 302)
    }

    if (path === '/version') {
      const info = await getVersionInfo(env)
      if (!info) {
        return new Response(
          JSON.stringify({ error: 'version info not available yet' }),
          { status: 503, headers: Object.assign({ 'Content-Type': 'application/json' }, CORS) }
        )
      }
      return new Response(JSON.stringify(info), {
        headers: Object.assign({
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        }, CORS),
      })
    }

    if (path === '/download') {
      const abi = detectAbi(request)
      return Response.redirect('https://' + url.hostname + '/apk/' + abi, 302)
    }

    if (path === '/apk/arm64' || path === '/apk/arm32') {
      const abi  = path === '/apk/arm64' ? 'arm64' : 'arm32'
      const info = await getVersionInfo(env)
      if (!info) {
        return new Response(
          JSON.stringify({ error: 'version info not available' }),
          { status: 503, headers: { 'Content-Type': 'application/json' } }
        )
      }
      const key = buildApkKey(info, abi)
      if (!key) {
        return new Response('Could not determine APK path', { status: 500 })
      }
      return serveApk(env, key)
    }

    if (path === '/latest') {
      const info = await getVersionInfo(env)
      const payload = {
        version:     info ? info.version     : 'unknown',
        versionCode: info ? info.versionCode : null,
        tag:         info ? info.tag         : null,
        date:        info ? info.date        : null,
        changelog:   info ? info.changelog   : null,
        downloads: {
          auto:  'https://' + url.hostname + '/download',
          arm64: 'https://' + url.hostname + '/apk/arm64',
          arm32: 'https://' + url.hostname + '/apk/arm32',
        },
      }
      return new Response(JSON.stringify(payload), {
        headers: Object.assign({
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300',
        }, CORS),
      })
    }

    return new Response('Not found', { status: 404 })
  },
}
