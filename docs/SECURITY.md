# Sicherheitshinweise

**Kein System ist „unhackbar“.** Ziel ist: Angriffsfläche verkleinern, übliche Angriffe erschweren, Schäden begrenzen.

## Was diese App serverseitig macht

- **Signierte Session-Cookies** (`SESSION_SECRET`): Wenn gesetzt (≥32 Zeichen), sind Cookies signiert. Fehlt das Secret, startet der Server trotzdem (Warnung im Log) — Cookies sind dann unsigniert wie früher.
- **HTTP-Security-Header** (Helmet): u. a. `X-Content-Type-Options`, `X-Frame-Options`, HSTS in passenden Setups — **CSP ist absichtlich deaktiviert**, damit SPA/Stripe nicht brechen (optional später pro Route schärfen).
- **Rate-Limits** (in-memory, pro IP): Login, Registrierung, Passwort vergessen, Reset, Kontaktformular.
- **Kleinere JSON-Body-Limits** (Standard `5mb`) gegen trivialen DoS; große Dateien über **Multer** mit eigenem Limit.
- **Kein `X-Powered-By`**, `trust proxy` für korrekte HTTPS-Erkennung hinter Reverse-Proxy.

## Produktion — Checkliste

1. `SESSION_SECRET` setzen (≥ 32 Zeichen, zufällig).
2. `APP_URL` / `BASE_URL` mit **`https:`** — sonst fehlt das `Secure`-Flag am Cookie.
3. Reverse-Proxy (Nginx/Caddy) mit TLS; `X-Forwarded-Proto: https` setzen.
4. Regelmäßig `npm audit`, Dependencies aktuell halten.
5. Backups der Datenbank, Zugriff auf Admin-Accounts einschränken, **2FA für Admins** nutzen.

## Bekannte Grenzen

- **Rate-Limiting im RAM**: Bei mehreren Instanzen ohne gemeinsamen Store (Redis) pro IP ungenau — für hohe Last Redis einplanen.
- **Statische Upload-Pfade** (`/uploads`, `/vault-storage`): Wer URLs errät, kann Dateien abrufen, falls keine zusätzliche Auth — bei Bedarf hinter signierten URLs oder Auth legen.
- **CSRF**: `SameSite=Lax` hilft; für maximale Absicherung state-changing Requests zusätzlich mit CSRF-Token absichern.

Bei Incident: Sessions widerrufen = Nutzer neu einloggen lassen, `SESSION_SECRET` rotieren, alle Cookies ungültig.
