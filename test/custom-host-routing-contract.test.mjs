import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const router = readFileSync(new URL('../src/production-router.mjs', import.meta.url), 'utf8')
const nextConfig = readFileSync(new URL('../next.config.mjs', import.meta.url), 'utf8')
const status = readFileSync(new URL('../src/app/status/page.tsx', import.meta.url), 'utf8')

test('custom domains are canonical public entry points', () => {
  assert.ok(router.includes("const APP_HOST = 'petersmartlink.com'"))
  assert.ok(router.includes("const DOCS_HOST = 'docs.petersmartlink.com'"))
  assert.ok(router.includes("const STATUS_HOST = 'status.petersmartlink.com'"))
  assert.ok(router.includes("const SPACE_HOST = 'space.petersmartlink.com'"))
  assert.ok(router.includes("redirectToHost(url, APP_HOST, '/help')"))
  assert.ok(router.includes("redirectToHost(url, APP_HOST, '/status')"))
})

test('Space serves the account surface and apex account links converge to Space', () => {
  assert.ok(router.includes("url.pathname === '/' || url.pathname === '/account'"))
  assert.ok(router.includes("dispatchCanonical(request, url, env, ctx, '/account/')"))
  assert.ok(router.includes("redirectToHost(url, SPACE_HOST, '/')"))
})

test('Space canonical rewrites honor Next trailing slash policy to prevent redirect loops', () => {
  assert.ok(nextConfig.includes('trailingSlash: true'))
  assert.ok(router.includes("dispatchCanonical(request, url, env, ctx, '/account/')"))
  assert.ok(router.includes("dispatchCanonical(request, url, env, ctx, '/sign-in/')"))
  assert.ok(!router.includes("dispatchCanonical(request, url, env, ctx, '/account')\n"))
  assert.ok(!router.includes("dispatchCanonical(request, url, env, ctx, '/sign-in')\n"))
})

test('custom surfaces keep HTTPS and generated OpenNext routing explicit', () => {
  assert.ok(router.includes("target.protocol = 'https:'"))
  assert.ok(router.includes('target.hostname = APP_HOST'))
  assert.ok(router.includes("import openNextWorker from '../.open-next/worker.js'"))
  assert.ok(router.includes('Response.redirect(target.toString(), 302)'))
})

test('public status page avoids exposing internal monitoring details', () => {
  assert.ok(status.includes("title: 'OTYA Status'"))
  assert.ok(status.includes('does not expose private infrastructure'))
  assert.ok(status.includes('No private monitoring data is published here'))
  assert.ok(!status.includes('CLOUDFLARE_ACCOUNT_ID'))
  assert.ok(!status.includes('INTERNAL_SECRET'))
})
