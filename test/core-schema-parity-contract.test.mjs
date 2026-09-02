import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const read = path => readFileSync(new URL(`../${path}`, import.meta.url), 'utf8')

test('core D1 repair is additive and covers current API columns', () => {
  const repair = read('scripts/repair-core-schema.sh')

  assert.doesNotMatch(repair, /DROP\s+TABLE|DELETE\s+FROM\s+(bookmarks|eq_presets|ratings|devices|feedback|crash_reports)/i)
  for (const contract of [
    'ensure_column bookmarks duration_ms',
    'ensure_column eq_presets preset_name',
    'ensure_column user_preferences theme',
    'ensure_column user_preferences accent_color',
    'ensure_column feedback sentiment',
    'ensure_column feedback ai_processed',
    'ensure_column ratings user_id',
    'ensure_column devices model',
    'ensure_column devices android_version',
    'ensure_column devices locale',
    'ensure_column crash_reports user_id',
  ]) {
    assert.match(repair, new RegExp(contract.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
  }
  assert.match(repair, /UPDATE eq_presets SET preset_name = name/)
  assert.match(repair, /UPDATE eq_presets SET name = preset_name/)
})

test('fresh schema matches bookmark, equalizer, rating and device API contracts', () => {
  const schema = read('schema.sql')
  assert.match(schema, /CREATE TABLE IF NOT EXISTS bookmarks[\s\S]*duration_ms INTEGER DEFAULT 0/)
  assert.match(schema, /CREATE TABLE IF NOT EXISTS eq_presets[\s\S]*name\s+TEXT[\s\S]*preset_name TEXT NOT NULL/)
  assert.match(schema, /CREATE TABLE IF NOT EXISTS ratings[\s\S]*user_id\s+TEXT/)
  assert.match(schema, /CREATE TABLE IF NOT EXISTS devices[\s\S]*model\s+TEXT[\s\S]*android_version TEXT[\s\S]*locale\s+TEXT/)
  assert.match(schema, /CREATE TABLE IF NOT EXISTS feedback_replies/)
  assert.match(schema, /CREATE TABLE IF NOT EXISTS crash_reports/)
})

test('equalizer writes both compatibility and canonical names', () => {
  const route = read('src/app/api/equalizer/route.ts')
  assert.match(route, /COALESCE\(NULLIF\(preset_name, ''\), name\) AS preset_name/)
  assert.match(route, /INSERT INTO eq_presets \(id, user_id, name, preset_name, bands, is_default, created_at, updated_at\)/)
  assert.match(route, /name\s+= excluded\.name/)
  assert.match(route, /preset_name = excluded\.preset_name/)
})

test('selected core deploy repairs schema before runtime deployment', () => {
  const workflow = read('.github/workflows/deploy.yml')
  const coreStart = workflow.indexOf('deploy-core:')
  const verifyStart = workflow.indexOf('verify-production:')
  const coreJob = workflow.slice(coreStart, verifyStart)

  const repair = coreJob.indexOf('Repair and verify preserved Otya core D1')
  const deploy = coreJob.indexOf('Build and deploy OTYA core')
  assert.ok(repair >= 0)
  assert.ok(deploy > repair)
  assert.match(coreJob, /bash scripts\/repair-core-schema\.sh/)
  assert.match(coreJob, /CLOUDFLARE_ACCOUNT_ID/)
  assert.match(coreJob, /CLOUDFLARE_API_TOKEN/)
})
