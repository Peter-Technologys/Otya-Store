import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const router = readFileSync(new URL('../src/production-router.mjs', import.meta.url), 'utf8')
const status = readFileSync(new URL('../src/app/status/page.tsx', import.meta.url), 'utf8')

test('custom domains are canonical public entry points', () => {
  assert.ok(router.includes("const APP_HOST = 'petersmartlink.com'"))
  assert.ok(router.includes("const DOCS_HOST = 'docs.petersmartlink.com'"))
  assert.ok(router.includes("const STATUS_HOST = 'status.petersmartlink.com'"))
  assert.ok(router.includes("const SPACE_HOST = 'space.petersmartlink.com'"))
  assert.ok(router.includes("publicSurfaceRedirect(url, '/help')"))
  assert.ok(router.includes("publicSurfaceRedirect(url, '/status')"))
  assert.ok(router.includes("publicSurfaceRedirect(url, '/sign-in')"))
})

test('custom surfaces use temporary HTTPS redirects to compiled apex pages', () => {
  assert.ok(router.includes("target.protocol = 'https:'"))
  assert.ok(router.includes('target.hostname = APP_HOST'))
  assert.ok(router.includes('Response.redirect(target.toString(), 302)'))
  assert.ok(!router.includes('url.hostname = APP_HOST'))
})

test('public status page avoids exposing internal monitoring details', () => {
  assert.ok(status.includes("title: 'OTYA Status'"))
  assert.ok(status.includes('does not expose private infrastructure'))
  assert.ok(status.includes('No private monitoring data is published here'))
  assert.ok(!status.includes('CLOUDFLARE_ACCOUNT_ID'))
  assert.ok(!status.includes('INTERNAL_SECRET'))
})
