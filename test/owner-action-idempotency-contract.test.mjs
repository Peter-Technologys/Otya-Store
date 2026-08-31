import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('owner external writes are atomically claimed in D1 before provider execution', () => {
  const source = read('ai-worker/src/owner-actions.mjs')

  assert.match(source, /async function claimExecution\(env, action\)/)
  assert.match(source, /INSERT INTO owner_action_executions/)
  assert.match(source, /ON CONFLICT\(id\) DO NOTHING/)
  assert.match(source, /result\?\.meta\?\.changes/)

  const approve = source.match(/async function approve\(env, body\)[\s\S]*?\n}\n\nasync function cancel/)?.[0] ?? ''
  assert.ok(approve, 'approve implementation must be present')
  assert.ok(
    approve.indexOf('await claimExecution(env, action)') < approve.indexOf('await execute(env, action)'),
    'D1 must claim the action before any external provider write',
  )
})

test('owner email uses a stable provider idempotency key', () => {
  const source = read('ai-worker/src/owner-actions.mjs')
  assert.match(source, /'Idempotency-Key': `otya-owner-\$\{action\.id\}`/)
})

test('owner action execution ledger has a migration and safe runtime fallback', () => {
  const migration = read('migrations/0005_owner_action_execution_guard.sql')
  const source = read('ai-worker/src/owner-actions.mjs')

  assert.match(migration, /CREATE TABLE IF NOT EXISTS owner_action_executions/)
  assert.match(migration, /id TEXT PRIMARY KEY/)
  assert.match(source, /CREATE TABLE IF NOT EXISTS owner_action_executions/)
  assert.match(source, /D1 execution guard is not configured/)
})
