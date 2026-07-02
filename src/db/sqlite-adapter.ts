import Database from "better-sqlite3";
import path from "path";

const DB_PATH = path.join(process.cwd(), "consolemix.db");
let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
  }
  return _db;
}

// Converte placeholders $1,$2,... do PostgreSQL para ? do SQLite
// e substitui NOW() por datetime('now')
function pgToSqlite(sql: string): string {
  return sql
    .replace(/\$\d+/g, "?")
    .replace(/\bNOW\(\)/gi, "datetime('now')");
}

export const sqlitePool = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query<T = Record<string, any>>(
    sql: string,
    values: unknown[] = []
  ): Promise<{ rows: T[] }> {
    const db = getDb();
    const converted = pgToSqlite(sql.trim());

    try {
      const stmt = db.prepare(converted);
      const isRead =
        /^\s*SELECT\b/i.test(converted) || /\bRETURNING\b/i.test(converted);

      // SQLite não aceita boolean — converte para 0/1
      const bound = values.map((v) => (typeof v === "boolean" ? (v ? 1 : 0) : v));

      if (isRead) {
        const rows = stmt.all(...bound) as T[];
        return Promise.resolve({ rows });
      } else {
        stmt.run(...bound);
        return Promise.resolve({ rows: [] });
      }
    } catch (err) {
      return Promise.reject(err);
    }
  },

  // Executa um script SQL com múltiplos statements (para migrations)
  exec(sql: string): void {
    getDb().exec(sql);
  },

  end(): Promise<void> {
    if (_db) {
      _db.close();
      _db = null;
    }
    return Promise.resolve();
  },
};
