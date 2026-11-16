# Startup Ladder: art asset list

Generated from `story.js` by `node tools/art-list.js`. Don't edit by hand; edit the `ART` table in `story.js` and re-run.

**How to drop art in:** save the file into `art/` named exactly after the asset id, e.g. `art/char_mom.png`
(`.png`, `.webp`, `.jpg`, `.svg` or `.gif`). Reload the game and the placeholder is replaced; no code changes.
Transparent PNG/WebP works best for characters, reactions and props.

Backgrounds, locations and key art aren't on this list: every card is staged in the 3D Pebblewick town
(see `stage` in `story.js` and `SHOTS` in `town-stage.js`).

Total slots: **42**

Style target: cartoonish, expressive, absurd corporate humour, friendly. The art carries the comedy.

## Characters (scene poses) (9)

_Full or 3/4 body cut-outs, transparent PNG, ~800×1000. They stand on the text panel in front of the 3D town, one on each side when two share a scene._

| Asset id | Placeholder | Brief | Used in |
|---|---|---|---|
| `char_founder` | 🧑‍💻 | You, the founder. Hoodie, hopeful, slightly under-slept. | Friday Review |
| `char_cofounder` | 🧑‍💼 | Devin, co-founder. Fleece vest, podcast mic, says "disrupt" a lot. | L1 Monday: The Name |
| `char_mom` | 👩‍🦳 | Mom. Cardigan, glasses on a chain, unconditional pride. | L1 Monday: The Name<br>L2: Mom's Basement |
| `char_band` | 🎸 | Cousin Ricky and his band Gravel Smoothie (3 members, one sad drum kit). | L1 Tuesday: The Garage |
| `char_customer` | 🏋️ | Gail, owns 40 gyms. Tracksuit, whistle she never takes off. | L1 Wednesday: The First Customer |
| `char_intern` | 🧑‍🎓 | Skyler, 19, unpaid intern. Lanyard from a different company, too much energy. | L1 Thursday: The Intern |
| `char_grandma` | 👵 | Grandma Rosa, baker. Covered in flour, holding a fan letter. | L2: The Fan Letter |
| `char_ceo` | 🤵 | Mr. Thornbury, Gail's CEO. Private-jet hair, very into legs. | L2: The Demo Returns |
| `char_investor` | 🕴️ | Preston, venture capitalist. Quarter-zip, headset, loves beige. | L2: The Investor Calls |

## Reactions (outcome cards) (15)

_Same characters, exaggerated expression/pose, transparent PNG, ~800×1000._

| Asset id | Placeholder | Brief | Used in |
|---|---|---|---|
| `react_founder_smug` | 😏 | Founder, smug. Got away with it (for now). | L1 Wednesday: The First Customer → Faked it<br>L2: 10,000 Users, 1 Server → Duct tape |
| `react_founder_panic` | 😱 | Founder, full panic. Hands on face. | L2: The Fan Letter → Wore a tie<br>L2: 10,000 Users, 1 Server |
| `react_founder_proud` | 😤 | Founder, proud. Hands on hips, chest out. | L1 Tuesday: The Garage → Office<br>L2: The Fan Letter → Stayed humble<br>L2: 10,000 Users, 1 Server → Bought servers<br>L2: The Investor Calls → Refused |
| `react_founder_exhausted` | 😵‍💫 | Founder after an all-nighter. Energy-drink cans, twitching eye. | L1 Wednesday: The First Customer → Promised<br>L2: The Demo Returns → Built it |
| `react_founder_sheepish` | 😬 | Founder, sheepish grimace. | L1 Tuesday: The Garage → Kicked out<br>L2: The Demo Returns → Confessed<br>L2: The Investor Calls → Accepted<br>L2: Mom's Basement → Day job |
| `react_founder_shrug` | 🤷 | Founder, big shrug. | L1 Monday: The Name → BLORP<br>L2: 10,000 Users, 1 Server → Asked the internet |
| `react_cofounder_thrilled` | 🤩 | Devin, thrilled. Already recording a podcast about it. | L1 Monday: The Name → Synergyze<br>L2: Mom's Basement → Pivoted |
| `react_mom_beaming` | 🥰 | Mom, beaming with pride. | L1 Monday: The Name → Bob's Apps<br>L2: The Fan Letter → Sent Mom<br>L2: Mom's Basement → Same idea |
| `react_band_rocking` | 🤘 | Gravel Smoothie mid-solo, your logo on the bass drum. | L1 Tuesday: The Garage → Shared |
| `react_customer_stare` | 😐 | Gail, long unblinking stare. Whistle slowly lowering. | L1 Wednesday: The First Customer → Honest |
| `react_intern_proud` | 😁 | Skyler, proud of all the "free space" (the database is gone). | L1 Thursday: The Intern → Full access |
| `react_intern_glitter` | ✨ | Skyler signing a contract in glitter pen. | L1 Thursday: The Intern → Co-founder |
| `react_intern_coffee` | ☕ | Skyler with a perfect flat white; a trophy hidden behind their back. | L1 Thursday: The Intern → Coffee duty |
| `react_clipboard_greg` | 📋 | Clipboard Greg. Hard hat, clipboard, total unearned authority. | L2: The Demo Returns → Hired Clipboard Greg |
| `react_investor_haggle` | 🤝 | Preston mid-haggle, holding two paint swatches. | L2: The Investor Calls → Negotiate mini-game |

