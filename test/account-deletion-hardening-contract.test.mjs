import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('account deletion keeps auth identity until product cleanup is verified', () => {
  const auth = read('auth-worker/src/secure-account.ts')
  const storeCall = auth.indexOf('await notifyStoreDeletion')
  const authDelete = auth.indexOf('await deleteUser')
  assert.ok(storeCall >= 0)
  assert.ok(authDelete > storeCall)
  assert.match(auth, /ACCOUNT_DATA_CLEANUP_FAILED/)
  assert.match(auth, /result\.ok !== true/)
  assert.match(auth, /AbortSignal\.timeout\(8000\)/)
})

test('account deletion purges auth-side consent security and backup pointers', () => {
  const auth = read('auth-worker/src/secure-account.ts')
  for (const required of [
    'user_consents',
    'account_two_factor',
    'drive_file:',
    'drive_backup_at:',
    'verify_otp:',
    '2fa_pending:',
    'phone_verify_pending:',
    'admin_mfa_otp:',
    'admin_mfa_telegram:',
    'admin_mfa_complete:',
  ]) assert.ok(auth.includes(required), `missing cleanup marker ${required}`)
})

test('store cleanup resolves device-linked data and fails closed on database errors', () => {
  const route = read('src/app/api/internal/delete-user/route.ts')
  assert.match(route, /SELECT device_id FROM devices WHERE user_id = \?/)
  assert.match(route, /feedback_replies/)
  assert.match(route, /user_email/)
  assert.match(route, /device_id IN/)
  assert.match(route, /Cleanup verification failed/)
  assert.match(route, /return errorJson\('Account data cleanup failed', 503\)/)
  assert.doesNotMatch(route, /Table may not exist yet/)
})
