import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')
const adminAuth = read('src/lib/admin_auth.ts')
const adminSession = read('src/app/api/admin/session/route.ts')
const accountSession = read('src/app/api/account-session/session/route.ts')
const telegramEntry = read('src/telegram-entrypoint.mjs')
const jamendoStart = read('src/app/api/music/jamendo/oauth/start/route.ts')

test('all live account consumers read the unified OTYA browser session', () => {
  for (const source of [adminAuth, adminSession, accountSession, telegramEntry, jamendoStart]) {
    assert.match(source, /__Secure-otya_access/)
    assert.doesNotMatch(source, /__Host-otya_access/)
  }
  assert.match(accountSession, /__Secure-otya_refresh/)
  assert.match(accountSession, /COOKIE_DOMAIN = '\.petersmartlink\.com'/)
})

test('host-only OAuth state remains host-only while account identity is shared', () => {
  assert.match(jamendoStart, /STATE_COOKIE = '__Host-otya_jamendo_state'/)
  assert.match(jamendoStart, /ACCESS_COOKIE = '__Secure-otya_access'/)
})

test('admin privilege remains a separate MFA-gated signed session', () => {
  assert.match(adminAuth, /COOKIE_NAME = 'otya_admin_session'/)
  assert.match(adminAuth, /mfa: true/)
  assert.match(adminAuth, /SameSite=Strict/)
  assert.match(adminSession, /\/auth\/admin\/start/)
  assert.match(adminSession, /\/auth\/admin\/verify-otp/)
  assert.match(adminSession, /\/auth\/admin\/consume/)
  assert.match(adminSession, /createAdminSession/)
  assert.match(telegramEntry, /Elevated administrator verification required/)
})
