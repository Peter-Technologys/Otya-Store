import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const source = readFileSync(new URL('../auth-worker/src/db.ts', import.meta.url), 'utf8')

test('preserved auth schemas upgrade required columns before dependent indexes', () => {
  assert.ok(source.includes("const USERS_TABLE_SQL = `"))
  assert.ok(source.includes("google_id: 'TEXT'"))
  assert.ok(source.includes("password_hash: 'TEXT'"))
  assert.ok(source.includes("is_verified: 'INTEGER DEFAULT 0'"))

  const ensureStart = source.indexOf('export async function ensureSchema')
  const ensureBody = source.slice(ensureStart, ensureStart + 700)
  const createBase = ensureBody.indexOf('await db.exec(USERS_TABLE_SQL)')
  const upgradeColumns = ensureBody.indexOf('await ensureUserColumns(db)')
  const createIndexes = ensureBody.indexOf('await db.exec(SCHEMA_SQL)')

  assert.ok(createBase >= 0)
  assert.ok(upgradeColumns > createBase)
  assert.ok(createIndexes > upgradeColumns)
})
