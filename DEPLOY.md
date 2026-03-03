# Antonio Bellanova Vault – Online stellen

Die App besteht aus **einem Node-Server** (Express + Vite-Build), der Frontend und API ausliefert. Datenbank: **SQLite** (Datei `vault.db`).

---

## Option 1: Railway (empfohlen, schnell)

1. **Account:** [railway.app](https://railway.app) → Sign up (z.B. mit GitHub).
2. **Neues Projekt:** "New Project" → "Deploy from GitHub repo" (Repo verbinden) oder "Empty Project".
3. **Deploy:**
   - Bei GitHub: Repo auswählen, Root-Verzeichnis = Projektordner. Railway erkennt oft automatisch Node.
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Root Directory:** Falls das Repo mehrere Projekte hat, hier den Ordner angeben (z.B. `antonio-bellanova-masterpiece-platform`).
4. **Umgebung:** Unter "Variables" setzen:
   - `NODE_ENV=production`
   - `PORT` wird von Railway gesetzt (nicht überschreiben).
5. **Datenbank:** SQLite-Datei liegt im Container. Für dauerhafte Daten ein **Volume** anlegen: "Volumes" → Mount Path z.B. `/app/data`, dann `DATABASE_PATH=/app/data/vault.db` setzen.

Nach dem Deploy gibt Railway eine URL (z.B. `https://...railway.app`).

---

## Option 2: Render

1. [render.com](https://render.com) → Sign up → "New" → "Web Service".
2. Repo verbinden (GitHub/GitLab).
3. **Build & Deploy:**
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run start`
   - **Environment:** `NODE_ENV=production`
4. **Persistent Disk (optional):** Unter "Disks" eine Disk hinzufügen und z.B. `/data` mounten. Dann `DATABASE_PATH=/data/vault.db` setzen, damit die SQLite-DB nach Neudeployments erhalten bleibt.

---

## Option 3: Docker (eigener Server / VPS / beliebiger Hoster)

Im Projektordner:

```bash
# Image bauen
docker build -t antonio-vault .

# Container starten (Port 3000, DB im Volume)
docker run -d --name vault -p 3000:3000 \
  -v vault-data:/app/data \
  -e DATABASE_PATH=/app/data/vault.db \
  -e NODE_ENV=production \
  antonio-vault
```

App: `http://<Server-IP>:3000`. Für HTTPS einen Reverse-Proxy (z.B. Nginx, Caddy) oder einen Hoster mit SSL davor setzen.

---

## Option 4: Ohne Docker (VPS mit Node)

Auf einem Linux-Server (z.B. Ubuntu):

```bash
# Node 20+ (z.B. über nvm)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 20
nvm use 20

# Projekt klonen bzw. hochladen
cd /pfad/zu/antonio-bellanova-masterpiece-platform

# Abhängigkeiten & Build
npm ci
npm run build

# Server starten (dauerhaft z.B. mit pm2)
npm run start
# Oder mit pm2:
# npm install -g pm2
# pm2 start "npm run start" --name vault
# pm2 save && pm2 startup
```

Umgebungsvariablen z.B. in `.env` oder beim Start:

- `NODE_ENV=production`
- `PORT=3000` (oder 80, wenn kein Reverse-Proxy)
- `DATABASE_PATH=/var/lib/vault/vault.db` (optional, Standard: `vault.db` im Projektordner)

**HTTPS:** Nginx oder Caddy als Reverse-Proxy mit Let’s Encrypt (z.B. Certbot) einrichten und auf `localhost:3000` weiterleiten.

---

## Wichtige Hinweise

- **SQLite:** Bei Railway/Render ohne persistentes Volume/ Disk geht die DB bei jedem Neustart/Redepoy verloren. Für Produktion mit Daten: Volume/Disk nutzen und `DATABASE_PATH` setzen.
- **HTTPS:** Bei Railway und Render ist HTTPS in der Regel schon aktiv. Bei eigenem Server: Reverse-Proxy mit SSL (z.B. Caddy oder Nginx + Certbot).
- **WebSockets:** Werden über dieselbe URL/Port wie die App genutzt; bei Proxy ggf. WebSocket-Support aktivieren (z.B. Nginx: `proxy_http_version 1.1; proxy_set_header Upgrade $http_upgrade; proxy_set_header Connection "upgrade";`).
- **.env:** Keine sensiblen Daten ins Repo legen. Geheimnisse nur über die Umgebungsvariablen des Hosting-Anbieters setzen.

---

## Schnelltest lokal (Production-Build)

```bash
npm run build
npm run start
```

Dann im Browser: `http://localhost:3000`.
