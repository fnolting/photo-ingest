# photo-ingest

Automate transferring RAW images from your camera's memory card to your NAS, then import them straight into Lightroom Classic with a single click — no manual copying, no clunky watched-folder workarounds.

## Why this exists

Lightroom Classic doesn't support a network share as an auto-import watched folder, and manually digging through camera card folders to find "what's new since last time" gets old fast. `photo-ingest` splits the workflow into two small, independent pieces:

1. A **shell script on your NAS** that detects an inserted memory card, reads `DateTimeOriginal` from EXIF (not file mtime, which is unreliable after copying), groups files by shooting day, and copies them into per-day folders — then unmounts the card cleanly via the NAS's own eject mechanism.
2. A **small web app** (Node.js, no dependencies, runs in a single Docker container) that shows those days as a list, lets you mark days as imported and lock ("seal") finished shoots so they're never touched again, and — with one click — opens Lightroom's import dialog directly on the right folder via a `photoimport://` URL scheme handled by a tiny AppleScript app on the Mac.

```
Camera card → NAS card reader
    │
    ▼  scripts/photo-ingest.sh   (triggered by udev on card insert)
    │  • reads EXIF DateTimeOriginal + camera model (not mtime)
    │  • groups files by shooting day
    │  • copies to <RAW_DIR>/<YYYY-MM-DD>/
    │  • skips sealed days
    │  • writes per-day status file
    │  • unmounts card via USBDiskStop
    │
<RAW_DIR>/
    └── 2026-06-14/
        ├── A7V00001.ARW
        └── ...
    │
    ▼  Web UI  (Docker, port 3000)
    │  • shows shoot days with camera model + file count
    │  • live ingest log with adaptive polling (500ms during ingest, 5s idle)
    │  • mark as imported / seal completed shoots
    │  • offline detection banner
    │
    ▼  click "Open in Lightroom" → photoimport://2026-06-14
    │
    ▼  PhotoimportHandler.app  (AppleScript, on the Mac)
    │  • mounts the SMB share if not already mounted
    │  • reads NAS host + share name from ~/.photoimport-config
    │
    ▼  open -a "Adobe Lightroom Classic" "/Volumes/<share>/2026-06-14"
       → Lightroom's import dialog opens with that folder pre-selected
       → click "Add" — files stay exactly where they are, no copying
```

## Components

| Path | What it is |
|---|---|
| `scripts/photo-ingest.sh` | POSIX shell script, runs on the NAS. Finds the mounted card, reads EXIF via `exiftool`, copies ARW files into per-day folders, writes status files, unmounts the card. Idempotent — lockfile-protected and safe to run repeatedly. |
| `app/server.js` | Node.js HTTP server (no framework, no `npm install` needed). Serves the web UI and a small JSON API. Runs with `node --watch` so edits on the NAS take effect immediately without rebuilding. |
| `app/i18n.js` | All UI strings, keyed by locale. Ships with `en`, `de`, `es`, `fr`, `it`, `nl`. Add a language by adding a new key with the same shape. |
| `app/Dockerfile` | Minimal `node:20-alpine` image. |
| `docker-compose.yaml` | Compose file — copy and fill in the path placeholders. |
| `mac-handler/PhotoimportHandler.applescript` | AppleScript source for the macOS `photoimport://` URL handler. Compile once with `osacompile`. |
| `mac-handler/.photoimport-config` | Config file read at runtime by the compiled handler (NAS hostname + share name). Edit this instead of recompiling when your network changes. |

## Requirements

- A NAS running Linux with Docker and Docker Compose
- `exiftool` installed on the NAS
- `USBDiskStop` available on the NAS (ships with UGREEN UGOS; adapt the unmount section for other NAS systems)
- The RAW directory shared over SMB and mountable on the Mac
- A Mac running Lightroom Classic
- `python3` on the Mac (for URL-decoding in the AppleScript handler; ships with macOS)

## Setup

### 1. NAS: ingest script

Install `exiftool`:
```sh
apt-get install -y libimage-exiftool-perl   # Debian/Ubuntu-based
# or
opkg install exiftool                        # OpenWrt-based
```

Copy `scripts/photo-ingest.sh` to the NAS and set the paths at the top:
```sh
BASE="/your/raw/files/directory"
STATUS_BASE="/your/docker/path/photo-ingest/data/ingest-status"
```

Also adjust the `SOURCE` line if your NAS mounts external drives differently than `/mnt/@usb/sd*`.

```sh
chmod +x photo-ingest.sh
```

**Note on unmounting:** The script calls `USBDiskStop <device>` at the end, which is a UGREEN UGOS-specific tool that handles unmounting and powering off the USB device cleanly. If you're running a different NAS OS, replace this section with your system's equivalent (e.g. `udisksctl power-off`, `eject`, or a vendor-specific tool).

### 2. NAS: udev trigger

The script is triggered **on card insert** via a udev rule, not a cron job. Example rule (`/etc/udev/rules.d/99-photo-ingest.rules`):

```
ACTION=="add", SUBSYSTEM=="block", ENV{ID_FS_USAGE}=="filesystem", \
    RUN+="/path/to/scripts/photo-ingest.sh"
```

