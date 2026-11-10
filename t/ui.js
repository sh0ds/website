'use strict';
// Everything you see: views, events, the rest timer. Logic lives in app.js, food.js, sync.js.

const app = document.getElementById('app');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

const DAYS_LONG = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
const MONTHS = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const longDate = s => { const d = parse(s); return `${d.getDate()}. ${MONTHS[d.getMonth()]}`; };
const dayDate = s => `${wd(s)} ${parse(s).getDate()}.${parse(s).getMonth() + 1}.`;
const mmss = sec => `${Math.floor(sec / 60)}:${pad2(sec % 60)}`;

const ICONS = {
  heute: '<rect x="3.5" y="5" width="17" height="15.5" rx="3"/><path d="M3.5 10h17M8 3v4M16 3v4"/>',
  training: '<path d="M6.5 7.5v9M3.5 10v4M17.5 7.5v9M20.5 10v4M6.5 12h11"/>',
  essen: '<path d="M4 11.5h16a8 8 0 0 1-16 0z"/><path d="M9.5 8c0-1.6 1.2-2 1.2-3.6M14 8c0-1.6 1.2-2 1.2-3.6"/>',
  einkauf: '<path d="M5 8.5h14l-1.2 11.5H6.2z"/><path d="M9 8.5V7a3 3 0 0 1 6 0v1.5"/>',
  mehr: '<circle cx="5.5" cy="12" r="1.2"/><circle cx="12" cy="12" r="1.2"/><circle cx="18.5" cy="12" r="1.2"/>',
  timer: '<circle cx="12" cy="13.5" r="7.5"/><path d="M12 10v3.5l2.3 1.6M9.5 3h5"/>',
  left: '<path d="M14.5 5.5 8 12l6.5 6.5"/>',
  right: '<path d="m9.5 5.5 6.5 6.5-6.5 6.5"/>',
  check: '<path d="m5.5 12.5 4 4 9-9.5"/>',
  minus: '<path d="M6 12h12"/>',
  plus: '<path d="M12 6v12M6 12h12"/>',
};
const icon = (n, cls = '') => `<svg class="i ${cls}" viewBox="0 0 24 24" aria-hidden="true">${ICONS[n]}</svg>`;

const TABS = { heute: 'heute', s: 'training', training: 'training', essen: 'essen', r: 'essen', einkauf: 'einkauf', mehr: 'mehr', geraete: 'mehr', g: 'mehr', plan: 'mehr', daten: 'mehr' };

function page(title, sub, body, back) {
  return `<header class="ph">${back ? `<a class="back" href="${back[0]}">${icon('left')}${esc(back[1])}</a>` : ''}
    <h1>${title}</h1>${sub ? `<p class="sub">${sub}</p>` : ''}</header>${body}`;
}
const section = (title, body, extra = '') => `<section class="sec"><div class="sec-h"><h2>${title}</h2>${extra}</div>${body}</section>`;
const row = (main, side = '', href = '', cls = '') => {
  const inner = `<span class="r-main">${main}</span>${side ? `<span class="r-side">${side}</span>` : ''}${href ? icon('right', 'chev') : ''}`;
  return href ? `<a class="r ${cls}" href="${href}">${inner}</a>` : `<div class="r ${cls}">${inner}</div>`;
};

