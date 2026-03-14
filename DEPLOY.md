# Vault online stellen (Deployment)

Damit Änderungen (z. B. der Button „Als Gast fortfahren“) auf **vault.antoniobellanova.com** sichtbar sind, muss ein neuer Build erstellt und der Server neu gestartet werden.

## Option 1: Ohne Docker (direkt auf dem Server)

1. **Code auf den Server bringen** (falls mit Git):
   ```bash
   git pull origin main
   ```

2. **Frontend neu bauen** (erzeugt den Ordner `dist/` mit dem aktuellen Stand):
   ```bash
   npm run build
   ```

3. **Server neu starten**, damit der neue Build ausgeliefert wird:
   ```bash
   npm run start
   ```
   Wenn du einen Process-Manager (z. B. systemd, pm2) nutzt, dort den Dienst neu starten (z. B. `pm2 restart all` oder `systemctl restart vault`).

---

## Option 2: Mit Docker

1. **Image neu bauen** (darin ist bereits `npm run build`):
   ```bash
   docker build -t antoniobellanova-vault .
   ```

2. **Container mit dem neuen Image starten** (bzw. bestehenden Container ersetzen):
   ```bash
   docker stop <container-name>
   docker rm <container-name>
   docker run -d --name vault -p 3000:3000 -v /pfad/zu/daten:/app/data antoniobellanova-vault
   ```
   Volumes und Ports ggf. an eure Umgebung anpassen.

---

## Wichtig

- **NODE_ENV=production** setzen, damit der Server die Dateien aus `dist/` ausliefert (nicht den Vite-Dev-Server).
- Nach dem Deployment ggf. **Browser-Cache** umgehen: Strg+Shift+R (Hard Reload) oder im Inkognito-Fenster testen.

Nach einem erfolgreichen Deploy erscheint unter der Login-Card der Button **„Als Gast fortfahren“**.
