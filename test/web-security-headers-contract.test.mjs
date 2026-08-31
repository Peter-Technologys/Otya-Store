import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('production browser policy stays Turnstile-compatible without unsafe-eval', () => {
  const nextConfig = read('next.config.mjs')
  const assetHeaders = read('public/_headers')

  assert.match(nextConfig, /https:\/\/challenges\.cloudflare\.com/)
  assert.match(nextConfig, /object-src 'none'/)
  assert.match(nextConfig, /base-uri 'self'/)
  assert.match(nextConfig, /form-action 'self'/)
  assert.match(nextConfig, /frame-ancestors 'none'/)
  assert.match(nextConfig, /Cross-Origin-Opener-Policy/)
  assert.match(nextConfig, /same-origin-allow-popups/)

  const productionScript = nextConfig.match(/:\s*"script-src[^\n]+"/)?.[0] ?? ''
  assert.doesNotMatch(productionScript, /unsafe-eval/)

  assert.match(assetHeaders, /https:\/\/challenges\.cloudflare\.com/)
  assert.doesNotMatch(assetHeaders, /unsafe-eval/)
  assert.doesNotMatch(assetHeaders, /X-XSS-Protection/)
})

test('HSTS is delegated to Cloudflare edge instead of duplicated in app assets', () => {
  const nextConfig = read('next.config.mjs')
  const assetHeaders = read('public/_headers')

  assert.doesNotMatch(nextConfig, /Strict-Transport-Security/)
  assert.doesNotMatch(assetHeaders, /Strict-Transport-Security/)
})
