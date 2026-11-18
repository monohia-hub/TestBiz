# Startup Ladder: art asset list

Generated from `story.js` by `node tools/art-list.js`. Don't edit by hand; edit the `ART` table in `story.js` and re-run.

**How to drop art in:** save the file into `art/` named exactly after the asset id, e.g. `art/char_mom.png`
(`.png`, `.webp`, `.jpg`, `.svg` or `.gif`). Reload the game and the placeholder is replaced; no code changes.
Transparent PNG/WebP works best for characters, reactions and props.

Backgrounds, locations and key art aren't on this list: every card is staged in the 3D Pebblewick town
(see `stage` in `story.js` and `SHOTS` in `town-stage.js`).

Total slots: **50**

Style target: cartoonish, expressive, absurd corporate humour, friendly. The art carries the comedy.

## Characters (scene poses) (9)

_Full or 3/4 body cut-outs, transparent PNG, ~800×1000. They stand on the text panel in front of the 3D town, one on each side when two share a scene._

| Asset id | Placeholder | Brief | Used in |
|---|---|---|---|
| `char_founder` | 🧑‍💻 | You, the founder. Hoodie, hopeful, slightly under-slept. | L1 Monday: ☕ Coffee machine (Running on Empty)<br>L1 Tuesday: 📦 Mystery box (A Box on the Porch)<br>L1 Wednesday: ⛲ Fountain (The Wishing Fountain)<br>L1 Thursday: 💻 Laptop (47 Tabs)<br>L2: The Magazine Cover<br>Friday Review |
| `char_cofounder` | 🧑‍💼 | Devin, co-founder. Fleece vest, podcast mic, says "disrupt" a lot. | L1 Monday: 📝 Whiteboard (The Name) |
| `char_mom` | 👩‍🦳 | Mom. Cardigan, glasses on a chain, unconditional pride. | L1 Monday: 📝 Whiteboard (The Name)<br>L2: Mom's Basement |
| `char_band` | 🎸 | Cousin Ricky and his band Gravel Smoothie (3 members, one sad drum kit). | L1 Tuesday: 🎸 The band (The Garage) |
| `char_customer` | 🏋️ | Gail, owns 40 gyms. Tracksuit, whistle she never takes off. | L1 Wednesday: 🏋️ Gail (The First Customer) |
| `char_intern` | 🧑‍🎓 | Skyler, 19, unpaid intern. Lanyard from a different company, too much energy. | L1 Thursday: 🧑‍🎓 Skyler (The Intern) |
| `char_grandma` | 👵 | Grandma Rosa, baker. Covered in flour, holding a fan letter. | L2: The Fan Letter |
| `char_ceo` | 🤵 | Mr. Thornbury, Gail's CEO. Private-jet hair, very into legs. | L2: The Demo Returns |
| `char_investor` | 🕴️ | Preston, venture capitalist. Quarter-zip, headset, loves beige. | L2: The Investor Calls |

## Reactions (outcome cards) (15)

_Same characters, exaggerated expression/pose, transparent PNG, ~800×1000._

