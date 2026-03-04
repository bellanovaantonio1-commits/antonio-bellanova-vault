# Vault online bringen (vault.antoniobellanova.com)

## Einmalig: Server vorbereiten

1. **SSH auf den Server**
   ```bash
   ssh root@vault.antoniobellanova.com
   ```
   (oder `ssh root@DEINE-SERVER-IP`)

2. **Node.js 20, Git, Nginx (falls noch nicht)**
   ```bash
   apt update && apt install -y curl git nginx certbot python3-certbot-nginx
   curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
   apt install -y nodejs
   ```

3. **Projekt klonen (falls noch nicht)**
   ```bash
   cd /opt
   git clone https://github.com/bellanovaantonio1-commits/antonio-bellanova-vault.git
   cd antonio-bellanova-vault
   ```

4. **Abhängigkeiten + Build + PM2**
   ```bash
   npm ci
   npm run build
   npm install -g pm2
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```
   Den ausgegebenen `pm2 startup`-Befehl einmal ausführen.

5. **Nginx für vault.antoniobellanova.com**
   - Konfiguration: `/etc/nginx/sites-available/vault` mit `server_name vault.antoniobellanova.com;` und `proxy_pass http://127.0.0.1:3000;`
   - Aktivieren: `ln -sf /etc/nginx/sites-available/vault /etc/nginx/sites-enabled/`
   - HTTPS: `certbot --nginx -d vault.antoniobellanova.com`
   - Nginx neu laden: `systemctl reload nginx`

6. **E-Mail (Kontaktformular „Nachricht senden“)**  
   Damit beim Klick auf „Nachricht senden“ wirklich eine E-Mail an das Atelier geht, auf dem Server **Umgebungsvariablen** setzen (z. B. in `~/.bashrc`, `pm2 ecosystem` oder Systemd):
   - `SMTP_HOST` – z. B. `smtp.gmail.com` oder SMTP-Server deines Anbieters
   - `SMTP_PORT` – z. B. `587` (TLS) oder `465` (SSL)
   - `SMTP_SECURE` – `true` bei Port 465, sonst oft `false`
   - `SMTP_USER` / `SMTP_PASS` – Login des E-Mail-Kontos (App-Passwort bei Gmail)
   - `MAIL_FROM` – Absenderadresse (optional, Standard: noreply@bellanova.com)
   - `ADMIN_EMAIL` oder `CONTACT_ADMIN_EMAIL` – E-Mail-Adresse, an die Kontaktanfragen geschickt werden (z. B. antonio.bellanova@antoniobellanova.com)
   
   Ohne diese Variablen wird die Anfrage nur in der Datenbank gespeichert (Admin sieht sie unter Kontaktanfragen), aber es geht keine E-Mail raus.

---

## Regelmäßig: Neue Version online bringen

### Auf deinem PC (Windows)

```powershell
cd "C:\Users\Admin\Downloads\antonio-bellanova-masterpiece-platform(3)"
git add .
git commit -m "Deine Änderungsbeschreibung"
git push
```

### Auf dem Server (SSH)

```bash
cd /opt/antonio-bellanova-vault
git pull
npm ci
# Falls Build mit "loadImageAsDataUrl has already been declared" oder "getPieceLocalized has already been declared" fehlschlägt:
node scripts/remove-duplicate-loadImageAsDataUrl.js
npm run build
pm2 restart vault
```

Danach prüfen: **https://vault.antoniobellanova.com**

---

## Wenn 502 oder App läuft nicht

```bash
# Logs ansehen
pm2 logs vault --lines 80

# App neu starten
pm2 restart vault

# Status prüfen
pm2 status
```

Fehler in den Logs (z. B. Syntax in `server.ts`) zuerst im Projekt beheben, dann erneut committen, pushen und auf dem Server `git pull` + `npm run build` + `pm2 restart vault` ausführen.
