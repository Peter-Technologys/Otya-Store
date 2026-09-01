import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const auth = readFileSync(new URL('../auth-worker/src/telegram-login.ts', import.meta.url), 'utf8')
const proxy = readFileSync(new URL('../src/app/api/auth/telegram/[...path]/route.ts', import.meta.url), 'utf8')
const page = readFileSync(new URL('../src/app/telegram-login/page.tsx', import.meta.url), 'utf8')
const config = readFileSync(new URL('../next.config.mjs', import.meta.url), 'utf8')
const wrangler = readFileSync(new URL('../auth-worker/wrangler.toml', import.meta.url), 'utf8')
const secretWorkflow = readFileSync(new URL('../.github/workflows/telegram-auth-secret.yml', import.meta.url), 'utf8')

test('Telegram login prefers OIDC but has a signed widget fallback', () => {
  assert.match(auth, /oidcConfigured = Boolean\(env\.TELEGRAM_LOGIN_CLIENT_ID && env\.TELEGRAM_LOGIN_CLIENT_SECRET\)/)
  assert.match(auth, /widgetConfigured = Boolean\(env\.TELEGRAM_BOT_TOKEN && env\.TELEGRAM_LOGIN_BOT_USERNAME\)/)
  assert.match(auth, /provider_mode: 'widget'/)
  assert.match(auth, /crypto\.subtle\.digest\('SHA-256'.*botToken/s)
  assert.match(auth, /crypto\.subtle\.verify\(\s*'HMAC'/s)
  assert.match(auth, /telegram_widget:\$\{state\}/)
  assert.match(auth, /timestamp < now - STATE_TTL/)
})

test('widget handoff is constrained to the canonical OTYA callback', () => {
  assert.match(proxy, /callback\.hostname !== 'petersmartlink\.com'/)
  assert.match(proxy, /callback\.pathname !== '\/api\/auth\/telegram\/widget\/callback'/)
  assert.match(proxy, /!callback\.searchParams\.get\('state'\)/)
  assert.match(page, /url\.hostname !== 'petersmartlink\.com'/)
  assert.match(page, /data-auth-url/)
  assert.match(page, /https:\/\/telegram\.org\/js\/telegram-widget\.js\?22/)
})

test('Telegram browser origins are explicitly allowed without weakening frame ancestors', () => {
  assert.match(config, /https:\/\/telegram\.org/)
  assert.match(config, /https:\/\/oauth\.telegram\.org/)
  assert.match(config, /frame-ancestors 'none'/)
})

test('auth worker receives only the secret needed to verify widget responses', () => {
  assert.match(wrangler, /TELEGRAM_LOGIN_BOT_USERNAME = "OtyaPlayerBot"/)
  assert.match(secretWorkflow, /secrets\.TELEGRAM_BOT_TOKEN/)
  assert.match(secretWorkflow, /wrangler secret put TELEGRAM_BOT_TOKEN/)
  assert.doesNotMatch(wrangler, /TELEGRAM_BOT_TOKEN\s*=/)
})
