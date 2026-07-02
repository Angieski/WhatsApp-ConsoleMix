-- Requer PostgreSQL 14+ com extensão pgvector instalada
CREATE EXTENSION IF NOT EXISTS vector;

-- Chunks de documentos para RAG
CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id        SERIAL PRIMARY KEY,
  content   TEXT         NOT NULL,
  source    VARCHAR(500),
  embedding VECTOR(512),           -- voyage-3-lite: 512 dimensões
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice IVFFlat para busca aproximada por cosseno (ajuste `lists` conforme volume)
CREATE INDEX IF NOT EXISTS knowledge_chunks_embedding_idx
  ON knowledge_chunks
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);

-- Histórico de mensagens persistido (substitui sessão em memória)
CREATE TABLE IF NOT EXISTS messages (
  id         SERIAL PRIMARY KEY,
  phone      VARCHAR(50)  NOT NULL,
  role       VARCHAR(20)  NOT NULL CHECK (role IN ('user', 'assistant')),
  content    TEXT         NOT NULL,
  created_at TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS messages_phone_idx ON messages (phone, created_at DESC);

-- Pedidos registrados pelo funil de vendas
CREATE TABLE IF NOT EXISTS orders (
  id             SERIAL PRIMARY KEY,
  phone          VARCHAR(50)   NOT NULL,
  customer_name  VARCHAR(200)  NOT NULL,
  customer_email VARCHAR(200)  NOT NULL,
  company        VARCHAR(200),
  product        VARCHAR(100)  NOT NULL,
  status         VARCHAR(50)   NOT NULL DEFAULT 'pending',
  created_at     TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS orders_phone_idx ON orders (phone);
CREATE INDEX IF NOT EXISTS orders_status_idx ON orders (status);

-- Conversas únicas por número (para o dashboard)
CREATE TABLE IF NOT EXISTS conversations (
  id              SERIAL PRIMARY KEY,
  phone           VARCHAR(50)   NOT NULL UNIQUE,
  customer_name   VARCHAR(200),
  tag             VARCHAR(20)   NOT NULL DEFAULT 'suporte' CHECK (tag IN ('suporte', 'venda')),
  status          VARCHAR(20)   NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'concluido')),
  last_message_at TIMESTAMPTZ   DEFAULT NOW(),
  created_at      TIMESTAMPTZ   DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS conversations_tag_idx    ON conversations (tag);
CREATE INDEX IF NOT EXISTS conversations_status_idx ON conversations (status);
CREATE INDEX IF NOT EXISTS conversations_last_msg_idx ON conversations (last_message_at DESC);

-- Configurações do bot (tabela singleton — sempre id=1)
CREATE TABLE IF NOT EXISTS bot_settings (
  id            INT         PRIMARY KEY DEFAULT 1,
  enabled       BOOLEAN     NOT NULL DEFAULT TRUE,
  instance_id   VARCHAR(200),
  token         VARCHAR(200),
  client_token  VARCHAR(200),
  phone_display VARCHAR(50),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT single_row CHECK (id = 1)
);

-- Garante que a linha singleton exista ao rodar a migração
INSERT INTO bot_settings (id, enabled)
VALUES (1, TRUE)
ON CONFLICT (id) DO NOTHING;
