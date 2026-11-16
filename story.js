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
  const START = { cash: 10000, rep: 2, chaos: 2 };
  const METER_MAX = 10; // Rep and Chaos run 0–10. Cash is dollars, never below $0.

  // What counts as LOW / HIGH when the Friday Review reads your meters.
  const LEVELS = {
    cash: { low: 8000, high: 16000 }, // LOW is below $8,000, HIGH is $16,000 or more
    rep: { low: 3, high: 6 }, //         LOW is 3 or less,     HIGH is 6 or more
    chaos: { low: 3, high: 6 },
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

  const WEEK_ONE = {
    id: 'week1',
    number: 1,
    title: 'Week One',
    intro: 'Five days. Four big decisions. One garage. On Friday, the review decides what kind of company you are.',
    stage: { shot: 'home_front', day: 1, hour: 8 },
    review: { shot: 'home_room', day: 5, hour: 18.5 },
    scenes: [
      {
        id: 'name',
        day: 'Monday',
        title: 'The Name',
        stage: { shot: 'home_room', day: 1, hour: 9 },
        cast: ['char_cofounder', 'char_mom'],
        prop: 'prop_name_whiteboard',
        text:
          'Your co-founder Devin wants <b>"Synergyze"</b>. "With a Y. And a Z. Vowels are for legacy brands." ' +
          'Mom wants <b>"Bob\'s Apps"</b>. Nobody here is called Bob. "It sounds like a man who\'d return your lawnmower."',
        choices: [
          {
            dir: 'left',
            label: 'Go trendy: Synergyze',
            short: 'Synergyze',
            hint: 'Investors love it. Customers can\'t pronounce it.',
            effects: { cash: 2000, chaos: 1 },
            flags: { name: 'synergyze' },
            company: 'Synergyze',
            log: 'Named it Synergyze',
            outcome: {
              art: 'react_cofounder_thrilled',
              text: 'A man in a fleece vest wires you $2,000 "for the vibe". Your first customer email begins: "Dear Sinner-Geez."',
            },
          },
          {
            dir: 'up',
            label: 'Random word generator',
            short: 'BLORP',
            hint: 'It lands on "Blorp". Goes viral later, for better or worse.',
            effects: { rep: 1, chaos: 2 },
            flags: { name: 'blorp' },
            company: 'Blorp',
            log: 'Named it Blorp',
            outcome: {
              art: 'react_founder_shrug',
              text: 'BLORP. It\'s on the mugs. It\'s on the hoodie. Your accountant said it out loud and had to sit down. No take-backs.',
            },
          },
          {
            dir: 'right',
            label: 'Go with Mom: Bob\'s Apps',
            short: 'Bob\'s Apps',
            hint: 'Charming. Nobody takes you seriously.',
            effects: { rep: 2, chaos: -1 },
            flags: { name: 'bob' },
            company: 'Bob\'s Apps',
            log: 'Named it Bob\'s Apps',
            outcome: {
              art: 'react_mom_beaming',
              text: 'Mom prints 500 business cards with a clip-art thumbs-up. The bank teller pats your hand. A venture capitalist laughs until he has to lie down.',
            },
          },
        ],
      },
      {
        id: 'garage',
        day: 'Tuesday',
        title: 'The Garage',
        stage: { shot: 'home_front', day: 2, hour: 10.5 },
        cast: ['char_band'],
        prop: 'prop_drumkit',
        text:
          'Your garage is also the rehearsal space for your cousin Ricky\'s band, <b>Gravel Smoothie</b>. ' +
          'They\'re halfway through a 14-minute song about a sandwich. Ricky asks if you have "a spare extension cord and maybe a dream."',
        choices: [
          {
            dir: 'left',
            label: 'Kick them out',
            short: 'Kicked out',
            hint: 'Quiet workspace. Family drama.',
            effects: { rep: -2, chaos: -1 },
            flags: { garage: 'kick' },
            log: 'Kicked the band out',
            outcome: {
              art: 'react_founder_sheepish',
              text: 'Silence. Beautiful, productive silence. Also 23 texts from Aunt Linda. Thanksgiving has been "rescheduled". You are not invited to the new date.',
            },
          },
          {
            dir: 'up',
            label: 'Share the garage',
            short: 'Shared',
            hint: 'The band becomes your unofficial marketing team.',
            effects: { rep: 2, chaos: 2 },
            flags: { garage: 'share' },
            log: 'Shared the garage with the band',
            outcome: {
              art: 'react_band_rocking',
              text: 'Ricky paints your logo on the bass drum. Stand-ups now happen between guitar solos. Productivity: down. Vibes: illegal.',
            },
          },
          {
            dir: 'right',
            label: 'Rent an office',
            short: 'Office',
            hint: 'Burns half your cash. But you look legit.',
            effects: { cash: (s) => -Math.round(s.cash / 2), rep: 2 },
            flags: { garage: 'office' },
            log: 'Rented an office',
            outcome: {
              art: 'react_founder_proud',
              stage: { shot: 'office' },
              text: 'Half your money later: a desk, a plant, and a door with your name on it. Spelled wrong. You have never felt more legitimate.',
            },
          },
        ],
      },
      {
        id: 'customer',
        day: 'Wednesday',
        title: 'The First Customer',
        stage: { shot: 'square', day: 3, hour: 13 },
        cast: ['char_customer'],
        prop: 'prop_contract',
        text:
          '<b>Gail</b> owns 40 gyms and a whistle she never takes off. She wants 2,000 subscriptions, today, ' +
          'if your app can tell when members lie about leg day. Your app reminds people to drink water. That\'s it. That\'s the app.',
        choices: [
          {
            dir: 'left',
            label: 'Promise it. Build it overnight.',
            short: 'Promised',
            hint: 'Cash now. Burnout later.',
            effects: { cash: 6000, rep: 1, chaos: 2 },
            flags: { customer: 'promise' },
            log: 'Promised the feature and built it overnight',
            outcome: {
              art: 'react_founder_exhausted',
              text: 'You code until sunrise on energy drinks and spite. The Leg Day Lie Detector mostly works. Gail pays up. Your left eye is now blinking in Morse code.',
            },
          },
          {
            dir: 'up',
            label: 'Fake a demo',
            short: 'Faked it',
            hint: 'Works until it doesn\'t.',
            effects: { cash: 8000, chaos: 3 },
            flags: { customer: 'fake' },
            log: 'Faked a demo',
            outcome: {
              art: 'react_founder_smug',
              text: 'You point your phone at Gail\'s personal trainer and say "beep... lie detected." He confesses on the spot. Gail signs immediately. You have invented nothing, and also invoice #001.',
            },
          },
          {
            dir: 'right',
            label: 'Be honest',
            short: 'Honest',
            hint: 'Lose the sale. Gain trust.',
            effects: { rep: 3, chaos: -1 },
            flags: { customer: 'honest' },
            log: 'Told Gail the truth',
            outcome: {
              art: 'react_customer_stare',
              text: 'Gail stares at you for eleven full seconds. "Nobody\'s ever told me no." No sale. But she tells all 40 gyms you\'re "the honest one."',
            },
          },
        ],
      },
      {
        id: 'intern',
        day: 'Thursday',
        title: 'The Intern',
        stage: { shot: 'home_room', day: 4, hour: 16 },
        cast: ['char_intern'],
        prop: 'prop_lanyard',
        text:
          '<b>Skyler</b> is 19, unpaid and vibrating with enthusiasm. They\'re wearing a lanyard from a completely different company. ' +
          '"Honestly? Give me the keys. I can handle everything."',
        choices: [
          {
            dir: 'left',
            label: 'Give them real access',
            short: 'Full access',
            hint: 'Great work... then the database.',
            effects: { cash: -1000, rep: 1, chaos: 3 },
            flags: { intern: 'access' },
            log: 'Gave the intern real access',
            outcome: {
              art: 'react_intern_proud',
              text: 'By lunch, Skyler has fixed 30 bugs and made the logo 40% friendlier. By 3pm they\'ve "cleaned up a huge messy file called production." The database is gone. Skyler is so proud of all the free space.',
            },
          },
          {
            dir: 'up',
            label: 'Make them co-founder (10%)',
            short: 'Co-founder',
            hint: 'A future regret. Legally binding.',
            effects: { rep: 1, chaos: 1 },
            flags: { intern: 'cofounder' },
            log: 'Made the intern a 10% co-founder',
            outcome: {
              art: 'react_intern_glitter',
              text: 'Skyler signs the paperwork in glitter pen. First executive decision: a nap pod. Second: a company anthem. Somewhere in the future, a lawyer feels a disturbance.',
            },
          },
          {
            dir: 'right',
            label: 'Coffee duty',
            short: 'Coffee duty',
            hint: 'Safe. But you might miss a hidden genius.',
            effects: { chaos: -1 },
            flags: { intern: 'coffee' },
            log: 'Put the intern on coffee duty',
            outcome: {
              art: 'react_intern_coffee',
              text: 'Skyler makes a flawless oat-milk flat white. Unrelated: their weekend side project just hit #1 on every coding site on Earth. You\'ll never know. Great coffee, though.',
            },
          },
        ],
      },
    ],
  };

  // ---------------------------------------------------------------------------
  // Mid-level combos: fire once, right after the choice that completes them.
  // ---------------------------------------------------------------------------
  const COMBOS = [
    {
      id: 'jingle',
      when: (f) => f.name === 'blorp' && f.garage === 'share',
      title: 'The Blorp Jingle',
      art: 'combo_jingle',
      stage: { shot: 'square' },
      effects: { rep: 3, chaos: 2 },
      text: 'Gravel Smoothie writes you a jingle. It\'s nine seconds long. It\'s just "Blorp! Blorp! Drink your water! Blorp!" It\'s playing at the bowling alley. It\'s playing at the dentist. A local baby\'s first word was "blorp".',
    },
    {
      id: 'paper',
      when: (f) => f.name === 'synergyze' && f.garage === 'office',
      title: 'Amazing on Paper',
      art: 'combo_paper',
      stage: { shot: 'office' },
      effects: { cash: (s) => -Math.max(0, s.cash - 300), rep: 1, chaos: 2 },
      text: 'Synergyze. Glass office. Standing desks. A kombucha tap you didn\'t ask for but did sign for. The pitch deck has never looked better. Your bank app has started sending thoughts and prayers. You\'re broke by Thursday.',
    },
    {
      id: 'big_heart',
      when: (f) => f.name === 'bob' && f.customer === 'honest',
      title: 'Small Startup With Big Heart',
      art: 'combo_big_heart',
      stage: { shot: 'post_office' },
      effects: { cash: 1000, rep: 3 },
      text: 'The local paper puts you on the front page: "SMALL STARTUP WITH BIG HEART." Mom buys 60 copies and laminates one for the fridge. A retired dentist mails you $1,000 "for being decent."',
    },
    {
      id: 'demo_disaster',
      when: (f) => f.customer === 'fake' && f.intern === 'access',
      title: 'Live Demo, Live Disaster',
      art: 'combo_demo_disaster',
      stage: { shot: 'town_hall' },
      effects: { cash: -12000, rep: -3, chaos: 3 },
      text: 'Worst possible timing: Gail was back for a second demo, with her whole board. Mid "beep... lie detected", Skyler deleted the database. The app vanished in front of twelve executives. Gail wants a refund. And a lawyer. You don\'t have a lawyer. You have Skyler.',
    },
  ];

  // ---------------------------------------------------------------------------
  // Friday Review endings. Rules are checked in ENDING_ORDER; first match wins.
  // The last rule is a catch-all, so every path lands on exactly one ending.
  // Run `node tools/paths.js` after changing numbers to see all 81 paths.
  // ---------------------------------------------------------------------------
  const ENDINGS = {
    meltdown: {
      title: 'Total Meltdown',
      tagline: 'Low everything',
      rule: (l) => l.cash === 'LOW',
      ruleText: 'Cash LOW, Rep not high',
      art: 'end_meltdown',
      stage: { shot: 'home_front', day: 5, hour: 22 },
      text: 'The money\'s gone. The reputation\'s gone. The intern\'s gone (they took the plant). {co} is now a cautionary tale told at other startups\' offsites. But listen... Mom called. The basement\'s free.',
      bonus: 'Basement Bonus unlocked: pancakes, a futon, and a small envelope with your name on it.',
    },
    broke: {
      title: 'Broke but Legit',
      tagline: 'Low Cash, high Rep',
      rule: (l) => l.cash === 'LOW' && l.rep === 'HIGH',
      ruleText: 'Cash LOW, Rep HIGH',
      art: 'end_broke',
      stage: { shot: 'home_front', day: 5, hour: 19.5 },
      text: 'You have {cash} and a spotless reputation. Everyone in town trusts {co}. Your landlord respects you deeply. Your landlord would also like rent.',
    },
    viral: {
      title: 'Accidental Viral',
      tagline: 'High Chaos, high Rep',
      rule: (l) => l.chaos === 'HIGH' && l.rep === 'HIGH',
      ruleText: 'Chaos HIGH, Rep HIGH',
      art: 'end_viral',
      stage: { shot: 'overview', day: 5, hour: 20.5 },
      text: 'Nobody knows what {co} does, but they really, really love it. You\'re trending in three countries. Your phone is hot to the touch. So is the laptop on the shelf.',
    },
    fakeit: {
      title: 'Fake It Till You Make It',
      tagline: 'High Cash, high Chaos',
      rule: (l) => l.chaos === 'HIGH' || (l.cash === 'HIGH' && l.rep !== 'HIGH'),
      ruleText: 'Chaos HIGH, or Cash HIGH without high Rep',
      art: 'end_fakeit',
      stage: { shot: 'town_hall', day: 5, hour: 20 },
      text: 'Your bank account is up. Your grip on reality is down. {co} has customers, revenue, and at least one feature that does not exist. Yet.',
    },
    wholesome: {
      title: 'The Wholesome Startup',
      tagline: 'High Rep, low Chaos',
      rule: () => true, // catch-all: not broke, Chaos under control
      ruleText: 'Cash OK, Chaos under control',
      art: 'end_wholesome',
      stage: { shot: 'square', day: 5, hour: 19 },
      text: 'You didn\'t get rich, but a stranger hugged you at the farmers\' market. Twice. People trust {co}. Even the dog park group chat only has nice things to say.',
    },
  };
  const ENDING_ORDER = ['viral', 'broke', 'meltdown', 'fakeit', 'wholesome'];

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

  function choose(state, choice) {
    Object.assign(state.flags, choice.flags || {});
    if (choice.company) state.company = choice.company;
    if (choice.log) state.log.push(choice.log);
    return applyEffects(state, choice.effects);
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
    START, METER_MAX, LEVELS, ART, IDEA, TITLE_STAGE, WEEK_ONE, COMBOS, ENDINGS, ENDING_ORDER, MONTH_ONE, LOGO_HAGGLE, TBC,
    newState, evalEffects, applyEffects, choose, newCombos, levels, pickEnding, fmtCash, fill,
  };

  root.STORY = STORY;
  if (typeof module !== 'undefined' && module.exports) module.exports = STORY;
})(typeof window !== 'undefined' ? window : globalThis);
