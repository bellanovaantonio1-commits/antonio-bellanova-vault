/**
 * Legt .env an (falls nicht vorhanden) und fügt die MySQL-Zeilen ein.
 * Danach: .env öffnen und nur HIER_... durch Ihre echten Werte ersetzen.
 *
 * Aufruf: node scripts/env-mysql-einrichten.js
 */
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, "..", ".env");

const mysqlBlock = `
# --- Google Cloud SQL (MySQL) – Werte unten anpassen ---
MYSQL_HOST=HIER_OEFFENTLICHE_IP_EINTRAGEN
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=HIER_PASSWORT_EINTRAGEN
MYSQL_DATABASE=bellanova_vault
`;

let content = "";
if (fs.existsSync(envPath)) {
  content = fs.readFileSync(envPath, "utf8");
  if (content.includes("MYSQL_HOST")) {
    console.log("In .env sind bereits MYSQL_*-Zeilen vorhanden.");
    console.log("Falls der Test fehlschlägt: .env öffnen und MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD prüfen.");
    process.exit(0);
  }
} else {
  content = "# Vault – Umgebungsvariablen\nPORT=3000\n";
}

content += mysqlBlock;
fs.writeFileSync(envPath, content, "utf8");
console.log("Fertig. Datei geschrieben:", envPath);
console.log("");
console.log("Nächste Schritte:");
console.log("1. Datei .env im Projektordner öffnen (z.B. in Cursor/VS Code).");
console.log("2. Ersetzen Sie:");
console.log("   HIER_OEFFENTLICHE_IP_EINTRAGEN  → die öffentliche IP Ihrer Cloud-SQL-Instanz");
console.log("   HIER_PASSWORT_EINTRAGEN        → das MySQL-Passwort");
console.log("3. Speichern und ausführen: node scripts/test-cloud-sql-mysql.js");
console.log("");
