# Projekt zu GitHub pushen

## Situation
- Du hast das Projekt lokal.
- Auf GitHub existiert schon ein Repo (z.B. mit README) → daher "rejected".

---

## Option 1: Remote-Inhalt behalten und dein Code dazu (empfohlen, wenn auf GitHub schon was Wichtiges ist)

Im Projektordner in PowerShell/CMD:

```bash
# Remote prüfen (sollte dein Repo sein)
git remote -v

# Falls "origin" auf ein falsches Repo zeigt, entfernen und neu setzen:
# git remote remove origin
# git remote add origin https://github.com/bellanovaantonio1-commits/antonio-bellanova-vault.git

# Remote-Änderungen holen und mit deinem Stand zusammenführen
git pull origin main --allow-unrelated-histories

# Wenn es Merge-Konflikte gibt, in den genannten Dateien nachsehen, speichern, dann:
# git add .
# git commit -m "Merge remote"

# Jetzt pushen
git push -u origin main
```

---

## Option 2: GitHub mit deinem lokalen Stand überschreiben (wenn auf GitHub nur eine leere README o.ä. ist)

**Achtung:** Alles, was nur auf GitHub liegt, geht dabei verloren.

```bash
git push -u origin main --force
```

---

## Wichtig: Alles committen vor dem Push

Damit dein ganzer Code hochgeht:

```bash
git add .
git status
git commit -m "Projektstand: Vault inkl. alle Änderungen"
git push -u origin main
```

(Falls du Option 1 machst, vorher wie oben `git pull ... --allow-unrelated-histories`.)
