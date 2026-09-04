CREATE TABLE IF NOT EXISTS resend_webhook_events (
  svix_id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  email_id TEXT,
  message_id TEXT,
  event_created_at TEXT,
  received_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_resend_webhook_events_type_received
  ON resend_webhook_events(event_type, received_at DESC);
