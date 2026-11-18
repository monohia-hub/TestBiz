# Startup Ladder (working title): playable prototype

Mobile-first swipe-card prototype covering **Level 1 "Week One"** (4 scenes, 4 combos, 3 ways to lose, Friday Review with 6 endings),
the six **Level 2 "Month One"** openings, and a **"To be continued: Level 3"** card. Plain HTML/CSS/JS, no build step.

It's staged in **Pebblewick**, the 3D town from the `forest-mockup` prototype. The town fills the screen behind the cards,
and each card flies the camera to its location (your room, your front yard, the town square, the bakery, Mom's house…)
while the day/night clock moves from Monday morning to Friday night, then on to Month One.

## Play it online

https://monohia-hub.github.io/TestBiz/ (GitHub Pages, served straight from `main`; the repo is public, so the page is too).

## Run it

Needs Node (no install step). From this folder:

```bash
node server.js
```

Then open http://localhost:5174. Three.js loads from the jsDelivr CDN.

The town's layout and models come from a `town/` folder next to `server.js` when there is one (the copy bundled in the
repo). Without it, the server falls back to a sibling `../forest-mockup` folder, which is how the original workspace
shares one town between both prototypes.

**Controls:** swipe the card ← ↑ → (← Hustle, ↑ Wildcard, → Heart), or tap a choice button.
On desktop: ← ↑ → or 1 2 3. Continue cards: tap or swipe the card, Enter, or Space.

On a phone the town shows in the band between the meters and the text panel. On screens 900px or wider the cards dock
on the right and the town gets the rest of the screen.

## Files

| File | What it is |
|---|---|
| `story.js` | **All content and rules**: copy, meter effects, combos, ending rules, Level 2 scenes, where each card is staged, art slot list |
| `game.js` | Card UI: swipe/tap/keyboard input, HUD meters, card flow, logo-haggle mini-game, tells the stage which shot to show |
| `town-stage.js` | The 3D stage: a copy of `forest-mockup/js/town.js` without walking, tags or the PC, plus camera shots and time-of-day changes |
| `style.css` | Cartoon card look over the town (mobile-first; cards dock right on wide screens) |
| `server.js` | Zero-dependency static server on port 5174. Lists `art/` for drop-in art and serves the town under `/town/` (read-only) |
| `town/` | Bundled copy of the Pebblewick town: `js/town-layout.js` and `assets/` (KayKit nature models, CC0; the room model) |
| `ART_ASSETS.md` | Brief for the concept artist: all 42 art slots, where each is used |
| `tools/paths.js` | `node tools/paths.js` plays every Week One path and both sides of every Wildcard, and prints the odds of each ending and game over, fixed strategies, and each choice's value |
| `tools/art-list.js` | `node tools/art-list.js` regenerates `ART_ASSETS.md` from `story.js` |

## Staging in the town

Every card can carry `stage: { shot, day, hour }` in `story.js` (day 1 = Monday of Week One). A card without one keeps
the previous shot. Moving forward in time animates the sky through the hours in between; going back (Play again) jumps.

