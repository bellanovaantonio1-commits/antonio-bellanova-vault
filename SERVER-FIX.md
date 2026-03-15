# Server-Probleme beheben (vault.antoniobellanova.com)

## 1. Git: "unmerged files" / Pull nicht möglich

**Option A – Server-Code verwerfen und frisch vom Repo holen (empfohlen, wenn du keine lokalen Änderungen auf dem Server brauchst):**

```bash
cd /opt/antonio-bellanova-vault
git status
# Konflikte anzeigen
git checkout --theirs .   # oder: git reset --hard origin/main
git clean -fd
git pull origin main
```

**Option B – Konflikte manuell auflösen:**

```bash
cd /opt/antonio-bellanova-vault
git status
# Zeigt "Unmerged paths" – z.B. server.ts, package.json
# Dateien öffnen, Konfliktmarker (<<<<<<<, =======, >>>>>>>) entfernen und speichern
git add <geänderte-Dateien>
git commit -m "Resolve merge conflicts"
git pull origin main
```

Danach wieder: `npm ci && npm run build && pm2 restart vault`

---

## 2. PM2: App "stopped" / ständige Restarts (↺ 664)

Die App startet, stürzt aber sofort wieder ab. **Ursache in den Logs prüfen:**

```bash
cd /opt/antonio-bellanova-vault
pm2 logs vault --lines 80
```

**Häufige Ursachen:**

| Ursache | Lösung |
|--------|--------|
| **Port 3000 belegt** | Anderen Prozess finden: `ss -tlnp \| grep 3000` oder Port in `.env` ändern (z.B. `PORT=3001`) |
| **Fehlende .env** | `.env` anlegen (z.B. aus `.env.example`), mindestens `PORT=3000`, ggf. `MYSQL_*` für Cloud SQL |
| **Datenbank** | SQLite: Schreibrechte für `vault.db` im Projektordner. MySQL: `MYSQL_HOST`, `MYSQL_USER`, `MYSQL_PASSWORD`, `MYSQL_DATABASE` in `.env` setzen und Verbindung testen |
| **Node-Modul fehlt** | Im Projektordner: `npm ci` und ggf. `npm run build` erneut ausführen |
| **better-sqlite3 / native** | Auf dem Server: `rm -rf node_modules && npm ci` (Linux-Binary wird neu gebaut) |

**Nach der Korrektur:**

```bash
pm2 restart vault
pm2 logs vault --lines 20
pm2 status
```

Wenn `status` **online** und keine neuen Restarts in den Logs sind, läuft die App. Im Browser: `http://vault.antoniobellanova.com` bzw. die konfigurierte Domain testen.
