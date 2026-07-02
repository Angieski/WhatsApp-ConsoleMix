import { pool, isPostgres } from "../db/pool";
import { embedSingle, toVectorSql } from "./embeddings";

const TOP_K = 4;
const MIN_SIMILARITY = 0.65;

interface RetrievedChunk {
  content: string;
  source: string | null;
  similarity: number;
}

export async function retrieveContext(query: string): Promise<string> {
  const queryEmbedding = await embedSingle(query);
  const chunks = isPostgres
    ? await retrievePgvector(queryEmbedding)
    : await retrieveInMemory(queryEmbedding);

  if (chunks.length === 0) return "";

  return chunks
    .map((r) => (r.source ? `${r.content} [${r.source}]` : r.content))
    .join("\n\n---\n\n");
}

// ── PostgreSQL: busca via pgvector ────────────────────────────────────────

async function retrievePgvector(queryEmbedding: number[]): Promise<RetrievedChunk[]> {
  const vectorSql = toVectorSql(queryEmbedding);
  const { rows } = await pool.query<RetrievedChunk>(
    `SELECT content, source, 1 - (embedding <=> $1::vector) AS similarity
     FROM knowledge_chunks
     ORDER BY embedding <=> $1::vector
     LIMIT $2`,
    [vectorSql, TOP_K]
  );
  return rows.filter((r) => r.similarity >= MIN_SIMILARITY);
}

// ── SQLite: cosine similarity em JavaScript ───────────────────────────────

async function retrieveInMemory(queryEmbedding: number[]): Promise<RetrievedChunk[]> {
  const { rows } = await pool.query<{ content: string; source: string | null; embedding: string }>(
    "SELECT content, source, embedding FROM knowledge_chunks WHERE embedding IS NOT NULL"
  );

  if (rows.length === 0) return [];

  return rows
    .map((r) => {
      let storedEmbedding: number[];
      try {
        storedEmbedding = JSON.parse(r.embedding) as number[];
      } catch {
        return null;
      }
      return {
        content: r.content,
        source: r.source,
        similarity: cosineSimilarity(queryEmbedding, storedEmbedding),
      };
    })
    .filter((r): r is RetrievedChunk => r !== null && r.similarity >= MIN_SIMILARITY)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, TOP_K);
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  const denom = Math.sqrt(magA) * Math.sqrt(magB);
  return denom === 0 ? 0 : dot / denom;
}
