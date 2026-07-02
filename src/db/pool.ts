import { Pool } from "pg";
import { sqlitePool } from "./sqlite-adapter";

const DB_URL = process.env.DATABASE_URL ?? "";

export const isPostgres =
  DB_URL.startsWith("postgresql://") || DB_URL.startsWith("postgres://");

// Interface compartilhada — satisfeita tanto pelo pg.Pool quanto pelo sqlitePool
export interface DbPool {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query<T = Record<string, any>>(
    sql: string,
    values?: unknown[]
  ): Promise<{ rows: T[] }>;
}

function createPgPool(): DbPool {
  if (!DB_URL) throw new Error("DATABASE_URL não definida");

  const needsSsl =
    process.env.NODE_ENV === "production" ||
    DB_URL.includes(".railway.app") ||
    DB_URL.includes(".rlwy.net");

  const pgPool = new Pool({
    connectionString: DB_URL,
    ssl: needsSsl ? { rejectUnauthorized: false } : false,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 10_000,
  });

  return {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    query: (sql: string, values?: unknown[]) =>
      pgPool.query(sql, values as unknown[]).then((r) => ({ rows: r.rows as any[] })),
  };
}

export const pool: DbPool = isPostgres ? createPgPool() : sqlitePool;
