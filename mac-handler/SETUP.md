# PhotoImportHandler — Automator App Setup

Ein einmalig eingerichteter Helfer, der Klicks auf `photoimport://ORDNERNAME`
Links aus dem Browser entgegennimmt und Lightroom Classic mit dem
passenden Import-Dialog öffnet.

---

## 1. Automator-App erstellen

1. **Automator** öffnen (Spotlight: "Automator")
2. **Neues Dokument** → Typ **"Programm"** ("Application") wählen
3. Linke Spalte: nach **"Shell-Skript ausführen"** suchen, in den
   Workflow-Bereich rechts ziehen
4. Oben im Shell-Skript-Block: **"Übergabe der Eingabe"** auf
   **"als Argumente"** ("as arguments") stellen
5. Den vorhandenen Platzhaltertext löschen und folgendes einfügen:

```bash
#!/bin/bash
# $1 = z.B. "photoimport://2026-06-05_SONY_A7V"

URL="$1"

# Schema-Präfix entfernen
FOLDER="${URL#photoimport://}"
# Trailing Slash entfernen falls vorhanden
FOLDER="${FOLDER%/}"

# Percent-Encoding dekodieren (z.B. %20 -> Leerzeichen)
FOLDER=$(python3 -c "import sys, urllib.parse; print(urllib.parse.unquote(sys.argv[1]))" "$FOLDER")

VOLUME="/Volumes/Original RAWs"
TARGET="$VOLUME/$FOLDER"

# Kurze Wartezeit + Existenz-Check (falls SMB-Mount noch nicht bereit ist)
if [ ! -d "$TARGET" ]; then
    osascript -e "display notification \"Ordner nicht gefunden: $TARGET\" with title \"Photo Import\""
    exit 1
fi

open -a "Adobe Lightroom Classic" "$TARGET"
```

6. **Ablage → Sichern…**
   - Name: `PhotoImportHandler`
   - Dateiformat: **Programm**
   - Speicherort: `/Programme` (Applications) — wichtig für die
     System-weite URL-Scheme-Registrierung

---

## 2. URL-Scheme registrieren (Info.plist bearbeiten)

Automator-Apps haben standardmäßig keine URL-Scheme-Registrierung.
Die muss einmalig per Hand in die `Info.plist` der App eingetragen werden.

1. Im Finder: `/Programme/PhotoImportHandler.app`
2. **Rechtsklick → "Paketinhalt zeigen"**
3. Navigiere zu `Contents/Info.plist`
4. Datei mit **TextEdit** öffnen:
   - Rechtsklick auf `Info.plist` → **Öffnen mit → TextEdit**
   - Falls TextEdit nicht angeboten wird: Rechtsklick → "Andere App…" →
     im Dialog oben **Alle Programme** wählen → TextEdit suchen

5. Du siehst eine XML-Struktur, die mit `<dict>` beginnt und mit
   `</dict></plist>` endet. **Direkt vor dem letzten `</dict>`**
   folgenden Block einfügen:

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

   Die Datei sieht danach am Ende ungefähr so aus:
   ```xml
       ...
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
   </dict>
   </plist>
   ```

6. **Speichern** (⌘S). TextEdit fragt eventuell, ob das Format
   beibehalten werden soll — "Verwende .plist" / "Keep" wählen.

---

## 3. Registrierung aktivieren

macOS merkt sich URL-Scheme-Handler beim ersten Start der App neu ein.

1. `/Programme/PhotoImportHandler.app` per **Doppelklick** öffnen
2. Falls eine Sicherheitswarnung kommt ("nicht verifizierter Entwickler"):
   **Rechtsklick → Öffnen** → im Dialog bestätigen
3. Die App läuft kurz unsichtbar im Hintergrund (kein Fenster, normal)

---

## 4. Testen

### a) Direkt über die Adressleiste
Im Browser eingeben:
```
photoimport://2026-06-05_SONY_A7V
```
→ Lightroom sollte sich mit dem Import-Dialog für diesen Ordner öffnen
(vorausgesetzt der Ordner existiert unter `/Volumes/Original RAWs/`).

### b) Über die Web-UI
`http://<NAS-IP>:3000` öffnen → bei einem Tag auf
**"In Lightroom öffnen"** klicken.

Beim ersten Klick fragt der Browser eventuell, ob die Seite
"PhotoImportHandler" öffnen darf — bestätigen, optional
"immer erlauben für diese Seite" aktivieren.

---

## Troubleshooting

| Problem | Lösung |
|---|---|
| Browser fragt "Unbekanntes Protokoll" | App wurde nicht registriert — Schritt 3 wiederholen, ggf. Mac neu starten |
| "Ordner nicht gefunden" Notification | SMB-Mount-Name prüfen: `ls "/Volumes/Original RAWs"` — Name muss exakt passen |
| Lightroom öffnet sich, aber kein Import-Dialog | LR-Version prüft eventuell anders — testen mit `open -a "Adobe Lightroom Classic" "/Volumes/Original RAWs/ORDNER"` direkt im Terminal |
| Sonderzeichen/Umlaute im Ordnernamen | `python3` muss vorhanden sein (macOS Standard) — `which python3` prüfen |
| Handler reagiert nicht mehr nach macOS-Update | App erneut per Doppelklick starten (Re-Registrierung) |

---

## Sicherheitshinweis

`photoimport://` öffnet lokal einen festen Ordner unter
`/Volumes/Original RAWs/` — der Ordnername kommt zwar aus der URL,
wird aber nur als Pfad-Bestandteil verwendet (kein Shell-`eval`,
keine beliebige Befehlsausführung). Trotzdem: Diese Web-UI sollte
nur im eigenen LAN erreichbar sein, nicht öffentlich exponiert werden.
