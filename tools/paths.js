// Balancing helper: plays every Week One path, both sides of every Wildcard, and prints where it lands.
// Usage: node tools/paths.js          (summary + full table)
//        node tools/paths.js --short  (summary only)
//
// "Chance" assumes a player who picks each direction at random (1 in 3), with Wildcards
// resolved at their real odds. It's a rough feel for how often each result happens.
const S = require('../story.js');

const scenes = S.WEEK_ONE.scenes;
const RESULTS = [...S.FAIL_ORDER, ...S.ENDING_ORDER];
const rows = [];

// Plays `picks` = [{ choice, won }] from a fresh state, card by card, stopping at a fail line.
function play(picks) {
  const s = S.newState();
  let fail = null;
  let failedOn = null;
  for (let i = 0; i < picks.length && !fail; i++) {
    S.choose(s, picks[i].choice, picks[i].won);
    fail = S.failCheck(s);
    for (const combo of S.newCombos(s)) {
      if (fail) break;
      S.applyEffects(s, combo.effects);
      fail = S.failCheck(s);
    }
    if (fail) failedOn = scenes[i].day;
  }
  return { s, fail, failedOn };
}

// Walks every choice (and both Wildcard results), weighting each branch by its chance.
(function walk(i, picks, p) {
  const { s, fail, failedOn } = play(picks);
  const label = picks.map((x) => x.choice.short + (x.choice.gamble ? (x.won ? '★' : '✗') : '')).join(' / ');
  if (fail || i === scenes.length) {
    const id = fail || S.pickEnding(s).id;
    if (!fail && !S.MONTH_ONE.scenes[id]) throw new Error('No Month One scene for ending ' + id);
    rows.push({ id, p, s, label, failedOn, combos: s.combos.join(',') });
    return;
  }
  for (const c of scenes[i].choices) {
    const pc = p / scenes[i].choices.length;
    if (c.gamble) {
      const o = S.odds(s, c) / 100;
      walk(i + 1, picks.concat({ choice: c, won: true }), pc * o);
      walk(i + 1, picks.concat({ choice: c, won: false }), pc * (1 - o));
    } else walk(i + 1, picks.concat({ choice: c }), pc);
  }
})(0, [], 1);

const pct = (x) => (x * 100).toFixed(1).padStart(5) + '%';
const name = (id) => (S.FAILS[id] ? 'FAIL ' + S.FAILS[id].title : S.ENDINGS[id].title);

console.log(`Outcomes: ${rows.length} (each choice, and each Wildcard as JACKPOT or BUST)\n`);
console.log('Result                          Chance   Outcomes');
let failP = 0;
for (const id of RESULTS) {
  const r = rows.filter((x) => x.id === id);
  const p = r.reduce((a, x) => a + x.p, 0);
  if (S.FAILS[id]) failP += p;
  console.log(`${name(id).padEnd(32)}${pct(p)}   ${String(r.length).padStart(4)}`);
}
console.log(`${'= any game over'.padEnd(32)}${pct(failP)}`);

// Fixed strategies: always the same direction. None of these should be the best way to play.
console.log('\nAlways the same direction (Wildcards at real odds):');
for (const dir of ['left', 'up', 'right']) {
  const by = {};
  (function go(i, picks, p) {
    const { s, fail } = play(picks);
    if (fail || i === scenes.length) {
      const id = fail || S.pickEnding(s).id;
      by[id] = (by[id] || 0) + p;
      return;
    }
    const c = scenes[i].choices.find((x) => x.dir === dir);
    if (c.gamble) {
      const o = S.odds(s, c) / 100;
      go(i + 1, picks.concat({ choice: c, won: true }), p * o);
      go(i + 1, picks.concat({ choice: c, won: false }), p * (1 - o));
    } else go(i + 1, picks.concat({ choice: c }), p);
  })(0, [], 1);
  const parts = Object.entries(by)
    .sort((a, b) => b[1] - a[1])
    .map(([id, p]) => `${name(id)} ${Math.round(p * 100)}%`);
  console.log(`  ${dir.padEnd(6)} ${parts.join(', ')}`);
}

// Price check: every choice valued at $2,000 = 1 Rep = 1 Chaos (as a cost). Wildcards at starting odds.
console.log('\nChoice values ($2,000 = 1 Rep = -1 Chaos). Wildcard: value at the start odds, and its swing.');
const val = (e) => ((e.cash || 0) / 2000 + (e.rep || 0) - (e.chaos || 0));
const fresh = S.newState();
for (const sc of scenes) {
  const parts = sc.choices.map((c) => {
    if (!c.gamble) return `${c.short} ${val(S.evalEffects(fresh, c.effects)).toFixed(1)}`;
    const o = S.odds(fresh, c) / 100;
    const w = val(c.gamble.win.effects), l = val(c.gamble.lose.effects);
    return `${c.short} ${(o * w + (1 - o) * l).toFixed(1)} (${Math.round(o * 100)}%: ${w.toFixed(1)} / ${l.toFixed(1)})`;
  });
  console.log(`  ${sc.day.padEnd(10)} ${parts.join(' · ')}`);
}

if (!process.argv.includes('--short')) {
  console.log('\nEvery outcome (★ = JACKPOT, ✗ = BUST):');
  for (const r of rows.sort((a, b) => RESULTS.indexOf(a.id) - RESULTS.indexOf(b.id))) {
    const where = r.failedOn ? `  (out on ${r.failedOn})` : '';
    console.log(
      `${r.id.padEnd(10)} ${pct(r.p)} ${S.fmtCash(r.s.cash).padStart(8)} rep ${String(r.s.rep).padStart(2)} chaos ${String(r.s.chaos).padStart(2)}  ${r.label}${r.combos ? '  [' + r.combos + ']' : ''}${where}`
    );
  }
}
