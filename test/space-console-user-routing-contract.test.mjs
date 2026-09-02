import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const router = readFileSync(new URL('../src/production-router.mjs', import.meta.url), 'utf8')
const gate = readFileSync(new URL('../src/components/OtyaSpaceGate.tsx', import.meta.url), 'utf8')
const db = readFileSync(new URL('../auth-worker/src/db.ts', import.meta.url), 'utf8')

test('Otya exposes a public account ID that is separate from the private users.id primary key', () => {
  assert.match(db, /Format: 2IS########/)
  assert.match(db, /users\.id remains the private\/internal primary key/)
})

test('Space accepts console-style user scoped paths without exposing private identity fields', () => {
  assert.match(router, /function matchSpaceConsoleRoute\(pathname\)/)
  assert.match(router, /\^2IS\\d\{8\}\$/)
  assert.match(router, /const section = parts\.slice\(2\)\.join\('\/'\) \|\| 'overview'/)
  assert.match(router, /const direct = new Map/)
  assert.match(router, /\['overview', '\/space\/'\]/)
  assert.match(router, /\['account\/sign-in-methods', '\/account\/sign-in-methods\/'\]/)
  assert.match(router, /\['providers', '\/account\/sign-in-methods\/'\]/)
  assert.match(router, /return \{ publicId, section: 'overview', target: '\/space\/', unknown: true \}/)
  assert.doesNotMatch(router, /email.*pathname|pathname.*email/i)
  assert.doesNotMatch(router, /token.*pathname|pathname.*token/i)
})

test('signed-in Space canonicalizes legacy paths and a mismatched public ID to the active session', () => {
  assert.match(gate, /const verifiedUser = session\.user \?\? \{\}/)
  assert.match(gate, /const publicId = verifiedUser\.otya_id\?\.trim\(\)/)
  assert.match(gate, /canonicalizeSpaceLocation\(publicId\)/)
  assert.match(gate, /window\.location\.replace\(`\/u\/\$\{canonicalId\}\/\$\{section\}/)
  assert.match(gate, /routeId !== canonicalId/)
  assert.match(gate, /pathname === '\/account'/)
  assert.match(gate, /hash === '#security'/)
  assert.match(gate, /hash === '#sessions'/)
})
