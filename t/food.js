'use strict';
// Shopping lists, recipes and the food schedule. The app is the only source for the plan.
//
// The schedule hangs on the shopping days, not on weekdays:
//   Startkauf (once, db.foodMon)  -> cook the start pot the same evening
//   Hauptkauf H (db.haupt anchors, every 7 days) -> Notfall-Abend, pot A on H+1 (3 portions)
//   Nachkauf N (H+4, or db.nach[H])              -> pot B the same evening (3 portions)
// Move a shopping day and cooking and dinners move with it.

// ---------- schedule ----------

const HOLIDAYS = ['12-25', '12-26', '01-01'];
const closed = d => wd(d) === 'So' || HOLIDAYS.includes(d.slice(5));
const openDay = (d, dir) => { while (closed(d)) d = addDays(d, dir); return d; };
const later = (a, b) => a > b ? a : b;
const foodStart = () => db.foodMon;

// Every anchor repeats weekly. A date of an older series within 3 days before the next anchor is that same shop, moved.
function hauptDates(until) {
  const a = db.haupt.slice().sort(), out = [];
  a.forEach((x, i) => {
    const nx = a[i + 1];
    for (let h = x; h <= until && (!nx || h < nx); h = addDays(h, 7)) if (h >= foodStart() && (!nx || dayNum(nx) - dayNum(h) > 3)) out.push(h);
  });
  return out;
}
const firstShop = () => hauptDates(addDays(foodStart(), 400))[0];
const hasStart = () => foodStart() < firstShop();

const REZEPTWOCHEN = {
  chili: { name: 'Chili-Woche', a: 'chili', b: 'haehnchen' },
  bolo: { name: 'Bolo-Woche', a: 'bolo', b: 'curry' },
};
const START_POT = 'curry';  // the Kokosmilch is already in the cupboard
const SHORT = { chili: 'Chili', haehnchen: 'Hähnchen-Nudeln', bolo: 'Bolognese', curry: 'Hähnchen-Curry', notfall: 'Notfall-Abend' };

// The Hauptkauf cycle a day belongs to, or null before the first Hauptkauf.
function cycleOf(d) {
  const list = hauptDates(addDays(d, 14)), i = list.filter(h => h <= d).length - 1;
  return i < 0 ? null : cycleAt(list, i);
}
function cycleAt(list, i) {
  const H = list[i], next = list[i + 1] || addDays(H, 7), rw = i % 2 ? 'bolo' : 'chili';
  let N = db.nach[H] || addDays(H, 4);
  if (N <= H || N >= next) N = null;
  const cookA = addDays(H, 1) < next ? addDays(H, 1) : null;
  let cookB = N ? later(N, addDays(H, 4)) : null;
  if (cookB && cookB >= next) cookB = null;
  return { H, next, N, cookA, cookB, i, rw, a: REZEPTWOCHEN[rw].a, b: REZEPTWOCHEN[rw].b };
}
// all pots cooked around day d: [{ date, id }]
function potsNear(d) {
  const out = [], S = foodStart(), A = firstShop();
  if (dayNum(A) - dayNum(S) >= 2) out.push({ date: S, id: START_POT });
  const list = hauptDates(addDays(d, 14)), i = list.filter(h => h <= d).length - 1;
  for (const j of [i - 1, i]) if (j >= 0) {
    const c = cycleAt(list, j);
    if (c.cookA) out.push({ date: c.cookA, id: c.a });
    if (c.cookB) out.push({ date: c.cookB, id: c.b });
  }
  return out;
}
// What happens on day d: { pre, shop: 'erst'|'haupt'|'nach'|null, cook: recipe id|null, dinner: { id, label }, cycle }
function foodDay(d) {
  const S = foodStart(), c = cycleOf(d);
  if (d < S) return { pre: true, shop: null, cook: null, dinner: { id: 'notfall', label: 'aus dem Vorrat' }, cycle: null };
  const shop = c && c.H === d ? 'haupt' : c && c.N === d ? 'nach' : d === S ? 'erst' : null;
  // the freshest pot that still has a portion: cooked today, yesterday or the day before
  const pot = potsNear(d).filter(p => p.date <= d && dayNum(d) - dayNum(p.date) <= 2).sort((x, y) => x.date < y.date ? 1 : -1)[0];
  const n = pot ? dayNum(d) - dayNum(pot.date) + 1 : 0;
  return { pre: false, shop, cook: n === 1 ? pot.id : null, cycle: c,
    dinner: pot ? { id: pot.id, label: `${SHORT[pot.id]} (${n}/3)` } : { id: 'notfall', label: SHORT.notfall } };
}
const SHOP_LABEL = { erst: 'Startkauf', haupt: 'Hauptkauf', nach: 'Nachkauf' };

