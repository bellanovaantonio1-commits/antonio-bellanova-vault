/**
 * Datenbank-Adapter: SQLite (lokal) oder MySQL (Cloud SQL).
 * Wenn MYSQL_HOST gesetzt ist, wird MySQL mit SSL verwendet, sonst SQLite.
 */
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export type DbRunResult = { lastInsertRowid: number; changes: number };

export interface DbStatement {
  run(...args: any[]): Promise<DbRunResult>;
  get(...args: any[]): Promise<any>;
  all(...args: any[]): Promise<any[]>;
}

export interface DbInterface {
  exec(sql: string): Promise<void>;
  prepare(sql: string): DbStatement;
  isMySQL: boolean;
  /** Run multiple operations atomically. For MySQL uses a single connection; for SQLite uses BEGIN/COMMIT. */
  transaction<T>(fn: (tx: DbInterface) => Promise<T>): Promise<T>;
}

let sqliteDb: InstanceType<typeof Database> | null = null;
let mysqlPool: any = null;

function getSqliteDb(): InstanceType<typeof Database> {
  if (!sqliteDb) {
    const dbPath = process.env.DATABASE_PATH || path.join(__dirname, "..", "vault.db");
    sqliteDb = new Database(dbPath);
  }
  return sqliteDb;
}

export async function initDb(): Promise<DbInterface> {
  const host = process.env.MYSQL_HOST || process.env.CLOUD_SQL_HOST;
  const user = process.env.MYSQL_USER || process.env.CLOUD_SQL_USER;
  const password = process.env.MYSQL_PASSWORD || process.env.CLOUD_SQL_PASSWORD;

  if (host && user && password) {
    const mysql = await import("mysql2/promise");
    const port = Number(process.env.MYSQL_PORT || process.env.CLOUD_SQL_PORT || 3306);
    const database = process.env.MYSQL_DATABASE || process.env.CLOUD_SQL_DATABASE || "bellanova_vault";
    const ssl = { rejectUnauthorized: false };
    mysqlPool = mysql.createPool({
      host,
      port,
      user,
      password,
      database,
      ssl,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    return createMySQLAdapter();
  }

  return createSQLiteAdapter();
}

function createSQLiteAdapter(): DbInterface {
  const sqlite = getSqliteDb();
  const adapter: DbInterface = {
    isMySQL: false,
    exec(sql: string): Promise<void> {
      return Promise.resolve(sqlite.exec(sql));
    },
    prepare(sql: string): DbStatement {
      const stmt = sqlite.prepare(sql);
      return {
        run(...args: any[]) {
          const r = stmt.run(...args);
          return Promise.resolve({
            lastInsertRowid: Number(r.lastInsertRowid),
            changes: r.changes ?? 0,
          });
        },
        get(...args: any[]) {
          return Promise.resolve(stmt.get(...args));
        },
        all(...args: any[]) {
          return Promise.resolve(stmt.all(...args));
        },
      };
    },
    async transaction<T>(fn: (tx: DbInterface) => Promise<T>): Promise<T> {
      sqlite.exec("BEGIN IMMEDIATE");
      try {
        const result = await fn(adapter);
        sqlite.exec("COMMIT");
        return result;
      } catch (e) {
        sqlite.exec("ROLLBACK");
        throw e;
      }
    },
  };
  return adapter;
}

function createMySQLTxStatement(conn: any, sql: string): DbStatement {
  return {
    async run(...args: any[]) {
      const [result] = await conn.execute(sql, args);
      const r = result as any;
      return {
        lastInsertRowid: r?.insertId ?? 0,
        changes: r?.affectedRows ?? 0,
      };
    },
    async get(...args: any[]) {
      const [rows] = await conn.execute(sql, args);
      const arr = Array.isArray(rows) ? rows : (rows as any);
      return arr?.[0] ?? null;
    },
    async all(...args: any[]) {
      const [rows] = await conn.execute(sql, args);
      return Array.isArray(rows) ? rows : (rows as any) ?? [];
    },
  };
}

function createMySQLAdapter(): DbInterface {
  const pool = mysqlPool;
  if (!pool) throw new Error("MySQL pool not initialized");

  const baseAdapter: DbInterface = {
    isMySQL: true,
    async exec(sql: string): Promise<void> {
      const mysqlSql = sql.replace(/\bAUTOINCREMENT\b/gi, "AUTO_INCREMENT");
      const statements = mysqlSql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0 && !s.startsWith("--"));
      const conn = await pool.getConnection();
      try {
        for (const stmt of statements) {
          if (stmt) await conn.query(stmt);
        }
      } finally {
        conn.release();
      }
    },
    prepare(sql: string): DbStatement {
      return {
        async run(...args: any[]) {
          const conn = await pool.getConnection();
          try {
            const [result] = await conn.execute(sql, args);
            const r = result as any;
            return {
              lastInsertRowid: r?.insertId ?? 0,
              changes: r?.affectedRows ?? 0,
            };
          } finally {
            conn.release();
          }
        },
        async get(...args: any[]) {
          const conn = await pool.getConnection();
          try {
            const [rows] = await conn.execute(sql, args);
            const arr = Array.isArray(rows) ? rows : (rows as any);
            return arr?.[0] ?? null;
          } finally {
            conn.release();
          }
        },
        async all(...args: any[]) {
          const conn = await pool.getConnection();
          try {
            const [rows] = await conn.execute(sql, args);
            return Array.isArray(rows) ? rows : (rows as any) ?? [];
          } finally {
            conn.release();
          }
        },
      };
    },
    async transaction<T>(fn: (tx: DbInterface) => Promise<T>): Promise<T> {
      const conn = await pool.getConnection();
      const txAdapter: DbInterface = {
        isMySQL: true,
        exec(sql: string): Promise<void> {
          const mysqlSql = sql.replace(/\bAUTOINCREMENT\b/gi, "AUTO_INCREMENT");
          return conn.query(mysqlSql).then(() => {});
        },
        prepare(sql: string): DbStatement {
          return createMySQLTxStatement(conn, sql);
        },
        transaction<T>(innerFn: (tx: DbInterface) => Promise<T>): Promise<T> {
          return innerFn(txAdapter);
        },
      };
      try {
        await conn.beginTransaction();
        const result = await fn(txAdapter);
        await conn.commit();
        return result;
      } catch (e) {
        await conn.rollback();
        throw e;
      } finally {
        conn.release();
      }
    },
  };
  return baseAdapter;
}
