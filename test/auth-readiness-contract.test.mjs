import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../auth-worker/src/production-entrypoint.ts', import.meta.url), 'utf8')

test('production auth fails closed when identity schema is unavailable', () => {
  assert.match(source, /import \{ ensureSchema \} from '\.\/db'/)
  assert.match(source, /let identitySchemaReady: Promise<void> \| null = null/)
  assert.match(source, /identitySchemaReady = ensureSchema\(env\.AUTH_DB\)\.catch/)
  assert.match(source, /identitySchemaReady = null/)
  assert.match(source, /AUTH_SCHEMA_UNAVAILABLE/)
  assert.match(source, /OTYA Account is temporarily unavailable/)
  assert.match(source, /503/)
})

test('browser preflight does not require D1 readiness', () => {
  assert.match(source, /if \(request\.method !== 'OPTIONS'\) \{/)
})
