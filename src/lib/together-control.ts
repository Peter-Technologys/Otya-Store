import { appCheckEnforced, verifyFirebaseAppCheck } from '@/lib/firebase_app_check'
import { extractBearerToken, verifyJwtViaService } from '@/lib/auth-service'
import { getDB, type D1 } from '@/lib/d1'
import { secureJson } from '@/lib/response'

const ROOM_TTL_MS = 2 * 60 * 60 * 1000
const SIGNAL_RETENTION_MS = 30 * 60 * 1000
const STALE_ROOM_RETENTION_MS = 24 * 60 * 60 * 1000
const MAX_SIGNAL_PAYLOAD_BYTES = 48 * 1024
const MAX_SIGNALS_PER_POLL = 128
const USERNAME_PATTERN = /^[a-z][a-z0-9_]{2,23}$/
const ROOM_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const SIGNAL_TYPES = new Set(['offer', 'answer', 'ice', 'bye'])

interface AuthBinding {
  fetch(request: Request): Promise<Response>
}

interface TogetherAuth {
  userId: string
  token: string
}

interface PublicIdentity {
  otya_id: string
  username: string
  name: string | null
  avatar_url: string | null
}

interface TogetherRoomRow {
  id: string
  host_user_id: string
  guest_user_id: string | null
  invited_username: string
  invite_token_hash: string
  status: 'waiting' | 'watching' | 'closed'
  host_profile_json: string
  guest_profile_json: string
  created_at: string
  expires_at: string
  joined_at: string | null
  closed_at: string | null
  last_activity_at: string
}

interface TogetherSignalRow {
  seq: number
  room_id: string
  sender_user_id: string
  sender_role: 'host' | 'guest'
  type: string
  payload_json: string | null
  created_at: string
}

function errorResponse(error: string, code: string, status: number): Response {
  return secureJson({ error, code }, { status })
}

function normalizeUsername(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const username = value.trim().replace(/^@+/, '').toLowerCase()
  return USERNAME_PATTERN.test(username) ? username : null
}

function normalizeIdentity(value: unknown): PublicIdentity | null {
  if (!value || typeof value !== 'object') return null
  const raw = value as Record<string, unknown>
  const username = normalizeUsername(raw.username)
  const otyaId = typeof raw.otya_id === 'string' ? raw.otya_id.trim().toUpperCase() : ''
  if (!username || !otyaId) return null
  const name = typeof raw.name === 'string' && raw.name.trim()
    ? raw.name.trim().slice(0, 120)
    : null
  const avatar = typeof raw.avatar_url === 'string' && raw.avatar_url.trim()
    ? raw.avatar_url.trim().slice(0, 1000)
    : null
  return {
    otya_id: otyaId,
    username,
    name,
    avatar_url: avatar,
  }
}

async function readJson(response: Response): Promise<Record<string, unknown> | null> {
  try {
    const value = await response.json()
    return value && typeof value === 'object' ? value as Record<string, unknown> : null
  } catch {
    return null
  }
}

