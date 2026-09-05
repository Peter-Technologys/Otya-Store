import assert from 'node:assert/strict'
import fs from 'node:fs'
import test from 'node:test'

const control = fs.readFileSync('src/lib/together-control.ts', 'utf8')
const migration = fs.readFileSync('migrations/0007_together_control_plane.sql', 'utf8')
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'))

const routeFiles = [
  'src/app/api/together/rooms/route.ts',
  'src/app/api/together/rooms/[roomId]/route.ts',
  'src/app/api/together/rooms/[roomId]/join/route.ts',
  'src/app/api/together/rooms/[roomId]/signals/route.ts',
]

test('Together exposes the mobile control-plane routes', () => {
  for (const path of routeFiles) assert.equal(fs.existsSync(path), true, path)
  assert.match(control, /createTogetherRoom/)
  assert.match(control, /joinTogetherRoom/)
  assert.match(control, /getTogetherRoom/)
  assert.match(control, /closeTogetherRoom/)
  assert.match(control, /sendTogetherSignal/)
  assert.match(control, /pollTogetherSignals/)
})

test('Together requires OTYA identity and App Check without embedding app secrets', () => {
  assert.match(control, /verifyFirebaseAppCheck/)
  assert.match(control, /appCheckEnforced/)
  assert.match(control, /extractBearerToken/)
  assert.match(control, /verifyJwtViaService/)
  assert.doesNotMatch(control, /AUTH_JWT_SECRET|INTERNAL_SECRET|OTYA_STORE_ADMIN_TOKEN/)
})

test('Together stores only ephemeral room and signaling metadata', () => {
  assert.match(migration, /invite_token_hash TEXT NOT NULL/)
  assert.match(migration, /CHECK \(type IN \('offer', 'answer', 'ice', 'bye'\)\)/)
  assert.match(control, /sha256Hex\(inviteToken\)/)
  assert.match(control, /invite_token_hash = ''/)
  assert.match(control, /sender_user_id != \?/)
  assert.match(control, /MAX_SIGNAL_PAYLOAD_BYTES = 48 \* 1024/)
  assert.doesNotMatch(migration, /video_blob|media_blob|file_blob|chunk_data|chat_message/i)
})

test('Together remains one-host one-guest and short-lived in v1', () => {
  assert.match(control, /ROOM_TTL_MS = 2 \* 60 \* 60 \* 1000/)
  assert.match(control, /guest_user_id !== null/)
  assert.match(control, /ROOM_FULL/)
  assert.match(control, /One active hosted room per account/)
})

test('authorized core deploy applies the idempotent Together schema first', () => {
  assert.equal(
    pkg.scripts['migrate:together'],
    'wrangler d1 execute otya-store-db --remote --file=migrations/0007_together_control_plane.sql',
  )
  assert.match(pkg.scripts.deploy, /^npm run migrate:together && /)
  assert.match(migration, /CREATE TABLE IF NOT EXISTS together_rooms/)
  assert.match(migration, /CREATE TABLE IF NOT EXISTS together_signals/)
})
