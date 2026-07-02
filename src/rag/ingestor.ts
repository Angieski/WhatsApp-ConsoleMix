/**
 * CLI de ingestão de documentos para a base de conhecimento RAG.
 * Uso: npm run ingest <pasta_ou_arquivo>
 * Exemplo: npm run ingest knowledge/docs/
 */
import "dotenv/config";
import fs from "fs";
import path from "path";
import { pool, isPostgres } from "../db/pool";
import { embedTexts, toVectorSql } from "./embeddings";

const CHUNK_SIZE    = 1800;
const CHUNK_OVERLAP = 150;
const EMBED_BATCH   = 50;

function chunkText(text: string): string[] {
  const chunks: string[] = [];
  let start = 0;
  while (start < text.length) {
    const end   = Math.min(start + CHUNK_SIZE, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk.length > 50) chunks.push(chunk);
    start += CHUNK_SIZE - CHUNK_OVERLAP;
  }
  return chunks;
}

async function ingestFile(filePath: string): Promise<void> {
  const source = path.basename(filePath);
  const text   = fs.readFileSync(filePath, "utf-8");
  const chunks = chunkText(text);

  console.log(`  ${source}: ${chunks.length} chunks`);

  for (let i = 0; i < chunks.length; i += EMBED_BATCH) {
    const batch      = chunks.slice(i, i + EMBED_BATCH);
    const embeddings = await embedTexts(batch);

    for (let j = 0; j < batch.length; j++) {
      if (isPostgres) {
        // PostgreSQL: armazena como VECTOR com cast explícito
        await pool.query(
          `INSERT INTO knowledge_chunks (content, source, embedding)
           VALUES ($1, $2, $3::vector)`,
          [batch[j], source, toVectorSql(embeddings[j])]
        );
      } else {
        // SQLite: armazena como JSON string
        await pool.query(
          `INSERT INTO knowledge_chunks (content, source, embedding)
           VALUES ($1, $2, $3)`,
          [batch[j], source, JSON.stringify(embeddings[j])]
        );
      }
    }

    process.stdout.write(
      `\r  ${source}: ${Math.min(i + EMBED_BATCH, chunks.length)}/${chunks.length} inseridos`
    );
  }
  console.log();
}

async function main(): Promise<void> {
  const target = process.argv[2];
  if (!target) {
    console.error("Uso: npm run ingest <pasta_ou_arquivo>");
    process.exit(1);
  }

  const stat  = fs.statSync(target);
  const files: string[] = [];

  if (stat.isDirectory()) {
    for (const entry of fs.readdirSync(target)) {
      if (/\.(txt|md)$/i.test(entry)) files.push(path.join(target, entry));
    }
  } else {
    files.push(target);
  }

  if (!files.length) {
    console.error("Nenhum arquivo .txt ou .md encontrado.");
    process.exit(1);
  }

  console.log(`Ingerindo ${files.length} arquivo(s) [modo: ${isPostgres ? "PostgreSQL" : "SQLite"}]...`);
  for (const file of files) await ingestFile(file);
  console.log("Ingestão concluída.");
}

main().catch((err) => { console.error("Erro na ingestão:", err); process.exit(1); });