## Props (9)

_Single object, transparent PNG, ~512×512. Shown small and tilted near the panel._

| Asset id | Placeholder | Brief | Used in |
|---|---|---|---|
| `prop_name_whiteboard` | 📝 | Whiteboard: "SYNERGYZE" vs "BOB'S APPS", both underlined angrily. | L1 Monday: The Name |
| `prop_drumkit` | 🥁 | Drum kit wedged next to the water heater. | L1 Tuesday: The Garage |
| `prop_contract` | 📜 | Huge contract: 2,000 subscriptions, "LEG DAY LIE DETECTOR" circled. | L1 Wednesday: The First Customer |
| `prop_lanyard` | 🪪 | Lanyard from a completely different company. | L1 Thursday: The Intern |
| `prop_fan_letter` | 💌 | Fan letter with a flour handprint. | L2: The Fan Letter |
| `prop_clipboard` | 📋 | A very convincing clipboard. | L2: The Demo Returns |
| `prop_laptop_fire` | 🔥 | Laptop "server" on a shelf above the dryer, slightly on fire. | L2: 10,000 Users, 1 Server |
| `prop_logo_swatches` | 🎨 | Paint swatches: Beige, Business Peach, Electric Tangerine. | L2: The Investor Calls |
| `prop_pancakes` | 🥞 | Stack of pancakes, syrup, a sticky note: "so... what's the plan?" | L2: Mom's Basement |

## Combo cards (4)

_Gag illustration, ~1200×800, shown like a polaroid over the town. The "COMBO!" burst is drawn by the game._

| Asset id | Placeholder | Brief | Used in |
|---|---|---|---|
| `combo_jingle` | 🎶 | The Blorp jingle playing everywhere: bowling alley, dentist, a baby saying "blorp". | Combo: The Blorp Jingle |
| `combo_paper` | 📉 | Glass office, kombucha tap, and a bank app sending thoughts and prayers. | Combo: Amazing on Paper |
| `combo_big_heart` | 📰 | Front page: "SMALL STARTUP WITH BIG HEART", laminated on Mom's fridge. | Combo: Small Startup With Big Heart |
| `combo_demo_disaster` | 💥 | The app vanishing mid-demo in front of 12 executives. Skyler waving. | Combo: Live Demo, Live Disaster |

## Ending cards (5)

_Hero illustration, ~1200×800, shown like a polaroid over the town. One per Friday Review ending._

| Asset id | Placeholder | Brief | Used in |
|---|---|---|---|
| `end_wholesome` | 🧁 | Ending: The Wholesome Startup. Founder getting hugged at a farmers' market. | Ending: The Wholesome Startup |
| `end_fakeit` | 🎭 | Ending: Fake It Till You Make It. Founder in sunglasses on a pile of invoices for features that don't exist. | Ending: Fake It Till You Make It |
| `end_viral` | 🚀 | Ending: Accidental Viral. Founder surfing a wave of phone notifications. | Ending: Accidental Viral |
| `end_broke` | 🏛️ | Ending: Broke but Legit. Founder in a suit made of receipts, $43 in the jar. | Ending: Broke but Legit |
| `end_meltdown` | 🫠 | Ending: Total Meltdown. Garage smoking, intern leaving with the plant, Mom waving from the basement door. | Ending: Total Meltdown |
