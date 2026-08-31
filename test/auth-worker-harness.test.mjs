import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { createTestHarness } from 'wrangler'

const server = createTestHarness({
  workers: [{ configPath: './auth-worker/wrangler.toml' }],
})

after(async () => {
  await server.close()
})

test('auth worker denies JWT verification without credentials', async () => {
  const response = await server.fetch('http://localhost/auth/verify')
  assert.equal(response.status, 401)
  const body = await response.json()
  assert.match(String(body.error ?? ''), /Authorization header required/i)
})

test('admin MFA fails closed before any privileged work', async () => {
  const response = await server.fetch('http://localhost/auth/admin/start', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{}',
  })
  assert.equal(response.status, 403)
  const body = await response.json()
  assert.match(String(body.error ?? ''), /verification is required/i)
})
