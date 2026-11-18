// Regenerates ART_ASSETS.md from the ART table in story.js (and notes where each slot is used).
// Usage: node tools/art-list.js
const fs = require('fs');
const path = require('path');
const S = require('../story.js');

const used = {};
const mark = (id, where) => (used[id] = used[id] || new Set()).add(where);
// A choice's outcome art, or both Wildcard results (JACKPOT / BUST).
const markChoice = (c, where) => {
  if (c.outcome) mark(c.outcome.art, `${where} → ${c.short}`);
  if (c.gamble) {
    mark(c.gamble.win.outcome.art, `${where} → ${c.short} (good roll)`);
    mark(c.gamble.lose.outcome.art, `${where} → ${c.short} (bad roll)`);
  }
};

S.WEEK_ONE.days.forEach((d) =>
  d.spots.forEach((sc) => {
    const where = `L1 ${d.day}: ${sc.icon} ${sc.name} (${sc.title})`;
    sc.cast.forEach((id) => mark(id, where));
    if (sc.prop) mark(sc.prop, where);
    sc.choices.forEach((c) => markChoice(c, where));
  })
);
Object.values(S.MONTH_ONE.scenes).forEach((sc) => {
  const where = `L2: ${sc.title}`;
  sc.cast.forEach((id) => mark(id, where));
  if (sc.prop) mark(sc.prop, where);
  sc.choices.forEach((c) => markChoice(c, where));
});
S.COMBOS.forEach((c) => mark(c.art, `Combo: ${c.title}`));
Object.values(S.ENDINGS).forEach((e) => mark(e.art, `Ending: ${e.title}`));
Object.values(S.FAILS).forEach((f) => mark(f.art, `Game over: ${f.title}`));
mark(S.LOGO_HAGGLE.art, 'L2: The Investor Calls → Negotiate mini-game');
mark('char_founder', 'Friday Review');

const GROUPS = [
  ['character', 'Characters (scene poses)', 'Full or 3/4 body cut-outs, transparent PNG, ~800×1000. They stand on the text panel in front of the 3D town, one on each side when two share a scene.'],
  ['reaction', 'Reactions (outcome cards)', 'Same characters, exaggerated expression/pose, transparent PNG, ~800×1000.'],
  ['prop', 'Props', 'Single object, transparent PNG, ~512×512. Shown small and tilted near the panel.'],
  ['combo', 'Combo cards', 'Gag illustration, ~1200×800, shown like a polaroid over the town. The "COMBO!" burst is drawn by the game.'],
  ['ending', 'Ending cards', 'Hero illustration, ~1200×800, shown like a polaroid over the town. One per Friday Review ending, plus one per game over.'],
];

const unused = Object.keys(S.ART).filter((id) => !used[id]);
const missing = Object.keys(used).filter((id) => !S.ART[id]);

let md = `# Startup Ladder: art asset list

Generated from \`story.js\` by \`node tools/art-list.js\`. Don't edit by hand; edit the \`ART\` table in \`story.js\` and re-run.

**How to drop art in:** save the file into \`art/\` named exactly after the asset id, e.g. \`art/char_mom.png\`
(\`.png\`, \`.webp\`, \`.jpg\`, \`.svg\` or \`.gif\`). Reload the game and the placeholder is replaced; no code changes.
Transparent PNG/WebP works best for characters, reactions and props.

Backgrounds, locations and key art aren't on this list: every card is staged in the 3D Pebblewick town
(see \`stage\` in \`story.js\` and \`SHOTS\` in \`town-stage.js\`).

Total slots: **${Object.keys(S.ART).length}**

Style target: cartoonish, expressive, absurd corporate humour, friendly. The art carries the comedy.
`;

for (const [kind, title, spec] of GROUPS) {
  const ids = Object.keys(S.ART).filter((id) => S.ART[id].kind === kind);
  md += `\n## ${title} (${ids.length})\n\n_${spec}_\n\n| Asset id | Placeholder | Brief | Used in |\n|---|---|---|---|\n`;
  for (const id of ids) {
    const a = S.ART[id];
    const where = used[id] ? [...used[id]].join('<br>') : '_unused_';
    md += `| \`${id}\` | ${a.emoji} | ${a.desc.replace(/\|/g, '\\|')} | ${where} |\n`;
  }
}

fs.writeFileSync(path.join(__dirname, '..', 'ART_ASSETS.md'), md);
console.log(`Wrote ART_ASSETS.md (${Object.keys(S.ART).length} slots).`);
if (unused.length) console.log('Unused ART entries:', unused.join(', '));
if (missing.length) {
  console.log('Referenced but missing from ART:', missing.join(', '));
  process.exitCode = 1;
}
