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

/**
 * After splitting SQL on `;`, a segment can start with `-- section title` followed by real DDL.
 * The old filter `!startsWith("--")` dropped the entire segment, skipping e.g. CREATE chat_threads.
 */
function stripLeadingLineComments(sql: string): string {
  const lines = sql.split("\n");
  let i = 0;
  while (i < lines.length) {
    const t = lines[i].trim();
    if (t === "") {
      i++;
      continue;
    }
    if (t.startsWith("--")) {
      i++;
      continue;
    }
    break;
  }
  return lines.slice(i).join("\n").trim();
}

/**
 * MySQL reserves `KEY`; a column named `key` must be quoted (email_templates, admin_config).
 * Use targeted patterns so we do not break `seq_key`, FOREIGN KEY, PRIMARY KEY, etc.
 */
function mysqlBacktickKeyColumnName(sql: string): string {
  return sql
    // `m` flag: ^ matches start of each line (JS has no (?m) inline modifier like PCRE)
    .replace(/^(\s+)key(\s+VARCHAR|\s+LONGTEXT|\s+INTEGER|\s+REAL|\s+DATETIME)\b/gim, "$1`key`$2")
    .replace(/,(\s*)key(\s+VARCHAR|\s+LONGTEXT|\s+INTEGER|\s+REAL|\s+DATETIME)\b/gi, ",$1`key`$2")
    .replace(/\(\s*key\s*,/gi, "(`key`,")
    .replace(/\(\s*key\s+VARCHAR/gi, "(`key` VARCHAR")
    .replace(/\bWHERE\s+key(\s*=)/gi, "WHERE `key`$1")
    .replace(/\bORDER\s+BY\s+key\b/gi, "ORDER BY `key`")
    .replace(/\bON\s+CONFLICT\s*\(\s*key\s*\)/gi, "ON CONFLICT(`key`)")
    .replace(/\bSET\s+key(\s*=)/gi, "SET `key`$1")
    .replace(/\bkey\s*=\s*\?/g, "`key` = ?");
}

/**
 * MySQL 8+ reserves LAST_VALUE (window function); unquoted column `last_value` breaks the parser.
 */
function mysqlBacktickLastValueColumnName(sql: string): string {
  // MySQL 8: LAST_VALUE is reserved; qualify `tbl.last_value` unchanged (lookbehind skips `.` and `` ` ``).
  return sql.replace(/(?<![.`])\blast_value\b(?![`])/g, "`last_value`");
}

/** MySQL 8: ROLE reserved; backtick name/role/status in seedAdmin column lists. */
function mysqlBacktickUsersReservedColumns(sql: string): string {
  return sql
    .replace(
      /\(email, username, password, name, role, status\)/gi,
      "(email, username, password, `name`, `role`, `status`)",
    )
    .replace(
      /UPDATE users SET password = \?, status = 'approved', username = \? WHERE id = \?/gi,
      "UPDATE users SET password = ?, `status` = 'approved', username = ? WHERE id = ?",
    );
}

/**
 * SQLite UPSERT uses ON CONFLICT … DO UPDATE; MySQL needs ON DUPLICATE KEY UPDATE (same composite/primary key).
 * Applied only when MYSQL_* is used; keeps server.ts SQL portable for SQLite locally.
 */
function mysqlConvertOnConflictToDuplicateKey(sql: string): string {
  let s = sql;
  // number_sequences (nextContractRef, nextCertRef, etc.) — allow `last_value` if already backticked
  s = s.replace(
    /\bON\s+CONFLICT\s*\(\s*seq_key\s*,\s*seq_year\s*,\s*seq_type\s*\)\s+DO\s+UPDATE\s+SET\s+`?last_value`?\s*=\s*excluded\.`?last_value`?/gi,
    "ON DUPLICATE KEY UPDATE `last_value` = VALUES(`last_value`)",
  );
  // admin_config (key is PK)
  s = s.replace(
    /\bON\s+CONFLICT\s*\(\s*`key`\s*\)\s+DO\s+UPDATE\s+SET\s+value\s*=\s*excluded\.value/gi,
    "ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
  );
  s = s.replace(
    /\bON\s+CONFLICT\s*\(\s*key\s*\)\s+DO\s+UPDATE\s+SET\s+value\s*=\s*excluded\.value/gi,
    "ON DUPLICATE KEY UPDATE `value` = VALUES(`value`)",
  );
  // collector_profiles
  s = s.replace(
    /\bON\s+CONFLICT\s*\(\s*user_id\s*\)\s+DO\s+UPDATE\s+SET\s+bio\s*=\s*excluded\.bio\s*,\s*visibility\s*=\s*excluded\.visibility/gi,
    "ON DUPLICATE KEY UPDATE bio = VALUES(bio), visibility = VALUES(visibility)",
  );
  // production_progress (multiline)
  s = s.replace(
    /\bON\s+CONFLICT\s*\(\s*masterpiece_id\s*,\s*step_index\s*\)\s+DO\s+UPDATE\s+SET\s+status\s*=\s*excluded\.status\s*,\s*notes\s*=\s*excluded\.notes\s*,\s*media_url\s*=\s*excluded\.media_url\s*,\s*staff_id\s*=\s*excluded\.staff_id\s*,\s*timestamp\s*=\s*CURRENT_TIMESTAMP/gis,
    "ON DUPLICATE KEY UPDATE status = VALUES(status), notes = VALUES(notes), media_url = VALUES(media_url), staff_id = VALUES(staff_id), timestamp = CURRENT_TIMESTAMP",
  );
  // delivery_details
  s = s.replace(
    /\bON\s+CONFLICT\s*\(\s*masterpiece_id\s*\)\s+DO\s+UPDATE\s+SET\s+courier_name\s*=\s*excluded\.courier_name\s*,\s*tracking_number\s*=\s*excluded\.tracking_number\s*,\s*scheduled_at\s*=\s*excluded\.scheduled_at\s*,\s*status\s*=\s*excluded\.status/gis,
    "ON DUPLICATE KEY UPDATE courier_name = VALUES(courier_name), tracking_number = VALUES(tracking_number), scheduled_at = VALUES(scheduled_at), status = VALUES(status)",
  );
  // shipping_orchestration
  s = s.replace(
    /\bON\s+CONFLICT\s*\(\s*masterpiece_id\s*\)\s+DO\s+UPDATE\s+SET\s+status\s*=\s*excluded\.status\s*,\s*courier\s*=\s*excluded\.courier\s*,\s*tracking_number\s*=\s*excluded\.tracking_number\s*,\s*insurance_value\s*=\s*excluded\.insurance_value\s*,\s*white_glove\s*=\s*excluded\.white_glove\s*,\s*custody_log\s*=\s*excluded\.custody_log/gis,
    "ON DUPLICATE KEY UPDATE status = VALUES(status), courier = VALUES(courier), tracking_number = VALUES(tracking_number), insurance_value = VALUES(insurance_value), white_glove = VALUES(white_glove), custody_log = VALUES(custody_log)",
  );
  // event_rsvps
  s = s.replace(
    /\bON\s+CONFLICT\s*\(\s*event_id\s*,\s*user_id\s*\)\s+DO\s+UPDATE\s+SET\s+status\s*=\s*excluded\.status/gi,
    "ON DUPLICATE KEY UPDATE status = VALUES(status)",
  );
  return s;
}

/**
 * MySQL DDL / DML fixes for SQLite-oriented schema in server.ts:
 * - No DEFAULT on TEXT/BLOB (ER_BLOB_CANT_HAVE_DEFAULT).
 * - No UNIQUE/PRIMARY KEY on TEXT without key length (ER_BLOB_KEY_WITHOUT_LENGTH).
 * - Remaining TEXT columns → LONGTEXT.
 * - Backtick reserved column names: key, last_value.
 */
function mysqlDdlCompat(sql: string): string {
  // Type / engine tweaks first (no column backticks yet).
  const base = sql
    .replace(/\bAUTOINCREMENT\b/gi, "AUTO_INCREMENT")
    .replace(/\bTEXT\s+NOT\s+NULL\s+UNIQUE\b/gi, "VARCHAR(512) NOT NULL UNIQUE")
    .replace(/\bTEXT\s+PRIMARY\s+KEY\b/gi, "VARCHAR(512) PRIMARY KEY")
    .replace(/\bTEXT\s+UNIQUE\b/gi, "VARCHAR(512) UNIQUE")
    .replace(/\bTEXT\s+NOT\s+NULL\s+DEFAULT\b/gi, "VARCHAR(512) NOT NULL DEFAULT")
    .replace(/\bTEXT\s+DEFAULT\b/gi, "VARCHAR(512) DEFAULT")
    .replace(/\broom_type\s+TEXT\s+NOT\s+NULL\b/gi, "room_type VARCHAR(512) NOT NULL")
    .replace(/\btag\s+TEXT\s+NOT\s+NULL\b/gi, "tag VARCHAR(512) NOT NULL")
    // Short strings; composite PK (seq_key, seq_year, seq_type) must stay under InnoDB 3072-byte index limit (utf8mb4).
    .replace(/\bseq_key\s+TEXT\s+NOT\s+NULL\b/gi, "seq_key VARCHAR(191) NOT NULL")
    .replace(/\bseq_type\s+TEXT\b/gi, "seq_type VARCHAR(191)")
    .replace(/\bTEXT\b/gi, "LONGTEXT");

  // SQLite ON CONFLICT must become MySQL ON DUPLICATE *before* last_value backticks break the matcher.
  const afterUpsert = mysqlConvertOnConflictToDuplicateKey(base);

  return mysqlBacktickKeyColumnName(
    mysqlBacktickUsersReservedColumns(mysqlBacktickLastValueColumnName(afterUpsert)),
  );
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
  const q = mysqlDdlCompat(sql);
  return {
    async run(...args: any[]) {
      const [result] = await conn.execute(q, args);
      const r = result as any;
      return {
        lastInsertRowid: r?.insertId ?? 0,
        changes: r?.affectedRows ?? 0,
      };
    },
    async get(...args: any[]) {
      const [rows] = await conn.execute(q, args);
      const arr = Array.isArray(rows) ? rows : (rows as any);
      return arr?.[0] ?? null;
    },
    async all(...args: any[]) {
      const [rows] = await conn.execute(q, args);
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
      const mysqlSql = mysqlDdlCompat(sql);
      const statements = mysqlSql
        .split(";")
        .map((s) => stripLeadingLineComments(s.trim()))
        .filter((s) => s.length > 0);
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
      const q = mysqlDdlCompat(sql);
      return {
        async run(...args: any[]) {
          const conn = await pool.getConnection();
          try {
            const [result] = await conn.execute(q, args);
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
            const [rows] = await conn.execute(q, args);
            const arr = Array.isArray(rows) ? rows : (rows as any);
            return arr?.[0] ?? null;
          } finally {
            conn.release();
          }
        },
        async all(...args: any[]) {
          const conn = await pool.getConnection();
          try {
            const [rows] = await conn.execute(q, args);
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
          const mysqlSql = mysqlDdlCompat(sql);
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
