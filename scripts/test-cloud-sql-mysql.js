/**
 * Test der Verbindung zu Google Cloud SQL (MySQL).
 * Vor dem Aufruf in .env oder Umgebung setzen:
 *   MYSQL_HOST, MYSQL_PORT, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE
 *   ODER: DATABASE_URL=mysql://user:pass@host:3306/dbname
 *
 * Aufruf: node scripts/test-cloud-sql-mysql.js
 */
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, "..");
const envPath = path.join(projectRoot, ".env");
const loaded = dotenv.config({ path: envPath });
if (loaded.error) {
  console.error("Hinweis: .env nicht gefunden:", envPath);
} else if (!loaded.parsed || Object.keys(loaded.parsed).length === 0) {
  console.error("Hinweis: .env ist leer oder enthält keine gültigen KEY=WERT Zeilen. Erwartete Datei:", envPath);
}

import mysql from "mysql2/promise";

function getConfig() {
  if (process.env.DATABASE_URL) {
    const url = process.env.DATABASE_URL;
    if (!url.startsWith("mysql")) {
      console.error("DATABASE_URL muss mit mysql:// beginnen für MySQL.");
      process.exit(1);
    }
    return url;
  }
  const host = process.env.MYSQL_HOST || process.env.CLOUD_SQL_HOST;
  const port = process.env.MYSQL_PORT || process.env.CLOUD_SQL_PORT || 3306;
  const user = process.env.MYSQL_USER || process.env.CLOUD_SQL_USER;
  const password = process.env.MYSQL_PASSWORD || process.env.CLOUD_SQL_PASSWORD;
  const database = process.env.MYSQL_DATABASE || process.env.CLOUD_SQL_DATABASE || "bellanova_vault";
  if (!host || !user || !password) {
    console.error("Fehler: Setzen Sie in .env: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD (und optional MYSQL_DATABASE).");
    console.error("  .env liegt im Projektordner (dort wo package.json ist).");
    console.error("  Fehlend: " + [!host && "MYSQL_HOST", !user && "MYSQL_USER", !password && "MYSQL_PASSWORD"].filter(Boolean).join(", "));
    process.exit(1);
  }
  return { host, port: Number(port), user, password, database };
}

// Cloud SQL verlangt oft „Nur SSL“. Verbindung mit SSL herstellen.
const sslOption = { rejectUnauthorized: false };

async function main() {
  const config = getConfig();
  let conn;
  try {
    if (typeof config === "string") {
      conn = await mysql.createConnection(config, { ssl: sslOption });
    } else {
      conn = await mysql.createConnection({ ...config, ssl: sslOption });
    }
    const [rows] = await conn.query("SELECT DATABASE() AS db, USER() AS u, NOW() AS now");
    const row = Array.isArray(rows) ? rows[0] : rows;
    console.log("Cloud SQL (MySQL) Verbindung OK:");
    console.log("  Datenbank:", row?.db ?? "-");
    console.log("  Benutzer:", row?.u ?? "-");
    console.log("  Serverzeit:", row?.now ?? "-");
  } catch (err) {
    console.error("Verbindungsfehler:", err.message);
    process.exit(1);
  } finally {
    if (conn) await conn.end();
  }
}

main();
