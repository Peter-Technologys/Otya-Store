import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('email registration has an explicit verification step before Space', () => {
  const signIn = read('src/app/sign-in/page.tsx')
  assert.match(signIn, /type Mode = 'signin' \| 'register' \| 'verify'/)
  assert.match(signIn, /accountFetch\('verify-email'/)
  assert.match(signIn, /accountFetch\('send-verification'/)
  assert.match(signIn, /Resend code/)
  assert.match(signIn, /verification_sent !== false/)
  assert.match(signIn, /Verify email and continue/)
  assert.doesNotMatch(signIn, /function sleep\(/)
  assert.doesNotMatch(signIn, /for \(let attempt = 0; attempt < 3/)
})

test('registration sends one critical code and welcome follows verification', () => {
  const entry = read('auth-worker/src/production-entrypoint.ts')
  const email = read('auth-worker/src/production-email.ts')

  assert.match(entry, /deliverRegistrationVerification\(response, env\)/)
  assert.match(entry, /verification_required: true/)
  assert.match(entry, /verification_sent: verificationSent/)
  assert.match(entry, /url\.pathname === '\/auth\/verify-email'/)
  assert.match(entry, /deliverVerifiedWelcome\(request, env\)/)
  assert.match(email, /subject: 'Your Otya verification code'/)
  assert.match(email, /subject: 'Welcome to Otya'/)
  assert.doesNotMatch(email, /export async function deliverRegistrationEmails/)
})

test('new-device security email is outside password and Google login critical path', () => {
  const entry = read('auth-worker/src/production-entrypoint.ts')
  assert.match(entry, /scheduleNonCritical/)
  assert.match(entry, /ctx\?\.waitUntil/)
  assert.doesNotMatch(entry, /await deliverNewDeviceAlert\(/)
})

test('Space canonicalizes its public console URL without reloading the app', () => {
  const gate = read('src/components/OtyaSpaceGate.tsx')
  assert.match(gate, /window\.history\.replaceState/)
  assert.doesNotMatch(gate, /window\.location\.replace\(`\/u\/\$\{canonicalId\}/)
})

test('Space reuses one browser-session request across gate and chrome', () => {
  const helper = read('src/lib/space-session.ts')
  const gate = read('src/components/OtyaSpaceGate.tsx')
  const chrome = read('src/components/OtyaSpaceChrome.tsx')
  assert.match(helper, /let inFlight: Promise<SpaceSession> \| null/)
  assert.match(helper, /getSpaceSession/)
  assert.match(gate, /getSpaceSession\(\)/)
  assert.match(chrome, /getSpaceSession\(\)/)
  assert.doesNotMatch(chrome, /fetch\('\/api\/account-session\/session'/)
})

test('major Space areas are separate pages, not account-page anchors', () => {
  const router = read('src/production-router.mjs')
  const chrome = read('src/components/OtyaSpaceChrome.tsx')
  const account = read('src/app/account/page.tsx')

  for (const [section, route] of [
    ['security', '/account/security/'],
    ['devices', '/account/devices/'],
    ['storage', '/account/storage/'],
    ['activity', '/account/activity/'],
    ['notifications', '/account/notifications/'],
    ['settings', '/account/settings/'],
  ]) {
    assert.match(router, new RegExp(`\\['${section}', '${route.replaceAll('/', '\\/')}'\\]`))
    assert.match(chrome, new RegExp(`href: '${route.replaceAll('/', '\\/')}'`))
    assert.equal(existsSync(new URL(`../src/app${route}page.tsx`, import.meta.url)), true, `${section} page must exist`)
  }

  assert.doesNotMatch(account, /id="security"/)
  assert.doesNotMatch(account, /id="sessions"/)
  assert.doesNotMatch(account, /id="storage"/)
  assert.doesNotMatch(account, /href="#security"/)
})

test('Space notifications do not display a fake unread indicator', () => {
  const chrome = read('src/components/OtyaSpaceChrome.tsx')
  assert.match(chrome, /No new account alerts/)
  assert.doesNotMatch(chrome, /absolute right-2 top-2 h-1\.5 w-1\.5/)
})

test('Drive recovery status reveals metadata only and needs no Drive token', () => {
  const backup = read('auth-worker/src/backup_route.ts')
  const storage = read('src/app/account/storage/page.tsx')
  assert.match(backup, /url\.searchParams\.get\('status'\) === '1'/)
  assert.match(backup, /scope: 'recovery-metadata-only'/)
  assert.match(backup, /has_backup: Boolean\(fileId\)/)
  assert.match(storage, /backup\?status=1/)
  assert.doesNotMatch(storage, /drive_token/)
})
