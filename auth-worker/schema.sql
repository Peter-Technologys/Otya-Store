-- OTYA shared identity schema
-- One user identity is shared across OTYA products. Product-specific data stays
-- in each product service and is keyed by users.id.

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

CREATE TABLE IF NOT EXISTS user_products (
  user_id       TEXT NOT NULL,
  product_id    TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'active',
  first_seen_at TEXT DEFAULT (datetime('now')),
  last_seen_at  TEXT DEFAULT (datetime('now')),
  PRIMARY KEY (user_id, product_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_products_product
  ON user_products(product_id, last_seen_at DESC);
