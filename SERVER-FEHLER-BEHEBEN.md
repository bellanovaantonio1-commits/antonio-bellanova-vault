# Server: Vault startet nicht (PM2 „stopped“ / Crash-Loop)

Wenn `pm2 status` bei **vault** „stopped“ und viele Restarts (↺) zeigt, stürzt die App beim Start ab.

---

## 1. Fehler anzeigen

**Auf dem Server** (per SSH):

```bash
cd /opt/antonio-bellanova-vault
pm2 logs vault --lines 80
```

Oder die App **einmal von Hand** starten, dann erscheint der Fehler direkt im Terminal:

```bash
cd /opt/antonio-bellanova-vault
NODE_ENV=production npx tsx server.ts
```

Typische Meldungen und was zu tun ist:

| Fehler | Lösung |
|--------|--------|
| `Cannot find module '...'` | `npm ci` ausführen, danach erneut starten. |
| `EACCES` / `Permission denied` (vault.db oder Ordner) | Schreibrechte prüfen: `ls -la vault.db 2>/dev/null; ls -la .` – Verzeichnis ggf. `chown` auf den User, der die App startet. |
| `Error: connect ECONNREFUSED` (MySQL) | Cloud SQL: `MYSQL_HOST`, `MYSQL_PORT`, Firewall/Netzwerk prüfen; ob MySQL läuft und von diesem Server erreichbar ist. |
| `dist/ not found` | Im Projektordner `npm run build` ausführen. |
| `.env` fehlt | `.env` aus `.env.example` anlegen und anpassen (mind. PORT, ggf. MYSQL_*, DATABASE_PATH). |
| **SqliteError: no such column: rl.updated_at** | Alte SQLite-DB: Spalte `updated_at` fehlt in `resale_listings`. Neuesten Code deployen (enthält Migration) und App neu starten – beim Start wird die Spalte automatisch ergänzt. |
| **NODE_ENV=development** in den Logs | Produktion: In `.env` auf dem Server `NODE_ENV=production` setzen (oder in `ecosystem.config.cjs` unter `env`) und PM2 neu starten. |

---

## 2. .env auf dem Server

Damit die App überhaupt startet, muss im Projektordner eine `.env` existieren:

```bash
cd /opt/antonio-bellanova-vault
test -f .env || cp .env.example .env
nano .env   # oder vi – Port, DB, ggf. MYSQL_* eintragen
```

Speichern, dann:

```bash
pm2 restart vault
pm2 logs vault --lines 30
```

---

## 3. PM2 mit direktem Start (bessere Fehlerausgabe)

Statt `npm start` kann PM2 den Prozess direkt starten – dann sind Logs und Absturzursache oft klarer:

```bash
pm2 delete vault
pm2 start ecosystem.config.cjs
pm2 logs vault
```

Falls du die Konfiguration anpassen willst: In `ecosystem.config.cjs` kann `script` auf `node_modules/.bin/tsx` und `args` auf `server.ts` gesetzt werden (siehe Projektdatei).

---

## 4. Git-Mergekonflikte auf dem Server

Wenn `git pull` mit „unmerged files“ abbricht:

- **Option A – Änderungen auf dem Server verwerfen** (Server-Code = Stand aus Git):
  ```bash
  cd /opt/antonio-bellanova-vault
  git status                    # anzeigen, welche Dateien betroffen sind
  git checkout --theirs .       # alle Konflikte mit Remote-Version lösen
  git add -A
  git commit -m "Resolve merge conflicts (use server version)"
  git pull
  ```
- **Option B – Lokale Änderungen behalten** (nur wenn du bewusst etwas nur auf dem Server geändert hast):
  ```bash
  git checkout --ours .
  git add -A
  git commit -m "Keep local server changes"
  git pull   # kann erneut Konflikte geben
  ```

Danach: `npm ci && npm run build && pm2 restart vault`.
