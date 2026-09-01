import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const production = readFileSync(new URL('../src/production-entrypoint.ts', import.meta.url), 'utf8')
const legacy = readFileSync(new URL('../src/index.ts', import.meta.url), 'utf8')
const wrangler = readFileSync(new URL('../wrangler.toml', import.meta.url), 'utf8')

test('production auth routes legacy mail through Resend without an Email Worker binding', () => {
  assert.match(production, /import \{ sendResendEmail \} from '\.\/resend'/)
  assert.match(production, /function resendCompatibleEnv/)
  assert.match(production, /await sendResendEmail\(apiKey,/)
  assert.match(production, /const runtimeEnv = resendCompatibleEnv\(env\)/)

  // Compatibility code may still call env.EMAIL.send, but production supplies
  // that object from Resend rather than a Cloudflare Email Worker binding.
  assert.match(legacy, /env\.EMAIL\.send/)
  assert.doesNotMatch(wrangler, /\[\[send_email\]\]|send_email|binding\s*=\s*["']EMAIL["']/)
})
