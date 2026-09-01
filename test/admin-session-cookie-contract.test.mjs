import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const adminAuth = readFileSync(new URL('../src/lib/admin_auth.ts', import.meta.url), 'utf8')
const adminSession = readFileSync(new URL('../src/app/api/admin/session/route.ts', import.meta.url), 'utf8')

test('admin owner verification reads the unified OTYA browser session', () => {
  assert.match(adminAuth, /ACCOUNT_ACCESS_COOKIE = '__Secure-otya_access'/)
  assert.match(adminSession, /ACCESS_COOKIE = '__Secure-otya_access'/)
  assert.doesNotMatch(adminAuth, /__Host-otya_access/)
  assert.doesNotMatch(adminSession, /__Host-otya_access/)
})

test('admin privilege remains a separate MFA-gated signed session', () => {
  assert.match(adminAuth, /COOKIE_NAME = 'otya_admin_session'/)
  assert.match(adminAuth, /mfa: true/)
  assert.match(adminAuth, /SameSite=Strict/)
  assert.match(adminSession, /\/auth\/admin\/start/)
  assert.match(adminSession, /\/auth\/admin\/verify-otp/)
  assert.match(adminSession, /\/auth\/admin\/consume/)
  assert.match(adminSession, /createAdminSession/)
})
