import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const signIn = readFileSync(new URL('../src/app/sign-in/page.tsx', import.meta.url), 'utf8')
const production = readFileSync(new URL('../auth-worker/src/production-entrypoint.ts', import.meta.url), 'utf8')
const wrapper = readFileSync(new URL('../auth-worker/src/entrypoint.ts', import.meta.url), 'utf8')
const chrome = readFileSync(new URL('../src/components/OtyaSpaceChrome.tsx', import.meta.url), 'utf8')
const gate = readFileSync(new URL('../src/components/OtyaSpaceGate.tsx', import.meta.url), 'utf8')

test('email registration has an explicit verification step before Space opens', () => {
  assert.match(signIn, /type Mode = [^\n]*'verify'/)
  assert.match(signIn, /setMode\('verify'\)/)
  assert.match(signIn, /authFetch\('verify-email'/)
  assert.match(signIn, /Verify email and continue/)
  assert.match(signIn, /Send a new code/)
  assert.match(signIn, /Account created\. We sent one verification code/)
})

test('production registration has one physical email-delivery owner', () => {
  assert.match(production, /SUPPRESS_COMPAT_EMAIL: true/)
  assert.match(wrapper, /env\.SUPPRESS_COMPAT_EMAIL[\s\S]*EMAIL: undefined/)
  assert.match(production, /hardenRegistrationVerification\(response, env\)/)
  assert.match(production, /deliverRegistrationEmails\(response, env\)/)
})

test('password and Google success do not perform Telegram-style session polling', () => {
  const pollFunction = signIn.match(/async function verifySessionAndOpen\(\)[\s\S]*?\n  }/)?.[0] ?? ''
  assert.match(pollFunction, /Telegram returns from an external authorization page/)
  assert.match(signIn, /telegram === 'signed-in'\) void verifySessionAndOpen\(\)/)
  const googleFunction = signIn.match(/async function completeGoogle[\s\S]*?\n  }/)?.[0] ?? ''
  assert.doesNotMatch(googleFunction, /verifySessionAndOpen/)
})

test('Space performs one account-session gate read before chrome rendering', () => {
  assert.match(gate, /fetch\('\/api\/account-session\/session'/)
  assert.doesNotMatch(chrome, /fetch\('\/api\/account-session\/session'/)
  assert.match(chrome, /OtyaSpaceChrome\(\{ children, user \}/)
})
