CREATE TABLE IF NOT EXISTS ai_support_audit (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  received_email_id TEXT,
  sender_email TEXT,
  subject TEXT,
  action TEXT NOT NULL,
  risk TEXT,
  draft_text TEXT,
  resend_email_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ai_support_audit_created
  ON ai_support_audit(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_support_audit_email
  ON ai_support_audit(received_email_id);
