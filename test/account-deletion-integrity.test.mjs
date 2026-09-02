import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('auth does not delete identity before product cleanup is proven', () => {
  const source = read('auth-worker/src/secure-account.ts')
  const cleanup = source.indexOf('await deleteStoreData(env')
  const revoke = source.indexOf('await revokeEveryRefreshSession(env')
  const deleteIdentity = source.indexOf('await deleteUser(env.AUTH_DB')

  assert.ok(cleanup >= 0)
  assert.ok(revoke > cleanup)
  assert.ok(deleteIdentity > revoke)
  assert.match(source, /data\.ok !== true/)
  assert.match(source, /ACCOUNT_DELETION_INCOMPLETE/)
  assert.match(source, /CANONICAL_STORE_URL = 'https:\/\/petersmartlink\.com'/)
  assert.match(source, /email: string \| null/)
})

test('core deletion fails closed on existing tables with missing ownership columns', () => {
  const source = read('src/app/api/internal/delete-user/route.ts')
  assert.match(source, /PRAGMA table_info/)
  assert.match(source, /refusing to report incomplete deletion as success/)
  assert.match(source, /return errorJson\('User data deletion is incomplete\. Retry required\.', 503\)/)
  assert.doesNotMatch(source, /catch \(e\) \{[\s\S]{0,240}deleted\.push\(\{ table, rows: 0 \}\)/)
})

test('account deletion covers Next conversations and feedback children before parents', () => {
  const source = read('src/app/api/internal/delete-user/route.ts')
  assert.match(source, /DELETE FROM ai_messages/)
  assert.match(source, /DELETE FROM ai_conversations/)
  assert.match(source, /internalSecret}:user:\$\{userId}/)
  assert.match(source, /DELETE FROM feedback_replies/)
  assert.match(source, /DELETE FROM feedback WHERE lower\(user_email\) = lower\(\?\)/)

  const feedbackReplies = source.indexOf('DELETE FROM feedback_replies')
  const feedback = source.indexOf("'DELETE FROM feedback WHERE lower(user_email) = lower(?)'")
  assert.ok(feedbackReplies >= 0 && feedback > feedbackReplies)
})

test('provider-only accounts can delete without inventing an email', () => {
  const auth = read('auth-worker/src/secure-account.ts')
  const core = read('src/app/api/internal/delete-user/route.ts')
  assert.match(auth, /user_email: user\.email/)
  assert.match(core, /userEmail = typeof body\.user_email === 'string'/)
  assert.match(core, /skipped: 'no-account-email'/)
})

test('durable user-id datasets remain explicitly enumerated', () => {
  const source = read('src/app/api/internal/delete-user/route.ts')
  for (const table of [
    'play_history',
    'playlists',
    'bookmarks',
    'eq_presets',
    'user_preferences',
    'pro_status',
    'ratings',
    'crash_reports',
    'devices',
  ]) {
    assert.match(source, new RegExp(`'${table}'`))
  }
})
