import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const account = fs.readFileSync('src/account-profile.ts', 'utf8')
const schema = fs.readFileSync('schema.sql', 'utf8')
const repair = fs.readFileSync('scripts/repair-remote-schema.sh', 'utf8')

test('OTYA username identity is additive and globally unique', () => {
  assert.match(schema, /CREATE TABLE IF NOT EXISTS user_public_usernames/)
  assert.match(schema, /username\s+TEXT PRIMARY KEY COLLATE NOCASE/)
  assert.match(schema, /user_id\s+TEXT NOT NULL UNIQUE/)
  assert.doesNotMatch(schema, /ALTER TABLE users ADD COLUMN username/)
})

test('account endpoint supports choose and authenticated lookup by username', () => {
  assert.match(account, /'username'/)
  assert.match(account, /lookup_username/)
  assert.match(account, /USERNAME_PATTERN/)
  assert.match(account, /USERNAME_TAKEN/)
  assert.match(account, /USERNAME_NOT_FOUND/)
  assert.match(account, /SELECT u\.otya_id, p\.username, u\.name, u\.avatar_url/)
})

test('remote schema repair preserves existing users while adding usernames', () => {
  assert.match(repair, /CREATE TABLE IF NOT EXISTS user_public_usernames/)
  assert.match(repair, /CREATE UNIQUE INDEX IF NOT EXISTS idx_public_usernames_user/)
  assert.match(repair, /Existing production data is preserved/)
})
