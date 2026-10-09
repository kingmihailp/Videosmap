// ---------------------------------------------------------------- utilities
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
// the three very rare finds of the secret places (Queen Alexandra's birdwing, the false ringlet, the golden Kaiser-i-Hind; their aberrations too) are marked in red wherever their card or label is drawn
const Rare = { ids: new Set(['ornithoptera_alexandrae', 'coenonympha_oedippus', 'teinopalpus_aureus']), col: '#e8363a', is: sp => !!sp && Rare.ids.has(sp.base || sp.id) };
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function strSeed(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

class Rng {
  constructor(seed) { this.f = mulberry32(typeof seed === 'string' ? strSeed(seed) : seed); }
  next() { return this.f(); }
  range(a, b) { return a + (b - a) * this.f(); }
  int(a, b) { return Math.floor(this.range(a, b + 1)); }
  pick(arr) { return arr[Math.floor(this.f() * arr.length)]; }
  chance(p) { return this.f() < p; }
}

// 2D value noise (smooth) + fbm
class Noise2 {
  constructor(seed) {
    const r = mulberry32(seed); this.p = new Float32Array(256 * 256);
    for (let i = 0; i < this.p.length; i++) this.p[i] = r();
  }
  v(ix, iy) { return this.p[((iy & 255) << 8) | (ix & 255)]; }
  at(x, y) {
    const ix = Math.floor(x), iy = Math.floor(y), fx = x - ix, fy = y - iy;
    const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy);
    const a = this.v(ix, iy), b = this.v(ix + 1, iy), c = this.v(ix, iy + 1), d = this.v(ix + 1, iy + 1);
    return lerp(lerp(a, b, sx), lerp(c, d, sx), sy);
  }
  fbm(x, y, oct = 4) {
    let s = 0, a = 0.5, f = 1, n = 0;
    for (let i = 0; i < oct; i++) { s += a * this.at(x * f, y * f); n += a; a *= 0.5; f *= 2; }
    return s / n;
  }
}

