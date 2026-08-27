-- Migration 0003: safe performance indexes for current OTYA access patterns
-- Additive only: no tables/columns/data are dropped or rewritten.

CREATE INDEX IF NOT EXISTS idx_downloads_created ON downloads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_abi_created ON downloads(abi, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_downloads_version_created ON downloads(version, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_releases_version_code ON releases(version_code DESC);
CREATE INDEX IF NOT EXISTS idx_releases_released_at ON releases(released_at DESC);

CREATE INDEX IF NOT EXISTS idx_devices_last_seen ON devices(last_seen_at DESC);
CREATE INDEX IF NOT EXISTS idx_devices_version_code ON devices(version_code);

CREATE INDEX IF NOT EXISTS idx_history_user_played ON play_history(user_id, last_played_at DESC);
CREATE INDEX IF NOT EXISTS idx_playlists_user_updated ON playlists(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_updated ON bookmarks(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_eq_user_updated ON eq_presets(user_id, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_feedback_device_created ON feedback(device_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ratings_device_created ON ratings(device_id, created_at DESC);
