'use strict';
// takt: gym and food plan as an app. Plan data, storage and rules; ui.js draws it.
// The app suggests, you decide: nothing gets raised or lowered without you typing it.

// ---------- plan (the app is the only source since 2026-11-07) ----------

const MACHINES = {
  beinpresse:   { name: 'Beinpresse', short: 'Beinpresse', fields: ['Sitz', 'Füße', 'max. Tiefe'] },
  brustpresse:  { name: 'Brustpresse', short: 'Brustpresse', fields: ['Sitz'] },
  brustschraeg: { name: 'Brustpresse, schräg', short: 'Brustpresse schräg', fields: ['Sitz'] },
  rudern:       { name: 'Rudermaschine, brustgestützt', short: 'Rudern', fields: ['Sitz', 'Brustpolster'] },
  latzug:       { name: 'Latzugmaschine', short: 'Latzug', fields: ['Kniepolster'] },
  beinbeuger:   { name: 'Beinbeuger', short: 'Beinbeuger', fields: ['Polster'] },
  seitheben:    { name: 'Seitheben-Maschine', short: 'Seitheben', fields: ['Sitz'] },
  butterfly:    { name: 'Reverse-Butterfly-Maschine', short: 'Reverse Butterfly', fields: ['Sitz', 'Griff'] },
  ruecken:      { name: 'Rückenstrecker', short: 'Rückenstrecker', fields: ['Polster', 'Umfang'] },
  bizeps:       { name: 'Bizepsmaschine', short: 'Bizeps', fields: ['Sitz'] },
  trizeps:      { name: 'Trizepsmaschine', short: 'Trizeps', fields: ['Sitz'] },
  abduktoren:   { name: 'Abduktorenmaschine', short: 'Abduktoren', fields: ['Start'] },
  waden:        { name: 'Wadenmaschine', short: 'Waden', fields: ['Einstellung'] },
};
const MACHINE_ORDER = ['beinpresse', 'brustpresse', 'brustschraeg', 'rudern', 'latzug', 'beinbeuger',
  'seitheben', 'butterfly', 'ruecken', 'bizeps', 'trizeps', 'abduktoren', 'waden'];

// [id, sets, lo, hi, pause s, warm-up group]
const PLAN = {
  A: [
    ['beinpresse', 3, 8, 12, 120, 'Bein'],
    ['brustpresse', 3, 8, 12, 120, 'Druck'],
    ['rudern', 3, 8, 12, 120, 'Zug'],
    ['beinbeuger', 2, 10, 15, 90],
    ['seitheben', 2, 12, 15, 60],
    ['bizeps', 2, 10, 15, 60],
    ['trizeps', 1, 10, 15, 60],
    ['ruecken', 1, 15, 15, 90],
  ],
  B: [
    ['latzug', 3, 8, 12, 120, 'Zug'],
    ['beinpresse', 2, 10, 15, 120, 'Bein'],
    ['brustschraeg', 2, 8, 12, 90, 'Druck'],
    ['beinbeuger', 2, 10, 15, 90],
    ['butterfly', 2, 12, 15, 60],
    ['abduktoren', 2, 12, 20, 60],
    ['trizeps', 2, 10, 15, 60],
    ['bizeps', 1, 10, 15, 60],
    ['waden', 2, 12, 15, 60],
    ['ruecken', 1, 15, 15, 90],
  ],
};

const PHASES = [
  { to: 2, sets: '2 pro Übung', reserve: '3–4 Wdh.' },
  { to: 4, sets: 'laut Tabelle', reserve: '2–3 Wdh.' },
  { to: 8, sets: 'laut Tabelle', reserve: 'kleine Maschinen 1–2 Wdh., Beinpresse und Rückenstrecker 2–3 Wdh.' },
  { to: 9, sets: 'halbe Satzzahl, aufgerundet, gleiches Gewicht', reserve: '' },
];
const WEEK_NOTES = {
  1: '2 Sätze, Gewichte suchen, Einstellungen notieren', 2: '2 Sätze', 3: 'volle Sätze', 4: 'volle Sätze',
  5: 'Rückenstrecker 2 Sätze, wenn beschwerdefrei', 6: '', 7: '', 8: '',
  9: 'leicht: halbe Sätze (aufgerundet), gleiches Gewicht',
};
// Holiday moves from the calendar: Fr 25.12. -> Sa 26.12., Fr 01.01. -> Sa 02.01.
const MOVES = { '12-25': '12-26', '01-01': '01-02' };