| Asset id | Placeholder | Brief | Used in |
|---|---|---|---|
| `react_founder_smug` | 😏 | Founder, smug. Got away with it (for now). | L1 Tuesday: 🎸 The band (The Garage) → Sublet (good roll)<br>L1 Tuesday: 📦 Mystery box (A Box on the Porch) → Shook it (good roll)<br>L1 Wednesday: 🏋️ Gail (The First Customer) → Faked it (good roll)<br>L1 Wednesday: ⛲ Fountain (The Wishing Fountain) → Took the coins (good roll)<br>L1 Thursday: 🧑‍🎓 Skyler (The Intern) → Rented out (good roll)<br>L1 Thursday: 💻 Laptop (47 Tabs) → AI wrote it (good roll)<br>L2: The Magazine Cover → Sold the cover<br>L2: 10,000 Users, 1 Server → Duct tape |
| `react_founder_panic` | 😱 | Founder, full panic. Hands on face. | L1 Monday: 📝 Whiteboard (The Name) → BLORP (bad roll)<br>L1 Monday: ☕ Coffee machine (Running on Empty) → All-nighter (bad roll)<br>L1 Monday: ☕ Coffee machine (Running on Empty) → Whole pot (bad roll)<br>L1 Tuesday: 🎸 The band (The Garage) → Sublet (bad roll)<br>L1 Tuesday: 🎸 The band (The Garage) → Band signed (bad roll)<br>L1 Tuesday: 📦 Mystery box (A Box on the Porch) → Opened it (bad roll)<br>L1 Tuesday: 📦 Mystery box (A Box on the Porch) → Shook it (bad roll)<br>L1 Wednesday: ⛲ Fountain (The Wishing Fountain) → Made a wish (bad roll)<br>L1 Wednesday: ⛲ Fountain (The Wishing Fountain) → Took the coins (bad roll)<br>L1 Thursday: 🧑‍🎓 Skyler (The Intern) → Rented out (bad roll)<br>L1 Thursday: 💻 Laptop (47 Tabs) → Updated (bad roll)<br>L1 Thursday: 💻 Laptop (47 Tabs) → AI wrote it (bad roll)<br>L2: The Magazine Cover → The horse (bad roll)<br>L2: The Fan Letter → Wore a tie<br>L2: 10,000 Users, 1 Server |
| `react_founder_proud` | 😤 | Founder, proud. Hands on hips, chest out. | L1 Monday: ☕ Coffee machine (Running on Empty) → Napped (good roll)<br>L1 Monday: ☕ Coffee machine (Running on Empty) → Whole pot (good roll)<br>L1 Tuesday: 📦 Mystery box (A Box on the Porch) → Opened it (good roll)<br>L1 Wednesday: ⛲ Fountain (The Wishing Fountain) → Walked past (good roll)<br>L1 Wednesday: ⛲ Fountain (The Wishing Fountain) → Made a wish (good roll)<br>L1 Thursday: 💻 Laptop (47 Tabs) → Closed tabs (good roll)<br>L1 Thursday: 💻 Laptop (47 Tabs) → Updated (good roll)<br>L2: The Magazine Cover → The horse (good roll)<br>L2: The Fan Letter → Stayed humble<br>L2: 10,000 Users, 1 Server → Bought servers<br>L2: The Investor Calls → Refused |
| `react_founder_exhausted` | 😵‍💫 | Founder after an all-nighter. Energy-drink cans, twitching eye. | L1 Monday: ☕ Coffee machine (Running on Empty) → All-nighter (good roll)<br>L1 Wednesday: 🏋️ Gail (The First Customer) → Promised (good roll)<br>L2: The Demo Returns → Built it |
| `react_founder_sheepish` | 😬 | Founder, sheepish grimace. | L1 Monday: 📝 Whiteboard (The Name) → Bob's Apps (bad roll)<br>L1 Monday: 📝 Whiteboard (The Name) → Synergyze (bad roll)<br>L1 Monday: ☕ Coffee machine (Running on Empty) → Napped (bad roll)<br>L1 Tuesday: 🎸 The band (The Garage) → Mom's sunroom (bad roll)<br>L1 Wednesday: ⛲ Fountain (The Wishing Fountain) → Walked past (bad roll)<br>L1 Thursday: 💻 Laptop (47 Tabs) → Closed tabs (bad roll)<br>L2: The Demo Returns → Confessed<br>L2: The Investor Calls → Accepted<br>L2: Mom's Basement → Day job |
| `react_founder_shrug` | 🤷 | Founder, big shrug. | L1 Monday: 📝 Whiteboard (The Name) → BLORP (good roll)<br>L1 Tuesday: 📦 Mystery box (A Box on the Porch) → Left it (bad roll)<br>L2: 10,000 Users, 1 Server → Asked the internet |
| `react_cofounder_thrilled` | 🤩 | Devin, thrilled. Already recording a podcast about it. | L1 Monday: 📝 Whiteboard (The Name) → Synergyze (good roll)<br>L2: Mom's Basement → Pivoted |
| `react_mom_beaming` | 🥰 | Mom, beaming with pride. | L1 Monday: 📝 Whiteboard (The Name) → Bob's Apps (good roll)<br>L1 Tuesday: 🎸 The band (The Garage) → Mom's sunroom (good roll)<br>L1 Tuesday: 📦 Mystery box (A Box on the Porch) → Left it (good roll)<br>L2: The Magazine Cover → Mom's cover<br>L2: The Fan Letter → Sent Mom<br>L2: Mom's Basement → Same idea |
| `react_band_rocking` | 🤘 | Gravel Smoothie mid-solo, your logo on the bass drum. | L1 Tuesday: 🎸 The band (The Garage) → Band signed (good roll) |
| `react_customer_stare` | 😐 | Gail, long unblinking stare. Whistle slowly lowering. | L1 Wednesday: 🏋️ Gail (The First Customer) → Honest (good roll)<br>L1 Wednesday: 🏋️ Gail (The First Customer) → Honest (bad roll)<br>L1 Wednesday: 🏋️ Gail (The First Customer) → Promised (bad roll)<br>L1 Wednesday: 🏋️ Gail (The First Customer) → Faked it (bad roll) |
| `react_intern_proud` | 😁 | Skyler, proud of all the "free space" (the database is gone). | L1 Thursday: 🧑‍🎓 Skyler (The Intern) → Full access (bad roll) |
| `react_intern_glitter` | ✨ | Skyler signing a contract in glitter pen. | L1 Thursday: 🧑‍🎓 Skyler (The Intern) → Full access (good roll) |
| `react_intern_coffee` | ☕ | Skyler with a perfect flat white; a trophy hidden behind their back. | L1 Thursday: 🧑‍🎓 Skyler (The Intern) → Coffee duty (good roll)<br>L1 Thursday: 🧑‍🎓 Skyler (The Intern) → Coffee duty (bad roll) |
| `react_clipboard_greg` | 📋 | Clipboard Greg. Hard hat, clipboard, total unearned authority. | L2: The Demo Returns → Hired Clipboard Greg |
| `react_investor_haggle` | 🤝 | Preston mid-haggle, holding two paint swatches. | L2: The Investor Calls → Negotiate mini-game |

