# Anleitung: Vault online stellen

So bringst du Änderungen (z. B. den Button **„Als Gast fortfahren“**) auf **https://vault.antoniobellanova.com** live.

---

## Kurzversion (wenn Server schon läuft)

**1. Auf deinem PC (im Projektordner):**

```powershell
cd "C:\Users\Admin\Downloads\antonio-bellanova-masterpiece-platform(3)"
git add .
git commit -m "z.B. Gast-Button und Anleitung"
git push
```

**2. Auf dem Server (per SSH):**

```bash
ssh root@vault.antoniobellanova.com
cd /opt/antonio-bellanova-vault
git pull
npm ci
npm run build
pm2 restart vault
```

**3. Im Browser prüfen:** https://vault.antoniobellanova.com (ggf. Strg+Shift+R für Hard Reload)

---

### Wenn auf dem Server `git pull` mit „vault.db would be overwritten“ abbricht

Die Datenbank `vault.db` liegt nur auf dem Server und soll erhalten bleiben. **Einmalig auf dem Server** ausführen:

```bash
git stash push vault.db
git pull
git stash pop
npm ci
npm run build
pm2 restart vault
```

Danach funktioniert `git pull` wieder normal (vault.db wird nicht mehr vom Repository überschrieben).

---

## Schritt für Schritt

### Auf deinem Windows-PC

1. **Projektordner öffnen** (z. B. in Cursor oder im Explorer):
   ```
   C:\Users\Admin\Downloads\antonio-bellanova-masterpiece-platform(3)
   ```

2. **Änderungen committen und pushen** (in PowerShell oder Cursor-Terminal):
   ```powershell
   git add .
   git status
   git commit -m "Beschreibung deiner Änderung"
   git push
   ```
   Falls noch kein Remote eingerichtet ist: z. B. `git remote add origin https://github.com/DEIN-USER/antonio-bellanova-vault.git` und danach `git push -u origin main`.

### Auf dem Server (vault.antoniobellanova.com)

1. **Per SSH einloggen:**
   ```bash
   ssh root@vault.antoniobellanova.com
   ```
   (Passwort oder SSH-Key wie gewohnt)

2. **Ins Projektverzeichnis wechseln:**
   ```bash
   cd /opt/antonio-bellanova-vault
   ```
   Falls das Projekt woanders liegt (z. B. `/opt/antonio-bellanova-masterpiece-platform`), dort hinein wechseln.

3. **Neuesten Code holen:**
   ```bash
   git pull
   ```

4. **Abhängigkeiten und Build:**
   ```bash
   npm ci
   npm run build
   ```
   Wenn der Build mit einer Fehlermeldung zu doppelten Deklarationen abbricht, zuerst ausführen:
   ```bash
   node scripts/remove-duplicate-loadImageAsDataUrl.js
   npm run build
   ```

5. **App neu starten:**
   ```bash
   pm2 restart vault
   ```
   (Falls die App unter einem anderen Namen läuft: `pm2 list` ausführen und den richtigen Namen verwenden, z. B. `pm2 restart all`.)

6. **Fertig.** Im Browser https://vault.antoniobellanova.com aufrufen und testen.

---

## Wenn etwas nicht funktioniert

| Problem | Was tun |
|--------|--------|
| **502 / Seite lädt nicht** | Auf dem Server: `pm2 logs vault --lines 50` → Fehler ansehen; danach `pm2 restart vault`. |
| **Alte Version wird angezeigt** | Hard Reload im Browser (Strg+Shift+R) oder Inkognito-Fenster. Auf dem Server prüfen: `ls -la /opt/antonio-bellanova-vault/dist` und ob `npm run build` wirklich durchgelaufen ist. |
| **Build schlägt fehl** | Fehlermeldung lesen. Oft: doppelte Funktionen → `node scripts/remove-duplicate-loadImageAsDataUrl.js` ausführen, dann erneut `npm run build`. |
| **Git pull schlägt fehl** | Lokal: `git status` und ggf. Änderungen committen/pushen. Auf dem Server: `git status` prüfen, bei Konflikten mit jemandem absprechen oder Konflikt lösen. |
| **„vault.db would be overwritten by merge“** | Die Datenbank liegt nur auf dem Server und soll nicht überschrieben werden. **Auf dem Server** nacheinander ausführen: `git stash push vault.db` → `git pull` → `git stash pop`. Danach wieder `npm ci`, `npm run build`, `pm2 restart vault`. |

---

## Weitere Anleitungen im Projekt

- **ONLINE-BRINGEN.md** – Ersteinrichtung des Servers (Node, Git, Nginx, PM2, HTTPS)
- **IONOS-DEPLOY.md** – Vault auf einem IONOS-VPS einrichten
- **ONLINE-FÜR-KUNDEN.md** – Übersicht: Kunden-Zugang, Wege zum Hosten
- **DEPLOY.md** – Kurzfassung Build + Start (mit und ohne Docker)

Diese Anleitung beschreibt **nur** das regelmäßige „Online stellen“ nach dem ersten Setup.
