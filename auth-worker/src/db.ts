/**
 * D1 schema and typed helpers for the otya-auth worker.
 *
 * Schema:
 *   users — stores registered users (email/password and/or Google OAuth)
 *
 * All helpers are thin wrappers that keep SQL out of the main entrypoint.
 */

// ── Binding types ─────────────────────────────────────────────────────────────

export interface D1Statement {
  bind(...values: unknown[]): D1Statement
  all<T = Record<string, unknown>>(): Promise<{ results: T[]; meta: { changes: number; last_row_id?: number } }>
  first<T = Record<string, unknown>>(): Promise<T | null>
  run(): Promise<{ meta: { changes: number; last_row_id?: number } }>
}

export interface D1Database {
  prepare(query: string): D1Statement
  exec(query: string): Promise<{ count: number; duration: number }>
}

// ── Domain model ──────────────────────────────────────────────────────────────

export interface UserRow {
  id:            string   // UUID v4
  email:         string
  password_hash: string | null   // null for Google-only accounts
  google_id:     string | null
  name:          string | null
  avatar_url:    string | null
  is_verified:   number   // 0 | 1
  created_at:    string
  updated_at:    string
}

// ── Schema DDL ────────────────────────────────────────────────────────────────

/**
 * SQL schema for the auth database.
 * Kept here so it can be referenced in migrations and the wrangler.toml comment.
 *
 * Run via:
 *   wrangler d1 execute otya-auth-db --file=schema.sql
 */
export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id            TEXT PRIMARY KEY,
  email         TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  google_id     TEXT UNIQUE,
  name          TEXT,
  avatar_url    TEXT,
  is_verified   INTEGER DEFAULT 0,
  created_at    TEXT DEFAULT (datetime('now')),
  updated_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);
`.trim()

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Ensure the users table and indexes exist. Idempotent. */
export async function ensureSchema(db: D1Database): Promise<void> {
  await db.exec(SCHEMA_SQL)
}

/** Look up a user by email. Returns null if not found. */
export async function getUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>()
}

/** Look up a user by ID. Returns null if not found. */
export async function getUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>()
}

/** Look up a user by Google ID. Returns null if not found. */
export async function getUserByGoogleId(db: D1Database, googleId: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE google_id = ?').bind(googleId).first<UserRow>()
}

/** Insert a new user. Throws on duplicate email. */
export async function insertUser(
  db: D1Database,
  user: Pick<UserRow, 'id' | 'email' | 'password_hash' | 'google_id' | 'name' | 'avatar_url'>,
): Promise<void> {
  await db.prepare(`
    INSERT INTO users (id, email, password_hash, google_id, name, avatar_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(
    user.id,
    user.email,
    user.password_hash ?? null,
    user.google_id     ?? null,
    user.name          ?? null,
    user.avatar_url    ?? null,
  ).run()
}

/** Upsert a Google user — insert or update name/avatar/google_id. */
export async function upsertGoogleUser(
  db: D1Database,
  user: Pick<UserRow, 'id' | 'email' | 'google_id' | 'name' | 'avatar_url'>,
): Promise<UserRow | null> {
  await db.prepare(`
    INSERT INTO users (id, email, google_id, name, avatar_url, is_verified)
    VALUES (?, ?, ?, ?, ?, 1)
    ON CONFLICT(email) DO UPDATE SET
      google_id  = excluded.google_id,
      name       = COALESCE(excluded.name, users.name),
      avatar_url = COALESCE(excluded.avatar_url, users.avatar_url),
      is_verified = 1,
      updated_at = datetime('now')
  `).bind(
    user.id,
    user.email,
    user.google_id  ?? null,
    user.name       ?? null,
    user.avatar_url ?? null,
  ).run()
  return getUserByEmail(db, user.email)
}

/** Update a user's password hash. */
export async function updatePasswordHash(
  db: D1Database,
  userId: string,
  passwordHash: string,
): Promise<void> {
  await db.prepare(`
    UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(passwordHash, userId).run()
}

/** Delete a user by ID. */
export async function deleteUser(db: D1Database, userId: string): Promise<void> {
  await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()
}
