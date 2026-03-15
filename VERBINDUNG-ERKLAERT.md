# Wie Sie alles verbinden – Übersicht

Diese Anleitung erklärt **in einem Ablauf**, wie Ihre **Vault-App**, Ihr **Rechner/Server** und **Google Cloud SQL** zusammenspielen und was Sie wo eintragen müssen.

---

## Das Gesamtbild

```
┌─────────────────────┐         Internet          ┌──────────────────────────┐
│  Ihr PC oder Server  │  ◄─────────────────────►  │  Google Cloud SQL         │
│  (Vault-App läuft    │      Verbindung über     │  (bellanova-main-db)       │
│   hier mit Node.js)  │      Host + Port +      │  Datenbank: bellanova_vault│
│                      │      Benutzer + Passwort │  (MySQL)                   │
└─────────────────────┘                          └──────────────────────────┘
```

- Die **Vault-App** (server.ts) läuft auf Ihrem PC oder auf einem Server (z. B. vault.antoniobellanova.com).
- **Google Cloud SQL** ist die Datenbank in der Cloud (Ihre Instanz: **bellanova-main-db**, Datenbank: **bellanova_vault**).
- Damit die App die Cloud-Datenbank nutzen kann, braucht sie die **Verbindungsdaten** (Host, Port, Benutzer, Passwort, Datenbankname). Diese tragen Sie in eine **.env-Datei** ein.

---

## Schritt 1: Verbindungsdaten aus Google Cloud holen

