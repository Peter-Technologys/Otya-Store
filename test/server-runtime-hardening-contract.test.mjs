import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('live APK routes enforce active abuse controls and cache latest builds briefly', () => {
  const route = read('src/app/apk/[file]/route.ts')
  assert.match(route, /RATE_LIMITER/)
  assert.match(route, /blocked:\$\{ip\}/)
  assert.match(route, /Retry-After/)
  assert.match(route, /public, max-age=300, must-revalidate/)
  assert.match(route, /public, max-age=31536000, immutable/)
  assert.doesNotMatch(route, /headers\.set\('Cache-Control', 'public, max-age=3600'\)/)
})

test('production Google audience verification is bounded', () => {
  const source = read('auth-worker/src/production-entrypoint.ts')
  assert.match(source, /GOOGLE_VERIFY_TIMEOUT_MS = 8000/)
  assert.match(source, /signal: AbortSignal\.timeout\(GOOGLE_VERIFY_TIMEOUT_MS\)/)
  assert.match(source, /headers: \{ Accept: 'application\/json' \}/)
})
