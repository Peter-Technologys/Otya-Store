import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, existsSync } from 'node:fs'

const telegramSmoke = readFileSync(new URL('../.github/workflows/telegram-provider-smoke.yml', import.meta.url), 'utf8')
const obsoleteSecretSync = new URL('../.github/workflows/telegram-auth-secret.yml', import.meta.url)

test('Telegram Sign-In smoke follows the canonical production deploy directly', () => {
  assert.equal(existsSync(obsoleteSecretSync), false)
  assert.match(telegramSmoke, /workflow_run:/)
  assert.match(telegramSmoke, /workflows: \['Deploy OTYA to Cloudflare'\]/)
  assert.match(telegramSmoke, /workflow_run\.conclusion == 'success'/)
  assert.match(telegramSmoke, /workflow_run\.head_branch == 'main'/)
  assert.match(telegramSmoke, /Require Telegram Sign-In provider/)
  assert.match(telegramSmoke, /grep -q 'authorization_url'/)
})
