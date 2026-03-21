# Plattform online stellen

So bringen Sie die Antonio Bellanova Vault-Plattform ins Internet.

---

## 1. Voraussetzungen

- **Node.js** (z. B. v18 oder v20) auf dem Server oder Ihrem Hosting
- **Domain** (z. B. `vault.antoniobellanova.com`) zeigt auf Ihren Server

---

## 2. Projekt vorbereiten

### Abhängigkeiten installieren

```bash
npm install --legacy-peer-deps
```

### Umgebungsvariablen setzen

Kopieren Sie `.env.example` nach `.env` und tragen Sie Ihre Werte ein:

```bash
cp .env.example .env
```

Wichtige Variablen für den Betrieb:

| Variable | Beschreibung |
|----------|--------------|
| `PORT` | Port des Servers (z. B. `3000`). Bei IONOS/Railway oft vorgegeben. |
| `NODE_ENV` | Für Produktion: `production` (setzt der Start-Befehl oft automatisch). |
| `DATABASE_PATH` | Pfad zur SQLite-Datei (Standard: `vault.db`). Bei Cloud: siehe MySQL/PostgreSQL. |
| `STRIPE_SECRET_KEY` | Stripe Secret Key (sk_live_... oder sk_test_...) |
| `STRIPE_PUBLIC_KEY` | Stripe Publishable Key (pk_live_... oder pk_test_...) |
| `STRIPE_WEBHOOK_SECRET` | Webhook-Secret aus dem Stripe-Dashboard (whsec_...) |
| `APP_URL` oder `BASE_URL` | Öffentliche URL, z. B. `https://vault.antoniobellanova.com` (für E-Mails/Links) |

Optional: SMTP für Kontaktformular, MySQL/PostgreSQL wenn Sie keine SQLite-Datei nutzen.

---

## 3. Build und Start (Produktion)

### Frontend bauen

```bash
npm run build
```

Erzeugt den Ordner `dist/` mit der gebündelten React-App.

### Server starten (serviert automatisch die gebaute App)

```bash
npm run start
```

Oder in einem Schritt Build + Start:

```bash
npm run start:prod
```

Der Server:

- hört auf `PORT` (Standard 3000),
- bindet an `0.0.0.0` (von außen erreichbar),
- serviert bei `NODE_ENV=production` die statischen Dateien aus `dist/` (Frontend) und alle API-Routen unter `/api/*`.

---

## 4. Stripe-Webhook für Live-Betrieb

1. Im **Stripe-Dashboard** → **Developers** → **Webhooks** einen Endpoint anlegen.
2. URL: `https://IHRE-DOMAIN/api/stripe/webhook`
3. Event auswählen: **payment_intent.succeeded**
4. **Signing secret** (whsec_...) kopieren und in `.env` als `STRIPE_WEBHOOK_SECRET` eintragen.

Ohne korrekten Webhook werden Zahlungen (Wallet, Rechnungen, Direktkäufe) nicht verbucht.

---

## 5. Typische Hosting-Optionen

### A) Eigener Server (VPS) oder IONOS

1. Node.js installieren, Projekt per Git/Upload bereitstellen.
2. `.env` anlegen und Variablen setzen.
3. `npm run start:prod` ausführen (oder mit **PM2** dauerhaft laufen lassen):

   ```bash
   npm install -g pm2
   npm run build
   pm2 start server.ts --interpreter=tsx --name vault --env production
   pm2 save && pm2 startup
   ```

4. **Nginx** (oder Apache) als Reverse-Proxy vor den Node-Server setzen, SSL mit Let’s Encrypt (z. B. Certbot).

Beispiel Nginx (Minimal):

```nginx
server {
    listen 80;
    server_name vault.antoniobellanova.com;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Danach auf HTTPS umstellen und Port 3000 nur lokal erreichbar lassen.

**502 Bad Gateway (Nginx):** Der Proxy erreicht Node nicht oder die App antwortet nicht rechtzeitig. Auf dem Server prüfen: `pm2 status` / `pm2 logs vault --lines 80`, lokal `curl -sS http://127.0.0.1:3000/api/health`. Wenn `errored` oder kein Listen auf Port 3000: nach `git pull` immer `npm ci --legacy-peer-deps`, `npm run build`, `pm2 restart vault --update-env`.

