#!/usr/bin/env bash
set -euo pipefail

DB_NAME="${OTYA_STORE_DB_NAME:-otya-store-db}"

run_sql() {
  npx wrangler d1 execute "$DB_NAME" --remote --command "$1" >/dev/null
}

columns_for() {
  npx wrangler d1 execute "$DB_NAME" --remote --json --command "PRAGMA table_info($1)" \
    | jq -r '.[0].results[]?.name'
}

has_column() {
  local table="$1"
  local column="$2"
  columns_for "$table" | grep -Fxq "$column"
}

ensure_column() {
  local table="$1"
  local column="$2"
  local definition="$3"
  if ! has_column "$table" "$column"; then
    echo "Adding missing $table.$column"
    run_sql "ALTER TABLE $table ADD COLUMN $column $definition"
  fi
}

# Keep this repair additive. Production user data is preserved; a missing core
# ownership column on an existing table is repaired, never worked around with a
# table drop/recreate.
run_sql "CREATE TABLE IF NOT EXISTS bookmarks (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, media_id TEXT NOT NULL, file_path TEXT, position_ms INTEGER DEFAULT 0, duration_ms INTEGER DEFAULT 0, title TEXT, updated_at TEXT DEFAULT (datetime('now')))"
ensure_column bookmarks user_id "TEXT"
ensure_column bookmarks media_id "TEXT"
ensure_column bookmarks file_path "TEXT"
ensure_column bookmarks position_ms "INTEGER DEFAULT 0"
ensure_column bookmarks duration_ms "INTEGER DEFAULT 0"
ensure_column bookmarks title "TEXT"
ensure_column bookmarks updated_at "TEXT"
run_sql "CREATE INDEX IF NOT EXISTS idx_bookmarks_user ON bookmarks(user_id)"
run_sql "CREATE UNIQUE INDEX IF NOT EXISTS idx_bookmarks_media ON bookmarks(user_id, media_id)"

# The 2026-07 schema used `name TEXT NOT NULL`; current API uses
# `preset_name`. Keep both columns during the compatibility window so preserved
# tables do not need a destructive SQLite rebuild just to remove the old NOT NULL
# column. The route writes both values, and old rows are backfilled once.
run_sql "CREATE TABLE IF NOT EXISTS eq_presets (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT, preset_name TEXT, bands TEXT NOT NULL DEFAULT '[]', is_default INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')), updated_at TEXT DEFAULT (datetime('now')))"
ensure_column eq_presets user_id "TEXT"
ensure_column eq_presets name "TEXT"
ensure_column eq_presets preset_name "TEXT"
ensure_column eq_presets bands "TEXT NOT NULL DEFAULT '[]'"
ensure_column eq_presets is_default "INTEGER DEFAULT 0"
ensure_column eq_presets created_at "TEXT"
ensure_column eq_presets updated_at "TEXT"
run_sql "UPDATE eq_presets SET preset_name = name WHERE (preset_name IS NULL OR trim(preset_name) = '') AND name IS NOT NULL"
run_sql "UPDATE eq_presets SET name = preset_name WHERE (name IS NULL OR trim(name) = '') AND preset_name IS NOT NULL"
run_sql "CREATE INDEX IF NOT EXISTS idx_eq_presets_user ON eq_presets(user_id)"

run_sql "CREATE TABLE IF NOT EXISTS user_preferences (user_id TEXT PRIMARY KEY, prefs_json TEXT NOT NULL DEFAULT '{}', theme TEXT, accent_color TEXT, updated_at TEXT DEFAULT (datetime('now')))"
ensure_column user_preferences prefs_json "TEXT NOT NULL DEFAULT '{}'"
ensure_column user_preferences theme "TEXT"
ensure_column user_preferences accent_color "TEXT"
ensure_column user_preferences updated_at "TEXT"

# These base tables are expected to exist in every Otya store. Create them only
# for a fresh/incomplete environment, then add the newer runtime fields.
run_sql "CREATE TABLE IF NOT EXISTS feedback (id INTEGER PRIMARY KEY AUTOINCREMENT, device_id TEXT, app_version TEXT, version_code INTEGER, category TEXT, description TEXT NOT NULL, user_email TEXT, sentiment TEXT, ai_processed INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))"
ensure_column feedback sentiment "TEXT"
ensure_column feedback ai_processed "INTEGER DEFAULT 0"
run_sql "CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC)"

run_sql "CREATE TABLE IF NOT EXISTS feedback_replies (id INTEGER PRIMARY KEY AUTOINCREMENT, feedback_id INTEGER NOT NULL, reply_text TEXT NOT NULL, generated_at TEXT DEFAULT (datetime('now')))"
run_sql "CREATE INDEX IF NOT EXISTS idx_feedback_replies_fid ON feedback_replies(feedback_id)"

run_sql "CREATE TABLE IF NOT EXISTS ratings (id INTEGER PRIMARY KEY AUTOINCREMENT, device_id TEXT, user_id TEXT, app_version TEXT, version_code INTEGER, stars INTEGER NOT NULL, comment TEXT, created_at TEXT DEFAULT (datetime('now')))"
ensure_column ratings user_id "TEXT"
run_sql "CREATE INDEX IF NOT EXISTS idx_ratings_created ON ratings(created_at DESC)"

run_sql "CREATE TABLE IF NOT EXISTS devices (device_id TEXT PRIMARY KEY, user_id TEXT, fcm_token TEXT, app_version TEXT, version_code INTEGER, abi TEXT, platform TEXT DEFAULT 'android', model TEXT, android_version TEXT, locale TEXT, registered_at TEXT DEFAULT (datetime('now')), last_seen_at TEXT DEFAULT (datetime('now')))"
ensure_column devices user_id "TEXT"
ensure_column devices model "TEXT"
ensure_column devices android_version "TEXT"
ensure_column devices locale "TEXT"
run_sql "CREATE INDEX IF NOT EXISTS idx_devices_fcm ON devices(fcm_token) WHERE fcm_token IS NOT NULL"
run_sql "CREATE INDEX IF NOT EXISTS idx_devices_user ON devices(user_id) WHERE user_id IS NOT NULL"

run_sql "CREATE TABLE IF NOT EXISTS crash_reports (id INTEGER PRIMARY KEY AUTOINCREMENT, device_id TEXT, user_id TEXT, app_version TEXT, version_code INTEGER, error_type TEXT, stack_trace TEXT, description TEXT, group_id TEXT, ai_processed INTEGER DEFAULT 0, created_at TEXT DEFAULT (datetime('now')))"
ensure_column crash_reports user_id "TEXT"
run_sql "CREATE INDEX IF NOT EXISTS idx_crash_created ON crash_reports(created_at DESC)"
run_sql "CREATE INDEX IF NOT EXISTS idx_crash_group ON crash_reports(group_id)"
run_sql "CREATE INDEX IF NOT EXISTS idx_crash_device ON crash_reports(device_id)"
run_sql "CREATE INDEX IF NOT EXISTS idx_crash_user ON crash_reports(user_id)"

echo 'Remote Otya core schema is compatible.'
