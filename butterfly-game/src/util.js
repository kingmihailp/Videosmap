// ---------------------------------------------------------------- utilities
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x));
const lerp = (a, b, t) => a + (b - a) * t;
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
  data: { caught: {}, settings: { sound: true, music: true, quality: 'high' }, specimens: [], boxes: [], uid: 1 },
  CAP: { S: 1, M: 4, L: 9 },
  load() {
    try {
      const s = localStorage.getItem(SAVE_KEY);
      if (s) {
        const d = JSON.parse(s); this.data = Object.assign(this.data, d);
        this.data.settings = Object.assign({ sound: true, music: true, quality: 'high' }, d.settings);
        if (!d.specimens) { // older save: make a few raw specimens from the journal
          this.data.specimens = []; this.data.boxes = [];
          for (const id in this.data.caught) { const c = this.data.caught[id]; for (let i = 0; i < Math.min(c.count, 3); i++) this.data.specimens.push({ uid: this.nextUid(), sp: id, biome: c.place, date: c.first, q: null, pose: null, box: null }); }
        }
        if (!this.data.boxes) this.data.boxes = [];
        this.data.specimens = this.data.specimens.filter(x => SPECIES_BY_ID[x.sp]);
      }
    } catch (e) {}
  },
  write() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(this.data)); } catch (e) {} },
  nextUid() { return this.data.uid++; },
  has(id) { return !!this.data.caught[id]; },
  count(id) { return this.data.caught[id] ? this.data.caught[id].count : 0; },
  add(id, biomeId) {
    const first = !this.data.caught[id];
    if (first) this.data.caught[id] = { count: 0, first: Date.now(), place: biomeId };
    this.data.caught[id].count++;
    const sp = this.data.specimens;
    sp.push({ uid: this.nextUid(), sp: id, biome: biomeId, date: Date.now(), q: null, pose: null, box: null });
    if (sp.length > 400) { const k = sp.findIndex(x => x.q === null && !x.box); if (k >= 0) sp.splice(k, 1); }
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
  box(uid) { return this.data.boxes.find(b => b.uid === uid); },
  addBox(size, style) { const b = { uid: this.nextUid(), size, style, items: new Array(this.CAP[size]).fill(0), loc: null }; this.data.boxes.push(b); this.write(); return b; },
  removeBox(uid) { const b = this.box(uid); if (!b || b.loc) return false; b.items.forEach(u => { const s = this.spec(u); if (s) s.box = null; }); this.data.boxes = this.data.boxes.filter(x => x.uid !== uid); this.write(); return true; },
  putIn(box, slot, specUid) { const s = this.spec(specUid); if (!s || s.box || box.items[slot]) return false; box.items[slot] = specUid; s.box = box.uid; this.write(); return true; },
  takeOut(box, slot) { const u = box.items[slot]; const s = this.spec(u); if (s) s.box = null; box.items[slot] = 0; this.write(); },
};
function fmtDate(ts) {
  const d = new Date(ts); const p = n => String(n).padStart(2, '0');
  return `${p(d.getDate())}.${p(d.getMonth() + 1)}.${d.getFullYear()}`;
}
