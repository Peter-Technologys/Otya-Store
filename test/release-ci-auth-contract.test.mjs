import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const entry = read('src/entrypoint.mjs')
const ciAuth = read('src/release-ci-auth.mjs')

test('release automation uses replay-protected HMAC instead of a static Bearer bypass', () => {
  assert.match(entry, /verifyReleaseCiRequest/)
  assert.match(ciAuth, /OTYA_STORE_ADMIN_TOKEN/)
  assert.match(ciAuth, /X-Otya-Timestamp/)
  assert.match(ciAuth, /X-Otya-Signature/)
  assert.match(ciAuth, /MAX_SKEW_SECONDS = 5 \* 60/)
  assert.match(ciAuth, /HMAC/)
  assert.match(ciAuth, /SHA-256/)
  assert.match(ciAuth, /constantTimeEqual/)
  assert.doesNotMatch(entry, /Authorization[^\n]*OTYA_STORE_ADMIN_TOKEN/)
  assert.doesNotMatch(ciAuth, /Bearer/)
})

test('interactive release authorization still requires admin identity and elevated MFA', () => {
  assert.match(entry, /const user=await authenticateUser\(request,env\)/)
  assert.match(entry, /isAdminUser\(user,env\)/)
  assert.match(entry, /hasElevatedAdminSession\(request,env\)/)
  assert.match(entry, /release-ci@petersmartlink\.com/)
})
