# Port 3000 ist belegt (EADDRINUSE)

Wenn `npm start` meldet: **"address already in use 0.0.0.0:3000"**, nutzt schon ein anderer Prozess den Port.

---

## Option A: Prozess auf Port 3000 beenden (Windows)

In **PowerShell als Administrator** (oder normale PowerShell):

```powershell
# Zeigt, welcher Prozess Port 3000 nutzt (letzte Spalte = PID)
netstat -ano | findstr :3000
```

Beispielausgabe: `TCP    0.0.0.0:3000    0.0.0.0:0    LISTENING    12345`  
Dann Prozess beenden (12345 durch die angezeigte PID ersetzen):

```powershell
taskkill /PID 12345 /F
```

Danach erneut `npm start` ausführen.

---

## Option B: Anderen Port verwenden

Ohne etwas zu beenden, z.B. Port **3001**:

**PowerShell:**
```powershell
$env:PORT=3001; npm start
```

**CMD:**
```cmd
set PORT=3001 && npm start
```

Portal dann im Browser öffnen: **http://localhost:3001**
