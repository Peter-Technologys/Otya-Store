/**
 * Minimal typed wrappers for Cloudflare D1 and R2 bindings.
 * Used instead of `as any` so no eslint-disable comments are needed.
 * These match the real Cloudflare runtime API surface used in this project.
 */

export interface D1Result<T = Record<string, unknown>> {
  results: T[]
  meta: { changes: number; last_row_id?: number }
}

export interface D1Statement {
  bind(...values: unknown[]): D1Statement
  all<T = Record<string, unknown>>(): Promise<D1Result<T>>
  first<T = Record<string, unknown>>(): Promise<T | null>
  run(): Promise<{ meta: { changes: number; last_row_id?: number } }>
}

export interface D1 {
  prepare(query: string): D1Statement
  exec(query: string): Promise<{ count: number; duration: number }>
}

export interface R2Object {
  text(): Promise<string>
  key: string
  size: number
  uploaded: Date
}

export interface R2ListResult {
  objects: R2Object[]
  truncated: boolean
}

export interface R2 {
  get(key: string): Promise<R2Object | null>
  list(options?: { prefix?: string; limit?: number }): Promise<R2ListResult>
}

export interface KVNamespaceLocal {
  get(key: string): Promise<string | null>
  getWithMetadata<M = unknown>(key: string): Promise<{ value: string | null; metadata: M | null }>
  put(key: string, value: string, options?: { expirationTtl?: number; metadata?: unknown }): Promise<void>
  delete(key: string): Promise<void>
  list(options?: { prefix?: string; limit?: number; cursor?: string }): Promise<{
    keys: { name: string; expiration?: number; metadata?: unknown }[]
    list_complete: boolean
    cursor?: string
  }>
}

// ── Domain model interfaces ───────────────────────────────────────────────────

/** A crash report submitted from the Flutter app. */
export interface CrashReport {
  id:           number
  device_id:    string | null
  app_version:  string | null
  version_code: number | null
  error_type:   string | null
  stack_trace:  string | null
  description:  string | null
  group_id:     string | null
  ai_processed: number   // 0 | 1
  created_at:   string
}

/** A feedback row from the feedback table. */
export interface FeedbackRow {
  id:           number
  device_id:    string | null
  app_version:  string | null
  version_code: number | null
  category:     string | null
  description:  string
  user_email:   string | null
  sentiment:    string | null
  ai_processed: number   // 0 | 1
  created_at:   string
}

/** A release row from the releases table. */
export interface Release {
  tag:          string
  version:      string
  version_code: number
  date:         string | null
  changelog:    string | null
  force_update: number   // 0 | 1
  download_url: string | null
  arm64_url:    string | null
  arm32_url:    string | null
  min_sdk:      number
  target_sdk:   number
  released_at:  string
}

/** A device row from the devices table. */
export interface Device {
  device_id:       string
  user_id:         string | null
  fcm_token:       string | null
  app_version:     string | null
  version_code:    number | null
  abi:             string | null
  platform:        string
  model:           string | null
  android_version: string | null
  locale:          string | null
  registered_at:   string
  last_seen_at:    string
}

// ── Schema helpers ────────────────────────────────────────────────────────────

/**
 * Ensure AI-related tables and columns exist.
 * Idempotent — safe to call on every cold start or cron run.
 * Uses try/catch per ALTER TABLE because SQLite doesn't support IF NOT EXISTS for columns.
 */
export async function ensureAiTables(db: D1): Promise<void> {
  // crash_reports table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS crash_reports (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      device_id    TEXT,
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
    CREATE INDEX IF NOT EXISTS idx_crash_group   ON crash_reports(group_id);
    CREATE INDEX IF NOT EXISTS idx_crash_device  ON crash_reports(device_id);
  `)

  // Add AI columns to feedback table (one try/catch per column)
  for (const sql of [
    'ALTER TABLE feedback ADD COLUMN sentiment TEXT',
    'ALTER TABLE feedback ADD COLUMN ai_processed INTEGER DEFAULT 0',
  ]) {
    try { await db.exec(sql) } catch { /* column already exists */ }
  }

  // Add device detail columns if missing
  for (const sql of [
    'ALTER TABLE devices ADD COLUMN model TEXT',
    'ALTER TABLE devices ADD COLUMN android_version TEXT',
    'ALTER TABLE devices ADD COLUMN locale TEXT',
  ]) {
    try { await db.exec(sql) } catch { /* column already exists */ }
  }
}

// ── Binding accessors ─────────────────────────────────────────────────────────

export function getDB(env: Record<string, unknown>): D1 {
  return env.DB as D1
}

export function getR2(env: Record<string, unknown>): R2 {
  return env.R2 as R2
}

export function getKV(env: Record<string, unknown>): KVNamespaceLocal {
  return env.KV as KVNamespaceLocal
}
