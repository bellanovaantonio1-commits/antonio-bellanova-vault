#!/bin/bash
# Backup vault.db – auf dem Server ausführen (z. B. per Cron täglich)
# Cron: 0 3 * * * /opt/antonio-bellanova-vault/scripts/backup-vault-db.sh

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BACKUP_DIR="${DIR}/backups"
DB="${DIR}/vault.db"

mkdir -p "$BACKUP_DIR"
if [ -f "$DB" ]; then
  cp "$DB" "${BACKUP_DIR}/vault.db.$(date +%Y-%m-%d-%H%M)"
  # Nur letzte 14 Backups behalten
  ls -t "$BACKUP_DIR"/vault.db.* 2>/dev/null | tail -n +15 | xargs -r rm --
fi
