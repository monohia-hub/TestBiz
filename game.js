// Startup Ladder — card UI and game flow. All content and rules live in story.js.
// The 3D town behind the cards is town-stage.js; this file only tells it where each card is staged.
(function () {
  'use strict';

  const S = window.STORY;
  const FAST = /[?&]fast=1/.test(location.search); // skips animations (automated path testing)
  const T = (ms) => (FAST ? 0 : ms);

  const $ = (sel, el = document) => el.querySelector(sel);
  const hud = $('#hud');
  const stage = $('#stage');
  const controls = $('#controls');

  const ARROW = { left: '←', up: '↑', right: '→' };
  const KEYCAP = { left: '1', up: '2', right: '3' };
  const ICON = { cash: '💰', rep: '🌟', chaos: '🔥' };
  const NAME = { cash: 'Cash', rep: 'Rep', chaos: 'Chaos' };
  const KIND_LABEL = { character: 'CHAR', reaction: 'REACT', prop: 'PROP', combo: 'COMBO ART', ending: 'ENDING ART' };
  const KEYMAP = { ArrowLeft: 'left', a: 'left', A: 'left', 1: 'left', ArrowUp: 'up', w: 'up', W: 'up', 2: 'up', ArrowRight: 'right', d: 'right', D: 'right', 3: 'right' };

  let state = S.newState();
  let queue = []; // upcoming cards (functions that render a card)
  let current = null; // spec of the card on screen
  let card = null; // its element
  let busy = false; // true while a card is flying away
  let drag = null;
  const artFiles = {}; // asset id -> url, for art dropped into art/

  // ---------------------------------------------------------------------------
  // Art slots
  // ---------------------------------------------------------------------------
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');

  function slot(id, cls = '') {
    const a = S.ART[id] || { kind: 'prop', emoji: '❓', desc: 'Missing asset entry in story.js' };
    if (artFiles[id]) {
      return `<figure class="slot has-art ${cls}" data-asset="${id}" data-cls="${cls}"><img src="${artFiles[id]}" alt="${esc(a.desc)}" draggable="false"></figure>`;
    }
    return (
      `<figure class="slot slot--${a.kind} ${cls}" data-asset="${id}" data-cls="${cls}" title="${esc(a.desc)}">` +
      `<span class="slot-emoji" aria-hidden="true">${a.emoji}</span>` +
      `<figcaption class="slot-tag">${KIND_LABEL[a.kind] || 'ART'} · ${id}</figcaption></figure>`
    );
  }

  function refreshArt() {
    document.querySelectorAll('.slot[data-asset]').forEach((el) => {
      const id = el.dataset.asset;
      if (artFiles[id] && !el.classList.contains('has-art')) el.outerHTML = slot(id, el.dataset.cls);
    });
  }

  fetch('art/_list.json', { cache: 'no-store' })
    .then((r) => (r.ok ? r.json() : []))
    .then((files) => {
      files.forEach((f) => (artFiles[f.replace(/\.[^.]+$/, '')] = 'art/' + encodeURIComponent(f)));
      refreshArt();
    })
    .catch(() => {});

  // ---------------------------------------------------------------------------
  // HUD + decision impact. Every meter change is shown three ways:
  //   1. before you commit: the meters a choice would move show ▲/▼ (more arrows = bigger change)
  //   2. when it lands: big delta tokens pop over the town and fly into their meters
  //   3. the meter flashes, counts up/down, lights up the changed bar or pips, and keeps a +/− tag
  //      until the next decision
  // Size tiers: Cash $2k / $5k, Rep and Chaos 2 / 3 points. Cash and Rep read green up / red down;
  // Chaos isn't good or bad, so it heats up (orange) or cools down (blue).
  // ---------------------------------------------------------------------------
  const KEYS = ['cash', 'rep', 'chaos'];
  const meterEl = (k) => hud.querySelector(`[data-meter="${k}"]`);
  hud.querySelectorAll('.pips').forEach((p) => (p.innerHTML = '<i class="pip"></i>'.repeat(S.METER_MAX)));
  const shown = { cash: state.cash, rep: state.rep, chaos: state.chaos }; // what the HUD displays right now
  const tweens = {};
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const IMP = ['imp-gain', 'imp-loss', 'imp-heat', 'imp-cool', 't1', 't2', 't3'];

  function tier(k, d) {
    const a = Math.abs(d);
    if (k === 'cash') return a >= 5000 ? 3 : a >= 2000 ? 2 : 1;
    return a >= 3 ? 3 : a >= 2 ? 2 : 1;
  }
  const impTone = (k, d) => 'imp-' + (k === 'chaos' ? (d > 0 ? 'heat' : 'cool') : d > 0 ? 'gain' : 'loss');
  const arrows = (d, t) => (d > 0 ? '▲' : '▼').repeat(t);
  const fmtVal = (k, v) => (k === 'cash' ? S.fmtCash(v) : `${v}/${S.METER_MAX}`);
  const fmtDelta = (k, d) => (d > 0 ? '+' : '−') + (k === 'cash' ? S.fmtCash(Math.abs(d)) : Math.abs(d));
  const restart = (el, ...cls) => { el.classList.remove(...cls); void el.offsetWidth; el.classList.add(...cls); };

  function paintMeter(k, v) {
    const m = meterEl(k);
    m.querySelector('.meter-val').textContent = fmtVal(k, Math.round(v));
    if (k === 'cash') m.querySelector('.meter-fill').style.width = Math.min(100, v / 200) + '%'; // $20k = full bar
    else m.querySelectorAll('.pip').forEach((p, i) => p.classList.toggle('on', i < v));
  }

  function setHud(label) {
    hud.classList.toggle('is-hidden', !label);
    $('#hud-company').textContent = state.company || 'Untitled Startup';
    if (!label) return;
    $('#hud-level').textContent = label;
    syncMeters();
  }

  // Jump the HUD straight to the current state (a new decision card, a restart).
  function syncMeters() {
    flushImpacts(false);
    for (const k of KEYS) {
      cancelAnimationFrame(tweens[k]);
      shown[k] = state[k];
      paintMeter(k, state[k]);
    }
  }

  function clearTags() {
    for (const k of KEYS) {
      const m = meterEl(k);
      m.classList.remove('hit', ...IMP);
      m.querySelector('.meter-tag').className = 'meter-tag';
    }
  }

  function countTo(k, from, to) {
    cancelAnimationFrame(tweens[k]);
    if (FAST || reduceMotion) return paintMeter(k, to);
    const t0 = performance.now(), dur = 700;
    const step = (now) => {
      const p = Math.min(1, (now - t0) / dur), v = from + (to - from) * (1 - (1 - p) ** 3);
      paintMeter(k, k === 'cash' ? v : Math.round(v));
      if (p < 1) tweens[k] = requestAnimationFrame(step);
    };
    tweens[k] = requestAnimationFrame(step);
  }

  // A delta lands on its meter.
  function hitMeter(k, d, target) {
    const m = meterEl(k), t = tier(k, d), tone = impTone(k, d), from = shown[k];
    shown[k] = target;
    const tag = m.querySelector('.meter-tag');
    tag.textContent = `${fmtDelta(k, d)} ${arrows(d, t)}`;
    tag.className = `meter-tag show ${tone} t${t}`;
    m.classList.remove(...IMP);
    restart(m, 'hit', tone, 't' + t);
    if (k === 'cash') {
      const g = m.querySelector('.meter-ghost');
      const a = Math.min(100, Math.min(from, target) / 200), b = Math.min(100, Math.max(from, target) / 200);
      g.style.left = a + '%';
      g.style.width = Math.max(0, b - a) + '%';
      g.className = 'meter-ghost ' + tone;
      restart(g, 'go');
    } else {
      m.querySelectorAll('.pip').forEach((pip, i) => {
        pip.classList.remove('flash', ...IMP);
        if (i >= Math.min(from, target) && i < Math.max(from, target)) restart(pip, 'flash', tone);
      });
    }
    countTo(k, from, target);
    if (t === 3 && !FAST && !reduceMotion) restart(hud.querySelector('.meters'), 'shake');
  }

  // Big tokens over the town that fly into their meters.
  const impactLayer = document.createElement('div');
  impactLayer.id = 'impact';
  impactLayer.setAttribute('aria-hidden', 'true');
  document.body.appendChild(impactLayer);
  let pending = [];

  function flushImpacts(run) {
    for (const p of pending) {
      clearTimeout(p.timer);
      if (run) p.run();
    }
    pending = [];
    impactLayer.textContent = '';
  }

  function showImpact(deltas, animate) {
    flushImpacts(true); // a previous impact still in flight lands instantly
    clearTags();
    const keys = KEYS.filter((k) => deltas && deltas[k]);
    const targets = { cash: state.cash, rep: state.rep, chaos: state.chaos };
    if ((FAST && !animate) || reduceMotion) return keys.forEach((k) => hitMeter(k, deltas[k], targets[k]));
    const r = townRect();
    const cx = r.x + r.w / 2, cy = r.y + r.h * 0.45;
    keys.forEach((k, i) => {
      const d = deltas[k], t = tier(k, d);
      const el = document.createElement('div');
      el.className = `impact-token ${impTone(k, d)} t${t}`;
      el.innerHTML =
        `<span class="it-icon">${ICON[k]}</span><span class="it-num">${fmtDelta(k, d)}</span>` +
        `<span class="it-meta"><b>${arrows(d, t)}</b>${NAME[k]}</span>` + (t === 3 ? '<span class="it-big">BIG!</span>' : '');
      impactLayer.appendChild(el);
      const sy = cy + (i - (keys.length - 1) / 2) * Math.min(64, r.h / 3.2);
      const mr = meterEl(k).getBoundingClientRect(), ex = mr.left + mr.width / 2, ey = mr.top + mr.height / 2;
      const at = (x, y, sc) => `translate(${x}px, ${y}px) translate(-50%, -50%) scale(${sc})`;
      const delay = 140 + i * 170, dur = 1550;
      el.animate(
        [
          { transform: at(cx, sy, 0.3), opacity: 0 },
          { transform: at(cx, sy, 1.18), opacity: 1, offset: 0.11 },
          { transform: at(cx, sy, 1), opacity: 1, offset: 0.19 },
          { transform: at(cx, sy, 1), opacity: 1, offset: 0.6 },
          { transform: at(ex, ey, 0.34), opacity: 1, offset: 0.92 },
          { transform: at(ex, ey, 0.2), opacity: 0 },
        ],
        { duration: dur, delay, easing: 'ease-in-out', fill: 'both' }
      ).onfinish = () => el.remove();
      const p = { run: () => hitMeter(k, d, targets[k]) };
      p.timer = setTimeout(() => {
        pending = pending.filter((x) => x !== p);
        p.run();
      }, delay + dur * 0.92);
      pending.push(p);
    });
  }

  // While a choice is armed (swiping, hover, keyboard focus) the meters it would move show ▲/▼.
  function previewMeters(choice) {
    const e = choice && !choice.minigame ? S.evalEffects(state, choice.effects) : {};
    for (const k of KEYS) {
      const m = meterEl(k), pv = m.querySelector('.meter-pv'), d = e[k];
      if (d) {
        const t = tier(k, d);
        pv.textContent = arrows(d, t);
        pv.className = `meter-pv show ${impTone(k, d)} t${t}`;
        m.classList.add('is-previewed');
      } else {
        pv.className = 'meter-pv';
        m.classList.remove('is-previewed');
      }
    }
  }

  function deltaChips(deltas) {
    const keys = KEYS.filter((k) => deltas && deltas[k]);
    if (!keys.length) return '<p class="deltas"><span class="delta flat">No change. Suspicious.</span></p>';
    return `<p class="deltas">${keys
      .map((k) => {
        const d = deltas[k], t = tier(k, d);
        return `<span class="delta ${impTone(k, d)} t${t}">${ICON[k]} ${NAME[k]} <b>${fmtDelta(k, d)}</b> <i>${arrows(d, t)}</i></span>`;
      })
      .join('')}</p>`;
  }

  function meterSummary(levels) {
    return `<div class="summary">${['cash', 'rep', 'chaos']
      .map(
        (k) =>
          `<div class="sum sum-${(levels || {})[k] || 'none'}"><span class="sum-icon">${ICON[k]}</span>` +
          `<b>${k === 'cash' ? S.fmtCash(state.cash) : state[k]}</b><small>${levels ? levels[k] : NAME[k]}</small></div>`
      )
      .join('')}</div>`;
  }

  // ---------------------------------------------------------------------------
  // 3D stage bridge. Cards carry `stage: { shot, day, hour }` (see story.js).
  // The game works without it: if the town can't load, cards sit on paper.
  // ---------------------------------------------------------------------------
  let stageWant = Object.assign({}, S.TITLE_STAGE);
  const townStage = () => (window.TownStage && window.TownStage.ready ? window.TownStage : null);

  function stageGo(st) {
    if (!st) return;
    stageWant = {
      shot: st.shot || stageWant.shot,
      day: st.day != null ? st.day : stageWant.day,
      hour: st.hour != null ? st.hour : stageWant.hour,
    };
    const ts = townStage();
    if (ts) ts.goTo(st, { instant: FAST });
  }

  // The part of the screen where the town is visible (between HUD and card panel on phones, beside the cards on wide screens).
  function townRect() {
    const W = innerWidth, H = innerHeight, app = $('#app').getBoundingClientRect();
    const left = app.left, right = W - app.right;
    let rect;
    if (Math.max(left, right) >= 340) {
      rect = left >= right ? { x: 0, y: 0, w: left, h: H } : { x: app.right, y: 0, w: right, h: H };
    } else {
      const top = hud.classList.contains('is-hidden') ? 0 : hud.getBoundingClientRect().bottom;
      const panel = card && card.querySelector('.card-body');
      const bottom = panel ? stage.getBoundingClientRect().top + card.offsetTop + panel.offsetTop : H * 0.55;
      rect = { x: 0, y: top, w: W, h: Math.max(120, bottom - top) };
    }
    return rect;
  }

  // Tell the stage which part of the screen shows the town, so the shot is framed there.
  function stageFocus() {
    const ts = townStage();
    if (ts) ts.setFocus(townRect());
  }

  function stageStatus(progress) {
    const el = document.querySelector('.stage-status');
    if (!el) return;
    const ts = window.TownStage;
    if (ts && ts.ready) el.textContent = '';
    else if (ts && ts.error) el.textContent = 'Playing without the 3D town.';
    else el.textContent = `Building Pebblewick… ${Math.round((progress || 0) * 100)}%`;
  }

  window.addEventListener('townstage:progress', (e) => stageStatus(e.detail));
  window.addEventListener('townstage:error', () => {
    document.body.classList.add('no-town');
    stageStatus();
  });
  window.addEventListener('townstage:ready', () => {
    document.body.classList.add('has-town');
    stageFocus();
    window.TownStage.goTo(stageWant, { instant: true });
    stageStatus();
  });
  window.addEventListener('resize', stageFocus);

  // ---------------------------------------------------------------------------
  // Card + controls rendering
  // ---------------------------------------------------------------------------
  function show(spec) {
    current = spec;
    const el = document.createElement('article');
    el.className = `card card--${spec.kind}` + (spec.tone ? ` tone-${spec.tone}` : '');
    el.dataset.kind = spec.kind;
    el.dataset.id = spec.id || '';
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = `<div class="card-inner">${spec.html}</div><div class="stamp" aria-hidden="true"></div>`;
    if (card) card.remove();
    stage.appendChild(el);
    card = el;
    document.body.dataset.card = spec.kind;
    previewMeters(null);
    if (spec.hud !== undefined) setHud(spec.hud);
    clearTags();
    renderControls(spec);
    if (!FAST) {
      el.classList.add('deal');
      el.addEventListener('animationend', (e) => e.target === el && el.classList.remove('deal'));
    }
    busy = false;
    if (spec.stage) stageGo(spec.stage);
    stageFocus();
    if (spec.onShow) spec.onShow(el);
  }

  function renderControls(spec) {
    if (spec.choices) {
      controls.innerHTML =
        '<p class="swipe-hint">Swipe the card <b>← ↑ →</b> or tap a choice<span class="desk-only"> · keys ← ↑ → or 1 2 3</span></p>' +
        spec.choices.map(choiceButton).join('');
      controls.querySelectorAll('.choice').forEach((b) => {
        const c = spec.choices.find((x) => x.dir === b.dataset.dir);
        b.addEventListener('click', () => commit(b.dataset.dir));
        b.addEventListener('pointerenter', (e) => e.pointerType === 'mouse' && !drag && !busy && previewMeters(c));
        b.addEventListener('pointerleave', (e) => e.pointerType === 'mouse' && !drag && !busy && previewMeters(null));
        b.addEventListener('focus', () => !busy && previewMeters(c));
        b.addEventListener('blur', () => !busy && previewMeters(null));
      });
    } else if (spec.cont) {
      controls.innerHTML =
        `<p class="swipe-hint">Swipe or tap the card to continue</p>` +
        `<button class="btn-main" type="button">${spec.cont} <kbd class="keycap">Enter</kbd></button>`;
      controls.querySelector('.btn-main').addEventListener('click', () => commit('left'));
    } else {
      controls.innerHTML = spec.controlsHtml || '';
    }
  }

  function choiceButton(c) {
    let fx;
    if (c.minigame) fx = '<i class="fx">🎨 mini-game</i>';
    else {
      const e = S.evalEffects(state, c.effects);
      fx = KEYS.filter((k) => e[k])
        .map((k) => {
          const t = tier(k, e[k]);
          return `<i class="fx ${impTone(k, e[k])} t${t}" title="${NAME[k]} ${e[k] > 0 ? 'up' : 'down'}${t === 3 ? ' a lot' : ''}">${ICON[k]}<b>${arrows(e[k], t)}</b></i>`;
        })
        .join('');
    }
    return (
      `<button class="choice dir-${c.dir}" data-dir="${c.dir}" type="button">` +
      `<span class="choice-arrow" aria-hidden="true">${ARROW[c.dir]}</span>` +
      `<span class="choice-main"><span class="choice-label">${c.label}</span><span class="choice-hint">${c.hint}</span></span>` +
      `<span class="choice-side"><span class="choice-fx">${fx}</span><kbd class="keycap">${KEYCAP[c.dir]}</kbd></span>` +
      `</button>`
    );
  }

  function preview(dir) {
    if (!card) return;
    controls.querySelectorAll('.choice').forEach((b) => b.classList.toggle('is-armed', b.dataset.dir === dir));
    const stamp = card.querySelector('.stamp');
    const c = current && current.choices && current.choices.find((x) => x.dir === dir);
    if (c) {
      stamp.textContent = c.short;
      stamp.className = `stamp show dir-${dir}`;
    } else stamp.className = 'stamp';
    previewMeters(c || null);
  }

  function flyOut(dir) {
    return new Promise((resolve) => {
      const v = { left: [-1, 0.15], right: [1, 0.15], up: [0, -1], down: [0, 1] }[dir] || [-1, 0.15];
      card.style.transition = `transform ${T(300)}ms cubic-bezier(.5,0,.8,.4), opacity ${T(300)}ms ease-in`;
      card.style.transform = `translate(${v[0] * window.innerWidth * 1.1}px, ${v[1] * window.innerHeight}px) rotate(${v[0] * 24}deg)`;
      card.style.opacity = '0';
      setTimeout(resolve, T(260));
    });
  }

  // Resolve the card on screen: a choice direction, or "continue".
  function commit(dir) {
    if (busy || !current) return;
    let choice = null;
    if (current.choices) {
      choice = current.choices.find((c) => c.dir === dir);
      if (!choice) return;
    } else if (!current.cont) return;
    busy = true;
    preview(choice ? dir : null);
    const spec = current;
    const finish = () => (choice ? spec.onChoose(choice) : (spec.onContinue || advance)());
    if (FAST) finish(); // test mode: fully synchronous, so it also runs in a frozen background tab
    else flyOut(dir).then(finish);
  }

  function advance() {
    const next = queue.shift();
    if (next) next();
  }

  // ---------------------------------------------------------------------------
  // Swipe
  // ---------------------------------------------------------------------------
  function intent(dx, dy, threshold) {
    const ax = Math.abs(dx);
    const ay = Math.abs(dy);
    if (Math.max(ax, ay) < threshold) return null;
    if (ay > ax) return dy < 0 ? 'up' : 'down';
    return dx < 0 ? 'left' : 'right';
  }

  stage.addEventListener('pointerdown', (e) => {
    if (busy || !card || !current || current.noSwipe || !card.contains(e.target) || e.button > 0) return;
    drag = { x: e.clientX, y: e.clientY, dx: 0, dy: 0, id: e.pointerId };
    try {
      stage.setPointerCapture(e.pointerId);
    } catch (err) {
      /* pointer already gone; the drag still works without capture */
    }
    card.style.transition = 'none';
    card.classList.add('dragging');
  });

  stage.addEventListener('pointermove', (e) => {
    if (!drag || e.pointerId !== drag.id) return;
    drag.dx = e.clientX - drag.x;
    drag.dy = e.clientY - drag.y;
    const dy = drag.dy > 0 && current.choices ? drag.dy * 0.3 : drag.dy; // no "down" choice: resist
    card.style.transform = `translate(${drag.dx}px, ${dy}px) rotate(${drag.dx * 0.06}deg)`;
    preview(intent(drag.dx, drag.dy, 36));
  });

  function endDrag(e) {
    if (!drag || e.pointerId !== drag.id) return;
    const d = drag;
    drag = null;
    card.classList.remove('dragging');
    const dir = intent(d.dx, d.dy, 90);
    if (current.choices && dir && current.choices.some((c) => c.dir === dir)) return commit(dir);
    if (current.cont && (dir || Math.hypot(d.dx, d.dy) < 8)) return commit(dir || 'left');
    card.style.transition = `transform ${T(260)}ms cubic-bezier(.3,1.5,.5,1)`;
    card.style.transform = '';
    preview(null);
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);

  // ---------------------------------------------------------------------------
  // Keyboard
  // ---------------------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey || !current) return;
    if (current.onKey && current.onKey(e)) return e.preventDefault();
    if (current.choices) {
      const dir = KEYMAP[e.key];
      if (dir) {
        e.preventDefault();
        commit(dir);
      }
    } else if (current.cont && (e.key === 'Enter' || e.key === ' ' || e.key.startsWith('Arrow'))) {
      if ((e.key === 'Enter' || e.key === ' ') && e.target.closest && e.target.closest('button')) return; // the button handles it
      e.preventDefault();
      commit({ ArrowUp: 'up', ArrowDown: 'down', ArrowRight: 'right' }[e.key] || 'left');
    }
  });

  // ---------------------------------------------------------------------------
  // Cards
  // ---------------------------------------------------------------------------
  const levelLabel = (level, day) => `LVL ${level.number} · ${level.title.toUpperCase()}` + (day ? ` · ${day.toUpperCase()}` : '');

  function titleCard() {
    state = S.newState();
    queue = [];
    show({
      kind: 'title',
      id: 'title',
      hud: null,
      cont: 'Start Week One',
      stage: S.TITLE_STAGE,
      html:
        `<div class="card-art"></div>` +
        `<div class="card-body center">` +
        `<p class="eyebrow">Working title</p>` +
        `<h1 class="logo">Startup <span>Ladder</span></h1>` +
        `<p class="card-text">You have a garage in Pebblewick, a questionable business idea and <b>$10,000</b>. What could possibly go wrong?</p>` +
        `<p class="idea">💡 <b>The idea:</b> ${S.IDEA}</p>` +
        `<p class="stage-status" aria-live="polite"></p>` +
        `</div>`,
      onShow: () => stageStatus(),
      onContinue: startGame,
    });
  }

  function startGame() {
    state = S.newState();
    queue = [
      () => levelIntro(S.WEEK_ONE),
      ...S.WEEK_ONE.scenes.map((sc) => () => sceneCard(sc, S.WEEK_ONE)),
      reviewCard,
      endingCard,
      () => levelIntro(S.MONTH_ONE),
      () => sceneCard(S.MONTH_ONE.scenes[state.ending.id], S.MONTH_ONE),
      tbcCard,
    ];
    advance();
  }

  function levelIntro(level) {
    show({
      kind: 'intro',
      id: level.id,
      hud: levelLabel(level),
      cont: level.number === 1 ? "Let's go" : 'Bring it on',
      stage: level.stage,
      html:
        `<div class="card-art"></div>` +
        `<div class="card-body center"><p class="eyebrow">Level ${level.number}</p>` +
        `<h2 class="card-title big">${level.title}</h2><p class="card-text">${level.intro}</p></div>`,
    });
  }

  function sceneCard(scene, level) {
    const bonusHtml = scene.bonus ? `<div class="bonus">🥞 <b>${scene.bonus.title}!</b> ${S.fill(scene.bonus.text, state)}</div>` : '';
    const day = level.number === 1 ? scene.day : null;
    show({
      kind: 'scene',
      id: scene.id,
      hud: levelLabel(level, day),
      stage: scene.stage,
      html:
        `<div class="card-art cast-${scene.cast.length}">${scene.cast.map((id) => slot(id, 'slot-cast')).join('')}` +
        `${scene.prop ? slot(scene.prop, 'slot-prop') : ''}</div>` +
        `<div class="card-body"><p class="eyebrow">${day || level.title}</p><h2 class="card-title">${scene.title}</h2>` +
        `${bonusHtml}<p class="card-text">${S.fill(scene.text, state)}</p></div>`,
      choices: scene.choices,
      onShow: () => scene.bonus && showImpact(S.applyEffects(state, scene.bonus.effects)),
      onChoose: (choice) => (level.number === 1 ? chooseWeek(scene, choice) : chooseMonth(scene, choice)),
    });
  }

  function chooseWeek(scene, choice) {
    const deltas = S.choose(state, choice);
    const combos = S.newCombos(state);
    queue.unshift(() => outcomeCard(scene, choice, deltas), ...combos.map((c) => () => comboCard(c)));
    advance();
  }

  function chooseMonth(scene, choice) {
    state.month = { scene: scene.title, choice: choice.short };
    if (choice.minigame) {
      queue.unshift(() => haggleCard(scene, choice));
      return advance();
    }
    const deltas = S.applyEffects(state, choice.effects);
    queue.unshift(() => outcomeCard(scene, choice, deltas));
    advance();
  }

  function outcomeCard(scene, choice, deltas, outcome) {
    const o = outcome || choice.outcome;
    show({
      kind: 'outcome',
      id: `${scene.id}:${choice.dir}`,
      tone: 'dir-' + choice.dir,
      cont: 'Continue',
      stage: o.stage,
      html:
        `<div class="card-art">${slot(o.art, 'slot-react')}</div>` +
        `<div class="card-body"><p class="eyebrow">You chose</p><h2 class="card-title">${choice.label}</h2>` +
        `${deltaChips(deltas)}<p class="card-text">${S.fill(o.text, state)}</p></div>`,
      onShow: () => showImpact(deltas),
    });
  }

  function comboCard(combo) {
    const deltas = S.applyEffects(state, combo.effects);
    show({
      kind: 'combo',
      id: combo.id,
      tone: 'combo',
      cont: 'Ha! Continue',
      stage: combo.stage,
      html:
        `<div class="burst" aria-hidden="true">COMBO!</div>` +
        `<div class="card-art">${slot(combo.art, 'slot-wide')}</div>` +
        `<div class="card-body"><p class="eyebrow">Combo unlocked</p><h2 class="card-title">${combo.title}</h2>` +
        `${deltaChips(deltas)}<p class="card-text">${S.fill(combo.text, state)}</p></div>`,
      onShow: () => showImpact(deltas),
    });
  }

  function reviewCard() {
    state.ending = S.pickEnding(state);
    const days = S.WEEK_ONE.scenes.map((sc, i) => `<li><b>${sc.day.slice(0, 3)}</b>${state.log[i]}</li>`).join('');
    const combos = state.combos
      .map((id) => S.COMBOS.find((c) => c.id === id))
      .map((c) => `<li class="is-combo"><b>Combo</b>${c.title}</li>`)
      .join('');
    show({
      kind: 'review',
      id: 'friday',
      hud: levelLabel(S.WEEK_ONE, 'Friday'),
      cont: 'Get the verdict',
      stage: S.WEEK_ONE.review,
      html:
        `<div class="card-art cast-1 art-review">${slot('char_founder', 'slot-cast')}</div>` +
        `<div class="card-body"><p class="eyebrow">Friday</p><h2 class="card-title big">Friday Review</h2>` +
        `<p class="card-text">Devin has made a slideshow. Mom brought snacks. Let's see how the week went.</p>` +
        `<ul class="recap">${days}${combos}</ul></div>`,
    });
  }

  function endingCard() {
    const id = state.ending.id;
    const e = S.ENDINGS[id];
    show({
      kind: 'ending',
      id,
      tone: 'ending',
      cont: 'Start Month One',
      stage: e.stage,
      html:
        `<div class="card-art">${slot(e.art, 'slot-wide')}</div>` +
        `<div class="card-body center"><p class="eyebrow">Week One ending</p><h2 class="card-title big">${e.title}</h2>` +
        `<p class="tagline">${e.tagline}</p><p class="card-text">${S.fill(e.text, state)}</p>` +
        (e.bonus ? `<div class="bonus">🥞 ${e.bonus}</div>` : '') +
        `${meterSummary(state.ending.levels)}<p class="why">Verdict rule: ${e.ruleText}</p></div>`,
    });
  }

  function haggleCard(scene, choice) {
    const H = S.LOGO_HAGGLE;
    let raf = 0;
    let pos = 0;
    let done = false;
    const start = performance.now();

    function tick(now) {
      const t = ((now - start) % 1500) / 1500; // 1.5s there and back
      pos = t < 0.5 ? t * 2 : 2 - t * 2;
      const needle = card && card.querySelector('.needle');
      if (needle) needle.style.left = pos * 100 + '%';
      raf = requestAnimationFrame(tick);
    }

    function stop() {
      if (done) return;
      done = true;
      cancelAnimationFrame(raf);
      const tier = H.tiers.find((t) => pos >= t.min);
      const deltas = S.applyEffects(state, tier.effects);
      state.month.choice = `Negotiated (${tier.colour})`;
      const res = card.querySelector('.haggle-result');
      res.innerHTML = `<i style="background:${tier.swatch}"></i> ${tier.colour}!`;
      card.querySelector('.haggle').classList.add('is-done');
      controls.querySelector('.btn-stop').disabled = true;
      const toOutcome = () => outcomeCard(scene, choice, deltas, { art: H.art, text: tier.text });
      if (FAST) toOutcome();
      else
        setTimeout(() => {
          busy = true;
          flyOut('up').then(toOutcome);
        }, 1100);
    }

    show({
      kind: 'minigame',
      id: 'logoHaggle',
      noSwipe: true,
      html:
        `<div class="card-art">${slot(H.art, 'slot-react')}</div>` +
        `<div class="card-body"><p class="eyebrow">Negotiate · mini-game</p><h2 class="card-title">${H.title}</h2>` +
        `<p class="card-text">${H.text}</p>` +
        `<div class="haggle"><div class="haggle-bar"><span class="needle"></span></div>` +
        `<div class="haggle-ends"><span>Beige</span><span>Peach</span><span>Tangerine</span></div>` +
        `<p class="haggle-result" aria-live="polite"></p></div></div>`,
      controlsHtml: `<p class="swipe-hint">Tap STOP (or the bar) when the needle is on your colour</p><button class="btn-main btn-stop" type="button">STOP! <kbd class="keycap">Space</kbd></button>`,
      onKey: (e) => (e.key === ' ' || e.key === 'Enter' ? (stop(), true) : false),
      onShow: (el) => {
        raf = requestAnimationFrame(tick);
        controls.querySelector('.btn-stop').addEventListener('click', stop);
        el.querySelector('.haggle-bar').addEventListener('pointerdown', stop);
      },
    });
  }

  function tbcCard() {
    show({
      kind: 'tbc',
      id: 'tbc',
      tone: 'tbc',
      hud: 'TO BE CONTINUED',
      cont: 'Play again ↻',
      stage: S.TBC.stage,
      html:
        `<div class="card-art"></div>` +
        `<div class="card-body center"><p class="eyebrow">${S.TBC.subtitle}</p><h2 class="card-title big">${S.TBC.title}</h2>` +
        `<p class="card-text">${S.TBC.text}</p>` +
        `<ul class="recap"><li><b>Company</b>${state.company}</li>` +
        `<li><b>Week One</b>${S.ENDINGS[state.ending.id].title}</li>` +
        `<li><b>Month One</b>${state.month.scene}: ${state.month.choice}</li></ul>` +
        `${meterSummary()}</div>`,
      onContinue: startGame,
    });
  }

  // debug hooks for the console; SL.impact({ cash: -6000, rep: 2 }) replays an impact animation
  window.SL = { state: () => state, stage: () => stageWant, impact: (d) => showImpact(d, true) };
  titleCard();
})();
