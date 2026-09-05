-- OTYA Anywhere Together control plane.
-- Stores only ephemeral room membership and WebRTC signaling metadata.
-- Media/audio/chat payloads must never be written to these tables.

CREATE TABLE IF NOT EXISTS together_rooms (
  id                TEXT PRIMARY KEY,
  host_user_id      TEXT NOT NULL,
  guest_user_id     TEXT,
  invited_username  TEXT NOT NULL COLLATE NOCASE,
  invite_token_hash TEXT NOT NULL,
  status            TEXT NOT NULL DEFAULT 'waiting'
                    CHECK (status IN ('waiting', 'watching', 'closed')),
  host_profile_json TEXT NOT NULL,
  guest_profile_json TEXT NOT NULL,
  created_at        TEXT NOT NULL,
  expires_at        TEXT NOT NULL,
  joined_at         TEXT,
  closed_at         TEXT,
  last_activity_at  TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_together_rooms_host
  ON together_rooms(host_user_id, expires_at DESC);
CREATE INDEX IF NOT EXISTS idx_together_rooms_guest
  ON together_rooms(guest_user_id, expires_at DESC)
  WHERE guest_user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_together_rooms_expiry
  ON together_rooms(expires_at);

CREATE TABLE IF NOT EXISTS together_signals (
  seq            INTEGER PRIMARY KEY AUTOINCREMENT,
  room_id        TEXT NOT NULL,
  sender_user_id TEXT NOT NULL,
  sender_role    TEXT NOT NULL CHECK (sender_role IN ('host', 'guest')),
  type           TEXT NOT NULL CHECK (type IN ('offer', 'answer', 'ice', 'bye')),
  payload_json   TEXT,
  created_at     TEXT NOT NULL,
  FOREIGN KEY (room_id) REFERENCES together_rooms(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_together_signals_room_seq
  ON together_signals(room_id, seq);
CREATE INDEX IF NOT EXISTS idx_together_signals_created
  ON together_signals(created_at);
