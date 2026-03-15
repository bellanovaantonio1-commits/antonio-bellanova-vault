# .env einrichten – in 3 Schritten

## Schritt 1: Skript ausführen (legt .env an)

Im Projektordner im Terminal:

```bash
node scripts/env-mysql-einrichten.js
```

Damit wird die Datei **.env** erstellt bzw. um die MySQL-Zeilen ergänzt.

---

## Schritt 2: .env öffnen und 2 Werte eintragen

1. Im Projektordner die Datei **.env** öffnen (in Cursor: links im Explorer auf `.env` klicken).
2. Diese beiden Platzhalter **durch Ihre echten Daten ersetzen**:

   - **HIER_OEFFENTLICHE_IP_EINTRAGEN** → Die IP-Adresse Ihrer Cloud-SQL-Instanz (Google Cloud Console → SQL → Instanz „bellanova-main-db“ → Übersicht → „Öffentliche IP-Adresse“).
   - **HIER_PASSWORT_EINTRAGEN** → Das Passwort des MySQL-Benutzers (z.B. root).

3. Datei speichern (Strg+S).

---

## Schritt 3: Verbindung testen

```bash
node scripts/test-cloud-sql-mysql.js
```

Wenn „Cloud SQL (MySQL) Verbindung OK“ erscheint, ist alles verbunden.

---

**Falls die .env-Datei nicht sichtbar ist:** Sie heißt wirklich nur `.env` (mit Punkt am Anfang). In Cursor erscheint sie in der Dateiliste; unter Windows Explorer unter Umständen unter „Ausgeblendete Elemente“ anzeigen.