| Shot | Where | Used for |
|---|---|---|
| `overview` | Whole town, slow orbit | Title (Sunday evening), Month One intro, Accidental Viral, Unicorn |
| `home_front` | Your house from Willow Lane | Week One intro, The Garage, The Investor Calls, Broke but Legit, Total Meltdown, Bankrupt and Combustion game overs |
| `home_room` | Inside your room, roof cut away | The Name, The Intern, Friday Review, 10,000 Users / 1 Server |
| `square` | Fountain, Town Hall behind | The First Customer, Blorp Jingle combo, Wholesome ending, Forgotten game over |
| `office` | General Store (the glass office) | Amazing on Paper combo |
| `post_office` | Post Office | Small Startup With Big Heart combo (the local paper), The Magazine Cover (Unicorn's Month One) |
| `town_hall` | Town Hall | Live Demo, Live Disaster combo, Fake It ending |
| `bakery` | Bakery | The Fan Letter (Grandma's bakery) |
| `inn` | Inn | The Demo Returns (where the CEO stays) |
| `moms_house` | House 02, across the lane from yours | Mom's Basement |
| `park` | Pond and dock | "Pivot to something absurd" outcome (LinkedIn for Ducks) |
| `sky` | High over the valley at dawn | To be continued |

Shots are defined in `SHOTS` in `town-stage.js`. Most are computed from the building positions in
`town/js/town-layout.js` (or `forest-mockup/js/town-layout.js` locally), so they follow the town if buildings move. Anything standing between the camera and
the subject fades out.

If the town can't load (no WebGL, CDN unreachable), the game still plays on the paper background. `?nostage=1` turns the
town off on purpose.

## Meters and endings

Start: 💰 $8,000, 🌟 Rep 4/10, 🔥 Chaos 3/10.

### The decision rules

Every Week One card offers the same three stances, always in the same direction, so players can learn the logic:

| Swipe | Stance | What it does |
|---|---|---|
| ← | **Hustle** | Money now, mess later. Cash up big, Chaos up, usually Rep down a little. |
| ↑ | **Wildcard** | The absurd gamble. A needle spins: JACKPOT is the best result on the card, BUST the worst. |
| → | **Heart** | Do the right thing and pay for it. Rep up, Chaos down, costs some Cash. |

**Wildcard odds** come from the meters, and the button shows them before you swipe:
50% + 5% × (Rep − Chaos) + the card's own bias, kept between 15% and 85%. People forgive a beloved founder, and
nothing works in a burning garage. So Hearts set up later gambles, and Hustles make them worse.

**Pricing.** Choices are priced at $2,000 ≈ 1 Rep ≈ 1 Chaos (as a cost). Hustles and Hearts are each worth about +1.5
to +2. A Wildcard roughly breaks even at the starting odds, swings about +5 / −6, and pays off once you've
earned better odds. `node tools/paths.js` prints every card's values so new cards can be priced the same way.

### Losing and winning

- **Game over:** Cash $0 (**Bankrupt**), Rep 0 (**Forgotten**) or Chaos 10 (**Spontaneous Combustion**) ends the run
  on the spot, after the card that caused it. Meters near a fail line pulse red.
- **Win:** the **Unicorn** ending at the Friday Review.

The Friday Review reads each meter as LOW / MID / HIGH (Cash: LOW under $12k, HIGH $20k+; Rep and Chaos: LOW ≤3,
HIGH ≥7) and takes the first matching rule:

1. **Unicorn** (the win): Cash HIGH, Rep HIGH, Chaos MID
2. **Accidental Viral**: Rep HIGH, Chaos HIGH
3. **Broke but Legit**: Rep HIGH, Cash LOW
4. **The Wholesome Startup**: Rep HIGH, everything else
5. **Fake It Till You Make It**: Cash HIGH without high Rep
6. **Total Meltdown**: everything else (the survivable bottom; Month One opens in Mom's basement)

`node tools/paths.js` plays every choice and both sides of every Wildcard. For a player picking at random:
game over 26% (Combustion 14, Forgotten 8, Bankrupt 4), Unicorn 12%, and the middle endings 7–19% each
(Fake It 19, Wholesome 15, Meltdown 11, Viral 10, Broke but Legit 8). Single-minded play doesn't work:
always ← ends Forgotten, always ↑ usually combusts (15% go Viral), always → ends Broke but Legit.

### How a decision's weight is shown

- **Before you commit:** each choice button names its stance and lists the meters it moves, with 1–3 arrows for size
  (💰▲▲▲ = a big cash gain); a Wildcard shows its odds instead (🎲55%). While you swipe toward a choice, hover it or
  tab to it, those meters lift in the HUD with the same arrows.
- **When it lands:** big tokens (e.g. **💰 −$6,000 ▼▼▼**) pop up over the town, then fly into their meters. Big ones get a
  BIG! sticker and shake the HUD.
- **On the meter:** it flashes, counts up or down, lights up the part of the bar or pips that changed, and keeps a +/− tag
  until your next decision. The outcome card repeats the same numbers as chips under the title.
- **Size tiers:** Cash $2,000 / $5,000+; Rep and Chaos 2 / 3+ points.
- **Colours:** Cash and Rep go green up / red down. Chaos isn't good or bad, so it heats up (orange) or cools down (blue).

All of this lives in the "HUD + decision impact" section of `game.js`. In the browser console, `SL.impact({ cash: -6000, rep: 2 })`
replays an impact. `?luck=win` or `?luck=lose` on the URL forces every Wildcard result, for testing.

Notes:
- Month One's openings still use their original choices; they don't follow the three stances yet. Game over applies there too.
- The Meltdown "Mom's basement restart bonus" is the **Basement Bonus** (+$500, +1 Rep, pep talk) that opens Level 2's Mom's Basement scene.
- The questionable idea is "an app that reminds you to drink water. Passive-aggressively." Gail's feature ask (a Leg Day Lie Detector) builds on it.

## Dropping in art

Save an image into `art/` named after its slot id (e.g. `art/char_mom.png`) and reload. The placeholder is replaced
automatically. Characters and reactions stand in front of the town like cut-outs, so transparent PNGs work best.
See `ART_ASSETS.md` for the full list and briefs.

The live GitHub Pages site has no server to list the folder, so it reads `art/_list.json` instead. When you push art,
add each file name to that list too, e.g. `["char_mom.png", "react_mom_beaming.png"]`. `node server.js` ignores the
file and lists the folder itself.

`?fast=1` on the URL skips animations and camera flights and makes card transitions synchronous; it exists for automated
path testing.
