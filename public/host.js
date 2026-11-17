(() => {
  gsap.registerPlugin(ScrambleTextPlugin, TextPlugin, MotionPathPlugin);

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const pad = (n) => String(n).padStart(2, '0');

  const ACC = { 0: '#00e5ff', 1: '#00e5ff', 2: '#ff3ea5', 3: '#ffd60a', 4: '#7cff4f' };
  const SECT = { 0: 'INTRO', 1: 'LEVEL 1', 2: 'LEVEL 2', 3: 'LEVEL 3', 4: 'CIERRE' };
  const OPT = ['#ff3ea5', '#00e5ff', '#ffd60a', '#7cff4f', '#b388ff'];
  const SHAPES = ['▲', '◆', '●', '■', '★'];
  const CHIPC = ['#00e5ff', '#ff3ea5', '#ffd60a', '#7cff4f', '#b388ff', '#ff8a3d'];
  const joinUrl = location.host;

  let SL = [];
  let cur = -1;
  let S = null;
  let clockOffset = 0;
  let qrForced = false;
  let SB_URL = '';

  // ---------------- Escalado ----------------
  function fit() {
    const s = Math.min(innerWidth / 1920, innerHeight / 1080);
    $('#stage').style.transform = `translate(-50%, -50%) scale(${s})`;
  }
  addEventListener('resize', fit);
  fit();
  $('#mqUrl').textContent = joinUrl;

  // ---------------- Sonido (sintetizado) ----------------
  let AC = null;
  let muted = localStorage.getItem('hostMute') === '1';
  function ac() {
    if (!AC) { try { AC = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } }
    if (AC.state === 'suspended') AC.resume();
    return AC;
  }
  function tone(f, d = 0.12, type = 'square', v = 0.05, delay = 0, f2 = null) {
    if (muted) return;
    const a = ac(); if (!a) return;
    const t = a.currentTime + delay;
    const o = a.createOscillator(); const g = a.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + d);
    g.gain.setValueAtTime(v, t); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g).connect(a.destination); o.start(t); o.stop(t + d + 0.02);
  }
  const sfx = {
    whoosh: () => tone(220, 0.22, 'triangle', 0.06, 0, 880),
    pop: () => tone(740, 0.08, 'square', 0.04),
    tick: () => tone(1100, 0.05, 'square', 0.03),
    reveal: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.16, 'square', 0.05, i * 0.08)),
    level: () => [262, 330, 392, 523, 659, 784].forEach((f, i) => tone(f, 0.18, 'square', 0.05, i * 0.07)),
    stamp: () => tone(140, 0.18, 'sawtooth', 0.08, 0, 60),
    unlock: () => { tone(880, 0.08, 'square', 0.05); tone(1320, 0.14, 'square', 0.05, 0.08); },
    end: () => [784, 659, 523, 392, 262].forEach((f, i) => tone(f, 0.22, 'square', 0.05, i * 0.14))
  };
  addEventListener('pointerdown', ac, { once: true });
  addEventListener('keydown', ac, { once: true });

  // ---------------- Fondo animado ----------------
  const cv = $('#bg'); const cx = cv.getContext('2d');
  let bgCol = [0, 229, 255]; let bgTarget = [0, 229, 255];
  const stars = Array.from({ length: 140 }, () => ({ x: Math.random(), y: Math.random() * 0.6, s: Math.random() * 1.6 + 0.3, p: Math.random() * 6 }));
  const motes = Array.from({ length: 40 }, () => ({ x: Math.random(), y: Math.random(), v: Math.random() * 0.0006 + 0.0002, s: Math.random() * 2 + 1 }));
  function hex2rgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16, (n >> 8) & 255, n & 255]; }
  function resizeBg() { const dpr = Math.min(1.5, devicePixelRatio || 1); cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
  addEventListener('resize', resizeBg); resizeBg();
  let tGrid = 0;
  function drawBg(ts) {
    const W = innerWidth, H = innerHeight;
    for (let i = 0; i < 3; i++) bgCol[i] += (bgTarget[i] - bgCol[i]) * 0.04;
    const [r, g, b] = bgCol.map(Math.round);
    const grd = cx.createLinearGradient(0, 0, 0, H);
    grd.addColorStop(0, '#04061a'); grd.addColorStop(0.62, '#0b1030'); grd.addColorStop(1, '#070b1f');
    cx.fillStyle = grd; cx.fillRect(0, 0, W, H);
    // estrellas
    for (const s of stars) {
      const a = 0.35 + 0.65 * Math.abs(Math.sin(ts / 900 + s.p));
      cx.fillStyle = `rgba(255,255,255,${a * 0.8})`;
      cx.fillRect(s.x * W, s.y * H, s.s, s.s);
    }
    // sol de horizonte
    const hz = H * 0.64;
    const sun = cx.createRadialGradient(W / 2, hz, 0, W / 2, hz, H * 0.45);
    sun.addColorStop(0, `rgba(${r},${g},${b},0.22)`); sun.addColorStop(1, 'rgba(0,0,0,0)');
    cx.fillStyle = sun; cx.fillRect(0, 0, W, H);
    // rejilla en perspectiva
    tGrid = (tGrid + 0.006) % 1;
    cx.strokeStyle = `rgba(${r},${g},${b},0.35)`; cx.lineWidth = 1;
    cx.beginPath(); cx.moveTo(0, hz); cx.lineTo(W, hz); cx.stroke();
    for (let i = 0; i < 18; i++) {
      const z = ((i + tGrid) / 18);
      const y = hz + Math.pow(z, 2.2) * (H - hz);
      cx.globalAlpha = Math.min(1, z * 1.6) * 0.8;
      cx.beginPath(); cx.moveTo(0, y); cx.lineTo(W, y); cx.stroke();
    }
    cx.globalAlpha = 0.55;
    for (let i = -16; i <= 16; i++) {
      cx.beginPath(); cx.moveTo(W / 2 + i * 30, hz); cx.lineTo(W / 2 + i * (W / 9), H); cx.stroke();
    }
    cx.globalAlpha = 1;
    // partículas
    for (const m of motes) {
      m.y -= m.v; if (m.y < 0) { m.y = 1; m.x = Math.random(); }
      cx.fillStyle = `rgba(${r},${g},${b},0.5)`;
      cx.fillRect(m.x * W, m.y * H, m.s, m.s);
    }
    requestAnimationFrame(drawBg);
  }
  requestAnimationFrame(drawBg);

  function setAccent(lv) {
    const c = ACC[lv] || ACC[0];
    document.documentElement.style.setProperty('--accent', c);
    bgTarget = hex2rgb(c);
  }

  // ---------------- Plantillas ----------------
  const T = {};

  T.cover = () => `
    <div class="cover">
      <div>
        <div class="kicker" data-a="up">TALLER PARA PROFES DE IDIOMAS</div>
        <h1 class="mega"><span data-a="scramble" style="display:block">GAMIFICAR</span><span class="c" data-a="scramble" style="display:block">EN EL AULA</span></h1>
        <div class="sub" data-a="up">Del Kahoot al código</div>
        <div class="press">PRESS START</div>
        <div class="author" data-a="up">Leonardo Pérez Espinosa</div>
      </div>
      <div data-a="right">
        <div class="qrcard"><img src="/qr.svg" alt="QR"><div class="qr-label">ESCANEA Y ÚNETE</div><div class="qr-url">${esc(joinUrl)}</div></div>
        <div class="lobby" id="lobby"></div>
        <div class="count"><b id="lobbyN">0</b> jugadores listos</div>
      </div>
    </div>`;

  T.poll = (s) => {
    const a = s.act;
    const cards = a.options.some((o) => o.desc);
    const body = cards
      ? `<div class="pollcards">${a.options.map((o, i) => `
          <div class="pcard" style="--oc:${OPT[i]}" data-a="pop">
            <div class="lb">${esc(o.label)}</div><h3>${esc(o.title)}</h3><p>${esc(o.desc || '')}</p>
            <div class="vbar"><div class="track"><div class="fill" data-i="${i}"></div></div><div class="pct" data-p="${i}">0%</div></div>
          </div>`).join('')}</div>`
      : `<div class="pollrows">${a.options.map((o, i) => `
          <div class="prow2" style="--oc:${OPT[i]}" data-a="left">
            <div class="lb">${esc(o.label)}</div><div class="tt">${esc(o.title)}</div>
            <div class="track"><div class="fill" data-i="${i}"></div></div><div class="pct" data-p="${i}">0%</div>
          </div>`).join('')}</div>`;
    return `
      <div class="kicker" data-a="left">${esc(s.kicker || 'ENCUESTA')}</div>
      <div class="qtext" data-a="up">${esc(a.question)}</div>
      ${body}
      <div class="foot" data-a="up">📱 Vota desde tu celular · <b class="ans">0</b> votos</div>`;
  };

  T.quiz = (s) => {
    const a = s.act; const n = a.options.length;
    const cols = n === 3 ? '1fr' : '1fr 1fr';
    return `
      <div class="qwrap">
        <div class="qmain">
          <div class="kicker" data-a="left">${esc(s.kicker || 'QUIZ')}</div>
          ${s.banner ? `<div class="banner" data-a="left">${esc(s.banner)}</div>` : ''}
          <div class="qtext" data-a="up">${esc(a.question)}</div>
          <div class="tiles" style="grid-template-columns:${cols}">
            ${a.options.map((o, i) => `<div class="tile o${i}" data-a="pop" data-t="${i}"><span class="sh">${SHAPES[i]}</span><span>${esc(o)}</span><span class="cnt">0</span></div>`).join('')}
          </div>
          <div class="explain"></div>
        </div>
        <div class="qside" data-a="right">
          <div class="timer">
            <svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="44" stroke="rgba(143,163,199,.2)" stroke-width="8" fill="none"/>
            <circle class="ring" cx="50" cy="50" r="44" stroke="var(--accent)" stroke-width="8" fill="none" stroke-linecap="round" stroke-dasharray="276.5" stroke-dashoffset="0"/></svg>
            <div class="t">${a.duration}</div>
          </div>
          <div class="answered"><b class="ansN">0</b>respondieron</div>
          <div class="top5 hidden"></div>
          <div class="joinhint">📱 Responde en tu celular</div>
        </div>
      </div>`;
  };

  T.fsw = (s) => {
    const a = s.act;
    return `
      <div class="kicker" data-a="left">${esc(s.kicker)}</div>
      <div class="banner" data-a="left">FIND SOMEONE WHO…</div>
      <div class="qtext" data-a="up" style="font-size:70px">${esc(a.question)}</div>
      <div class="fsw">
        <div class="fcol" style="--fc:var(--gr)" data-a="left"><h3>✔ ${esc(a.options[0])} <b data-c="0">0</b></h3><div class="fnames" data-n="0"></div></div>
        <div class="fcol" style="--fc:var(--mg)" data-a="right"><h3>✘ ${esc(a.options[1])} <b data-c="1">0</b></h3><div class="fnames" data-n="1"></div></div>
      </div>
      <div class="fnote" data-a="up">${esc(s.note || '')}</div>`;
  };

  T.cloud = (s) => `
    <div class="kicker" data-a="left">${esc(s.kicker || 'NUBE DE IDEAS')}</div>
    <div class="qtext" data-a="up">${esc(s.act.question)}</div>
    <div class="cloud" data-a="fade"><div class="empty">Esperando respuestas… ✍️</div></div>
    <div class="foot" data-a="up">📱 ${esc(s.act.hint || 'Escribe en tu celular')} · <b class="ans">0</b> participantes</div>`;

  T.level = (s) => `
    <div class="scan"></div>
    <div class="level">
      <div class="big" data-a="zoom">${esc(s.title)}</div>
      <div class="ls" data-a="up" data-d="0.9">${esc(s.sub)}</div>
      <div class="ready" data-d="1.4">READY?</div>
    </div>`;

  T.cards = (s) => `
    ${s.kicker ? `<div class="kicker" data-a="left">${esc(s.kicker)}</div>` : ''}
    <div class="title" data-a="up">${esc(s.title)}</div>
    <div class="cards ${s.small ? 'small' : ''}" style="grid-template-columns:repeat(${s.cols || 3},1fr)">
      ${s.cards.map((c, i) => `<div class="card" data-a="pop"><span class="tag">${esc(c.tag)}</span><h3>${esc(c.title)}</h3><p>${esc(c.text)}</p><div class="num">${i + 1}</div></div>`).join('')}
    </div>
    ${s.foot ? `<div class="foot" data-a="up">${esc(s.foot)}</div>` : ''}`;

  T.path = (s) => {
    const W = 1700, n = s.steps.length;
    const pts = s.steps.map((_, k) => [100 + k * ((W - 200) / (n - 1)), k % 2 ? 470 : 190]);
    let d = `M ${pts[0][0]} ${pts[0][1]}`;
    for (let k = 1; k < n; k++) {
      const [x0, y0] = pts[k - 1], [x1, y1] = pts[k];
      const mx = (x0 + x1) / 2;
      d += ` C ${mx} ${y0}, ${mx} ${y1}, ${x1} ${y1}`;
    }
    return `
      <div class="kicker" data-a="left">${esc(s.kicker || '')}</div>
      <div class="title" data-a="up">${esc(s.title)}</div>
      <div class="path-wrap">
        <svg viewBox="0 0 1700 640"><path class="trail" d="${d}" stroke="var(--accent)" stroke-width="8" fill="none" stroke-dasharray="18 16" stroke-linecap="round" opacity=".7"/></svg>
        ${s.steps.map((t, k) => `<div class="node" style="left:${pts[k][0]}px;top:${pts[k][1]}px" data-k="${k}"><div class="ball">${k + 1}</div><div class="lbl">${esc(t)}</div></div>`).join('')}
        <div class="hero">🕹️</div>
      </div>`;
  };

  T.compare = (s) => `
    <div class="title" data-a="up">${esc(s.title)}</div>
    <div class="compare">
      <div class="panel side l" style="--sidec:var(--cy)" data-a="left">
        <span class="tag" style="color:var(--cy)">${esc(s.left.tag)}</span><h3>${esc(s.left.title)}</h3>
        <ul>${s.left.items.map((x) => `<li data-a="up">${esc(x)}</li>`).join('')}</ul>
      </div>
      <div class="vs" data-a="pop" data-d="0.6">VS</div>
      <div class="panel side r" style="--sidec:var(--mg)" data-a="right">
        <span class="tag" style="color:var(--mg)">${esc(s.right.tag)}</span><h3>${esc(s.right.title)}</h3>
        <ul>${s.right.items.map((x) => `<li data-a="up">${esc(x)}</li>`).join('')}</ul>
      </div>
    </div>`;

  T.ingredients = (s) => `
    <div class="title" data-a="up">${esc(s.title)}</div>
    <div class="ingr">${s.items.map((it, i) => `<div class="it" data-a="pop"><div class="ic">${it.icon}</div><div><div class="n">${pad(i + 1)}</div><div class="t">${esc(it.t)}</div></div></div>`).join('')}</div>
    <div class="note" data-a="up">⚠️ ${esc(s.note)}</div>`;

  T.mission = (s) => `
    <div class="title" data-a="up">${esc(s.title)}</div>
    <div class="mission">
      <div class="panel" data-a="left">
        <div class="head"><span class="dot"></span>MISIÓN ACTIVA</div>
        <h4>OBJETIVO</h4><p>${esc(s.objective)}</p>
        <h4>MISIÓN</h4><p>${esc(s.mission)}</p>
      </div>
      <div class="panel" data-a="right">
        <h4 style="margin-top:0">EQUIPO GRAMATICAL</h4>
        <div class="gchips">${s.chips.map((c, i) => `<span class="gchip" style="--gc:${CHIPC[i % CHIPC.length]}" data-a="pop">${esc(c)}</span>`).join('')}</div>
      </div>
    </div>
    <div class="bigq"><span class="qtype">${esc(s.question)}</span><span class="cursor">▌</span></div>`;

  T.passport = (s) => `
    <div class="title" data-a="up">${esc(s.title)}</div>
    <div class="passport">
      <div class="pcol">
        <h4 data-a="left">INSIGNIAS</h4>
        <div class="prow">${s.badges.map((b) => `<div class="badge" style="--bc:var(--${b.c})" data-a="pop"><b>${esc(b.name)}</b><span>${esc(b.g)}</span></div>`).join('')}</div>
        <h4 data-a="left">NIVELES DE VIAJERO</h4>
        <div class="prow">${s.levels.map((l, i) => `${i ? '<span class="arrow">→</span>' : ''}<span class="lvl" data-a="pop">${esc(l)}</span>`).join('')}</div>
        <h4 data-a="left">MISIONES</h4>
        ${s.missions.map((m) => `<div class="pmis" data-a="left">✦ ${esc(m)}</div>`).join('')}
        <div class="tagline" data-a="up">${esc(s.tagline)}</div>
      </div>
      <div class="book" data-a="right">
        <div class="pt">PASAPORTE<br>DE<br>EXPERIENCIAS</div>
        <div class="globe">🌍</div>
        ${s.badges.map((b, i) => {
          const pos = [['40px', '430px', -14], ['330px', '470px', 9], ['200px', '560px', -5]][i];
          return `<div class="stamp" style="--sc:var(--${b.c});left:${pos[0]};top:${pos[1]};transform:rotate(${pos[2]}deg)">${esc(b.name.toUpperCase())}<br>${esc(b.g)}</div>`;
        }).join('')}
      </div>
    </div>`;

  T.table = (s) => {
    const cls = (v) => (/^s[ií]/i.test(v) ? 'yes' : /^no/i.test(v) ? 'no' : '');
    return `
      <div class="title" data-a="up">${esc(s.title)}</div>
      <table class="table">
        <tr data-a="fade">${s.head.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>
        ${s.rows.map((r) => `<tr data-a="left">${r.map((c) => `<td class="${cls(c)}">${esc(c)}</td>`).join('')}</tr>`).join('')}
      </table>
      <div class="tip" data-a="up">${esc(s.tip)}</div>
      <div class="foot" data-a="up" style="font-size:24px">${esc(s.foot)}</div>`;
  };

  T.escape = (s) => `
    <div class="kicker" data-a="left">EJEMPLO NIVEL 2 · ESCAPE ROOM</div>
    <div class="esc-head"><div class="esc-name" data-a="scramble">${esc(s.name)}</div></div>
    <div class="esc-story" data-a="up">✈️ ${esc(s.story)}</div>
    <div class="locks">
      ${s.locks.map((l) => `<div class="lock" data-a="pop"><div class="pad">🔒</div><h4>${esc(l.t)}</h4><p>${esc(l.d)}</p></div>`).join('')}
      <div class="door" data-a="pop"><div class="d">🚪</div>SALIDA</div>
    </div>
    <div class="foot" data-a="up">${esc(s.foot)}</div>`;

  T.steps = (s) => s.vertical ? `
    <div class="title" data-a="up">${esc(s.title)}</div>
    <div class="vsteps">${s.steps.map((st, i) => `<div class="st" data-a="left"><div class="n">${i === 0 ? 'GO' : i + 1}</div><h4>${esc(st.t)}</h4><p>${esc(st.d)}</p></div>`).join('')}</div>`
    : `
    <div class="title" data-a="up">${esc(s.title)}</div>
    <div class="steps" style="grid-template-columns:repeat(${s.steps.length},1fr)">
      <div class="line"></div>
      ${s.steps.map((st, i) => `<div class="st" data-a="pop"><div class="n">${i + 1}</div><h4>${esc(st.t)}</h4><p>${esc(st.d)}</p></div>`).join('')}
    </div>
    ${s.foot ? `<div class="foot" data-a="up">💡 ${esc(s.foot)}</div>` : ''}`;

  T.prompt = (s) => `
    <div class="title" data-a="up">${esc(s.title)}</div>
    <div class="prompt">
      <ul class="tips">${s.tips.map((t, i) => `<li data-a="left"><b>${i + 1}</b>${esc(t)}</li>`).join('')}</ul>
      <div class="term" data-a="right">
        <div class="bar"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i><span>PROMPT DE EJEMPLO</span></div>
        <div class="body"><span class="ptype" data-full="${esc(s.prompt)}"></span><span class="cursor"></span></div>
      </div>
    </div>`;

  T.sharkbait = () => `
    <div class="shark">
      <div>
        <div class="kicker" data-a="left">DEMO EN VIVO · JUEGO HECHO CON IA</div>
        <div class="sb" data-a="zoom">SHARK<br><span>BAIT</span> 🦈</div>
        <div class="pts" data-a="up">🏴‍☠️ Salva a los piratas eligiendo la oración correcta.<br>⏳ Tiempo para responder · 👥 muchos jugadores<br>📶 Funciona con conexión lenta</div>
      </div>
      <div data-a="pop" style="text-align:center">
        <a class="sbbtn" href="${esc(SB_URL)}" target="_blank" rel="noopener">▶ ABRIR<br>SHARK BAIT</a>
        <div class="sbhint">Se abre en una pestaña nueva.<br>Los profes escanean el QR del juego.</div>
      </div>
    </div>
    <div class="sea">
      <svg viewBox="0 0 3840 260" preserveAspectRatio="none" class="w1"><path d="M0 120 Q 240 60 480 120 T 960 120 T 1440 120 T 1920 120 T 2400 120 T 2880 120 T 3360 120 T 3840 120 V260 H0Z" fill="rgba(0,184,212,.35)"/></svg>
      <svg viewBox="0 0 3840 260" preserveAspectRatio="none" class="w2"><path d="M0 160 Q 240 110 480 160 T 960 160 T 1440 160 T 1920 160 T 2400 160 T 2880 160 T 3360 160 T 3840 160 V260 H0Z" fill="rgba(13,95,168,.6)"/></svg>
      <div class="fin">🦈</div>
    </div>`;

  T.chips = (s) => `
    <div class="title" data-a="up">${esc(s.title)}</div>
    <div class="chipsrow">${s.chips.map((c, i) => `<span class="bchip" style="--cc:${CHIPC[i % CHIPC.length]}">${esc(c)}</span>`).join('')}</div>
    <div class="statement" data-a="up" data-d="1.4">${esc(s.statement)}</div>`;

  T.statement = (s) => `
    <div class="title" data-a="up">${esc(s.title)}</div>
    <div class="stmt">
      <div>
        <div class="bigs" data-a="scramble">${esc(s.big)}</div>
        <div class="subs" data-a="up">${esc(s.sub)}</div>
      </div>
      <div class="panel alts" data-a="right">
        <h3>${esc(s.altTitle)}</h3>
        <ul>${s.alts.map((a) => `<li data-a="up">${esc(a)}</li>`).join('')}</ul>
      </div>
    </div>`;

  T.matrix = (s) => `
    <div class="title" data-a="up">${esc(s.title)}</div>
    <div class="matrix">
      <div></div>
      ${s.cols.map((c) => `<div class="ch" style="--mc:var(--${c.c})" data-a="down">${esc(c.lv)}</div>`).join('')}
      ${s.rows.map((r, ri) => `
        <div class="rl" data-a="left">${esc(r)}</div>
        ${s.cols.map((c) => `<div class="cell" style="--mc:var(--${c.c})" data-a="pop"><b>${esc(c.v[ri])}</b><div class="pips">${[1, 2, 3].map((k) => `<i class="${k <= c.m[ri] ? 'pip' : ''}"></i>`).join('')}</div></div>`).join('')}
      `).join('')}
    </div>
    <div class="foot" data-a="up" style="color:var(--yl);font-weight:600">${esc(s.foot)}</div>`;

  T.flow = () => {
    const L = (x1, y1, x2, y2) => `<path class="fl" d="M${x1} ${y1} L${x2} ${y2}" stroke="#8fa3c7" stroke-width="6" fill="none" stroke-linecap="round"/>`;
    const box = (cls, x, y, w, h, col, inner) => `<div class="fbox ${cls}" style="left:${x}px;top:${y}px;width:${w}px;height:${h}px;--fc:${col}">${inner}</div>`;
    const card = (x, w, col, tag, tagc, head, desc) => box('r', x, 615, w, 230, col, `<div class="ft" style="color:${tagc}">${tag}</div><div class="fh">${head}</div><div class="fd">${desc}</div>`);
    return `
      <div class="flow">
        <div style="position:absolute;left:110px;top:105px" class="pixel" data-f="0"><span style="font-size:52px">¿QUÉ RECURSO USO?</span></div>
        <div style="position:absolute;left:112px;top:180px;font-size:30px;color:var(--cy)" data-f="0">Responde 2 preguntas y encuentra tu camino</div>
        <svg viewBox="0 0 1920 1080">
          <g data-f="2">${L(960, 345, 960, 385)}${L(400, 385, 1420, 385)}${L(400, 385, 400, 425)}${L(1420, 385, 1420, 425)}</g>
          <g data-f="4">${L(400, 525, 400, 565)}${L(230, 565, 570, 565)}${L(230, 565, 230, 615)}${L(570, 565, 570, 615)}
          ${L(1420, 525, 1420, 565)}${L(1130, 565, 1710, 565)}${L(1130, 565, 1130, 615)}${L(1420, 565, 1420, 615)}${L(1710, 565, 1710, 615)}</g>
        </svg>
        <div data-f="1">${box('q', 480, 245, 960, 100, 'var(--cy)', '<span class="qn">1</span>¿Tus estudiantes tienen celular e internet estable?')}</div>
        <div class="flab" style="left:420px;top:393px;color:var(--mg)" data-f="3">NO</div>
        <div class="flab" style="left:1440px;top:393px;color:var(--gr)" data-f="3">SÍ</div>
        <div data-f="3">${box('q', 80, 425, 640, 100, 'var(--mg)', '<span class="qn">2</span>¿Tienes proyector o pantalla?')}</div>
        <div data-f="3">${box('q', 1000, 425, 840, 100, 'var(--gr)', '<span class="qn">2</span>¿Cuánto tiempo tienes para preparar?')}</div>
        <div data-f="5">${card(80, 300, 'var(--mg)', 'SÍ', 'var(--gr)', 'En pantalla', 'Juego por equipos<br>Baamboozle · Wordwall')}</div>
        <div data-f="5">${card(420, 300, 'var(--mg)', 'NO', 'var(--mg)', 'En papel', 'Tablero de puntos<br>temporizador · tarjetas')}</div>
        <div data-f="5">${card(1000, 260, 'var(--cy)', 'MINUTOS', 'var(--yl)', 'NIVEL 1', 'Kahoot · Wordwall<br>Gimkit · Blooket')}</div>
        <div data-f="5">${card(1290, 260, 'var(--mg)', 'UNA TARDE', 'var(--yl)', 'NIVEL 2', 'Genially<br>Escape room en Forms')}</div>
        <div data-f="5">${card(1580, 260, 'var(--yl)', 'VARIOS DÍAS', 'var(--yl)', 'NIVEL 3', 'Tu propio juego<br>hecho con IA')}</div>
        <div class="fbonus" data-f="6" style="top:880px"><span class="pixel">BONUS</span><span>¿Una actividad o toda la unidad?</span><span style="color:var(--gr);margin-left:auto">Actividad → elementos de juego · Unidad → gamificación</span></div>
      </div>`;
  };

  T.podium = () => `
    <canvas id="confetti" width="1920" height="1080"></canvas>
    <div class="kicker" data-a="down" style="text-align:center;margin-bottom:10px">RANKING GLOBAL</div>
    <div class="title" data-a="scramble" style="text-align:center;max-width:none;margin-bottom:10px">PODIO FINAL</div>
    <div class="podium"></div>
    <div class="rest"></div>`;

  T.end = () => `
    <div class="end">
      <div class="go" data-a="zoom">GAME OVER</div>
      <div class="cont" data-a="up" data-d="1">¿o CONTINUE?</div>
      <div class="cd">9</div>
      <div class="thx" data-a="up" data-d="1.4">Gracias · Preguntas</div>
      <div class="who" data-a="up" data-d="1.6">Leonardo Pérez Espinosa</div>
    </div>`;

  // ---------------- Animación de entrada ----------------
  const FROM = {
    up: { y: 70, opacity: 0 }, down: { y: -70, opacity: 0 },
    left: { x: -140, opacity: 0 }, right: { x: 140, opacity: 0 },
    pop: { scale: 0.3, opacity: 0, ease: 'back.out(2)' }, fade: { opacity: 0 },
    zoom: { scale: 2, opacity: 0, filter: 'blur(16px)', ease: 'expo.out', duration: 1.1 }
  };
  function intro(el) {
    $$('[data-a]', el).forEach((n, k) => {
      const t = n.dataset.a;
      const d = 0.2 + (n.dataset.d ? +n.dataset.d : k * 0.07);
      if (t === 'scramble') {
        const txt = n.textContent;
        gsap.fromTo(n, { opacity: 0 }, { opacity: 1, duration: 0.2, delay: d });
        gsap.to(n, { duration: 1.2, delay: d, scrambleText: { text: txt, chars: '█▓▒░<>/#01', speed: 0.5, revealDelay: 0.3 } });
        return;
      }
      const f = { ...(FROM[t] || FROM.up) };
      gsap.from(n, { duration: f.duration || 0.85, ease: f.ease || 'power3.out', delay: d, ...f, clearProps: 'transform,filter' });
    });
  }

  // ---------------- Ganchos por plantilla ----------------
  const H = {};
  H.level = (el) => {
    gsap.fromTo('#flash', { opacity: 0.9 }, { opacity: 0, duration: 0.6, delay: 0.15 });
    gsap.fromTo('#deck', { x: -18 }, { x: 0, duration: 0.6, delay: 0.3, ease: 'elastic.out(1,0.3)' });
    sfx.level();
  };
  H.path = (el) => {
    const path = $('.trail', el);
    const len = path.getTotalLength();
    gsap.fromTo(path, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 2.6, ease: 'none', delay: 0.4 });
    gsap.set($$('.node', el), { scale: 0, opacity: 0 });
    gsap.to($('.hero', el), {
      duration: 2.8, delay: 0.4, ease: 'power1.inOut',
      motionPath: { path, align: path, alignOrigin: [0.5, 0.5] }
    });
    $$('.node', el).forEach((n, k) => gsap.to(n, { scale: 1, opacity: 1, duration: 0.5, ease: 'back.out(2.5)', delay: 0.4 + k * 0.62, onStart: sfx.pop }));
  };
  H.steps = (el) => {
    const line = $('.line', el);
    if (line) gsap.from(line, { scaleX: 0, duration: 1.4, delay: 0.3, ease: 'power2.inOut' });
  };
  H.mission = (el) => {
    const q = $('.qtype', el); const txt = q.textContent; q.textContent = '';
    gsap.to(q, { text: txt, duration: txt.length * 0.035, delay: 1.4, ease: 'none' });
  };
  H.passport = (el) => {
    $$('.stamp', el).forEach((st, i) => {
      gsap.fromTo(st, { scale: 3, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.35, ease: 'power4.in', delay: 1.3 + i * 0.5, onComplete: () => { sfx.stamp(); gsap.fromTo($('.book', el), { x: -8 }, { x: 0, duration: 0.3, ease: 'elastic.out(1,0.3)' }); } });
    });
  };
  H.escape = (el) => {
    $$('.lock', el).forEach((l, i) => {
      gsap.delayedCall(1.5 + i * 0.9, () => {
        if (!l.isConnected) return;
        $('.pad', l).textContent = '🔓'; l.classList.add('open'); sfx.unlock();
        gsap.fromTo($('.pad', l), { scale: 1.6, rotation: -15 }, { scale: 1, rotation: 0, duration: 0.5, ease: 'back.out(3)' });
      });
    });
    gsap.delayedCall(1.5 + 3 * 0.9, () => {
      const d = $('.door .d', el); if (!d) return;
      d.textContent = '✨'; sfx.reveal();
      gsap.fromTo(d, { scale: 0.2 }, { scale: 1.2, duration: 0.6, ease: 'back.out(3)' });
    });
  };
  H.prompt = (el) => {
    const p = $('.ptype', el);
    gsap.to(p, { text: p.dataset.full, duration: p.dataset.full.length * 0.025, delay: 1.2, ease: 'none' });
  };
  H.sharkbait = (el) => {
    gsap.to($('.w1', el), { x: -1920, duration: 9, repeat: -1, ease: 'none' });
    gsap.to($('.w2', el), { x: -1920, duration: 6, repeat: -1, ease: 'none' });
    gsap.fromTo($('.fin', el), { x: -150 }, { x: 2050, duration: 12, repeat: -1, ease: 'none' });
    gsap.to($('.fin', el), { y: 14, duration: 0.8, yoyo: true, repeat: -1, ease: 'sine.inOut' });
  };
  H.chips = (el) => {
    $$('.bchip', el).forEach((c, i) => {
      gsap.from(c, { x: (Math.random() - 0.5) * 1600, y: (Math.random() - 0.5) * 900, rotation: (Math.random() - 0.5) * 120, opacity: 0, duration: 1, delay: 0.3 + i * 0.12, ease: 'power3.out', onComplete: i === 0 ? sfx.pop : null });
    });
  };
  H.matrix = (el) => {
    gsap.from($$('.pips i.pip', el), { opacity: 0, scaleX: 0, duration: 0.3, stagger: 0.05, delay: 1.4, onStart: () => $$('.pips i.pip', el).forEach((p) => p.classList.add('on')) });
    $$('.pips i.pip', el).forEach((p) => p.classList.add('on'));
  };
  H.flow = (el) => {
    const groups = {};
    $$('[data-f]', el).forEach((n) => { (groups[n.dataset.f] = groups[n.dataset.f] || []).push(n); });
    Object.keys(groups).sort().forEach((k) => {
      const d = 0.3 + (+k) * 0.55;
      groups[k].forEach((n, j) => {
        if (n.tagName.toLowerCase() === 'g') {
          $$('path', n).forEach((p) => {
            const len = p.getTotalLength();
            gsap.fromTo(p, { strokeDasharray: len, strokeDashoffset: len }, { strokeDashoffset: 0, duration: 0.5, delay: d });
          });
        } else {
          gsap.from(n, { scale: 0.5, opacity: 0, duration: 0.55, delay: d + j * 0.08, ease: 'back.out(2)', transformOrigin: 'center', onStart: j === 0 ? sfx.pop : null });
        }
      });
    });
  };
  H.podium = (el) => {
    const r = (S && S.players) || [];
    const top = [r[1], r[0], r[2]];
    $('.podium', el).innerHTML = top.map((p, i) => {
      const cls = ['p2', 'p1', 'p3'][i];
      const place = ['2', '1', '3'][i];
      if (!p) return `<div class="pod ${cls}"><div class="av">·</div><div class="nm">—</div><div class="sc">0</div><div class="blk">${place}</div></div>`;
      return `<div class="pod ${cls}"><div class="av">${p.avatar}</div><div class="nm">${esc(p.name)}</div><div class="sc" data-v="${p.score}">0</div><div class="blk">${place}</div></div>`;
    }).join('');
    $('.rest', el).innerHTML = r.slice(3, 12).map((p) => `<span>${p.rank}. ${p.avatar} ${esc(p.name)}<b>${p.score}</b></span>`).join('');
    const order = ['.p3', '.p2', '.p1'];
    order.forEach((sel, i) => {
      const pod = $(sel, el); if (!pod) return;
      const d = 0.6 + i * 0.9;
      gsap.from($('.blk', pod), { height: 0, duration: 0.8, delay: d, ease: 'power3.out' });
      gsap.from([$('.av', pod), $('.nm', pod), $('.sc', pod)], { y: -300, opacity: 0, duration: 0.7, delay: d + 0.5, ease: 'bounce.out', stagger: 0.08, onStart: sfx.pop });
      const sc = $('.sc', pod); const v = +sc.dataset.v || 0; const o = { v: 0 };
      gsap.to(o, { v, duration: 1.2, delay: d + 0.6, onUpdate: () => { sc.textContent = Math.round(o.v); } });
    });
    gsap.from($$('.rest span', el), { opacity: 0, y: 30, stagger: 0.06, delay: 3.4 });
    gsap.delayedCall(2.6, () => { sfx.reveal(); confetti($('#confetti', el)); });
  };
  H.end = (el) => {
    sfx.end();
    const cd = $('.cd', el); let n = 9;
    gsap.from(cd, { opacity: 0, delay: 1.2 });
    el._int = setInterval(() => {
      n--;
      if (n < 0) { clearInterval(el._int); cd.textContent = 'PRESS START AGAIN'; cd.style.fontSize = '54px'; cd.style.animation = 'blink 1s steps(2) infinite'; return; }
      cd.textContent = n; sfx.tick();
      gsap.fromTo(cd, { scale: 1.4 }, { scale: 1, duration: 0.4 });
    }, 1000);
  };

  function confetti(canvas) {
    if (!canvas) return;
    const g = canvas.getContext('2d');
    const P = Array.from({ length: 220 }, () => ({
      x: 960 + (Math.random() - 0.5) * 400, y: 300, vx: (Math.random() - 0.5) * 22, vy: -Math.random() * 22 - 6,
      r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3, c: CHIPC[Math.floor(Math.random() * CHIPC.length)], w: 10 + Math.random() * 12, h: 6 + Math.random() * 8
    }));
    let f = 0;
    (function loop() {
      if (!canvas.isConnected || f++ > 360) return;
      g.clearRect(0, 0, 1920, 1080);
      for (const p of P) {
        p.vy += 0.45; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore();
      }
      requestAnimationFrame(loop);
    })();
  }

  // ---------------- Mostrar escena ----------------
  function show(i) {
    const prev = cur; cur = i; lastTick = -1;
    const s = SL[i]; if (!s) return;
    const dir = i >= prev ? 1 : -1;
    setAccent(s.lv);
    const deck = $('#deck');
    [...deck.children].forEach((old) => {
      if (old._int) clearInterval(old._int);
      gsap.killTweensOf($$('*', old));
      gsap.to(old, { opacity: 0, x: -90 * dir, filter: 'blur(10px)', duration: 0.32, ease: 'power2.in', onComplete: () => old.remove() });
    });
    gsap.killTweensOf('#wipe');
    gsap.fromTo('#wipe', { left: dir > 0 ? '-40%' : '110%', opacity: 0.85 }, { left: dir > 0 ? '110%' : '-40%', opacity: 0.85, duration: 0.55, ease: 'power2.inOut', onComplete: () => gsap.set('#wipe', { opacity: 0 }) });
    if (s.type !== 'level') sfx.whoosh();
    const el = document.createElement('div');
    el.className = 'slide s-' + s.type;
    el.innerHTML = (T[s.type] || T.cards)(s);
    deck.appendChild(el);
    intro(el);
    if (H[s.type]) H[s.type](el, s);
    el._seen = new Set();
    live(true);
    hud();
    buildJump();
  }

  // ---------------- Datos en vivo ----------------
  function live(first) {
    if (!S || cur < 0) return;
    const el = $('#deck').lastElementChild; if (!el) return;
    const s = SL[cur];
    if (s.type === 'cover') liveLobby(el);
    const a = S.act;
    if (!a || a.slide !== cur) return;
    if (a.type === 'poll') livePoll(el, a);
    if (a.type === 'quiz') liveQuiz(el, a, first);
    if (a.type === 'fsw') liveFsw(el, a);
    if (a.type === 'cloud') liveCloud(el, a);
  }

  function liveLobby(el) {
    const lobby = $('#lobby', el); if (!lobby) return;
    const ps = S.players.filter((p) => p.online);
    $('#lobbyN', el).textContent = ps.length;
    const ids = new Set(ps.map((p) => p.pid));
    $$('.pchip', lobby).forEach((c) => { if (!ids.has(c.dataset.pid)) c.remove(); });
    ps.forEach((p) => {
      if (el._seen.has(p.pid)) return;
      el._seen.add(p.pid);
      const c = document.createElement('span');
      c.className = 'pchip'; c.dataset.pid = p.pid; c.style.setProperty('--pc', p.color);
      c.innerHTML = `<span class="av">${p.avatar}</span>${esc(p.name)}`;
      lobby.appendChild(c);
      gsap.from(c, { scale: 0, opacity: 0, duration: 0.5, ease: 'back.out(3)' });
      sfx.pop();
    });
  }

  function livePoll(el, a) {
    const counts = a.counts || [];
    const total = counts.reduce((x, y) => x + y, 0);
    const ans = $('.ans', el); if (ans) ans.textContent = total;
    counts.forEach((n, i) => {
      const pct = total ? Math.round((n / total) * 100) : 0;
      const f = $(`.fill[data-i="${i}"]`, el); if (f) gsap.to(f, { width: pct + '%', duration: 0.6, ease: 'power3.out' });
      const p = $(`.pct[data-p="${i}"]`, el); if (p) p.textContent = `${pct}% · ${n}`;
    });
  }

  let lastTick = -1;
  function liveQuiz(el, a) {
    const n = $('.ansN', el); if (n) n.textContent = `${a.answered}/${S.online}`;
    if (a.revealed && !el._revealed) {
      el._revealed = true;
      sfx.reveal();
      gsap.fromTo('#deck', { x: -10 }, { x: 0, duration: 0.5, ease: 'elastic.out(1,0.3)' });
      $$('.tile', el).forEach((t, i) => {
        t.classList.add(i === a.correct ? 'right' : 'wrong');
        gsap.killTweensOf(t);
        if (i === a.correct) gsap.fromTo(t, { scale: 1 }, { scale: 1.04, opacity: 1, duration: 0.35, yoyo: true, repeat: 1, ease: 'power2.out' });
        else gsap.to(t, { opacity: 0.25, scale: 0.97, filter: 'grayscale(0.7)', duration: 0.5 });
        const c = $('.cnt', t); const o = { v: 0 }; const v = (a.counts || [])[i] || 0;
        gsap.to(c, { opacity: 1, duration: 0.3 });
        gsap.to(o, { v, duration: 0.8, onUpdate: () => { c.textContent = Math.round(o.v); } });
      });
      const ex = $('.explain', el);
      if (ex && a.explain) gsap.to(ex, { text: '💡 ' + a.explain, duration: a.explain.length * 0.02, delay: 0.4, ease: 'none' });
      const t5 = $('.top5', el);
      if (t5) {
        t5.innerHTML = `<h4>TOP 5</h4>` + S.players.slice(0, 5).map((p) => `<div class="r"><span class="pos">${p.rank}</span>${p.avatar} ${esc(p.name)}<span class="sc">${p.score}</span></div>`).join('');
        t5.classList.remove('hidden');
        gsap.from($$('.r', t5), { x: 80, opacity: 0, stagger: 0.08, duration: 0.5, delay: 0.5 });
        gsap.to($('.timer', el), { scale: 0.6, opacity: 0.5, duration: 0.4 });
      }
    }
  }

  function liveFsw(el, a) {
    const counts = a.counts || [];
    counts.forEach((v, i) => { const b = $(`[data-c="${i}"]`, el); if (b) b.textContent = v; });
    if (!a.counts) {
      // los celulares solo ven el total; el host siempre recibe conteos
    }
    if (a.revealed && a.names && !el._revealed) {
      el._revealed = true; sfx.reveal();
      a.names.forEach((list, i) => {
        const box = $(`[data-n="${i}"]`, el); if (!box) return;
        box.innerHTML = list.map((p) => `<span class="pchip" style="--pc:${p.color}"><span class="av">${p.avatar}</span>${esc(p.name)}</span>`).join('');
        const b = $(`[data-c="${i}"]`, el); if (b) b.textContent = list.length;
        gsap.from($$('.pchip', box), { scale: 0, opacity: 0, stagger: 0.07, duration: 0.45, ease: 'back.out(2.5)' });
      });
    }
  }

  function liveCloud(el, a) {
    const ans = $('.ans', el); if (ans) ans.textContent = a.answered;
    const box = $('.cloud', el); if (!box) return;
    const words = (a.words || []).slice().sort((x, y) => y.count - x.count).slice(0, 60);
    const empty = $('.empty', box);
    if (!words.length) { if (!empty) box.innerHTML = '<div class="empty">Esperando respuestas… ✍️</div>'; return; }
    if (empty) empty.remove();
    const W = box.clientWidth, Hh = box.clientHeight;
    const max = Math.max(...words.map((w) => w.count));
    const existing = new Map($$('.word', box).map((s) => [s.dataset.w, s]));
    const keep = new Set();
    const placed = [];
    words.forEach((w, i) => {
      const size = max > 1 ? 40 + 70 * ((w.count - 1) / (max - 1)) : 56;
      let sp = existing.get(w.text); const isNew = !sp;
      if (isNew) {
        sp = document.createElement('span'); sp.className = 'word'; sp.dataset.w = w.text; sp.textContent = w.text;
        sp.style.color = CHIPC[hash(w.text) % CHIPC.length];
        sp.style.visibility = 'hidden'; sp.title = 'Clic para ocultar';
        sp.onclick = () => socket.emit('host:hideWord', w.text);
        box.appendChild(sp);
      }
      sp.style.fontSize = size + 'px';
      const bw = sp.offsetWidth + 18, bh = sp.offsetHeight + 10;
      let x = W / 2, y = Hh / 2;
      for (let t = 0; t < 3000; t++) {
        const ang = t * 0.25, rad = t * 0.7;
        x = W / 2 + Math.cos(ang) * rad * 1.7; y = Hh / 2 + Math.sin(ang) * rad;
        const r = { l: x - bw / 2, t: y - bh / 2, r: x + bw / 2, b: y + bh / 2 };
        if (r.l < 10 || r.t < 10 || r.r > W - 10 || r.b > Hh - 10) continue;
        if (!placed.some((p) => !(r.r < p.l || r.l > p.r || r.b < p.t || r.t > p.b))) { placed.push(r); break; }
      }
      keep.add(w.text);
      if (isNew) {
        sp.style.left = x + 'px'; sp.style.top = y + 'px'; sp.style.visibility = 'visible';
        gsap.from(sp, { scale: 0, opacity: 0, duration: 0.6, ease: 'back.out(3)' });
        sfx.pop();
      } else {
        gsap.to(sp, { left: x, top: y, duration: 0.6, ease: 'power2.out' });
      }
    });
    existing.forEach((sp, k) => { if (!keep.has(k)) gsap.to(sp, { scale: 0, opacity: 0, duration: 0.3, onComplete: () => sp.remove() }); });
  }
  function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }

  // Temporizador del quiz
  function frame() {
    if (S && S.act && S.act.type === 'quiz' && S.act.slide === cur) {
      const el = $('#deck').lastElementChild;
      const a = S.act;
      if (el && a.open && !a.revealed) {
        const rem = Math.max(0, a.endsAt - (Date.now() + clockOffset));
        const dur = a.duration * 1000;
        const ring = $('.ring', el); if (ring) ring.style.strokeDashoffset = 276.5 * (1 - rem / dur);
        const sec = Math.ceil(rem / 1000);
        const t = $('.timer .t', el);
        if (t && t.textContent !== String(sec)) {
          t.textContent = sec;
          if (sec <= 5 && sec > 0 && sec !== lastTick) { lastTick = sec; sfx.tick(); gsap.fromTo(t, { scale: 1.4, color: '#ff3ea5' }, { scale: 1, color: '#ffffff', duration: 0.4 }); }
        }
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // ---------------- HUD ----------------
  function buildProgress() {
    $('#hudProgress').innerHTML = SL.map((s) => `<i style="--seg:${ACC[s.lv]}"></i>`).join('');
  }
  function hud() {
    if (!S) return;
    $('#hudOnline').textContent = S.online;
    $('#hudLv').textContent = `LV ${pad(cur + 1)}/${pad(SL.length)}`;
    const s = SL[cur]; if (!s) return;
    $('#hudSection').textContent = SECT[s.lv];
    $$('#hudProgress i').forEach((n, k) => { n.classList.toggle('on', k <= cur); n.classList.toggle('cur', k === cur); });
    const showQr = qrForced || (s.act && s.type !== 'cover');
    $('#miniQr').classList.toggle('show', !!showQr && s.type !== 'cover' && s.type !== 'sharkbait');
    $('#hud').style.opacity = s.type === 'level' ? 0.4 : 1;
  }

  function buildJump() {
    const j = $('#mJump');
    j.innerHTML = SL.map((s, i) => `<button data-j="${i}" class="${i === cur ? 'cur' : ''}">${pad(i + 1)} · ${esc(s.title)}</button>`).join('');
    $$('button', j).forEach((b) => (b.onclick = () => { socket.emit('host:goto', +b.dataset.j); closeMenu(); }));
  }
  function buildPlayers() {
    const m = $('#mPlayers');
    if (!S) return;
    m.innerHTML = S.players.map((p) => `<span>${p.avatar} ${esc(p.name)} · ${p.score}${p.online ? '' : ' (off)'} <button data-k="${p.pid}">✕</button></span>`).join('') || '<em style="color:var(--mute)">Nadie todavía</em>';
    $$('button', m).forEach((b) => (b.onclick = () => { if (confirm('¿Sacar a este jugador?')) socket.emit('host:kick', b.dataset.k); }));
  }

  // ---------------- Controles ----------------
  const next = () => cur < SL.length - 1 && socket.emit('host:goto', cur + 1);
  const prev = () => cur > 0 && socket.emit('host:goto', cur - 1);
  const reveal = () => socket.emit('host:reveal');
  const full = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen().catch(() => {}));
  const toggleQr = () => { qrForced = !qrForced; hud(); };
  const toggleMute = () => { muted = !muted; localStorage.setItem('hostMute', muted ? '1' : '0'); $('#mMute').textContent = `Sonido: ${muted ? 'OFF' : 'ON'} (M)`; };
  const openMenu = () => { buildJump(); buildPlayers(); $('#menu').classList.remove('hidden'); };
  const closeMenu = () => $('#menu').classList.add('hidden');
  $('#mMute').textContent = `Sonido: ${muted ? 'OFF' : 'ON'} (M)`;

  addEventListener('keydown', (e) => {
    if (e.target.tagName === 'INPUT') return;
    if (!$('#menu').classList.contains('hidden') && e.key !== 'Escape') return;
    const k = e.key;
    if (k === 'ArrowRight' || k === 'PageDown' || k === ' ') { e.preventDefault(); next(); }
    else if (k === 'ArrowLeft' || k === 'PageUp') { e.preventDefault(); prev(); }
    else if (k === 'Enter') {
      e.preventDefault();
      if (SL[cur] && SL[cur].type === 'sharkbait' && SB_URL) window.open(SB_URL, '_blank', 'noopener');
      else reveal();
    }
    else if (k === 'f' || k === 'F') full();
    else if (k === 'q' || k === 'Q') toggleQr();
    else if (k === 'm' || k === 'M') toggleMute();
    else if (k === 'Escape') closeMenu();
  });
  $('#btnNext').onclick = next; $('#btnPrev').onclick = prev; $('#btnReveal').onclick = reveal; $('#btnMenu').onclick = openMenu;
  $('#mClose').onclick = closeMenu; $('#mFull').onclick = full; $('#mQr').onclick = toggleQr; $('#mMute').onclick = toggleMute;
  $('#mReopen').onclick = () => { socket.emit('host:reopen'); closeMenu(); setTimeout(() => { const c = cur; cur = -1; show(c); }, 150); };
  $('#mReset').onclick = () => { if (confirm('¿Reiniciar todo? Se borran puntajes y respuestas.')) { socket.emit('host:reset'); closeMenu(); } };
  let mouseT;
  addEventListener('mousemove', () => { document.body.classList.add('mouse'); clearTimeout(mouseT); mouseT = setTimeout(() => document.body.classList.remove('mouse'), 2500); });
  let tx = null;
  addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; document.body.classList.add('mouse'); }, { passive: true });
  addEventListener('touchend', (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 80) (dx < 0 ? next : prev)(); tx = null; });

  // ---------------- Conexión ----------------
  const socket = io();
  let key = new URLSearchParams(location.search).get('key') || localStorage.getItem('hostKey') || '';
  function auth(k) {
    socket.emit('host:auth', k, (res) => {
      if (!res || !res.ok) {
        $('#auth').classList.remove('hidden');
        $('#authErr').textContent = k ? 'Clave incorrecta' : '';
        return;
      }
      key = k; localStorage.setItem('hostKey', k);
      $('#auth').classList.add('hidden');
      SL = res.slides; SB_URL = res.sharkbaitUrl || ''; buildProgress();
      if (cur >= 0) { const c = cur; cur = -1; show(c); }
    });
  }
  $('#authGo').onclick = () => auth($('#authKey').value.trim());
  $('#authKey').addEventListener('keydown', (e) => { if (e.key === 'Enter') auth($('#authKey').value.trim()); });

  socket.on('connect', () => { $('#offline').classList.add('hidden'); auth(key); });
  socket.on('disconnect', () => $('#offline').classList.remove('hidden'));
  socket.on('host:state', (st) => {
    if (st.act && st.act.now) clockOffset = st.act.now - Date.now();
    S = st;
    if (!SL.length) return;
    if (st.slide !== cur) show(st.slide); else live(false);
    hud();
    if (!$('#menu').classList.contains('hidden')) buildPlayers();
  });
})();
