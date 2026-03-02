# Antonio Bellanova Vault – Hosten bei IONOS

So stellst du das Portal auf einem **IONOS VPS** mit deiner bestehenden Domain online (z. B. **vault.deine-domain.de**).

---

## Voraussetzungen

- **IONOS VPS** (z. B. VPS L oder M) mit **Ubuntu 22.04 oder 24.04**
- **SSH-Zugang** (Benutzername + Passwort oder SSH-Key aus dem IONOS Kundenbereich)
- **Domain** bei IONOS (z. B. `deine-domain.de`) – deine bestehende Website

---

## Schritt 1: VPS bei IONOS (falls noch nicht vorhanden)

1. Im IONOS Kundenbereich: **Server** → **VPS** → **VPS buchen**
2. **Ubuntu 22.04** (oder 24.04) wählen
3. Nach dem Erstellen: **IP-Adresse** und **SSH-Zugangsdaten** notieren (unter „Zugangsdaten“ / „Login“)

---

## Schritt 2: Per SSH mit dem Server verbinden

Auf deinem PC (PowerShell oder CMD):

```bash
ssh root@DEINE-VPS-IP
```

(z.B. `ssh root@123.45.67.89`)  
Passwort eingeben, wenn gefragt.

---

## Schritt 3: Node.js 20 installieren

Auf dem Server (nach dem SSH-Login):

```bash
apt update && apt install -y curl git

# Node.js 20 (LTS)
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

node -v
npm -v
```

Es sollten z. B. `v20.x.x` und eine npm-Version erscheinen.

---

## Schritt 4: Projekt auf den Server holen

**Option A – Mit GitHub (empfohlen):**

```bash
cd /opt
git clone https://github.com/bellanovaantonio1-commits/antonio-bellanova-vault.git
cd antonio-bellanova-vault
```

**Option B – Ohne GitHub:** Projekt als ZIP hochladen (z. B. per SFTP/FileZilla nach `/opt/antonio-bellanova-vault`) und dort entpacken.

---

## Schritt 5: App bauen und dauerhaft starten

```bash
cd /opt/antonio-bellanova-vault

npm ci
npm run build

# PM2 installieren (startet die App dauerhaft, Neustart bei Absturz)
npm install -g pm2
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup
```

Den Befehl, den `pm2 startup` ausgibt (z. B. `sudo env PATH=...`), **einmal ausführen**.  
Danach läuft die App im Hintergrund auf **Port 3000**.

---

## Schritt 6: Subdomain für das Portal einrichten (z. B. vault.deine-domain.de)

1. **IONOS Kundenbereich** → deine Domain → **Verwaltung** → **DNS** / **Subdomains**
2. **Neue Subdomain** anlegen, z. B.:
   - **Subdomain:** `vault` (oder `portal`, `kunden`)
   - **Ziel:** **A-Record** auf die **IP-Adresse deines VPS**
3. Speichern und **5–30 Minuten** warten (DNS-Verbreitung).

---

## Schritt 7: Nginx + HTTPS (damit Kunden https://vault.deine-domain.de nutzen)

Auf dem Server:

```bash
apt install -y nginx certbot python3-certbot-nginx
```

**Nginx-Konfiguration anlegen:**

```bash
nano /etc/nginx/sites-available/vault
```

Inhalt (**`vault.deine-domain.de`** und **`DEINE-VPS-IP** durch deine Werte ersetzen):

```nginx
server {
    listen 80;
    server_name vault.deine-domain.de;
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Speichern (Strg+O, Enter, Strg+X). Dann:

```bash
ln -s /etc/nginx/sites-available/vault /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

**SSL-Zertifikat (HTTPS) mit Let's Encrypt:**

```bash
certbot --nginx -d vault.deine-domain.de
```

E-Mail angeben, AGB zustimmen. Certbot richtet HTTPS ein und verlängert das Zertifikat automatisch.

---

## Schritt 8: Firewall (Port 80 und 443 öffnen)

```bash
ufw allow 22
ufw allow 80
ufw allow 443
ufw enable
```

---

## Fertig

- **Portal-URL:** https://vault.deine-domain.de (oder die von dir gewählte Subdomain)
- **Admin-Login:** `admin@bellanova.com` / `admin123` (Passwort nach dem ersten Login ändern)
- Diese URL kannst du an Kunden weitergeben.

---

## Nützliche Befehle (später)

| Befehl | Bedeutung |
|--------|-----------|
| `pm2 status` | Zeigt, ob die App läuft |
| `pm2 logs vault` | Logs der App anzeigen |
| `pm2 restart vault` | App neu starten (z. B. nach Änderungen) |
| `cd /opt/antonio-bellanova-vault && git pull && npm ci && npm run build && pm2 restart vault` | Projekt aktualisieren (nach `git push` von deinem PC) |

---

## Wenn du keinen VPS, sondern nur Webspace hast

IONOS **Webhosting** (klassischer Webspace) unterstützt **kein Node.js**. Dort laufen nur PHP/statische Seiten. Für dieses Portal brauchst du einen **VPS** bei IONOS (oder einen anderen Anbieter). Im IONOS Tarifvergleich: nach „VPS“ oder „Cloud Server“ schauen.
