-- Otya Store — D1 Database Schema
-- Canonical schema for a fresh Otya store database.
-- Existing production databases are upgraded non-destructively by
-- scripts/repair-core-schema.sh before a selected core deployment.

-- Downloads analytics
CREATE TABLE IF NOT EXISTS downloads (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  abi        TEXT    NOT NULL,
  version    TEXT,
  ip         TEXT,
  user_agent TEXT,
  created_at TEXT    DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_downloads_created ON downloads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_abi_created ON downloads(abi, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_version_created ON downloads(version, created_at DESC);

-- Release history (used by /check-update and /latest)
CREATE TABLE IF NOT EXISTS releases (
  tag          TEXT    PRIMARY KEY,
  version      TEXT    NOT NULL,
  version_code INTEGER NOT NULL,
  date         TEXT,
  changelog    TEXT,
  force_update INTEGER DEFAULT 0,
  download_url TEXT,
  arm64_url    TEXT,
  arm32_url    TEXT,
  min_sdk      INTEGER DEFAULT 21,
  target_sdk   INTEGER DEFAULT 36,
  released_at  TEXT    DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_releases_version_code ON releases(version_code DESC);
CREATE INDEX IF NOT EXISTS idx_releases_released_at ON releases(released_at DESC);

-- Devices + FCM tokens
CREATE TABLE IF NOT EXISTS devices (
  device_id       TEXT PRIMARY KEY,
  user_id         TEXT,
  fcm_token       TEXT,
  app_version     TEXT,
  version_code    INTEGER,
  abi             TEXT,
  platform        TEXT DEFAULT 'android',
  model           TEXT,
  android_version TEXT,
  locale          TEXT,
  registered_at   TEXT DEFAULT (datetime('now')),
  last_seen_at    TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_devices_fcm ON devices(fcm_token) WHERE fcm_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_devices_version_code ON devices(version_code);

-- Playlists
CREATE TABLE IF NOT EXISTS playlists (
  id         TEXT PRIMARY KEY,
  user_id    TEXT NOT NULL,
  name       TEXT NOT NULL,
  media_ids  TEXT NOT NULL DEFAULT '[]',
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_playlists_user ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlists_user_updated ON playlists(user_id, updated_at DESC);

-- Play history
CREATE TABLE IF NOT EXISTS play_history (
  id             TEXT PRIMARY KEY,
  user_id        TEXT NOT NULL,
  title          TEXT,
  artist         TEXT,
  file_path      TEXT NOT NULL,
  is_video       INTEGER DEFAULT 0,
  last_played_at TEXT,
  created_at     TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_history_user ON play_history(user_id);
CREATE INDEX IF NOT EXISTS idx_history_played ON play_history(last_played_at DESC);
CREATE INDEX IF NOT EXISTS idx_history_user_played ON play_history(user_id, last_played_at DESC);

-- Cloud bookmark/resume state
CREATE TABLE IF NOT EXISTS bookmarks (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  media_id    TEXT NOT NULL,
  file_path   TEXT,
  position_ms INTEGER DEFAULT 0,
  duration_ms INTEGER DEFAULT 0,
  title       TEXT,
  artist      TEXT,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_media ON bookmarks(user_id, media_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_updated ON bookmarks(user_id, updated_at DESC);

-- Equalizer presets. `name` remains as a compatibility field for preserved
-- databases created by the July 2026 schema; new code uses `preset_name`.
CREATE TABLE IF NOT EXISTS eq_presets (
  id          TEXT PRIMARY KEY,
  user_id     TEXT NOT NULL,
  name        TEXT,
  preset_name TEXT NOT NULL,
  bands       TEXT NOT NULL DEFAULT '[]',
  is_default  INTEGER DEFAULT 0,
  created_at  TEXT DEFAULT (datetime('now')),
  updated_at  TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_eq_presets_user ON eq_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_eq_user_updated ON eq_presets(user_id, updated_at DESC);

-- User cloud preferences. prefs_json is retained for backwards compatibility;
-- current dedicated theme fields can coexist while migration remains additive.
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id      TEXT PRIMARY KEY,
  prefs_json   TEXT NOT NULL DEFAULT '{}',
  theme        TEXT,
  accent_color TEXT,
  updated_at   TEXT DEFAULT (datetime('now'))
);

-- Pro status
CREATE TABLE IF NOT EXISTS pro_status (
  user_id    TEXT PRIMARY KEY,
  expiry_ms  INTEGER DEFAULT 0,
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Ratings
CREATE TABLE IF NOT EXISTS ratings (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id    TEXT,
  user_id      TEXT,
  app_version  TEXT,
  version_code INTEGER,
  stars        INTEGER NOT NULL,
  comment      TEXT,
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_device_created ON ratings(device_id, created_at DESC);

-- Feedback / problem reports
CREATE TABLE IF NOT EXISTS feedback (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id    TEXT,
  app_version  TEXT,
  version_code INTEGER,
  category     TEXT,
  description  TEXT NOT NULL,
  user_email   TEXT,
  sentiment    TEXT,
  ai_processed INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_device_created ON feedback(device_id, created_at DESC);

CREATE TABLE IF NOT EXISTS feedback_replies (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  feedback_id  INTEGER NOT NULL,
  reply_text   TEXT NOT NULL,
  generated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_feedback_replies_fid ON feedback_replies(feedback_id);

-- Crash reports
CREATE TABLE IF NOT EXISTS crash_reports (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  device_id    TEXT,
  user_id      TEXT,
  app_version  TEXT,
  version_code INTEGER,
  error_type   TEXT,
  stack_trace  TEXT,
  description  TEXT,
  group_id     TEXT,
  ai_processed INTEGER DEFAULT 0,
  created_at   TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_crash_created ON crash_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_crash_group ON crash_reports(group_id);
CREATE INDEX IF NOT EXISTS idx_crash_device ON crash_reports(device_id);
CREATE INDEX IF NOT EXISTS idx_crash_user ON crash_reports(user_id);

-- Website/news content retained from the existing store migration history.
CREATE TABLE IF NOT EXISTS blog_posts (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  slug       TEXT UNIQUE NOT NULL,
  title      TEXT NOT NULL,
  content    TEXT NOT NULL,
  excerpt    TEXT,
  published  INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_blog_slug ON blog_posts(slug);
CREATE INDEX IF NOT EXISTS idx_blog_published ON blog_posts(published, created_at DESC);
