import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const pkg = JSON.parse(read('package.json'))
const auth = read('src/lib/admin_auth.ts')
const ensureSecret = read('scripts/ensure-admin-session-secret.mjs')
const verifyLive = read('scripts/verify-admin-mfa.mjs')

test('Admin uses a dedicated session signing secret', () => {
  assert.match(auth, /return text\(env\.ADMIN_SESSION_SECRET\)/)
  assert.doesNotMatch(auth, /otya-admin-session:v1:/)
})

test('core deployment bootstraps and verifies Admin MFA', () => {
  assert.match(pkg.scripts.deploy, /ensure-admin-session-secret\.mjs/)
  assert.match(pkg.scripts.deploy, /verify-admin-mfa\.mjs/)
  assert.match(ensureSecret, /randomBytes\(48\)/)
  assert.match(ensureSecret, /secret',\s*'list'/)
  assert.match(ensureSecret, /'ADMIN_SESSION_SECRET'/)
  assert.match(ensureSecret, /input,/) 
  assert.doesNotMatch(ensureSecret, /console\.log\(generated\)/)
  assert.match(verifyLive, /api\/admin\/session/)
  assert.match(verifyLive, /body\?\.configured === true/)
})
