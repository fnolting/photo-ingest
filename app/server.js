'use strict';
// photo-ingest — Web UI for Importing Photos to the NAS
//
// Displays all daily folders in IMPORT_BASE as cards.
// The following actions are available for each day/card:
//
// - "Open in Lightroom":
// Opens the Lightroom import dialog on a Mac using a custom URL
// scheme (photoimport://) with the corresponding folder as the source.

// In the Lightroom dialog, select "Add" (no copy/move,
// the files remain in their original location on the NAS).
//
// - "Mark as Imported":
// Sets a purely UI-based status (saved in a JSON file)
// to visually indicate days that have already been processed.
// This status has no effect on Lightroom itself.
//
// - "🔓 Open" / "🔒 Locked":
// Controls the "sealed" status for a given day.
// The status is stored server-side in a separate status file
// (not in the RAW directory to support read-only mounts).
//
//🔓 Open:
// → The folder can still be modified by the ingest script
// (e.g., adding new files after an import has already been completed).
//
//🔒 Locked:
// → The folder is considered sealed (e.g., after Lightroom culling)
// and is ignored by further automatic import/sync processes.
//
// The separation of RAW data (read-only) and status information (read-write)
// protects the original data from unintentional changes and simultaneously enables
// flexible control of the import workflow.
//
// Note:
// The web UI is used exclusively for controlling and visualizing the workflow,
// as well as for automated transfer to and import into Adobe Lightroom Classic.
// The actual data import is performed by a separate ingest script.


const http = require('http');
const fs   = require('fs');
const path = require('path');
const { getLocale } = require('./i18n');

const STATUS_BASE = process.env.STATUS_BASE
const IMPORT_BASE = process.env.IMPORT_BASE
const MAC_VOLUME  = process.env.MAC_VOLUME
const STATE_FILE  = process.env.STATE_FILE
const LOG_FILE    = process.env.LOG_FILE
const PORT        = parseInt(process.env.PORT);
const UI_LOCALE   = process.env.UI_LOCALE
const i18n        = getLocale(UI_LOCALE);

// ── Status-File Helpers (.ingest_status, from photo-ingest.sh Script) ──────

function readIngestStatus(folder) {
    const p = getStatusFile(folder);
    const r = { date: null, camera: null, files: 0, ingested_at: null, sealed: 'false' };
    if (!fs.existsSync(p)) return r;
    for (const line of fs.readFileSync(p, 'utf8').split('\n')) {
        const [k, v] = line.split('=');
        if (k && v !== undefined) r[k.trim()] = v.trim();
    }
    r.files = parseInt(r.files) || 0;
    r.sealed = r.sealed === 'true';
    return r;
}

// ── "Imported" markings (UI only, set manually by user) ────

function readMarked() {
    if (!fs.existsSync(STATE_FILE)) return {};
    try { return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); }
    catch { return {}; }
}

function writeMarked(state) {
    fs.mkdirSync(path.dirname(STATE_FILE), { recursive: true });
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
}

// ── Folder list ──────────────────────────────────────────────────────────

function getFolders() {
    if (!fs.existsSync(IMPORT_BASE)) return [];
    const marked = readMarked();
    return fs.readdirSync(IMPORT_BASE)
        .filter(f => /^\d{4}-\d{2}-\d{2}/.test(f) && fs.statSync(path.join(IMPORT_BASE, f)).isDirectory())
        .sort().reverse()
        .map(folder => {
            const s = readIngestStatus(folder);
            const arwCount = s.files || fs.readdirSync(path.join(IMPORT_BASE, folder))
                .filter(f => f.toLowerCase().endsWith('.arw')).length;
            const dateMatch = folder.match(/^(\d{4}-\d{2}-\d{2})/);
            return {
                folder,
                date:        s.date   || (dateMatch ? dateMatch[1] : folder),
                camera:      s.camera || 'Unknown',
                files:       arwCount,
                ingested_at: s.ingested_at || null,
                imported:    !!marked[folder],
                sealed:      s.sealed,
                // URL-Scheme for the client-side PhotoImportHandler
                importUrl: `photoimport://${encodeURIComponent(folder)}`
            };
        });
}

