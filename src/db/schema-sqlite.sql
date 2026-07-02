-- Schema SQLite para desenvolvimento local (sem pgvector)
-- Para produção use schema.sql com PostgreSQL + pgvector

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  content    TEXT    NOT NULL,
  source     TEXT,
  embedding  TEXT,                         -- JSON array de números (ex: [0.1, -0.2, ...])
  created_at TEXT    DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  phone      TEXT    NOT NULL,
  role       TEXT    NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT    NOT NULL,
  created_at TEXT    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS messages_phone_idx ON messages (phone, created_at DESC);

CREATE TABLE IF NOT EXISTS orders (
  id             INTEGER PRIMARY KEY AUTOINCREMENT,
  phone          TEXT    NOT NULL,
  customer_name  TEXT    NOT NULL,
  customer_email TEXT    NOT NULL,
  company        TEXT,
  product        TEXT    NOT NULL,
  status         TEXT    NOT NULL DEFAULT 'pending',
  created_at     TEXT    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS orders_phone_idx  ON orders (phone);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);

CREATE TABLE IF NOT EXISTS conversations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  phone           TEXT    NOT NULL UNIQUE,
  customer_name   TEXT,
  tag             TEXT    NOT NULL DEFAULT 'suporte' CHECK (tag IN ('suporte', 'venda')),
  status          TEXT    NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
  last_message_at TEXT    DEFAULT CURRENT_TIMESTAMP,
  created_at      TEXT    DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS conversations_tag_idx     ON conversations (tag);
CREATE INDEX IF NOT EXISTS conversations_status_idx  ON conversations (status);
CREATE INDEX IF NOT EXISTS conversations_last_msg_idx ON conversations (last_message_at DESC);

CREATE TABLE IF NOT EXISTS bot_settings (
  id            INTEGER PRIMARY KEY DEFAULT 1,
  enabled       INTEGER NOT NULL DEFAULT 1,   -- SQLite: 1=true, 0=false
  instance_id   TEXT,
  token         TEXT,
  client_token  TEXT,
  phone_display TEXT,
  updated_at    TEXT    DEFAULT CURRENT_TIMESTAMP,
  CHECK (id = 1)
);

INSERT OR IGNORE INTO bot_settings (id, enabled) VALUES (1, 1);
