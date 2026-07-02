import "dotenv/config";
import fs from "fs";
import path from "path";
import { isPostgres } from "./pool";

export async function runMigrate(): Promise<void> {
  const schemaFile = isPostgres ? "schema.sql" : "schema-sqlite.sql";
  const schemaPath = path.join(__dirname, schemaFile);
  const sql = fs.readFileSync(schemaPath, "utf-8");

  console.log(`[migrate] Modo: ${isPostgres ? "PostgreSQL" : "SQLite"}`);
  console.log(`[migrate] Executando ${schemaFile}...`);

  if (isPostgres) {
    const { pool } = await import("./pool");
    await pool.query(sql);
  } else {
    const { sqlitePool } = await import("./sqlite-adapter");
    sqlitePool.exec(sql);
  }

  console.log("[migrate] Concluída com sucesso.");
}

// Permite rodar como script standalone: npx ts-node src/db/migrate.ts
if (require.main === module) {
  runMigrate().catch((err) => {
    console.error("Falha na migração:", err);
    process.exit(1);
  });
}