function getStatusFile(folder) {
    return path.join(STATUS_BASE, folder + '.ingest_status');
}

// ── Ingest-Log Helper ──────────────────────────────────────────────────

function readLogTail(maxLines = 200) {
    if (!fs.existsSync(LOG_FILE)) return { exists: false, lines: [] };
    try {
        const stat = fs.statSync(LOG_FILE);
        const chunkSize = 64 * 1024;
        const start = Math.max(0, stat.size - chunkSize);
        const fd = fs.openSync(LOG_FILE, 'r');
        const buf = Buffer.alloc(stat.size - start);
        fs.readSync(fd, buf, 0, buf.length, start);
        fs.closeSync(fd);
        const text = buf.toString('utf8');
        const allLines = text.split('\n').filter(l => l.length > 0);
        return { exists: true, lines: allLines.slice(-maxLines) };
    } catch (e) {
        return { exists: true, lines: [], error: e.message };
    }
}

// ── HTTP Server ─────────────────────────────────────────────────────────


function respond(res, status, body, type = 'application/json') {
    res.writeHead(status, {
        'Content-Type': type,
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
    });
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
}

const server = http.createServer((req, res) => {
    const url = new URL(req.url, `http://localhost`);

    // GET /api/folders
    if (url.pathname === '/api/folders' && req.method === 'GET') {
        return respond(res, 200, getFolders());
    }

    // POST /api/mark  { folder, imported: true|false }
    if (url.pathname === '/api/mark' && req.method === 'POST') {
        let body = '';
        req.on('data', d => body += d);
        req.on('end', () => {
            try {
                const { folder, imported } = JSON.parse(body);
                if (!folder) return respond(res, 400, { error: 'folder required' });
                const marked = readMarked();
                if (imported) marked[folder] = new Date().toISOString();
                else delete marked[folder];
                writeMarked(marked);
                respond(res, 200, { ok: true });
            } catch { respond(res, 400, { error: 'invalid JSON' }); }
        });
        return;
    }

// POST /api/seal
if (url.pathname === '/api/seal' && req.method === 'POST') {
    let body = '';
    req.on('data', d => body += d);
    req.on('end', () => {
        try {
            const parsed = JSON.parse(body || '{}');
            const folder = parsed.folder;
            const sealed = parsed.sealed;

            if (!folder) {
                return respond(res, 400, { error: 'folder required' });
            }

            const folderPath = path.join(IMPORT_BASE, folder);
            if (!fs.existsSync(folderPath) || !fs.statSync(folderPath).isDirectory()) {
                return respond(res, 404, { error: 'folder not found' });
            }
           
            const statusFile = getStatusFile(folder);

            // make sure the folder exists
            fs.mkdirSync(STATUS_BASE, { recursive: true });

            let lines = [];
            if (fs.existsSync(statusFile)) {
                lines = fs.readFileSync(statusFile, 'utf8')
                    .split('\n')
                    .map(l => l.trim())
                    .filter(l => l !== '' && !l.startsWith('sealed='));
            }

            lines.push(`sealed=${sealed ? 'true' : 'false'}`);

            fs.writeFileSync(statusFile, lines.join('\n') + '\n', 'utf8');

            return respond(res, 200, {
                ok: true,
                folder,
                sealed: !!sealed
            });
        } catch (err) {
            return respond(res, 500, {
                error: err && err.message ? err.message : String(err)
            });
        }
    });
    return;
}

    // GET /api/log
    if (url.pathname === '/api/log' && req.method === 'GET') {
        const maxLines = Math.min(parseInt(url.searchParams.get('lines') || '200'), 1000);
        const tail = readLogTail(maxLines);
        let mtime = null;
        try { mtime = fs.statSync(LOG_FILE).mtime.toISOString(); } catch {}
        return respond(res, 200, { ...tail, log_file: LOG_FILE, mtime });
    }

    // GET /api/status  (health check)
    if (url.pathname === '/api/status' && req.method === 'GET') {
        return respond(res, 200, {
            ok: true,
            import_base: IMPORT_BASE,
            mac_volume: MAC_VOLUME,
            folders: getFolders().length
        });
    }

    // GET /readme
    if (url.pathname === '/readme' && req.method === 'GET') {
        const readmePath = '/app/README.md';

        if (!fs.existsSync(readmePath)) {
            return respond(res, 404, i18n.server.readmeNotFound, 'text/plain');
        }

        const content = fs.readFileSync(readmePath, 'utf8');

        res.writeHead(200, {
            'Content-Type': 'text/plain; charset=utf-8'
        });
        res.end(content);
        return;
    }

    // GET /  → Web-UI
    if (url.pathname === '/' && req.method === 'GET') {
        return respond(res, 200, getUI(), 'text/html; charset=utf-8');
    }

    respond(res, 404, { error: 'not found' });
});

