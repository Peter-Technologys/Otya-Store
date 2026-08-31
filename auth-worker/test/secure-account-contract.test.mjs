import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('production account deletion uses hardened paginated session cleanup', () => {
  const entry = read('src/production-entrypoint.ts')
  const account = read('src/secure-account.ts')

  assert.match(entry, /handleSecureAccountRoute\(request, env\)/)
  assert.match(account, /cursor\?: string/)
  assert.match(account, /limit: 1000,\s*cursor/)
  assert.match(account, /auth_session:\$\{userId\}:\$\{sessionId\}/)
  assert.match(account, /auth_session_token:\$\{sessionId\}/)
  assert.match(account, /drive_file:\$\{payload\.sub\}/)
  assert.match(account, /await revokeEveryRefreshSession\(env, payload\.sub\)/)
  assert.match(account, /await deleteUser\(env\.AUTH_DB, payload\.sub\)/)
})
