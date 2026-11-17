// Taller "Gamificar en el aula" — presentación web en vivo + celulares por QR.
const express = require('express');
const http = require('http');
const path = require('path');
const { Server } = require('socket.io');
const QRCode = require('qrcode');
const SLIDES = require('./content');

const PORT = process.env.PORT || 3000;
const HOST_KEY = process.env.HOST_KEY || 'profe';
const SHARKBAIT_URL = process.env.SHARKBAIT_URL || 'https://shark-bait-j1hs.onrender.com';

const app = express();
app.set('trust proxy', true);
const server = http.createServer(app);
const io = new Server(server, { pingInterval: 10000, pingTimeout: 20000 });

const nm = (p) => path.join(__dirname, 'node_modules', p);
app.use('/vendor/gsap', express.static(nm('gsap/dist'), { maxAge: '7d' }));
app.use('/fonts/press', express.static(nm('@fontsource/press-start-2p'), { maxAge: '7d' }));
app.use('/fonts/outfit', express.static(nm('@fontsource/outfit'), { maxAge: '7d' }));
app.use(express.static(path.join(__dirname, 'public'), { maxAge: '1h', index: false }));

app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'play.html')));
app.get('/host', (req, res) => res.sendFile(path.join(__dirname, 'public', 'host.html')));
app.get('/healthz', (req, res) => res.send('ok'));

const qrCache = new Map();
app.get('/qr.svg', async (req, res) => {
  const url = req.query.t === 'sharkbait' ? SHARKBAIT_URL : `${req.protocol}://${req.get('host')}/`;
  try {
    if (!qrCache.has(url)) {
      qrCache.set(url, await QRCode.toString(url, {
        type: 'svg', margin: 1, errorCorrectionLevel: 'M',
        color: { dark: '#070b1f', light: '#ffffff' }
      }));
    }
    res.type('image/svg+xml').set('Cache-Control', 'no-store').send(qrCache.get(url));
  } catch (e) {
    res.status(500).send('qr error');
  }
});

// ---------------- Estado del taller (en memoria) ----------------
const AVATARS = ['🦊', '🐙', '🐸', '🦄', '🐼', '🐯', '🐵', '🐧', '🦖', '🐝', '🐳', '🦉', '🐨', '🐲', '🦀', '🐞', '🦜', '🐺', '🦁', '🐢'];
const COLORS = ['#00e5ff', '#ff3ea5', '#ffd60a', '#7cff4f', '#b388ff', '#ff8a3d'];

const state = {
  slide: 0,
  players: new Map(), // pid -> {pid, name, avatar, color, score, sockets:Set, lastSeen}
  acts: new Map()      // slideIdx -> act
};

function newAct(i) {
  const def = SLIDES[i].act;
  const act = {
    slide: i, type: def.type, def,
    open: true, revealed: false,
    startedAt: Date.now(),
    endsAt: def.type === 'quiz' ? Date.now() + def.duration * 1000 : null,
    answers: new Map(), // pid -> {a, t, pts, ok}
    words: new Map(),   // cloud: word -> {text, count, hidden}
    timer: null
  };
  if (act.type === 'quiz') {
    act.timer = setTimeout(() => reveal(i), def.duration * 1000 + 300);
  }
  state.acts.set(i, act);
  return act;
}

