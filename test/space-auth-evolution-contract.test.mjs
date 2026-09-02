import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('registration pauses for explicit email verification before opening Space', () => {
  const page = read('src/app/sign-in/page.tsx')
  assert.match(page, /type Mode = 'signin' \| 'register' \| 'verify'/)
  assert.match(page, /setMode\('verify'\)/)
  assert.match(page, /Account created\. We sent one verification code/)
  assert.match(page, /mode === 'verify'/)
  assert.match(page, /authFetch\('verify-email'/)
  assert.match(page, /resendVerification/)
  assert.match(page, /Only the newest code will work|newest code will work/i)

  const registrationBlock = page.slice(
    page.indexOf("if (registration) {"),
    page.indexOf('await verifySessionAndOpen()', page.indexOf("if (registration) {")),
  )
  assert.doesNotMatch(registrationBlock, /verifySessionAndOpen/)
})

test('automatic registration mail has one production verification owner', () => {
  const entry = read('auth-worker/src/production-entrypoint.ts')
  const email = read('auth-worker/src/production-email.ts')

  assert.match(entry, /EMAIL: undefined/)
  assert.match(entry, /deliverRegistrationEmails\(response, env\)/)
  assert.doesNotMatch(entry, /hardenRegistrationVerification/)
  assert.equal((email.match(/subject: 'Your Otya verification code'/g) || []).length, 1)
  assert.doesNotMatch(email, /subject: 'Welcome to Otya'/)
})

test('Space console routes resolve to dedicated pages instead of one account page', () => {
  const router = read('src/production-router.mjs')
  const expected = [
    ["'security'", "'/account/security/'"],
    ["'devices'", "'/account/devices/'"],
    ["'storage'", "'/account/storage/'"],
    ["'activity'", "'/account/activity/'"],
    ["'notifications'", "'/account/notifications/'"],
    ["'settings'", "'/account/settings/'"],
    ["'providers'", "'/account/sign-in-methods/'"],
  ]
  for (const [section, target] of expected) {
    assert.match(router, new RegExp(`\\[${section}, ${target}\\]`.replaceAll('/', '\\/')))
  }

  for (const path of [
    'src/app/account/security/page.tsx',
    'src/app/account/devices/page.tsx',
    'src/app/account/storage/page.tsx',
    'src/app/account/activity/page.tsx',
    'src/app/account/notifications/page.tsx',
    'src/app/account/settings/page.tsx',
  ]) assert.equal(existsSync(new URL(`../${path}`, import.meta.url)), true, `${path} must exist`)
})

test('Space uses public Otya ID in browser paths and never email/provider IDs', () => {
  const router = read('src/production-router.mjs')
  const gate = read('src/components/OtyaSpaceGate.tsx')
  const chrome = read('src/components/OtyaSpaceChrome.tsx')

  assert.match(router, /\^2IS\\d\{8\}\$/)
  assert.match(router, /Internal users\.id values, provider subjects, emails and auth tokens never/)
  assert.match(gate, /PUBLIC_OTYA_ID = \/\^2IS\\d\{8\}\$\/i/)
  assert.match(chrome, /`\/u\/\$\{id\}\/\$\{section\}`/)
  assert.doesNotMatch(chrome, /`\/u\/\$\{user\.email/)
})

test('Space gate reuses its verified user instead of chrome fetching the session again', () => {
  const gate = read('src/components/OtyaSpaceGate.tsx')
  const chrome = read('src/components/OtyaSpaceChrome.tsx')

  assert.match(gate, /OtyaSpaceChrome initialUser=\{user\}/)
  assert.equal((gate.match(/\/api\/account-session\/session/g) || []).length, 1)
  assert.doesNotMatch(chrome, /\/api\/account-session\/session/)
  assert.match(chrome, /initialUser: SpaceUser/)
})

test('Account overview is focused and points to real sections', () => {
  const account = read('src/app/account/page.tsx')
  assert.match(account, /Account overview/)
  assert.match(account, /Security, devices, providers and preferences now have their own pages/)
  assert.doesNotMatch(account, /startTwoFactor|revokeSession|revokeAll|regenerateRecoveryCodes/)
  for (const section of ['security', 'devices', 'providers', 'settings', 'activity', 'storage']) {
    assert.match(account, new RegExp(`\\$\\{base\\}/${section}`))
  }
})
