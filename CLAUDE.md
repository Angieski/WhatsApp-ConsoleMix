# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start with nodemon (watches src/**/*.ts, restarts on change)
npm run build     # Compile TypeScript → dist/
npm start         # Run compiled output (dist/index.js)
npm run migrate   # Run DB migrations standalone
npm run ingest <path>  # Ingest .txt/.md files into the RAG knowledge base
```

There are no tests configured yet (`npm test` exits 1).

## Environment Variables

Copy `.env.example` to `.env`. The database mode is determined automatically:

| Variable | Required | Purpose |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | Claude API |
| `VOYAGE_API_KEY` | Yes* | Voyage AI embeddings (`voyage-3-lite`, 512 dims). If absent, RAG seeding is skipped at startup. |
| `ZAPI_INSTANCE_ID` / `ZAPI_TOKEN` / `ZAPI_CLIENT_TOKEN` | Yes | Z-API WhatsApp credentials |
| `DATABASE_URL` | No | If starts with `postgresql://` or `postgres://`, uses PostgreSQL; otherwise falls back to local SQLite (`consolemix.db`) |
| `PORT` | No | Default 3000 |
| `NODE_ENV=production` | No | Enables SSL for PostgreSQL connections |

Z-API credentials can alternatively be stored in the `bot_settings` table (configurable via `/api/bot` endpoint or the dashboard UI).

## Architecture

### Request Flow

```
WhatsApp user
  → Z-API webhook POST /webhook/whatsapp
  → zapiHandler.ts  (debounce 4 s, buffer multi-part messages, dedup via processedIds)
  → sessionManager.ts  (load last 20 messages from DB)
  → retriever.ts  (embed query with Voyage AI → semantic search on knowledge_chunks)
  → claudeClient.ts  (Claude with tool-use loop, up to 5 rounds)
  → zapiClient.ts  (format Markdown → WhatsApp, split into <600-char parts with 1.2 s delay)
  → Z-API send-text API
```

### Dual Database (SQLite ↔ PostgreSQL)

`src/db/pool.ts` exports a single `DbPool` interface satisfied by both adapters. **All SQL is written in PostgreSQL syntax** (`$1`, `$2`, `NOW()`). The `sqlite-adapter.ts` translates this at runtime by:
- Replacing `$N` placeholders with `?`
- Replacing `NOW()` with `datetime('now')`
- Converting boolean values to `0`/`1`

Whenever you add a new query, write it in PostgreSQL style — the SQLite adapter handles translation.

Migrations (`src/db/migrate.ts`) run automatically on startup and are idempotent. PostgreSQL uses `ADD COLUMN IF NOT EXISTS`; SQLite checks via `PRAGMA table_info`.

The RAG retriever uses pgvector's `<=>` cosine operator on PostgreSQL. On SQLite, it loads all embeddings into memory and computes cosine similarity in JavaScript — this does not scale beyond a few thousand chunks.

### Claude Tool-Use Loop

`claudeClient.ts` runs an agentic loop with up to 5 rounds. The four registered tools (`src/sales/tools.ts`) are:

| Tool | Action |
|---|---|
| `get_catalog` | Returns current pricing plans from `src/sales/catalog.ts` |
| `set_tag` | Updates conversation tag (`suporte` / `venda`) in the DB |
| `register_order` | Creates a row in `orders` table; requires name, CNPJ, company, product |
| `mark_resolved` | Sets conversation status to `concluido` |

Both the system prompt (`SYSTEM_PROMPT`) and the RAG context block are sent with `cache_control: ephemeral` to enable prompt caching.

### Knowledge Base / RAG

`src/rag/seedKnowledge.ts` runs at startup and seeds the `knowledge_chunks` table with the embedded manual and FAQ. It skips sources that already have chunks. To re-seed a source, delete its chunks from the DB first.

To ingest external documents:
```bash
npm run ingest knowledge/docs/        # all .txt/.md files in a folder
npm run ingest knowledge/docs/my.txt  # single file
```

Chunking: 1 800-char chunks with 150-char overlap, minimum chunk length 50 chars. Embeddings batched 50 at a time.

### Dashboard & REST API

Static dashboard at `public/` is served at `/dashboard`. Backend routes:

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/webhook/whatsapp` | Z-API incoming messages |
| `GET` | `/api/conversations` | List conversations (`?tag=suporte\|venda&status=pendente\|concluido`) |
| `GET` | `/api/conversations/:phone/messages` | Full message history |
| `DELETE` | `/api/conversations/:phone/messages` | Clear history (for testing) |
| `GET` | `/api/conversations/:phone/order` | Most recent order for a phone |
| `PATCH` | `/api/conversations/:phone` | Update tag / status / customerName |
| `GET` | `/api/bot` | Bot settings (tokens redacted) |
| `PATCH` | `/api/bot` | Update bot settings |
| `GET` | `/health` | Health check |

### Bot Settings

`src/services/settingsService.ts` caches the single `bot_settings` row (id=1) for 30 seconds. When the PATCH endpoint updates settings, the cache is invalidated. Z-API credentials in the DB take precedence over env vars.

### Message Buffering

`zapiHandler.ts` debounces messages per phone number with a 4-second window so that rapid follow-up messages are concatenated before being sent to Claude. A `processing` Set prevents concurrent handling of the same phone number.
