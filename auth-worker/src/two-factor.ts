import { verifyJwt } from './crypto'
import type { D1Database } from './db'

interface KVNamespaceLike {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

export interface TwoFactorEnv {
  AUTH_DB: D1Database
  AUTH_KV: KVNamespaceLike
  AUTH_JWT_SECRET: string
  ACCOUNT_ENCRYPTION_KEY?: string
}

type TwoFactorRow = {
  user_id: string
  encrypted_secret: string
  recovery_hashes: string
  enabled_at: string
  updated_at: string
}

const PENDING_TTL = 10 * 60
const TOTP_STEP = 30
const TOTP_DIGITS = 6
const RECOVERY_COUNT = 10
const RECOVERY_LENGTH = 12

function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}

async function requireUser(request: Request, env: TwoFactorEnv): Promise<string | null> {
  const auth = request.headers.get('Authorization')
  if (!auth?.startsWith('Bearer ')) return null
  const payload = await verifyJwt(auth.slice(7), env.AUTH_JWT_SECRET)
  return payload?.sub ?? null
}

export async function ensureTwoFactorSchema(db: D1Database): Promise<void> {
  // Use a prepared CREATE statement instead of db.exec(). D1's exec path is
  // intended for SQL scripts and can be more brittle on a hot authentication
  // request. This table is also included in the canonical auth schema, so this
  // remains an idempotent compatibility guard for older deployments.
  await db.prepare(`
    CREATE TABLE IF NOT EXISTS account_two_factor (
      user_id TEXT PRIMARY KEY,
      encrypted_secret TEXT NOT NULL,
      recovery_hashes TEXT NOT NULL DEFAULT '[]',
      enabled_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `).run()
}

function randomBytes(length: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(length))
}

function bytesToBase32(bytes: Uint8Array): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  let bits = 0
  let value = 0
  let output = ''
  for (const byte of bytes) {
    value = (value << 8) | byte
    bits += 8
    while (bits >= 5) {
      output += alphabet[(value >>> (bits - 5)) & 31]
      bits -= 5
    }
  }
  if (bits > 0) output += alphabet[(value << (5 - bits)) & 31]
  return output
}

function base32ToBytes(input: string): Uint8Array {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567'
  const clean = input.replace(/=+$/g, '').replace(/\s+/g, '').toUpperCase()
  let bits = 0
  let value = 0
  const out: number[] = []
  for (const char of clean) {
    const index = alphabet.indexOf(char)
    if (index < 0) throw new Error('Invalid base32 secret')
    value = (value << 5) | index
    bits += 5
    if (bits >= 8) {
      out.push((value >>> (bits - 8)) & 255)
      bits -= 8
    }
  }
  return new Uint8Array(out)
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  for (const byte of bytes) binary += String.fromCharCode(byte)
  return btoa(binary)
}

function fromBase64(value: string): Uint8Array {
  const binary = atob(value)
  const out = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i)
  return out
}

async function encryptionKey(secret: string): Promise<CryptoKey> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(secret))
  return crypto.subtle.importKey('raw', digest, 'AES-GCM', false, ['encrypt', 'decrypt'])
}

async function encryptSecret(secret: string, keyMaterial: string): Promise<string> {
  const iv = randomBytes(12)
  const key = await encryptionKey(keyMaterial)
  const encrypted = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(secret),
  )
  return `${toBase64(iv)}.${toBase64(new Uint8Array(encrypted))}`
}

async function decryptSecret(payload: string, keyMaterial: string): Promise<string> {
  const [ivRaw, dataRaw] = payload.split('.')
  if (!ivRaw || !dataRaw) throw new Error('Invalid encrypted secret')
  const key = await encryptionKey(keyMaterial)
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: fromBase64(ivRaw) },
    key,
    fromBase64(dataRaw),
  )
  return new TextDecoder().decode(decrypted)
}

function counterBytes(counter: number): Uint8Array {
  const bytes = new Uint8Array(8)
  let value = counter
  for (let i = 7; i >= 0; i--) {
    bytes[i] = value & 0xff
    value = Math.floor(value / 256)
  }
  return bytes
}

async function totpCode(secret: string, counter: number): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    base32ToBytes(secret),
    { name: 'HMAC', hash: 'SHA-1' },
    false,
    ['sign'],
  )
  const signed = new Uint8Array(
    await crypto.subtle.sign('HMAC', key, counterBytes(counter)),
  )
  const offset = signed[signed.length - 1] & 0x0f
  const value = (
    ((signed[offset] & 0x7f) << 24)
    | ((signed[offset + 1] & 0xff) << 16)
    | ((signed[offset + 2] & 0xff) << 8)
    | (signed[offset + 3] & 0xff)
  ) % 10 ** TOTP_DIGITS
  return String(value).padStart(TOTP_DIGITS, '0')
}

