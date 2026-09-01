import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const wrapper = readFileSync(new URL('../auth-worker/src/production-entrypoint-miniapp.ts', import.meta.url), 'utf8')
const miniAuth = readFileSync(new URL('../auth-worker/src/telegram-miniapp.ts', import.meta.url), 'utf8')
const proxy = readFileSync(new URL('../src/app/api/auth/telegram/[...path]/route.ts', import.meta.url), 'utf8')
const config = readFileSync(new URL('../next.config.mjs', import.meta.url), 'utf8')
const wrangler = readFileSync(new URL('../auth-worker/wrangler.toml', import.meta.url), 'utf8')
const secretWorkflowUrl = new URL('../.github/workflows/telegram-auth-secret.yml', import.meta.url)

test('Telegram browser Sign-In stays OIDC-only while Mini App uses Secrets Store HMAC', () => {
  assert.match(wrapper, /TELEGRAM_MINIAPP_BOT_TOKEN/)
  assert.match(wrapper, /TELEGRAM_BOT_TOKEN: undefined/)
  assert.match(wrapper, /url\.pathname\.startsWith\('\/auth\/telegram\/'\)/)
  assert.match(miniAuth, /WebAppData/)
  assert.match(miniAuth, /TELEGRAM_BOT_TOKEN\?\.get/)
  assert.match(miniAuth, /constantTimeHexEqual/)
  assert.match(miniAuth, /authDate < now - MAX_AGE_SECONDS/)
})

test('Mini App auth proxy is constrained to the private AUTH service and secure cookies', () => {
  assert.match(proxy, /AUTH_PREFIX\s*=\s*'\/auth\/telegram\/'/)
  assert.match(proxy, /\.AUTH as AuthService/)
  assert.match(proxy, /__Host-otya_access/)
  assert.match(proxy, /__Host-otya_refresh/)
  assert.match(proxy, /delete safe\.access_token/)
  assert.match(proxy, /delete safe\.refresh_token/)
})

test('Telegram browser origins remain allowed without weakening frame ancestors', () => {
  assert.match(config, /https:\/\/telegram\.org/)
  assert.match(config, /https:\/\/oauth\.telegram\.org/)
  assert.match(config, /frame-ancestors 'none'/)
})

test('auth reads Telegram bot credential from Cloudflare Secrets Store without GitHub duplication', () => {
  assert.match(wrangler, /\[\[secrets_store_secrets\]\]/)
  assert.match(wrangler, /binding\s*=\s*"TELEGRAM_MINIAPP_BOT_TOKEN"/)
  assert.match(wrangler, /secret_name\s*=\s*"TELEGRAM_BOT_TOKEN"/)
  assert.equal(existsSync(secretWorkflowUrl), false)
})