// The next date of each shop from day t on (null if there is none).
function nextShop(kind, t) {
  if (kind === 'erst') return hasStart() && foodStart() >= t ? foodStart() : null;
  if (kind === 'haupt') return hauptDates(addDays(later(t, foodStart()), 21)).find(h => h >= t);
  let c = cycleOf(t);
  if (c && c.N && c.N >= t) return c.N;
  c = cycleOf(c ? c.next : firstShop());
  return c.N;
}
// Where a shop may move to: one open day earlier or later, inside its limits. Returns [earlier, later], null = not possible.
function moveTargets(kind, date, t) {
  const ok = to => {
    if (!to || to < t || to === date || closed(to)) return false;
    if (kind === 'erst') return dayNum(firstShop()) - dayNum(to) >= 2;
    if (kind === 'nach') { const c = cycleOf(date); return to > c.H && to < c.next; }
    const prev = hauptDates(date).filter(h => h < date).pop();
    return Math.abs(dayNum(to) - dayNum(date)) <= 3 && to > addDays(prev || foodStart(), 1);
  };
  const e = openDay(addDays(date, -1), -1), l = openDay(addDays(date, 1), 1);
  return [ok(e) ? e : null, ok(l) ? l : null];
}
function moveShop(kind, date, to) {
  const id = kind, st = db.shop[id];
  if (kind === 'erst') {
    const A = firstShop();
    db.foodMon = to;
    if (dayNum(A) - dayNum(to) < 2) db.haupt = db.haupt.filter(h => h > A).concat(to);  // too close to the Hauptkauf: one big shop instead
  } else if (kind === 'haupt') {
    delete db.nach[date];
    db.haupt = db.haupt.filter(h => h !== date).concat(to);
  } else db.nach[cycleOf(date).H] = to;
  if (st && st._for === date) st._for = to;
  save();
}
// A shop of the last 3 days that was never ticked: { kind, date } or null.
function missedShop(t) {
  const c = cycleOf(t), S = foodStart();
  const cand = [['erst', hasStart() && (!c || c.H > S) ? S : null], ['haupt', c && c.H], ['nach', c && c.N]]
    .filter(([k, d]) => d && d < t && dayNum(t) - dayNum(d) <= 3).sort((x, y) => x[1] < y[1] ? 1 : -1)[0];
  if (!cand) return null;
  const [kind, date] = cand, st = db.shop[kind] || {};
  if (st._for === date && Object.keys(st).some(k => k[0] !== '_' && st[k] || k === '_ok')) return null;
  if (foodDay(t).shop) return null;  // today is a shopping day anyway
  return { kind, date };
}
function shopDone(kind, date) { db.shop[kind] = { _for: date, _ok: 1 }; save(); }
// Ticks belong to one shopping date; the next date starts with an empty list.
function shopState(id, date) {
  const st = db.shop[id] || {};
  return st._for === date ? st : { _for: date };
}

// ---------- shopping lists ----------

