# PhotoImportHandler — Setup

Ein einmalig eingerichteter Helfer, der Klicks auf `photoimport://ORDNERNAME`
Links aus dem Browser entgegennimmt und Lightroom Classic mit dem
passenden Import-Dialog öffnet.

---

## 1. AppleScript-App erstellen

Folgendes in eine Datei `/tmp/PhotoImportHandler.applescript` kopieren:

```applescript
on open location theURL
    -- Schema-Präfix entfernen + URL-Decoding
    set theFolder to do shell script "python3 -c \"import sys, urllib.parse; print(urllib.parse.unquote(sys.argv[1].replace('photoimport://', '')))\" " & quoted form of theURL

    set theVolume to "/Volumes/Original RAWs"
    set thePath to theVolume & "/" & theFolder

    -- Existenz-Check (falls SMB-Mount noch nicht bereit ist)
    tell application "System Events"
        if not (exists folder thePath) then
            display notification "Ordner nicht gefunden: " & thePath with title "Photo Import"
            return
        end if
    end tell

    -- Lightroom öffnen mit diesem Ordner als Import-Quelle
    do shell script "open -a 'Adobe Lightroom Classic' " & quoted form of thePath
end open location
```

Dann im Terminal kompilieren:
```sh
osacompile -o /Applications/PhotoImportHandler.app /tmp/PhotoImportHandler.applescript
```

---

## 2. URL-Scheme registrieren (Info.plist bearbeiten)

AppleScript-Apps registrieren sich nicht automatisch für URL-Schemes.
Das muss einmalig per Hand in die `Info.plist` eingetragen werden.

1. Im Finder: `/Programme/PhotoImportHandler.app` (oder `/Applications/PhotoImportHandler.app`)
2. **Rechtsklick → "Paketinhalt zeigen"**
3. Navigiere zu `Contents/Info.plist`
4. Datei mit **TextEdit** öffnen:
   Rechtsklick → "Öffnen mit → Andere App…" → oben "Alle Programme" wählen → TextEdit

5. **Direkt vor dem letzten `</dict>`** folgenden Block einfügen:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLName</key>
        <string>Photo Import Handler</string>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>photoimport</string>
        </array>
    </dict>
</array>
```

6. **Speichern** – bei der Nachfrage "Format beibehalten" wählen.

---

## 3. Registrierung aktivieren

macOS registriert das URL-Scheme beim ersten Start der App.

```sh
open /Applications/PhotoImportHandler.app
```

Falls eine Sicherheitswarnung erscheint ("nicht verifizierter Entwickler"):
**Rechtsklick → Öffnen** → im Dialog bestätigen.

Die App läuft unsichtbar im Hintergrund (kein Fenster – das ist normal).

---

## 4. Testen

Im Browser in die Adressleiste eingeben:
```
photoimport://2026-06-10
```

Beim ersten Aufruf fragt der Browser, ob die Seite "PhotoImportHandler"
öffnen darf – bestätigen, optional "immer erlauben" aktivieren.

Lightroom sollte sich mit dem Import-Dialog für diesen Ordner öffnen.

---

## Troubleshooting

| Problem | Lösung |
|---|---|
| Browser: "Unbekanntes Protokoll" | App wurde nicht registriert – Schritt 3 wiederholen, ggf. Mac neu starten |
| "Ordner nicht gefunden" Notification | SMB-Mount prüfen: `ls "/Volumes/Original RAWs"` – Name muss exakt passen |
| Lightroom öffnet sich ohne Import-Dialog | Direkt testen: `open -a "Adobe Lightroom Classic" "/Volumes/Original RAWs/ORDNER"` |
| Handler reagiert nicht mehr nach macOS-Update | App erneut starten zur Re-Registrierung: `open /Applications/PhotoImportHandler.app` |
| `python3` nicht gefunden | `which python3` im Terminal – ggf. `python3` via Xcode CLI Tools installieren: `xcode-select --install` |
