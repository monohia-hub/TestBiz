# Startup Ladder (working title): playable prototype

Mobile-first swipe-card prototype covering **Level 1 "Week One"** (4 scenes, 4 combos, Friday Review with 5 endings),
the five **Level 2 "Month One"** openings, and a **"To be continued: Level 3"** card. Plain HTML/CSS/JS, no build step.

It's staged in **Pebblewick**, the 3D town from the `forest-mockup` prototype. The town fills the screen behind the cards,
and each card flies the camera to its location (your room, your front yard, the town square, the bakery, Mom's house…)
while the day/night clock moves from Monday morning to Friday night, then on to Month One.

## Run it

Needs Node (no install step). From this folder:

```bash
node server.js
```

Then open http://localhost:5174. Three.js loads from the jsDelivr CDN.

The town's layout and models come from a `town/` folder next to `server.js` when there is one (the copy bundled in the
repo). Without it, the server falls back to a sibling `../forest-mockup` folder, which is how the original workspace
shares one town between both prototypes.

**Controls:** swipe the card ← ↑ → (each direction is one choice), or tap a choice button.
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
| `tools/paths.js` | `node tools/paths.js` plays all 81 Week One paths and prints the ending each one gets |
| `tools/art-list.js` | `node tools/art-list.js` regenerates `ART_ASSETS.md` from `story.js` |

## Staging in the town

Every card can carry `stage: { shot, day, hour }` in `story.js` (day 1 = Monday of Week One). A card without one keeps
the previous shot. Moving forward in time animates the sky through the hours in between; going back (Play again) jumps.

| Shot | Where | Used for |
|---|---|---|
| `overview` | Whole town, slow orbit | Title (Sunday evening), Month One intro, Accidental Viral |
| `home_front` | Your house from Willow Lane | Week One intro, The Garage, The Investor Calls, Broke but Legit, Total Meltdown |
| `home_room` | Inside your room, roof cut away | The Name, The Intern, Friday Review, 10,000 Users / 1 Server |
| `square` | Fountain, Town Hall behind | The First Customer, Blorp Jingle combo, Wholesome ending |
| `office` | General Store (your rented office) | "Rent an office" outcome, Amazing on Paper combo |
| `post_office` | Post Office | Small Startup With Big Heart combo (the local paper) |
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

Start: 💰 $10,000, 🌟 Rep 2/10, 🔥 Chaos 2/10.

### How a decision's weight is shown

- **Before you commit:** each choice button lists the meters it moves, with 1–3 arrows for size (💰▲▲▲ = a big cash gain).
  While you swipe toward a choice, hover it or tab to it, those meters lift in the HUD with the same arrows.
- **When it lands:** big tokens (e.g. **💰 −$6,000 ▼▼▼**) pop up over the town, then fly into their meters. Big ones get a
  BIG! sticker and shake the HUD.
- **On the meter:** it flashes, counts up or down, lights up the part of the bar or pips that changed, and keeps a +/− tag
  until your next decision. The outcome card repeats the same numbers as chips under the title.
- **Size tiers:** Cash $2,000 / $5,000+; Rep and Chaos 2 / 3+ points.
- **Colours:** Cash and Rep go green up / red down. Chaos isn't good or bad, so it heats up (orange) or cools down (blue).

All of this lives in the "HUD + decision impact" section of `game.js`. In the browser console, `SL.impact({ cash: -6000, rep: 2 })`
replays an impact.

The Friday Review reads each meter as LOW / MID / HIGH (Cash: LOW under $8k, HIGH $16k+; Rep and Chaos: LOW ≤3, HIGH ≥6)
and takes the first matching rule:

1. **Accidental Viral**: Chaos HIGH and Rep HIGH
2. **Broke but Legit**: Cash LOW and Rep HIGH
3. **Total Meltdown**: Cash LOW (and Rep not high)
4. **Fake It Till You Make It**: Chaos HIGH, or Cash HIGH without high Rep
5. **The Wholesome Startup**: everything else (not broke, Chaos under control)

The last rule is a catch-all, so every path lands on exactly one ending. Current split over the 81 paths:
Viral 25, Wholesome 22, Fake It 19, Meltdown 8, Broke but Legit 7.

Interpretations of the pitch worth checking:
- The pitch's "low everything" for Total Meltdown became "Cash LOW and Rep not high". Chaos is left out because the
  natural road to Meltdown (the database deleted during the fake demo) sends Chaos sky-high.
- Fake It also catches "rich but nobody trusts you" paths, which otherwise matched no ending.
- The Meltdown "Mom's basement restart bonus" is the **Basement Bonus** (+$500, +1 Rep, pep talk) that opens Level 2's Mom's Basement scene.
- The questionable idea is "an app that reminds you to drink water. Passive-aggressively." Gail's feature ask (a Leg Day Lie Detector) builds on it.

## Dropping in art

Save an image into `art/` named after its slot id (e.g. `art/char_mom.png`) and reload. The placeholder is replaced
automatically. Characters and reactions stand in front of the town like cut-outs, so transparent PNGs work best.
See `ART_ASSETS.md` for the full list and briefs.

`?fast=1` on the URL skips animations and camera flights and makes card transitions synchronous; it exists for automated
path testing.