const HAVE = 'Schon im Schrank, nur prüfen';
// Startkauf: only what is needed until the first Hauptkauf.
function startList() {
  const S = foodStart(), A = firstShop(), n = dayNum(A) - dayNum(S);
  const days = Array.from({ length: n }, (_, i) => addDays(S, i + 1));          // S+1 .. A: breakfasts and lunches
  const oats = days.filter(d => wd(d) !== 'Fr' || urlaub(d)).length, brote = days.filter(d => wd(d) !== 'Do').length;
  const notfall = Math.max(0, n - 3), pot = n >= 2;
  const cool = [`Magerquark, ${Math.ceil(n / 2)} × 500 g · Snacks`, `Hüttenkäse, ${brote + notfall} × 200 g · Mittag` + (notfall ? ' und Notfall-Abend' : '')];
  if (oats) cool.unshift(`Skyr natur, ${Math.ceil(oats / 2)} × 500 g · Oats`);
  if (pot) cool.push('Hähnchenbrustfilet, eine Packung (500–600 g) · heute kochen');
  const groups = [
    ['Kühlregal', cool],
    ['Obst und Gemüse', [`Bananen, ${Math.max(oats, 1)} · Oats`, `Äpfel, ${n} · Snacks`, 'Gurke, 1 · Mittag']],
    ['Regal', ['Haferflocken, 500 g', 'Vollkornbrot, 750 g · was nach 3 Tagen übrig ist, einfrieren', `H-Milch 1,5 %, ${Math.ceil(n / 2) + 1} l`, 'Erdnüsse ungesalzen oder Nüsse, 200 g']],
  ];
  if (pot) groups.push(['Tiefkühl', ['TK-Blattspinat, portionierbar, 750 g · Curry, der Rest hält']]);
  groups[2][1].push('Tomatenmark, 1 Tube · hält Wochen', 'Zimt, Senf, Paprika edelsüß · einmal, hält Monate');
  groups.push([HAVE, (pot ? ['Kokosmilch, 1 Dose · Curry', 'Reis, 250 g · Curry', 'Rote Zwiebel · Curry', 'Currypulver · sonst mitnehmen'] : []).concat([`Eier, ${2 * brote + 3 * notfall} Stück · Mittag`, 'Honig, Öl, Salz, Pfeffer'])]);
  return { id: 'erst', cost: `${18 + 4 * n} €`, groups,
    intro: `Reicht bis zum Hauptkauf (${dayDate(A)}).` + (pot ? ' Abends gleich das Curry kochen, das sind 3 Abendessen.' : '') + ' Etwa' };
}
function hauptList(c) {
  const chili = c.rw === 'chili', tr = trainingOn();
  return { id: 'haupt', cost: 'ca. 40–45 €',
    intro: `Reicht 7 Tage. Morgen ${SHORT[c.a]} kochen.` + (c.i < 2 ? ' Die Dosen hast du schon: prüfen und abhaken.' : ''),
    groups: [
      ['Obst und Gemüse', [
        tr ? 'Bananen, 8–9, ein paar noch grün · Oats und vor dem Training' : 'Bananen, 6–7, ein paar noch grün · Oats',
        'Gurke, 1 · Mittag', chili ? 'Zwiebeln, 2 · Chili und Hähnchen-Nudeln' : 'Zwiebeln, 2 · Möhren, 2 · Bolognese und Curry',
      ]],
      ['Kühlregal', [
        'Skyr natur, 3 × 500 g · Oats · im Urlaub 4 × 500 g',
        'Magerquark, 4 × 500 g · Snacks',
        'Hüttenkäse, 7 × 200 g · Mittag und Notfall-Abend',
        'Eier, 2 × 10 Stück · Mittag und Notfall-Abend',
        `Hackfleisch gemischt, 500 g · morgen kochen, Verbrauchsdatum prüfen`,
      ]],
      ['Dosen und Regal', chili
        ? ['Passierte oder gehackte Tomaten, 2 × · Chili und Hähnchen-Nudeln', 'Kidneybohnen, 1 Dose · Mais, 1 Dose', 'H-Milch 1,5 %, auf 4 l auffüllen']
        : ['Passierte oder gehackte Tomaten, 1 × · Bolognese', 'Kokosmilch, 1 Dose · Curry', 'H-Milch 1,5 %, auf 4 l auffüllen']],
      ['Nur wenn leer', [
        chili ? 'Reis, 500 g (Chili braucht 375 g)' : 'Reis, 500 g (Curry braucht 250 g)',
        'Haferflocken, 500 g (600 g pro Woche)',
        chili ? 'Vollkornnudeln, 500 g (330 g für die Hähnchen-Nudeln)' : 'Vollkornspaghetti, 500 g (375 g für die Bolognese)',
        'Erdnüsse ungesalzen oder Nüsse, 200 g',
        'TK-Blattspinat, portionierbar, 750 g (300 g pro Woche)',
        'Tomatenmark, 1 Tube',
        'Honig, Öl, Salz, Pfeffer, Senf',
        'Gewürze, einmal für Monate: Paprika edelsüß, Italienische Kräuter, Zimt, ' + (chili ? 'Kreuzkümmel, Backkakao' : 'Currypulver'),
      ]],
    ] };
}
function nachList(c) {
  return { id: 'nach', cost: 'ca. 13–15 €',
    intro: `Danach direkt ${SHORT[c.b]} kochen, das sind 3 Abendessen.`,
    groups: [['', [
      'Hähnchenbrustfilet, eine Packung (500–600 g) · heute kochen',
      'Vollkornbrot, 2 × 750 g · eins sofort einfrieren, in 2 Tagen in den Kühlschrank',
      'Äpfel, 8 · Snacks',
      'Gurke, 1 · Mittag',
      'Milch, wenn alle',
    ]]] };
}

