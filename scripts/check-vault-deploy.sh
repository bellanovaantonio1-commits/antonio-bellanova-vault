#!/usr/bin/env bash
# Auf dem Ubuntu-Server im Projektordner ausführen: bash scripts/check-vault-deploy.sh
# Prüft .env (nur ob Variablen gesetzt sind), dist/, PM2, Port 3000, lokales /api/_health.
# Zeigt KEINE Passwörter/Keys an.

set +e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1

echo "=============================="
echo " Vault Deploy-Check"
echo " Ordner: $ROOT"
echo "=============================="

if [[ ! -f .env ]]; then
  echo "[FEHLER] .env fehlt. Anlegen aus .env.example und MYSQL_* / PORT setzen."
else
  echo "[OK] .env existiert"
  uses_mysql=0
  grep -q '^MYSQL_HOST=' .env 2>/dev/null && uses_mysql=1
  for key in PORT NODE_ENV MYSQL_HOST MYSQL_PORT MYSQL_USER MYSQL_PASSWORD MYSQL_DATABASE; do
    if ! grep -q "^${key}=" .env 2>/dev/null; then
      if [[ $uses_mysql -eq 1 ]] || [[ "$key" == MYSQL_* ]]; then
        echo "  - $key: Zeile fehlt"
      else
        echo "  - $key: (optional)"
      fi
      continue
    fi
    line=$(grep "^${key}=" .env | head -1)
    val="${line#*=}"
    val="${val%\"}"; val="${val#\"}"
    val="${val%\'}"; val="${val#\'}"
    if [[ -z "${val//[$'\t\r\n ']/}" ]]; then
      echo "  - $key: LEER"
    else
      echo "  - $key: gesetzt (${#val} Zeichen)"
    fi
  done
fi

echo "--- dist/ (für Production UI) ---"
if [[ -d dist && -f dist/index.html ]]; then
  echo "[OK] dist/ vorhanden"
else
  echo "[WARNUNG] dist/ fehlt oder unvollständig → npm run build"
fi

echo "--- PM2 ---"
if command -v pm2 >/dev/null 2>&1; then
  pm2 describe vault 2>/dev/null | head -n 20 || echo "[INFO] Prozess 'vault' nicht gefunden → pm2 start ecosystem.config.cjs"
  echo "Status-Zeile:"
  pm2 status 2>/dev/null | grep vault || true
else
  echo "[INFO] pm2 nicht installiert"
fi

echo "--- Port 3000 ---"
if command -v ss >/dev/null 2>&1; then
  ss -tlnp 2>/dev/null | grep 3000 || echo "[FEHLER] Nichts lauscht auf 3000 → App läuft nicht oder anderer PORT"
else
  netstat -tlnp 2>/dev/null | grep 3000 || echo "[FEHLER] Nichts auf 3000 (netstat)"
fi

echo "--- curl http://127.0.0.1:3000/api/health (2s Timeout) ---"
code=$(curl -sS -o /tmp/vault-health.txt -w "%{http_code}" -m 2 http://127.0.0.1:3000/api/health 2>/dev/null)
if [[ "$code" == "200" ]]; then
  echo "[OK] HTTP $code"
  head -c 200 /tmp/vault-health.txt 2>/dev/null; echo
else
  echo "[FEHLER] HTTP $code oder Verbindung abgelehnt"
  echo "Letzte PM2-Fehler (falls vorhanden):"
  pm2 logs vault --lines 25 --nostream 2>/dev/null | tail -n 25
fi

echo "--- Nginx proxy_pass (root) ---"
if [[ -d /etc/nginx ]]; then
  sudo grep -r "proxy_pass" /etc/nginx/ 2>/dev/null | grep -v "#" | head -n 15 || echo "[INFO] Kein Treffer oder kein sudo"
else
  echo "[INFO] /etc/nginx nicht vorhanden"
fi

echo "=============================="
echo " Ende. Wenn curl fehlschlägt: zuerst PM2-Logs & MySQL beheben."
echo " Wenn curl OK aber Seite 502: Nginx proxy_pass auf 127.0.0.1:3000 prüfen."
echo "=============================="
