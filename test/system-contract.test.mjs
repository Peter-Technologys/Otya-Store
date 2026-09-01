import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

// The rest of this file is intentionally source-contract oriented. These tests
// protect security/control-plane invariants that are easy to weaken during
// refactors even when unit behavior still looks correct.

const adminMfa = read('auth-worker/src/admin-mfa.ts')
const telegramLogin = read('auth-worker/src/telegram-login.ts')
const accountProxy = read('src/app/api/account-session/[...path]/route.ts')
const authEntrypoint = read('auth-worker/src/production-entrypoint.ts')

// Keep existing contract assertions from the current repository while updating
// only the production auth environment expectations introduced by the Resend
// compatibility adapter.

test('admin privilege remains a separate MFA-gated signed session', () => {
  assert.match(adminMfa, /admin_mfa/)
  assert.match(accountProxy, /admin_mfa/)
})

test('Admin Telegram step-up preserves the existing normal browser session', () => {
  const adminBlock = telegramLogin.slice(
    telegramLogin.indexOf('if (pendingAdmin)'),
    telegramLogin.indexOf('return json({', telegramLogin.indexOf('if (pendingAdmin)')) + 500,
  )
  const callback = accountProxy
  assert.match(adminBlock, /existingIdentity\.user_id !== userId/)
  assert.match(adminBlock, /markAdminTelegramComplete/)
  assert.match(adminBlock, /admin_mfa:\s*true/)
  assert.doesNotMatch(adminBlock, /issueBrowserTokens/)
  assert.doesNotMatch(adminBlock, /refresh_token/)
  assert.match(callback, /data\.admin_mfa === true/)
  assert.match(callback, /\/admin\?telegram=verified/)
})

test('Production account OTPs are purpose-bound, protected at rest, and single-use', () => {
  const source = read('auth-worker/src/secure-otp.ts')
  const entry = read('auth-worker/src/production-entrypoint.ts')

  assert.match(source, /HMAC/)
  assert.match(source, /hmac-sha256:/)
  assert.match(source, /otya-otp:\$\{purpose\}:\$\{subject\}:\$\{normalized\}/)
  assert.match(source, /\^\[A-Z\]\[0-9\]\{4\}\$/)
  assert.match(source, /delete\(`otp:\$\{email\}`\)/)
  assert.match(source, /delete\(`verify_otp:\$\{user\.id\}`\)/)
  assert.match(source, /revokeRefreshTokens\(env, user\.id\)/)
  assert.match(entry, /const runtimeEnv = resendCompatibleEnv\(env\)/)
  assert.match(entry, /handleSecureOtpRoute\(request, runtimeEnv\)/)
  assert.match(entry, /hardenRegistrationVerification\(response, runtimeEnv\)/)
})

test('OTYA one-time codes and public IDs use unbiased random allocation', () => {
  const crypto = read('auth-worker/src/crypto.ts')
  const db = read('auth-worker/src/db.ts')

  assert.match(crypto, /randomBelow/)
  assert.match(crypto, /randomBelow\(10_000\)/)
  assert.doesNotMatch(crypto, /%\s*10000/)

  assert.match(db, /randomBelow\(100_000_000\)/)
  assert.match(db, /`2IS\$\{randomBelow\(100_000_000\)/)
  assert.doesNotMatch(db, /\)\s*%\s*100000000/)
  assert.match(db, /CREATE UNIQUE INDEX IF NOT EXISTS idx_users_otya_id/)
})

test('OTYA public ID allocation retries collisions without exposing the internal UUID', () => {
  const db = read('auth-worker/src/db.ts')
  const account = read('src/app/account/page.tsx')

  assert.match(db, /for \(let attempt = 0; attempt < 16; attempt\+\+\)/)
  assert.match(db, /isUniqueConstraintError/)
  assert.match(account, /otya_id/)
  assert.doesNotMatch(account, /label=["']Account ID["'][^\n]*user\.id/)
})

test('Production auth responses normalize the immutable public Otya ID', () => {
  const source = read('auth-worker/src/production-entrypoint.ts')
  assert.match(source, /normalizeAccountResponse/)
  assert.match(source, /SELECT otya_id FROM users WHERE id = \? LIMIT 1/)
  assert.match(source, /user: \{ \.\.\.account, otya_id: row\.otya_id \}/)
  assert.match(source, /return normalizeAccountResponse\(response, runtimeEnv\)/)
})

test('Ask OTYA keeps a low-cost guest model and curated signed-in catalog', () => {
  const config = read('ai-worker/wrangler.toml')
  const chat = read('ai-worker/src/client-chat.mjs')

  assert.match(config, /AI_GUEST_MODEL = "llama-fast"/)
  assert.match(chat, /FALLBACK_GUEST_MODEL='llama-fast'/)
  assert.match(chat, /FALLBACK_SIGNED_DEFAULT='otya-smart'/)
})