1. Öffnen Sie die [Google Cloud Console](https://console.cloud.google.com/) und wählen Sie Ihr Projekt (z. B. „My First Project“).
2. Gehen Sie zu **SQL** (Cloud SQL).
3. Klicken Sie auf Ihre Instanz **bellanova-main-db**.
4. Auf der **Übersichtsseite** der Instanz finden Sie:
   - **Öffentliche IP-Adresse** (z. B. `34.65.123.45`) → das ist Ihr **Host**.
   - **Verbindungsname** (z. B. `mein-projekt:europe-west1:bellanova-main-db`) → wird z. B. für den Auth Proxy gebraucht.
5. **Port:** Bei MySQL ist der Standard **3306**.
6. **Datenbankname:** Sie nutzen bereits **bellanova_vault**.
7. **Benutzer & Passwort:**
   - Unter **Benutzer** sehen Sie die Benutzerkonten (z. B. `root` oder einen eigenen Benutzer).
   - Das Passwort haben Sie beim Anlegen gesetzt. Falls nötig: neues Passwort setzen und notieren.

Fassen Sie die Werte so zusammen:

| Was          | Beispielwert        | Wo Sie es eintragen |
|-------------|---------------------|----------------------|
| Host        | 34.185.191.69       | siehe Schritt 2      |
| Port        | 3306                | siehe Schritt 2      |
| Datenbank   | bellanova_vault     | siehe Schritt 2      |
| Benutzer    | bellanova_admin     | siehe Schritt 2      |
| Passwort    | BellanovaSecureVault!2026    | siehe Schritt 2      |

---

## Schritt 2: Verbindung in der Vault-App eintragen (.env)

1. Öffnen Sie Ihr **Vault-Projekt** auf dem PC (der Ordner mit `server.ts`, `package.json`, usw.).
2. Dort gibt es eine Datei **`.env`** (oder Sie legen sie an, z. B. durch Kopie von `.env.example`).
3. Tragen Sie die **MySQL-Verbindung** ein. Zwei Möglichkeiten:

**Variante A – Einzelne Variablen (übersichtlich):**

```env
# Google Cloud SQL (MySQL) – bellanova-main-db
MYSQL_HOST=34.65.123.45
MYSQL_PORT=3306
MYSQL_USER=root
MYSQL_PASSWORD=IhrPasswortHier
MYSQL_DATABASE=bellanova_vault
```

**Variante B – Eine URL:**

```env
DATABASE_URL=mysql://root:IhrPasswortHier@34.65.123.45:3306/bellanova_vault
```

Ersetzen Sie **34.65.123.45** durch die echte **öffentliche IP** Ihrer Instanz, **root** durch Ihren Benutzer und **IhrPasswortHier** durch das echte Passwort.

Wichtig: Die Datei **`.env`** darf **nicht** ins Git (z. B. in `.gitignore`). Sie bleibt nur auf Ihrem Rechner bzw. auf dem Server.

---

## Schritt 3: Verbindung von Google Cloud erlauben (Netzwerk)

Damit Ihr PC oder Server über das Internet auf Cloud SQL zugreifen darf:

1. In der Cloud Console bei Ihrer Instanz **bellanova-main-db** zu **Verbindung** bzw. **Netzwerk** gehen.
2. **Autorisierte Netzwerke** öffnen.
3. Eintrag hinzufügen:
   - **Zum Testen von zu Hause:** Ihre aktuelle öffentliche IP eintragen (z. B. [„Wie lautet meine IP?“](https://www.google.com/search?q=meine+ip) suchen) oder vorübergehend `0.0.0.0/0` (öffnet für alle IPs – nur zum Testen).
   - **Für den Produktions-Server:** Die feste IP Ihres Servers (z. B. vault.antoniobellanova.com) eintragen.

Ohne diesen Eintrag lehnt Cloud SQL die Verbindung ab.

---

## Schritt 4: Verbindung testen

Im Projektordner im Terminal:

```bash
npm install
node scripts/test-cloud-sql-mysql.js
```

Wenn die Verbindung stimmt, erscheint eine Meldung wie „Verbindung OK“ mit Datenbankname und Serverzeit.  
Wenn ein Fehler kommt: Host, Port, Benutzer, Passwort und **Autorisierte Netzwerke** prüfen.

---

## Schritt 5: Wo die App die Datenbank nutzt

- **Aktuell:** Die Vault-App verwendet standardmäßig **SQLite** (Datei `vault.db` im Projektordner). Dafür brauchen Sie **keine** Cloud-SQL-Einträge in `.env`.
- **Mit Cloud SQL (MySQL):** Wenn Sie die App so umstellen wollen, dass sie **nur noch** die Cloud-Datenbank **bellanova_vault** nutzt, sind Code-Anpassungen nötig (z. B. MySQL-Treiber statt SQLite, Schema anpassen). Die `.env`-Werte aus Schritt 2 sind dann die Grundlage dafür.

Kurz:  
- **Nur Verbindung testen:** Schritte 1–4 reichen.  
- **App komplett auf Cloud SQL umstellen:** Zusätzlich die App so anpassen, dass sie bei gesetzten `MYSQL_*` bzw. `DATABASE_URL` (MySQL) die Cloud-Datenbank verwendet.

---

## Kurz-Checkliste

| Schritt | Erledigt? |
|--------|-----------|
| 1. In Cloud Console: Host, Port, DB-Name, Benutzer, Passwort notiert | ☐ |
| 2. Im Projektordner: `.env` mit `MYSQL_*` oder `DATABASE_URL` ausgefüllt | ☐ |
| 3. In Cloud SQL: Autorisiertes Netzwerk (Ihre IP oder Server-IP) eingetragen | ☐ |
| 4. `node scripts/test-cloud-sql-mysql.js` ausgeführt – „OK“? | ☐ |

---

## Häufige Fehler

- **„Connection refused“ / Timeout:** Meist die **IP** nicht in den autorisierten Netzwerken oder falscher **Host/Port** in `.env`.
- **„Access denied“:** **Benutzername** oder **Passwort** in `.env` falsch; in Cloud SQL unter **Benutzer** prüfen bzw. Passwort zurücksetzen.
- **„Unknown database“:** **Datenbankname** in `.env` muss exakt **bellanova_vault** heißen (wie in der Cloud Console).

Wenn Sie diese Schritte durchgehen, ist „alles verbunden“ im Sinne von: Ihre Umgebung kennt die Cloud-Datenbank und kann sie (per Test-Skript oder später per App) nutzen.
