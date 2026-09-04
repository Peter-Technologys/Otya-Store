import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('Admin account lookup is bounded and valid elevated sessions avoid the lookup', () => {
  const auth = read('src/lib/admin_auth.ts')
  const route = read('src/app/api/admin/session/route.ts')

  assert.match(auth, /AUTH_LOOKUP_TIMEOUT_MS = 5000/)
  assert.match(auth, /signal: AbortSignal\.timeout\(AUTH_LOOKUP_TIMEOUT_MS\)/)

  const getBlock = route.slice(route.indexOf('export async function GET'), route.indexOf('export async function POST'))
  const authenticated = getBlock.indexOf('verifyAdminSession')
  const accountLookup = getBlock.indexOf('getOtyaAccountAdminEmail')
  assert.ok(authenticated >= 0 && accountLookup > authenticated)
  assert.match(getBlock, /const accountAdmin = authenticated \|\| Boolean/)
})

test('Admin UI cannot stay on the access spinner indefinitely', () => {
  const layout = read('src/app/admin/layout.tsx')
  const client = read('src/lib/admin_session_client.ts')
  assert.match(client, /REQUEST_TIMEOUT_MS = 9_000/)
  assert.match(client, /signal: AbortSignal\.timeout\(REQUEST_TIMEOUT_MS\)/)
  assert.match(layout, /getAdminSession\(\)/)
  assert.match(layout, /setChecking\(false\)/)
})

test('Admin verification steps fail closed with a bounded AUTH request', () => {
  const route = read('src/app/api/admin/session/route.ts')
  assert.match(route, /AUTH_STEP_TIMEOUT_MS = 8000/)
  assert.match(route, /signal: AbortSignal\.timeout\(AUTH_STEP_TIMEOUT_MS\)/)
  assert.match(route, /Admin verification service is temporarily unavailable\. Try again\./)
})
