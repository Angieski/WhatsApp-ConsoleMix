import "dotenv/config";
import fs from "fs";
import path from "path";
import { isPostgres } from "./pool";

async function migrate(): Promise<void> {
  const schemaFile = isPostgres ? "schema.sql" : "schema-sqlite.sql";
  const schemaPath = path.join(__dirname, schemaFile);
  const sql = fs.readFileSync(schemaPath, "utf-8");

  console.log(`Modo: ${isPostgres ? "PostgreSQL" : "SQLite"}`);
  console.log(`Schema: ${schemaFile}`);
  console.log("Executando migração...");

  if (isPostgres) {
    const { pool } = await import("./pool");
    await pool.query(sql);
  } else {
    const { sqlitePool } = await import("./sqlite-adapter");
    sqlitePool.exec(sql);
    await sqlitePool.end();
  }

  console.log("Migração concluída com sucesso.");
}

migrate().catch((err) => {
  console.error("Falha na migração:", err);
  process.exit(1);
});
