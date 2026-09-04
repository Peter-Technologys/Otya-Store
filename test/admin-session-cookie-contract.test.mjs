import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const adminAuth = read('src/lib/admin_auth.ts')
const adminSession = read('src/app/api/admin/session/route.ts')
const adminLayout = read('src/app/admin/layout.tsx')
const signIn = read('src/app/sign-in/page.tsx')
const accountSession = read('src/app/api/account-session/session/route.ts')
const telegramEntry = read('src/telegram-entrypoint.mjs')
const coreEntry = read('src/entrypoint.mjs')

test('all live account consumers read the unified Otya browser session', () => {
  for (const source of [adminAuth, adminSession, accountSession, telegramEntry, coreEntry]) {
    assert.match(source, /__Secure-otya_access/)
    assert.doesNotMatch(source, /__Host-otya_access/)
  }
  assert.match(accountSession, /__Secure-otya_refresh/)
  assert.match(accountSession, /COOKIE_DOMAIN = '\.petersmartlink\.com'/)
})

test('admin privilege remains an MFA-gated signed session behind the unified identity', () => {
  assert.match(adminAuth, /COOKIE_NAME = 'otya_admin_session'/)
  assert.match(adminAuth, /mfa: true/)
  assert.match(adminAuth, /SameSite=Strict/)
  assert.match(adminSession, /\/auth\/admin\/start/)
  assert.match(adminSession, /\/auth\/admin\/verify-otp/)
  assert.match(adminSession, /\/auth\/admin\/consume/)
  assert.match(adminSession, /createAdminSession/)
  assert.match(telegramEntry, /Elevated administrator verification required/)
  assert.match(coreEntry, /Elevated administrator verification required/)
})

test('owner verification belongs to normal Otya sign-in rather than a second Admin gate', () => {
  assert.match(signIn, /'owner-otp'/)
  assert.match(signIn, /'owner-telegram'/)
  assert.match(signIn, /adminFetch\(\{ method: 'POST', body: JSON\.stringify\(\{ action: 'start' \}\) \}\)/)
  assert.match(signIn, /action: 'verify-otp'/)
  assert.match(signIn, /action: 'complete'/)
  assert.match(signIn, /Admin is a role inside this Otya account, not a second account\./)
  assert.match(adminLayout, /window\.location\.replace\(signInFor\(pathname\)\)/)
  assert.doesNotMatch(adminLayout, /Unlock Admin/)
})
