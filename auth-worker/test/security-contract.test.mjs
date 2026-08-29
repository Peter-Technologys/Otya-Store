import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = (path) => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('production auth accepts only configured Android and Web Google audiences', () => {
  const wrapper = read('src/production-entrypoint.ts')
  const config = read('wrangler.toml')

  assert.match(config, /GOOGLE_CLIENT_ID = "82776565585-77b1t8epvmn3mpdvstdg1rtprlju4suv\.apps\.googleusercontent\.com"/)
  assert.match(config, /GOOGLE_WEB_CLIENT_ID = "82776565585-obr8k53b8n6djsggissv8qne81cm3u5u\.apps\.googleusercontent\.com"/)
  assert.match(wrapper, /configuredGoogleAudiences/)
  assert.match(wrapper, /isAllowedGoogleAudience/)
  assert.match(wrapper, /accounts\.google\.com/)
  assert.match(wrapper, /expiry <= now/)
  assert.match(wrapper, /email_verified/)
})

test('production auth remains on verified Firebase project and Resend path', () => {
  const config = read('wrangler.toml')
  const entrypoint = read('src/entrypoint.ts')
  const resend = read('src/resend.ts')

  assert.match(config, /^main = "src\/production-entrypoint\.ts"$/m)
  assert.match(config, /^FIREBASE_PROJECT_ID = "otya-player"$/m)
  assert.doesNotMatch(config, /binding\s*=\s*"EMAIL"|\[\[send_email\]\]/i)
  assert.match(entrypoint, /createEmailAdapter\(env\.RESEND_API_KEY\)/)
  assert.match(resend, /https:\/\/api\.resend\.com\/emails/)
})

test('server credentials are never configured as source values', () => {
  const files = [
    read('wrangler.toml'),
    read('src/production-entrypoint.ts'),
    read('src/entrypoint.ts'),
    read('src/resend.ts'),
  ].join('\n')

  assert.doesNotMatch(files, /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/)
  assert.doesNotMatch(files, /\bre_[A-Za-z0-9_-]{20,}\b/)
})