// ---------- recipes ----------

const RECIPES_INTRO = 'Nach dem Kochen etwa 30 min abdampfen lassen, dann zu und in den Kühlschrank. Hält 3 Tage. Aufwärmen in der Mikrowelle, Deckel locker drauf, nach der Hälfte umrühren, bis es dampft.';

const RECIPES = [
  {
    id: 'oats', title: 'Overnight Oats', when: 'abends, 5 min',
    items: ['100 g Haferflocken', '250 g Skyr (ein halber Becher)', '200 ml Milch', '½ TL Zimt, 1 Prise Salz', '1 Banane, morgens'],
    steps: [
      'Haferflocken, Skyr, Milch, Zimt und Salz in die Dose, gründlich rühren, bis keine trockenen Flocken mehr zu sehen sind. Das Salz schmeckt man nicht, es macht die Oats runder.',
      'Zu, über Nacht in den Kühlschrank.',
      'Morgens umrühren, zu fest: ein Schluck Milch. Banane in Scheiben drauf.',
    ],
    vary: [
      ['Schoko-Banane', '1 TL Backkakao und 1 TL Honig statt Zimt, Banane abends schon zerdrückt mit rein'],
      ['Apfelkuchen', '½ Apfel klein geschnitten mit rein, Zimt bleibt, 1 TL Honig'],
      ['Erdnuss', 'eine kleine Handvoll Erdnüsse grob gehackt morgens drauf, 1 TL Honig'],
    ],
  },
  {
    id: 'brote', title: 'Brote mit Ei-Aufstrich', when: 'am Vorabend, 5 min',
    items: ['4 Scheiben Vollkornbrot', '2 gekochte Eier', '200 g Hüttenkäse (ein Becher)', '1 TL Senf, Salz, Pfeffer, 1 Prise Paprika edelsüß', '½ Gurke'],
    steps: [
      '<b>Eier, einmal für mehrere Tage:</b> beim Kochen 8 Eier 10 min mitkochen, kalt abschrecken, ungeschält in den Kühlschrank. Sie halten eine Woche.',
      '<b>Aufstrich:</b> Eier schälen und mit der Gabel zerdrücken, mit Hüttenkäse, Senf, Salz, Pfeffer und Paprika verrühren. Schmeckt wie Eiersalat, ohne Mayo.',
      'Aufstrich in eine kleine Dose, Brot und Gurke extra. Erst beim Essen aufs Brot, sonst weicht es durch.',
    ],
    vary: [
      ['Kimchi-Ei', '1 EL Kimchi klein geschnitten in den Aufstrich, Senf weglassen'],
      ['Kräuter', '1 TL Italienische Kräuter und etwas Knoblauchpulver statt Senf'],
      ['Aufschnitt', '100 g Hähnchenaufschnitt statt der Eier. Schneller, aber rund 5 € mehr pro Woche'],
    ],
  },
  {
    id: 'quark', title: 'Quark-Snack', when: '3 min',
    items: ['250 g Magerquark, 1 Apfel, 1 TL Honig, ½ TL Zimt'],
    text: 'Quark mit einem Schluck Milch cremig rühren, Honig und Zimt rein, Apfel klein schneiden und unterheben.',
    vary: [
      ['Schoko', '1 TL Backkakao und 2 TL Honig statt Zimt, Apfel oder Banane dazu'],
      ['Erdnuss-Honig', 'ein paar Erdnüsse gehackt und Honig oben drauf, Apfel dazu'],
    ],
  },
  {
    id: 'haehnchen', title: 'Hähnchen-Nudeln mit Spinat', when: '3 Portionen, 35 min', batch: true,
    text: 'Pro Portion ca. 720 kcal, 60 g Eiweiß.',
    items: ['1 Packung Hähnchenbrustfilet (500–600 g)', '330 g Vollkornnudeln oder -spaghetti', '300 g TK-Blattspinat', '1 Zwiebel', '1 EL Tomatenmark', '1 Packung oder Dose passierte oder gehackte Tomaten (400–500 g)', '1 EL Öl', '2 TL Paprika edelsüß, 1 TL Knoblauchpulver, 2 TL Italienische Kräuter, 1 TL Honig, Chilisalz'],
    steps: [
      '<b>Wasser:</b> großen Topf mit 3 l Wasser aufsetzen. Zwiebel würfeln.',
      '<b>Würzen:</b> Hähnchen in Streifen schneiden, mit Paprika, Knoblauchpulver und 1 TL Salz mischen. Danach Brett, Messer und Hände waschen.',
      '<b>Anbraten (8 min):</b> Öl richtig heiß werden lassen, Hähnchen rein und 2 min nicht anfassen, dann wenden. Die braune Kruste ist der Geschmack.',
      '<b>Sauce (10 min):</b> Zwiebel dazu, 2 min mitbraten. Tomatenmark 1 min mitrösten, dann Tomaten, Spinat gefroren und Kräuter rein. Deckel drauf, köcheln, bis der Spinat aufgetaut ist.',
      '<b>Nudeln:</b> im kochenden Wasser mit 1 EL Salz nach Packung kochen. Vor dem Abgießen eine halbe Tasse Nudelwasser aufheben.',
      '<b>Fertig:</b> Honig in die Sauce, mit Chilisalz abschmecken. Nudeln und ein Schluck Nudelwasser untermischen, so wird es cremig. In 3 Portionen teilen.',
    ],
  },
  {
    id: 'chili', title: 'Chili con Carne', when: '3 Portionen, 35 min', batch: true,
    text: 'Pro Portion ca. 1.000 kcal, 50 g Eiweiß. Am zweiten Tag schmeckt es am besten.',
    items: ['500 g Hackfleisch', '1 Zwiebel', '1 EL Tomatenmark', '1 Dose Kidneybohnen, 1 Dose Mais', '1 Packung oder Dose passierte oder gehackte Tomaten (400–500 g)', '375 g Reis', '2 TL Paprika edelsüß, 1 TL Kreuzkümmel, 1 TL Knoblauchpulver, 1 TL Backkakao, 1 TL Honig, Chilisalz'],
    steps: [
      '<b>Reis:</b> im zweiten Topf nach Packung kochen. Zwiebel würfeln.',
      '<b>Hack (8 min):</b> großen Topf ohne Öl heiß werden lassen, Hack rein, flach drücken und 3 min nicht rühren, bis es unten braun ist. Dann zerteilen und fertig braten. Zwiebel nach der Hälfte dazu.',
      '<b>Rösten (1 min):</b> Tomatenmark, Paprika, Kreuzkümmel und Knoblauchpulver aufs Hack, 1 min rühren, bis es duftet.',
      '<b>Köcheln (15 min):</b> Tomaten, Bohnen und Mais (abgegossen), Kakao und Honig dazu. Aufkochen, dann auf niedrig, Deckel halb drauf. Kakao und Honig schmeckt man nicht raus, sie machen es rund.',
      '<b>Fertig:</b> mit Chilisalz abschmecken. In 3 Portionen, je ein Drittel Reis dazu.',
    ],
  },
  {
    id: 'curry', title: 'Hähnchen-Curry mit Reis', when: '3 Portionen, 35 min', batch: true,
    text: 'Pro Portion ca. 720 kcal, 50 g Eiweiß.',
    items: ['1 Packung Hähnchenbrustfilet (500–600 g)', '1 Zwiebel (die rote geht)', '1 Dose Kokosmilch (400 ml)', '1 EL Tomatenmark', '300 g TK-Blattspinat', '250 g Reis', '1 EL Öl (Wok-Öl)', '2 EL Currypulver, 1 TL Knoblauchpulver, 1 TL Honig, Salz, zum Schluss ein paar Tropfen Sesamöl'],
    steps: [
      '<b>Reis:</b> im zweiten Topf nach Packung kochen. Zwiebel würfeln.',
      '<b>Hähnchen (8 min):</b> in mundgerechte Stücke schneiden, salzen, danach Brett, Messer und Hände waschen. Öl richtig heiß werden lassen, Hähnchen rein und 2 min nicht anfassen, dann rundum braun braten.',
      '<b>Rösten (2 min):</b> Zwiebel dazu, 1 min mitbraten. Currypulver, Knoblauchpulver und Tomatenmark 1 min mitrühren, bis es duftet. Das macht den Unterschied zu Curry aus dem Glas.',
      '<b>Köcheln (10 min):</b> Kokosmilch und Spinat gefroren dazu, Deckel drauf, bis der Spinat aufgetaut ist.',
      '<b>Fertig:</b> Honig rein, mit Salz abschmecken, ein paar Tropfen Sesamöl drüber. Reis auf 3 Dosen verteilen, Curry drauf.',
    ],
  },
  {
    id: 'bolo', title: 'Bolognese', when: '3 Portionen, 35 min', batch: true,
    text: 'Pro Portion ca. 950 kcal, 50 g Eiweiß. Am zweiten Tag schmeckt sie am besten.',
    items: ['500 g Hackfleisch', '1 Zwiebel, 2 Möhren', '1 EL Tomatenmark', '1 Packung oder Dose passierte oder gehackte Tomaten (400–500 g)', '375 g Vollkornspaghetti', '1 TL Knoblauchpulver, 2 TL Italienische Kräuter, 1 TL Paprika edelsüß, 1 TL Honig, Salz, Pfeffer'],
    steps: [
      '<b>Vorbereiten:</b> großen Topf mit 3 l Wasser aufsetzen. Zwiebel würfeln, Möhren grob reiben oder klein würfeln. Die Möhren machen die Sauce süßer und sämiger.',
      '<b>Hack (8 min):</b> zweiten Topf ohne Öl heiß werden lassen, Hack rein, flach drücken und 3 min nicht rühren, bis es unten braun ist. Dann zerteilen, Zwiebel und Möhren dazu, 3 min mitbraten.',
      '<b>Rösten (1 min):</b> Tomatenmark, Knoblauchpulver und Paprika 1 min mitrühren.',
      '<b>Köcheln (15 min):</b> Tomaten, Kräuter und Honig dazu, aufkochen, dann auf niedrig. Mit Salz und Pfeffer abschmecken.',
      '<b>Spaghetti:</b> mit 1 EL Salz nach Packung kochen, einen Schluck Nudelwasser in die Sauce. Auf 3 Dosen verteilen.',
    ],
  },
  {
    id: 'notfall', title: 'Notfall-Abend', when: '5–10 min',
    items: ['3 Scheiben Vollkornbrot', '3 Eier', '200 g Hüttenkäse', 'Wok-Öl, Chilisalz, Pfeffer', '½ Gurke'],
    text: 'Rührei-Brot: Eier in der Pfanne mit etwas Wok-Öl bei mittlerer Hitze stocken lassen, dabei nur langsam schieben. Hüttenkäse aufs Brot, Rührei drauf, Chilisalz und Pfeffer drüber, Gurke dazu.',
    vary: [
      ['Kalt', 'gekochte Eier in Scheiben statt Rührei, Senf aufs Brot'],
      ['Kimchi-Reis', '125 g Reis kochen, 4 Spiegeleier in Wok-Öl, 2–3 EL Kimchi, ein paar Tropfen Sesamöl'],
      ['Bohneneintopf aus der Dose', 'heiß machen, Pfeffer und Knoblauchpulver rein, 2 Scheiben Brot dazu'],
      ['Spaghetti mit Bolognese aus dem Glas', '125 g Vollkornspaghetti kochen, Sauce heiß machen, ein Becher Hüttenkäse dazu fürs Eiweiß'],
      ['Ramen', 'nur wenn nichts anderes da ist: 2 Eier in der Brühe stocken lassen, ein paar Tropfen Sesamöl. Wenig Eiweiß, eher ein Snack'],
    ],
  },
];

