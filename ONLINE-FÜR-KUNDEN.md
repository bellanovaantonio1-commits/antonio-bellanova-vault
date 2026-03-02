# So können deine Kunden auf das Portal zugreifen

Damit Kunden das Portal im Browser öffnen können, muss es **im Internet erreichbar** sein – also auf einem Rechner laufen, der rund um die Uhr angebunden ist und eine **Adresse (URL)** hat, die du z.B. auf deiner Webseite oder per E-Mail teilen kannst.

---

## Was du brauchst

- Das Portal läuft auf einem **Server** (ein Rechner im Rechenzentrum oder bei einem Anbieter).
- Dieser Server bekommt eine **Internet-Adresse**, z.B.:
  - `https://vault.antonio-bellanova.de` (eigene Domain)
  - oder `https://dein-projekt.railway.app` (von einem Anbieter)

Sobald das läuft, können Kunden einfach diesen Link in den Browser eingeben oder du schickst ihn per E-Mail/Link – dann kommen sie direkt ins Portal (Login/Registrierung wie gewohnt).

---

## Drei Wege (von einfach bis flexibel)

### Weg 1: Anbieter mit wenigen Klicks (am einfachsten)

Du lädst dein Projekt zu einem **Hosting-Anbieter** hoch. Der kümmert sich um Server und Adresse. Du bekommst einen Link, den du an Kunden weitergeben kannst.

**Beispiel: Railway (kostenlos starten möglich)**

1. Gehe zu **https://railway.app** und melde dich an (z.B. mit GitHub).
2. **"New Project"** → **"Deploy from GitHub repo"**.
3. Repo auswählen (oder zuerst dieses Projekt auf GitHub hochladen).
4. Railway erkennt das Projekt. Wichtig:
   - **Build Command:** `npm run build`
   - **Start Command:** `npm start`
   - **Root Directory:** leer lassen (Projekt-Root).
5. Auf **"Deploy"** klicken.
6. Nach dem Build bekommst du einen Link, z.B. `https://dein-projekt.up.railway.app`. Diesen Link können **deine Kunden** im Browser öffnen.

Du kannst diese URL z.B. auf deiner Webseite verlinken oder per E-Mail schicken: „Unser Kundenportal: https://…“

**Hinweis:** Bei kostenlosen Tarifen kann die Datenbank bei Neustarts zurückgesetzt werden. Für dauerhafte Kundendaten später einen kostenpflichtigen Plan oder einen Anbieter mit persistentem Speicher wählen.

---

### Weg 2: Eigener Server (z.B. bei Hetzner, IONOS, Strato)

Du mietest einen **VPS** (virtuellen Server) und richtest dort alles selbst ein. Dafür brauchst du etwas technische Hilfe oder Zeit für Anleitungen.

**Kurzüberblick:**

1. **Server mieten** (z.B. Hetzner Cloud, IONOS VPS) – oft ab wenigen Euro im Monat.
2. **Zugang per SSH** – du verbindest dich vom PC aus mit dem Server.
3. **Node.js installieren** (Anleitung für Ubuntu gibt es im Internet).
4. **Projekt auf den Server kopieren** (z.B. mit Git: `git clone …`).
5. Auf dem Server ausführen:
   ```bash
   npm ci
   npm run build
   PORT=3000 npm start
   ```
6. Damit es dauerhaft läuft: **PM2** installieren und die App mit PM2 starten (siehe DEPLOY.md).
7. **Domain** (z.B. `vault.antonio-bellanova.de`) auf die Server-IP zeigen lassen (DNS).
8. **HTTPS einrichten** (z.B. mit Nginx + Let’s Encrypt), damit die URL mit `https://` funktioniert.

Dann ist das Portal unter deiner Domain erreichbar – diese URL gibst du an Kunden weiter.

---

### Weg 3: Nur zum Testen auf deinem PC

Wenn du **nur testen** willst, ob alles funktioniert:

1. Im Projektordner: `npm run build` und `npm start`.
2. Im Browser: **http://localhost:3000**.

**Einschränkung:** „localhost“ funktioniert nur auf **deinem** Rechner. Deine Kunden können damit **nicht** von zu Hause aus zugreifen. Dafür brauchst du Weg 1 oder 2.

---

## Was du deinen Kunden sagst

Sobald das Portal online ist, reicht z.B.:

- **„Unser Kundenportal findest du unter: [deine URL]“**
- **„Dort kannst du dich anmelden / registrieren und deine Stücke, Zertifikate und Verträge einsehen.“**

Login/Registrierung und alle Funktionen sind dann so, wie du sie kennst – nur die Adresse ist die öffentliche URL statt localhost.

---

## Kurz zusammengefasst

| Ziel | Was du machst |
|------|----------------|
| **Kunden sollen das Portal nutzen** | Portal bei einem Anbieter (z.B. Railway) oder auf eigenem Server hosten → du bekommst eine URL → diese URL gibst du an Kunden weiter. |
| **Nur selbst testen** | `npm run build` und `npm start` → im Browser `http://localhost:3000` öffnen. (Kunden können nicht zugreifen.) |

Wenn du sagst, ob du lieber „mit wenigen Klicks“ (Weg 1) oder „eigener Server“ (Weg 2) machen willst, kann man die Schritte dafür noch genauer durchgehen.
