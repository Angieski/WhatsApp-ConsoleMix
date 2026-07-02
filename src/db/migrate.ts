import "dotenv/config";
import { isPostgres } from "./pool";
import { SCHEMA_POSTGRES, SCHEMA_SQLITE } from "./schemas";

export async function runMigrate(): Promise<void> {
  console.log(`[migrate] Modo: ${isPostgres ? "PostgreSQL" : "SQLite"}`);

  if (isPostgres) {
    const { pool } = await import("./pool");
    await pool.query(SCHEMA_POSTGRES);
  } else {
    const { sqlitePool } = await import("./sqlite-adapter");
    sqlitePool.exec(SCHEMA_SQLITE);
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
