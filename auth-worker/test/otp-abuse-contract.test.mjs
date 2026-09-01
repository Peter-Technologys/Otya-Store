import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../src/secure-otp.ts', import.meta.url), 'utf8')

test('password-reset sends are bounded by both email and source IP', () => {
  assert.match(source, /MAX_SENDS_PER_IP/)
  assert.match(source, /secure_otp_send:reset:\$\{email\}/)
  assert.match(source, /secure_otp_send_ip:reset:\$\{ip\}/)
  assert.match(source, /Promise\.all\(\[/)
  assert.match(source, /if \(!emailAllowed \|\| !ipAllowed\)/)
})

test('password-reset verification is bounded across distributed IPs', () => {
  assert.match(source, /MAX_ATTEMPTS_PER_EMAIL/)
  assert.match(source, /secure_otp_attempt:reset:\$\{email\}:\$\{ip\}/)
  assert.match(source, /secure_otp_attempt_global:reset:\$\{email\}/)
  assert.match(source, /if \(!ipAllowed \|\| !emailAllowed\)/)
  assert.match(source, /delete\(`secure_otp_attempt_global:reset:\$\{email\}`\)/)
})

test('failed password-reset delivery removes the unusable reset code', () => {
  assert.match(source, /const resetKey = `otp:\$\{email\}`/)
  assert.match(source, /await env\.AUTH_KV\.delete\(resetKey\)/)
  assert.match(source, /Password-reset email failed/)
})

test('failed verification delivery removes the unusable verification code', () => {
  assert.match(source, /const verificationKey = `verify_otp:\$\{user\.id\}`/)
  assert.match(source, /await env\.AUTH_KV\.delete\(verificationKey\)/)
  assert.match(source, /Verification email failed/)
  assert.match(source, /Verification email is temporarily unavailable/)
})
