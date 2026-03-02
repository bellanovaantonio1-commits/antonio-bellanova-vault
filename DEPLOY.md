# Antonio Bellanova Vault – Online stellen

So stellen Sie das Portal ins Internet.

---

## Option A: Eigener Server (VPS) mit Node

1. **Server vorbereiten** (z. B. Ubuntu): Node.js 20+ installieren.
2. **Projekt hochladen** (git clone oder rsync).
3. **Abhängigkeiten & Build:**
   ```bash
   npm ci
   npm run build
   ```
4. **Starten:**
   ```bash
   PORT=3000 npm start
   ```
   Oder mit **PM2** (dauerhaft, Neustart bei Absturz):
   ```bash
   npm install -g pm2
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup   # nur unter Linux: startet die App beim Server-Neustart
   ```
   Unter **Windows** funktioniert `pm2 startup` nicht (nur Linux/Mac). Einfach bei Bedarf `pm2 start ecosystem.config.cjs` ausführen.
5. **Reverse-Proxy** (Nginx/Caddy) für HTTPS und Domain einrichten, z. B. auf `https://vault.antonio-bellanova.de` zeigen lassen.

---

## Option B: Docker

1. **Image bauen:**
   ```bash
   docker build -t antonio-bellanova-vault .
   ```
2. **Container starten** (Port 3000, Datenbank persistent):
   ```bash
   docker run -d -p 3000:3000 -v vault_data:/app --name vault antonio-bellanova-vault
   ```
3. Optional: **Umgebungsvariablen** (z. B. PORT, DATABASE_PATH):
   ```bash
   docker run -d -p 8080:8080 -e PORT=8080 -v vault_data:/app --name vault antonio-bellanova-vault
   ```

---

## Option C: Railway / Render / Fly.io

- **Railway:** Projekt per GitHub verbinden, Root-Verzeichnis auswählen, Build: `npm run build`, Start: `npm start`. `PORT` wird automatisch gesetzt. SQLite-Datei geht bei Neudeploy verloren – für dauerhafte Daten ggf. externes Volume oder externe DB nutzen.
- **Render:** Web Service anlegen, gleiche Build-/Start-Befehle. Bei kostenlosen Instanzen: Speicher nicht persistent.
- **Fly.io:** `fly launch` im Projektordner, dann `fly deploy`. Für persistente DB: Volume anlegen und `DATABASE_PATH` auf Pfad im Volume setzen.

---

## Wichtige Umgebungsvariablen

| Variable          | Bedeutung                    | Standard   |
|------------------|-----------------------------|------------|
| `PORT`           | HTTP-Port                   | `3000`     |
| `NODE_ENV`       | `production` für Live-Betrieb | –       |
| `DATABASE_PATH`  | Pfad zur SQLite-Datei       | `vault.db` |

Optional (z. B. E-Mail): `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `MAIL_FROM` (siehe `.env.example`).

---

## Nach dem Start

- App erreichbar unter: `http://<ihr-server>:3000` (bzw. der konfigurierte Port/Domain).
- Admin-Login: `admin@bellanova.com` / `admin123` (Passwort nach erstem Login ändern).
- Für Produktion: HTTPS (z. B. Let’s Encrypt) und starkes Admin-Passwort verwenden.
