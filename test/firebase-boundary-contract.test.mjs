import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const authEntrypoint = readFileSync(new URL('../auth-worker/src/entrypoint.ts', import.meta.url), 'utf8')
const systemContract = readFileSync(new URL('../docs/V1_SYSTEM_CONTRACT.md', import.meta.url), 'utf8')

test('Firebase is not a production OTYA authentication provider', () => {
  assert.doesNotMatch(authEntrypoint, /handleFirebaseLogin/)
  assert.doesNotMatch(authEntrypoint, /\/auth\/firebase/)
  assert.equal(existsSync(new URL('../auth-worker/src/firebase-auth.ts', import.meta.url)), false)
})

test('approved Firebase capabilities remain platform services rather than account authority', () => {
  assert.match(systemContract, /Identity\/security: OTYA Auth only/)
  assert.match(systemContract, /FCM is transport only/)
  assert.match(systemContract, /Firebase App Check uses Play Integrity/)
  assert.match(systemContract, /Firebase Remote Config owns only approved client presentation\/experiment values/)
  assert.match(systemContract, /Cloudflare remains the OTYA control plane and canonical account\/session authority/)
})