// ---------- meals ----------

const MEALS = [
  ['Frühstück', 'Oats: 100 g Haferflocken, 250 g Skyr, 200 ml Milch, 1 Banane', '725', '48 g', 'oats'],
  ['Mittag', '4 Scheiben Vollkornbrot, Aufstrich aus 2 Eiern und 200 g Hüttenkäse, Gurke', '790', '54 g', 'brote'],
  ['Snack', '250 g Magerquark, 1 Apfel, 1 TL Honig, Zimt', '280', '30 g', 'quark'],
  ['Abend', 'vorgekochte Portion', '850', '50 g'],
  ['Extra', '300 ml Milch, 30 g Nüsse', '320', '16 g'],
];
const FEEL = [
  ['Hose sitzt gleich oder lockerer, Gewichte im Log steigen', 'passt'],
  ['oft hungrig, schlapp im Training, Hose deutlich lockerer', 'einen Quark-Snack dazu'],
  ['Hose wird über 3 Wochen enger', 'Nüsse und Abendmilch weglassen'],
];
const feel = () => trainingOn() ? FEEL : [['Hose sitzt gleich oder lockerer', 'passt'], ['oft hungrig, schlapp, Hose deutlich lockerer', 'einen Quark-Snack dazu'], FEEL[2]];

// Calendar facts tied to real dates.
const URLAUB = ['2026-12-14', '2027-01-10'];
const DATE_NOTES = {
  '2026-12-24': 'Prüfen, ob der Döner offen hat.',
  '2026-12-31': 'Prüfen, ob der Döner offen hat.',
};
const urlaub = d => d >= URLAUB[0] && d <= URLAUB[1];
