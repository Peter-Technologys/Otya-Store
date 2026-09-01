import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('browser auth defaults to OTYA Space and only accepts safe same-site return paths', () => {
  const signIn = read('src/app/sign-in/page.tsx')
  assert.match(signIn, /DEFAULT_AFTER_AUTH = 'https:\/\/space\.petersmartlink\.com\/'/)
  assert.match(signIn, /requested\.startsWith\('\/'\)/)
  assert.match(signIn, /!requested\.startsWith\('\/\/'\)/)
  assert.match(signIn, /!requested\.includes\('\\\\'\)/)
  assert.match(signIn, /window\.location\.replace\(afterAuthDestination\(\)\)/)
})

test('Telegram remains available for sign-in and explicit consent-gated registration', () => {
  const signIn = read('src/app/sign-in/page.tsx')
  assert.match(signIn, /registration \? 'register' : 'login'/)
  assert.match(signIn, /\/api\/auth\/telegram\/start\?mode=\$\{telegramMode\}/)
  assert.match(signIn, /registration && \(!terms \|\| !privacy\)/)
  assert.match(signIn, /terms_accepted: true/)
  assert.match(signIn, /privacy_accepted: true/)
  assert.match(signIn, /disabled=\{busy\}[^\n]*Continue with Telegram/)
  assert.doesNotMatch(signIn, /disabled=\{busy \|\| registration\}/)
  assert.doesNotMatch(signIn, /account creation will be available after Telegram is linked/i)
})

test('admin uses unified OTYA identity but keeps separate elevated MFA', () => {
  const admin = read('src/lib/admin_auth.ts')
  const session = read('src/app/api/admin/session/route.ts')
  assert.match(admin, /ACCOUNT_ACCESS_COOKIE = '__Secure-otya_access'/)
  assert.match(admin, /COOKIE_NAME = 'otya_admin_session'/)
  assert.match(session, /\/auth\/admin\/start/)
  assert.match(session, /\/auth\/admin\/verify-otp/)
  assert.match(session, /\/auth\/admin\/consume/)
})
