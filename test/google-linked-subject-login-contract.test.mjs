import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const entrypoint = readFileSync(new URL('../auth-worker/src/entrypoint.ts', import.meta.url), 'utf8')
const db = readFileSync(new URL('../auth-worker/src/db.ts', import.meta.url), 'utf8')

test('Google login pre-check resolves the immutable provider subject before treating an email as a new account', () => {
  assert.match(entrypoint, /interface GoogleTokenPayload \{[\s\S]*sub\?: string/)
  assert.match(entrypoint, /SELECT id FROM users WHERE google_id = \? LIMIT 1/)
  assert.match(entrypoint, /const bySubject =/)
  assert.match(entrypoint, /const existing = bySubject \?\? byEmail/)
  assert.match(entrypoint, /GOOGLE_IDENTITY_CONFLICT/)
})

test('legacy Google sign-in also resolves by subject first', () => {
  assert.match(db, /const bySubject = await getUserByGoogleId\(db, googleId\)/)
  assert.match(db, /if \(bySubject\) return refreshGoogleProfile\(db, bySubject\.id, user\)/)
})
