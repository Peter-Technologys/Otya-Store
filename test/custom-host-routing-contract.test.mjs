import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const router = readFileSync(new URL('../src/production-router.mjs', import.meta.url), 'utf8')
const status = readFileSync(new URL('../src/app/status/page.tsx', import.meta.url), 'utf8')

test('custom domains have dedicated root surfaces', () => {
  assert.ok(router.includes("const DOCS_HOST = 'docs.petersmartlink.com'"))
  assert.ok(router.includes("const STATUS_HOST = 'status.petersmartlink.com'"))
  assert.ok(router.includes("const SPACE_HOST = 'space.petersmartlink.com'"))
  assert.ok(router.includes("'/help', 'docs'"))
  assert.ok(router.includes("'/status', 'status'"))
  assert.ok(router.includes("'/sign-in', 'space'"))
})

test('Docs host preserves framework assets and API paths', () => {
  assert.ok(router.includes("!url.pathname.startsWith('/_next/')"))
  assert.ok(router.includes("!url.pathname.startsWith('/api/')"))
  assert.ok(router.includes('`/docs${url.pathname}`'))
})

test('public status page avoids exposing internal monitoring details', () => {
  assert.ok(status.includes("title: 'OTYA Status'"))
  assert.ok(status.includes('does not expose private infrastructure'))
  assert.ok(status.includes('No private monitoring data is published here'))
  assert.ok(!status.includes('CLOUDFLARE_ACCOUNT_ID'))
  assert.ok(!status.includes('INTERNAL_SECRET'))
})