async function verifyTotp(secret: string, rawCode: string): Promise<boolean> {
  const code = rawCode.replace(/\s+/g, '')
  if (!/^\d{6}$/.test(code)) return false
  const counter = Math.floor(Date.now() / 1000 / TOTP_STEP)
  for (const delta of [-1, 0, 1]) {
    if (await totpCode(secret, counter + delta) === code) return true
  }
  return false
}

async function hashRecovery(code: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code.toUpperCase())),
  )
  return Array.from(digest).map((byte) => byte.toString(16).padStart(2, '0')).join('')
}

function generateRecoveryCodes(): string[] {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  const codes: string[] = []
  for (let n = 0; n < RECOVERY_COUNT; n++) {
    const bytes = randomBytes(RECOVERY_LENGTH)
    let code = ''
    for (const byte of bytes) code += alphabet[byte % alphabet.length]
    codes.push(`${code.slice(0, 4)}-${code.slice(4, 8)}-${code.slice(8, 12)}`)
  }
  return codes
}

async function getRow(db: D1Database, userId: string): Promise<TwoFactorRow | null> {
  return db.prepare(
    'SELECT * FROM account_two_factor WHERE user_id = ? LIMIT 1',
  ).bind(userId).first<TwoFactorRow>()
}

async function consumeRecoveryCode(
  db: D1Database,
  row: TwoFactorRow,
  rawCode: string,
): Promise<boolean> {
  const hash = await hashRecovery(rawCode.trim())
  let hashes: string[] = []
  try {
    hashes = JSON.parse(row.recovery_hashes) as string[]
  } catch {}
  const index = hashes.indexOf(hash)
  if (index < 0) return false
  hashes.splice(index, 1)
  await db.prepare(
    "UPDATE account_two_factor SET recovery_hashes = ?, updated_at = datetime('now') WHERE user_id = ?",
  ).bind(JSON.stringify(hashes), row.user_id).run()
  return true
}

export async function verifySecondFactor(
  env: TwoFactorEnv,
  userId: string,
  code?: string,
  recoveryCode?: string,
): Promise<'not-enabled' | 'valid' | 'required' | 'invalid' | 'unavailable'> {
  try {
    await ensureTwoFactorSchema(env.AUTH_DB)
    const row = await getRow(env.AUTH_DB, userId)
    if (!row) return 'not-enabled'
    if (!env.ACCOUNT_ENCRYPTION_KEY) return 'unavailable'
    if (!code && !recoveryCode) return 'required'

    if (code) {
      try {
        const secret = await decryptSecret(row.encrypted_secret, env.ACCOUNT_ENCRYPTION_KEY)
        if (await verifyTotp(secret, code)) return 'valid'
      } catch (error) {
        console.error('[auth/2fa] Could not verify TOTP:', (error as Error)?.message)
        return 'unavailable'
      }
    }
    if (recoveryCode && await consumeRecoveryCode(env.AUTH_DB, row, recoveryCode)) return 'valid'
    return 'invalid'
  } catch (error) {
    console.error('[auth/2fa] Security state lookup failed:', (error as Error)?.message)
    return 'unavailable'
  }
}

export async function revokeIssuedRefreshToken(
  env: TwoFactorEnv,
  userId: string,
  refreshToken?: string,
): Promise<void> {
  if (!refreshToken) return
  await Promise.all([
    env.AUTH_KV.delete(`rt:${refreshToken}`),
    env.AUTH_KV.delete(`rt_user:${userId}:${refreshToken}`),
  ])
}

