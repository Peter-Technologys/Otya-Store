import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const profile = read('auth-worker/src/account-profile.ts')
const methods = read('src/app/account/sign-in-methods/page.tsx')
const layout = read('src/app/account/layout.tsx')

test('Telegram-first OTYA identities can add a unique primary email without replacing an existing one', () => {
  assert.match(profile, /const allowed = \['email'/)
  assert.match(profile, /EMAIL_IN_USE/)
  assert.match(profile, /EMAIL_CHANGE_REQUIRES_VERIFICATION/)
  assert.match(profile, /updates\.push\('email = \?', 'is_verified = 0'\)/)
  assert.match(profile, /getUserByEmail/)
})

test('OTYA Space exposes one sign-in-method manager for email Google and Telegram', () => {
  assert.match(methods, /Telegram, Google and email can all belong to one OTYA ID/)
  assert.match(methods, /accountFetch\('google\/link'/)
  assert.match(methods, /accountFetch\('account', \{ method: 'PATCH', body: JSON\.stringify\(\{ email \}\) \}\)/)
  assert.match(methods, /accountFetch\('send-verification'/)
  assert.match(methods, /accountFetch\('verify-email'/)
  assert.match(methods, /accountFetch\('telegram\/start'/)
  assert.doesNotMatch(methods, /accountFetch\('register'/)
})

test('account workspace makes sign-in methods discoverable', () => {
  assert.match(layout, /href="\/account\/sign-in-methods"/)
  assert.match(layout, />\s*Sign-in methods\s*</)
})