server.listen(PORT, () => {
    console.log(`Photo Ingest running on :${PORT}`);
    console.log(`IMPORT_BASE : ${IMPORT_BASE}`);
    console.log(`MAC_VOLUME  : ${MAC_VOLUME}`);
});

// ── Web-UI ───────────────────────────────────────────────────────────────

function getUI() {
    const s = i18n.server;
    const c = i18n.client;
    return `<!DOCTYPE html>
<html lang="${s.htmlLang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${s.pageTitle}</title>
<style>
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
         background: #f5f5f0; color: #1a1a1a; padding: 2rem; max-width: 1400px; margin: 0 auto; }
  h1   { font-size: 1.2rem; font-weight: 500; margin-bottom: .5rem; color: #555; }
  .subtitle { font-size: .9rem; color: #666; margin-bottom: .6rem; }
  .filter { position: sticky; top: 0; z-index: 20; background: #f5f5f0; padding: .75rem; }
  .filter button { background: white; border: 1px solid #e0e0da; border-radius: 6px;
                   padding: 5px 14px; font-size: 0.82rem; cursor: pointer; }
  .filter button.active { border-color: #1a6fb5; color: #1a6fb5; background: #f0f7ff; }
  .list { display: flex; flex-direction: column; gap: 6px; }
  .card { background: white; border: 1px solid #e5e5e0; border-radius: 10px;
          padding: .75rem 1.2rem; display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap; }
  .card.done { opacity: .55; }
  .left { display: flex; flex-direction: column; gap: 4px; min-width: 160px; }
  .date  { font-size: .95rem; font-weight: 500; }
  .meta  { font-size: .78rem; color: #999; display: flex; gap: 8px; align-items: center; }
  .badge { font-size: .7rem; padding: 2px 7px; border-radius: 4px;
           background: #e8f0fe; color: #1a56db; }
  .badge.ok { background: #e8f5e9; color: #2e7d32; }
  .badge.newest { background: #dff5e1; color: #0b6b1d; border: 1px solid #8fd39a; font-weight: 700; }
  .cmd-box { display: flex; align-items: center; gap: 8px; flex: 1; min-width: 280px; }
  .btn { background: #1a6fb5; color: white; border: none; border-radius: 8px;
          padding: 8px 16px; font-size: .82rem; cursor: pointer; white-space: nowrap; }
  .btn:hover { background: #155a96; }
  .btn.secondary { background: white; color: #666; border: 1px solid #e0e0da; }
  .btn.secondary:hover { background: #f5f5f0; }
  .btn.done-btn { background: #e8f5e9; color: #2e7d32; border: 1px solid #c8e6c9; }
  .btn.lock-btn { display: flex; align-items: center; gap: 4px; }
  .btn.lock-open { background: white; color: #666; border: 1px solid #e0e0da; }
  .btn.lock-open:hover { background: #f5f5f0; }
  .btn.lock-closed { background: #ffeaea; color: #b71c1c; border: 1px solid #e57373; }
  .btn.lock-closed:hover { background: #ffcdd2; }
  .toast { position: fixed; bottom: 2rem; right: 2rem; background: #222; color: #fff;
           padding: 11px 18px; border-radius: 8px; font-size: .83rem;
           opacity: 0; transition: opacity .3s; pointer-events: none; }
  .toast.show { opacity: 1; }
  .emoji { text-align: center; padding: 3rem; padding-bottom: 0rem; font-size: 5rem; }
  .empty { text-align: center; color: #bbb; padding: 3rem; font-size: .9rem; }
  .hint { font-size: .78rem; color: #888; margin-bottom: 1.5rem;
          background: #fffbe6; border: 1px solid #ffe082; border-radius: 6px;
          padding: 10px 12px; line-height: 1.5; }
  .hint code { background: rgba(0,0,0,.05); padding: 1px 5px; border-radius: 4px; }
  .info { font-size: .78rem; color: #888; margin-bottom: 1rem;
          background: #e6edff; border: 1px solid #82adff; border-radius: 6px;
          padding: 10px 12px; line-height: 1.5; }

  .layout { display: grid; grid-template-columns: 1fr; gap: 1.5rem; }
  @media (min-width: 1100px) {
    .layout { grid-template-columns: minmax(600px,1fr) 700px; align-items: start; }
  }

  .log-panel { background: #1e1e1e; color: #d4d4d4; border-radius: 10px;
               border: 1px solid #333; overflow: hidden; display: flex;
               flex-direction: column; height: 480px; }
  .log-header { display: flex; align-items: center; justify-content: space-between;
                padding: .7rem 1rem; border-bottom: 1px solid #333;
                font-size: .8rem; color: #aaa; }
  .log-header .title { display: flex; align-items: center; gap: 8px; font-weight: 500; color: #ddd; }
  .ingest-dot { width: 8px; height: 8px; border-radius: 50%; background: #555;
                display: inline-block; transition: background .3s; }
  .ingest-dot.active { background: #4caf50; box-shadow: 0 0 6px #4caf50;
                        animation: pulse 1.2s infinite; }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: .35; } }
  .log-body { flex: 1; overflow-y: auto; padding: .7rem 1rem; font-family: 'SF Mono', Menlo, monospace;
              font-size: .64rem; line-height: 1.35; white-space: pre-wrap; word-break: break-all; }
  .log-body .empty { color: #777; text-align: left; padding: 0; }
  .log-line.log-start { color: #4caf50; }
  .log-line.log-end   { color: #4caf50; }
  .log-line.log-skip  { color: #777; }
  .log-line.log-date  { color: #64b5f6; }

  .offline-banner { display: none; align-items: center; gap: 8px; background: #ffeaea;
                    border: 1px solid #e57373; color: #b71c1c; border-radius: 8px;
                    padding: 10px 14px; font-size: .85rem; margin-bottom: 1.25rem; }
  .offline-banner.show { display: flex; }
</style>
</head>
<body>
<h1>${s.heading}</h1>
<div class="subtitle">${s.subtitle}</div>
<div class="info">
${s.infoBox}
</div>
<div class="hint">
  ${s.hintBox}
</div>
<div class="offline-banner" id="offline-banner">
  ${s.offlineBanner}
</div>
<div class="filter">
  <button onclick="setFilter('all',this)">${s.filterAll}</button>
  <button class="active" onclick="setFilter('pending',this)">${s.filterPending}</button>
  <button onclick="setFilter('imported',this)">${s.filterImported}</button>
</div>
<div class="layout">
  <div class="list" id="list"><div class="empty">${s.loading}</div></div>
  <div class="log-panel">
    <div class="log-header">
      <div class="title"><span class="ingest-dot" id="ingest-dot"></span> ${s.ingestLogTitle}</div>
      <span id="log-meta">${s.ingestLogMetaPlaceholder}</span>
    </div>
    <div class="log-body" id="log-body"><div class="empty">${s.loading}</div></div>
  </div>
</div>
<div class="toast" id="toast"></div>
<script>
window.I18N = ${JSON.stringify(c)};
</script>
<script>
let folders = [], filter = 'pending';

async function load() {
  try {
    const r = await fetch('/api/folders?ts=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    folders = await r.json();
    setOffline(false);
    render();
  } catch (e) {
    setOffline(true);
  }
}

function setOffline(isOffline) {
  document.getElementById('offline-banner').classList.toggle('show', isOffline);
}

function setFilter(f, el) {
  filter = f;
  document.querySelectorAll('.filter button').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  render();
}

function render() {
  const list = document.getElementById('list');
  let vis = folders;

  if (filter === 'pending')  vis = folders.filter(f => !f.imported);
  if (filter === 'imported') vis = folders.filter(f =>  f.imported);

  if (!vis.length) {
    list.innerHTML = '<div class="emoji">' + I18N.emptyStateEmoji + '</div><br><div class="empty">' + I18N.emptyStateText + '</div>';
    return;
  }

  list.innerHTML = vis.map(function(f) {

    var ageBadgeHtml = '';
    
    if (f.ingested_at) {
      var ageMs = Date.now() - new Date(f.ingested_at).getTime();
      var ageHours = Math.floor(ageMs / 3600000);
    
      if (ageHours < 336) {
        var label;
        if (ageHours < 1) { label = I18N.ageJustNow; }
          else if (ageHours < 24) { label = ageHours + I18N.ageHoursSuffix; }
          else { label = Math.floor(ageHours / 24) + I18N.ageDaysSuffix; }

        ageBadgeHtml =
          '<span class="badge newest">' +
          label +
          '</span>';
      }
    }

    var cameraHtml = (f.camera && f.camera !== 'Unknown')
      ? '<span>' + f.camera + '</span>'
      : '';

    var dateInfoHtml = f.ingested_at
      ? '<div class="meta" style="font-size:.7rem">' +
          new Date(f.ingested_at).toLocaleString(I18N.dateLocale) +
        '</div>'
      : '';

var lockHtml = '';
if (f.imported) {
  var lockClass = f.sealed ? 'lock-closed' : 'lock-open';
  var lockText  = f.sealed ? I18N.lockClosedLabel : I18N.lockOpenLabel;

  lockHtml =
    '<button class="btn lock-btn ' + lockClass + '" ' +
    'onclick="toggleSealed(\\'' + f.folder + '\\')">' +
    lockText +
    '</button>';
}

    return '' +
      '<div class="card ' + (f.imported ? 'done' : '') + '">' +

        '<div class="left">' +
          '<div class="date">' + f.date + '</div>' +
          '<div class="meta">' +
            cameraHtml +
            '<span class="badge ' + (f.imported ? 'ok' : '') + '">' +
              (f.imported ? I18N.badgeImported : f.files + I18N.badgeRawSuffix) +
            '</span>' +
            ageBadgeHtml +
          '</div>' +
          dateInfoHtml +
        '</div>' +

        '<div class="cmd-box">' +
          '<a class="btn" href="' + f.importUrl + '">' + I18N.btnOpenInLightroom + '</a>' +

          '<button class="btn ' + (f.imported ? 'done-btn' : 'secondary') + '" ' +
            'onclick="toggleImported(\\'' + f.folder + '\\',' + (!f.imported) + ')">' +
            (f.imported ? I18N.btnImportedDone : I18N.btnMarkAsImported) +
          '</button>' +

          lockHtml +
        '</div>' +

      '</div>';

  }).join('');
}

async function toggleImported(folder, imported) {
  await fetch('/api/mark', {
    method: 'POST',
    headers: {'Content-Type':'application/json'},
    body: JSON.stringify({ folder, imported })
  });
  await load();
}

async function toggleSealed(folder) {
  const entry = folders.find(f => f.folder === folder);
  const currentState = entry ? entry.sealed === true : false;
  const newState = !currentState;

  const r = await fetch('/api/seal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder, sealed: newState })
  });

  let payload = {};
  try {
    payload = await r.json();
  } catch (_) {}

  if (!r.ok) {
    toast(I18N.toastSealError + (payload.error || ('HTTP ' + r.status)));
    return;
  }

  toast(newState ? I18N.toastSealedOn : I18N.toastSealedOff);
  await load();
}

function toast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Ingest-Log ──────────────────────────────────────────────────────────

let lastLogLineCount = 0;
let lastLogChangeAt = 0;
let lastWasActive = false;
let logTimer = null;
const LOG_FAST_INTERVAL = 500;   // while Ingest is running
const LOG_SLOW_INTERVAL = 5000;  // in standby

function classifyLine(line) {
  if (line.includes('START ingest')) return 'log-start';
  if (line.includes('END ingest'))   return 'log-end';
  if (line.includes('Skip'))         return 'log-skip';
  if (line.includes('Date '))        return 'log-date';
  return '';
}

function escapeHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

async function loadLog() {
  const body = document.getElementById('log-body');
  const meta = document.getElementById('log-meta');
  const dot  = document.getElementById('ingest-dot');

  let nextDelay = LOG_SLOW_INTERVAL;

  try {
    const r = await fetch('/api/log?lines=200&ts=' + Date.now(), { cache: 'no-store' });
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const data = await r.json();
    setOffline(false);

    if (!data.exists) {
      body.innerHTML = '<div class="empty">' + I18N.logNoFile + '</div>';
      meta.textContent = I18N.logMetaPlaceholder;
      dot.classList.remove('active');
      scheduleLoadLog(nextDelay);
      return;
    }

    const lines = data.lines || [];

    if (lines.length !== lastLogLineCount) {
      lastLogChangeAt = Date.now();
      lastLogLineCount = lines.length;
    }

    const recentChange = (Date.now() - lastLogChangeAt) < 20000;
    const tailJoined = lines.slice(-3).join('\\n');
    const looksRunning = tailJoined.includes('START ingest') && !tailJoined.includes('END ingest');
    const active = recentChange && (looksRunning || tailJoined.includes('START ingest'));
    dot.classList.toggle('active', active && recentChange);

    // Fast polling during a running ingest, relaxed polling in standby
    nextDelay = active ? LOG_FAST_INTERVAL : LOG_SLOW_INTERVAL;

    const wasAtBottom = body.scrollTop + body.clientHeight >= body.scrollHeight - 20;

    body.innerHTML = lines.length
      ? lines.map(l => '<div class="log-line ' + classifyLine(l) + '">' + escapeHtml(l) + '</div>').join('')
      : '<div class="empty">' + I18N.logEmpty + '</div>';

    if (data.mtime) {
      const d = new Date(data.mtime);
      meta.textContent = I18N.logUpdatedPrefix + d.toLocaleTimeString(I18N.dateLocale);
    }

    if (wasAtBottom) body.scrollTop = body.scrollHeight;

    // If the ingest has just finished quickly poll one more time to 
    // complete the final "END ingest" and collect new cards asap.
    if (!active && lastWasActive) {
      load();
      nextDelay = LOG_FAST_INTERVAL;
      setTimeout(() => { lastWasActive = false; }, LOG_FAST_INTERVAL);
    }
    lastWasActive = active;

    // While active: Refresh card list more frequently
    // to see new/updated days asap
    if (active) load();
  } catch (e) {
    setOffline(true);
  }

  scheduleLoadLog(nextDelay);
}

function scheduleLoadLog(delay) {
  clearTimeout(logTimer);
  logTimer = setTimeout(loadLog, delay);
}

load();
loadLog();
setInterval(load, 30000);
</script>
</body>
</html>`; }
