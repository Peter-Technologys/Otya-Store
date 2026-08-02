-- Migration 0003: SmartPOS + GR App tables
-- Applied to otya-store-db
-- Note: uses DEFAULT CURRENT_TIMESTAMP for D1 REST API compatibility

-- ── SmartPOS tables ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS products (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  price        REAL NOT NULL DEFAULT 0,
  stock        INTEGER DEFAULT 0,
  category     TEXT,
  image_url    TEXT,
  is_published INTEGER DEFAULT 1,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_products_user ON products(user_id);

CREATE TABLE IF NOT EXISTS sales (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  customer_id    TEXT,
  total          REAL NOT NULL,
  items_json     TEXT NOT NULL DEFAULT '[]',
  payment_method TEXT DEFAULT 'cash',
  notes          TEXT,
  created_at     TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_sales_user ON sales(user_id);
CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(user_id, created_at DESC);

CREATE TABLE IF NOT EXISTS customers (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  phone      TEXT,
  email      TEXT,
  notes      TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_customers_user ON customers(user_id);

CREATE TABLE IF NOT EXISTS inventory_logs (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  product_id TEXT NOT NULL,
  change     INTEGER NOT NULL,
  reason     TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inventory_user    ON inventory_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_inventory_product ON inventory_logs(user_id, product_id);

CREATE TABLE IF NOT EXISTS staff (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  role       TEXT,
  phone      TEXT,
  email      TEXT,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_staff_user ON staff(user_id);

CREATE TABLE IF NOT EXISTS business_profile (
  user_id    TEXT PRIMARY KEY,
  name       TEXT,
  phone      TEXT,
  email      TEXT,
  address    TEXT,
  logo_url   TEXT,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS services (
  id           TEXT PRIMARY KEY,
  user_id      TEXT NOT NULL,
  name         TEXT NOT NULL,
  description  TEXT,
  price        REAL,
  is_published INTEGER DEFAULT 1,
  created_at   TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at   TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_services_user ON services(user_id);

-- ── GR App (VSLA cashier tool) tables ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS gr_groups (
  id          TEXT PRIMARY KEY,
  name        TEXT NOT NULL,
  code        TEXT UNIQUE NOT NULL,
  location    TEXT,
  secret_hash TEXT NOT NULL,
  created_at  TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gr_groups_code ON gr_groups(code);

CREATE TABLE IF NOT EXISTS gr_members (
  id             TEXT PRIMARY KEY,
  group_code     TEXT NOT NULL,
  account_number TEXT NOT NULL,
  name           TEXT NOT NULL,
  phone          TEXT,
  gender         TEXT,
  joined_at      TEXT,
  created_at     TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(group_code, account_number)
);
CREATE INDEX IF NOT EXISTS idx_gr_members_group   ON gr_members(group_code);
CREATE INDEX IF NOT EXISTS idx_gr_members_account ON gr_members(group_code, account_number);

CREATE TABLE IF NOT EXISTS gr_transactions (
  id                TEXT PRIMARY KEY,
  ref               TEXT UNIQUE NOT NULL,
  group_code        TEXT NOT NULL,
  account_number    TEXT NOT NULL,
  member_name       TEXT,
  cashier_name      TEXT,
  type              TEXT NOT NULL,
  amount            REAL NOT NULL,
  denominations_json TEXT DEFAULT '{}',
  notes             TEXT,
  receipt_r2_key    TEXT,
  created_at        TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gr_tx_group   ON gr_transactions(group_code, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_gr_tx_account ON gr_transactions(group_code, account_number);
CREATE INDEX IF NOT EXISTS idx_gr_tx_ref     ON gr_transactions(ref);

CREATE TABLE IF NOT EXISTS gr_cashiers (
  id         TEXT PRIMARY KEY,
  group_code TEXT NOT NULL,
  name       TEXT NOT NULL,
  phone      TEXT,
  pin_hash   TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_gr_cashiers_group ON gr_cashiers(group_code);
