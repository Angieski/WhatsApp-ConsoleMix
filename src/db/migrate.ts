import "dotenv/config";
import { isPostgres } from "./pool";
import { SCHEMA_POSTGRES, SCHEMA_SQLITE } from "./schemas";

export async function runMigrate(): Promise<void> {
  console.log(`[migrate] Modo: ${isPostgres ? "PostgreSQL" : "SQLite"}`);

  if (isPostgres) {
    const { pool } = await import("./pool");
    await pool.query(SCHEMA_POSTGRES);
    // Migrações incrementais — ADD COLUMN IF NOT EXISTS é idempotente
    await pool.query(`
      ALTER TABLE orders ADD COLUMN IF NOT EXISTS cnpj VARCHAR(20);
      ALTER TABLE orders ALTER COLUMN customer_email DROP NOT NULL;
    `);
  } else {
    const { sqlitePool } = await import("./sqlite-adapter");
    sqlitePool.exec(SCHEMA_SQLITE);
    // SQLite não suporta ADD COLUMN IF NOT EXISTS — verifica via PRAGMA usando query()
    const { rows } = await sqlitePool.query<{ name: string }>("PRAGMA table_info(orders)");
    if (!rows.some((c) => c.name === "cnpj")) {
      sqlitePool.exec("ALTER TABLE orders ADD COLUMN cnpj TEXT");
    }
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