async function authAccount(
  env: Record<string, unknown>,
  token: string,
  lookupUsername?: string,
): Promise<PublicIdentity | null> {
  const auth = env.AUTH as AuthBinding | undefined
  if (!auth) return null
  const url = new URL('https://auth/auth/account')
  if (lookupUsername) url.searchParams.set('lookup_username', lookupUsername)
  const response = await auth.fetch(new Request(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` },
  }))
  if (!response.ok) return null
  const data = await readJson(response)
  return normalizeIdentity(data?.user)
}

async function authenticate(
  request: Request,
  env: Record<string, unknown>,
): Promise<TogetherAuth | Response> {
  const appCheck = await verifyFirebaseAppCheck(request, env)
  if (appCheckEnforced(env) && !appCheck.valid) {
    return errorResponse('App attestation required', 'APP_CHECK_REQUIRED', 401)
  }

  const token = extractBearerToken(request.headers.get('Authorization'))
  if (!token) {
    return errorResponse('Sign in to use Anywhere Together.', 'SIGN_IN_REQUIRED', 401)
  }
  const verified = await verifyJwtViaService(env, token)
  if (!verified.ok || !verified.user_id) {
    return errorResponse(
      verified.error ?? 'Your OTYA session is no longer valid.',
      'SIGN_IN_REQUIRED',
      401,
    )
  }
  return { userId: verified.user_id, token }
}

function isResponse(value: TogetherAuth | Response): value is Response {
  return value instanceof Response
}

function nowIso(): string {
  return new Date().toISOString()
}

function expiresIso(): string {
  return new Date(Date.now() + ROOM_TTL_MS).toISOString()
}

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false
  let difference = 0
  for (let index = 0; index < a.length; index++) {
    difference |= a.charCodeAt(index) ^ b.charCodeAt(index)
  }
  return difference === 0
}

function profileView(
  identity: PublicIdentity,
  role: 'host' | 'guest',
  connected: boolean,
): Record<string, unknown> {
  return {
    role,
    connected,
    otya_id: identity.otya_id,
    username: identity.username,
    name: identity.name,
    avatar_url: identity.avatar_url,
  }
}

function parseIdentityJson(value: string): PublicIdentity {
  try {
    const parsed = normalizeIdentity(JSON.parse(value))
    if (parsed) return parsed
  } catch { /* invalid rows fail closed below */ }
  return { otya_id: '', username: '', name: null, avatar_url: null }
}

function roomView(row: TogetherRoomRow): Record<string, unknown> {
  const host = parseIdentityJson(row.host_profile_json)
  const guest = parseIdentityJson(row.guest_profile_json)
  const open = row.status !== 'closed' && Date.parse(row.expires_at) > Date.now()
  return {
    room_id: row.id,
    status: open ? row.status : 'closed',
    created_at: row.created_at,
    expires_at: row.expires_at,
    host: profileView(host, 'host', open),
    guest: profileView(guest, 'guest', open && row.guest_user_id !== null),
  }
}

async function readRoom(db: D1, roomId: string): Promise<TogetherRoomRow | null> {
  return db.prepare(`
    SELECT id, host_user_id, guest_user_id, invited_username, invite_token_hash,
           status, host_profile_json, guest_profile_json, created_at, expires_at,
           joined_at, closed_at, last_activity_at
    FROM together_rooms WHERE id = ? LIMIT 1
  `).bind(roomId).first<TogetherRoomRow>()
}

function roomIsExpired(room: TogetherRoomRow): boolean {
  const expiresAt = Date.parse(room.expires_at)
  return !Number.isFinite(expiresAt) || expiresAt <= Date.now()
}

function memberRole(room: TogetherRoomRow, userId: string): 'host' | 'guest' | null {
  if (room.host_user_id === userId) return 'host'
  if (room.guest_user_id === userId) return 'guest'
  return null
}

async function activeMemberRoom(
  db: D1,
  roomId: string,
  userId: string,
): Promise<TogetherRoomRow | Response> {
  if (!ROOM_ID_PATTERN.test(roomId)) {
    return errorResponse('Together room is unavailable.', 'ROOM_NOT_FOUND', 404)
  }
  const room = await readRoom(db, roomId)
  if (!room || memberRole(room, userId) === null) {
    return errorResponse('Together room is unavailable.', 'ROOM_NOT_FOUND', 404)
  }
  if (room.status === 'closed' || roomIsExpired(room)) {
    return errorResponse('This Together room has ended.', 'ROOM_CLOSED', 410)
  }
  return room
}

async function cleanupOldRows(db: D1): Promise<void> {
  const signalCutoff = new Date(Date.now() - SIGNAL_RETENTION_MS).toISOString()
  const roomCutoff = new Date(Date.now() - STALE_ROOM_RETENTION_MS).toISOString()
  await db.prepare('DELETE FROM together_signals WHERE created_at < ?')
    .bind(signalCutoff)
    .run()
  await db.prepare('DELETE FROM together_rooms WHERE expires_at < ?')
    .bind(roomCutoff)
    .run()
}

function contentLengthTooLarge(request: Request, maxBytes: number): boolean {
  const raw = request.headers.get('content-length')
  if (!raw) return false
  const size = Number(raw)
  return Number.isFinite(size) && size > maxBytes
}

export async function createTogetherRoom(
  request: Request,
  env: Record<string, unknown>,
): Promise<Response> {
  const auth = await authenticate(request, env)
  if (isResponse(auth)) return auth
  if (contentLengthTooLarge(request, 4096)) {
    return errorResponse('Together request is too large.', 'REQUEST_TOO_LARGE', 413)
  }

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return errorResponse('Invalid JSON body', 'INVALID_JSON', 400)
  }
  const inviteUsername = normalizeUsername(body.invite_username)
  if (!inviteUsername) {
    return errorResponse('Choose a valid OTYA username.', 'INVALID_USERNAME', 400)
  }

  const [hostIdentity, guestIdentity] = await Promise.all([
    authAccount(env, auth.token),
    authAccount(env, auth.token, inviteUsername),
  ])
  if (!hostIdentity) {
    return errorResponse('Choose your OTYA username before starting Together.', 'USERNAME_REQUIRED', 409)
  }
  if (!guestIdentity) {
    return errorResponse('OTYA user not found.', 'USERNAME_NOT_FOUND', 404)
  }
  if (hostIdentity.username === guestIdentity.username) {
    return errorResponse('Choose someone else to watch with.', 'SELF_INVITE', 409)
  }

  const db = getDB(env)
  await cleanupOldRows(db)

  const roomId = crypto.randomUUID()
  const inviteToken = randomToken()
  const inviteHash = await sha256Hex(inviteToken)
  const createdAt = nowIso()
  const expiresAt = expiresIso()

  // One active hosted room per account keeps v1 simple and prevents stale
  // invites from silently remaining usable after the host starts a new room.
  await db.prepare(`
    UPDATE together_rooms
    SET status = 'closed', closed_at = ?, last_activity_at = ?
    WHERE host_user_id = ? AND status != 'closed' AND expires_at > ?
  `).bind(createdAt, createdAt, auth.userId, createdAt).run()

  await db.prepare(`
    INSERT INTO together_rooms (
      id, host_user_id, guest_user_id, invited_username, invite_token_hash,
      status, host_profile_json, guest_profile_json, created_at, expires_at,
      joined_at, closed_at, last_activity_at
    ) VALUES (?, ?, NULL, ?, ?, 'waiting', ?, ?, ?, ?, NULL, NULL, ?)
  `).bind(
    roomId,
    auth.userId,
    inviteUsername,
    inviteHash,
    JSON.stringify(hostIdentity),
    JSON.stringify(guestIdentity),
    createdAt,
    expiresAt,
    createdAt,
  ).run()

  const room = await readRoom(db, roomId)
  if (!room) return errorResponse('Together room could not be created.', 'ROOM_CREATE_FAILED', 500)
  return secureJson({ room: roomView(room), invite_token: inviteToken }, { status: 201 })
}

export async function joinTogetherRoom(
  request: Request,
  env: Record<string, unknown>,
  roomId: string,
): Promise<Response> {
  const auth = await authenticate(request, env)
  if (isResponse(auth)) return auth
  if (!ROOM_ID_PATTERN.test(roomId)) {
    return errorResponse('Together room is unavailable.', 'ROOM_NOT_FOUND', 404)
  }
  if (contentLengthTooLarge(request, 4096)) {
    return errorResponse('Together request is too large.', 'REQUEST_TOO_LARGE', 413)
  }

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return errorResponse('Invalid JSON body', 'INVALID_JSON', 400)
  }
  const inviteToken = typeof body.invite_token === 'string' ? body.invite_token.trim() : ''
  if (!/^[a-f0-9]{64}$/.test(inviteToken)) {
    return errorResponse('That Together invite is not valid.', 'INVALID_INVITE', 401)
  }

  const db = getDB(env)
  const room = await readRoom(db, roomId)
  if (!room) return errorResponse('Together room is unavailable.', 'ROOM_NOT_FOUND', 404)
  if (room.status === 'closed' || roomIsExpired(room)) {
    return errorResponse('This Together room has ended.', 'ROOM_CLOSED', 410)
  }
  if (room.host_user_id === auth.userId) {
    return errorResponse('The host cannot join as the guest.', 'SELF_JOIN', 409)
  }
  if (room.guest_user_id === auth.userId) {
    return secureJson({ room: roomView(room) })
  }
  if (room.guest_user_id !== null) {
    return errorResponse('This Together room already has a guest.', 'ROOM_FULL', 409)
  }

  const currentIdentity = await authAccount(env, auth.token)
  if (!currentIdentity || currentIdentity.username !== room.invited_username.toLowerCase()) {
    return errorResponse('This Together invite belongs to another OTYA user.', 'INVITE_NOT_FOR_USER', 403)
  }
  const suppliedHash = await sha256Hex(inviteToken)
  if (!room.invite_token_hash || !timingSafeEqual(room.invite_token_hash, suppliedHash)) {
    return errorResponse('That Together invite is not valid anymore.', 'INVALID_INVITE', 401)
  }

  const joinedAt = nowIso()
  const result = await db.prepare(`
    UPDATE together_rooms
    SET guest_user_id = ?, guest_profile_json = ?, invite_token_hash = '',
        status = 'watching', joined_at = ?, last_activity_at = ?
    WHERE id = ? AND guest_user_id IS NULL AND status = 'waiting'
  `).bind(
    auth.userId,
    JSON.stringify(currentIdentity),
    joinedAt,
    joinedAt,
    roomId,
  ).run()
  if (result.meta.changes !== 1) {
    const latest = await readRoom(db, roomId)
    if (latest?.guest_user_id === auth.userId) return secureJson({ room: roomView(latest) })
    return errorResponse('This Together room already changed.', 'ROOM_CONFLICT', 409)
  }

  const joined = await readRoom(db, roomId)
  if (!joined) return errorResponse('Together room is unavailable.', 'ROOM_NOT_FOUND', 404)
  return secureJson({ room: roomView(joined) })
}

export async function getTogetherRoom(
  request: Request,
  env: Record<string, unknown>,
  roomId: string,
): Promise<Response> {
  const auth = await authenticate(request, env)
  if (isResponse(auth)) return auth
  const db = getDB(env)
  const room = await activeMemberRoom(db, roomId, auth.userId)
  if (room instanceof Response) return room
  return secureJson({ room: roomView(room) })
}

export async function closeTogetherRoom(
  request: Request,
  env: Record<string, unknown>,
  roomId: string,
): Promise<Response> {
  const auth = await authenticate(request, env)
  if (isResponse(auth)) return auth
  const db = getDB(env)
  const room = await activeMemberRoom(db, roomId, auth.userId)
  if (room instanceof Response) return room
  const closedAt = nowIso()
  await db.prepare(`
    UPDATE together_rooms
    SET status = 'closed', closed_at = ?, last_activity_at = ?
    WHERE id = ?
  `).bind(closedAt, closedAt, roomId).run()
  await db.prepare('DELETE FROM together_signals WHERE room_id = ?').bind(roomId).run()
  return secureJson({ ok: true })
}

export async function sendTogetherSignal(
  request: Request,
  env: Record<string, unknown>,
  roomId: string,
): Promise<Response> {
  const auth = await authenticate(request, env)
  if (isResponse(auth)) return auth
  if (contentLengthTooLarge(request, MAX_SIGNAL_PAYLOAD_BYTES + 4096)) {
    return errorResponse('Together signal is too large.', 'SIGNAL_TOO_LARGE', 413)
  }

  let body: Record<string, unknown>
  try {
    body = await request.json() as Record<string, unknown>
  } catch {
    return errorResponse('Invalid JSON body', 'INVALID_JSON', 400)
  }
  const type = typeof body.type === 'string' ? body.type.trim().toLowerCase() : ''
  if (!SIGNAL_TYPES.has(type)) {
    return errorResponse('Unsupported Together signal.', 'INVALID_SIGNAL', 400)
  }

  let payloadJson: string | null = null
  if (body.payload !== undefined && body.payload !== null) {
    try {
      payloadJson = JSON.stringify(body.payload)
    } catch {
      return errorResponse('Together signal payload is invalid.', 'INVALID_SIGNAL', 400)
    }
    if (new TextEncoder().encode(payloadJson).byteLength > MAX_SIGNAL_PAYLOAD_BYTES) {
      return errorResponse('Together signal is too large.', 'SIGNAL_TOO_LARGE', 413)
    }
  }

  const db = getDB(env)
  const room = await activeMemberRoom(db, roomId, auth.userId)
  if (room instanceof Response) return room
  if (room.status !== 'watching' || room.guest_user_id === null) {
    return errorResponse('Wait for your friend to join Together.', 'ROOM_NOT_READY', 409)
  }
  const role = memberRole(room, auth.userId)
  if (!role) return errorResponse('Together room is unavailable.', 'ROOM_NOT_FOUND', 404)
  const createdAt = nowIso()
  const inserted = await db.prepare(`
    INSERT INTO together_signals
      (room_id, sender_user_id, sender_role, type, payload_json, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(roomId, auth.userId, role, type, payloadJson, createdAt).run()
  const seq = inserted.meta.last_row_id
  if (!Number.isInteger(seq) || Number(seq) <= 0) {
    return errorResponse('Together signal could not be queued.', 'SIGNAL_FAILED', 500)
  }
  await db.prepare('UPDATE together_rooms SET last_activity_at = ? WHERE id = ?')
    .bind(createdAt, roomId)
    .run()
  return secureJson({ signal_id: String(seq) }, { status: 202 })
}

export async function pollTogetherSignals(
  request: Request,
  env: Record<string, unknown>,
  roomId: string,
): Promise<Response> {
  const auth = await authenticate(request, env)
  if (isResponse(auth)) return auth
  const db = getDB(env)
  const room = await activeMemberRoom(db, roomId, auth.userId)
  if (room instanceof Response) return room
  if (room.status !== 'watching' || room.guest_user_id === null) {
    return secureJson({ signals: [] })
  }

  const url = new URL(request.url)
  const rawAfter = url.searchParams.get('after')?.trim() ?? ''
  const after = rawAfter ? Number(rawAfter) : 0
  if (!Number.isSafeInteger(after) || after < 0) {
    return errorResponse('Invalid Together signal cursor.', 'INVALID_CURSOR', 400)
  }
  const cutoff = new Date(Date.now() - SIGNAL_RETENTION_MS).toISOString()
  const { results } = await db.prepare(`
    SELECT seq, room_id, sender_user_id, sender_role, type, payload_json, created_at
    FROM together_signals
    WHERE room_id = ? AND seq > ? AND sender_user_id != ? AND created_at >= ?
    ORDER BY seq ASC
    LIMIT ?
  `).bind(roomId, after, auth.userId, cutoff, MAX_SIGNALS_PER_POLL)
    .all<TogetherSignalRow>()

  const signals = results.map(row => {
    let payload: unknown = null
    if (row.payload_json) {
      try { payload = JSON.parse(row.payload_json) } catch { payload = null }
    }
    return {
      id: String(row.seq),
      room_id: row.room_id,
      type: row.type,
      payload,
      sender_role: row.sender_role,
      created_at: row.created_at,
    }
  })
  return secureJson({ signals })
}

export function togetherOptions(): Response {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': 'https://petersmartlink.com',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Firebase-AppCheck',
      'Access-Control-Max-Age': '86400',
      'Cache-Control': 'no-store',
      'Vary': 'Origin',
    },
  })
}
