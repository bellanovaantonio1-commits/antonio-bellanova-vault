# Vault Live-Gang: komplette Checkliste (502 / PM2 / MySQL / Nginx)

Domain-Beispiel: **https://vault.antoniobellanova.com**

Ein **502 Bad Gateway** bedeutet fast immer: **Nginx lebt, die Node-App dahinter nicht** (Prozess `errored`, kein Listen auf Port 3000, oder falscher `proxy_pass`).

---

## A) Deine Angaben auf dem Server (ohne etwas ins Git zu committen)

Datei **`/opt/antonio-bellanova-vault/.env`** (oder dein Pfad) – Inhalt **nie** öffentlich posten.

| Variable | Zweck |
|----------|--------|
| `PORT` | Standard **3000**; muss zu **Nginx `proxy_pass`** passen |
| `MYSQL_HOST` | Öffentliche IP der Cloud-SQL-Instanz (oder Private IP + VPC) |
| `MYSQL_PORT` | Meist **3306** |
| `MYSQL_USER` | DB-Benutzer |
| `MYSQL_PASSWORD` | DB-Passwort |
| `MYSQL_DATABASE` | z. B. `bellanova_vault` |

**Wenn `MYSQL_HOST` + User + Passwort gesetzt sind**, nutzt die App **MySQL** (kein lokales `vault.db` für den Hauptpfad).

**Cloud SQL:** Unter „Verbindungen“ → **Autorisierte Netzwerke** muss die **öffentliche IP deines Ubuntu-Servers** (App-Server) erlaubt sein – nicht nur dein Heim-PC.

---

## B) Code & Build auf dem Server

**Wichtig:** Ohne **`git pull`** läuft oft noch alter Stand. In den PM2-Logs: Wenn **`server.ts:1960`** bei `seedAdmin` steht, passt die Zeilennummer oft **nicht** zum aktuellen Repo (`seedAdmin` liegt weiter unten) → **Code nicht aktualisiert**.

```bash
cd /opt/antonio-bellanova-vault
git fetch origin && git status
git pull origin main
git log -1 --oneline   # neuster Commit sichtbar?
npm ci
npm run build
```

- **`npm ci`** braucht die Datei **`.npmrc`** im Repo (`legacy-peer-deps=true`).
- **`dist/`** muss existieren, sonst Production-UI fehlt (API kann trotzdem starten).

---

## C) PM2 sauber neu starten

Wenn Status **`errored`** oder **↺** sehr hoch:

```bash
cd /opt/antonio-bellanova-vault
pm2 delete vault 2>/dev/null
pm2 start ecosystem.config.cjs
pm2 save
```

`ecosystem.config.cjs` setzt **`NODE_ENV=production`** und **`PORT=3000`**.

---

## D) Automatischer Check (empfohlen)

```bash
cd /opt/antonio-bellanova-vault
bash scripts/check-vault-deploy.sh
```

- Zeigt **nicht** Passwörter an.
- Prüft `.env`-Keys, `dist/`, PM2, Port 3000, **`curl` lokales `/api/health`**, und listet **`proxy_pass`**.

---

## E) Manuell: kommt die App lokal an?

```bash
curl -sS -m 3 http://127.0.0.1:3000/api/health
pm2 logs vault --lines 60 --nostream
```

- **Verbindung verweigert** → App läuft nicht bis `server.listen` (meist MySQL/Schema/`seedAdmin` – siehe Fehlerzeile `Server start failed:`).
- **HTTP 200** → App ok; dann nur noch Nginx.

---

## F) Nginx für `vault.antoniobellanova.com`

Konfiguration liegt oft unter:

- `/etc/nginx/sites-enabled/`
- `/etc/nginx/conf.d/`

Suche:

```bash
sudo grep -r "server_name\|proxy_pass" /etc/nginx/
```

**`proxy_pass`** muss zu dem Port passen, auf dem Node lauscht, z. B.:

```nginx
proxy_pass http://127.0.0.1:3000;
```

Dann:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## G) Typische Fehler aus den Logs

| Meldung | Maßnahme |
|---------|----------|
| `Unknown column 'password'` | Neuesten `server.ts` ziehen (`ensureUsersCoreColumns`), `git pull`, PM2 neu |
| `ER_TOO_LONG_KEY` / Index | Neuestes `lib/db.ts` (`seq_key`/`seq_type` kürzer), ggf. Tabelle `number_sequences` droppen wenn leer |
| `connect ETIMEDOUT` MySQL | `MYSQL_HOST`, Firewall GCP, autorisierte Netzwerke |
| `ER_PARSE` / `key` / `last_value` | Neuestes `lib/db.ts` |

---

## H) Kurz-Reihenfolge (wenn „geht immer noch nicht“)

1. `git pull` + `npm ci` + `npm run build`  
2. `.env` prüfen (MySQL + `PORT=3000`)  
3. `pm2 delete vault`; `pm2 start ecosystem.config.cjs`  
4. `bash scripts/check-vault-deploy.sh`  
5. Wenn `curl` auf 3000 **OK** → Nginx `proxy_pass` + `nginx -t` + reload  
6. Wenn `curl` **fehlgeschlagen** → **nur** `pm2 logs vault` Fehler beheben (erst dann Sinn auf 502 an der Domain zu schauen)

---

Weitere Details: [502-SCHNELLFIX-DE.md](./502-SCHNELLFIX-DE.md), [DEPLOYMENT_NGINX.md](./DEPLOYMENT_NGINX.md)
