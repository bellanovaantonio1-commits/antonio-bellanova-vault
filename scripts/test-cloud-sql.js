/**
 * Test der Verbindung zu Google Cloud SQL (PostgreSQL).
 * Vor dem Aufruf Umgebungsvariablen setzen:
 *   DATABASE_URL=postgresql://user:pass@host:5432/dbname
 *   ODER: PGHOST, PGPORT, PGUSER, PGPASSWORD, PGDATABASE
 *
 * Aufruf: node scripts/test-cloud-sql.js
 */
import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

function getConfig() {
  if (process.env.DATABASE_URL) {
    return { connectionString: process.env.DATABASE_URL };
  }
  const host = process.env.PGHOST || process.env.CLOUD_SQL_HOST;
  const port = process.env.PGPORT || process.env.CLOUD_SQL_PORT || 5432;
  const user = process.env.PGUSER || process.env.CLOUD_SQL_USER;
  const password = process.env.PGPASSWORD || process.env.CLOUD_SQL_PASSWORD;
  const database = process.env.PGDATABASE || process.env.CLOUD_SQL_DATABASE || "vault";
  if (!host || !user || !password) {
    console.error("Fehler: Setzen Sie DATABASE_URL oder PGHOST, PGUSER, PGPASSWORD (und optional PGDATABASE).");
    process.exit(1);
  }
  return { host, port: Number(port), user, password, database };
}

async function main() {
  const pool = new Pool(getConfig());
  try {
    const res = await pool.query("SELECT current_database(), current_user, now()");
    console.log("Cloud SQL Verbindung OK:");
    console.log("  Datenbank:", res.rows[0].current_database);
    console.log("  Benutzer:", res.rows[0].current_user);
    console.log("  Serverzeit:", res.rows[0].now);
  } catch (err) {
    console.error("Verbindungsfehler:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