function route() {
  const h = location.hash.replace(/^#\/?/, '') || 'heute';
  const [view, arg] = h.split('/');
  const tab = TABS[view] || 'heute';
  document.querySelectorAll('[data-tab]').forEach(a => a.classList.toggle('on', a.dataset.tab === tab));
  document.body.classList.toggle('no-training', !trainingOn());
  const views = { heute: viewToday, training: viewTraining, s: viewSession, essen: viewFood, r: viewRecipe, einkauf: viewShop, mehr: viewMore, geraete: viewMachines, g: viewMachine, plan: viewPlan, daten: viewData };
  app.innerHTML = (views[view] || viewToday)(arg);
  wake(view === 's' && !!curSession() && !curSession().done);
  if (view === 'daten') showPersist();
  window.scrollTo(0, 0);
}
function go(h) { if (location.hash === h) route(); else location.hash = h; }

// ---------- back check ----------

function backCard(s, stay) {
  return `<div class="card ask"><p class="eyebrow">Rücken-Check</p><h3>Wie geht's dem Rücken nach ${dayDate(s.date)} (${s.type})?</h3>
    <div class="choice">${BACK.map(([k]) => `<button data-act="back" data-id="${s.id}" data-v="${k}"${stay ? ' data-stay="1"' : ''}>${BACK_SHORT[k]}</button>`).join('')}</div></div>`;
}
function backReaction(v) {
  const r = BACK.find(b => b[0] === v);
  if (!r) return '';
  const good = v === 'besser' || v === 'normal';
  return `<div class="alert ${good ? 'ok' : 'warn'}"><b>Rücken: ${esc(r[1])}</b><p>${esc(r[2])}.</p></div>` + (good ? '' : ABBRUCH);
}

// ---------- heute ----------

const probe = (t, type, ruecken, week) => ({ id: '_', created: Date.now(), date: t, type, ruecken, week, entries: {}, done: false });

function viewToday() {
  if (!trainingOn()) return viewTodayFood(today());
  const t = today(), w = weekOf(t), slot = slotOn(t), d = draft();
  const sub = w < 1 ? `${longDate(t)} · Start am Montag, ${longDate(db.start)}`
    : w <= 9 ? `${longDate(t)}${urlaub(t) ? ' · Urlaub' : ''}`
    : `${longDate(t)} · Plan durch`;
  let out = '';
  if (sync.conflict) out += conflictBox();
  const pending = sorted().filter(s => s.done && !s.back && s.date < t).pop();
  if (pending) out += backCard(pending);
  const justSet = sorted().filter(s => s.done && s.back && s.backOn === t).pop();
  if (justSet) out += backReaction(justSet.back);

  const doneToday = db.sessions.find(s => s.done && s.date === t);
  if (d) {
    const plan = planned(d), n = plan.filter(p => filled(d.entries[p.id])).length;
    out += `<div class="card hero">${glyph(d.type)}<p class="eyebrow">Läuft · ${dayDate(d.date)}</p><h2>Training ${d.type}</h2>
      <p class="meta">${n} von ${plan.length} Übungen</p>${bar(n, plan.length)}
      <button class="btn primary block" data-act="open" data-id="${d.id}">Weitermachen</button></div>`;
  } else if (slot && !doneToday) {
    const plan = planned(probe(t, slot.type, slot.day === 'Mo' || slot.day === 'Fr', slot.week)), ph = phase(slot.week);
    out += `<div class="card hero">${glyph(slot.type)}<p class="eyebrow">Heute${slot.moved ? ' · vom Feiertag verschoben' : ''}</p><h2>Training ${slot.type}</h2>
      <p class="meta">${plan.length} Übungen · ${esc(ph.sets)}${ph.reserve ? ` · ${esc(ph.reserve.split(',')[0])} Reserve` : ''}</p>
      <p class="hint-line">Vorher 5–8 min Fahrrad oder Crosstrainer.</p>
      <button class="btn primary block" data-act="start" data-slot="1" data-type="${slot.type}">Training starten</button></div>`;
  } else if (doneToday) {
    out += `<a class="card hero done" href="#/s/${doneToday.id}">${glyph(doneToday.type)}<p class="eyebrow">Heute</p><h2>${icon('check', 'ok')} Training ${doneToday.type} erledigt</h2>
      <p class="meta">${Object.values(doneToday.entries).filter(filled).length} Übungen eingetragen</p></a>`;
  } else {
    const n = nextSlot(t), moved = MOVES[t.slice(5)] && baseSlot(t);
    out += `<div class="card hero quiet"><p class="eyebrow">Heute</p><h2>${moved ? 'Feiertag' : 'Trainingsfrei'}</h2>
      <p class="meta">${moved ? `Das Training rutscht auf ${dayDate(t.slice(0, 5) + MOVES[t.slice(5)])} (sonst So).` : n ? `Nächstes: ${dayDate(n.date)} · Training ${n.type}` : 'Kein Training mehr geplant.'}</p></div>`;
  }

  if (w >= 1 && w <= 9) out += `<div class="weeks" aria-label="Woche ${w} von 9">${Array.from({ length: 9 }, (_, i) => `<span class="${i + 1 < w ? 'past' : i + 1 === w ? 'cur' : ''}">${i + 1}</span>`).join('')}</div>
    <div class="weeks-l"><span>Woche ${w} von 9</span><span>${esc(phase(w).sets)}</span></div>`;

  out += missedCard(t) + timeline(markNext(dayPlan(t)));

  if (!d) {
    out += `<details class="sec more"><summary>Anderes Training starten</summary>
      <p class="note">Nur wenn ein Tag verschoben ist. Ein verpasstes Training wird nicht nachgeholt, der Plan läuft normal weiter. Rückenstrecker nur Mo und Fr.</p>
      <label class="toggle"><input type="checkbox" id="mitRuecken" ${['Mo', 'Fr'].includes(slot ? slot.day : wd(t)) ? 'checked' : ''}><span></span>mit Rückenstrecker</label>
      <div class="two"><button class="btn" data-act="start" data-type="A">Training A</button><button class="btn" data-act="start" data-type="B">Training B</button></div></details>`;
  }
  const days = db.lastBackup ? Math.floor((Date.now() - db.lastBackup) / 864e5) : null;
  const synced = sync.last && Date.now() - sync.last < 14 * 864e5;
  if (db.sessions.some(s => s.done) && !synced && (days === null || days >= 14))
    out += `<a class="alert warn link" href="#/daten"><b>Backup fällig</b><p>Letztes Backup: ${days === null ? 'noch nie' : `vor ${days} Tagen`}. Pi-Sync oder Backup unter Daten.</p></a>`;
  return page(DAYS_LONG[parse(t).getDay()], sub, out);
}

// Ticked rows and rows whose clock time is over 15 min ago fade; the first row left is next.
// Rows without a clock time (nach der Arbeit, abends) only fade by time once a later clock time has passed.
const rowKey = r => r.text.replace(/<[^>]+>/g, '');
const doneToday = () => db.done && db.done.d === today() ? db.done.k : [];
function toggleDone(k) {
  const list = doneToday().slice(), i = list.indexOf(k);
  if (i < 0) list.push(k); else list.splice(i, 1);
  db.done = { d: today(), k: list };
  save();
}
function markNext(day) {
  if (!day) return day;
  const clock = r => /^\d+:\d\d$/.test(r.time), done = doneToday();
  const now = new Date(), m = now.getHours() * 60 + now.getMinutes();
  let last = -1, next = false;
  day.rows.forEach((r, i) => { if (clock(r) && r.k < m - 15) last = i; });
  day.rows.forEach((r, i) => {
    r.done = done.includes(rowKey(r));
    r.cls = r.done ? 'past done' : i <= last ? 'past' : next ? '' : (next = true, 'next');
  });
  return day;
}
const timeline = day => !day ? '' : section(day.title, (day.note ? `<p class="note warn">${esc(day.note)}</p>` : '') + `<div class="list timeline">${day.rows.map(r =>
  `<div class="r ${r.cls || ''}"><label class="time${r.moved ? ' moved' : ''}">${esc(r.time) || '<i>Zeit</i>'}<input type="time" data-f="rowtime" data-k="${esc(rowKey(r))}" value="${/^\d+:\d\d$/.test(r.time) ? r.time.padStart(5, '0') : ''}" aria-label="Uhrzeit ändern"></label><button class="tick" data-act="tick" data-k="${esc(rowKey(r))}" aria-label="${r.done ? 'nicht erledigt' : 'erledigt'}" aria-pressed="${!!r.done}">${icon('check')}</button>` +
  (r.href ? `<a class="r-main" href="${r.href}">${r.text}</a>${icon('right', 'chev')}` : `<span class="r-main">${r.text}</span>`) + '</div>').join('')}</div>` +
  `<p class="note">${day.foot ? esc(day.foot) + ' ' : ''}Tipp auf den Punkt hakt ab, Tipp auf die Uhrzeit verschiebt sie für heute.</p>` +
  (day.moved ? '<button class="btn text" data-act="timereset">Zeiten zurücksetzen</button>' : ''));

// Heute without training: what to eat next, then the day.
function viewTodayFood(t) {
  let out = (sync.conflict ? conflictBox() : '') + missedCard(t);
  const day = markNext(dayPlan(t)), nx = day && day.rows.find(r => r.cls === 'next');
  if (nx) {
    const [title, ...rest] = nx.text.replace(/<[^>]+>/g, '').split(': '), hour = /^(\d+):/.exec(nx.time);
    const btn = !nx.href ? '' : nx.href === '#/einkauf' ? 'Einkaufsliste' : 'Rezept';
    out += `<div class="card hero">${hour ? glyph(hour[1]) : ''}<p class="eyebrow">Als Nächstes${nx.time ? ' · ' + esc(nx.time) : ''}</p><h2>${esc(title)}</h2>
      ${rest.length ? `<p class="meta">${esc(rest.join(': '))}</p>` : ''}${btn ? `<a class="btn primary block" href="${nx.href}">${btn}</a>` : ''}
      <button class="btn text block" data-act="tick" data-k="${esc(rowKey(nx))}">Erledigt</button></div>`;
  } else if (day) {
    const we = ['Sa', 'So'].includes(wd(t)), late = day.rows.some(r => r.cls);
    out += `<div class="card hero quiet"><p class="eyebrow">Heute</p><h2>${late ? 'Tag geschafft' : we ? 'Wochenende' : 'Heute'}</h2>
      <p class="meta">${late ? 'Morgen geht es mit dem Frühstück weiter.' : we ? 'Gleiche Mahlzeiten wie unter der Woche, Abstand 3–4 Stunden.' : ''}</p></div>`;
    if (we) day.foot = day.foot.replace('Wochenende: gleiche Mahlzeiten, Abstand 3–4 Stunden.', '').trim();
  } else {
    out += `<div class="card hero quiet"><p class="eyebrow">Heute</p><h2>Aus dem Vorrat</h2><p class="meta">Der Essensplan startet ${dayDate(foodStart())} mit dem ersten Einkauf. Bis dahin isst du, was da ist.</p>
      <a class="btn primary block" href="#/r/notfall">Ideen aus dem Vorrat</a><a class="btn text block" href="#/einkauf">Einkaufsliste ansehen</a></div>`;
  }
  out += timeline(day);
  return page(DAYS_LONG[parse(t).getDay()], `${longDate(t)}${urlaub(t) ? ' · Urlaub' : ''}`, out);
}

// up to 14 steps as one beat each (exercises), longer lists as a plain bar (shopping)
const bar = (n, of) => of && of <= 14 ? `<div class="beats">${Array.from({ length: of }, (_, i) => `<i${i < n ? ' class="on"' : ''}></i>`).join('')}</div>`
  : `<div class="bar"><i style="width:${of ? Math.round(n / of * 100) : 0}%"></i></div>`;
const glyph = c => `<span class="glyph" aria-hidden="true">${c}</span>`;

// A shop of the last days that was never ticked: move it to today or say it happened.
function missedCard(t) {
  const m = missedShop(t);
  if (!m) return '';
  const to = openDay(t, 1);
  return `<div class="alert warn"><b>${SHOP_LABEL[m.kind]} ${dayDate(m.date)} nicht abgehakt</b><p>Noch nicht eingekauft? Dann zieht der Plan mit.</p>
    <div class="inline"><button class="btn primary" data-act="shopmove" data-k="${m.kind}" data-d="${m.date}" data-to="${to}">${to === t ? 'Heute einkaufen' : 'Am ' + dayDate(to) + ' einkaufen'}</button>
    <button class="btn" data-act="shopdone" data-k="${m.kind}" data-d="${m.date}">War erledigt</button></div></div>`;
}

// The day in order. Shopping, cooking and dinner come from foodDay (food.js), the rest from the weekday.
function dayPlan(t) {
  const f = foodDay(t), R = (time, text, href) => ({ time, text, href });
  if (f.pre) return null;
  const d = wd(t), u = urlaub(t), we = d === 'Sa' || d === 'So', tr = trainingOn(), slot = tr ? slotOn(t) : null;
  const at = (arb, url) => we ? '' : (u ? url : arb);
  const empty = t === foodStart();  // nothing bought yet: breakfast and lunch from the pantry
  const rows = [];
  rows.push(empty ? R(at('8:45', '8:30'), 'Frühstück: aus dem Vorrat', '#/r/notfall')
    : d === 'Fr' && !u ? R(at('8:45', '8:30'), 'Frühstück: 2 Bockwürste mit Brötchen, auf der Arbeit') : R(at('8:45', '8:30'), 'Frühstück: Oats', '#/r/oats'));
  if (tr && (d === 'Mo' || d === 'Mi')) rows.push(R(at('15:00', '10:30'), 'Banane'));  // before training
  rows.push(R(at(d === 'Fr' ? '12:45' : '12:00', '12:30'), 'Mittag: ' + esc(f.lunch.label), f.lunch.id ? '#/r/' + f.lunch.id : ''));
  if (slot) rows.push(R(at(slot.day === 'Fr' ? '14:00' : '15:30', '11:00'), `<b>Training ${slot.type}</b>`));
  if (f.shop) rows.push(R(at(slot ? 'nach dem Training' : 'nach der Arbeit', '13:30'), SHOP_LABEL[f.shop], '#/einkauf'));
  rows.push(R(at('', '15:30'), 'Quark-Snack', '#/r/quark'));
  if (f.cook) rows.push(R(at('17:30', '17:30'), 'Kochen: ' + esc(SHORT[f.cook]) + ', Eier mitkochen', '#/r/' + f.cook));
  rows.push(R(at('18:30', '18:30'), 'Abendessen: ' + esc(f.dinner.label), '#/r/' + f.dinner.id));
  if (d !== 'Do' || u) rows.push(R(at('20:30', '20:30'), 'Milch und Nüsse, Oats für morgen', '#/r/oats'));
  if (!u) {
    const tm = addDays(t, 1), fm = foodDay(tm);  // what to pack for work tomorrow
    if (['Mo', 'Di', 'Mi', 'Do'].includes(wd(tm)) && !urlaub(tm) && fm.lunch.id) rows.push(fm.lunch.id === 'brote'
      ? R('abends', 'Brote für morgen richten', '#/r/brote') : R('abends', 'Portion für morgen bereitstellen'));
    if (tr && ['So', 'Di', 'Do'].includes(d)) rows.push(R('abends', 'Sporttasche packen'));
  }
  const c = f.cycle;
  if (c && c.N && t === addDays(c.N, 2)) rows.push(R('abends', 'Eingefrorenes Brot in den Kühlschrank'));
  // times moved by hand for today (tap on a time)
  const ov = db.times && db.times.d === t ? db.times.t : {};
  rows.forEach(r => { const o = ov[rowKey(r)]; if (o) { r.time = o.replace(/^0/, ''); r.moved = true; } });
  // clock times sort the list; rows without one stay behind the row before them
  let k = 0;
  rows.forEach((r, i) => { const m = /^(\d+):(\d\d)$/.exec(r.time); k = m ? m[1] * 60 + +m[2] : k; r.k = k; r.i = i; });
  rows.sort((a, b) => a.k - b.k || a.i - b.i);
  return {
    title: 'Tagesplan', rows, moved: Object.keys(ov).length > 0, note: f.shop && closed(t) ? 'Heute haben die Läden zu. Verschieb den Einkauf unter Einkauf.' : DATE_NOTES[t],
    foot: [we ? 'Wochenende: gleiche Mahlzeiten, Abstand 3–4 Stunden.' : '', u ? 'Urlaub: Festessen sind Ausnahmen, am nächsten Tag normal weiter.' : ''].filter(Boolean).join(' '),
  };
}

// ---------- training ----------

function viewTraining() {
  if (!trainingOn()) return page('Training', 'pausiert', `<div class="card hero quiet"><p class="eyebrow">Pausiert</p><h2>Erst die Ernährung</h2>
    <p class="meta">Training ist ausgeschaltet. Heute, Essen und Einkauf laufen ohne Training. Dein Log bleibt gespeichert.</p>
    <button class="btn primary block" data-act="training" data-v="1">Training einschalten</button></div>`);
  const t = today(), w = Math.max(weekOf(t), 1), ph = phase(w), d = draft();
  let out = '';
  if (d) out += `<a class="card hero" href="#/s/${d.id}">${glyph(d.type)}<p class="eyebrow">Läuft · ${dayDate(d.date)}</p><h2>Training ${d.type}</h2><p class="meta">Weitermachen</p></a>`;
  out += `<div class="stats"><div><span>Woche</span><b>${weekOf(t) < 1 ? '–' : Math.min(weekOf(t), 9)}<small> / 9</small></b></div>
    <div><span>Sätze</span><b class="sm">${esc(ph.sets)}</b></div><div><span>Reserve</span><b class="sm">${esc((ph.reserve || '–').split(',')[0])}</b></div></div>`;
  const list = sorted().filter(s => s.done).reverse();
  out += section('Verlauf', list.length ? `<div class="list">${list.map(s => {
    const n = Object.values(s.entries).filter(filled).length;
    return row(`<b>Training ${s.type}</b><small>${dayDate(s.date)} · ${n} Übungen</small>`, s.back ? `<span class="tag ${s.back === 'besser' || s.back === 'normal' ? 'ok' : 'warn'}">Rücken ${BACK_SHORT[s.back]}</span>` : '<span class="tag">Rücken offen</span>', `#/s/${s.id}`);
  }).join('')}</div>` : `<p class="empty">Noch keine Einheit. ${(n => n ? `Die nächste ist am ${dayDate(n.date)}` : '')(nextSlot(addDays(t, -1)))}</p>`);
  out += `<div class="list">${row('Geräte und Einstellungen', '', '#/geraete')}</div>`;
  return page('Training', `Muskelaufbau an Maschinen · Mo, Mi, Fr`, out);
}

function viewSession(id) {
  const s = byId(id);
  if (!s) return page('Nicht gefunden', '', '', ['#/training', 'Training']);
  const ph = phase(Math.max(s.week, 1)), pb = prevBack(s);
  const plan = planned(s), doneN = plan.filter(p => filled(s.entries[p.id])).length;
  const sub = `${dayDate(s.date)}${s.week >= 1 && s.week <= 9 ? ` · Woche ${s.week}` : ''} · ${esc(ph.sets)}${ph.reserve ? ` · Reserve ${esc(ph.reserve)}` : ''}`;
  let out = `<div class="progress" id="progress">${bar(doneN, plan.length)}<span><b id="stand">${doneN}</b> / ${plan.length}</span></div>`;
  const lastDone = before(s).pop();
  if (!s.done && lastDone && !lastDone.back) out += backCard(lastDone, true);
  if (pb && pb !== 'normal') {
    const r = BACK.find(b => b[0] === pb);
    out += `<div class="alert ${pb === 'besser' ? 'ok' : 'warn'}"><b>Rücken nach dem letzten Training: ${esc(r[1])}</b><p>${esc(r[2])}.</p></div>`;
    if (pb !== 'besser') out += ABBRUCH;
  }
  if (!s.done) out += '<p class="note">Aufwärmen: 5–8 min Fahrrad oder Crosstrainer.</p>';
  const seen = new Set();
  for (const p of plan) out += exCard(s, p, seen);
  out += `<div class="field"><label for="note">Notiz</label><textarea id="note" data-f="note" placeholder="z. B. ein Satz mit anderem Gewicht">${esc(s.note)}</textarea></div>`;
  if (s.done) {
    out += `<div class="field"><label>Rücken am Folgetag</label><div class="choice">${BACK.map(([k]) => `<button class="${s.back === k ? 'sel' : ''}" data-act="back" data-id="${s.id}" data-v="${k}" data-stay="1">${BACK_SHORT[k]}</button>`).join('')}</div></div>`;
    if (s.back) out += backReaction(s.back);
  }
  out += `<div class="actions">${s.done ? '<a class="btn primary block" href="#/training">Fertig</a>' : '<button class="btn primary block" data-act="finish">Training abschließen</button>'}
    <button class="btn text danger" data-act="delete" data-id="${s.id}">${s.done ? 'Einheit löschen' : 'Training verwerfen'}</button></div>`;
  return page(`Training ${s.type}`, sub, out, s.done ? ['#/training', 'Training'] : ['#/heute', 'Heute']);
}

function exCard(s, p, seen) {
  const e = entry(s, p), m = db.machines[p.id] || {}, M = MACHINES[p.id];
  const last = lastEntry(s, p.id, true) || lastEntry(s, p.id, false);
  const sg = suggest(s, p);
  const conf = M.fields.filter(f => m[f]).map(f => `${f} ${esc(m[f])}`).concat(m.stufe ? [`Stufe ${esc(m.stufe)} kg`] : []).join(' · ');
  const warm = p.warm && !seen.has(p.warm);
  if (p.warm) seen.add(p.warm);
  const range = p.lo === p.hi ? `${p.hi}` : `${p.lo}–${p.hi}`;
  let reps = '';
  for (let i = 0; i < Math.max(e.sets, 1); i++)
    reps += `<input class="rep" aria-label="Satz ${i + 1}" inputmode="numeric" data-f="rep" data-ex="${p.id}" data-i="${i}" value="${esc(e.reps[i] ?? '')}" placeholder="${range}">`;
  const hints = [warm ? ['', 'Erst 1 Aufwärmsatz mit halbem Gewicht, 10 lockere Wiederholungen.'] : null, p.hint ? [p.id === 'ruecken' ? 'care' : '', p.hint] : null].filter(Boolean);
  return `<section class="card ex${filled(e) ? ' done' : ''}" id="ex-${p.id}">
    <div class="ex-top"><div><h3>${esc(M.name)}</h3><p class="small muted">${conf || `<a href="#/g/${p.id}">Einstellungen eintragen</a>`}</p></div>
      <span class="pill">${e.sets} × ${range}</span></div>
    ${hints.map(([c, h]) => `<p class="hint ${c}">${esc(h)}</p>`).join('')}
    ${last ? `<p class="last">Letztes Mal, ${dayDate(last.s.date)}${last.s.type !== s.type ? ` (${last.s.type})` : ''}: <b>${fmt(num(last.e.w))} kg</b> · ${repsOf(last.e).join(' / ')}</p>` : ''}
    ${sg ? `<div class="sugg"><p><span>Vorschlag</span>${esc(sg.text)}</p>${sg.w !== undefined && e.w === '' ? `<button class="btn small" data-act="take" data-ex="${p.id}" data-w="${sg.w}">${fmt(sg.w)} kg</button>` : ''}</div>` : ''}
    <div class="ex-grid">
      <div class="field"><label>Gewicht</label><div class="stepper">
        <button data-act="wstep" data-ex="${p.id}" data-d="-1" aria-label="weniger">${icon('minus')}</button>
        <input inputmode="decimal" data-f="w" data-ex="${p.id}" value="${esc(e.w)}" placeholder="kg" aria-label="Gewicht in kg"><span class="unit">kg</span>
        <button data-act="wstep" data-ex="${p.id}" data-d="1" aria-label="mehr">${icon('plus')}</button></div></div>
      <div class="field"><label>Wiederholungen</label><div class="reps">${reps}</div></div>
    </div>
    <div class="ex-foot">
      <button class="btn ghost" data-act="pause" data-sec="${p.pause}" data-name="${esc(M.short)}">${icon('timer')} Pause ${mmss(p.pause)}</button>
      <span class="setbtns"><button class="btn icon" data-act="sets" data-ex="${p.id}" data-d="-1" aria-label="Satz weniger">${icon('minus')}</button><span>Satz</span><button class="btn icon" data-act="sets" data-ex="${p.id}" data-d="1" aria-label="Satz mehr">${icon('plus')}</button></span>
    </div></section>`;
}

// ---------- essen ----------

function viewFood() {
  const t = today(), b = later(t, foodStart());
  const tile = r => `<a class="card tile" href="#/r/${r.id}"><b>${esc(r.title)}</b><small>${esc(r.when)}</small></a>`;
  const pick = ids => ids.map(id => tile(RECIPES.find(r => r.id === id))).join('');
  let out = section('Jeden Tag', `<div class="grid">${pick(['oats', 'brote', 'quark', 'notfall'])}</div>`);
  const c = cycleOf(b), nx = cycleOf(c ? c.next : firstShop());
  out += c ? section(`Diese Woche · ${REZEPTWOCHEN[c.rw].name}`, `<div class="grid">${pick([c.a, c.b])}</div>`)
    : section(`Start · ${dayDate(foodStart())}`, `<div class="grid">${pick([START_POT])}</div>`);
  out += section(`Ab ${dayDate(nx.H)} · ${REZEPTWOCHEN[nx.rw].name}`, `<div class="grid">${pick([nx.a, nx.b])}</div>`);
  out += section('Die nächsten 7 Tage', `<div class="list">${[0, 1, 2, 3, 4, 5, 6].map(i => {
    const d = addDays(b, i), f = foodDay(d);
    const what = [f.shop && SHOP_LABEL[f.shop], f.cook && SHORT[f.cook] + ' kochen'].filter(Boolean).join(', ');
    const short = m => m.label.split(',')[0].replace('Brote mit Ei-Aufstrich', 'Brote');
    return row(`<b>${dayDate(d)}</b>${what ? `<small>${esc(what)}</small>` : ''}`, `${esc(short(f.lunch))}<br><small>abends ${esc(short(f.dinner))}</small>`, '', d === t ? 'now' : '');
  }).join('')}</div><p class="note">Der Plan hängt an den Einkaufstagen. Rechts steht das Mittag, darunter der Abend. Verschiebst du einen Einkauf, zieht alles mit.</p>`);
  out += section('Mahlzeiten', `<div class="list">${MEALS.map(([m, w, k, e, r]) =>
    row(`<b>${esc(m)}</b><small>${esc(w)}</small>`, `${k} kcal<br><small>${e} Eiweiß</small>`, r ? `#/r/${r}` : '')).join('')}
    ${row('<b>Gesamt</b>', 'ca. 2.950 kcal<br><small>ca. 195 g Eiweiß</small>')}</div>
    <p class="note">Jeden Tag eine warme und eine Brot-Mahlzeit. Do ist mittags Döner, Fr ersetzen 2 Bockwürste mit Brötchen auf der Arbeit die Oats.</p>`);
  out += section('Nach Gefühl', `<div class="list">${feel().map(([a, b]) => row(`${esc(a)}<small>→ ${esc(b)}</small>`)).join('')}</div>`);
  return page('Essen', 'Ziel ca. 160 g Eiweiß · nach Gefühl, kein Wiegen', out);
}

function viewRecipe(id) {
  const r = RECIPES.find(x => x.id === id);
  if (!r) return page('Nicht gefunden', '', '', ['#/essen', 'Essen']);
  let out = '';
  if (r.text && r.steps) out += `<p class="lead">${esc(r.text)}</p>`;
  if (r.items) out += section('Zutaten', `<div class="card"><ul class="dots">${r.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`);
  if (r.steps) out += section('Zubereitung', `<ol class="steps">${r.steps.map(s => `<li>${s}</li>`).join('')}</ol>`);
  else if (r.text) out += section('Zubereitung', `<div class="card"><p>${esc(r.text)}</p></div>`);
  if (r.vary) out += section('Abwechslung', `<div class="list">${r.vary.map(([a, b]) => row(`<b>${esc(a)}</b><small>${esc(b)}</small>`)).join('')}</div>`);
  if (r.batch) out += `<p class="note">${esc(RECIPES_INTRO)}</p>`;
  return page(esc(r.title), esc(r.when), out, ['#/essen', 'Essen']);
}

// ---------- einkauf ----------

let shopTab = null;

function viewShop() {
  const t = today();
  const dates = { erst: nextShop('erst', t), haupt: nextShop('haupt', t), nach: nextShop('nach', t) };
  const tabs = ['erst', 'haupt', 'nach'].filter(k => dates[k]).sort((a, b) => dates[a] < dates[b] ? -1 : 1);
  const tab = tabs.includes(shopTab) ? shopTab : tabs[0], date = dates[tab];
  const c = tab === 'haupt' ? cycleOf(date) : tab === 'nach' ? cycleOf(date) : null;
  const l = tab === 'erst' ? startList() : tab === 'haupt' ? hauptList(c) : nachList(c), st = shopState(tab, date);
  const n = l.groups.reduce((a, g) => a + g[1].length, 0), got = l.groups.reduce((a, g) => a + g[1].filter(it => st[itemText(it)]).length, 0);
  let out = `<div class="seg">${tabs.map(id => `<button class="${id === tab ? 'on' : ''}" data-act="shoptab" data-v="${id}">${SHOP_LABEL[id]}</button>`).join('')}</div>`;
  out += `<div class="card shophead"><div><b>${SHOP_LABEL[tab]} · ${date === t ? 'heute' : dayDate(date)}</b>${tab === 'haupt' ? `<small>${esc(REZEPTWOCHEN[c.rw].name)}</small>` : ''}<small>${esc(l.intro)} Zusammen etwa ${Math.round(listCost(l))}&nbsp;€.</small></div><span class="count">${got}<small>/${n}</small></span></div>${bar(got, n)}`;
  if (closed(date)) out += `<div class="alert warn"><b>Am ${dayDate(date)} haben die Läden zu</b><p>Verschieb den Einkauf unten auf einen anderen Tag.</p></div>`;
  l.groups.forEach(([g, items]) => {
    out += `${g ? `<h3 class="group">${esc(g)}</h3>` : ''}<div class="list checks">` + items.map(it => {
      // a segment after " · " that starts lowercase is a note (für Samstag ...), the rest is what to buy
      const k = itemText(it), pr = itemPrice(it), segs = k.split(' · ');
      const main = segs.filter((x, i) => i === 0 || !/^[a-zäöü]/.test(x)).join(' · '), rest = segs.filter((x, i) => i > 0 && /^[a-zäöü]/.test(x));
      return `<label class="check"><input type="checkbox" data-f="shop" data-l="${tab}" data-d="${date}" data-k="${esc(k)}" ${st[k] ? 'checked' : ''}><span class="box">${icon('check')}</span><span class="r-main">${esc(main)}${rest.length ? `<small>${esc(rest.join(' · '))}</small>` : ''}</span>${pr ? `<span class="price">${pr.guess ? 'ca. ' : ''}${eur(pr.n).replace('.', ',')}&nbsp;€</span>` : ''}</label>`;
    }).join('') + '</div>';
  });
  const [e, la] = moveTargets(tab, date, t), mv = (to, txt) => `<button class="btn" ${to ? `data-act="shopmove" data-k="${tab}" data-d="${date}" data-to="${to}"` : 'disabled'}>${txt}${to ? ' · ' + dayDate(to) : ''}</button>`;
  out += section('Anderer Tag?', `<div class="inline">${mv(e, 'Früher')}${mv(la, 'Später')}</div>
    <p class="note">Kochen und Abendessen ziehen mit. Preise vom Kassenzettel 10.11., „ca.“ ist geschätzt. Die Summe zählt ohne „Nur wenn leer“.</p>`);
  out += `<button class="btn text" data-act="shopreset" data-l="${tab}">Liste leeren</button>`;
  return page('Einkauf', 'bei Nahkauf · Kühltasche mit', out);
}

// ---------- mehr ----------

function viewMore() {
  const noStufe = MACHINE_ORDER.filter(id => !(db.machines[id] || {}).stufe).length;
  const plain = syncText().replace(/<[^>]+>/g, '');
  const tr = trainingOn();
  return page('Mehr', '', `<div class="card form"><label class="toggle"><input type="checkbox" data-f="training" ${tr ? 'checked' : ''}><span></span><b>Training</b></label>
    <p class="small muted">${tr ? `An. Woche 1 beginnt am ${dayDate(db.start)}, änderbar unter Daten und Pi.` : 'Aus. takt zeigt nur Ernährung und Einkauf. Dein Training-Log bleibt gespeichert.'}</p></div>
    <div class="list">
    ${tr ? row('<b>Geräte</b><small>' + (noStufe ? `${noStufe} ohne Stufe` : 'alle Stufen eingetragen') + '</small>', '', '#/geraete') : ''}
    ${tr ? row('<b>Plan</b><small>Kalender, Training A und B, Regeln</small>', '', '#/plan') : ''}
    ${row('<b>Daten und Pi</b><small>' + esc(plain) + '</small>', '', '#/daten')}</div>
    <p class="note center">takt · offline · <a href="https://github.com/sh0ds">sh0ds</a></p>`);
}

function viewMachines() {
  return page('Geräte', 'Stufe = kleinster Gewichtsschritt. Ohne sie kann takt nur "kleinste Stufe mehr" vorschlagen.', `<div class="list">${MACHINE_ORDER.map(id => {
    const m = db.machines[id] || {};
    const last = sorted().filter(s => s.done && s.entries[id] && num(s.entries[id].w) !== null).pop();
    return row(`<b>${esc(MACHINES[id].name)}</b><small>${m.stufe ? `Stufe ${esc(m.stufe)} kg` : 'Stufe fehlt'}</small>`, last ? `${fmt(num(last.entries[id].w))} kg` : '', `#/g/${id}`);
  }).join('')}</div>`, ['#/mehr', 'Mehr']);
}

function viewMachine(id) {
  const M = MACHINES[id];
  if (!M) return page('Nicht gefunden', '', '', ['#/geraete', 'Geräte']);
  const m = db.machines[id] || {};
  let out = '<div class="card form">' + M.fields.concat(['stufe']).map(f => `<div class="field"><label for="m-${f}">${f === 'stufe' ? 'Stufe (kg)' : esc(f)}</label><input id="m-${f}" data-f="machine" data-ex="${id}" data-k="${esc(f)}" ${f === 'stufe' ? 'inputmode="decimal" placeholder="z. B. 2,5"' : ''} value="${esc(m[f] || '')}"></div>`).join('') + '</div>';
  const hist = sorted().filter(s => s.done && filled(s.entries[id])).reverse();
  out += section('Verlauf', hist.length ? `<div class="list">${hist.map(s => row(`${dayDate(s.date)} · ${s.type}`, `<b>${fmt(num(s.entries[id].w))} kg</b> · ${repsOf(s.entries[id]).join(' / ')}`)).join('')}</div>` : '<p class="empty">Noch nichts eingetragen.</p>');
  return page(esc(M.name), '', out, ['#/geraete', 'Geräte']);
}

function viewPlan() {
  const t = today();
  let cal = row('<b>Essensplan</b><small>erster Einkauf</small>', dayDate(foodStart()));
  for (let w = 1; w <= 9; w++) {
    const mo = addDays(db.start, (w - 1) * 7), days = [0, 1, 2, 3, 4, 5, 6].map(i => addDays(mo, i));
    const notes = [WEEK_NOTES[w]];
    if (days.some(urlaub)) notes.push('Urlaub');
    days.forEach(d => { if (MOVES[d.slice(5)] && wd(d) === 'Fr') notes.push(`${dayDate(d)} → ${dayDate(addDays(d, 1))} (sonst So)`); });
    cal += row(`<b>Woche ${w}</b><small>ab ${dayDate(mo).slice(3)}${notes.filter(Boolean).length ? ' · ' + esc(notes.filter(Boolean).join(' · ')) : ''}</small>`, w % 2 ? 'A · B · A' : 'B · A · B', '', days.includes(t) ? 'now' : '');
  }
  cal += row(`<b>Danach</b><small>Log auswerten: was macht noch Fortschritte?</small>`, dayDate(addDays(db.start, 63)));
  let out = section('Kalender', `<div class="list">${cal}</div><p class="note">Do 24.12. und 31.12.: prüfen, ob der Döner offen hat. Im ersten A und im ersten B an jeder Maschine ein Gewicht für 15 lockere Wiederholungen suchen und die Einstellungen eintragen.</p>`);
  for (const T of ['A', 'B']) out += section(`Training ${T}`, `<div class="list">${PLAN[T].map(([id, s, lo, hi, p]) =>
    row(esc(MACHINES[id].name) + (id === 'ruecken' ? '<small>nur Mo und Fr</small>' : ''), `${s} × ${lo === hi ? hi : lo + '–' + hi} · ${mmss(p)}`)).join('')}</div>`);
  out += section('Ablauf', '<div class="card prose"><p>5–8 min Fahrrad oder Crosstrainer. Vor der ersten Bein-, Druck- und Zugübung 1 Aufwärmsatz mit halbem Gewicht, 10 lockere Wiederholungen. Nach jeder Übung ins Log eintragen.</p><p><b>Verpasst:</b> Ein ausgefallenes Training wird nicht nachgeholt. Der Plan läuft normal weiter, die nächste Einheit ist die laut Kalender.</p></div>');
  out += section('Steigerung', `<div class="list">${[['1–2', 0], ['3–4', 1], ['5–8', 2], ['9', 3]].map(([w, i]) => row(`<b>Woche ${w}</b><small>${esc(PHASES[i].reserve || '–')}</small>`, esc(PHASES[i].sets))).join('')}</div>`);
  out += section('Regeln', `<div class="card prose">
    <p><b>Gewicht erhöhen:</b> Alle Sätze schaffen das obere Ende des Bereichs sauber → nächstes Mal kleinste Stufe mehr, wieder unten beginnen. Beispiel: 40 kg · 12 / 12 / 12 bei 8–12 → 42,5 kg. 40 kg · 12 / 12 / 10 → wieder 40 kg.</p>
    <p><b>Rückenstrecker:</b> Woche 1–2 1 × 15 sehr leicht, nur schmerzfreier Bereich. Woche 3–4 1 × 15, in kleinen Stufen steigern. Woche 5–8 2 × 12–15, nur wenn vorher beschwerdefrei. Nie aktiv überstrecken, nie bis zum Muskelversagen.</p>
    <p><b>Beinpresse:</b> nur so tief, wie Becken und unterer Rücken fest an der Lehne bleiben. Sitzposition immer gleich.</p></div>`);
  out += section('Beschwerden', `<div class="list">${BACK.map(b => row(`<b>${esc(b[1])}</b><small>${esc(b[2])}</small>`)).join('')}</div>${ABBRUCH}`);
  return page('Plan', 'Muskelaufbau an Maschinen · Mo, Mi, Fr · 8 Wochen + 1 leichte Woche', out, ['#/mehr', 'Mehr']);
}

function viewData() {
  const done = db.sessions.filter(s => s.done).length;
  let out = section('Pi', `<div class="card form"><p id="syncstatus" class="status">${syncText()}</p>
    <div class="field"><label for="pikey">Schlüssel</label><div class="inline"><input id="pikey" autocomplete="off" autocapitalize="off" spellcheck="false" value="${esc(piKey())}" placeholder="aus sudo cat /var/lib/takt/key"><button class="btn" data-act="sync-now">Sync</button></div></div>
    <p class="small muted">Kopie auf deinem Pi, nur im Heimnetz. Unterwegs speichert das Handy, zu Hause holt es nach.</p></div>${conflictBox()}`);
  out += section('Backup', `<div class="stats"><div><span>Einheiten</span><b>${done}</b></div><div><span>Backup</span><b class="sm">${db.lastBackup ? dayDate(iso(new Date(db.lastBackup))) : 'nie'}</b></div><div><span>Speicher</span><b class="sm" id="persist">…</b></div></div>
    <div class="stack"><button class="btn primary block" data-act="export">Backup speichern</button>
    <label class="btn block">Backup laden<input type="file" id="import" accept="application/json,.json" hidden></label>
    <button class="btn block" data-act="md">Als Markdown für Obsidian</button></div>`);
  out += section('Essensplan', `<div class="card form"><div class="field"><label for="foodstart">Erster Einkauf</label><input type="date" id="foodstart" data-f="foodstart" value="${esc(db.foodMon)}"></div>
    <p class="small muted">Ab hier läuft der Plan, der Hauptkauf ist dann freitags. Einzelne Einkaufstage verschiebst du unter Einkauf.</p></div>`);
  if (trainingOn()) out += section('Start', `<div class="card form"><div class="field"><label for="start">Montag von Woche 1</label><input type="date" id="start" data-f="start" value="${esc(db.start)}"></div>
    <p class="small muted">Bist du krank und alles rutscht eine Woche, hier eine Woche später eintragen.</p></div>`);
  out += section('Alles löschen', '<button class="btn block danger" data-act="wipe">Log und Einstellungen löschen</button>');
  return page('Daten und Pi', 'Alles liegt in diesem Browser, mit Schlüssel auch auf deinem Pi.', out, ['#/mehr', 'Mehr']);
}

// ---------- events ----------

document.addEventListener('click', ev => {
  const b = ev.target.closest('[data-act]');
  if (!b) return;
  const act = b.dataset.act, cur = curSession();
  if (act === 'start') {
    const t = today(), slot = slotOn(t), type = b.dataset.type;
    const box = document.getElementById('mitRuecken');
    const s = slot && b.dataset.slot
      ? newSession(t, type, slot.week, slot.day, slot.day === 'Mo' || slot.day === 'Fr')
      : newSession(t, type, weekOf(t), wd(t), box ? box.checked : ['Mo', 'Fr'].includes(wd(t)));
    go('#/s/' + s.id);
  } else if (act === 'open') go('#/s/' + b.dataset.id);
  else if (act === 'back') {
    const s = byId(b.dataset.id);
    s.back = b.dataset.v; s.backOn = today(); save();
    b.dataset.stay ? keepScroll(route) : route();
  } else if (act === 'take' && cur) {
    entry(cur, planned(cur).find(p => p.id === b.dataset.ex)).w = fmt(Number(b.dataset.w));
    save(); keepScroll(route);
  } else if (act === 'wstep' && cur) {
    const p = planned(cur).find(p => p.id === b.dataset.ex), e = entry(cur, p);
    const step = num((db.machines[p.id] || {}).stufe) || 2.5;
    // empty field: the first tap fills in the suggestion or last time's weight, after that it steps
    const sg = suggest(cur, p), last = lastEntry(cur, p.id, true) || lastEntry(cur, p.id, false);
    const start = sg && sg.w !== undefined ? sg.w : last ? num(last.e.w) : null;
    const next = num(e.w) !== null ? num(e.w) + Number(b.dataset.d) * step : start ?? (Number(b.dataset.d) > 0 ? step : 0);
    e.w = next > 0 ? fmt(next) : '';
    save(); keepScroll(route);
  } else if (act === 'sets' && cur) {
    const e = entry(cur, planned(cur).find(p => p.id === b.dataset.ex));
    e.sets = Math.min(6, Math.max(1, e.sets + Number(b.dataset.d)));
    e.reps = e.reps.slice(0, e.sets);
    save(); keepScroll(route);
  } else if (act === 'pause') startTimer(Number(b.dataset.sec), b.dataset.name);
  else if (act === 'finish' && cur) {
    const n = Object.values(cur.entries).filter(filled).length;
    if (!n && !confirm('Noch nichts eingetragen. Trotzdem abschließen?')) return;
    cur.done = true; save(); stopTimer(); go('#/heute');
  } else if (act === 'delete') {
    const s = byId(b.dataset.id);
    const has = Object.values(s.entries).some(filled) || s.note;
    if ((!s.done && !has) || confirm(`${dayDate(s.date)} · Training ${s.type} ${s.done ? 'löschen' : 'verwerfen'}? Die Einträge sind dann weg.`)) {
      db.sessions = db.sessions.filter(x => x.id !== s.id); save(); go(s.done ? '#/training' : '#/heute');
    }
  } else if (act === 'export') {
    saveFile(`takt-backup-${today()}.json`, JSON.stringify(db, null, 1), 'application/json').then(ok => {
      if (ok) { db.lastBackup = Date.now(); save(); keepScroll(route); }
    });
  } else if (act === 'md') saveFile(`takt-log-${today()}.md`, markdown(), 'text/markdown');
  else if (act === 'wipe') {
    if (confirm('Wirklich alles löschen? Auch die Kopie auf dem Pi wird leer (dort bleibt eine Tageskopie in history/).')) { db = fix(EMPTY()); save(); route(); }
  } else if (act === 'stoptimer') stopTimer();
  else if (act === 'sync-now') { const k = document.getElementById('pikey'); if (k) setPiKey(k.value); setStatus(sync.status); sync.dirty ? push() : pull(); }
  else if (act === 'sync-pi' && sync.conflict) takePi(sync.conflict);
  else if (act === 'sync-phone') push(true);
  else if (act === 'training') { setTraining(true); go('#/heute'); }
  else if (act === 'shopreset') { db.shop[b.dataset.l] = {}; save(); keepScroll(route); }
  else if (act === 'shoptab') { shopTab = b.dataset.v; keepScroll(route); }
  else if (act === 'shopmove') { moveShop(b.dataset.k, b.dataset.d, b.dataset.to); shopTab = null; keepScroll(route); }
  else if (act === 'timereset') { delete db.times; save(); keepScroll(route); }
  else if (act === 'tick') { toggleDone(b.dataset.k); keepScroll(route); }
  else if (act === 'shopdone') { shopDone(b.dataset.k, b.dataset.d); keepScroll(route); }
});

document.addEventListener('input', ev => {
  const el = ev.target, f = el.dataset.f;
  if (!f || f === 'rowtime') return;
  const cur = curSession();
  if ((f === 'w' || f === 'rep') && cur) {
    const plan = planned(cur), p = plan.find(p => p.id === el.dataset.ex), e = entry(cur, p);
    if (f === 'w') e.w = el.value.trim();
    else e.reps[Number(el.dataset.i)] = el.value.trim();
    el.closest('.ex').classList.toggle('done', filled(e));
    const n = plan.filter(p => filled(cur.entries[p.id])).length;
    const st = document.getElementById('stand'), b = document.querySelector('#progress .bar i');
    if (st) st.textContent = n;
    if (b) b.style.width = Math.round(n / plan.length * 100) + '%';
    document.querySelectorAll('#progress .beats i').forEach((x, i) => x.classList.toggle('on', i < n));
  } else if (f === 'note' && cur) cur.note = el.value;
  else if (f === 'shop') {
    const st = db.shop[el.dataset.l] = shopState(el.dataset.l, el.dataset.d);
    st[el.dataset.k] = el.checked;
    save(); keepScroll(route); return;
  } else if (f === 'machine') {
    const m = db.machines[el.dataset.ex] = db.machines[el.dataset.ex] || {};
    m[el.dataset.k] = el.value.trim();
  } else if (f === 'training') { setTraining(el.checked); keepScroll(route); return;
  } else if (f === 'foodstart' && /^\d{4}-\d{2}-\d{2}$/.test(el.value)) {
    if (closed(el.value)) { el.setCustomValidity('An dem Tag haben die Läden zu'); el.reportValidity(); return; }
    el.setCustomValidity('');
    db.foodMon = el.value; db.haupt = []; db.nach = {}; fix(db);
  } else if (f === 'start' && /^\d{4}-\d{2}-\d{2}$/.test(el.value)) {
    if (wd(el.value) !== 'Mo') { el.setCustomValidity('Bitte ein Montag'); el.reportValidity(); return; }
    el.setCustomValidity('');
    db.start = el.value;
  }
  save();
});

document.addEventListener('change', ev => {
  if (ev.target.dataset.f === 'rowtime') {  // a time moved for today; empty = back to the plan
    const t = today(), ov = db.times && db.times.d === t ? db.times.t : {};
    if (ev.target.value) ov[ev.target.dataset.k] = ev.target.value; else delete ov[ev.target.dataset.k];
    db.times = { d: t, t: ov }; save(); keepScroll(route); return;
  }
  if (ev.target.id !== 'import' || !ev.target.files[0]) return;
  const input = ev.target;
  input.files[0].text().then(txt => {
    const data = JSON.parse(txt);
    if (data.v !== 1 || !Array.isArray(data.sessions)) throw new Error('Keine takt-Backup-Datei.');
    if (!confirm(`Backup mit ${data.sessions.length} Einheiten laden? Was jetzt hier liegt, wird ersetzt.`)) return;
    db = fix(Object.assign(EMPTY(), data)); save(); askPersist(); route();
  }).catch(e => alert('Laden fehlgeschlagen: ' + e.message)).finally(() => { input.value = ''; });
});

// ---------- rest timer ----------

const timerEl = document.getElementById('timer');
let timer = null, audio = null, tickId = 0;

function startTimer(sec, name) {
  try { audio = audio || new (window.AudioContext || window.webkitAudioContext)(); audio.resume(); } catch (e) { audio = null; }
  timer = { end: Date.now() + sec * 1000, sec, name, rang: false };
  clearInterval(tickId); tickId = setInterval(tick, 250); tick();
}
function stopTimer() { timer = null; clearInterval(tickId); timerEl.hidden = true; document.body.classList.remove('timing'); }
function tick() {
  if (!timer) return;
  const left = Math.round((timer.end - Date.now()) / 1000);
  timerEl.hidden = false; document.body.classList.add('timing');
  timerEl.classList.toggle('over', left <= 0);
  const pct = Math.min(100, Math.max(0, (1 - left / timer.sec) * 100));
  timerEl.innerHTML = `<div class="tbar"><i style="width:${pct}%"></i></div>
    <div class="tin"><div><span class="tlabel">${left > 0 ? 'Pause' : 'Weiter'} · ${esc(timer.name)}</span><span class="tt">${left < 0 ? '+' : ''}${mmss(Math.abs(left))}</span></div>
    <button class="btn" data-act="stoptimer">${left > 0 ? 'Überspringen' : 'Fertig'}</button></div>`;
  if (left <= 0 && !timer.rang) { timer.rang = true; ring(); }
  if (left < -600) stopTimer();
}
function ring() {
  if (navigator.vibrate) navigator.vibrate([250, 120, 250]);
  if (!audio) return;
  [0, 0.3].forEach(t => {
    const o = audio.createOscillator(), g = audio.createGain();
    o.frequency.value = 880; o.connect(g); g.connect(audio.destination);
    g.gain.setValueAtTime(0.25, audio.currentTime + t);
    g.gain.exponentialRampToValueAtTime(0.001, audio.currentTime + t + 0.25);
    o.start(audio.currentTime + t); o.stop(audio.currentTime + t + 0.26);
  });
}

// iOS lifts fixed bars above the keyboard, over the field you type in: hide the tab bar while typing
document.addEventListener('focusin', ev => { if (ev.target.matches('input:not([type=checkbox]):not([type=file]), textarea')) document.body.classList.add('typing'); });
document.addEventListener('focusout', () => document.body.classList.remove('typing'));

// ---------- boot ----------

document.querySelectorAll('[data-tab]').forEach(a => { a.insertAdjacentHTML('afterbegin', icon(a.dataset.tab)); });
window.addEventListener('hashchange', route);
route();
setTimeout(syncTick, 300);
if ('serviceWorker' in navigator && location.protocol !== 'file:') {
  navigator.serviceWorker.register('sw.js').catch(() => {});
  // a new version took over: reload once so it shows right away, not on the next start
  if (navigator.serviceWorker.controller) navigator.serviceWorker.addEventListener('controllerchange', () => { if (!window._reloaded) { window._reloaded = true; location.reload(); } });
  // drop the worker from when the app lived at /gym/
  navigator.serviceWorker.getRegistrations().then(rs => rs.filter(r => /\/gym\/$/.test(r.scope)).forEach(r => r.unregister())).catch(() => {});
}
