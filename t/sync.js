'use strict';
// Copy of the data on the Pi (pi/taktd.py). Reachable only from the home network:
// at the gym the app keeps working offline and catches up once you're home.
// The newer copy wins; when both sides changed, you choose. The Pi keeps one copy per day.

const SYNC_KEY = 'takt.key', SYNC_STATE = 'takt.sync';
const sync = { status: 'aus', last: 0, dirty: false, conflict: null, timer: 0, busy: false };
try { Object.assign(sync, JSON.parse(localStorage.getItem(SYNC_STATE) || '{}'), { busy: false, conflict: null, timer: 0 }); } catch (e) { /* private mode */ }

const piKey = () => { try { return localStorage.getItem(SYNC_KEY) || ''; } catch (e) { return ''; } };
function setPiKey(k) { try { localStorage.setItem(SYNC_KEY, k.trim()); } catch (e) { /* ignore */ } }
function syncSave() { try { localStorage.setItem(SYNC_STATE, JSON.stringify({ last: sync.last, dirty: sync.dirty, status: sync.status })); } catch (e) { /* ignore */ } }

function markDirty() {
  sync.dirty = true; syncSave();
  if (!piKey()) return;
  clearTimeout(sync.timer); sync.timer = setTimeout(push, 2000);
}

async function api(method, body, force) {
  const r = await fetch('/takt/api/data' + (force ? '?force=1' : ''), {
    method, cache: 'no-store',
    headers: { 'X-Takt-Key': piKey(), 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  let j = null;
  try { j = await r.json(); } catch (e) { /* 403 from Caddy has no JSON */ }
  return { code: r.status, j };
}

function setStatus(s) {
  sync.status = s; syncSave();
  const el = document.getElementById('syncstatus');
  if (el) el.innerHTML = syncText();
  const box = document.getElementById('syncconflict');
  if (box) box.outerHTML = conflictBox();
}

function syncText() {
  if (!piKey()) return 'aus, kein Schlüssel';
  const when = sync.last ? new Date(sync.last) : null;
  const at = when ? `${short(iso(when))} ${pad2(when.getHours())}:${pad2(when.getMinutes())}` : 'noch nie';
  return {
    ok: `<span class="ok">● synchron</span> · ${at}`,
    weg: `<span class="warn">● Pi nicht erreichbar</span> (nur im Heimnetz) · zuletzt ${at}${sync.dirty ? ' · Änderungen warten' : ''}`,
    schluessel: '<span class="warn">Schlüssel falsch</span>',
    konflikt: '<span class="warn">Handy und Pi wurden beide geändert</span>',
  }[sync.status] || `zuletzt ${at}`;
}

function conflictBox() {
  if (!sync.conflict) return '<div id="syncconflict"></div>';
  const c = sync.conflict, n = (c.data.sessions || []).filter(s => s.done).length;
  const when = new Date(c.savedAt);
  return `<div id="syncconflict" class="card ask"><p class="eyebrow">Sync</p><h3>Pi hat andere Daten</h3>
    <p class="small muted">Pi: ${n} Einheiten, Stand ${short(iso(when))} ${pad2(when.getHours())}:${pad2(when.getMinutes())}. Handy: ${db.sessions.filter(s => s.done).length} Einheiten. Die andere Seite wird ersetzt; der Pi behält eine Tageskopie.</p>
    <div class="two"><button class="btn" data-act="sync-pi">Pi übernehmen</button><button class="btn" data-act="sync-phone">Handy behalten</button></div></div>`;
}

async function push(force) {
  if (!piKey() || sync.busy) return;
  sync.busy = true;
  try {
    const { code, j } = await api('PUT', { savedAt: db.savedAt || Date.now(), data: db }, force);
    if (code === 200) { sync.dirty = false; sync.conflict = null; sync.last = Date.now(); setStatus('ok'); }
    else if (code === 409) { sync.conflict = j; setStatus('konflikt'); }
    else if (code === 401) setStatus('schluessel');
    else setStatus('weg');
  } catch (e) { setStatus('weg'); }
  finally { sync.busy = false; }
}

async function pull() {
  if (!piKey() || sync.busy) return;
  sync.busy = true;
  let next = null;
  try {
    const { code, j } = await api('GET');
    if (code === 404 && j && j.error === 'empty') next = 'push';
    else if (code === 401) setStatus('schluessel');
    else if (code !== 200 || !j) setStatus('weg');
    // never synced from this phone and both sides hold data: ask instead of overwriting either
    else if (!sync.last && hasLog(db) && hasLog(j.data) && j.savedAt !== db.savedAt) { sync.conflict = j; setStatus('konflikt'); }
    else if (j.savedAt > (db.savedAt || 0)) {
      if (sync.dirty) { sync.conflict = j; setStatus('konflikt'); }
      else { takePi(j); }
    } else if (j.savedAt < (db.savedAt || 0) || sync.dirty) next = 'push';
    else { sync.last = Date.now(); setStatus('ok'); }
  } catch (e) { setStatus('weg'); }
  finally { sync.busy = false; }
  if (next) push();
}

const hasLog = d => (d.sessions || []).length > 0 || Object.keys(d.machines || {}).length > 0;

function takePi(doc) {
  db = fix(Object.assign(EMPTY(), doc.data));
  store();
  sync.dirty = false; sync.conflict = null; sync.last = Date.now();
  setStatus('ok');
  // don't pull the page away under the fingers in the middle of a session
  if (!/^#\/s\//.test(location.hash)) keepScroll(route);
}

function syncTick() {
  if (document.visibilityState !== 'visible') return;
  sync.dirty ? push() : pull();
}
document.addEventListener('visibilitychange', syncTick);
window.addEventListener('online', syncTick);
setInterval(syncTick, 5 * 60 * 1000);
