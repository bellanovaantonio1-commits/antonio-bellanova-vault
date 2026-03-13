# Server-Setup (vault.antoniobellanova.com)

## Einmalig nach Deploy

### 1. Git-Identität (für spätere Commits)
```bash
git config --global user.email "deine@email.de"
git config --global user.name "Dein Name"
```

### 2. PM2: nur eine Vault-Instanz
Falls zwei `vault`-Prozesse laufen:
```bash
pm2 list
pm2 delete 1   # oder die zweite ID
pm2 save
```

### 3. Backup der Datenbank aktivieren
```bash
chmod +x /opt/antonio-bellanova-vault/scripts/backup-vault-db.sh
crontab -e
# Zeile einfügen (täglich 3 Uhr):
# 0 3 * * * /opt/antonio-bellanova-vault/scripts/backup-vault-db.sh
```

## Regelmäßiger Update-Ablauf
```bash
cd /opt/antonio-bellanova-vault
git pull
npm install
npm run build
pm2 restart vault
```

Die Datei `vault.db` wird nicht mehr per Git überschrieben (steht in `.gitignore`).
