import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const page = readFileSync(new URL('../src/app/account/page.tsx', import.meta.url), 'utf8')

test('Otya Space accepts provider-only accounts with no email', () => {
  assert.match(page, /email: string \| null/)
  assert.match(page, /if \(!response\.ok \|\| !data\.user\) throw/)
  assert.doesNotMatch(page, /if \(!data\.user\.email\) throw/)
  assert.match(page, /user\?\.email \? 'No primary email'/)
  assert.match(page, /value=\{user\?\.email \|\| ''\}/)
  assert.match(page, /placeholder="No primary email added"/)
  assert.match(page, /!user\?\.is_verified && user\?\.email/)
  assert.doesNotMatch(page, /user\.email\.split/)
})
