import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('production uses the outer router before OpenNext', () => {
  const wrangler = read('wrangler.toml')
  assert.match(wrangler, /main = "src\/production-router\.mjs"/)
})

test('/api/version is resolved to canonical /latest before Next routing', () => {
  const router = read('src/production-router.mjs')
  assert.match(router, /url\.pathname === '\/api\/version'/)
  assert.match(router, /url\.pathname = '\/latest'/)
  assert.match(router, /worker\.fetch\(new Request\(url/)
})