## Props (13)

_Single object, transparent PNG, ~512×512. Shown small and tilted near the panel._

| Asset id | Placeholder | Brief | Used in |
|---|---|---|---|
| `prop_name_whiteboard` | 📝 | Whiteboard: "SYNERGYZE" vs "BOB'S APPS", both underlined angrily. | L1 Monday: 📝 Whiteboard (The Name) |
| `prop_drumkit` | 🥁 | Drum kit wedged next to the water heater. | L1 Tuesday: 🎸 The band (The Garage) |
| `prop_contract` | 📜 | Huge contract: 2,000 subscriptions, "LEG DAY LIE DETECTOR" circled. | L1 Wednesday: 🏋️ Gail (The First Customer) |
| `prop_lanyard` | 🪪 | Lanyard from a completely different company. | L1 Thursday: 🧑‍🎓 Skyler (The Intern) |
| `prop_fan_letter` | 💌 | Fan letter with a flour handprint. | L2: The Fan Letter |
| `prop_clipboard` | 📋 | A very convincing clipboard. | L2: The Demo Returns |
| `prop_laptop_fire` | 🔥 | Laptop "server" on a shelf above the dryer, slightly on fire. | L1 Thursday: 💻 Laptop (47 Tabs)<br>L2: 10,000 Users, 1 Server |
| `prop_logo_swatches` | 🎨 | Paint swatches: Beige, Business Peach, Electric Tangerine. | L2: The Investor Calls |
| `prop_pancakes` | 🥞 | Stack of pancakes, syrup, a sticky note: "so... what's the plan?" | L2: Mom's Basement |
| `prop_coffee` | ☕ | The coffee machine: dented, humming, judging you. A sticky note: "you got this?" | L1 Monday: ☕ Coffee machine (Running on Empty) |
| `prop_box` | 📦 | Unlabelled cardboard box on the porch. Faint ticking lines drawn around it. | L1 Tuesday: 📦 Mystery box (A Box on the Porch) |
| `prop_coins` | 🪙 | The wishing fountain, overflowing with coins. A tiny "NO FISHING" sign. | L1 Wednesday: ⛲ Fountain (The Wishing Fountain) |
| `prop_magazine` | 📰 | Magazine cover mock-up: "30 UNDER 30 MINUTES", a blank space where your face goes. | L2: The Magazine Cover |

## Combo cards (4)

_Gag illustration, ~1200×800, shown like a polaroid over the town. The "COMBO!" burst is drawn by the game._

| Asset id | Placeholder | Brief | Used in |
|---|---|---|---|
| `combo_jingle` | 🎶 | The Blorp jingle playing everywhere: bowling alley, dentist, a baby saying "blorp". | Combo: The Blorp Jingle |
| `combo_paper` | 📉 | Glass office, kombucha tap, and a bank app sending thoughts and prayers. | Combo: Amazing on Paper |
| `combo_big_heart` | 📰 | Front page: "SMALL STARTUP WITH BIG HEART", laminated on Mom's fridge. | Combo: Small Startup With Big Heart |
| `combo_demo_disaster` | 💥 | The app vanishing mid-demo in front of 12 executives. Skyler waving. | Combo: Live Demo, Live Disaster |

## Ending cards (9)

_Hero illustration, ~1200×800, shown like a polaroid over the town. One per Friday Review ending, plus one per game over._

| Asset id | Placeholder | Brief | Used in |
|---|---|---|---|
| `end_wholesome` | 🧁 | Ending: The Wholesome Startup. Founder getting hugged at a farmers' market. | Ending: The Wholesome Startup |
| `end_fakeit` | 🎭 | Ending: Fake It Till You Make It. Founder in sunglasses on a pile of invoices for features that don't exist. | Ending: Fake It Till You Make It |
| `end_viral` | 🚀 | Ending: Accidental Viral. Founder surfing a wave of phone notifications. | Ending: Accidental Viral |
| `end_broke` | 🏛️ | Ending: Broke but Legit. Founder in a suit made of receipts, $43 in the jar. | Ending: Broke but Legit |
| `end_meltdown` | 🫠 | Ending: Total Meltdown. Garage smoking, intern leaving with the plant, Mom waving from the basement door. | Ending: Total Meltdown |
| `end_unicorn` | 🦄 | Ending: Unicorn (the win). Founder in a gold hoodie riding an inflatable unicorn through the town square. | Ending: Unicorn |
| `fail_combustion` | 💥 | Game over: Spontaneous Combustion. Garage crater, a goat on the roof, the fire chief giving a thumbs-up. | Game over: Spontaneous Combustion |
| `fail_bankrupt` | 💸 | Game over: Bankrupt. Founder at a vending machine holding a declined card; Mom in the background with the company on her fridge. | Game over: Bankrupt |
| `fail_forgotten` | 👻 | Game over: Forgotten. Founder fading to transparent while the town walks past. | Game over: Forgotten |
