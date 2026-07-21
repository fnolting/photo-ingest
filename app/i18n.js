'use strict';
// i18n.js — Texts for the Photo-Ingest Web UI
//
// All text displayed in the UI is stored centrally here as variables
// to enable multilingual support.
//
// Select the language using the environment variable UI_LOCALE (e.g., "de" or "en").
// If UI_LOCALE is set to an invalid value or no value at all, DEFAULT_LOCALE is used.
//
// Structure:
// LOCALES.<locale>.server → server-side rendered text (HTML framework)
// LOCALES.<locale>.client → client-side text (embedded as window.I18N
// in the HTML and used by the UI logic in the <script> section)
//

const LOCALES = {
    de: {
        server: {
            htmlLang: 'de',
            pageTitle: 'Photo Ingest',
            heading: '📸 ⚙️ Photo Ingest',
            subtitle: 'Foto-Import & Workflow-Steuerung für RAW-Bilddaten',

            infoBox:
                'ℹ️ <strong>Übertrage Bilder von der Kamera in dein NAS und importiere sie direkt in Lightroom.</strong> ' +
                'Diese Web-App dient als Frontend für einen Foto-Import-Workflow von der Kamera-Speicherkarte auf ein NAS-System ' +
                'bzw. als Helper für den Import der vorher durch das Backend-Script auf das NAS kopierten Bilddaten in Lightroom Classic. ' +
                'Weitere Komponenten sind neben dem Backend-Script zum Kopieren der RAW-Files auch ein clientseitiges AppleScript für die ' +
                'Kommunikation zwischen Web-App und Lightroom Classic sowie ein Docker-Container auf Basis eines minimalistischen node.js Images ' +
                '(node:20-alpine). Kein Gefummel mehr mit komplizierten manuellen Kopierjobs! Mit dieser Web-App behältst du deine RAW-Importe im Griff 👍🏼',

            hintBox:
                '📁 <strong>Quelle:</strong> Verfügbare Shoot-Tage im RAW-Archiv nach Ingest auf dem NAS.<br>' +
                '🔄 <strong>Status:</strong> Verwaltung des Import-Status sowie Sperren (🔒) abgeschlossener Tage, um ungewollte Änderungen oder erneute Imports bereits gecullter Shootings (z.B. bei mehrfachen Imports pro Tag) zu verhindern.<br>' +
                '💡 <strong>Workflow:</strong> Klick auf <strong>"In Lightroom öffnen"</strong> → ' +
                'Lightroom öffnet den Import-Dialog mit dem Ordner als Quelle. ' +
                'Im Dialog auf <strong>"Hinzufügen"</strong> klicken (kein Verschieben/Kopieren nötig).<br>' +
                '⚠️ <strong>Achtung:</strong> Funktioniert nur, wenn der einmalige <code>photoimport://</code>-Handler ' +
                'auf dem Mac eingerichtet ist (siehe <a href="/readme" target="_blank">README</a>).',

            offlineBanner: '⛔️ NAS-System nicht erreichbar – Daten werden nicht aktualisiert.',

            filterAll: 'Alle',
            filterPending: 'Ausstehend',
            filterImported: 'Importiert',

            loading: 'Lade…',
            ingestLogTitle: 'Ingest-Log',
            ingestLogMetaPlaceholder: '–',

            readmeNotFound: 'README not found'
        },
        client: {
            // render(): Empty state (no folder in current filter)
            emptyStateEmoji: '📸 🤷🏼‍♂️',
            emptyStateText: 'Keine Einträge vorhanden, starte einen neuen Ingest durch Stecken der Speicherkarte im NAS - oder geh raus zum Fotografieren 📸 😉',

            // Age-Badge on the Cards
            ageJustNow: 'Gerade',  // "now"
            ageHoursSuffix: 'h',   // hours
            ageDaysSuffix: 'd',    // days

            // Card: Camera/Status-Badges
            badgeImported: '✓ importiert',
            badgeRawSuffix: ' RAW',

            // Card: Buttons
            btnOpenInLightroom: 'In Lightroom öffnen',
            btnMarkAsImported: 'Als importiert markieren',
            btnImportedDone: '✓ Erledigt',
            lockClosedLabel: '🔒 Gesperrt',
            lockOpenLabel: '🔓 Offen',

            // Toasts
            toastSealError: 'Fehler beim Umschalten: ',
            toastSealedOn: 'Ordner gesperrt 🔒',
            toastSealedOff: 'Ordner geöffnet 🔓',

            // Log-Panel
            logNoFile: 'Noch kein Log vorhanden – wurde das Ingest-Script schon einmal ausgeführt?',
            logEmpty: 'Log ist leer',
            logUpdatedPrefix: 'aktualisiert ',
            logMetaPlaceholder: '–',

            // Date/Time-Locale for toLocaleString / toLocaleTimeString
            dateLocale: 'de'
        }
    },

    en: {
        server: {
            htmlLang: 'en',
            pageTitle: 'Photo Ingest',
            heading: '📸 ⚙️ Photo Ingest',
            subtitle: 'Photo import & workflow control for RAW image files',

            infoBox:
                'ℹ️ <strong>Transfer images from your camera to your NAS and import them directly into Lightroom.</strong> ' +
                'This web app serves as a frontend for a photo import workflow from the camera memory card to a NAS system, ' +
                'and as a helper to import image data — previously copied to the NAS by the backend script — into Lightroom Classic. ' +
                'Other components, besides the backend script that copies the RAW files, include a client-side AppleScript handler for ' +
                'communication between the web app and Lightroom Classic, as well as a Docker container based on a minimal node.js image ' +
                '(node:20-alpine). No more fiddling with complicated manual copy jobs! With this web app you stay in control of your RAW imports 👍🏼',

            hintBox:
                '📁 <strong>Source:</strong> Available shoot days in the RAW archive after ingest on the NAS.<br>' +
                '🔄 <strong>Status:</strong> Manages the import status and locking (🔒) of completed days, to prevent unwanted changes or repeated imports of already culled shoots (e.g. with multiple imports per day).<br>' +
                '💡 <strong>Workflow:</strong> Click <strong>"Open in Lightroom"</strong> → ' +
                'Lightroom opens the import dialog with this folder as the source. ' +
                'In the dialog, click <strong>"Add"</strong> (no need to move or copy anything).<br>' +
                '⚠️ <strong>Note:</strong> Only works if the one-time <code>photoimport://</code> handler ' +
                'has been set up on the Mac (see <a href="/readme" target="_blank">README</a>).',

            offlineBanner: '⛔️ NAS not reachable – data is not being updated.',

            filterAll: 'All',
            filterPending: 'Pending',
            filterImported: 'Imported',

            loading: 'Loading…',
            ingestLogTitle: 'Ingest log',
            ingestLogMetaPlaceholder: '–',

            readmeNotFound: 'README not found'
        },
        client: {
            emptyStateEmoji: '📸 🤷🏼‍♂️',
            emptyStateText: 'No entries yet — insert the memory card into the NAS to start a new ingest, or go out and take some photos 📸 😉',

            ageJustNow: 'Just now',
            ageHoursSuffix: 'h',
            ageDaysSuffix: 'd',

            badgeImported: '✓ imported',
            badgeRawSuffix: ' RAW',

            btnOpenInLightroom: 'Open in Lightroom',
            btnMarkAsImported: 'Mark as imported',
            btnImportedDone: '✓ Done',
            lockClosedLabel: '🔒 Locked',
            lockOpenLabel: '🔓 Unlocked',

            toastSealError: 'Error toggling lock: ',
            toastSealedOn: 'Folder locked 🔒',
            toastSealedOff: 'Folder unlocked 🔓',

            logNoFile: 'No log yet – has the ingest script ever run?',
            logEmpty: 'Log is empty',
            logUpdatedPrefix: 'updated ',
            logMetaPlaceholder: '–',

            dateLocale: 'en'
        }
    },

    es: {
        server: {
            htmlLang: 'es',
            pageTitle: 'Photo Ingest',
            heading: '📸 ⚙️ Photo Ingest',
            subtitle: 'Importación de fotos y control del flujo de trabajo para archivos de imagen RAW',

            infoBox:
                'ℹ️ <strong>Transfiere las imágenes de tu cámara a tu NAS e impórtalas directamente a Lightroom.</strong> ' +
                'Esta aplicación web funciona como interfaz para importar fotos desde la tarjeta de memoria de la cámara a un sistema NAS ' +
                'y como asistente para importar datos de imagen —previamente copiados al NAS por el script de backend— a Lightroom Classic. ' +
                'Otros componentes, además del script de backend que copia los archivos RAW, incluyen un controlador AppleScript del lado del ' +
                'cliente para la comunicación entre la aplicación web y Lightroom Classic, así como un contenedor Docker basado en una imagen ' +
                'mínima de Node.js (node:20-alpine). ¡Olvídate de las complicadas copias manuales! Con esta aplicación web, tú tienes el control ' +
				'total de tus importaciones RAW. 👍🏼',

            hintBox:
                '📁 <strong>Source:</strong> Días de rodaje disponibles en el archivo RAW después de la ingesta en el NAS.<br>' +
                '🔄 <strong>Status:</strong> Gestiona el estado de importación y el bloqueo (🔒) de los días completados, para evitar cambios no deseados o importaciones repetidas de brotes ya descartados (por ejemplo, con múltiples importaciones por día).<br>' +
                '💡 <strong>Workflow:</strong> Haz clic en <strong>"Abrir en Lightroom"</strong> → ' +
                'Lightroom abre el cuadro de diálogo de importación con esta carpeta como origen. ' +
                'En el cuadro de diálogo, haga clic en <strong>"Agregar"</strong> (no es necesario mover ni copiar nada).<br>' +
                '⚠️ <strong>Nota:</strong> Solo funciona si el controlador <code>photoimport://</code> de un solo uso ' +
                'se ha configurado en la Mac (ver <a href="/readme" target="_blank">README</a>).',

            offlineBanner: '⛔️ El NAS no es accesible - los datos no se están actualizando.',

            filterAll: 'Todo',
            filterPending: 'Pendiente',
            filterImported: 'Importada',

            loading: 'Cargando…',
            ingestLogTitle: 'Log de ingesta',
            ingestLogMetaPlaceholder: '–',

            readmeNotFound: 'No se encontró el README'
        },
        client: {
            emptyStateEmoji: '📸 🤷🏼‍♂️',
            emptyStateText: 'Aún no hay entradas - inserta la tarjeta de memoria en el NAS para iniciar una nueva ingesta o sal a tomar algunas fotos. 📸 😉',

            ageJustNow: 'Hace poco',
            ageHoursSuffix: 'h',
            ageDaysSuffix: 'd',

            badgeImported: '✓ importada',
            badgeRawSuffix: ' RAW',

            btnOpenInLightroom: 'Abrir en Lightroom',
            btnMarkAsImported: 'Marcar como importado',
            btnImportedDone: '✓ Hecho',
            lockClosedLabel: '🔒 Bloqueado',
            lockOpenLabel: '🔓 Desbloqueado',

            toastSealError: 'Error al activar/desactivar el bloqueo: ',
            toastSealedOn: 'Carpeta bloqueada 🔒',
            toastSealedOff: 'Carpeta desbloqueada 🔓',

            logNoFile: 'Aún no hay registro: ¿se ha ejecutado alguna vez el script de ingesta?',
            logEmpty: 'El registro está vacío',
            logUpdatedPrefix: 'actualizado ',
            logMetaPlaceholder: '–',

            dateLocale: 'es'
        }
    },

    fr: {
        server: {
            htmlLang: 'fr',
            pageTitle: 'Photo Ingest',
            heading: '📸 ⚙️ Photo Ingest',
            subtitle: 'Importation de photos et contrôle du flux de travail pour les fichiers d\'images RAW',

            infoBox:
                'ℹ️ <strong>Transférez les images de votre appareil photo vers votre NAS et importez-les directement dans Lightroom.</strong> ' +
                'Cette application web sert d\'interface pour l\'importation de photos depuis la carte mémoire de l\'appareil photo vers un système NAS. ' +
                'Elle facilite également l\'importation des données d\'image (préalablement copiées sur le NAS par un script côté serveur) dans Lightroom Classic. ' +
                'Outre le script côté serveur qui copie les fichiers RAW, elle comprend un gestionnaire AppleScript côté client pour la communication entre ' +
                'l\'application web et Lightroom Classic, ainsi qu\'un conteneur Docker basé sur une image minimale de Node.js (node:20-alpine). Fini les manipulations ' +
                'fastidieuses de copies manuelles! Avec cette application web, vous gardez le contrôle de vos importations RAW. 👍🏼',

            hintBox:
                '📁 <strong>Source:</strong> Jours de prise de vue disponibles dans l\'archive RAW après ingestion sur le NAS.<br>' +
                '🔄 <strong>Status:</strong> Gère le statut d\'importation et le verrouillage (🔒) des jours terminés, afin d\'éviter les modifications indésirables ou les importations répétées de pousses déjà éliminées (par exemple, avec plusieurs importations par jour)..<br>' +
                '💡 <strong>Flux de travail: <strong>Cliquez sur "Ouvrir dans Lightroom"</strong> → ' +
                'Lightroom ouvre la boîte de dialogue d\'importation en sélectionnant ce dossier comme source. ' +
                'Dans la boîte de dialogue, cliquez sur <strong>"Ajouter"</strong> (inutile de déplacer ou de copier quoi que ce soit).<br>' +
                '⚠️ <strong>Remarque:</strong> Fonctionne uniquement si le gestionnaire d’importation photo unique <code>photoimport://</code> a été configuré sur le Mac (voir <a href="/readme" target="_blank">README</a>).</a>).',

            offlineBanner: '⛔️ NAS inaccessible – les données ne sont pas mises à jour.',

            filterAll: 'Tout',
            filterPending: 'En attente',
            filterImported: 'Importé',

            loading: 'Chargement…',
            ingestLogTitle: 'Journal d\'ingestion',
            ingestLogMetaPlaceholder: '–',

            readmeNotFound: 'README introuvable'
        },
        client: {
            emptyStateEmoji: '📸 🤷🏼‍♂️',
            emptyStateText: 'Aucune entrée pour l\'instant— insérez la carte mémoire dans le NAS pour lancer une nouvelle acquisition, ou sortez prendre des photos. 📸 😉',

            ageJustNow: 'en ce moment',
            ageHoursSuffix: 'h',
            ageDaysSuffix: 'j',

            badgeImported: '✓ importé',
            badgeRawSuffix: ' RAW',

            btnOpenInLightroom: 'Ouvrir dans Lightroom',
            btnMarkAsImported: 'Marquer importé',
            btnImportedDone: '✓ Fait',
            lockClosedLabel: '🔒 Verrouillé',
            lockOpenLabel: '🔓 Déverrouillé',

            toastSealError: 'Erreur lors du verrouillage: ',
            toastSealedOn: 'Dossier verrouillé 🔒',
            toastSealedOff: 'Dossier déverrouillé 🔓',

            logNoFile: 'Aucun journal pour l\'instant – le script d\'ingestion a-t-il déjà été exécuté?',
            logEmpty: 'Le journal est vide.',
            logUpdatedPrefix: 'mis à jour ',
            logMetaPlaceholder: '–',

            dateLocale: 'fr'
        }
    },

    it: {
        server: {
            htmlLang: 'it',
            pageTitle: 'Photo Ingest',
            heading: '📸 ⚙️ Photo Ingest',
            subtitle: 'Importazione di foto e controllo del flusso di lavoro per file immagine RAW',

            infoBox:
                'ℹ️ <strong>Trasferisci le immagini dalla fotocamera al NAS e importale direttamente in Lightroom.</strong> ' +
                'Questa web app funge da interfaccia per un flusso di lavoro di importazione di foto dalla scheda di memoria della fotocamera a un sistema NAS ' +
                'e da strumento di supporto per importare i dati delle immagini, precedentemente copiati sul NAS dallo script di backend, in Lightroom Classic. ' +
                'Oltre allo script di backend che copia i file RAW, altri componenti includono un gestore AppleScript lato client per la comunicazione tra la web app ' +
                'e Lightroom Classic, nonché un container Docker basato su un\'immagine Node.js minimale (node:20-alpine). Niente più complicate operazioni di copia manuale! ' +
                'Con questa web app mantieni il controllo delle tue importazioni RAW 👍🏼',

            hintBox:
                '📁 <strong>Source:</strong> Giorni di ripresa disponibili nell\'archivio RAW dopo l\'importazione sul NAS.<br>' +
                '🔄 <strong>Status:</strong> Gestisce lo stato di importazione e il blocco (🔒) dei giorni completati, per impedire modifiche indesiderate o importazioni ripetute di germogli già scartati (ad esempio, con importazioni multiple al giorno).<br>' +
                '💡 <strong>Flusso di lavoro:</strong> Fai clic su <strong>"Apri in Lightroom"</strong> → ' +
                'Lightroom apre la finestra di dialogo di importazione con questa cartella come origine. ' +
                'Nella finestra di dialogo, fai clic su <strong>"Aggiungi"</strong> (non è necessario spostare o copiare nulla).<br>' +
                '⚠️ <strong>Nota:</strong> Funziona solo se il gestore monouso <code>photoimport://</code> ' +
                'è stato configurato sul Mac (vedi <a href="/readme" target="_blank">README</a>).',

            offlineBanner: '⛔️ NAS non raggiungibile: i dati non vengono aggiornati.',

            filterAll: 'Tutto',
            filterPending: 'In attesa',
            filterImported: 'Importato',

            loading: 'Caricamento…',
            ingestLogTitle: 'Log di acquisizione',
            ingestLogMetaPlaceholder: '–',

            readmeNotFound: 'README non trovato'
        },
        client: {
            emptyStateEmoji: '📸 🤷🏼‍♂️',
            emptyStateText: 'Ancora nessuna voce: inserisci la scheda di memoria nel NAS per avviare una nuova acquisizione oppure esci e scatta qualche foto 📸 😉',

            ageJustNow: 'Adesso',
            ageHoursSuffix: 'h',
            ageDaysSuffix: 'd',

            badgeImported: '✓ importato',
            badgeRawSuffix: ' RAW',

            btnOpenInLightroom: 'Apri in Lightroom',
            btnMarkAsImported: 'Contrassegna come importato',
            btnImportedDone: '✓ Fatto',
            lockClosedLabel: '🔒 Bloccato',
            lockOpenLabel: '🔓 Sbloccato',

            toastSealError: 'Errore durante l\'attivazione/disattivazione del blocco: ',
            toastSealedOn: 'Cartella bloccata 🔒',
            toastSealedOff: 'Cartella sbloccata 🔓',

            logNoFile: 'Nessun log ancora disponibile: lo script di acquisizione è mai stato eseguito?',
            logEmpty: 'Il log è vuoto',
            logUpdatedPrefix: 'aggiornato ',
            logMetaPlaceholder: '–',

            dateLocale: 'it'
        }
    },

    nl: {
        server: {
            htmlLang: 'nl',
            pageTitle: 'Photo Ingest',
            heading: '📸 ⚙️ Photo Ingest',
            subtitle: 'Foto-import en workflowbeheer voor RAW-afbeeldingen',

            infoBox:
                'ℹ️ <strong>Zet foto\'s van je camera over naar je NAS en importeer ze direct in Lightroom.</strong> ' +
                'Deze webapplicatie fungeert als frontend voor een workflow voor het importeren van foto\'s van de geheugenkaart van de camera naar een NAS-systeem, ' +
                'en als hulpmiddel om afbeeldingsgegevens – die eerder door het backend-script naar de NAS zijn gekopieerd – in Lightroom Classic te importeren. ' +
                'Naast het backend-script dat de RAW-bestanden kopieert, omvat de applicatie ook een client-side AppleScript-handler voor de communicatie tussen de webapplicatie ' +
                'en Lightroom Classic, evenals een Docker-container gebaseerd op een minimale node.js image (node:20-alpine). Geen gedoe meer met ingewikkelde handmatige kopieertaken! ' +
                'Met deze webapplicatie behoudt je de controle over je RAW-importen. 👍🏼',

            hintBox:
                '📁 <strong>Source:</strong> Beschikbare opnamedagen in het RAW-archief na import op de NAS.<br>' +
                '🔄 <strong>Status:</strong> Beheert de importstatus en vergrendeling (🔒) van voltooide dagen, om ongewenste wijzigingen of herhaalde importen van reeds verwijderde scheuten te voorkomen (bijv. meerdere importen per dag).<br>' +
                '💡 <strong>Werkstroom:</strong> Klik op <strong>"Openen in Lightroom"</strong> → ' +
                'Lightroom opent het importdialoogvenster met deze map als bron. ' +
                'Klik in het dialoogvenster op <strong>"Toevoegen"</strong> (je hoeft niets te verplaatsen of te kopiëren).<br>' +
                '⚠️ <strong>Opmerking:</strong> Werkt alleen als de eenmalige <code>photoimport://</code> handler ' +
                'is ingesteld op de Mac (zie <a href="/readme" target="_blank">README</a>).',

            offlineBanner: '⛔️ NAS niet bereikbaar – gegevens worden niet bijgewerkt.',

            filterAll: 'Alle',
            filterPending: 'In behandeling',
            filterImported: 'Geïmporteerd',

            loading: 'Laden…',
            ingestLogTitle: 'Inname log',
            ingestLogMetaPlaceholder: '–',

            readmeNotFound: 'README niet gevonden'
        },
        client: {
            emptyStateEmoji: '📸 🤷🏼‍♂️',
            emptyStateText: 'Nog geen gegevens toegevoegd — plaats de geheugenkaart in de NAS om een nieuwe import te starten, of ga naar buiten en maak wat foto\'s. 📸 😉',

            ageJustNow: 'Zojuist',
            ageHoursSuffix: 'h',
            ageDaysSuffix: 'd',

            badgeImported: '✓ geïmporteerd',
            badgeRawSuffix: ' RAW',

            btnOpenInLightroom: 'Openen in Lightroom',
            btnMarkAsImported: 'Markeer als geïmporteerd',
            btnImportedDone: '✓ Klaar',
            lockClosedLabel: '🔒 Vergrendeld',
            lockOpenLabel: '🔓 Ontgrendeld',

            toastSealError: 'Fout bij het wisselen van vergrendeling: ',
            toastSealedOn: 'Map vergrendeld 🔒',
            toastSealedOff: 'Map ontgrendeld 🔓',

            logNoFile: 'Nog geen logbestand – is het importscript ooit uitgevoerd?',
            logEmpty: 'Het logboek is leeg.',
            logUpdatedPrefix: 'bijgewerkt ',
            logMetaPlaceholder: '–',

            dateLocale: 'nl'
        }
    }
};

const DEFAULT_LOCALE = 'en';

function getLocale(code) {
    return LOCALES[code] || LOCALES[DEFAULT_LOCALE];
}

module.exports = { LOCALES, DEFAULT_LOCALE, getLocale };
