// Balancing helper: plays every Week One path (3^4 = 81) and prints where it lands.
// Usage: node tools/paths.js          (summary + full table)
//        node tools/paths.js --short  (summary only)
const S = require('../story.js');

const scenes = S.WEEK_ONE.scenes;
const rows = [];
const counts = Object.fromEntries(S.ENDING_ORDER.map((id) => [id, 0]));
const comboCounts = Object.fromEntries(S.COMBOS.map((c) => [c.id, 0]));

(function walk(i, picks) {
  if (i === scenes.length) {
    const s = S.newState();
    picks.forEach((c) => {
      S.choose(s, c);
      S.newCombos(s).forEach((combo) => S.applyEffects(s, combo.effects));
    });
    const end = S.pickEnding(s);
    counts[end.id]++;
    s.combos.forEach((id) => comboCounts[id]++);
    if (!end.id || !S.MONTH_ONE.scenes[end.id]) throw new Error('No Month One scene for ending ' + end.id);
    rows.push({ path: picks.map((c) => c.short).join(' / '), cash: s.cash, rep: s.rep, chaos: s.chaos, end: end.id, combos: s.combos.join(',') });
    return;
  }
  for (const c of scenes[i].choices) walk(i + 1, picks.concat(c));
})(0, []);

console.log(`Paths: ${rows.length}`);
console.log('Endings:', counts);
console.log('Combos fired on # paths:', comboCounts);
if (!process.argv.includes('--short')) {
  console.log('');
  for (const r of rows) {
    console.log(
      `${r.end.padEnd(9)} ${S.fmtCash(r.cash).padStart(8)} rep ${String(r.rep).padStart(2)} chaos ${String(r.chaos).padStart(2)}  ${r.path}${r.combos ? '  [' + r.combos + ']' : ''}`
    );
  }
}