export async function handleTwoFactorRoute(
  request: Request,
  env: TwoFactorEnv,
): Promise<Response | null> {
  const url = new URL(request.url)
  if (!url.pathname.startsWith('/auth/2fa/')) return null
  const userId = await requireUser(request, env)
  if (!userId) return json({ error: 'Sign in to OTYA first' }, 401)
  await ensureTwoFactorSchema(env.AUTH_DB)

  if (request.method === 'GET' && url.pathname === '/auth/2fa/status') {
    const row = await getRow(env.AUTH_DB, userId)
    let remaining = 0
    if (row) {
      try { remaining = (JSON.parse(row.recovery_hashes) as string[]).length } catch {}
    }
    return json({
      ok: true,
      enabled: Boolean(row),
      recovery_codes_remaining: remaining,
      available: Boolean(env.ACCOUNT_ENCRYPTION_KEY),
    })
  }

  if (request.method === 'POST' && url.pathname === '/auth/2fa/setup') {
    if (!env.ACCOUNT_ENCRYPTION_KEY) {
      return json({ error: 'Two-step verification is not configured on this OTYA deployment yet' }, 503)
    }
    if (await getRow(env.AUTH_DB, userId)) {
      return json({ error: 'Two-step verification is already enabled' }, 409)
    }
    const user = await env.AUTH_DB.prepare(
      'SELECT email FROM users WHERE id = ? LIMIT 1',
    ).bind(userId).first<{ email?: string }>()
    if (!user?.email) return json({ error: 'Account not found' }, 404)

    const secret = bytesToBase32(randomBytes(20))
    const encrypted = await encryptSecret(secret, env.ACCOUNT_ENCRYPTION_KEY)
    await env.AUTH_KV.put(`2fa_pending:${userId}`, encrypted, { expirationTtl: PENDING_TTL })
    const label = encodeURIComponent(`OTYA:${user.email}`)
    const issuer = encodeURIComponent('OTYA')
    const uri = `otpauth://totp/${label}?secret=${secret}&issuer=${issuer}&algorithm=SHA1&digits=6&period=30`
    return json({ ok: true, secret, otpauth_uri: uri, expires_in: PENDING_TTL })
  }

  if (request.method === 'POST' && url.pathname === '/auth/2fa/enable') {
    if (!env.ACCOUNT_ENCRYPTION_KEY) return json({ error: 'Two-step verification is unavailable' }, 503)
    let body: { code?: string }
    try { body = await request.json() as { code?: string } }
    catch { return json({ error: 'Invalid JSON body' }, 400) }
    if (!body.code) return json({ error: 'Authenticator code is required' }, 400)
    const encrypted = await env.AUTH_KV.get(`2fa_pending:${userId}`)
    if (!encrypted) return json({ error: 'Setup expired. Start again.' }, 400)
    let secret: string
    try { secret = await decryptSecret(encrypted, env.ACCOUNT_ENCRYPTION_KEY) }
    catch { return json({ error: 'Could not read pending setup' }, 500) }

    if (!(await verifyTotp(secret, body.code))) return json({ error: 'Authenticator code is invalid' }, 400)
    const recoveryCodes = generateRecoveryCodes()
    const hashes = await Promise.all(recoveryCodes.map(hashRecovery))
    await env.AUTH_DB.prepare(`
      INSERT INTO account_two_factor (user_id, encrypted_secret, recovery_hashes)
      VALUES (?, ?, ?)
      ON CONFLICT(user_id) DO UPDATE SET
        encrypted_secret = excluded.encrypted_secret,
        recovery_hashes = excluded.recovery_hashes,
        enabled_at = datetime('now'),
        updated_at = datetime('now')
    `).bind(userId, encrypted, JSON.stringify(hashes)).run()
    await env.AUTH_KV.delete(`2fa_pending:${userId}`)
    return json({ ok: true, enabled: true, recovery_codes: recoveryCodes })
  }

  if (request.method === 'POST' && url.pathname === '/auth/2fa/disable') {
    if (!env.ACCOUNT_ENCRYPTION_KEY) return json({ error: 'Two-step verification is unavailable' }, 503)
    let body: { code?: string; recovery_code?: string }
    try { body = await request.json() as { code?: string; recovery_code?: string } }
    catch { return json({ error: 'Invalid JSON body' }, 400) }
    const row = await getRow(env.AUTH_DB, userId)
    if (!row) return json({ ok: true, enabled: false })
    let verified = false
    if (body.code) {
      try {
        const secret = await decryptSecret(row.encrypted_secret, env.ACCOUNT_ENCRYPTION_KEY)
        verified = await verifyTotp(secret, body.code)
      } catch { return json({ error: 'Could not verify authenticator code' }, 503) }
    } else if (body.recovery_code) {
      verified = await consumeRecoveryCode(env.AUTH_DB, row, body.recovery_code)
    }
    if (!verified) return json({ error: 'A valid authenticator or recovery code is required' }, 401)
    await env.AUTH_DB.prepare('DELETE FROM account_two_factor WHERE user_id = ?').bind(userId).run()
    await env.AUTH_KV.delete(`2fa_pending:${userId}`)
    return json({ ok: true, enabled: false })
  }

  if (request.method === 'POST' && url.pathname === '/auth/2fa/recovery-codes') {
    if (!env.ACCOUNT_ENCRYPTION_KEY) return json({ error: 'Two-step verification is unavailable' }, 503)
    let body: { code?: string }
    try { body = await request.json() as { code?: string } }
    catch { return json({ error: 'Invalid JSON body' }, 400) }
    const row = await getRow(env.AUTH_DB, userId)
    if (!row) return json({ error: 'Two-step verification is not enabled' }, 400)
    let secret: string
    try { secret = await decryptSecret(row.encrypted_secret, env.ACCOUNT_ENCRYPTION_KEY) }
    catch { return json({ error: 'Could not read authenticator settings' }, 503) }
    if (!body.code || !(await verifyTotp(secret, body.code))) return json({ error: 'Authenticator code is invalid' }, 401)
    const recoveryCodes = generateRecoveryCodes()
    const hashes = await Promise.all(recoveryCodes.map(hashRecovery))
    await env.AUTH_DB.prepare(
      "UPDATE account_two_factor SET recovery_hashes = ?, updated_at = datetime('now') WHERE user_id = ?",
    ).bind(JSON.stringify(hashes), userId).run()
    return json({ ok: true, recovery_codes: recoveryCodes })
  }

  return null
}
