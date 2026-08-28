/**
 * D1 schema and typed helpers for the OTYA identity service.
 *
 * Identity is shared across every OTYA product. Product-specific data stays in
 * each product service and is keyed by the stable users.id value.
 */

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

export interface UserRow {
  id:                         string
  email:                      string
  password_hash:              string | null
  google_id:                  string | null
  name:                       string | null
  avatar_url:                 string | null
  is_verified:                number
  phone_number:               string | null
  phone_verified_at:          string | null
  phone_verification_method:  string | null
  recovery_email:             string | null
  recovery_email_verified_at: string | null
  country_code:               string | null
  locale:                     string | null
  timezone:                   string | null
  created_at:                 string
  updated_at:                 string
}

export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS users (
  id                         TEXT PRIMARY KEY,
  email                      TEXT UNIQUE NOT NULL,
  password_hash              TEXT,
  google_id                  TEXT UNIQUE,
  name                       TEXT,
  avatar_url                 TEXT,
  is_verified                INTEGER DEFAULT 0,
  phone_number               TEXT,
  phone_verified_at          TEXT,
  phone_verification_method  TEXT,
  recovery_email             TEXT,
  recovery_email_verified_at TEXT,
  country_code               TEXT,
  locale                     TEXT,
  timezone                   TEXT,
  created_at                 TEXT DEFAULT (datetime('now')),
  updated_at                 TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_users_email  ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_google ON users(google_id);

CREATE TABLE IF NOT EXISTS user_products (
  user_id       TEXT NOT NULL,
  product_id    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  first_seen_at TEXT DEFAULT (datetime('now')),
  last_seen_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_user_products_product ON user_products(product_id, last_seen_at DESC);

CREATE TABLE IF NOT EXISTS linked_identities (
  user_id            TEXT NOT NULL,
  provider           TEXT NOT NULL,
  provider_subject   TEXT NOT NULL,
  provider_username  TEXT,
  provider_email     TEXT,
  linked_at          TEXT DEFAULT (datetime('now')),
  last_used_at       TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (provider, provider_subject),
  UNIQUE (user_id, provider),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_linked_identities_user ON linked_identities(user_id, provider);
`.trim()

const USER_COLUMN_DEFS: Record<string, string> = {
  phone_number: 'TEXT',
  phone_verified_at: 'TEXT',
  phone_verification_method: 'TEXT',
  recovery_email: 'TEXT',
  recovery_email_verified_at: 'TEXT',
  country_code: 'TEXT',
  locale: 'TEXT',
  timezone: 'TEXT',
}

async function ensureUserColumns(db: D1Database): Promise<void> {
  const { results } = await db.prepare('PRAGMA table_info(users)').all<{ name: string }>()
  const existing = new Set(results.map(row => row.name))
  for (const [name, type] of Object.entries(USER_COLUMN_DEFS)) {
    if (!existing.has(name)) {
      await db.prepare(`ALTER TABLE users ADD COLUMN ${name} ${type}`).run()
    }
  }
  await db.prepare('CREATE UNIQUE INDEX IF NOT EXISTS idx_users_phone ON users(phone_number) WHERE phone_number IS NOT NULL').run()
}

export async function ensureSchema(db: D1Database): Promise<void> {
  await db.exec(SCHEMA_SQL)
  await ensureUserColumns(db)
}

export async function getUserByEmail(db: D1Database, email: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<UserRow>()
}

export async function getUserById(db: D1Database, id: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<UserRow>()
}

export async function getUserByGoogleId(db: D1Database, googleId: string): Promise<UserRow | null> {
  return db.prepare('SELECT * FROM users WHERE google_id = ?').bind(googleId).first<UserRow>()
}

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

/** Record that a shared OTYA account has used a product. */
export async function touchUserProduct(
  db: D1Database,
  userId: string,
  productId: string,
): Promise<void> {
  await db.prepare(`
    INSERT INTO user_products (user_id, product_id)
    VALUES (?, ?)
    ON CONFLICT(user_id, product_id) DO UPDATE SET
      status = 'active',
      last_seen_at = datetime('now')
  `).bind(userId, productId).run()
}

export async function updatePasswordHash(
  db: D1Database,
  userId: string,
  passwordHash: string,
): Promise<void> {
  await db.prepare(`
    UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?
  `).bind(passwordHash, userId).run()
}

export async function deleteUser(db: D1Database, userId: string): Promise<void> {
  await db.prepare('DELETE FROM users WHERE id = ?').bind(userId).run()
}