function cleanName(s) {
  return String(s || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 18);
}
function cleanWord(s) {
  return String(s || '').replace(/[<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 28);
}

function ranking() {
  return [...state.players.values()]
    .sort((a, b) => b.score - a.score || a.joinedAt - b.joinedAt)
    .map((p, idx) => ({ pid: p.pid, name: p.name, avatar: p.avatar, color: p.color, score: p.score, rank: idx + 1, online: p.sockets.size > 0 }));
}

function onlineCount() {
  let n = 0;
  for (const p of state.players.values()) if (p.sockets.size > 0) n++;
  return n;
}

function actSummary(act, forHost) {
  if (!act) return null;
  const def = act.def;
  const base = {
    slide: act.slide, type: act.type, question: def.question, hint: def.hint || null,
    options: def.options || null, open: act.open, revealed: act.revealed,
    endsAt: act.endsAt, duration: def.duration || null, now: Date.now(),
    answered: act.type === 'cloud' ? countCloudPlayers(act) : act.answers.size
  };
  const showResults = forHost || act.revealed;
  if (act.type === 'quiz' || act.type === 'poll' || act.type === 'fsw') {
    const n = (def.options || []).length;
    const counts = new Array(n).fill(0);
    const names = Array.from({ length: n }, () => []);
    for (const [pid, a] of act.answers) {
      if (a.a >= 0 && a.a < n) {
        counts[a.a]++;
        const p = state.players.get(pid);
        if (p) names[a.a].push({ name: p.name, avatar: p.avatar, color: p.color });
      }
    }
    if (showResults) base.counts = counts;
    if (act.type === 'fsw' && act.revealed) base.names = names;
    if (act.type === 'fsw' && forHost && !act.revealed) base.counts = counts;
  }
  if (act.type === 'quiz' && act.revealed) {
    base.correct = def.correct;
    base.explain = def.explain || null;
  }
  if (act.type === 'cloud' && showResults) {
    base.words = [...act.words.values()].filter(w => !w.hidden).map(w => ({ text: w.text, count: w.count }));
  }
  return base;
}

function countCloudPlayers(act) {
  return act.answers.size;
}

function hostState() {
  const s = SLIDES[state.slide];
  return {
    slide: state.slide,
    total: SLIDES.length,
    players: ranking(),
    online: onlineCount(),
    act: s.act ? actSummary(state.acts.get(state.slide), true) : null
  };
}

function playerState(p) {
  const s = SLIDES[state.slide];
  const act = s.act ? state.acts.get(state.slide) : null;
  const rank = ranking();
  const me = rank.find(r => r.pid === p.pid);
  let mine = null;
  if (act) {
    const a = act.answers.get(p.pid);
    if (a) mine = { a: a.a, pts: a.pts || 0, ok: act.revealed && act.type === 'quiz' ? a.ok : null, words: a.words || null };
  }
  return {
    slide: state.slide, total: SLIDES.length, title: s.title, lv: s.lv, type: s.type,
    me: { name: p.name, avatar: p.avatar, color: p.color, score: p.score, rank: me ? me.rank : null, of: rank.length },
    act: act ? actSummary(act, false) : null,
    mine
  };
}

function sendHost() {
  io.to('host').emit('host:state', hostState());
}
function sendPlayer(p) {
  const st = playerState(p);
  for (const sid of p.sockets) io.to(sid).emit('state', st);
}
function sendAllPlayers() {
  for (const p of state.players.values()) sendPlayer(p);
}
function broadcast() {
  sendHost();
  sendAllPlayers();
}

function goto(i) {
  i = Math.max(0, Math.min(SLIDES.length - 1, i | 0));
  state.slide = i;
  if (SLIDES[i].act && !state.acts.has(i)) newAct(i);
  broadcast();
}

function reveal(i) {
  const act = state.acts.get(i);
  if (!act || act.revealed) return;
  clearTimeout(act.timer);
  act.open = false;
  act.revealed = true;
  if (act.type === 'quiz') {
    for (const [pid, a] of act.answers) {
      if (a.ok) {
        const p = state.players.get(pid);
        if (p) p.score += a.pts;
      }
    }
  }
  broadcast();
}

let hostThrottle = null;
function sendHostSoon() {
  if (hostThrottle) return;
  hostThrottle = setTimeout(() => { hostThrottle = null; sendHost(); }, 120);
}

function answer(p, payload) {
  const act = state.acts.get(state.slide);
  if (!act || !act.open || act.slide !== payload.slide) return;
  const n = (act.def.options || []).length;
  if (act.type === 'quiz' || act.type === 'poll' || act.type === 'fsw') {
    if (act.type === 'quiz' && act.answers.has(p.pid)) return; // una sola respuesta en quiz
    const a = payload.a | 0;
    if (a < 0 || a >= n) return;
    const first = !act.answers.has(p.pid);
    const rec = { a, t: Date.now() };
    if (act.type === 'quiz') {
      const dur = act.def.duration * 1000;
      const left = Math.max(0, act.endsAt - rec.t);
      rec.ok = a === act.def.correct;
      rec.pts = rec.ok ? Math.round(500 + 500 * (left / dur)) : 0;
    } else {
      rec.pts = 50;
      if (first) p.score += 50; // participar también suma
    }
    act.answers.set(p.pid, rec);
    if (act.type === 'quiz') {
      const online = [...state.players.values()].filter(x => x.sockets.size > 0);
      if (online.length > 0 && online.every(x => act.answers.has(x.pid))) {
        setTimeout(() => reveal(act.slide), 600);
      }
    }
  } else if (act.type === 'cloud') {
    const w = cleanWord(payload.text);
    if (!w) return;
    const rec = act.answers.get(p.pid) || { words: [], pts: 0 };
    if (rec.words.length >= 3) return;
    rec.words.push(w);
    if (rec.words.length === 1) { rec.pts = 50; p.score += 50; }
    act.answers.set(p.pid, rec);
    const key = w.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    const cur = act.words.get(key) || { text: w, count: 0, hidden: false };
    cur.count++;
    act.words.set(key, cur);
  }
  sendPlayer(p);
  sendHostSoon();
  // en la nube de palabras, todos ven las palabras en vivo cuando se revele; el host las ve ya.
}

io.on('connection', (socket) => {
  let player = null;
  let isHost = false;

  socket.on('host:auth', (key, cb) => {
    if (key !== HOST_KEY) return cb && cb({ ok: false });
    isHost = true;
    socket.join('host');
    cb && cb({ ok: true, slides: SLIDES.map(s => ({ ...s, act: s.act ? { ...s.act } : undefined })) });
    if (SLIDES[state.slide].act && !state.acts.has(state.slide)) newAct(state.slide);
    socket.emit('host:state', hostState());
  });

  socket.on('host:goto', (i) => { if (isHost) goto(i); });
  socket.on('host:reveal', () => { if (isHost) reveal(state.slide); });
  socket.on('host:reopen', () => {
    if (!isHost) return;
    const act = state.acts.get(state.slide);
    if (!act) return;
    // Reinicia la actividad de esta escena (devuelve puntos de quiz si ya se habían sumado)
    if (act.type === 'quiz' && act.revealed) {
      for (const [pid, a] of act.answers) {
        const p = state.players.get(pid);
        if (p && a.ok) p.score -= a.pts;
      }
    }
    clearTimeout(act.timer);
    state.acts.delete(state.slide);
    newAct(state.slide);
    broadcast();
  });
  socket.on('host:hideWord', (text) => {
    if (!isHost) return;
    const act = state.acts.get(state.slide);
    if (!act || act.type !== 'cloud') return;
    for (const w of act.words.values()) if (w.text === text) w.hidden = true;
    broadcast();
  });
  socket.on('host:reset', () => {
    if (!isHost) return;
    for (const a of state.acts.values()) clearTimeout(a.timer);
    state.acts.clear();
    for (const p of state.players.values()) p.score = 0;
    state.players.forEach((p, pid) => { if (p.sockets.size === 0) state.players.delete(pid); });
    goto(0);
  });
  socket.on('host:kick', (pid) => {
    if (!isHost) return;
    const p = state.players.get(pid);
    if (!p) return;
    for (const sid of p.sockets) io.to(sid).emit('kicked');
    state.players.delete(pid);
    broadcast();
  });

  socket.on('join', (data, cb) => {
    const pid = String((data && data.pid) || '').slice(0, 64);
    const name = cleanName(data && data.name);
    if (!pid || !name) return cb && cb({ ok: false, error: 'Escribe tu nombre' });
    let p = state.players.get(pid);
    if (!p) {
      const used = new Set([...state.players.values()].map(x => x.avatar));
      const free = AVATARS.filter(a => !used.has(a));
      const pool = free.length ? free : AVATARS;
      p = {
        pid, name,
        avatar: pool[Math.floor(Math.random() * pool.length)],
        color: COLORS[state.players.size % COLORS.length],
        score: 0, sockets: new Set(), joinedAt: Date.now()
      };
      state.players.set(pid, p);
    } else {
      p.name = name;
    }
    p.sockets.add(socket.id);
    player = p;
    cb && cb({ ok: true });
    sendPlayer(p);
    sendHost();
  });

  socket.on('answer', (payload) => { if (player && payload) answer(player, payload); });

  socket.on('disconnect', () => {
    if (player) {
      player.sockets.delete(socket.id);
      sendHostSoon();
    }
  });
});

server.listen(PORT, () => console.log(`Taller en http://localhost:${PORT}  ·  presentador: /host?key=${HOST_KEY === 'profe' ? 'profe' : '***'}`));
