# photo-ingest
Automate transferring images from your camera to your NAS and import them directly into Lightroom.


=== Additional setup steps ===
### Trigger: udev-Regel erstellen

Das Script wird **nicht** per Cronjob ausgeführt, sondern automatisch
durch eine **udev-Regel**, sobald die CF-A Karte in den Kartenleser
gesteckt und vom System erkannt/gemountet wird. Das ist schneller
(kein Polling-Intervall) und vermeidet unnötige Läufe ohne Karte.

**Beispiel-Regel** (Pfad je nach NAS-OS, häufig
`/etc/udev/rules.d/99-photo-ingest.rules`):

```
ACTION=="add", SUBSYSTEM=="block", ENV{ID_FS_USAGE}=="filesystem", \
    RUN+="/volume3/docker/photo-ingest/scripts/photo-ingest.sh"
```

Nach Anlegen/Ändern der Regel:
```
udevadm control --reload-rules
```

> ⚠️ Die genaue Regel hängt davon ab, wie der Kartenleser/USB-Adapter
> sich am NAS meldet (Device-Name, Filesystem-Trigger vs. Mount-Trigger).
> Mit `udevadm monitor --environment --udev` lässt sich beim Einstecken
> der Karte beobachten, welche Events und ENV-Variablen tatsächlich
> ausgelöst werden, um die Regel passend zu justieren.

Das Script selbst ist weiterhin idempotent und gegen Mehrfachausführung
abgesichert (Lockfile `/tmp/photo-ingest.lock`), falls udev das Event
mehrfach auslöst (z.B. bei mehreren Partitionen/Events pro Steckvorgang).
