// Startup Ladder — story data + rules.
// Everything a designer would tune lives here: copy, meter effects, combos,
// ending rules, where each card is staged in the 3D town, and the art slot list.
// game.js renders the cards; town-stage.js renders Pebblewick behind them.
// Works in the browser (window.STORY) and in Node (require('./story.js')).
(function (root) {
  'use strict';

  // ---------------------------------------------------------------------------
  // Meters
  // ---------------------------------------------------------------------------
  const START = { cash: 8000, rep: 4, chaos: 3 };
  const METER_MAX = 10; // Rep and Chaos run 0–10. Cash is dollars, never below $0.

  // What counts as LOW / HIGH when the Friday Review reads your meters.
  const LEVELS = {
    cash: { low: 14000, high: 20000 }, // LOW is below $14,000, HIGH is $20,000 or more
    rep: { low: 3, high: 6 }, //         LOW is 3 or less,     HIGH is 6 or more (0 = game over)
    chaos: { low: 3, high: 6 }, //     LOW is 3 or less,     HIGH is 6 or more (10 = game over)
  };

  // ---------------------------------------------------------------------------
  // Art slots. Drop a file named <id>.png (or .webp/.jpg/.svg/.gif) into art/
  // and it replaces the placeholder automatically. ART_ASSETS.md is the brief.
  // Backgrounds come from the 3D town, so these are only characters, props and gag cards.
  // ---------------------------------------------------------------------------
  const ART = {
    // Characters (neutral / scene poses)
    char_founder: { kind: 'character', emoji: '🧑‍💻', desc: 'You, the founder. Hoodie, hopeful, slightly under-slept.' },
    char_cofounder: { kind: 'character', emoji: '🧑‍💼', desc: 'Devin, co-founder. Fleece vest, podcast mic, says "disrupt" a lot.' },
    char_mom: { kind: 'character', emoji: '👩‍🦳', desc: 'Mom. Cardigan, glasses on a chain, unconditional pride.' },
    char_band: { kind: 'character', emoji: '🎸', desc: 'Cousin Ricky and his band Gravel Smoothie (3 members, one sad drum kit).' },
    char_customer: { kind: 'character', emoji: '🏋️', desc: 'Gail, owns 40 gyms. Tracksuit, whistle she never takes off.' },
    char_intern: { kind: 'character', emoji: '🧑‍🎓', desc: 'Skyler, 19, unpaid intern. Lanyard from a different company, too much energy.' },
    char_grandma: { kind: 'character', emoji: '👵', desc: 'Grandma Rosa, baker. Covered in flour, holding a fan letter.' },
    char_ceo: { kind: 'character', emoji: '🤵', desc: "Mr. Thornbury, Gail's CEO. Private-jet hair, very into legs." },
    char_investor: { kind: 'character', emoji: '🕴️', desc: 'Preston, venture capitalist. Quarter-zip, headset, loves beige.' },

    // Reactions (used on outcome cards)
    react_founder_smug: { kind: 'reaction', emoji: '😏', desc: 'Founder, smug. Got away with it (for now).' },
    react_founder_panic: { kind: 'reaction', emoji: '😱', desc: 'Founder, full panic. Hands on face.' },
    react_founder_proud: { kind: 'reaction', emoji: '😤', desc: 'Founder, proud. Hands on hips, chest out.' },
    react_founder_exhausted: { kind: 'reaction', emoji: '😵‍💫', desc: 'Founder after an all-nighter. Energy-drink cans, twitching eye.' },
    react_founder_sheepish: { kind: 'reaction', emoji: '😬', desc: 'Founder, sheepish grimace.' },
    react_founder_shrug: { kind: 'reaction', emoji: '🤷', desc: 'Founder, big shrug.' },
    react_cofounder_thrilled: { kind: 'reaction', emoji: '🤩', desc: 'Devin, thrilled. Already recording a podcast about it.' },
    react_mom_beaming: { kind: 'reaction', emoji: '🥰', desc: 'Mom, beaming with pride.' },
    react_band_rocking: { kind: 'reaction', emoji: '🤘', desc: 'Gravel Smoothie mid-solo, your logo on the bass drum.' },
    react_customer_stare: { kind: 'reaction', emoji: '😐', desc: 'Gail, long unblinking stare. Whistle slowly lowering.' },
    react_intern_proud: { kind: 'reaction', emoji: '😁', desc: 'Skyler, proud of all the "free space" (the database is gone).' },
    react_intern_glitter: { kind: 'reaction', emoji: '✨', desc: 'Skyler signing a contract in glitter pen.' },
    react_intern_coffee: { kind: 'reaction', emoji: '☕', desc: 'Skyler with a perfect flat white; a trophy hidden behind their back.' },
    react_clipboard_greg: { kind: 'reaction', emoji: '📋', desc: 'Clipboard Greg. Hard hat, clipboard, total unearned authority.' },
    react_investor_haggle: { kind: 'reaction', emoji: '🤝', desc: 'Preston mid-haggle, holding two paint swatches.' },

    // Props
    prop_name_whiteboard: { kind: 'prop', emoji: '📝', desc: 'Whiteboard: "SYNERGYZE" vs "BOB\'S APPS", both underlined angrily.' },
    prop_drumkit: { kind: 'prop', emoji: '🥁', desc: 'Drum kit wedged next to the water heater.' },
    prop_contract: { kind: 'prop', emoji: '📜', desc: 'Huge contract: 2,000 subscriptions, "LEG DAY LIE DETECTOR" circled.' },
    prop_lanyard: { kind: 'prop', emoji: '🪪', desc: "Lanyard from a completely different company." },
    prop_fan_letter: { kind: 'prop', emoji: '💌', desc: 'Fan letter with a flour handprint.' },
    prop_clipboard: { kind: 'prop', emoji: '📋', desc: 'A very convincing clipboard.' },
    prop_laptop_fire: { kind: 'prop', emoji: '🔥', desc: 'Laptop "server" on a shelf above the dryer, slightly on fire.' },
    prop_logo_swatches: { kind: 'prop', emoji: '🎨', desc: 'Paint swatches: Beige, Business Peach, Electric Tangerine.' },
    prop_pancakes: { kind: 'prop', emoji: '🥞', desc: 'Stack of pancakes, syrup, a sticky note: "so... what\'s the plan?"' },

    // Combo cards
    combo_jingle: { kind: 'combo', emoji: '🎶', desc: 'The Blorp jingle playing everywhere: bowling alley, dentist, a baby saying "blorp".' },
    combo_paper: { kind: 'combo', emoji: '📉', desc: 'Glass office, kombucha tap, and a bank app sending thoughts and prayers.' },
    combo_big_heart: { kind: 'combo', emoji: '📰', desc: 'Front page: "SMALL STARTUP WITH BIG HEART", laminated on Mom\'s fridge.' },
    combo_demo_disaster: { kind: 'combo', emoji: '💥', desc: 'The app vanishing mid-demo in front of 12 executives. Skyler waving.' },

    // Ending cards
    end_wholesome: { kind: 'ending', emoji: '🧁', desc: 'Ending: The Wholesome Startup. Founder getting hugged at a farmers\' market.' },
    end_fakeit: { kind: 'ending', emoji: '🎭', desc: 'Ending: Fake It Till You Make It. Founder in sunglasses on a pile of invoices for features that don\'t exist.' },
    end_viral: { kind: 'ending', emoji: '🚀', desc: 'Ending: Accidental Viral. Founder surfing a wave of phone notifications.' },
    end_broke: { kind: 'ending', emoji: '🏛️', desc: 'Ending: Broke but Legit. Founder in a suit made of receipts, $43 in the jar.' },
    end_meltdown: { kind: 'ending', emoji: '🫠', desc: 'Ending: Total Meltdown. Garage smoking, intern leaving with the plant, Mom waving from the basement door.' },
    end_unicorn: { kind: 'ending', emoji: '🦄', desc: 'Ending: Unicorn (the win). Founder in a gold hoodie riding an inflatable unicorn through the town square.' },

    // Game over cards
    fail_combustion: { kind: 'ending', emoji: '💥', desc: 'Game over: Spontaneous Combustion. Garage crater, a goat on the roof, the fire chief giving a thumbs-up.' },
    fail_bankrupt: { kind: 'ending', emoji: '💸', desc: 'Game over: Bankrupt. Founder at a vending machine holding a declined card; Mom in the background with the company on her fridge.' },
    fail_forgotten: { kind: 'ending', emoji: '👻', desc: 'Game over: Forgotten. Founder fading to transparent while the town walks past.' },
    prop_coffee: { kind: 'prop', emoji: '☕', desc: 'The coffee machine: dented, humming, judging you. A sticky note: "you got this?"' },
    prop_box: { kind: 'prop', emoji: '📦', desc: 'Unlabelled cardboard box on the porch. Faint ticking lines drawn around it.' },
    prop_coins: { kind: 'prop', emoji: '🪙', desc: 'The wishing fountain, overflowing with coins. A tiny "NO FISHING" sign.' },
    prop_magazine: { kind: 'prop', emoji: '📰', desc: 'Magazine cover mock-up: "30 UNDER 30 MINUTES", a blank space where your face goes.' },
  };

  // ---------------------------------------------------------------------------
  // Level 1: Week One. Four scenes, Monday to Thursday. Friday is the review.
  // Directions: left / up / right (swipe, tap, or ← ↑ → / 1 2 3).
  // Effects are added to the meters; a function receives the current state.
  // ---------------------------------------------------------------------------
  const IDEA = 'An app that reminds you to drink water. Passive-aggressively.';

  // ---------------------------------------------------------------------------
  // Staging in Pebblewick. Every card can carry `stage: { shot, day, hour }`.
  // shot = a camera shot name from SHOTS in town-stage.js; day 1 = Monday of Week One;
  // hour = 0–24 (decimals allowed). Leave day/hour out to keep the current time.
  // A card without `stage` keeps whatever the previous card showed.
  // ---------------------------------------------------------------------------
  const TITLE_STAGE = { shot: 'overview', day: 0, hour: 18.5 };

  // ---------------------------------------------------------------------------
  // DECISION RULES. Every Week One choice follows these, so players can learn them.
  //
  // Each day the camera shows a place in Pebblewick with two things to tap. There's only
  // time for one, so picking which thing to deal with is the first decision.
  // Every thing offers three options, and EVERY option rolls: a good result or a bad one.
  //
  //  ← SAFE  good odds (75%), small swing.   Good ≈ +2, bad ≈ −1
  //  → BOLD  even odds (55%), bigger swing.   Good ≈ +4.5, bad ≈ −3.5
  //  ↑ WILD  long odds (35%), huge swing.     Good ≈ +9, bad ≈ −6
  //
  // Values use one exchange rate: $2,000 ≈ 1 Rep ≈ 1 Chaos (as a cost).
  // Odds = base + 5% × (Rep − Chaos) + the choice's own bias, kept between 10% and 90%.
  // People forgive the beloved; nothing works in a burning garage. Bold and Wild pay off
  // once you've built good odds.
  //
  // RISING STAKES: Cash and Rep swings are ×1 Monday and Tuesday, ×1.25 Wednesday, ×1.5 Thursday.
  // FAIL: Cash $0, Rep 0 or Chaos 10 ends the run on the spot (see FAILS).
  // WIN:  the Unicorn ending at the Friday Review.
  // Run `node tools/paths.js` after changing numbers: it plays every path and roll.
  // ---------------------------------------------------------------------------
  const ODDS = { base: { left: 75, right: 55, up: 35 }, perPoint: 5, min: 10, max: 90 };

  const WEEK_ONE = {
    id: 'week1',
    number: 1,
    title: 'Week One',
    intro: 'Four days. One thing a day. Survive to Friday.',
    // The how-to-play card, one short line each. Shown on the Week One intro.
    rules: [
      ['👆', 'Tap', 'One thing in town a day.'],
      ['←', 'Safe', 'Good odds. Small win.'],
      ['→', 'Bold', 'Coin flip. Bigger win.'],
      ['↑', 'Wild', 'Long shot. Huge win.'],
      ['🌟', 'Odds', 'Rep helps. Chaos hurts.'],
      ['💀', 'Lose', 'Cash $0, Rep 0 or Chaos 10.'],
      ['🦄', 'Win', 'Rich, loved, a bit chaotic.'],
    ],
    stage: { shot: 'home_front', day: 1, hour: 8 },
    review: { shot: 'home_room', day: 5, hour: 18.5 },
    days: [
      // ---------------------------------------------------------------- Monday
      {
        id: 'mon',
        day: 'Monday',
        place: 'Your room',
        stage: { shot: 'home_room', day: 1, hour: 9 },
        spots: [
          {
            id: 'name',
            icon: '📝',
            name: 'Whiteboard',
            title: 'The Name',
            cast: ['char_cofounder', 'char_mom'],
            prop: 'prop_name_whiteboard',
            text: 'Devin wants <b>"Synergyze"</b>. Mom wants <b>"Bob\'s Apps"</b>. Nobody here is called Bob.',
            choices: [
              {
                dir: 'left',
                label: 'Go with Mom: Bob\'s Apps',
                short: 'Bob\'s Apps',
                hint: 'Charming. Nobody takes you seriously.',
                flags: { name: 'bob' },
                company: 'Bob\'s Apps',
                log: 'Named it Bob\'s Apps',
                gamble: {
                  win: { effects: { cash: -1000, rep: 2 }, outcome: { art: 'react_mom_beaming', text: 'Mom prints 500 cards with a clip-art thumbs-up. The bank teller pats your hand.' } },
                  lose: { effects: { cash: -2000 }, outcome: { art: 'react_founder_sheepish', text: 'The cards say "Bob\'s Naps". Mom paid $2,000. You\'re a mattress company now.' } },
                },
              },
              {
                dir: 'right',
                label: 'Go trendy: Synergyze',
                short: 'Synergyze',
                hint: 'Investors love it. Customers can\'t say it.',
                flags: { name: 'synergyze' },
                company: 'Synergyze',
                log: 'Named it Synergyze',
                gamble: {
                  win: { effects: { cash: 10000, chaos: 1 }, outcome: { art: 'react_cofounder_thrilled', text: 'A man in a fleece vest wires $10,000 "for the vibe". He never asks what you do.' } },
                  lose: { effects: { rep: -2, chaos: 1 }, outcome: { art: 'react_founder_sheepish', text: 'Every email starts "Dear Sinner-Geez". Two customers report you as spam.' } },
                },
              },
              {
                dir: 'up',
                label: 'Random word generator',
                short: 'BLORP',
                hint: 'It lands on "Blorp". Legend or lawsuit.',
                flags: { name: 'blorp' },
                company: 'Blorp',
                log: 'Named it Blorp',
                gamble: {
                  win: { effects: { cash: 10000, rep: 4 }, outcome: { art: 'react_founder_shrug', text: 'BLORP. Kids chant it in the street. The mugs sell out: $10,000.' } },
                  lose: { effects: { cash: -4000, rep: -1, chaos: 2 }, outcome: { art: 'react_founder_panic', text: 'Blorp is a dog groomer in Ohio. Their lawyer, Chad, wants $4,000.' } },
                },
              },
            ],
          },
          {
            id: 'coffee',
            icon: '☕',
            name: 'Coffee machine',
            title: 'Running on Empty',
            cast: ['char_founder'],
            prop: 'prop_coffee',
            text: 'You slept three hours. The coffee machine hums at you. It knows.',
            choices: [
              {
                dir: 'left',
                label: 'Skip it. Power nap.',
                short: 'Napped',
                hint: 'Rest is productive. Allegedly.',
                log: 'Took a power nap',
                gamble: {
                  win: { effects: { rep: 1, chaos: -1 }, outcome: { art: 'react_founder_proud', text: 'You wake up with a genius idea. It\'s "more water". It still counts.' } },
                  lose: { effects: { chaos: 1 }, outcome: { art: 'react_founder_sheepish', text: 'You sleep through two meetings. One of them was yours.' } },
                },
              },
              {
                dir: 'right',
                label: 'Get coffee. Pull an all-nighter.',
                short: 'All-nighter',
                hint: 'Ship a feature by sunrise. Or not.',
                log: 'Pulled an all-nighter',
                gamble: {
                  win: { effects: { cash: 9000, rep: 1, chaos: 1 }, outcome: { art: 'react_founder_exhausted', text: 'You ship a whole feature by sunrise. A customer pays $9,000 before you blink.' } },
                  lose: { effects: { cash: -2000, chaos: 2 }, outcome: { art: 'react_founder_panic', text: 'You knock the coffee over the laptop. All your work: gone. New laptop: $2,000.' } },
                },
              },
              {
                dir: 'up',
                label: 'Drink the whole pot.',
                short: 'Whole pot',
                hint: 'Your heart says no. Your heart is not the CEO.',
                log: 'Drank the whole pot',
                gamble: {
                  win: { effects: { cash: 14000, rep: 3, chaos: 1 }, outcome: { art: 'react_founder_proud', text: 'You see through time. You build the app, the website and a theme song. $14,000.' } },
                  lose: { effects: { rep: -2, chaos: 3 }, outcome: { art: 'react_founder_panic', text: 'You can hear colours. You call water "a scam" on live radio.' } },
                },
              },
            ],
          },
        ],
      },
      // ---------------------------------------------------------------- Tuesday
      {
        id: 'tue',
        day: 'Tuesday',
        place: 'Your front yard',
        stage: { shot: 'home_front', day: 2, hour: 10.5 },
        spots: [
          {
            id: 'garage',
            icon: '🎸',
            name: 'The band',
            title: 'The Garage',
            cast: ['char_band'],
            prop: 'prop_drumkit',
            text: 'Cousin Ricky\'s band, <b>Gravel Smoothie</b>, is in your garage. They\'re nine minutes into a song about a sandwich.',
            choices: [
              {
                dir: 'left',
                label: 'Let them rock. Work from Mom\'s.',
                short: 'Mom\'s sunroom',
                hint: 'Family peace. Mom\'s Wi-Fi password is a paragraph.',
                flags: { garage: 'mom' },
                log: 'Moved to Mom\'s sunroom',
                gamble: {
                  win: { effects: { cash: -2000, rep: 2, chaos: -1 }, outcome: { art: 'react_mom_beaming', text: 'Mom charges rent in lasagna ($2,000). The band dedicates the sandwich song to you.' } },
                  lose: { effects: { cash: -2000 }, outcome: { art: 'react_founder_sheepish', text: 'You spend the day guessing Mom\'s Wi-Fi password. And $2,000 on "utilities".' } },
                },
              },
              {
                dir: 'right',
                label: 'Sublet it as co-working space',
                short: 'Sublet',
                hint: 'Charge the band rent. And six strangers.',
                flags: { garage: 'sublet' },
                log: 'Turned the garage into co-working',
                gamble: {
                  win: { effects: { cash: 11000, chaos: 1 }, outcome: { art: 'react_founder_smug', text: 'Seven members, one bathroom, one goat. $11,000 in fees.' } },
                  lose: { effects: { cash: 2000, rep: -2, chaos: 2 }, outcome: { art: 'react_founder_panic', text: 'The goat eats the lease. Aunt Linda cancels Thanksgiving. You made $2,000.' } },
                },
              },
              {
                dir: 'up',
                label: 'Sign the band as your marketing team',
                short: 'Band signed',
                hint: 'Free jingles. Or a noise complaint.',
                log: 'Signed the band',
                gamble: {
                  win: { effects: { cash: 8000, rep: 5 }, flags: { garage: 'share' }, outcome: { art: 'react_band_rocking', text: 'They play the bowling alley. Encore. Encore. $8,000 in merch.' } },
                  lose: { effects: { cash: -3000, rep: -1, chaos: 2 }, flags: { garage: 'noise' }, outcome: { art: 'react_founder_panic', text: 'The police come about the noise. They stay for the sandwich song, cry, and fine you $3,000.' } },
                },
              },
            ],
          },
          {
            id: 'package',
            icon: '📦',
            name: 'Mystery box',
            title: 'A Box on the Porch',
            cast: ['char_founder'],
            prop: 'prop_box',
            text: 'A box on your porch. No label. It\'s ticking. Gently.',
            choices: [
              {
                dir: 'left',
                label: 'Leave it for Mom',
                short: 'Left it',
                hint: 'She opens everything anyway.',
                log: 'Left the box for Mom',
                gamble: {
                  win: { effects: { rep: 1, chaos: -1 }, outcome: { art: 'react_mom_beaming', text: 'It\'s a cake. Mom shares it with the street. They think you sent it.' } },
                  lose: { effects: { chaos: 1 }, outcome: { art: 'react_founder_shrug', text: 'It\'s 300 rubber ducks. They\'re in the house now. All of them.' } },
                },
              },
              {
                dir: 'right',
                label: 'Open it',
                short: 'Opened it',
                hint: 'What\'s the worst that could happen?',
                log: 'Opened the box',
                gamble: {
                  win: { effects: { cash: 9000 }, outcome: { art: 'react_founder_proud', text: 'A free 3D printer from a startup that went bust. You sell it for $9,000.' } },
                  lose: { effects: { rep: -1, chaos: 2 }, outcome: { art: 'react_founder_panic', text: 'Glitter bomb. From Chad. You\'ll be finding glitter for the rest of your life.' } },
                },
              },
              {
                dir: 'up',
                label: 'Shake it. Hard.',
                short: 'Shook it',
                hint: 'Ticking boxes love this.',
                log: 'Shook the box',
                gamble: {
                  win: { effects: { cash: 14000, rep: 2 }, outcome: { art: 'react_founder_smug', text: 'Cash falls out. $14,000 and a note: "for the vibe". The fleece-vest man strikes again.' } },
                  lose: { effects: { cash: -2000, rep: -1, chaos: 3 }, outcome: { art: 'react_founder_panic', text: 'It was a wasp nest. The news calls you "the bee guy". It was wasps.' } },
                },
              },
            ],
          },
        ],
      },
      // ---------------------------------------------------------------- Wednesday (×1.25)
      {
        id: 'wed',
        day: 'Wednesday',
        place: 'Town square',
        stakes: 'Bigger stakes',
        stage: { shot: 'square', day: 3, hour: 13 },
        spots: [
          {
            id: 'customer',
            icon: '🏋️',
            name: 'Gail',
            title: 'The First Customer',
            cast: ['char_customer'],
            prop: 'prop_contract',
            text: '<b>Gail</b> owns 40 gyms. She\'ll buy 2,000 subscriptions if your app can catch people lying about leg day. It can\'t.',
            choices: [
              {
                dir: 'left',
                label: 'Be honest',
                short: 'Honest',
                hint: 'Lose the sale. Gain a reputation.',
                flags: { customer: 'honest' },
                log: 'Told Gail the truth',
                gamble: {
                  win: { effects: { cash: -3000, rep: 3, chaos: -1 }, outcome: { art: 'react_customer_stare', text: 'Gail stares for eleven seconds. "Nobody tells me no." Now 40 gyms call you "the honest one".' } },
                  lose: { effects: { cash: -3000 }, outcome: { art: 'react_customer_stare', text: 'Gail respects you. Gail also makes you pay for her smoothie order: $3,000.' } },
                },
              },
              {
                dir: 'right',
                label: 'Promise it. Build it overnight.',
                short: 'Promised',
                hint: 'Cash now. Your left eye pays later.',
                flags: { customer: 'promise' },
                log: 'Promised the feature',
                gamble: {
                  win: { effects: { cash: 13000, chaos: 1 }, outcome: { art: 'react_founder_exhausted', text: 'The Leg Day Lie Detector mostly works. Gail pays $13,000. Your eye twitches in Morse code.' } },
                  lose: { effects: { cash: -3000, rep: -1, chaos: 2 }, outcome: { art: 'react_customer_stare', text: 'It flags Gail. Gail did legs. Refund: $3,000.' } },
                },
              },
              {
                dir: 'up',
                label: 'Fake a demo',
                short: 'Faked it',
                hint: 'Biggest payday of the week. If nobody checks.',
                log: 'Faked a demo',
                gamble: {
                  win: { effects: { cash: 18000, rep: 1, chaos: 1 }, flags: { customer: 'fake' }, outcome: { art: 'react_founder_smug', text: 'You point your phone at a trainer. "Beep. Lie detected." He confesses. Gail pays $18,000.' } },
                  lose: { effects: { cash: -4000, rep: -3, chaos: 3 }, flags: { customer: 'caught' }, outcome: { art: 'react_customer_stare', text: 'The trainer did do legs. He shows everyone. Twice. Gail wants her $4,000 back.' } },
                },
              },
            ],
          },
          {
            id: 'fountain',
            icon: '⛲',
            name: 'Fountain',
            title: 'The Wishing Fountain',
            cast: ['char_founder'],
            prop: 'prop_coins',
            text: 'Locals throw coins in for luck. There are a LOT of coins in there.',
            choices: [
              {
                dir: 'left',
                label: 'Walk past',
                short: 'Walked past',
                hint: 'Keep your head down.',
                log: 'Walked past the fountain',
                gamble: {
                  win: { effects: { cash: 3000, rep: 1 }, outcome: { art: 'react_founder_proud', text: 'You return a dropped wallet. It\'s the mayor\'s. Reward: $3,000.' } },
                  lose: { effects: { chaos: 1 }, outcome: { art: 'react_founder_sheepish', text: 'A pigeon. On your head. In front of Gail.' } },
                },
              },
              {
                dir: 'right',
                label: 'Toss a coin. Make a wish.',
                short: 'Made a wish',
                hint: 'Wish out loud. For the algorithm.',
                log: 'Made a wish',
                gamble: {
                  win: { effects: { rep: 4 }, outcome: { art: 'react_founder_proud', text: 'Your wish goes viral: "I wish my app worked." The whole town relates.' } },
                  lose: { effects: { cash: -3000, chaos: 2 }, outcome: { art: 'react_founder_panic', text: 'You\'re fined $3,000 for "wish littering". That\'s a real law here.' } },
                },
              },
              {
                dir: 'up',
                label: 'Fish out ALL the coins',
                short: 'Took the coins',
                hint: 'Finders keepers. Legally unclear.',
                log: 'Fished out the coins',
                gamble: {
                  win: { effects: { cash: 20000, chaos: 1 }, outcome: { art: 'react_founder_smug', text: 'It\'s $20,000 in quarters. You pay everyone in quarters forever.' } },
                  lose: { effects: { cash: -3000, rep: -3, chaos: 3 }, outcome: { art: 'react_founder_panic', text: 'Arrested. On a livestream. The mayor is in the chat. Bail: $3,000.' } },
                },
              },
            ],
          },
        ],
      },
      // ---------------------------------------------------------------- Thursday (×1.5)
      {
        id: 'thu',
        day: 'Thursday',
        place: 'Your room',
        stakes: 'Biggest stakes',
        stage: { shot: 'home_room', day: 4, hour: 16 },
        spots: [
          {
            id: 'intern',
            icon: '🧑‍🎓',
            name: 'Skyler',
            title: 'The Intern',
            cast: ['char_intern'],
            prop: 'prop_lanyard',
            text: '<b>Skyler</b>, 19, unpaid, wearing another company\'s lanyard: "Give me the keys. I can handle everything."',
            choices: [
              {
                dir: 'left',
                label: 'Coffee duty. And pay them.',
                short: 'Coffee duty',
                hint: 'Safe and decent. You might miss a genius.',
                flags: { intern: 'coffee' },
                log: 'Put the intern on (paid) coffee duty',
                gamble: {
                  win: { effects: { cash: -2000, rep: 2, chaos: -1 }, outcome: { art: 'react_intern_coffee', text: 'A perfect flat white. Their side project hits #1 worldwide. You\'ll never know.' } },
                  lose: { effects: { cash: -2000 }, outcome: { art: 'react_intern_coffee', text: 'Skyler pours oat milk into the router. $2,000 and a very sad router.' } },
                },
              },
              {
                dir: 'right',
                label: 'Rent Skyler out to Gail\'s gyms',
                short: 'Rented out',
                hint: 'An intern is a resource. Allegedly.',
                flags: { intern: 'rented' },
                log: 'Rented the intern out',
                gamble: {
                  win: { effects: { cash: 14000, rep: -2, chaos: 1 }, outcome: { art: 'react_founder_smug', text: 'Skyler is a personal trainer now. They\'ve never touched a weight. Gail pays $14,000.' } },
                  lose: { effects: { cash: -3000, rep: -2, chaos: 1 }, outcome: { art: 'react_founder_panic', text: 'Skyler drops a dumbbell on Gail\'s foot. You pay the $3,000 bill.' } },
                },
              },
              {
                dir: 'up',
                label: 'Give them the keys to everything',
                short: 'Full access',
                hint: 'Hidden genius, or a very clean database.',
                log: 'Gave the intern full access',
                gamble: {
                  win: { effects: { cash: 12000, rep: 4, chaos: 1 }, flags: { intern: 'access' }, outcome: { art: 'react_intern_glitter', text: 'Skyler fixes 30 bugs and sells your old logo to their uncle for $12,000. New title: "Wizard".' } },
                  lose: { effects: { cash: -5000, chaos: 4 }, flags: { intern: 'deleted' }, outcome: { art: 'react_intern_proud', text: 'Skyler "cleaned up a messy file called production". The database is gone. So is $5,000.' } },
                },
              },
            ],
          },
          {
            id: 'laptop',
            icon: '💻',
            name: 'Laptop',
            title: '47 Tabs',
            cast: ['char_founder'],
            prop: 'prop_laptop_fire',
            text: 'Your laptop has 47 tabs open. The fan sounds like a jet. It might take off.',
            choices: [
              {
                dir: 'left',
                label: 'Close some tabs',
                short: 'Closed tabs',
                hint: 'Digital spring cleaning.',
                log: 'Closed some tabs',
                gamble: {
                  win: { effects: { cash: 3000, chaos: -1 }, outcome: { art: 'react_founder_proud', text: 'Tab 31 was an invoice you forgot to send. $3,000, just like that.' } },
                  lose: { effects: { chaos: 1 }, outcome: { art: 'react_founder_sheepish', text: 'You close the tab with all your passwords. Forever.' } },
                },
              },
              {
                dir: 'right',
                label: 'Install the big update',
                short: 'Updated',
                hint: '"This may take a few minutes."',
                log: 'Installed the big update',
                gamble: {
                  win: { effects: { cash: 9000 }, outcome: { art: 'react_founder_proud', text: 'Everything runs twice as fast. You ship two features. $9,000.' } },
                  lose: { effects: { cash: -3000, chaos: 2 }, outcome: { art: 'react_founder_panic', text: 'It only plays a 1998 screensaver now. New laptop: $3,000.' } },
                },
              },
              {
                dir: 'up',
                label: 'Ask AI to write the whole app',
                short: 'AI wrote it',
                hint: 'What could go wrong? (Everything.)',
                log: 'Let AI write the whole app',
                gamble: {
                  win: { effects: { cash: 18000, rep: 3, chaos: 1 }, outcome: { art: 'react_founder_smug', text: 'It works. It\'s beautiful. It also invented a better business model. $18,000.' } },
                  lose: { effects: { cash: -3000, rep: -3, chaos: 3 }, outcome: { art: 'react_founder_panic', text: 'It writes a 900-page poem about water and emails it to every customer.' } },
                },
              },
            ],
          },
        ],
      },
    ],
  };

  // ---------------------------------------------------------------------------
  // Mid-level combos: fire once, right after the choice that completes them.
  // Wildcards set their flags only on the result that happened (JACKPOT or BUST).
  // ---------------------------------------------------------------------------
  const COMBOS = [
    {
      id: 'jingle',
      when: (f) => f.name === 'blorp' && f.garage === 'share',
      title: 'The Blorp Jingle',
      art: 'combo_jingle',
      stage: { shot: 'square' },
      effects: { cash: 2000, rep: 3 },
      text: 'Gravel Smoothie writes you a jingle. It\'s nine seconds long. It\'s just "Blorp! Blorp! Drink your water! Blorp!" It\'s playing at the bowling alley. It\'s playing at the dentist. A local baby\'s first word was "blorp". The baby\'s parents send $2,000 in royalties, out of fear.',
    },
    {
      id: 'paper',
      when: (f) => f.name === 'synergyze' && f.garage === 'sublet',
      title: 'Amazing on Paper',
      art: 'combo_paper',
      stage: { shot: 'office' },
      effects: { cash: -8000, rep: 1, chaos: 1 },
      text: 'Synergyze Co-Working gets a glass front office. Standing desks. A kombucha tap you didn\'t ask for but did sign for. The pitch deck has never looked better. Your bank app has started sending thoughts and prayers.',
    },
    {
      id: 'big_heart',
      when: (f) => f.name === 'bob' && f.customer === 'honest',
      title: 'Small Startup With Big Heart',
      art: 'combo_big_heart',
      stage: { shot: 'post_office' },
      effects: { cash: 2000, rep: 2 },
      text: 'The local paper puts you on the front page: "SMALL STARTUP WITH BIG HEART." Mom buys 60 copies and laminates one for the fridge. A retired dentist mails you $2,000 "for being decent."',
    },
    {
      id: 'demo_disaster',
      when: (f) => f.customer === 'fake' && f.intern === 'deleted',
      title: 'Live Demo, Live Disaster',
      art: 'combo_demo_disaster',
      stage: { shot: 'town_hall' },
      effects: { cash: -10000, rep: -3, chaos: 3 },
      text: 'Worst possible timing: Gail was back for a second demo, with her whole board. Mid "beep... lie detected", the database vanished. The app vanished. Skyler waved. Gail wants a refund. And a lawyer. You don\'t have a lawyer. You have Skyler.',
    },
  ];

  // ---------------------------------------------------------------------------
  // Game over. Checked after every card: the first line crossed ends the run.
  // ---------------------------------------------------------------------------
  const FAILS = {
    combustion: {
      title: 'Spontaneous Combustion',
      tagline: 'Chaos hit 10',
      test: (s) => s.chaos >= METER_MAX,
      art: 'fail_combustion',
      stage: { shot: 'home_front', hour: 22 },
      text: 'It started with a small "pop" behind the dryer. The laptop server, the goat, the kombucha tap and a 14-minute song about a sandwich all reached critical mass at once. The fire department calls it "honestly kind of impressive". {co} is a crater with a gift shop.',
    },
    bankrupt: {
      title: 'Bankrupt',
      tagline: 'Cash hit $0',
      test: (s) => s.cash <= 0,
      art: 'fail_bankrupt',
      stage: { shot: 'home_front', hour: 19 },
      text: 'Your card is declined at the vending machine. Then by the vending machine\'s manager. {co} is sold at auction for $43 and a coupon. The buyer is Mom. She\'s keeping it on the fridge.',
    },
    forgotten: {
      title: 'Forgotten',
      tagline: 'Rep hit 0',
      test: (s) => s.rep <= 0,
      art: 'fail_forgotten',
      stage: { shot: 'square', hour: 18 },
      text: 'Nobody hates {co}. Nobody remembers it. Your own app sends you a reminder to drink water, then asks who you are. Even Mom introduces you as "my child, who does... computers?"',
    },
  };
  const FAIL_ORDER = ['combustion', 'bankrupt', 'forgotten'];

  // ---------------------------------------------------------------------------
  // Friday Review endings. Rules are checked in ENDING_ORDER; first match wins.
  // The ending grid: Rep HIGH endings (Unicorn, Viral, Broke but Legit, Wholesome) are the
  // loved companies; without high Rep you're Fake It (rich) or Total Meltdown
  // (the survivable bottom, on to Mom's basement). Meltdown is the catch-all.
  // ---------------------------------------------------------------------------
  const ENDINGS = {
    unicorn: {
      short: 'Unicorn',
      title: 'Unicorn',
      tagline: 'You won Week One',
      rule: (l) => l.cash === 'HIGH' && l.rep === 'HIGH' && l.chaos === 'MID',
      ruleText: 'Cash HIGH, Rep HIGH, Chaos MID (just enough)',
      art: 'end_unicorn',
      stage: { shot: 'overview', day: 5, hour: 20 },
      text: 'Money in the bank. A town that loves you. Just enough chaos to look exciting in a photo. {co} is, on paper and in real life, a real company. Devin has already ordered a gold hoodie. It\'s for you.',
    },
    viral: {
      short: 'Viral',
      title: 'Accidental Viral',
      tagline: 'High Chaos, high Rep',
      rule: (l) => l.rep === 'HIGH' && l.chaos === 'HIGH',
      ruleText: 'Rep HIGH, Chaos HIGH',
      art: 'end_viral',
      stage: { shot: 'overview', day: 5, hour: 20.5 },
      text: 'Nobody knows what {co} does, but they really, really love it. You\'re trending in three countries. Your phone is hot to the touch. So is the laptop on the shelf.',
    },
    broke: {
      short: 'Broke but Legit',
      title: 'Broke but Legit',
      tagline: 'Low Cash, high Rep',
      rule: (l) => l.rep === 'HIGH' && l.cash === 'LOW',
      ruleText: 'Rep HIGH, Cash LOW',
      art: 'end_broke',
      stage: { shot: 'home_front', day: 5, hour: 19.5 },
      text: 'You have {cash} and a spotless reputation. Everyone in town trusts {co}. Your landlord respects you deeply. Your landlord would also like rent.',
    },
    meltdown: {
      short: 'Meltdown',
      title: 'Total Meltdown',
      tagline: 'Alive, technically',
      rule: () => true,
      ruleText: 'Everything else: nothing high, nothing working',
      art: 'end_meltdown',
      stage: { shot: 'home_front', day: 5, hour: 22 },
      text: 'Nothing exploded. Nothing worked either. Not the money, not the reputation, not the intern (they left, and they took the plant). {co} is now a cautionary tale told at other startups\' offsites. But listen... Mom called. The basement\'s free.',
      bonus: 'Basement Bonus unlocked: pancakes, a futon, and a small envelope with your name on it.',
    },
    fakeit: {
      short: 'Fake It',
      title: 'Fake It Till You Make It',
      tagline: 'High Cash, low trust',
      rule: (l) => l.cash === 'HIGH',
      ruleText: 'Cash HIGH, Rep not high',
      art: 'end_fakeit',
      stage: { shot: 'town_hall', day: 5, hour: 20 },
      text: 'Your bank account is up. Your grip on reality is down. {co} has customers, revenue, and at least one feature that does not exist. Yet.',
    },
    wholesome: {
      short: 'Wholesome',
      title: 'The Wholesome Startup',
      tagline: 'High Rep, Chaos under control',
      rule: (l) => l.rep === 'HIGH',
      ruleText: 'Rep HIGH, Chaos under control',
      art: 'end_wholesome',
      stage: { shot: 'square', day: 5, hour: 19 },
      text: 'You didn\'t get rich, but a stranger hugged you at the farmers\' market. Twice. People trust {co}. Even the dog park group chat only has nice things to say.',
    },
  };
  const ENDING_ORDER = ['unicorn', 'viral', 'broke', 'wholesome', 'fakeit', 'meltdown'];

  // ---------------------------------------------------------------------------
  // Level 2: Month One. One opening per ending.
  // ---------------------------------------------------------------------------
  const MONTH_ONE = {
    id: 'month1',
    number: 2,
    title: 'Month One',
    intro: 'Your Friday Review sealed it. Here\'s what Month One throws at you.',
    stage: { shot: 'overview', day: 29, hour: 8 },
    scenes: {
      unicorn: {
        id: 'magazine_cover',
        day: 'Month One',
        title: 'The Magazine Cover',
        stage: { shot: 'post_office', day: 29, hour: 10 },
        cast: ['char_founder'],
        prop: 'prop_magazine',
        text:
          '<b>Tri-County Business Monthly</b> wants {co} on the cover of its "30 Under 30 Minutes" issue. ' +
          'The photographer has one rule: "Bring a prop that says who you are." Devin has brought a live horse, just in case.',
        choices: [
          {
            dir: 'left',
            label: 'Sell the cover as an ad',
            short: 'Sold the cover',
            hint: 'Your face, sponsored by a mattress store.',
            effects: { cash: 8000, rep: -1, chaos: 1 },
            outcome: {
              art: 'react_founder_smug',
              text: 'The cover reads "{co}: SLEEP ON IT" over a mattress. Your face is in the bottom corner, small, like a warning label. The mattress store pays $8,000 and sends a mattress. It does not fit through the door.',
            },
          },
          {
            dir: 'up',
            label: 'Shoot it on the horse',
            short: 'The horse',
            hint: 'Iconic. Or a hospital visit.',
            gamble: {
              bias: 15, // Wild base is 35%; the horse is a fair coin flip
              win: {
                effects: { cash: 3000, rep: 3, chaos: 1 },
                outcome: {
                  art: 'react_founder_proud',
                  text: 'The horse rears at exactly the right moment. The photo goes everywhere. It is the most powerful image of a water-reminder app in human history. Someone buys the print for $3,000.',
                },
              },
              lose: {
                effects: { cash: -4000, rep: -1, chaos: 3 },
                outcome: {
                  art: 'react_founder_panic',
                  text: 'The horse has opinions about flash photography. The cover photo is mostly hoof. The horse\'s owner sends a $4,000 invoice for "emotional damages" and a separate one for the horse.',
                },
              },
            },
          },
          {
            dir: 'right',
            label: 'Put Mom on the cover',
            short: 'Mom\'s cover',
            hint: 'She did name half the companies in this town.',
            effects: { cash: -1000, rep: 3, chaos: -1 },
            outcome: {
              art: 'react_mom_beaming',
              text: 'Mom poses with a casserole and the business cards. The headline reads "THE WOMAN BEHIND {co}". She buys 200 copies ($1,000) and signs them for the mail carrier.',
            },
          },
        ],
      },
      wholesome: {
        id: 'fan_letter',
        day: 'Month One',
        title: 'The Fan Letter',
        stage: { shot: 'bakery', day: 29, hour: 10 },
        cast: ['char_grandma'],
        prop: 'prop_fan_letter',
        text:
          'A letter in very careful handwriting: "Your app saved my grandma\'s bakery. She drinks water now and bakes 300 cinnamon rolls a day." ' +
          '<b>Good Morning, Tri-County!</b> wants an interview. Tomorrow. 6am. Live.',
        choices: [
          {
            dir: 'left',
            label: 'Say yes. Wear a tie.',
            short: 'Wore a tie',
            hint: 'You look like a substitute teacher. It\'s perfect.',
            effects: { cash: 2000, rep: 2, chaos: 1 },
            outcome: {
              art: 'react_founder_panic',
              text: 'You say "synergy" four times out of pure fear. The tie is crooked in every shot. Downloads double anyway. The tie now has its own fan account.',
            },
          },
          {
            dir: 'up',
            label: 'Send Mom',
            short: 'Sent Mom',
            hint: 'She will steal the show.',
            effects: { rep: 3, chaos: 2 },
            outcome: {
              art: 'react_mom_beaming',
              text: 'Mom brings a casserole to the studio, calls the anchor "sweetheart" and plugs her quilting blog. The clip gets 2 million views. You\'re mentioned once, as "my kid, the app one."',
            },
          },
          {
            dir: 'right',
            label: 'Decline. Stay humble.',
            short: 'Stayed humble',
            hint: 'Quiet wins. Literally.',
            effects: { rep: 1, chaos: -1 },
            outcome: {
              art: 'react_founder_proud',
              text: 'You send the bakery a thank-you card instead. Grandma writes back: "Humble AND hydrated." Nobody else hears about it. That\'s sort of the point.',
            },
          },
        ],
      },
      fakeit: {
        id: 'demo_returns',
        day: 'Month One',
        title: 'The Demo Returns',
        stage: { shot: 'inn', day: 29, hour: 11.5 },
        cast: ['char_ceo'],
        prop: 'prop_clipboard',
        text: (s) => {
          if (s.flags.customer === 'fake')
            return 'Gail\'s CEO, <b>Mr. Thornbury</b>, flies in tomorrow to see the Leg Day Lie Detector. The one you demoed. The one that does not exist. He\'s "very excited" and "bringing his legs."';
          if (s.flags.customer === 'promise')
            return 'Gail\'s CEO, <b>Mr. Thornbury</b>, flies in tomorrow to see the Leg Day Lie Detector. The one you built overnight. The one held together with hope. He wants to see it "at scale."';
          return 'Gail\'s CEO, <b>Mr. Thornbury</b>, heard you were "the honest one" and decided you were just being modest about the Leg Day Lie Detector. He flies in tomorrow to see it. It still does not exist.';
        },
        choices: [
          {
            dir: 'left',
            label: 'Build it overnight',
            short: 'Built it',
            hint: 'Another all-nighter. What could go wrong?',
            effects: { cash: 5000, rep: 2, chaos: 2 },
            outcome: {
              art: 'react_founder_exhausted',
              text: 'At 4:58am the Leg Day Lie Detector works for real. At 9am it scans Mr. Thornbury and flags him immediately. He respects that. He signs. You sleep for 19 hours.',
            },
          },
          {
            dir: 'up',
            label: 'Fake it harder',
            short: 'Hired Clipboard Greg',
            hint: 'Hire a guy with a very convincing clipboard.',
            effects: { cash: 8000, chaos: 4 },
            outcome: {
              art: 'react_clipboard_greg',
              text: 'Clipboard Greg arrives. He nods. He frowns at a router. He says "hmm, latency" with total authority. Mr. Thornbury signs a three-year deal. Clipboard Greg would also like a three-year deal.',
            },
          },
          {
            dir: 'right',
            label: 'Confess everything',
            short: 'Confessed',
            hint: 'Lose the client. Keep your soul.',
            effects: { cash: -5000, rep: 3, chaos: -2 },
            outcome: {
              art: 'react_founder_sheepish',
              text: 'You tell him the truth. He cancels the contract, then shakes your hand on the way out. Your soul has never felt cleaner. Your bank account has stopped returning your calls.',
            },
          },
        ],
      },
      viral: {
        id: 'one_server',
        day: 'Month One',
        title: '10,000 Users, 1 Server',
        stage: { shot: 'home_room', day: 29, hour: 23 },
        cast: ['react_founder_panic'],
        prop: 'prop_laptop_fire',
        text: 'Overnight, {co} hit <b>10,000 users</b>. Your "server" is a laptop on a shelf above the dryer. It\'s making a noise like a kettle. It is, technically, a little bit on fire.',
        choices: [
          {
            dir: 'left',
            label: 'Buy real servers',
            short: 'Bought servers',
            hint: 'Expensive. Fireproof.',
            effects: { cash: -5000, rep: 1, chaos: -2 },
            outcome: {
              art: 'react_founder_proud',
              text: 'Real servers. Real money. The laptop retires with full honours and a small ceremony. It still smells like toast.',
            },
          },
          {
            dir: 'up',
            label: 'Duct tape',
            short: 'Duct tape',
            hint: 'Chaos up. Fire up.',
            effects: { rep: -1, chaos: 3 },
            outcome: {
              art: 'react_founder_smug',
              text: 'You tape a desk fan to the laptop, then a smaller fan to the fan. Uptime: 61%. Fire: also 61%. The fire department knows your first name now.',
            },
          },
          {
            dir: 'right',
            label: 'Ask the internet why',
            short: 'Asked the internet',
            hint: 'It\'s a meme. Not the app.',
            effects: { rep: 1, chaos: 2 },
            outcome: {
              art: 'react_founder_shrug',
              text: (s) => {
                if (s.flags.name === 'blorp' && s.flags.garage === 'share')
                  return 'It\'s the Blorp jingle. Someone remixed it with a goat. It\'s a meme. Not the app. Nobody has opened the app.';
                if (s.flags.name === 'blorp')
                  return 'Turns out people just like saying "Blorp". That\'s it. That\'s the whole meme. Nobody has opened the app.';
                if (s.flags.garage === 'share')
                  return 'Turns out Ricky\'s drummer fell off a ladder in the background of your launch video. It\'s a meme. Not the app. Nobody has opened the app.';
                return 'Turns out your app store page has a typo: "Drink more water, or else." People think it\'s a threat. It\'s a meme. Not the app. Nobody has opened the app.';
              },
            },
          },
        ],
      },
      broke: {
        id: 'investor_calls',
        day: 'Month One',
        title: 'The Investor Calls',
        stage: { shot: 'home_front', day: 29, hour: 9.5 },
        cast: ['char_investor'],
        prop: 'prop_logo_swatches',
        text: 'A venture capitalist named <b>Preston</b> calls. He "loves your integrity" and wants to give you $40,000. In exchange: 40% of {co} and "a say in the logo." He has already said the word "beige" twice.',
        choices: [
          {
            dir: 'left',
            label: 'Accept',
            short: 'Accepted',
            hint: '40% and a say in your logo.',
            effects: { cash: 40000, rep: -1, chaos: 1 },
            outcome: {
              art: 'react_founder_sheepish',
              text: '$40,000 lands in your account. By Monday the logo is beige. By Tuesday it\'s "greige". Preston calls it "bold". Mom calls it "nice, sweetie".',
            },
          },
          {
            dir: 'up',
            label: 'Negotiate',
            short: 'Negotiated',
            hint: 'Haggle over the logo colour.',
            minigame: 'logoHaggle',
          },
          {
            dir: 'right',
            label: 'Refuse',
            short: 'Refused',
            hint: 'Eat instant noodles.',
            effects: { cash: -300, rep: 2 },
            outcome: {
              art: 'react_founder_proud',
              text: 'You say no. Preston says "nobody says no to Preston," then hangs up, confused. You celebrate with chicken-flavour instant noodles. You still own 100% of {co}. It\'s worth roughly one noodle.',
            },
          },
        ],
      },
      meltdown: {
        id: 'moms_basement',
        day: 'Month One',
        title: 'Mom\'s Basement',
        stage: { shot: 'moms_house', day: 29, hour: 19.5 },
        cast: ['char_mom'],
        prop: 'prop_pancakes',
        bonus: {
          title: 'Basement Bonus',
          effects: { cash: 500, rep: 1 },
          text: 'Mom\'s "emergency envelope" (+$500) and a pep talk: "Your uncle failed at six businesses before the hot-tub thing took off."',
        },
        text: 'Mom\'s basement. There are pancakes. There\'s a futon that remembers your shape. Mom slides over the syrup and asks the question: <b>"So... what\'s the plan?"</b>',
        choices: [
          {
            dir: 'left',
            label: 'Same idea again',
            short: 'Same idea',
            hint: 'Wiser now. Stickier, too.',
            effects: { rep: 1, chaos: -1 },
            outcome: {
              art: 'react_mom_beaming',
              text: 'Same app, same you, better pancakes. Mom becomes your first beta tester. She files a bug report every four minutes. Most are about the font size. All of them are correct.',
            },
          },
          {
            dir: 'up',
            label: 'Pivot to something absurd',
            short: 'Pivoted',
            hint: 'Bold. Possibly involving ducks.',
            effects: { cash: 1000, rep: 1, chaos: 3 },
            outcome: {
              art: 'react_cofounder_thrilled',
              stage: { shot: 'park' },
              text: 'You pivot to <b>LinkedIn for Ducks</b>. By dinner, 300 duck owners have signed up and a mallard has been endorsed for "Leadership". Devin is already recording a podcast about it.',
            },
          },
          {
            dir: 'right',
            label: 'Get a day job',
            short: 'Day job',
            hint: 'Steady pay. The dream takes a nap.',
            effects: { cash: 3000, chaos: -2 },
            outcome: {
              art: 'react_founder_sheepish',
              text: 'You take a job handing out towels at Gail\'s gym. Steady paycheck. Free smoothies. At night, in the basement, you keep coding. The dream isn\'t dead. It\'s just napping.',
            },
          },
        ],
      },
    },
  };

  // Placeholder minigame for "Negotiate": stop the needle on the colour bar.
  // position runs 0 (Preston's beige) to 1 (your Electric Tangerine).
  const LOGO_HAGGLE = {
    title: 'Logo Colour Showdown',
    art: 'react_investor_haggle',
    text: 'Preston wants <b>Beige</b>. You want <b>Electric Tangerine</b>. Stop the needle as close to your colour as you can. One shot.',
    tiers: [
      {
        min: 0.75,
        colour: 'Electric Tangerine',
        swatch: '#ff6a13',
        effects: { cash: 40000, rep: 2 },
        text: 'Electric Tangerine! Preston blinks first. You get the $40,000, your colour, AND he drops to 25%. He\'s wearing sunglasses indoors now. Because of you.',
      },
      {
        min: 0.35,
        colour: 'Business Peach',
        swatch: '#f4a77c',
        effects: { cash: 40000, rep: 1 },
        text: 'Business Peach. Everyone hates it equally, which is how you know it\'s a fair deal. 33%, a firm handshake, and a logo the colour of a dentist\'s waiting room.',
      },
      {
        min: 0,
        colour: 'Beige',
        swatch: '#d9c9a8',
        effects: { cash: 40000, chaos: 1 },
        text: 'Beige. Preston smiles like a shark at a spa. Still 40%. But he lets you keep the font, which he calls "brave".',
      },
    ],
  };

  const TBC = {
    title: 'To be continued…',
    subtitle: 'Level 3: Year One',
    text: 'Coming soon. Probably. Skyler has the files.',
    stage: { shot: 'sky', day: 30, hour: 5.75 },
  };

  // ---------------------------------------------------------------------------
  // Rules engine (shared by the game and tools/paths.js)
  // ---------------------------------------------------------------------------
  function newState() {
    return {
      cash: START.cash,
      rep: START.rep,
      chaos: START.chaos,
      flags: {},
      company: null,
      log: [],
      combos: [],
      ending: null,
      month: null,
    };
  }

  function evalEffects(state, effects) {
    const out = {};
    for (const k of ['cash', 'rep', 'chaos']) {
      if (effects && effects[k] != null) out[k] = typeof effects[k] === 'function' ? effects[k](state) : effects[k];
    }
    return out;
  }

  // Applies effects and returns the deltas that actually landed (after clamping).
  function applyEffects(state, effects) {
    const raw = evalEffects(state, effects);
    const applied = {};
    for (const k of Object.keys(raw)) {
      const before = state[k];
      const max = k === 'cash' ? Infinity : METER_MAX;
      state[k] = Math.max(0, Math.min(max, before + raw[k]));
      if (state[k] !== before) applied[k] = state[k] - before;
    }
    return applied;
  }

  // Wildcard odds in percent, from the meters (see DECISION RULES).
  function odds(state, choice) {
    if (!choice || !choice.gamble) return null;
    const base = typeof ODDS.base === 'number' ? ODDS.base : ODDS.base[choice.dir];
    const p = base + ODDS.perPoint * (state.rep - state.chaos) + (choice.gamble.bias || 0);
    return Math.max(ODDS.min, Math.min(ODDS.max, p));
  }

  // The part of a choice that happened: the choice itself, or a Wildcard's JACKPOT/BUST branch.
  function branch(choice, won) {
    return choice.gamble ? (won ? choice.gamble.win : choice.gamble.lose) : choice;
  }

  // Applies a choice. For a Wildcard pass won = true (JACKPOT) or false (BUST).
  function choose(state, choice, won) {
    const b = branch(choice, won);
    Object.assign(state.flags, choice.flags || {}, (b !== choice && b.flags) || {});
    if (choice.company) state.company = choice.company;
    const log = b.log || choice.log;
    if (log) state.log.push(log);
    return applyEffects(state, b.effects);
  }

  // Ending compass: where the meters point right now, or where a choice would take you.
  // Returns { fail } if a fail line would be crossed, else { ending } (the Review's verdict).
  function project(state, choice, won) {
    const s = JSON.parse(JSON.stringify(state));
    if (choice) {
      choose(s, choice, won);
      let f = failCheck(s);
      if (f) return { fail: f };
      for (const c of newCombos(s)) {
        applyEffects(s, c.effects);
        f = failCheck(s);
        if (f) return { fail: f };
      }
    }
    const f = failCheck(s);
    return f ? { fail: f } : { ending: pickEnding(s).id };
  }

  // Returns the game-over id once a fail line is crossed, else null.
  function failCheck(state) {
    return FAIL_ORDER.find((id) => FAILS[id].test(state)) || null;
  }

  // Returns combos that became true and have not fired yet (marks them fired).
  function newCombos(state) {
    const fired = COMBOS.filter((c) => !state.combos.includes(c.id) && c.when(state.flags));
    fired.forEach((c) => state.combos.push(c.id));
    return fired;
  }

  function levels(state) {
    return {
      cash: state.cash < LEVELS.cash.low ? 'LOW' : state.cash >= LEVELS.cash.high ? 'HIGH' : 'MID',
      rep: state.rep <= LEVELS.rep.low ? 'LOW' : state.rep >= LEVELS.rep.high ? 'HIGH' : 'MID',
      chaos: state.chaos <= LEVELS.chaos.low ? 'LOW' : state.chaos >= LEVELS.chaos.high ? 'HIGH' : 'MID',
    };
  }

  function pickEnding(state) {
    const l = levels(state);
    const id = ENDING_ORDER.find((e) => ENDINGS[e].rule(l));
    return { id, levels: l };
  }

  function fmtCash(n) {
    return (n < 0 ? '-$' : '$') + Math.abs(Math.round(n)).toLocaleString('en-US');
  }

  // Resolves text that may be a function and fills {co} / {cash}.
  function fill(text, state) {
    const t = typeof text === 'function' ? text(state) : text;
    return String(t)
      .replace(/\{co\}/g, state.company || 'your startup')
      .replace(/\{cash\}/g, fmtCash(state.cash));
  }

  const STORY = {
    START, METER_MAX, LEVELS, ODDS, ART, IDEA, TITLE_STAGE, WEEK_ONE, COMBOS, FAILS, FAIL_ORDER, ENDINGS, ENDING_ORDER, MONTH_ONE, LOGO_HAGGLE, TBC,
    newState, evalEffects, applyEffects, odds, branch, choose, failCheck, project, newCombos, levels, pickEnding, fmtCash, fill,
  };

  root.STORY = STORY;
  if (typeof module !== 'undefined' && module.exports) module.exports = STORY;
})(typeof window !== 'undefined' ? window : globalThis);
