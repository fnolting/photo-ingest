#!/bin/sh
# photo-ingest.sh
# Kopiert ARW-Dateien von CF Express A Karte direkt nach /volume2/Original RAWs.
# Verwendet DateTimeOriginal aus EXIF (nicht mtime).
# Unterstützt mehrere Aufnahmetage auf einer Karte.

SOURCE=$(find /mnt/@usb/sd* -type d -name DCIM 2>/dev/null | head -n 1)
BASE="/volume2/Original RAWs"
STATUS_BASE="/volume3/docker/photo-ingest/data/ingest-status"
LOG="/var/log/photo-ingest.log"
LOCK="/tmp/photo-ingest.lock"
SEALED_KEY="sealed=true"

# =========================
# CHECK FOR MEMORY CARD
# =========================
if [ -z "$SOURCE" ] || [ ! -d "$SOURCE" ]; then
    echo "[$(date)] No Memory Card found. Exiting." >> "$LOG"
    exit 0
fi

echo "[$(date)] Using source: $SOURCE" >> "$LOG"

# =========================
# CHECK AND TAKE THE LOCK
# =========================
if [ -f "$LOCK" ]; then
    echo "[$(date)] Lockfile found. Exiting." >> "$LOG"
    exit 0
fi
touch "$LOCK"
echo "[$(date)] ============ START ingest ============" >> "$LOG"

# =========================
# CLEANUP TEMP FILES
# =========================
rm -f /tmp/all_arw.txt /tmp/exif_parsed.txt

# =========================
# FIND ALL ARW FILES
# =========================
# Quick exit route, if no files are there
if ! find "$SOURCE" -type f -iname "*.ARW" -print -quit | grep -q .; then
    rm -f "$LOCK"
    exit 0
fi

# Build txt list if there's something to ingest
find "$SOURCE" -type f -iname "*.ARW" > /tmp/all_arw.txt
TOTAL=$(wc -l < /tmp/all_arw.txt)

# Write log
echo "[$(date)] Found ARW files: $TOTAL" >> "$LOG"

# =========================
# EXIF SCAN
# Output Format: PATH|DATE|MODEL (/mnt/.../DSC0001.ARW|2026:06:05|ILCE-7M5)
# =========================
exiftool -fast2 -p '$filename|$directory|$DateTimeOriginal|$Model' \
    -@ /tmp/all_arw.txt \
    2>>"$LOG" | while read -r line; do
    FNAME=$(echo "$line" | cut -d'|' -f1)
    DIR=$(echo "$line" | cut -d'|' -f2)
    EXIF_DATE=$(echo "$line" | cut -d'|' -f3 | cut -d' ' -f1)
    MODEL=$(echo "$line" | cut -d'|' -f4)
    if echo "$EXIF_DATE" | grep -qE '^[0-9]{4}:[0-9]{2}:[0-9]{2}$'; then
        echo "$DIR/$FNAME|$EXIF_DATE|$MODEL"
    fi
done > /tmp/exif_parsed.txt

PARSED=$(wc -l < /tmp/exif_parsed.txt)
echo "[$(date)] EXIF parsed: $PARSED files with valid date" >> "$LOG"

if [ "$PARSED" -eq 0 ]; then
    echo "[$(date)] No files with valid EXIF date - exit" >> "$LOG"
    rm -f /tmp/all_arw.txt /tmp/exif_parsed.txt "$LOCK"
    exit 0
fi

# =========================
# GROUP BY DATE & COPY TO &{BASE} DIRECTORY
# =========================
cut -d'|' -f2 /tmp/exif_parsed.txt | sort -u | while read -r EXIF_DATE; do
    DIR_DATE=$(echo "$EXIF_DATE" | tr ':' '-')
    TARGET="${BASE}/${DIR_DATE}"

    mkdir -p "$STATUS_BASE"
    STATUS_FILE="${STATUS_BASE}/${DIR_DATE}.ingest_status"

# =========================
# CHECK IF SEALED → SKIP
# =========================
if [ -f "$STATUS_FILE" ] && grep -q "$SEALED_KEY" "$STATUS_FILE"; then
    echo "[$(date)] Skip sealed directory: $TARGET" >> "$LOG"
    continue
fi

    DATE_LINES=$(grep "^[^|]*|${EXIF_DATE}|" /tmp/exif_parsed.txt)
    COUNT=$(echo "$DATE_LINES" | wc -l)
    MODEL=$(echo "$DATE_LINES" | head -1 | cut -d'|' -f3 | sed 's/^ *//;s/ *$//')
    [ -z "$MODEL" ] && MODEL="Unknown"

    echo "[$(date)] Date $DIR_DATE: $COUNT files ($MODEL) → $TARGET" >> "$LOG"

    mkdir -p "$TARGET"

    echo "$DATE_LINES" | cut -d'|' -f1 | while read -r FILE; do
        BASENAME=$(basename "$FILE")
        DEST="$TARGET/$BASENAME"
        if [ ! -f "$DEST" ]; then
            rsync -rt "$FILE" "$DEST" >> "$LOG" 2>&1
        else
            echo "[$(date)] Skip (exists): $BASENAME" >> "$LOG"
        fi
    done

    COPIED=$(ls "$TARGET" | wc -l)
    echo "[$(date)] $DIR_DATE done: $COPIED files in target" >> "$LOG"

    # Populate $STATUS_FILE for Web-UI after copying files
    echo "date=$DIR_DATE" > "$STATUS_FILE"
    echo "camera=$MODEL" >> "$STATUS_FILE"
    echo "files=$COPIED" >> "$STATUS_FILE"
    echo "ingested_at=$(date -Iseconds)" >> "$STATUS_FILE"
    echo "imported_to_lightroom=false" >> "$STATUS_FILE"
    echo "sealed=false" >> "$STATUS_FILE"
done

# =========================
# CLEANUP TEMP FILES
# =========================
rm -f /tmp/all_arw.txt /tmp/exif_parsed.txt
echo "[$(date)] ============ END ingest ============" >> "$LOG"
rm -f "$LOCK"
exit 0