Reload after creating or editing the rule:
```sh
udevadm control --reload-rules
```

> ⚠️ The exact rule depends on how your card reader announces itself. Use `udevadm monitor --environment --udev` while inserting the card to observe the actual events and variables, then adjust the rule accordingly.

The script is lockfile-protected (`/tmp/photo-ingest.lock`) and safe if udev fires multiple events per insert.

### 3. NAS: Docker container

Copy `docker-compose.yaml` next to the `app/` folder, fill in the placeholders, then:

```sh
docker compose up -d --build
docker logs -f photo-ingest
```

Key environment variables:

| Variable | Description |
|---|---|
| `IMPORT_BASE` | Path to your RAW files directory (read-only mount) |
| `STATUS_BASE` | Path where per-day `.ingest_status` files are written |
| `MAC_VOLUME` | Name of the SMB share as it appears on the Mac under `/Volumes/` |
| `UI_LOCALE` | UI language: `en`, `de`, `es`, `fr`, `it`, or `nl` (default: `en`) |
| `LOG_FILE` | Path to the ingest log inside the container (default: `/data/photo-ingest.log`) |

`server.js` and `i18n.js` are bind-mounted into the container and watched with `node --watch` — edit either file on the NAS and the server reloads automatically without a rebuild.

Web UI: `http://<nas-host>:3000`
In-app README: `http://<nas-host>:3000/readme`

### 4. Mac: `photoimport://` URL handler

Lightroom Classic refuses network shares as an auto-import source. Instead, a click in the web UI opens a `photoimport://<folder>` link. A small AppleScript app, registered as the handler for that URL scheme, mounts the SMB share if needed and opens Lightroom's import dialog on the right folder.

**Create the config file** (edit when your NAS host or share name changes — no recompile needed):
```sh
cat > ~/.photoimport-config << 'CFG'
NAS_HOST=your-nas.local
SHARE_NAME=Your RAW Share Name
CFG
```

**Compile the handler:**
```sh
osacompile -o /Applications/PhotoimportHandler.app \
    mac-handler/PhotoimportHandler.applescript
```

**Register the URL scheme** — open `/Applications/PhotoimportHandler.app/Contents/Info.plist` in a text editor and add, just before the closing `</dict>`:
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

**Register with macOS** by starting the app once:
```sh
open /Applications/PhotoimportHandler.app
```
Right-click → Open if Gatekeeper blocks it.

**Test** by typing this into a browser address bar:
```
photoimport://2026-06-14
```
The share should mount automatically (if not already mounted) and Lightroom's import dialog should open on that folder.

> For silent mounting without a credential prompt, connect to the share once via Finder (`⌘K`) and tick "Remember this password in my keychain".

> In the Lightroom import dialog, always click **Add** — never Move or Copy. The files are already at their final location.

## Daily workflow

1. Insert the memory card into the NAS card reader
2. udev triggers the ingest script automatically
3. Watch the live log in the web UI if you want to confirm progress
4. Once the ingest finishes, the card is unmounted automatically — safe to remove
5. Click **"Open in Lightroom"** for the day(s) you want to import
6. In Lightroom's import dialog, click **Add**
7. Mark the day as imported in the web UI
8. Once you've finished culling, click **Seal** — sealed days are skipped by all future ingest runs, so reinserting an old card never re-copies or disturbs already-processed folders

## Status files

The script writes a small status file per shooting day to `STATUS_BASE`:

```
date=2026-06-14
camera=ILCE-7M5
files=215
ingested_at=2026-06-14T22:15:29+02:00
imported_to_lightroom=false
sealed=false
```

These are read by the web UI to display camera model, file count, ingest time, and lock state. They live separately from the RAW files so the RAW directory can be mounted read-only in the Docker container.

## Localization

All UI text lives in `app/i18n.js`, split into `server` (HTML scaffold, rendered server-side) and `client` (badges, buttons, toasts — injected as `window.I18N` and used by the browser-side JS). Switch language via `UI_LOCALE` in `docker-compose.yaml`. Add a new language by adding an entry with the same key structure as an existing locale.

## Troubleshooting

| Problem | Solution |
|---|---|
| Script doesn't run on card insert | Check udev rule; use `udevadm monitor --environment --udev` to observe actual events while inserting |
| No ARW files found | Check that `SOURCE` resolves correctly: `find /mnt/@usb/sd* -type d -name DCIM` |
| `exiftool` not found | `which exiftool`; adjust path in script if needed |
| Card not unmounting | `USBDiskStop` is UGOS-specific; adapt for your NAS OS if needed |
| Container won't start | `docker logs photo-ingest` |
| Web UI stuck on "Loading…" | Check browser console for JS errors; ensure container is running |
| "Open in Lightroom" does nothing | `PhotoimportHandler.app` not registered — run `open /Applications/PhotoimportHandler.app` again |
| Browser asks permission for handler | Confirm and optionally tick "Always allow" — one-time per browser |
| Share not mounting automatically | Connect once via Finder and save password to keychain |
| Lightroom opens without import dialog | Test directly: `open -a "Adobe Lightroom Classic" "/Volumes/<share>/<folder>"` |
