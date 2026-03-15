# Google Cloud SQL (PostgreSQL) mit der Vault-App verbinden

**→ Eine übersichtliche Erklärung „Wie alles verbinden“ (Cloud SQL, .env, Test) steht in [VERBINDUNG-ERKLAERT.md](VERBINDUNG-ERKLAERT.md).**

Diese Anleitung beschreibt im Detail, wie Sie eine **Google Cloud SQL for PostgreSQL**-Instanz anlegen und für die Vault-App nutzen (oder vorbereiten). Für **MySQL** (z. B. bellanova-main-db / bellanova_vault) verwenden Sie die Schritte 1–3 und 6 analog; Verbindung testen mit `node scripts/test-cloud-sql-mysql.js` und den Variablen aus [VERBINDUNG-ERKLAERT.md](VERBINDUNG-ERKLAERT.md).

---

## 1. Google Cloud Projekt & Abrechnung

- Gehen Sie zu [Google Cloud Console](https://console.cloud.google.com/).
- Erstellen Sie ein Projekt oder wählen Sie ein bestehendes.
- Aktivieren Sie die **Abrechnung** für das Projekt (Cloud SQL ist kostenpflichtig).

---

## 2. Cloud SQL API aktivieren

1. **APIs & Dienste** → **Bibliothek**.
2. Suchen Sie nach **Cloud SQL Admin API**.
3. Klicken Sie auf **Aktivieren**.

---

## 3. PostgreSQL-Instanz erstellen

1. **SQL** (oder **Cloud SQL**) in der Konsole öffnen.
2. **Instanz erstellen**.
3. Wählen Sie **PostgreSQL**.
4. Konfiguration (Beispiel):
   - **Instanz-ID:** z. B. `vault-db`
   - **Passwort** für den Benutzer `postgres` setzen (speichern!).
   - **Region:** z. B. `europe-west1` (Belgien) oder eine Region in Ihrer Nähe.
   - **Maschine:** z. B. „Leicht geteilt“ (klein) oder „Dediziert“ je nach Bedarf.
   - **Speicher:** z. B. 10 GB SSD.
5. Unter **Konfigurationsoptionen**:
   - **Öffentliche IP:** Aktivieren, wenn Sie von außerhalb (z. B. Ihrem Server) verbinden.
   - **Private IP** (optional): Wenn die App in Google Cloud (z. B. Cloud Run, GKE) läuft.
6. **Erstellen** – die Instanz wird angelegt (kann einige Minuten dauern).

---

## 4. Datenbank & Benutzer anlegen

1. In der Cloud SQL-Übersicht die Instanz anklicken.
2. **Datenbanken** → **Datenbank erstellen**, Name z. B. `vault`.
3. **Benutzer** → **Benutzerkonto hinzufügen**:
   - Benutzername z. B. `vault_app`
   - Passwort setzen und speichern.

---

## 5. Verbindungsdaten ermitteln

- **Verbindungsname:** Auf der Instanzseite unter **Übersicht** (z. B. `projekt-id:europe-west1:vault-db`).
- **Host:** Bei **Öffentliche IP** die angezeigte IP-Adresse.
- **Port:** Standard **5432** (PostgreSQL).

---

## 6. Verbindung von außen erlauben (bei öffentlicher IP)

- Unter **Verbindung** → **Netzwerk** können Sie **Autorisierte Netzwerke** hinzufügen (z. B. die IP Ihres App-Servers oder `0.0.0.0/0` nur zum Testen; für Produktion besser eine feste Server-IP).

---

## 7. Umgebungsvariablen für die App

Auf dem Server (oder in `.env`) setzen Sie eine der folgenden Varianten.

**Variante A – Verbindungs-URL (empfohlen):**

```bash
DATABASE_URL=postgresql://vault_app:IHR_PASSWORT@DIE_IP:5432/vault
```

Ersetzen Sie `IHR_PASSWORT` und `DIE_IP` (und ggf. Datenbankname `vault`).

**Variante B – Einzelne Werte:**

```bash
PGHOST=DIE_IP
PGPORT=5432
PGUSER=vault_app
PGPASSWORD=IHR_PASSWORT
PGDATABASE=vault
USE_CLOUD_SQL=postgres
```

---

## 8. Cloud SQL Auth Proxy (optional, sicherer)

Statt direkter öffentlicher IP können Sie den **Cloud SQL Auth Proxy** nutzen:

1. [Cloud SQL Auth Proxy herunterladen](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy#install).
2. Proxy starten (ersetzen Sie `PROJEKT:REGION:INSTANZ` durch Ihren Verbindungsnamen):

   ```bash
   ./cloud-sql-proxy PROJEKT:REGION:INSTANZ
   ```

3. Der Proxy hört lokal z. B. auf `127.0.0.1:5432`. Dann:

   ```bash
   DATABASE_URL=postgresql://vault_app:IHR_PASSWORT@127.0.0.1:5432/vault
   ```

So muss die Datenbank keine öffentliche IP haben.

---

## 9. Aktueller Stand der Vault-App

Die Vault-App nutzt derzeit **SQLite** (`vault.db`) mit synchronen Datenbankzugriffen.  
Eine **vollständige Umstellung** auf Cloud SQL (PostgreSQL) erfordert:

- Einbau eines **PostgreSQL-Adapters** (z. B. `pg`) mit asynchronen Aufrufen.
- Anpassung des **Schemas** (z. B. `AUTOINCREMENT` → `SERIAL`, `DATETIME` → `TIMESTAMP`).
- Refactoring der Server-Routen auf **async/await** für alle DB-Zugriffe.

Mit den obigen Umgebungsvariablen können Sie:

- Eine **Testverbindung** mit dem beiliegenden Skript prüfen (siehe unten).
- Später die App schrittweise auf PostgreSQL umstellen.

---

## 10. Verbindung testen (Node-Skript)

Im Projekt liegt ein Skript, das die PostgreSQL-Verbindung prüft:

```bash
# Mit DATABASE_URL (in .env oder export):
DATABASE_URL=postgresql://vault_app:IHR_PASSWORT@DIE_IP:5432/vault node scripts/test-cloud-sql.js

# Oder Umgebungsvariablen setzen und dann:
node scripts/test-cloud-sql.js
```

Unterstützte Variablen: `DATABASE_URL` ODER `PGHOST`, `PGUSER`, `PGPASSWORD`, `PGDATABASE` (optional, Standard: `vault`).

---

## Sicherheit

- **Passwörter** nicht ins Git stellen; nur in `.env` oder Umgebungsvariablen auf dem Server.
- Für Produktion: **Private IP** und/oder **Cloud SQL Auth Proxy** statt offener öffentlicher IP mit `0.0.0.0/0`.
- **SSL/TLS:** Cloud SQL unterstützt SSL; in der Verbindungs-URL können Sie `?sslmode=require` anhängen.

---

## Nützliche Links

- [Cloud SQL for PostgreSQL – Dokumentation](https://cloud.google.com/sql/docs/postgres)
- [Verbindung mit Cloud SQL Auth Proxy](https://cloud.google.com/sql/docs/postgres/connect-auth-proxy)
