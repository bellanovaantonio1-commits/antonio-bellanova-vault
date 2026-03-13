# Deployment & 502 Bad Gateway beheben (Nginx)

Ein **502 Bad Gateway** von nginx bedeutet: Der Reverse-Proxy hat keine gültige Antwort vom Upstream (der Node.js-Anwendung) erhalten. Mit dieser Checkliste können Sie das Problem beheben.

---

## 1. Node-Server muss laufen

Die Anwendung muss laufen und auf Anfragen warten, bevor nginx dorthin weiterleiten kann.

```bash
# Im Projektverzeichnis
npm run build          # bei Produktion
npm run start          # Produktion (NODE_ENV=production)
# oder
npm run dev            # Entwicklung
```

- Standard-Port: **3000** (oder Umgebungsvariable `PORT` setzen).
- Der Server bindet an `0.0.0.0`, nimmt also Verbindungen von nginx auf demselben Rechner an.

Prüfen, ob der Prozess läuft und lauscht:

```bash
# Linux/Ubuntu
sudo lsof -i :3000
# oder
ss -tlnp | grep 3000
```

Wenn auf dem Port der App nichts lauscht, liefert nginx 502. Starten Sie die App (z. B. mit systemd oder PM2) und stellen Sie sicher, dass sie dauerhaft läuft.

---

## 2. Nginx muss auf den richtigen Host und Port weiterleiten

Nginx muss Anfragen an denselben Rechner und **genau den Port** weiterleiten, den die App nutzt (Standard 3000 bzw. Ihr `PORT`).

Beispiel-**location**-Block:

```nginx
location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
    proxy_read_timeout 60s;
    proxy_connect_timeout 60s;
    proxy_send_timeout 60s;
}
```

- **3000** durch Ihren App-Port ersetzen, falls Sie `PORT` anders gesetzt haben (z. B. 5000).
- Läuft die App in anderem Kontext: Sie muss weiterhin auf `0.0.0.0` oder der IP lauschen, die nginx verwendet (z. B. `127.0.0.1`).

Nach Änderung der Konfiguration nginx neu laden:

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 3. Abstürze beim Start prüfen

Beendet sich der Node-Prozess kurz nach dem Start, bekommt nginx „connection refused“ oder Verbindungsabbruch und liefert 502.

- App im Vordergrund starten und auf Fehlermeldungen achten:

```bash
PORT=3000 npm run start
```

- Typische Ursachen:
  - **Datenbank**: `DATABASE_PATH` (Standard `vault.db`) muss vom Benutzer, der die App startet, beschreibbar sein.
  - **Fehlende Abhängigkeiten**: im Projektverzeichnis `npm ci` oder `npm install` ausführen.
  - **Build/Umgebung**: In Produktion vor `npm run start` unbedingt `npm run build` ausführen und prüfen, dass `dist/` existiert.

In den Logs Ihres Prozess-Managers (systemd, PM2) finden Sie die genaue Fehlermeldung des Node-Prozesses.

---

## 4. Dauerhafter Betrieb in Produktion (empfohlen)

Damit die App läuft und bei Fehlern neu startet:

**Option A – systemd**

Datei anlegen, z. B. `/etc/systemd/system/bellanova-vault.service`:

```ini
[Unit]
Description=Antonio Bellanova Vault
After=network.target

[Service]
Type=simple
User=www-data
WorkingDirectory=/pfad/zum/antonio-bellanova-masterpiece-platform
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/usr/bin/npm run start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

Anschließend:

```bash
sudo systemctl daemon-reload
sudo systemctl enable bellanova-vault
sudo systemctl start bellanova-vault
sudo systemctl status bellanova-vault
```

**Option B – PM2**

```bash
npm install -g pm2
cd /pfad/zum/antonio-bellanova-masterpiece-platform
npm run build
PORT=3000 pm2 start "npm run start" --name bellanova-vault
pm2 save && pm2 startup
```

---

## 5. Kurz-Checkliste

| Prüfung | Maßnahme |
|--------|----------|
| App-Port | `PORT` bestätigen (Standard 3000) und prüfen, dass der Prozess auf diesem Port lauscht. |
| Nginx-Upstream | `proxy_pass` muss auf denselben Host und Port zeigen (z. B. `http://127.0.0.1:3000`). |
| Prozess läuft | `lsof -i :3000` oder `ss -tlnp \| grep 3000` sowie Logs des Prozess-Managers prüfen. |
| Startfehler | `npm run start` im Vordergrund ausführen und DB-/Berechtigungs-/Abhängigkeitsfehler beheben. |
| Nginx neu laden | Nach Konfigurationsänderung: `sudo nginx -t && sudo systemctl reload nginx`. |

Sobald der Node-Server läuft und nginx auf den richtigen Port weiterleitet, verschwindet der 502-Fehler.

---

## 6. Health-Check nutzen („immer noch 502?“)

Die App bietet zwei Endpunkte ohne Anmeldung:

- **https://vault.antoniobellanova.com/api/health**
- **https://vault.antoniobellanova.com/health**

**Test:**

1. Auf dem **Server** (per SSH) prüfen, ob die Node-App überhaupt antwortet:
   ```bash
   curl -s http://127.0.0.1:3000/health
   ```
   Erwartung: `{"ok":true,"service":"Antonio Bellanova Vault","ts":"..."}`

2. **Antwort kommt:** Node läuft. Dann liegt der 502 sehr wahrscheinlich an der Nginx-Konfiguration (falscher Port, falscher `proxy_pass`, Timeout). Nginx-Config und `proxy_pass` prüfen.

3. **Keine Antwort / Verbindung verweigert:** Node-App läuft nicht oder nicht auf Port 3000. App starten (z. B. `npm run start` oder systemd/PM2), Logs prüfen und ggf. `PORT` in der Nginx-Config anpassen.
