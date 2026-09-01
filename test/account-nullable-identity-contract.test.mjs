import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync(new URL('../src/app/account/page.tsx', import.meta.url), 'utf8')

test('Otya Space accepts provider-only accounts with no email', () => {
  assert.match(page, /email: string \| null/)
  assert.match(page, /if \(!next\?\.id\) return/)
  assert.doesNotMatch(page, /if \(!next\?\.email\) return/)
  assert.match(page, /user\.email\?\.split/)
  assert.match(page, /No email added/)
  assert.match(page, /user\.email && !user\.is_verified/)
  assert.doesNotMatch(page, /user\.email\.split/)
})
