import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const router = readFileSync(new URL('../src/production-router.mjs', import.meta.url), 'utf8')
const gate = readFileSync(new URL('../src/components/OtyaSpaceGate.tsx', import.meta.url), 'utf8')
const db = readFileSync(new URL('../auth-worker/src/db.ts', import.meta.url), 'utf8')

test('OTYA exposes a public account ID that is separate from the private users.id primary key', () => {
  assert.match(db, /Format: 2IS########/)
  assert.match(db, /users\.id remains the private\/internal primary key/)
})

test('Space accepts console-style user scoped paths without exposing private identity fields', () => {
  assert.match(router, /function matchSpaceConsoleRoute\(pathname\)/)
  assert.match(router, /\^2IS\\d\{8\}\$/)
  assert.match(router, /section === 'overview'/)
  assert.match(router, /section === 'account\/sign-in-methods'/)
  assert.match(router, /accountSections = new Set/)
  assert.doesNotMatch(router, /email.*pathname|pathname.*email/i)
  assert.doesNotMatch(router, /token.*pathname|pathname.*token/i)
})

test('signed-in Space canonicalizes legacy paths and rejects a mismatched public ID cosmetically', () => {
  assert.match(gate, /session\.user\?\.otya_id/)
  assert.match(gate, /window\.location\.replace\(`\/u\/\$\{canonicalId\}\/\$\{section\}/)
  assert.match(gate, /routeId !== canonicalId/)
  assert.match(gate, /pathname === '\/account'/)
  assert.match(gate, /hash === '#security'/)
  assert.match(gate, /hash === '#sessions'/)
})