const BACK = [
  ['besser', 'besser', 'normal weiter, nicht schneller steigern'],
  ['normal', 'normal', 'normal weiter'],
  ['schlechter', 'schlechter (klingt im Lauf des Tages ab)', 'beobachten'],
  ['deutlich', 'deutlich schlechter (klingt nicht von selbst ab)', 'nächste Einheit bei Beinpresse und Rückenstrecker Gewicht oder Sätze zurücknehmen'],
];
const BACK_SHORT = { besser: 'besser', normal: 'normal', schlechter: 'schlechter', deutlich: 'deutlich schlechter' };
const ABBRUCH = '<div class="alert danger"><b>Abbrechen und abklären</b><p>Neue, ins Bein ausstrahlende Schmerzen, Taubheit oder Schwäche.</p></div>';

// ---------- storage ----------

const KEY = 'takt.v1', OLD_KEY = 'gym.v1';
// training: off = nutrition only (Tizian 2026-11-07: Ernährung zuerst, Training eventuell danach)
const EMPTY = () => ({ v: 1, start: '2026-11-09', foodMon: '', haupt: [], nach: {}, fv: 0, training: false, sessions: [], machines: {}, shop: {}, lastBackup: null, savedAt: 0 });
let db = load();

function load() {
  try {
    const raw = localStorage.getItem(KEY) || localStorage.getItem(OLD_KEY);  // the app was called gym until 2026-11-03
    if (raw) return fix(Object.assign(EMPTY(), JSON.parse(raw)));
  } catch (e) { console.error(e); }
  return fix(EMPTY());
}
// The food plan hangs on its shopping days (see food.js): foodMon = start day, haupt = Hauptkauf anchors, nach = moved Nachkäufe.
// No date helpers here: they are declared further down and load() runs before them.
function fix(d) {
  if (!d.foodMon) d.foodMon = '2026-11-10';
  if (!d.fv) { d.fv = 2; if (d.foodMon === '2026-11-09') d.foodMon = '2026-11-10'; }  // Tizian 2026-11-10: first shop a day later
  delete d.foodStart;
  if (!d.nach || typeof d.nach !== 'object') d.nach = {};
  if (!Array.isArray(d.haupt)) d.haupt = [];
  d.haupt = d.haupt.filter(h => h >= d.foodMon);
  if (!d.haupt.length) {  // default rhythm: Hauptkauf on the first Friday 2 to 6 days after the start
    const [y, m, dd] = d.foodMon.split('-').map(Number), x = new Date(y, m - 1, dd + 2);
    while (x.getDay() !== 5) x.setDate(x.getDate() + 1);
    if (new Date(y, m - 1, dd + 6) < x) x.setTime(new Date(y, m - 1, dd).getTime());  // a week away: the start is the Hauptkauf
    d.haupt = [`${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`];
  }
  return d;
}
const trainingOn = () => !!db.training;
// Switching training on with nothing logged yet: week 1 starts next Monday (changeable under Daten und Pi).
function setTraining(on) {
  db.training = on;
  if (on && !db.sessions.some(s => s.done) && db.start < today()) {
    let m = addDays(today(), 1);
    while (wd(m) !== 'Mo') m = addDays(m, 1);
    db.start = m;
  }
  save();
}
let saveWarned = false;
function save() { db.savedAt = Date.now(); store(); markDirty(); }
function store() {
  try { localStorage.setItem(KEY, JSON.stringify(db)); }
  catch (e) { if (!saveWarned) { saveWarned = true; alert('Speichern fehlgeschlagen: ' + e.message); } }
}
function askPersist() {
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
}

// ---------- dates ----------

const DAYS = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
const pad2 = n => String(n).padStart(2, '0');
const iso = d => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
const parse = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => iso(new Date());
const addDays = (s, n) => { const d = parse(s); d.setDate(d.getDate() + n); return iso(d); };
const dayNum = s => { const [y, m, d] = s.split('-').map(Number); return Date.UTC(y, m - 1, d) / 864e5; };
const wd = s => DAYS[parse(s).getDay()];
const short = s => `${wd(s)} ${s.slice(8)}.${s.slice(5, 7)}.`;

function weekOf(date) { return Math.floor((dayNum(date) - dayNum(db.start)) / 7) + 1; }

