// Balancing helper: plays every Week One path and prints where it lands.
// Each day you tap one of two things, pick one of three options, and every option rolls good or bad.
// Usage: node tools/paths.js          (summary + the 40 most likely outcomes)
//        node tools/paths.js --short  (summary only)
//
// "Chance" assumes a player who picks the thing and the option at random, with every roll at its
// real odds. It's a rough feel for how often each result happens.
const S = require('../story.js');

const days = S.WEEK_ONE.days;
const RESULTS = [...S.FAIL_ORDER, ...S.ENDING_ORDER];

// Applies one pick (choice + roll) to a state; returns a fail id or null.
function step(s, choice, won) {
  S.choose(s, choice, won);
  let fail = S.failCheck(s);
  for (const combo of S.newCombos(s)) {
    if (fail) break;
    S.applyEffects(s, combo.effects);
    fail = S.failCheck(s);
  }
  return fail;
}
const clone = (s) => JSON.parse(JSON.stringify(s));

// Walks every day; `options(day)` returns [{ choice, weight }] to explore. Calls `leaf` with each end.
function walk(options, leaf) {
  (function go(i, s0, p, label) {
    if (i === days.length) return leaf({ id: S.pickEnding(s0).id, p, s: s0, label });
    for (const { choice, weight, spot } of options(days[i])) {
      const o = S.odds(s0, choice) / 100;
      for (const [won, q] of [[true, o], [false, 1 - o]]) {
        if (!q) continue;
        const s = clone(s0);
        const fail = step(s, choice, won);
        const l = label.concat(`${spot.icon}${choice.short}${won ? '★' : '✗'}`);
        if (fail) leaf({ id: fail, p: p * weight * q, s, label: l, failedOn: days[i].day });
        else go(i + 1, s, p * weight * q, l);
      }
    }
  })(0, S.newState(), 1, []);
}

const all = (day) => day.spots.flatMap((spot) => spot.choices.map((choice) => ({ choice, spot, weight: 1 / (day.spots.length * spot.choices.length) })));
const rows = [];
walk(all, (r) => rows.push(r));

const pct = (x) => (x * 100).toFixed(1).padStart(5) + '%';
const name = (id) => (S.FAILS[id] ? 'FAIL ' + S.FAILS[id].title : S.ENDINGS[id].title);

console.log(`Outcomes: ${rows.length} (each thing, option and roll)\n`);
console.log('Result                          Chance');
let failP = 0;
for (const id of RESULTS) {
  const p = rows.filter((x) => x.id === id).reduce((a, x) => a + x.p, 0);
  if (S.FAILS[id]) failP += p;
  console.log(`${name(id).padEnd(32)}${pct(p)}`);
}
console.log(`${'= any game over'.padEnd(32)}${pct(failP)}`);

// Fixed strategies: always the same direction (on a random thing each day). None should be the best way to play.
console.log('\nAlways the same direction (random thing each day):');
for (const dir of ['left', 'right', 'up']) {
  const by = {};
  walk(
    (day) => day.spots.map((spot) => ({ spot, choice: spot.choices.find((c) => c.dir === dir), weight: 1 / day.spots.length })),
    (r) => (by[r.id] = (by[r.id] || 0) + r.p)
  );
  const parts = Object.entries(by)
    .sort((a, b) => b[1] - a[1])
    .map(([id, p]) => `${name(id)} ${Math.round(p * 100)}%`);
  console.log(`  ${dir.padEnd(6)} ${parts.join(', ')}`);
}

// Price check: $2,000 = 1 Rep = 1 Chaos (as a cost). Each option: value at the starting odds (good / bad).
console.log('\nOption values at the start ($2,000 = 1 Rep = -1 Chaos): average (odds: good / bad)');
const val = (e) => (e.cash || 0) / 2000 + (e.rep || 0) - (e.chaos || 0);
const fresh = S.newState();
for (const d of days) {
  for (const spot of d.spots) {
    const parts = spot.choices.map((c) => {
      const o = S.odds(fresh, c) / 100, w = val(c.gamble.win.effects), l = val(c.gamble.lose.effects);
      return `${c.dir[0].toUpperCase()} ${(o * w + (1 - o) * l).toFixed(1)} (${Math.round(o * 100)}%: ${w.toFixed(1)} / ${l.toFixed(1)})`;
    });
    console.log(`  ${d.day.slice(0, 3)} ${(spot.icon + ' ' + spot.name).padEnd(18)} ${parts.join(' · ')}`);
  }
}

if (!process.argv.includes('--short')) {
  console.log('\nThe 40 most likely outcomes (★ = good roll, ✗ = bad roll):');
  for (const r of rows.sort((a, b) => b.p - a.p).slice(0, 40)) {
    const where = r.failedOn ? `  (out on ${r.failedOn})` : '';
    console.log(
      `${r.id.padEnd(10)} ${pct(r.p)} ${S.fmtCash(r.s.cash).padStart(8)} rep ${String(r.s.rep).padStart(2)} chaos ${String(r.s.chaos).padStart(2)}  ${r.label.join(' / ')}${r.s.combos.length ? '  [' + r.s.combos.join(',') + ']' : ''}${where}`
    );
  }
}
