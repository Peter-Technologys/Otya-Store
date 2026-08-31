-- Atomic execution ledger for owner-approved external writes.
-- KV remains the short-lived conversation/pending-action store, while D1 is
-- the strongly consistent claim used to prevent duplicate Telegram/email
-- writes when two approval requests race or a client retries.
CREATE TABLE IF NOT EXISTS owner_action_executions (
  id TEXT PRIMARY KEY,
  action_type TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('executing', 'completed', 'failed')),
  claimed_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT,
  failed_at TEXT,
  provider TEXT,
  provider_reference TEXT,
  error TEXT
);

CREATE INDEX IF NOT EXISTS idx_owner_action_executions_status_claimed
  ON owner_action_executions(status, claimed_at DESC);
