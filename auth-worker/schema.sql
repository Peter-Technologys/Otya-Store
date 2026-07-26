-- otya-auth D1 schema
-- Run via: wrangler d1 execute otya-auth-db --file=schema.sql
-- Or paste into: Cloudflare Dashboard → D1 → otya-auth-db → Console

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
