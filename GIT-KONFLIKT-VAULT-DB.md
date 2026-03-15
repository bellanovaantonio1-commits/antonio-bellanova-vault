# Git-Konflikt „vault.db“ auf dem Server lösen

Wenn `git status` anzeigt:

```
Unmerged paths:
  deleted by us:   vault.db
```

soll `vault.db` im Repo **nicht** getrackt werden (steht in `.gitignore`). Du löst den Konflikt, indem du die Löschung akzeptierst und die echte DB auf dem Server ggf. aus einer Sicherung wiederherstellst.

---

## Auf dem Server (kurz)

```bash
cd /opt/antonio-bellanova-vault
```

**1. Konflikt lösen (vault.db aus Git entfernen):**

```bash
git rm vault.db
```

Damit ist der Konflikt gelöst; die Datei `vault.db` wird dabei **auf der Festplatte gelöscht**.

**2. Falls du die Datenbank weiter nutzen willst** (du hast z. B. `vault.db.aktuell`):

```bash
mv vault.db.aktuell vault.db
```

**3. Merge abschließen und Pull:**

```bash
git add -A
git commit -m "chore: resolve merge, vault.db out of repo"
git pull
```

**4. App neu bauen und starten:**

```bash
npm ci && npm run build && pm2 restart vault
pm2 logs vault --lines 20
```

---

**Hinweis:** `package.gson` und `start-server.sh` sind untracked – wenn du sie nicht brauchst, kannst du sie ignorieren oder löschen. `package.gson` wirkt wie ein Tippfehler von `package.json`; für die App reicht `package.json`.