### B) Railway / Render / Fly.io

1. Projekt per Git verbinden.
2. Build-Befehl: `npm run build` (oder `npm install --legacy-peer-deps && npm run build`).
3. Start-Befehl: `npm run start` (bzw. `NODE_ENV=production tsx server.ts`).
4. `PORT` wird oft automatisch gesetzt – keine Anpassung nötig, falls die Plattform das übergibt.
5. Alle weiteren Werte (Stripe, DB-URL, APP_URL) in den **Environment Variables** des Hostings eintragen.
6. Stripe-Webhook-URL auf die von Railway/Render/Fly bereitgestellte Domain setzen.

### C) Docker (falls Dockerfile im Projekt)

Wenn ein `Dockerfile` vorhanden ist:

```bash
docker build -t bellanova-vault .
docker run -p 3000:3000 --env-file .env bellanova-vault
```

`.env` muss alle nötigen Variablen enthalten; bei Cloud-DB die richtige Verbindungs-URL nutzen.

---

## 6. Checkliste vor Go-Live

- [ ] `npm run build` läuft fehlerfrei
- [ ] `.env` mit `NODE_ENV=production` bzw. Start mit `npm run start`
- [ ] `STRIPE_SECRET_KEY`, `STRIPE_PUBLIC_KEY`, `STRIPE_WEBHOOK_SECRET` gesetzt
- [ ] Webhook-URL in Stripe auf die echte Domain zeigt
- [ ] `APP_URL`/`BASE_URL` = öffentliche URL der Plattform
- [ ] Datenbank (SQLite-Datei oder Cloud-DB) erreichbar und Backups eingerichtet
- [ ] HTTPS aktiv (Nginx/Apache oder durch Hosting)
- [ ] Nach Test-Zahlung: Webhook-Log in Stripe prüfen, Wallet/Rechnung/Kauf wird verbucht

---

## 7. Online aktualisieren

Wenn Sie Änderungen am Code haben und die **live laufende Plattform** aktualisieren wollen:

### Auf eigenem Server (VPS / IONOS) mit Git

```bash
# 1. Ins Projektverzeichnis wechseln
cd /pfad/zu/antonio-bellanova-masterpiece-platform

# 2. Neueste Änderungen holen (falls Sie mit Git arbeiten)
git pull

# 3. Abhängigkeiten prüfen (nach pull oft nötig)
npm install --legacy-peer-deps

# 4. Neu bauen
npm run build

# 5. Server neu starten
# Mit PM2:
pm2 restart vault

# Ohne PM2 (Prozess stoppen, dann):
npm run start
```

### Mit PM2 (empfohlen für dauerhaften Betrieb)

```bash
npm run build
pm2 restart vault
```

`vault` ist der Name, den Sie bei `pm2 start ... --name vault` vergeben haben.

### Bei Railway / Render / Fly.io

- **Git-basiert:** Einfach **pushen** (z. B. `git push origin main`). Das Hosting baut und startet automatisch neu.
- **Manuell:** Im Dashboard „Redeploy“ oder „Deploy latest“ auslösen.

### Wichtig beim Aktualisieren

- **.env** nicht überschreiben – Ihre Zugangsdaten (Stripe, DB, SMTP) bleiben unverändert.
- **Datenbank:** Bei Schema-Änderungen legt der Server neue Tabellen/Spalten beim Start oft selbst an (CREATE TABLE IF NOT EXISTS, ALTER TABLE). SQLite-Datei `vault.db` bleibt erhalten.
- Kurze Downtime: Beim Neustart ist die Seite meist wenige Sekunden nicht erreichbar.

---

## 8. Kurzreferenz Befehle

| Aktion | Befehl |
|--------|--------|
| Entwicklung (mit Hot-Reload) | `npm run dev` |
| Produktions-Build | `npm run build` |
| Produktion starten | `npm run start` |
| Build + Start | `npm run start:prod` |
| Online aktualisieren (mit PM2) | `npm run build` → `pm2 restart vault` |

Die Plattform ist erreichbar unter: **http://localhost:PORT** (lokal) bzw. **https://IHRE-DOMAIN** (mit Proxy/SSL).
