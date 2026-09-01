import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const secretSync = readFileSync(new URL('../.github/workflows/telegram-auth-secret.yml', import.meta.url), 'utf8')
const telegramSmoke = readFileSync(new URL('../.github/workflows/telegram-provider-smoke.yml', import.meta.url), 'utf8')

test('Telegram credential sync waits for canonical production deploy', () => {
  assert.match(secretSync, /workflow_run:/)
  assert.match(secretSync, /workflows: \['Deploy OTYA to Cloudflare'\]/)
  assert.match(secretSync, /workflow_run\.conclusion == 'success'/)
  assert.match(secretSync, /workflow_run\.head_branch == 'main'/)
  assert.match(secretSync, /wrangler secret put TELEGRAM_BOT_TOKEN/)
})

test('Telegram provider smoke waits for Telegram credential sync', () => {
  assert.match(telegramSmoke, /workflow_run:/)
  assert.match(telegramSmoke, /workflows: \['Sync Telegram Auth Credential'\]/)
  assert.match(telegramSmoke, /workflow_run\.conclusion == 'success'/)
  assert.match(telegramSmoke, /workflow_run\.head_branch == 'main'/)
  assert.match(telegramSmoke, /Require Telegram Sign-In provider/)
  assert.match(telegramSmoke, /grep -q 'authorization_url'/)
})