// The scheduled session on a date, or null. Holiday moves shift a Friday to Saturday.
function slotOn(date) {
  const md = date.slice(5);
  const from = Object.keys(MOVES).find(k => MOVES[k] === md);
  if (from) {
    const s = baseSlot(addDays(date, -1));
    if (s) return Object.assign(s, { date, moved: true });
  }
  if (MOVES[md]) return null;
  return baseSlot(date);
}
function baseSlot(date) {
  const w = weekOf(date), day = wd(date);
  if (w < 1 || w > 9 || !['Mo', 'Mi', 'Fr'].includes(day)) return null;
  const odd = w % 2 === 1;
  const type = day === 'Mi' ? (odd ? 'B' : 'A') : (odd ? 'A' : 'B');
  return { date, week: w, day, type };
}
function nextSlot(from) {
  for (let i = 1; i < 30; i++) { const s = slotOn(addDays(from, i)); if (s) return s; }
  return null;
}
function phase(w) { return PHASES.find(p => w <= p.to) || PHASES[2]; }

// ---------- rules ----------

const num = v => { const n = parseFloat(String(v).replace(',', '.')); return Number.isFinite(n) ? n : null; };
const fmt = n => (n === null || n === undefined) ? '' : String(Math.round(n * 100) / 100).replace('.', ',');
const sorted = () => db.sessions.slice().sort((a, b) => a.date === b.date ? a.created - b.created : (a.date < b.date ? -1 : 1));
const before = s => sorted().filter(x => x.id !== s.id && x.done && (x.date < s.date || (x.date === s.date && x.created < s.created)));

function backOkRecently(s) {
  const checks = before(s).filter(x => x.back).slice(-3);
  return checks.every(x => x.back === 'besser' || x.back === 'normal');
}

// Planned exercises for a session: sets and ranges follow the week of the plan.
function planned(s) {
  const w = Math.min(Math.max(s.week, 1), 10);
  return PLAN[s.type].filter(([id]) => id !== 'ruecken' || s.ruecken).map(([id, sets, lo, hi, pause, warm]) => {
    let n = sets, hint = '';
    if (id === 'ruecken') {
      if (w <= 2) { n = 1; hint = 'sehr leicht, nur schmerzfreier Bereich.'; }
      else if (w <= 4) { n = 1; hint = 'in kleinen Stufen steigern.'; }
      else if (w === 9) { n = 1; }
      else {
        lo = 12; hi = 15;
        if (backOkRecently(s)) { n = 2; hint = '2 Sätze nur, wenn vorher beschwerdefrei.'; }
        else { n = 1; hint = 'Rücken war zuletzt nicht beschwerdefrei: Vorschlag 1 Satz statt 2.'; }
      }
      hint += ' Nie aktiv überstrecken, nie bis zum Muskelversagen.';
    } else if (w <= 2) n = Math.min(sets, 2);
    else if (w === 9) n = Math.ceil(sets / 2);
    if (id === 'beinpresse') hint = 'Nur so tief, wie Becken und unterer Rücken fest an der Lehne bleiben. Sitzposition immer gleich.';
    return { id, sets: n, lo, hi, pause, warm, hint };
  });
}

function lastEntry(s, id, sameType) {
  const list = before(s).filter(x => (!sameType || x.type === s.type) && x.entries[id] && num(x.entries[id].w) !== null);
  const x = list[list.length - 1];
  return x ? { s: x, e: x.entries[id] } : null;
}
function prevBack(s) {
  const list = before(s);
  const x = list[list.length - 1];
  return x ? x.back : null;
}

// Returns { text, w } where w is a weight he can take over with one tap.
function suggest(s, p) {
  const any = lastEntry(s, p.id, false);
  const same = lastEntry(s, p.id, true);
  const back = prevBack(s);
  if (!any) return s.week <= 2 ? { text: 'Gewicht für 15 lockere Wiederholungen suchen, Einstellungen eintragen.' } : null;
  if (!same) return { text: `Noch kein ${s.type} mit dieser Übung. Zuletzt in ${any.s.type}: ${fmt(num(any.e.w))} kg.` };
  const w = num(same.e.w), reps = (same.e.reps || []).map(num).filter(r => r !== null);
  const hi = same.e.hi, stufe = num((db.machines[p.id] || {}).stufe);
  if (back === 'deutlich' && (p.id === 'beinpresse' || p.id === 'ruecken'))
    return { text: `Rücken war deutlich schlechter: Gewicht oder Sätze zurücknehmen (zuletzt ${fmt(w)} kg).` };
  if (s.week === 9) return { text: `Woche 9: gleiches Gewicht, ${fmt(w)} kg.`, w };
  if (p.id === 'ruecken' && s.week <= 2) return { text: `Sehr leicht bleiben: ${fmt(w)} kg.`, w };
  const allTop = reps.length >= (same.e.sets || 1) && reps.every(r => r >= hi);
  if (allTop) {
    const why = `alle Sätze ${hi} bei ${same.e.lo}–${hi}`;
    if (stufe) return { text: `${fmt(w + stufe)} kg, wieder unten beginnen (${why}).`, w: w + stufe };
    return { text: `Kleinste Stufe mehr, wieder unten beginnen (${why}). Stufe unter Geräte eintragen.` };
  }
  return { text: `Gleiches Gewicht, ${fmt(w)} kg (nicht alle Sätze bei ${hi}).`, w };
}

