# Migration der Vault-App auf Cloud SQL (MySQL)

## Aktueller Stand

- **lib/db.ts** – DB-Adapter ist fertig:
  - Ohne `MYSQL_*` in der `.env` → **SQLite** (wie bisher, nur über den Adapter mit async-API).
  - Mit `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD` (und optional `MYSQL_DATABASE`) → **MySQL** (Cloud SQL) mit SSL.
- **Test:** `node scripts/test-cloud-sql-mysql.js` verbindet erfolgreich mit **bellanova_vault**.

Damit die **gesamte App** (Login, Tresor, Verträge, Admin usw.) Cloud SQL nutzt, muss der Server auf die **asynchrone** DB-API umgestellt werden.

---

## Was noch fehlt (Server-Umstellung)

Der Server (`server.ts`) nutzt die Datenbank heute an **über 100 Stellen** **synchron** (z. B. `db.prepare(...).get()`). Der Adapter ist **asynchron** (`await db.prepare(...).get()`). Für einen vollständigen Umstieg auf Cloud SQL (oder ein einheitliches async-Setup) sind folgende Schritte nötig:

1. **DB-Initialisierung beim Start**
   - Statt `const db = new Database("vault.db")` am Anfang:
   - Beim Start: `db = await initDb();` (aus `lib/db.ts`).
   - Schema (alle `CREATE TABLE` und `ALTER TABLE`) in eine async-Funktion `runSchema(db)` auslagern und mit `await db.exec(...)` bzw. `await db.prepare(...).run()` aufrufen.
   - `runSchema(db)` direkt nach `initDb()` aufrufen (z. B. in `startServer()`).

2. **Alle DB-Aufrufe auf async umstellen**
   - Jeden Aufruf `db.prepare(...)` durch `await db.prepare(...)` ersetzen.
   - Jeden Aufruf `db.exec(...)` durch `await db.exec(...)` ersetzen.
   - Nur in **async**-Funktionen ist `await` erlaubt.

3. **Route-Handler async machen**
   - Jeden Handler, der die DB nutzt, von `(req, res) => { ... }` auf `async (req, res) => { ... }` umstellen (und darin `await` für DB-Aufrufe verwenden).

4. **Hilfsfunktionen, die die DB nutzen**
   - Z. B. `upgradePasswordIfNeeded` auf `async` umstellen und an allen Aufrufen `await upgradePasswordIfNeeded(...)` verwenden.

5. **Server-Start**
   - `startServer()` ist bereits `async`. Am Anfang von `startServer()`:
     - `db = await initDb();`
     - `await runSchema(db);`
     - Danach wie bisher Vite/Static und `server.listen(...)`.

---

## Kurz: So nutzen Sie Cloud SQL nach der Umstellung

1. **.env** (wie bereits eingerichtet):
   - `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE=bellanova_vault`
   - Optional: SSL wird vom Adapter gesetzt.

2. **Server starten:** `npm run dev` bzw. `npm start`.  
   Beim Start wird `initDb()` aufgerufen; wenn `MYSQL_*` gesetzt ist, verbindet die App mit Cloud SQL (MySQL), sonst mit SQLite.

3. **Schema:** Beim ersten Start mit MySQL werden alle Tabellen per `runSchema(db)` angelegt (sobald diese Funktion wie oben eingebaut ist).

---

## Nächster Schritt

Wenn Sie möchten, kann die Umstellung in `server.ts` (Schema auslagern, async/await, async-Handler) in einem weiteren Schritt konkret vorgenommen werden. Der Adapter in **lib/db.ts** und die MySQL-Verbindung (inkl. Test-Skript) sind dafür bereits vorhanden.
