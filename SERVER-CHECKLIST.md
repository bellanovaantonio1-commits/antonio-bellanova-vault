# Server-Checkliste (502 Bad Gateway beheben)

Wenn **502 Bad Gateway** (nginx) erscheint, antwortet die Node-App nicht. Meist: App stürzt beim Start ab (z. B. DB, fehlende .env).

---

## 1. Per SSH auf den Server

```bash
ssh root@vault.antoniobellanova.com
cd /opt/antonio-bellanova-vault
```

---

## 2. Logs prüfen (warum stürzt die App ab?)

```bash
# PM2-Logs (Fehlermeldung sehen)
pm2 logs vault --lines 80

# Oder nur Fehler
pm2 logs vault --err --lines 50
```

**Häufige Fehler:**

| Meldung / Verhalten | Ursache | Maßnahme |
|---------------------|--------|----------|
| `ECONNREFUSED`, `connect ETIMEDOUT` | MySQL nicht erreichbar (Firewall, falsche IP/Port) | MySQL-Host/Port prüfen; von diesem Server aus: `telnet MYSQL_HOST 3306` oder `nc -zv MYSQL_HOST 3306` |
| `Access denied for user` | Falsches MYSQL_USER / MYSQL_PASSWORD | `.env`: MYSQL_USER, MYSQL_PASSWORD prüfen |
| `Cannot find module` | Abhängigkeiten fehlen | Auf dem Server: `npm install --legacy-peer-deps` |
| `dist/ not found` oder kein Frontend | Build fehlt | `npm run build` |
| `EADDRINUSE: port 3000` | Port schon belegt | PORT in .env ändern (z. B. 3001) und ggf. Nginx auf neuen Port anpassen |

---

## 3. .env auf dem Server prüfen

```bash
cat .env | grep -E '^PORT|^MYSQL_|^NODE_ENV'
```

- **PORT** muss mit dem übereinstimmen, was Nginx als `proxy_pass` verwendet (z. B. 3000).
- Bei **MySQL**: MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DATABASE müssen stimmen.
- **NODE_ENV=production** wird von `npm run start` gesetzt; in .env optional.

---

## 4. App einmal direkt starten (ohne PM2)

So sehen Sie den Fehler direkt im Terminal:

```bash
cd /opt/antonio-bellanova-vault
npm run start
```

- Wenn hier eine Fehlermeldung erscheint und der Prozess beendet wird → diese Meldung beheben (DB, .env, Module).
- Wenn „Antonio Bellanova Vault running at http://localhost:3000“ erscheint → Strg+C, dann PM2 verwenden.

---

## 5. PM2 sauber neu starten

```bash
cd /opt/antonio-bellanova-vault
pm2 delete vault
npm run build
pm2 start ecosystem.config.cjs
pm2 save
pm2 logs vault --lines 30
```

Wenn Sie **kein** `ecosystem.config.cjs` nutzen:

```bash
pm2 delete vault
pm2 start npm --name vault -- run start
pm2 save
```

---

## 6. Nginx prüfen

Nginx muss auf den gleichen Port zeigen wie die App (z. B. 3000):

```bash
grep -A5 "proxy_pass\|listen" /etc/nginx/sites-enabled/*
```

Typisch z. B.:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    ...
}
```

Wenn die App auf **PORT=3001** läuft, muss hier `3001` stehen. Danach:

```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## 7. Kurz-Checkliste

- [ ] `pm2 logs vault` → keine wiederholten Crash-Meldungen
- [ ] `curl -s http://127.0.0.1:3000/api/health` oder `curl -s http://127.0.0.1:PORT/` liefert Antwort (kein „Connection refused“)
- [ ] `.env` vorhanden, MYSQL_* bzw. SQLite-Pfad korrekt
- [ ] `npm run build` und `dist/` vorhanden
- [ ] Nginx `proxy_pass` = gleicher Port wie in .env (PORT)

Wenn Sie die **konkrete Fehlermeldung** aus `pm2 logs vault` oder aus `npm run start` schicken, kann man den nächsten Schritt genau sagen.
