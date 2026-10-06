// Flora0world: Butterflies — multiplayer server.
//  * serves the game (../Flora0world_Butterflies.html) over HTTP and talks to it over WebSocket on the same port
//  * one shared world per server: every location (biome) has one seed, one population of butterflies and one set of visitors;
//    the entomologist's cabinet (specimens, boxes, wall/desk placement) is shared and saved to server/data/state.json
//  * butterflies are simulated by the "host" of a location (the first player there); the server relays their state, arbitrates catches
//    (first catch wins), keeps a snapshot so the next player can take over when the host leaves, and validates cabinet operations.
//  Run:  npm install && node server.js [port]        (default port 3000)
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { WebSocketServer } = require('ws');

const PORT = +(process.argv[2] || process.env.PORT || 3000);
const GAME = path.resolve(process.env.GAME || path.join(__dirname, '..', 'Flora0world_Butterflies.html'));   // GAME=/path/to/file.html overrides
const DATA_DIR = path.join(__dirname, 'data'), STATE_FILE = path.join(DATA_DIR, 'state.json');
const BIOMES = ['russia', 'alps', 'med', 'amazon', 'borneo', 'kenya', 'prairie', 'japan', 'ocean'];
const MAX_NAME = 16;

// ------------------------------------------------------------------ persistent shared state
const rnd = () => Math.random().toString(36).slice(2, 7).toUpperCase();
let state = { specimens: [], boxes: [], nextIdx: 1, seeds: {} };
try { fs.mkdirSync(DATA_DIR, { recursive: true }); state = Object.assign(state, JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'))); } catch (e) {}
for (const b of BIOMES) if (!state.seeds[b]) state.seeds[b] = rnd();
let dirty = true;
function save() { if (!dirty) return; dirty = false; try { fs.writeFileSync(STATE_FILE + '.tmp', JSON.stringify(state)); fs.renameSync(STATE_FILE + '.tmp', STATE_FILE); } catch (e) { console.error('save failed', e.message); } }
setInterval(save, 4000); process.on('SIGINT', () => { save(); process.exit(0); }); process.on('SIGTERM', () => { save(); process.exit(0); });

// ------------------------------------------------------------------ cabinet rules (mirror of the client rules)
const CAP = { S: 1, M: 4, L: 9 }, UNITS = { S: 1, M: 2, L: 4 }, RANK = { S: 1, M: 2, L: 3 };
const WALL = ['L', 'M', 'S', 'S', 'M', 'L'], TOPN = 2, DRAWERS = 3, DRAWER_UNITS = 4;
const spec = u => state.specimens.find(s => s.uid === u), box = u => state.boxes.find(b => b.uid === u);
const at = (t, i) => state.boxes.filter(b => b.loc && b.loc.t === t && b.loc.i === i);
function fits(b, t, i) {
  if (t === 'wall') return i >= 0 && i < WALL.length && !at(t, i).length && RANK[b.size] <= RANK[WALL[i]];
  if (t === 'top') return i >= 0 && i < TOPN && !at(t, i).length && b.size !== 'L';
  if (t === 'drawer') return i >= 0 && i < DRAWERS && at(t, i).reduce((a, x) => a + UNITS[x.size], 0) + UNITS[b.size] <= DRAWER_UNITS;
  return false;
}
// returns true when the operation is valid and has been applied
function applyOp(op) {
  switch (op.k) {
    case 'addSpec': { const s = op.spec; if (!s || spec(s.uid) || !s.sp || String(s.sp).length > 64) return false; state.specimens.push({ uid: s.uid, sp: s.sp, biome: s.biome, date: s.date, q: null, pose: null, box: null, by: String(s.by || '').slice(0, MAX_NAME) }); if (state.specimens.length > 600) { const i = state.specimens.findIndex(x => x.q === null && !x.box); if (i >= 0) state.specimens.splice(i, 1); } return true; }
    case 'delSpec': { const s = spec(op.uid); if (!s || s.box) return false; state.specimens = state.specimens.filter(x => x.uid !== op.uid); return true; }
    case 'spread': { const s = spec(op.uid); if (!s || s.q !== null || !(op.q >= 1 && op.q <= 100) || !op.pose) return false; s.q = op.q; s.pose = op.pose; return true; }
    case 'addBox': { const b = op.box; if (!b || box(b.uid) || !CAP[b.size] || state.boxes.length >= 60) return false; state.boxes.push({ uid: b.uid, size: b.size, style: b.style | 0, items: new Array(CAP[b.size]).fill(0), loc: null }); return true; }
    case 'delBox': { const b = box(op.uid); if (!b || b.loc) return false; b.items.forEach(u => { const s = spec(u); if (s) s.box = null; }); state.boxes = state.boxes.filter(x => x.uid !== b.uid); return true; }
    case 'putIn': { const b = box(op.box), s = spec(op.spec); if (!b || !s || s.q === null || s.box || op.slot < 0 || op.slot >= b.items.length || b.items[op.slot]) return false; b.items[op.slot] = s.uid; s.box = b.uid; return true; }
    case 'takeOut': { const b = box(op.box); if (!b || op.slot < 0 || op.slot >= b.items.length || !b.items[op.slot]) return false; const s = spec(b.items[op.slot]); if (s) s.box = null; b.items[op.slot] = 0; return true; }
    case 'boxLoc': { const b = box(op.uid); if (!b) return false; if (!op.loc) { b.loc = null; return true; } if (!fits(b, op.loc.t, op.loc.i)) return false; b.loc = { t: op.loc.t, i: op.loc.i }; return true; }
    case 'boxStyle': { const b = box(op.uid); if (!b || b.loc) return false; b.style = op.style | 0; return true; }
  }
  return false;
}

// ------------------------------------------------------------------ players & locations
let nextId = 1;
const players = new Map();                 // id -> { id, name, ws, loc, idx }
const locs = new Map();                    // loc -> { ids:Set, host, flies:[], caught:Map(fid -> time), mod }
const cabView = () => ({ specimens: state.specimens, boxes: state.boxes });
function getLoc(name) { let l = locs.get(name); if (!l) { l = { ids: new Set(), host: 0, flies: [], caught: new Map(), mod: null }; locs.set(name, l); } return l; }
const send = (p, o) => { if (p.ws.readyState === 1) p.ws.send(JSON.stringify(o)); };
const broadcast = (o, except) => { const s = JSON.stringify(o); for (const p of players.values()) if (p.id !== except && p.ws.readyState === 1) p.ws.send(s); };
const toLoc = (name, o, except) => { const l = locs.get(name); if (!l) return; const s = JSON.stringify(o); for (const id of l.ids) { if (id === except) continue; const p = players.get(id); if (p && p.ws.readyState === 1) p.ws.send(s); } };
const plist = () => [...players.values()].map(p => ({ id: p.id, name: p.name, loc: p.loc }));
const sendPlist = () => broadcast({ t: 'plist', list: plist() });

function leaveLoc(p) {
  if (!p.loc) return; const name = p.loc, l = locs.get(name); p.loc = null; if (!l) return;
  l.ids.delete(p.id); toLoc(name, { t: 'pleave', id: p.id });
  if (l.host === p.id) { l.host = l.ids.values().next().value || 0; if (l.host) toLoc(name, { t: 'host', id: l.host, flies: l.flies }); }
  if (!l.ids.size) { l.flies = []; l.caught.clear(); l.mod = null; }
}
function joinLoc(p, name) {
  leaveLoc(p); if (!name || (name !== 'cabinet' && name !== 'market' && !BIOMES.includes(name))) { sendPlist(); return; }
  const l = getLoc(name); p.loc = name; l.ids.add(p.id); if (!l.host) l.host = p.id;
  send(p, { t: 'joined', loc: name, seed: state.seeds[name] || '', host: l.host, flies: l.host === p.id ? l.flies : l.flies, mod: l.mod, players: [...l.ids].filter(i => i !== p.id).map(i => ({ id: i, name: players.get(i).name })) });
  toLoc(name, { t: 'pjoin', id: p.id, name: p.name }, p.id); sendPlist();
}

// ------------------------------------------------------------------ HTTP (serves the game) + WebSocket
const server = http.createServer((req, res) => {
  const url = req.url.split('?')[0];
  if (url === '/' || url === '/index.html' || url === '/Flora0world_Butterflies.html') {
    fs.readFile(GAME, (err, buf) => { if (err) { res.writeHead(500); res.end('Game file not found: build it with python3 tools/build.py'); } else { res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' }); res.end(buf); } });
  } else if (url === '/health') { res.writeHead(200, { 'Content-Type': 'application/json' }); res.end(JSON.stringify({ players: players.size, specimens: state.specimens.length, boxes: state.boxes.length })); }
  else { res.writeHead(404); res.end('not found'); }
});
const wss = new WebSocketServer({ server, maxPayload: 256 * 1024 });
wss.on('connection', ws => {
  let me = null; ws.isAlive = true; ws.on('pong', () => { ws.isAlive = true; });
  ws.on('message', raw => {
    let m; try { m = JSON.parse(raw); } catch (e) { return; }
    if (!me) {
      if (m.t !== 'hello') return;
      const name = String(m.name || 'Гость').replace(/[^\p{L}\p{N} _.-]/gu, '').trim().slice(0, MAX_NAME) || 'Гость';
      me = { id: nextId++, name, ws, loc: null, idx: state.nextIdx++ }; players.set(me.id, me); dirty = true;
      send(me, { t: 'welcome', id: me.id, idx: me.idx, name, cab: cabView(), seeds: state.seeds, players: plist() });
      sendPlist(); console.log('+', name, `(${players.size} online)`); return;
    }
    switch (m.t) {
      case 'join': joinLoc(me, m.loc); break;
      case 'pos': if (me.loc) toLoc(me.loc, { t: 'p', id: me.id, x: m.x, y: m.y, z: m.z, yaw: m.yaw, pitch: m.pitch, nz: m.nz, fl: m.fl, sw: m.sw, sp: m.sp, st: m.st }, me.id); break;
      case 'flies': { const l = me.loc && locs.get(me.loc); if (!l || l.host !== me.id || !Array.isArray(m.list)) break; const now = Date.now(); for (const [k, t] of l.caught) if (now - t > 15000) l.caught.delete(k); l.flies = m.list.filter(f => !l.caught.has(f[0])); toLoc(me.loc, { t: 'flies', list: l.flies }, me.id); break; }
      case 'catch': { const l = me.loc && locs.get(me.loc); if (!l) break; const fl = l.flies.find(f => f[0] === m.fid); if (!fl || l.caught.has(m.fid)) { send(me, { t: 'catchNo', fid: m.fid }); break; } l.caught.set(m.fid, Date.now()); l.flies = l.flies.filter(f => f[0] !== m.fid); send(me, { t: 'catchOk', fid: m.fid, sp: fl[1] }); toLoc(me.loc, { t: 'caught', fid: m.fid, by: me.id, name: me.name, sp: fl[1] }, me.id); break; }
      case 'mod': { const l = me.loc && locs.get(me.loc); if (!l) break; l.mod = { id: m.id, until: Date.now() + 90000, by: me.name }; toLoc(me.loc, { t: 'mod', id: m.id, by: me.name }); break; }
      case 'regen': { const l = me.loc && locs.get(me.loc); if (!l || me.loc === 'cabinet' || l.ids.size !== 1) { send(me, { t: 'regenNo' }); break; } state.seeds[me.loc] = rnd(); dirty = true; l.flies = []; l.caught.clear(); send(me, { t: 'reseed', loc: me.loc, seed: state.seeds[me.loc] }); break; }
      case 'op': { const ok = m.op && applyOp(m.op); if (ok) { dirty = true; broadcast({ t: 'op', op: m.op, by: me.id }, me.id); } else { send(me, { t: 'opNo', k: m.op && m.op.k, uid: m.op && m.op.uid }); send(me, { t: 'resync', cab: cabView() }); } break; }
      case 'chat': { const text = String(m.text || '').slice(0, 120); if (text) broadcast({ t: 'chat', name: me.name, text }); break; }
    }
  });
  ws.on('close', () => { if (!me) return; leaveLoc(me); players.delete(me.id); sendPlist(); console.log('-', me.name, `(${players.size} online)`); });
  ws.on('error', () => {});
});
setInterval(() => { wss.clients.forEach(ws => { if (!ws.isAlive) return ws.terminate(); ws.isAlive = false; ws.ping(); }); }, 15000);
server.listen(PORT, () => {
  try { const st = fs.statSync(GAME); console.log(`Game file: ${GAME}  (${Math.round(st.size / 1024)} KB, modified ${st.mtime.toISOString().slice(0, 16).replace('T', ' ')})`); } catch (e) { console.log('WARNING: game file not found: ' + GAME); }
  const nets = require('os').networkInterfaces(); const ips = [].concat(...Object.values(nets)).filter(n => n && n.family === 'IPv4' && !n.internal).map(n => n.address);
  console.log(`Flora0world server on http://localhost:${PORT}` + (ips.length ? '   (LAN: ' + ips.map(i => `http://${i}:${PORT}`).join(', ') + ')' : ''));
});
