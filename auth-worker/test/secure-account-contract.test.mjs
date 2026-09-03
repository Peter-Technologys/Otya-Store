import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('production account deletion uses hardened paginated session and fail-closed data cleanup', () => {
  const entry = read('src/production-entrypoint.ts')
  const account = read('src/secure-account.ts')

  assert.match(entry, /handleSecureAccountRoute\(request, env\)/)
  assert.match(account, /cursor\?: string/)
  assert.match(account, /limit: 1000,\s*cursor/)
  assert.match(account, /auth_session:\$\{userId\}:\$\{sessionId\}/)
  assert.match(account, /auth_session_token:\$\{sessionId\}/)
  assert.match(account, /drive_file:\$\{userId\}/)
  assert.match(account, /drive_backup_at:\$\{userId\}/)
  assert.match(account, /await notifyStoreDeletion\(env, payload\.sub, user\.email\?\.toLowerCase\(\) \?\? null\)/)
  assert.match(account, /ACCOUNT_DATA_CLEANUP_FAILED/)
  assert.match(account, /await revokeEveryRefreshSession\(env, payload\.sub\)/)
  assert.match(account, /await deleteAuthDbChildIfPresent\(env\.AUTH_DB, 'user_consents', payload\.sub\)/)
  assert.match(account, /await deleteAuthDbChildIfPresent\(env\.AUTH_DB, 'account_two_factor', payload\.sub\)/)
  assert.match(account, /await deleteUser\(env\.AUTH_DB, payload\.sub\)/)

  assert.ok(
    account.indexOf('await notifyStoreDeletion') < account.indexOf('await deleteUser'),
    'product data cleanup must be verified before the auth identity is deleted',
  )
})
