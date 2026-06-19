applescript
on open location theURL
    -- Load config from ~/.photoimport-config
    set configPath to (POSIX path of (path to home folder)) & ".photoimport-config"
    set nasHost to do shell script "grep '^NAS_HOST=' " & quoted form of configPath & " | cut -d'=' -f2-"
    set shareName to do shell script "grep '^SHARE_NAME=' " & quoted form of configPath & " | cut -d'=' -f2-"

    set theVolume to "/Volumes/" & shareName

    -- Remove Scheme-Prefix + URL-Decoding
    set theFolder to do shell script "python3 -c \"import sys, urllib.parse; print(urllib.parse.unquote(sys.argv[1].replace('photoimport://', '')))\" " & quoted form of theURL

    set thePath to theVolume & "/" & theFolder

    -- Mount-Check
    tell application "System Events"
        set isMounted to exists folder theVolume
    end tell

    if not isMounted then
        display notification "Mounting " & shareName & " …" with title "Photo Import"
        try
            set smbURL to "smb://" & nasHost & "/" & shareName
            mount volume smbURL
        on error errMsg
            display notification "Mount failed: " & errMsg with title "Photo Import"
            return
        end try

        -- waiting for the mount to become ready (max. 10s)
        set waited to 0
        repeat while waited < 10
            tell application "System Events"
                if exists folder theVolume then exit repeat
            end tell
            delay 1
            set waited to waited + 1
        end repeat
    end if

    -- Checking if URL-Decoded folder exists
    tell application "System Events"
        if not (exists folder thePath) then
            display notification "Ordner nicht gefunden: " & thePath with title "Photo Import"
            return
        end if
    end tell

    -- Open Lightroom with this folder as import source
    do shell script "open -a 'Adobe Lightroom Classic' " & quoted form of thePath
end open location