function hex2rgb(h) {
  if (h[0] === '#') h = h.slice(1);
  if (h.length === 3) h = h.split('').map(c => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
const rgb2hex = (r, g, b) => '#' + [r, g, b].map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('');
function mixHex(a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(lerp(A[0], B[0], t), lerp(A[1], B[1], t), lerp(A[2], B[2], t)); }
function shadeHex(a, k) { const A = hex2rgb(a); return rgb2hex(A[0] * k, A[1] * k, A[2] * k); }

// persistent save (guarded: localStorage may be blocked on file://)
const SAVE_KEY = 'flora0world_butterflies_v1';
const Save = {
  data: { caught: {}, aberr: {}, coins: 0, settings: { sound: true, music: true, quality: 'high', volume: 1, volSfx: 1, volMusic: 1 }, specimens: [], boxes: [], uid: 1 },
  CAP: { S: 1, M: 4, L: 9 },
  mp: false, stash: null, mpIdx: 0, mpCnt: 0,
  load() {
    try {
      const s = localStorage.getItem(SAVE_KEY);
      if (s) {
        const d = JSON.parse(s); this.data = Object.assign(this.data, d);
        this.data.settings = Object.assign({ sound: true, music: true, quality: 'high', volume: 1, volSfx: 1, volMusic: 1 }, d.settings);
        if (!d.specimens) { // older save: make a few raw specimens from the journal
          this.data.specimens = []; this.data.boxes = [];
          for (const id in this.data.caught) { const c = this.data.caught[id]; for (let i = 0; i < Math.min(c.count, 3); i++) this.data.specimens.push({ uid: this.nextUid(), sp: id, biome: c.place, date: c.first, q: null, pose: null, box: null }); }
        }
        if (!this.data.boxes) this.data.boxes = [];
        this.data.specimens = this.data.specimens.filter(x => SPECIES_BY_ID[x.sp]);
      }
    } catch (e) {}
  },
  // while online the cabinet (specimens + boxes) is the server's shared one; the personal journal and settings stay local
  write() { try { const d = this.mp && this.stash ? Object.assign({}, this.data, { specimens: this.stash.specimens, boxes: this.stash.boxes, uid: this.stash.uid }) : this.data; localStorage.setItem(SAVE_KEY, JSON.stringify(d)); } catch (e) {} },
  enterMP(cab, idx) { if (!this.mp) this.stash = { specimens: this.data.specimens, boxes: this.data.boxes, uid: this.data.uid }; this.mp = true; this.mpT = Date.now(); this.mpIdx = idx; this.mpCnt = 0; this.setCab(cab); },
  // salvage = the connection dropped by itself: the butterflies caught online this session may not have reached the server, so they are kept in the personal cabinet
  leaveMP(salvage) { if (!this.mp) return; this.mp = false; const mine = salvage && this.stash ? this.data.specimens.filter(x => x.by === Net.name && x.date >= this.mpT && x.q === null) : [];
    if (this.stash) { this.data.specimens = this.stash.specimens; this.data.boxes = this.stash.boxes; this.data.uid = this.stash.uid; } this.stash = null;
    for (const x of mine) { const c = Object.assign({}, x, { uid: this.data.uid++, box: null }); delete c.by; this.data.specimens.push(c); } if (mine.length) this.write(); },
  setCab(cab) { this.data.specimens = cab.specimens.filter(x => SPECIES_BY_ID[x.sp]); this.data.boxes = cab.boxes; },
  nextUid() { return this.mp ? this.mpIdx * 1000000 + (++this.mpCnt) : this.data.uid++; },
  _op(op) { if (this.mp) Net.sendOp(op); },
  has(id) { return !!this.data.caught[id]; },
  aberrants(baseId) { return (this.data.aberr && this.data.aberr[baseId]) || []; },
  aberrTotal() { let n = 0; for (const k in (this.data.aberr || {})) n += this.data.aberr[k].length; return n; },
  count(id) { const a = Aberr.parse(id); if (a) id = a.base; return this.data.caught[id] ? this.data.caught[id].count : 0; },
  add(id, biomeId) {
    const ab = Aberr.parse(id), key = ab ? ab.base : id;   // an aberrant also counts as a catch of its species; its own record lives in data.aberr
    let first = !this.data.caught[key];
    if (first) this.data.caught[key] = { count: 0, first: Date.now(), place: biomeId };
    this.data.caught[key].count++;
    if (ab) { const A = this.data.aberr || (this.data.aberr = {}); (A[key] || (A[key] = [])).push({ code: ab.code, first: Date.now(), place: biomeId }); first = true; }
    const sp = this.data.specimens, spec = { uid: this.nextUid(), sp: id, biome: biomeId, date: Date.now(), q: null, pose: null, box: null };
    if (this.mp) spec.by = Net.name;
    sp.push(spec); this._op({ k: 'addSpec', spec });
    if (!this.mp && sp.length > 400) { const k = sp.findIndex(x => x.q === null && !x.box); if (k >= 0) sp.splice(k, 1); }
    this.write();
    return first;
  },
  total() { return Object.keys(this.data.caught).length; },
  biomeCount(b) { return b.species.filter(s => this.has(s.id)).length; },
  // ---- cabinet
  rawList() { return this.data.specimens.filter(s => s.q === null).sort((a, b) => b.date - a.date); },
  spreadList() { return this.data.specimens.filter(s => s.q !== null); },
  freeSpread() { return this.data.specimens.filter(s => s.q !== null && !s.box).sort((a, b) => b.q - a.q); },
  spec(uid) { return this.data.specimens.find(s => s.uid === uid); },
  // ---- selling to the market merchant (coins are personal; the specimen leaves the shared cabinet)
  sold: {}, soldBox: {},
  sellable(spec) { return !!spec && !spec.box; },
  sell(uid) {
    const s = this.spec(uid); if (!this.sellable(s)) return 0; const p = Econ.price(s);
    this.data.specimens = this.data.specimens.filter(x => x.uid !== uid); this.data.coins = (this.data.coins || 0) + p; this.sold[uid] = p; setTimeout(() => { delete this.sold[uid]; }, 30000);
    this._op({ k: 'delSpec', uid }); this.write(); return p;
  },
  sellRejected(uid) { const p = this.sold[uid]; if (p) { this.data.coins = Math.max(0, (this.data.coins || 0) - p); delete this.sold[uid]; this.write(); } },
  box(uid) { return this.data.boxes.find(b => b.uid === uid); },
  // sell a whole frame (not hung up) with its butterflies to the collector; returns the price (0 = refused)
  sellBox(uid) {
    const b = this.box(uid); if (!b || b.loc) return 0; const inf = Collection.info(b); if (!inf.n) return 0;
    this.data.specimens = this.data.specimens.filter(s => !b.items.includes(s.uid)); this.data.boxes = this.data.boxes.filter(x => x.uid !== uid);
    this.data.coins = (this.data.coins || 0) + inf.total; this.soldBox[uid] = inf.total; setTimeout(() => { delete this.soldBox[uid]; }, 30000); this._op({ k: 'sellBox', uid }); this.write(); return inf.total;
  },
  sellBoxRejected(uid) { const p = this.soldBox[uid]; if (p) { this.data.coins = Math.max(0, (this.data.coins || 0) - p); delete this.soldBox[uid]; this.write(); } },
  addBox(size, style) { const b = { uid: this.nextUid(), size, style, items: new Array(this.CAP[size]).fill(0), loc: null }; this.data.boxes.push(b); this._op({ k: 'addBox', box: { uid: b.uid, size, style } }); this.write(); return b; },
  removeBox(uid) { const b = this.box(uid); if (!b || b.loc) return false; b.items.forEach(u => { const s = this.spec(u); if (s) s.box = null; }); this.data.boxes = this.data.boxes.filter(x => x.uid !== uid); this._op({ k: 'delBox', uid }); this.write(); return true; },
  putIn(box, slot, specUid) { const s = this.spec(specUid); if (!s || s.box || box.items[slot]) return false; box.items[slot] = specUid; s.box = box.uid; this._op({ k: 'putIn', box: box.uid, slot, spec: specUid }); this.write(); return true; },
  takeOut(box, slot) { const u = box.items[slot]; const s = this.spec(u); if (s) s.box = null; box.items[slot] = 0; this._op({ k: 'takeOut', box: box.uid, slot }); this.write(); },
  syncSpread(spec) { this._op({ k: 'spread', uid: spec.uid, q: spec.q, pose: spec.pose }); this.write(); },
  syncBoxLoc(box) { this._op({ k: 'boxLoc', uid: box.uid, loc: box.loc }); this.write(); },
  syncBoxStyle(box) { this._op({ k: 'boxStyle', uid: box.uid, style: box.style }); this.write(); },
  // an operation from another player (already validated by the server)
  applyOp(op) {
    const D = this.data;
    switch (op.k) {
      case 'addSpec': if (!this.spec(op.spec.uid) && SPECIES_BY_ID[op.spec.sp]) D.specimens.push(Object.assign({ q: null, pose: null, box: null }, op.spec, { q: null, pose: null, box: null })); break;
      case 'spread': { const s = this.spec(op.uid); if (s) { s.q = op.q; s.pose = op.pose; } break; }
      case 'delSpec': D.specimens = D.specimens.filter(x => x.uid !== op.uid); break;
      case 'addBox': if (!this.box(op.box.uid)) D.boxes.push({ uid: op.box.uid, size: op.box.size, style: op.box.style, items: new Array(this.CAP[op.box.size]).fill(0), loc: null }); break;
      case 'sellBox': { const b = this.box(op.uid); if (b) { D.specimens = D.specimens.filter(s => !b.items.includes(s.uid)); D.boxes = D.boxes.filter(x => x.uid !== op.uid); } break; }
      case 'delBox': { const b = this.box(op.uid); if (b) { b.items.forEach(u => { const s = this.spec(u); if (s) s.box = null; }); D.boxes = D.boxes.filter(x => x.uid !== op.uid); } break; }
      case 'putIn': { const b = this.box(op.box), s = this.spec(op.spec); if (b && s) { b.items[op.slot] = s.uid; s.box = b.uid; } break; }
      case 'takeOut': { const b = this.box(op.box); if (b) { const s = this.spec(b.items[op.slot]); if (s) s.box = null; b.items[op.slot] = 0; } break; }
      case 'boxLoc': { const b = this.box(op.uid); if (b) b.loc = op.loc; break; }
      case 'boxStyle': { const b = this.box(op.uid); if (b) b.style = op.style; break; }
    }
  },
};
function fmtDate(ts) {
  const d = new Date(ts); const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}
