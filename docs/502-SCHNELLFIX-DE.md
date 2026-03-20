# 502 Bad Gateway – schnell beheben (vault.antoniobellanova.com)

**502** = Nginx ist ok, aber **keine Antwort von der Node-App** (abgestürzt, falscher Port, oder Prozess aus).

## 1. Auf dem Ubuntu-Server einloggen

```bash
cd /opt/antonio-bellanova-vault   # oder dein Projekt-Pfad
git pull
npm ci
npm run build
```

## 2. Prüfen, ob die App lokal antwortet

```bash
pm2 status
pm2 logs vault --lines 80 --nostream
curl -sS -o /dev/null -w "%{http_code}\n" http://127.0.0.1:3000/api/health
# oder eine Route, die existiert:
curl -sS http://127.0.0.1:3000/api/health | head -c 200
```

- **`curl` schlägt fehl / leer** → Node läuft nicht oder nicht auf **3000**. Logs lesen (DB/MySQL-Fehler, Syntax-Fehler).
- **`200` oder JSON** → App ist ok, dann Nginx prüfen (Schritt 4).

## 3. App neu starten (nach Code/.env-Änderung)

```bash
pm2 restart vault --update-env
# oder mit ecosystem:
pm2 delete vault 2>/dev/null
pm2 start ecosystem.config.cjs
pm2 save
```

Stelle sicher, dass im Projekt eine **`.env`** liegt (mit `PORT=3000`, falls du nichts anderes nutzt) und **MySQL** erreichbar ist, sonst startet `server.ts` beim Schema nicht durch → 502.

## 4. Nginx: gleicher Port wie die App

```bash
sudo grep -r proxy_pass /etc/nginx/sites-enabled/
```

`proxy_pass` muss zeigen auf **`http://127.0.0.1:3000`** (oder exakt den Wert von `PORT` in `.env` / PM2).

Beispiel innerhalb von `server { ... ssl ... }`:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;
}
```

Dann:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

## 5. Typische Ursachen bei diesem Projekt

| Ursache | Was tun |
|--------|--------|
| Alte `lib/db.ts` / Schema-Fehler MySQL | `git pull`, `pm2 restart`, Logs prüfen |
| `.env` fehlt `PORT` / weicht von Nginx ab | Einheitlich **3000** oder überall anpassen |
| `npm run build` vergessen | `npm run build`, dann PM2 neu starten |
| Cloud SQL nicht erreichbar | `MYSQL_*` in `.env`, Firewall / Authorized networks |

---

Mehr Details: [DEPLOYMENT_NGINX.md](./DEPLOYMENT_NGINX.md)