// ---------- sessions ----------

function newSession(date, type, week, day, ruecken) {
  const s = { id: Math.random().toString(36).slice(2, 10), created: Date.now(), date, week, day, type, ruecken, done: false, entries: {}, note: '', back: null };
  db.sessions.push(s);
  save(); askPersist();
  return s;
}
const byId = id => db.sessions.find(s => s.id === id);
const draft = () => db.sessions.find(s => !s.done);

function entry(s, p) {
  let e = s.entries[p.id];
  if (!e) e = s.entries[p.id] = { w: '', reps: [], sets: p.sets, lo: p.lo, hi: p.hi };
  return e;
}
const repsOf = e => (e.reps || []).filter(r => num(r) !== null);
const filled = e => e && num(e.w) !== null && repsOf(e).length > 0;

// ---------- export ----------

function markdown() {
  const lines = ['# Trainingslog (Export aus takt)', '', 'Format: Gewicht · Wdh. Satz 1 / Satz 2 / Satz 3', ''];
  for (const s of sorted().filter(s => s.done)) {
    lines.push(`#### ${wd(s.date)} · ${s.type} · Datum ${s.date}`, '- [x] erledigt');
    for (const p of PLAN[s.type]) {
      const e = s.entries[p[0]];
      if (!filled(e)) continue;
      lines.push(`- ${MACHINES[p[0]].short}: ${fmt(num(e.w))} kg · ${repsOf(e).join(' / ')}`);
    }
    lines.push(`- Rücken Folgetag: ${s.back ? BACK_SHORT[s.back] : ''}`, `- Notiz: ${s.note.replace(/\n/g, ' ')}`, '');
  }
  const conf = MACHINE_ORDER.map(id => {
    const m = db.machines[id] || {}, M = MACHINES[id];
    return `- ${M.short}: ` + M.fields.map(f => `${f} ${m[f] || '___'}`).concat([`Stufe ${m.stufe || '___'} kg`]).join(' · ');
  });
  return ['## Einstellungen', '', ...conf, '', ...lines].join('\n');
}

// Share sheet where it exists (iPhone home-screen apps can't download), else a normal download.
async function saveFile(name, text, type) {
  const file = new File([text], name, { type });
  if (navigator.canShare && navigator.canShare({ files: [file] }) && /iPhone|iPad/.test(navigator.userAgent)) {
    try { await navigator.share({ files: [file], title: name }); return true; }
    catch (e) { if (e.name === 'AbortError') return false; }
  }
  download(name, text, type);
  return true;
}
function download(name, text, type) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([text], { type }));
  a.download = name;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}


function curSession() {
  const m = location.hash.match(/^#\/s\/(\w+)/);
  return m ? byId(m[1]) : null;
}
function keepScroll(fn) { const y = window.scrollY; fn(); window.scrollTo(0, y); }

// ---------- screen stays on during a session ----------

let lock = null, wantLock = false;
async function wake(on) {
  wantLock = on;
  try {
    if (on && !lock && 'wakeLock' in navigator) { lock = await navigator.wakeLock.request('screen'); lock.addEventListener('release', () => { lock = null; }); }
    if (!on && lock) { await lock.release(); lock = null; }
  } catch (e) { lock = null; }
}
document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible' && wantLock) wake(true); });


function showPersist() {
  const p = document.getElementById('persist');
  if (!p) return;
  if (!(navigator.storage && navigator.storage.persisted)) { p.textContent = 'unbekannt'; return; }
  navigator.storage.persisted().then(v => { p.textContent = v ? 'dauerhaft' : 'Browser darf aufräumen'; });
}
