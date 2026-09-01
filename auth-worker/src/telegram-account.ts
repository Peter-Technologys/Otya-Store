import { generateUuid } from './crypto'
import { generateOtyaId, getUserById, touchUserProduct, type D1Database, type UserRow } from './db'

export interface TelegramAccountEnv {
  AUTH_DB: D1Database
}

function safeUsername(value: string | null | undefined): string | null {
  const username = String(value ?? '').trim()
  return /^[A-Za-z0-9_]{1,64}$/.test(username) ? username : null
}

function safeName(value: string | null | undefined, username: string | null): string {
  const name = String(value ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, 120)
  return name || username || 'Telegram user'
}

async function linkedUser(env: TelegramAccountEnv, subject: string): Promise<UserRow | null> {
  const link = await env.AUTH_DB.prepare(
    "SELECT user_id FROM linked_identities WHERE provider = 'telegram' AND provider_subject = ? LIMIT 1",
  ).bind(subject).first<{ user_id?: string }>()
  if (!link?.user_id) return null
  const user = await getUserById(env.AUTH_DB, link.user_id)
  if (!user) throw new Error('Linked Telegram OTYA account is missing')
  return user
}

export async function createOrGetTelegramUser(
  env: TelegramAccountEnv,
  providerSubject: string,
  providerUsername?: string | null,
  displayName?: string | null,
): Promise<UserRow> {
  const subject = providerSubject.trim()
  if (!/^\d+$/.test(subject)) throw new Error('Invalid Telegram subject')
  const username = safeUsername(providerUsername)

  const existing = await linkedUser(env, subject)
  if (existing) {
    await env.AUTH_DB.prepare(
      "UPDATE linked_identities SET provider_username = ?, last_used_at = datetime('now') WHERE provider = 'telegram' AND provider_subject = ?",
    ).bind(username, subject).run()
    await touchUserProduct(env.AUTH_DB, existing.id, 'otya')
    return existing
  }

  const userId = generateUuid()
  let created = false
  for (let attempt = 0; attempt < 16; attempt++) {
    const otyaId = await generateOtyaId(env.AUTH_DB)
    try {
      await env.AUTH_DB.prepare(`
        INSERT INTO users (id, otya_id, email, password_hash, google_id, name, avatar_url)
        VALUES (?, ?, NULL, NULL, NULL, ?, NULL)
      `).bind(userId, otyaId, safeName(displayName, username)).run()
      created = true
      break
    } catch (error) {
      const raced = await linkedUser(env, subject)
      if (raced) return raced
      if (attempt === 15) throw error
    }
  }
  if (!created) throw new Error('Could not create OTYA Telegram account')

  try {
    await env.AUTH_DB.prepare(`
      INSERT INTO linked_identities (user_id, provider, provider_subject, provider_username, provider_email, linked_at, last_used_at)
      VALUES (?, 'telegram', ?, ?, NULL, datetime('now'), datetime('now'))
      ON CONFLICT(provider, provider_subject) DO UPDATE SET
        provider_username = excluded.provider_username,
        last_used_at = datetime('now')
    `).bind(userId, subject, username).run()
  } catch (error) {
    await env.AUTH_DB.prepare(
      "DELETE FROM users WHERE id = ? AND NOT EXISTS (SELECT 1 FROM linked_identities WHERE user_id = ?)",
    ).bind(userId, userId).run()
    const raced = await linkedUser(env, subject)
    if (raced) return raced
    throw error
  }

  const owner = await linkedUser(env, subject)
  if (!owner) {
    await env.AUTH_DB.prepare(
      "DELETE FROM users WHERE id = ? AND NOT EXISTS (SELECT 1 FROM linked_identities WHERE user_id = ?)",
    ).bind(userId, userId).run()
    throw new Error('Could not link Telegram identity')
  }
  if (owner.id !== userId) {
    await env.AUTH_DB.prepare(
      "DELETE FROM users WHERE id = ? AND NOT EXISTS (SELECT 1 FROM linked_identities WHERE user_id = ?)",
    ).bind(userId, userId).run()
  }
  await touchUserProduct(env.AUTH_DB, owner.id, 'otya')
  return owner
}
