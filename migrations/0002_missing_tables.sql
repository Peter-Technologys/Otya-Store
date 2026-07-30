-- Migration 0002: missing tables
-- Applied 2026-07-30 to otya-store-db
-- Note: uses DEFAULT CURRENT_TIMESTAMP (not datetime('now')) for D1 REST API compatibility

-- Bookmarks (resume positions for media files)
CREATE TABLE IF NOT EXISTS bookmarks (
  id          TEXT    PRIMARY KEY,
  user_id     TEXT    NOT NULL,
  media_id    TEXT    NOT NULL,
  file_path   TEXT,
  position_ms INTEGER DEFAULT 0,
  title       TEXT,
  artist      TEXT,
  created_at  TEXT    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT    DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user  ON bookmarks(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_media ON bookmarks(user_id, media_id);

-- Blog posts
CREATE TABLE IF NOT EXISTS blog_posts (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  slug        TEXT    UNIQUE NOT NULL,
  title       TEXT    NOT NULL,
  content     TEXT    NOT NULL,
  excerpt     TEXT,
  published   INTEGER DEFAULT 0,
  created_at  TEXT    DEFAULT CURRENT_TIMESTAMP,
  updated_at  TEXT    DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_blog_slug      ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published, created_at DESC);

-- EQ presets (per-user equalizer settings)
CREATE TABLE IF NOT EXISTS eq_presets (
  id         TEXT    PRIMARY KEY,
  user_id    TEXT    NOT NULL,
  name       TEXT    NOT NULL,
  bands      TEXT    NOT NULL DEFAULT '[]',
  is_default INTEGER DEFAULT 0,
  created_at TEXT    DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT    DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_eq_user ON eq_presets(user_id);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id    TEXT    PRIMARY KEY,
  prefs_json TEXT    NOT NULL DEFAULT '{}',
  updated_at TEXT    DEFAULT CURRENT_TIMESTAMP
);
