// ---------------------------------------------------------------- the museum of the collection: a big hall behind the east door of the cabinet.
// Lots of tables, racks, shelves and wall space for the framed boxes (88 places: Boxes.MUS). Same interface as the Cabinet / Market (App.cab).
const Museum = (() => {
  const c = UIK.col;
  const RW = 24, RD = 16, RH = 4.8, HX = RW / 2, HZ = RD / 2, PPM = 230, TOP = 0.93;       // TOP: the surface of the tables
  const MUS = Boxes.MUS, MWCLS = Boxes.MWCLS;

  // ------------------------------------------------------------ helpers
  function ctex(w, h, draw, rx, ry, smooth) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; draw(x, w, h);
    const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = smooth ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter; t.generateMipmaps = !!smooth;
    if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } return t;
  }
  const lam = (col, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: col }, o));
  const bas = (col, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: col }, o));
  function mesh(geo, mat, x, y, z) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); return m; }
  const R = new Rng(4242);

  // a static batch of coloured geometry: one mesh for all the furniture. Every part is remembered (userData.items: [x, y, z, w, h, d, ry, unit]) so a test can check what stands on what.
  const M4 = (x, y, z) => new THREE.Matrix4().makeTranslation(x, y, z);
  function bladeG(len, wid, bend, segs = 6) {          // a leaf: grows along +y, is wide along x, arches towards +z
    const pos = [], idx = [];
    for (let i = 0; i <= segs; i++) { const t = i / segs, hw = wid / 2 * Math.pow(Math.sin(Math.PI * Math.min(1, 0.12 + 0.88 * t)), 0.75) + 0.003, y = len * t * (1 - 0.12 * t), z = bend * len * t * t; pos.push(-hw, y, z, hw, y, z); if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }
  class Batch {
    constructor() { this.P = []; this.N = []; this.C = []; this.items = []; this.unit = ''; }
    box(w, h, d, x, y, z, col, ry = 0) {
      const cc = new THREE.Color(col), co = Math.cos(ry), si = Math.sin(ry), hw = w / 2, hh = h / 2, hd = d / 2; this.items.push([x, y, z, w, h, d, ry, this.unit]);
      const tr = (a, b, e) => [x + a * hw * co + e * hd * si, y + b * hh, z - a * hw * si + e * hd * co];
      for (const [n, vs] of Batch.FACES) {
        const nn = [n[0] * co + n[2] * si, n[1], -n[0] * si + n[2] * co], q = vs.map(v => tr(v[0], v[1], v[2]));
        for (const tri of [[0, 1, 2], [0, 2, 3]]) {
          let [a, b, e] = tri.map(i => q[i]);
          const ux = b[0] - a[0], uy = b[1] - a[1], uz = b[2] - a[2], vx = e[0] - a[0], vy = e[1] - a[1], vz = e[2] - a[2];
          if ((uy * vz - uz * vy) * nn[0] + (uz * vx - ux * vz) * nn[1] + (ux * vy - uy * vx) * nn[2] < 0) [b, e] = [e, b];
          for (const p of [a, b, e]) { this.P.push(p[0], p[1], p[2]); this.N.push(nn[0], nn[1], nn[2]); this.C.push(cc.r, cc.g, cc.b); }
        }
      }
    }
    // any geometry (flat shaded); col: a colour or [bottom, top]
    geo(g, m, col) {
      const gg = g.index ? g.toNonIndexed() : g.clone(); gg.applyMatrix4(m); gg.computeVertexNormals(); gg.computeBoundingBox(); const bb = gg.boundingBox, p = gg.attributes.position, n = gg.attributes.normal;
      const c0 = new THREE.Color(Array.isArray(col) ? col[0] : col), c1 = new THREE.Color(Array.isArray(col) ? col[1] : col), hy = Math.max(1e-6, bb.max.y - bb.min.y), tc = new THREE.Color();
      for (let i = 0; i < p.count; i++) { tc.copy(c0).lerp(c1, (p.getY(i) - bb.min.y) / hy); this.P.push(p.getX(i), p.getY(i), p.getZ(i)); this.N.push(n.getX(i), n.getY(i), n.getZ(i)); this.C.push(tc.r, tc.g, tc.b); }
      this.items.push([(bb.min.x + bb.max.x) / 2, (bb.min.y + bb.max.y) / 2, (bb.min.z + bb.max.z) / 2, bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z, 0, this.unit]);
    }
    cyl(rt, rb, h, x, y, z, col, seg = 10) { this.geo(new THREE.CylinderGeometry(rt, rb, h, seg), M4(x, y, z), col); }
    lathe(pts, x, y, z, col, seg = 14) { this.geo(new THREE.LatheGeometry(pts.map(p => new THREE.Vector2(p[0], p[1])), seg), M4(x, y, z), col); }
    ball(r, x, y, z, col, seg = 8, sy = 1) { const m = M4(x, y, z); m.scale(new THREE.Vector3(1, sy, 1)); this.geo(new THREE.SphereGeometry(r, seg, Math.max(4, seg - 2)), m, col); }
    limb(a, b, r0, r1, col, seg = 6) { const len = Math.max(0.01, a.distanceTo(b)), g = new THREE.CylinderGeometry(r1, r0, len, seg); g.translate(0, len / 2, 0); const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize()); this.geo(g, new THREE.Matrix4().compose(a, q, new THREE.Vector3(1, 1, 1)), col); }
    blade(len, wid, bend, x, y, z, az, tilt, col, segs = 6) { const m = new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(tilt, az, 0, 'YXZ')), new THREE.Vector3(1, 1, 1)); this.geo(bladeG(len, wid, bend, segs), m, col); }
    build() {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide })); m.userData.items = this.items; m.frustumCulled = false; return m;
    }
  }
  Batch.FACES = [[[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]], [[-1, 0, 0], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]]], [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]],
    [[0, -1, 0], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]]], [[0, 0, 1], [[1, -1, 1], [1, 1, 1], [-1, 1, 1], [-1, -1, 1]]], [[0, 0, -1], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]]]];
  // quads textured with one picture (specimens lying in the glass-topped cases), merged per picture
  class QuadBatch { constructor(tex) { this.tex = tex; this.P = []; this.U = []; this.items = []; } quad(x, y, z, w, d, rot) { const e = Math.max(w, d); this.items.push([x, y, z, e, 0.004, e, 0, 'quad']); const c = Math.cos(rot), s = Math.sin(rot), pt = (a, b) => [x + a * c - b * s, y, z + a * s + b * c], q = [pt(-w / 2, d / 2), pt(w / 2, d / 2), pt(w / 2, -d / 2), pt(-w / 2, -d / 2)], uv = [[0, 0], [1, 0], [1, 1], [0, 1]]; for (const i of [0, 1, 2, 0, 2, 3]) { this.P.push(...q[i]); this.U.push(...uv[i]); } }
    build() { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(this.U, 2)); g.computeVertexNormals(); const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ map: this.tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide })); m.frustumCulled = false; m.userData.items = this.items; return m; } }

  // ------------------------------------------------------------ the layout: where every place for a box is (pure data, also used by the tests)
  const WOOD = ['#6a4426', '#5a3820', '#7a5030'], DARK = '#3e2414', BRASS = '#c8a040';
  const LAYOUT = (() => {
    const L = { tables: [], large: [], racks: [], lowcases: [], cases: [], slots: { mt: [], ml: [], mr: [], mw: [] } };
    for (let r = 0; r < 2; r++) for (let i = 0; i < 6; i++) {                                    // 12 display tables, 2 places each
      const x = -8.5 + i * 3.4, z = r ? 4.6 : -4.6; L.tables.push({ x, z, w: 2.4, d: 1.2, ry: r ? Math.PI : 0 });
      for (const s of [-1, 1]) L.slots.mt.push({ x: x + s * 0.58, z, y: TOP, ry: r ? Math.PI : 0, zone: L.tables.length - 1 });
    }
    for (const x of [-7.5, -2.5, 2.5, 7.5]) { L.large.push({ x, z: 0, w: 2.0, d: 1.6 }); L.slots.ml.push({ x, z: 0, y: TOP, ry: 0, zone: L.large.length - 1 }); }
    for (let k = 0; k < 6; k++) {                                                                  // 6 racks: 3 shelves x 2 upright places
      const f = k < 3 ? 1 : -1, x = [-7.5, 0, 7.5][k % 3], z = f > 0 ? -2.45 : 2.45; L.racks.push({ x, z, f, w: 2.4, d: 0.5, h: 3.1 });
      for (let j = 0; j < 3; j++) for (const s of [-1, 1]) L.slots.mr.push({ x: x + s * 0.54, y: 0.38 + j * 0.9, z: z - f * 0.22, f, ry: f > 0 ? 0 : Math.PI, zone: k });
    }
    const mw = (x, z, ry) => L.slots.mw.push({ x, z, y: 2.3, ry, zone: L.slots.mw.length });         // wall frames: y is the centre height
    for (let i = 0; i < 8; i++) mw(-10.5 + 3 * i, -HZ, 0);
    for (let i = 0; i < 8; i++) mw(-10.5 + 3 * i, HZ, Math.PI);
    for (const z of [-6, -2.2, 2.2, 6]) mw(HX, z, -Math.PI / 2);
    for (const z of [-6.2, -3.3, 3.3, 6.2]) mw(-HX, z, Math.PI / 2);
    for (let i = 0; i < 8; i++) { const end = i === 0 || i === 7, x = end ? (i ? 10.25 : -10.25) : -10.5 + 3 * i, w = end ? 2.0 : 2.5; const cx = !end && i === 3 ? -1.75 : !end && i === 4 ? 1.75 : x, cw = !end && (i === 3 || i === 4) ? 2.0 : w; L.lowcases.push({ x: cx, z: -HZ + 0.3, w: cw, d: 0.5, ry: 0 }); L.lowcases.push({ x, z: HZ - 0.3, w, d: 0.5, ry: Math.PI }); }      // the outer ones are shorter: the corner columns stand there
    for (const [z, w] of [[-4.1, 1.7], [0, 1.7], [4.1, 1.7]]) L.cases.push({ x: HX - 0.25, z, w, d: 0.45, h: 3.5, ry: -Math.PI / 2 });      // tall bookcases
    for (const z of [-4.75, 4.75]) L.cases.push({ x: -HX + 0.25, z, w: 1.2, d: 0.45, h: 3.5, ry: Math.PI / 2 });
    return L;
  })();

  // ------------------------------------------------------------ textures
  const T_FLOOR = () => ctex(64, 64, (x, w, h) => { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const dark = (i + j) % 2; x.fillStyle = dark ? '#8a6a46' : '#a88458'; x.fillRect(i * 16, j * 16, 16, 16); x.fillStyle = 'rgba(40,20,8,0.28)'; for (let k = 0; k < 4; k++) x.fillRect(i * 16, j * 16 + 3 + k * 4, 16, 1); x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillRect(i * 16, j * 16, 16, 1); x.fillRect(i * 16, j * 16, 1, 16); } }, RW / 4, RD / 4);
  const T_MEDAL = () => ctex(128, 128, (x, w, h) => { x.fillStyle = '#6a1c1c'; x.fillRect(0, 0, w, h); x.fillStyle = '#d0b060'; x.beginPath(); x.arc(64, 64, 62, 0, 6.3); x.fill(); x.fillStyle = '#2c4a5a'; x.beginPath(); x.arc(64, 64, 56, 0, 6.3); x.fill(); x.fillStyle = '#d0b060'; x.beginPath(); x.arc(64, 64, 46, 0, 6.3); x.fill(); x.fillStyle = '#7a2424'; x.beginPath(); x.arc(64, 64, 42, 0, 6.3); x.fill();
    x.fillStyle = '#d0b060'; for (let i = 0; i < 16; i++) { const a = i * Math.PI / 8, r = i % 2 ? 26 : 40; x.beginPath(); x.moveTo(64, 64); x.lineTo(64 + Math.cos(a - 0.14) * r * 0.5, 64 + Math.sin(a - 0.14) * r * 0.5); x.lineTo(64 + Math.cos(a) * r, 64 + Math.sin(a) * r); x.lineTo(64 + Math.cos(a + 0.14) * r * 0.5, 64 + Math.sin(a + 0.14) * r * 0.5); x.fill(); }
    x.fillStyle = '#2c4a5a'; x.beginPath(); x.arc(64, 64, 8, 0, 6.3); x.fill(); x.fillStyle = '#efe6c8'; x.fillRect(62, 62, 4, 4); }, 0, 0, true);
  const T_SKY = () => ctex(32, 32, (x, w, h) => { const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#fffbe8'); g.addColorStop(1, '#e8f4ff'); x.fillStyle = g; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,0.8)'; x.fillRect(4, 8, 14, 3); x.fillRect(10, 18, 16, 3); }, 0, 0, true);
  const T_DIAL = () => ctex(128, 128, (x, w, h) => { x.fillStyle = '#efe6c8'; x.fillRect(0, 0, w, h); x.strokeStyle = '#2a1a0e'; x.lineWidth = 2; x.beginPath(); x.arc(64, 64, 58, 0, 6.3); x.stroke(); x.lineWidth = 1; x.beginPath(); x.arc(64, 64, 49, 0, 6.3); x.stroke();
    for (let i = 0; i < 60; i++) { const a = i / 60 * 6.2832, r0 = i % 5 ? 52 : 49, r1 = 57; x.lineWidth = i % 5 ? 1 : 2; x.beginPath(); x.moveTo(64 + Math.sin(a) * r0, 64 - Math.cos(a) * r0); x.lineTo(64 + Math.sin(a) * r1, 64 - Math.cos(a) * r1); x.stroke(); }
    const R = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI']; R.forEach((t, i) => { const a = i / 12 * 6.2832; T.draw(x, t, 64 + Math.sin(a) * 38, 64 - Math.cos(a) * 38 - 4, { size: 8, align: 'c', color: '#2a1a0e' }); });
    x.fillStyle = '#8a6a22'; x.beginPath(); x.arc(64, 64, 3, 0, 6.3); x.fill(); }, 0, 0, true);
  function wallTex(L) {
    const k = 40, w = Math.round(L * k), h = Math.round(RH * k);
    const t = ctex(w, h, (x) => {
      x.fillStyle = '#4a2630'; x.fillRect(0, 0, w, h); for (let i = 0; i < w; i += 10) { x.fillStyle = (i / 10) % 2 ? '#512a35' : '#44222c'; x.fillRect(i, 0, 10, h); }
      for (let yy = 8; yy < h - 70; yy += 22) for (let xx = 5 + ((yy / 22) % 2) * 11; xx < w; xx += 22) { x.fillStyle = '#8a6a3a'; x.fillRect(xx, yy, 2, 2); x.fillRect(xx - 2, yy + 2, 2, 2); x.fillRect(xx + 2, yy + 2, 2, 2); x.fillRect(xx, yy + 4, 2, 2); }
      const wy = h - 70; x.fillStyle = '#5a3a22'; x.fillRect(0, wy, w, 70); for (let xx = 4; xx < w - 10; xx += 36) { x.fillStyle = '#6e4a2c'; x.fillRect(xx, wy + 8, 30, 46); x.fillStyle = '#82583a'; x.fillRect(xx, wy + 8, 30, 1); x.fillStyle = '#3e2614'; x.fillRect(xx, wy + 53, 30, 1); }
      x.fillStyle = '#7e5434'; x.fillRect(0, wy - 1, w, 5); x.fillStyle = '#9a6c44'; x.fillRect(0, wy - 1, w, 1); x.fillStyle = '#3e2614'; x.fillRect(0, h - 6, w, 6);
      x.fillStyle = '#d8c89a'; x.fillRect(0, 0, w, 6); x.fillStyle = '#b8a678'; x.fillRect(0, 6, w, 2);
    });
    t.repeat.set(1 / L, 1 / RH); t.offset.set(0.5, 0); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }
  function signTex(text, w, h, bg, fg, border) { return ctex(w, h, (x) => { x.fillStyle = border || BRASS; x.fillRect(0, 0, w, h); x.fillStyle = bg; x.fillRect(2, 2, w - 4, h - 4); T.draw(x, text, w / 2, Math.round((h - 8) / 2), { size: 8, align: 'c', color: fg }); }, 0, 0, true); }
  const boxTex = new Map();
  function texFor(box) { const cv = Boxes.canvas(box); if (boxTex.has(cv)) return boxTex.get(cv); const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; boxTex.set(cv, t); return t; }
  const outlineTex = {}; function outline(wd, hh, label) { const key = label + wd; return outlineTex[key] || (outlineTex[key] = ctex(64, 48, (g, w2, h2) => { g.strokeStyle = 'rgba(220,190,110,0.55)'; g.setLineDash([3, 3]); g.strokeRect(2.5, 2.5, w2 - 5, h2 - 5); if (label) T.draw(g, label, w2 / 2, h2 / 2 - 4, { size: 8, align: 'c', color: 'rgba(220,190,110,0.7)' }); }, 0, 0, true)); }

  // ------------------------------------------------------------ the room
  class Mus {
    constructor(hooks) {
      this.hooks = hooks; this.ov = null; this.t = 0; this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#1a1410'); this.scene.fog = new THREE.Fog('#1a1410', 22, 60);
      this.camera = new THREE.PerspectiveCamera(70, SW / SH, 0.07, 120); this.scene.add(this.camera);
      this.player = { pos: new THREE.Vector3(-HX + 1.3, 0, 0), yaw: -Math.PI / 2, pitch: -0.03, bob: 0, vel: new THREE.Vector2(), stepD: 0, moving: false };
      this.colliders = []; this.stations = []; this.toastT = 0; this.toastText = ''; this.prompt = null; this.netAcc = 0;
      this.dynamic = new THREE.Group(); this.scene.add(this.dynamic);
      this.build(); this.refresh(); Snd.startAmbient('cabinet'); this.toast('Музей коллекции', 3);
      if (Net.on) { this.remotes = new Remotes(this.scene); Net.hooks.cab = () => this.refresh(); Net.hooks.pjoin = m => this.toast(`${m.name} вошёл в музей`, 2.5); Net.hooks.pleave = (m, r) => this.toast(`${r ? r.name : 'Игрок'} вышел`, 2.5); }
      this.camera.position.set(this.player.pos.x, 1.62, this.player.pos.z);
    }
    toast(s, d = 2.5) { this.toastText = s; this.toastT = d; }
    addCol(x0, x1, z0, z1) { this.colliders.push({ x0, x1, z0, z1 }); }

    build() {
      const S = this.scene, B = new Batch(), wallM = L => lam('#ffffff', { map: wallTex(L) }), V = (x, y, z) => new THREE.Vector3(x, y, z), brassC = '#c8a040', brassD = '#8a6a22';
      const pick = a => a[(R.next() * a.length) | 0], glow = [];     // glow: emissive bits (bulbs, flames, skylights) kept as separate meshes
      const emit = (r, x, y, z, col = '#fff2c0') => { const m = mesh(new THREE.SphereGeometry(r, 8, 6), bas(col), x, y, z); S.add(m); return m; };
      // --- light: a warm hall; pendant lamps carry real lights, chandeliers and sconces are only bright
      S.add(new THREE.HemisphereLight('#ffeacc', '#4a3624', 1.05));
      this.lamps = []; for (const [x, z] of [[-6, -4], [0, -4], [6, -4], [-6, 4], [0, 4], [6, 4]]) { const p = new THREE.PointLight('#ffd89a', 0.55, 12, 1.5); p.position.set(x, 3.4, z); S.add(p); this.lamps.push([x, z]); }
      // --- floor (parquet with an inlaid border and a medallion), ceiling, walls (the west wall has the door)
      const floor = mesh(new THREE.PlaneGeometry(RW, RD), lam('#ffffff', { map: T_FLOOR() }), 0, 0, 0); floor.rotation.x = -Math.PI / 2; floor.userData.noFloat = true; S.add(floor);
      const ceil = mesh(new THREE.PlaneGeometry(RW, RD), lam('#e4d8b4'), 0, RH, 0); ceil.rotation.x = Math.PI / 2; ceil.userData.noFloat = true; S.add(ceil);
      const medal = mesh(new THREE.CircleGeometry(1.45, 40), lam('#ffffff', { map: T_MEDAL() }), 0, 0.016, 0); medal.rotation.x = -Math.PI / 2; S.add(medal);
      const mkWall = (L, rotY, x, z, door) => {
        const sh = new THREE.Shape(), hl = L / 2;
        if (door) { sh.moveTo(-hl, 0); sh.lineTo(door[0], 0); sh.lineTo(door[0], door[2]); sh.lineTo(door[1], door[2]); sh.lineTo(door[1], 0); sh.lineTo(hl, 0); sh.lineTo(hl, RH); sh.lineTo(-hl, RH); sh.lineTo(-hl, 0); }
        else { sh.moveTo(-hl, 0); sh.lineTo(hl, 0); sh.lineTo(hl, RH); sh.lineTo(-hl, RH); sh.lineTo(-hl, 0); }
        const m = mesh(new THREE.ShapeGeometry(sh), wallM(L), x, 0, z); m.rotation.y = rotY; m.userData.noFloat = true; S.add(m);
      };
      mkWall(RW, 0, 0, -HZ); mkWall(RW, Math.PI, 0, HZ); mkWall(RD, -Math.PI / 2, HX, 0); mkWall(RD, Math.PI / 2, -HX, 0, [-0.55, 0.55, 2.3]);
      // --- the room itself: inlaid floor border, baseboards, a stepped cornice, pilasters, a coffered ceiling, skylights
      B.unit = 'room';
      for (const [w, d, x, z] of [[RW - 1.0, 0.1, 0, -HZ + 0.5], [RW - 1.0, 0.1, 0, HZ - 0.5], [0.1, RD - 1.0, -HX + 0.5, 0], [0.1, RD - 1.0, HX - 0.5, 0]]) { B.box(w, 0.012, d, x, 0.006, z, brassC); B.box(w + (w > d ? 0 : 0.5), 0.012, d + (w > d ? 0.5 : 0), x, 0.004, z, '#3e2414'); }
      B.box(RW, 0.16, 0.06, 0, 0.08, -HZ + 0.03, '#3e2614'); B.box(RW, 0.16, 0.06, 0, 0.08, HZ - 0.03, '#3e2614'); B.box(0.06, 0.16, RD, HX - 0.03, 0.08, 0, '#3e2614');
      B.box(0.06, 0.16, 7.35, -HX + 0.03, 0.08, -4.275, '#3e2614'); B.box(0.06, 0.16, 7.35, -HX + 0.03, 0.08, 4.275, '#3e2614');
      B.box(RW, 0.04, 0.08, 0, 0.17, -HZ + 0.04, brassD); B.box(RW, 0.04, 0.08, 0, 0.17, HZ - 0.04, brassD);
      for (const [lw, dd, x, z, ry] of [[RW, 1, 0, -HZ, 0], [RW, 1, 0, HZ, 0], [RD, 1, HX, 0, 1], [RD, 1, -HX, 0, 1]]) {      // cornice: three steps
        const sg = z === 0 ? -Math.sign(x) : -Math.sign(z); const horiz = !ry;
        for (let i = 0; i < 3; i++) { const dpt = 0.1 + i * 0.07, hh = 0.07; if (horiz) B.box(lw, hh, dpt, x, RH - 0.035 - i * 0.07 + 0, z + sg * dpt / 2, i === 1 ? brassC : '#c8b88a'); else B.box(dpt, hh, lw, x + sg * dpt / 2, RH - 0.035 - i * 0.07, z, i === 1 ? brassC : '#c8b88a'); }
      }
      for (const x of [-6, 0, 6]) for (const sgz of [-1, 1]) {      // pilasters (on the north wall the middle one is the clock's place)
        if (x === 0 && sgz === -1) continue;      // base, fluted shaft, capital
        const z = sgz * (HZ - 0.07); B.box(0.5, 0.35, 0.14, x, 0.175, z, '#b8a678'); B.box(0.36, 4.0, 0.1, x, 2.35, z, '#d8c8a0'); for (const fx of [-0.12, 0, 0.12]) B.box(0.04, 3.9, 0.12, x + fx, 2.3, z - sgz * 0.005, '#c4b48c'); B.box(0.5, 0.2, 0.14, x, 4.45, z, '#b8a678'); B.box(0.58, 0.07, 0.17, x, 4.6, z, brassC);
      }
      for (const [x, z] of [[-HX + 0.27, -HZ + 0.27], [HX - 0.27, -HZ + 0.27], [-HX + 0.27, HZ - 0.27], [HX - 0.27, HZ - 0.27]]) { B.box(0.4, 4.6, 0.4, x, 2.3, z, '#d8c8a0'); B.box(0.46, 0.3, 0.46, x, 0.15, z, '#b8a678'); B.box(0.5, 0.16, 0.5, x, 4.52, z, brassC); }
      for (let x = -10.5; x <= 10.5; x += 3) { B.box(0.24, 0.26, RD, x, RH - 0.13, 0, DARK); B.box(0.1, 0.05, RD, x, RH - 0.285, 0, brassD); }
      for (const z of [-6, -2, 2, 6]) { B.box(RW, 0.2, 0.22, 0, RH - 0.1, z, DARK); B.box(RW, 0.04, 0.1, 0, RH - 0.22, z, brassD); }
      for (const x of [-10.5, -4.5, 1.5, 7.5]) for (const z of [-6, -2, 2, 6]) B.ball(0.07, x, RH - 0.3, z, brassC, 6);      // brass bosses at some beam crossings
      for (const x of [-9, -3, 3, 9]) for (const z of [-4, 4]) {        // skylights: a brass frame and mullions around a bright pane
        for (const [w, d, dx, dz] of [[2.4, 0.08, 0, -1.4], [2.4, 0.08, 0, 1.4], [0.08, 2.88, -1.2, 0], [0.08, 2.88, 1.2, 0], [0.05, 2.8, 0, 0], [2.3, 0.05, 0, 0]]) B.box(w, 0.06, d, x + dx, RH - 0.03, z + dz, brassD);
        const sk = mesh(new THREE.PlaneGeometry(2.3, 2.78), bas('#ffffff', { map: T_SKY() }), x, RH - 0.02, z); sk.rotation.x = Math.PI / 2; S.add(sk);
      }
      // --- the door (west wall): a frame with a pediment, a panelled leaf, hinges and a brass plate
      B.unit = 'door';
      B.box(0.16, 2.4, 0.12, -HX + 0.08, 1.2, -0.62, DARK); B.box(0.16, 2.4, 0.12, -HX + 0.08, 1.2, 0.62, DARK); B.box(0.16, 0.14, 1.36, -HX + 0.08, 2.37, 0, DARK); B.box(0.2, 0.08, 1.6, -HX + 0.1, 2.5, 0, brassD); B.box(0.18, 0.2, 1.3, -HX + 0.09, 2.64, 0, DARK);
      B.box(0.05, 2.28, 1.1, -HX + 0.1, 1.14, 0, '#5a1626'); for (const [y, h] of [[1.75, 0.8], [0.6, 0.9]]) { B.box(0.03, h, 0.76, -HX + 0.13, y, 0, '#46101e'); B.box(0.035, 0.03, 0.8, -HX + 0.135, y + h / 2 + 0.02, 0, '#e8c048'); B.box(0.035, 0.03, 0.8, -HX + 0.135, y - h / 2 - 0.02, 0, '#e8c048'); } B.box(0.03, 0.2, 0.07, -HX + 0.14, 1.1, 0.4, '#e8c048'); B.ball(0.05, -HX + 0.18, 1.1, 0.4, '#e8c048', 8); for (const y of [0.4, 1.9]) B.box(0.04, 0.16, 0.05, -HX + 0.1, y, -0.58, brassD);
      // --- 12 display tables: turned legs, apron with carving, a green leather top, brass rims, little glass cover posts and a plate
      B.unit = 'tables';
      LAYOUT.tables.forEach((t, k) => {
        B.unit = 'table' + k; const hw = t.w / 2, hd = t.d / 2;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const lx = t.x + sx * (hw - 0.11), lz = t.z + sz * (hd - 0.11); B.lathe([[0.001, 0], [0.07, 0.01], [0.05, 0.05], [0.04, 0.3], [0.06, 0.38], [0.04, 0.46], [0.04, 0.74], [0.065, 0.78], [0.065, TOP - 0.06]], lx, 0, lz, WOOD[1], 8); }
        B.box(t.w - 0.2, 0.13, 0.05, t.x, TOP - 0.145, t.z - hd + 0.1, WOOD[1]); B.box(t.w - 0.2, 0.13, 0.05, t.x, TOP - 0.145, t.z + hd - 0.1, WOOD[1]); B.box(0.05, 0.13, t.d - 0.2, t.x - hw + 0.1, TOP - 0.145, t.z, WOOD[1]); B.box(0.05, 0.13, t.d - 0.2, t.x + hw - 0.1, TOP - 0.145, t.z, WOOD[1]);
        for (const dx of [-0.6, 0, 0.6]) { B.box(0.3, 0.07, 0.015, t.x + dx, TOP - 0.15, t.z - hd + 0.12, brassD); B.box(0.3, 0.07, 0.015, t.x + dx, TOP - 0.15, t.z + hd - 0.12, brassD); }
        B.box(t.w, 0.06, t.d, t.x, TOP - 0.03, t.z, '#2a5a46'); B.box(t.w + 0.05, 0.03, 0.04, t.x, TOP + 0.005, t.z - hd, brassC); B.box(t.w + 0.05, 0.03, 0.04, t.x, TOP + 0.005, t.z + hd, brassC); B.box(0.04, 0.03, t.d, t.x - hw, TOP + 0.005, t.z, brassC); B.box(0.04, 0.03, t.d, t.x + hw, TOP + 0.005, t.z, brassC);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.ball(0.035, t.x + sx * (hw - 0.02), TOP + 0.03, t.z + sz * (hd - 0.02), brassC, 6);
        const fz = t.z + (t.z < 0 ? 1 : -1) * (hd - 0.04); for (const s of [-1, 1]) B.box(0.16, 0.012, 0.05, t.x + s * 0.58, TOP + 0.006, fz, brassC);       // a name plate in front of each place
        this.addCol(t.x - hw, t.x + hw, t.z - hd, t.z + hd);
      });
      // --- 4 large tables: a velvet top with a fringe, carved claw feet
      LAYOUT.large.forEach((t, k) => {
        B.unit = 'large' + k; const hw = t.w / 2, hd = t.d / 2;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const lx = t.x + sx * (hw - 0.14), lz = t.z + sz * (hd - 0.14); B.lathe([[0.001, 0], [0.11, 0.01], [0.09, 0.07], [0.06, 0.14], [0.05, 0.3], [0.09, 0.36], [0.05, 0.44], [0.06, 0.8], [0.1, 0.83], [0.1, TOP - 0.08]], lx, 0, lz, DARK, 8); B.box(0.2, 0.05, 0.2, lx, 0.025, lz, '#241408'); }
        B.box(t.w - 0.3, 0.14, t.d - 0.3, t.x, TOP - 0.16, t.z, DARK); B.box(t.w, 0.08, t.d, t.x, TOP - 0.04, t.z, '#6a1c1c');
        for (let i = 0; i < 18; i++) { const fx = t.x - hw + 0.06 + i * ((t.w - 0.12) / 17); B.box(0.03, 0.12, 0.02, fx, TOP - 0.14, t.z - hd - 0.005, brassC); B.box(0.03, 0.12, 0.02, fx, TOP - 0.14, t.z + hd + 0.005, brassC); }
        B.box(t.w + 0.06, 0.03, 0.04, t.x, TOP + 0.015, t.z - hd, brassC); B.box(t.w + 0.06, 0.03, 0.04, t.x, TOP + 0.015, t.z + hd, brassC); B.box(0.04, 0.03, t.d, t.x - hw, TOP + 0.015, t.z, brassC); B.box(0.04, 0.03, t.d, t.x + hw, TOP + 0.015, t.z, brassC);
        B.box(0.3, 0.012, 0.06, t.x, TOP + 0.006, t.z + hd - 0.08, brassC);
        this.addCol(t.x - hw, t.x + hw, t.z - hd, t.z + hd);
      });
      // --- 6 racks: plinth, turned posts, a panelled back, a carved cornice with a name plate, shelves with a brass lip
      LAYOUT.racks.forEach((k, ki) => {
        B.unit = 'rack' + ki; const hw = k.w / 2, back = k.z - k.f * 0.22, sh = [0.38, 1.28, 2.18], fz = k.z + k.f * (k.d / 2);
        B.box(k.w + 0.06, 0.16, k.d + 0.04, k.x, 0.08, k.z, '#2a1a0e'); B.box(k.w + 0.02, 0.04, k.d, k.x, 0.18, k.z, brassD);
        for (const sx of [-1, 1]) { B.box(0.09, k.h - 0.2, 0.1, k.x + sx * (hw - 0.045), 0.2 + (k.h - 0.2) / 2, k.z + k.f * (k.d / 2 - 0.05), DARK); B.box(0.12, 0.05, 0.13, k.x + sx * (hw - 0.045), 0.2, k.z + k.f * (k.d / 2 - 0.05), brassD); B.box(0.12, 0.05, 0.13, k.x + sx * (hw - 0.045), k.h - 0.1, k.z + k.f * (k.d / 2 - 0.05), brassD); B.box(0.06, k.h - 0.2, k.d, k.x + sx * (hw - 0.03), 0.2 + (k.h - 0.2) / 2, k.z, DARK); }
        B.box(k.w - 0.1, k.h - 0.26, 0.04, k.x, 0.16 + (k.h - 0.26) / 2, back - k.f * 0.02, '#6a5238');       // the back: three panels with thin mouldings
        for (let j = 0; j < 3; j++) { const py = 0.2 + 0.45 + j * 0.9; B.box(k.w - 0.4, 0.74, 0.012, k.x, py + 0.0, back + k.f * 0.004, '#7a6044'); for (const sx of [-1, 1]) B.box(0.03, 0.74, 0.016, k.x + sx * (k.w / 2 - 0.2), py, back + k.f * 0.004, DARK); }
        B.box(k.w + 0.1, 0.1, k.d + 0.06, k.x, k.h - 0.05, k.z, DARK); B.box(k.w + 0.14, 0.05, k.d + 0.1, k.x, k.h + 0.025, k.z, brassD); B.box(k.w - 0.5, 0.2, 0.05, k.x, k.h - 0.22, k.z + k.f * (k.d / 2 + 0.01), '#2a1a0e'); B.box(k.w - 0.56, 0.14, 0.02, k.x, k.h - 0.22, k.z + k.f * (k.d / 2 + 0.04), brassC);
        for (const sy of sh) { B.box(k.w - 0.18, 0.04, k.d - 0.04, k.x, sy - 0.02, k.z, WOOD[0]); B.box(k.w - 0.18, 0.06, 0.02, k.x, sy + 0.03, k.z + k.f * (k.d / 2 - 0.03), brassC); }
        this.addCol(k.x - hw, k.x + hw, k.z - k.d / 2, k.z + k.d / 2);
      });
      // --- low display cabinets under the wall frames: plinth, three drawers with pulls, a glass-topped case with specimens inside
      const qb = [], qspecies = SPECIES.filter(s => !s.mystery && s.biome !== 'ocean').filter((s, i) => i % 9 === 0).slice(0, 7); qspecies.forEach(sp => { const tx = new THREE.CanvasTexture(Art.specimen(sp)); tx.magFilter = tx.minFilter = THREE.NearestFilter; qb.push(new QuadBatch(tx)); });
      LAYOUT.lowcases.forEach((lc, k) => {
        B.unit = 'lowcase' + k; const g = lc.ry ? -1 : 1, fz = lc.z + g * (lc.d / 2);
        B.box(lc.w - 0.1, 0.1, lc.d - 0.06, lc.x, 0.05, lc.z - g * 0.02, '#241408'); B.box(lc.w, 0.7, lc.d, lc.x, 0.45, lc.z, WOOD[2]); B.box(lc.w + 0.06, 0.05, lc.d + 0.06, lc.x, 0.825, lc.z, DARK);
        for (const dx of [-0.8, 0, 0.8]) { B.box(0.7, 0.5, 0.025, lc.x + dx, 0.45, fz + g * 0.005, '#2a1a0e'); B.box(0.6, 0.4, 0.012, lc.x + dx, 0.45, fz + g * 0.017, '#7a5030'); B.box(0.16, 0.03, 0.03, lc.x + dx, 0.5, fz + g * 0.04, brassC); B.box(0.08, 0.05, 0.015, lc.x + dx, 0.38, fz + g * 0.03, brassD); }
        B.box(lc.w - 0.1, 0.1, lc.d - 0.1, lc.x, 0.9, lc.z, '#1e4a38');                                  // the case: green felt floor, four corner posts, a rim, a glass lid
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(0.045, 0.2, 0.045, lc.x + sx * (lc.w / 2 - 0.05), 1.0, lc.z + sz * (lc.d / 2 - 0.05), DARK);
        B.box(lc.w - 0.04, 0.03, 0.04, lc.x, 1.115, lc.z - lc.d / 2 + 0.05, brassC); B.box(lc.w - 0.04, 0.03, 0.04, lc.x, 1.115, lc.z + lc.d / 2 - 0.05, brassC); B.box(0.04, 0.03, lc.d - 0.04, lc.x - lc.w / 2 + 0.05, 1.115, lc.z, brassC); B.box(0.04, 0.03, lc.d - 0.04, lc.x + lc.w / 2 - 0.05, 1.115, lc.z, brassC);
        const gl = mesh(new THREE.PlaneGeometry(lc.w - 0.12, lc.d - 0.12), bas('#cfe8ff', { transparent: true, opacity: 0.12, depthWrite: false }), lc.x, 1.1, lc.z); gl.rotation.x = -Math.PI / 2; S.add(gl);
        const nq = 3; for (let i = 0; i < nq; i++) pick(qb).quad(lc.x + (i - 1) * (lc.w / 3.1), 0.952, lc.z + R.range(-0.04, 0.04), 0.46, 0.23, R.range(-0.3, 0.3));
        for (let i = 0; i < 4; i++) { const col = pick(['#a8d0d8', '#c04a2a', '#2a6a4a', '#e0d4a0', '#8a5a9a']); B.cyl(0.05, 0.05, 0.14, lc.x + (i - 1.5) * 0.42 + R.range(-0.04, 0.04), 1.185, lc.z, col, 8); }
        this.addCol(lc.x - lc.w / 2, lc.x + lc.w / 2, lc.z - lc.d / 2, lc.z + lc.d / 2);
      });
      // --- tall bookcases (east and west): a cornice, glass-less shelves with books, jars and little boxes, a globe on top
      LAYOUT.cases.forEach((bc, k) => {
        B.unit = 'case' + k; const wx = bc.x, wz = bc.z, wd = bc.w, dd = bc.d, n = 6, sg = Math.sign(bc.x) || 1, pal = ['#7a2a24', '#2a4a6a', '#3e6a3a', '#8a6a2a', '#5a2a5a', '#2a5a5a', '#9a4a2a', '#4a3a2a', '#c8b88a'];
        B.box(0.04, bc.h - 0.14, wd, wx + sg * (dd / 2 - 0.02), 0.14 + (bc.h - 0.14) / 2, wz, '#1e1208');
        B.box(dd + 0.08, 0.14, wd + 0.1, wx - sg * 0.04, 0.07, wz, '#2a1a0e'); B.box(dd + 0.1, 0.1, wd + 0.14, wx - sg * 0.05, bc.h + 0.05, wz, DARK); B.box(dd + 0.14, 0.04, wd + 0.18, wx - sg * 0.07, bc.h + 0.12, wz, brassD);
        for (const sz of [-1, 1]) B.box(dd - 0.02, bc.h - 0.2, 0.06, wx, 0.1 + (bc.h - 0.2) / 2, wz + sz * (wd / 2 - 0.03), '#4a2c18');
        const fx = wx - sg * (dd / 2 - 0.02);
        for (let i = 0; i <= n; i++) { const y = 0.16 + i * ((bc.h - 0.3) / n); B.box(dd - 0.06, 0.04, wd - 0.08, wx - sg * 0.02, y, wz, WOOD[0]); if (i < n) B.box(0.02, 0.05, wd - 0.1, fx - sg * 0.0, y + 0.03, wz, brassD); if (i === n) break;
          let z = wz - wd / 2 + 0.1; const end = wz + wd / 2 - 0.08, hh = (bc.h - 0.3) / n; while (z < end - 0.05) { if (R.next() < 0.14) { const jr = R.range(0.05, 0.08), jh = R.range(0.14, 0.26); B.cyl(jr, jr, jh, wx - sg * 0.07, y + 0.02 + jh / 2, z + jr, pick(['#a8d0d8', '#c8b88a', '#c04a2a', '#2a6a4a']), 8); z += jr * 2 + 0.03; continue; }
            if (R.next() < 0.07) { const bw = R.range(0.14, 0.22), bh = R.range(0.1, 0.16); if (z + bw < end) { B.box(dd - 0.2, bh, bw, wx - sg * 0.06, y + 0.02 + bh / 2, z + bw / 2, pick(['#3a2210', '#a47c48', '#14141a'])); z += bw + 0.02; continue; } }
            const bw = R.range(0.035, 0.07), bh = R.range(0.18, hh - 0.12); B.box(dd - 0.2, bh, bw, wx - sg * 0.05, y + 0.02 + bh / 2, z + bw / 2, pick(pal)); z += bw + 0.004; } }
        B.lathe([[0.001, 0], [0.11, 0], [0.11, 0.04], [0.05, 0.08], [0.04, 0.3]], wx - sg * 0.02, bc.h + 0.14, wz, DARK, 8); B.ball(0.2, wx - sg * 0.02, bc.h + 0.14 + 0.5, wz, '#3a78a8', 10);
        this.addCol(wx - dd / 2, wx + dd / 2, wz - wd / 2, wz + wd / 2);
      });
      // --- the antique longcase clock on the north wall: plinth, a waist with a glass door (pendulum and weights inside), a hood with an arched top and a dial; the hands and the pendulum follow the real time
      B.unit = 'clock'; { const cz = -HZ + 0.25, fz = cz + 0.22;
        B.box(0.7, 0.28, 0.46, 0, 0.14, cz, '#2a1a0e'); B.box(0.78, 0.06, 0.5, 0, 0.31, cz, '#4a2c18'); B.box(0.5, 0.04, 0.4, 0, 0.36, cz, brassD);
        B.box(0.5, 1.28, 0.38, 0, 1.0, cz - 0.0, '#5a3820'); B.box(0.36, 0.98, 0.02, 0, 1.02, fz - 0.02, '#1a0e06');       // the door recess (dark) and its frame
        for (const sx of [-1, 1]) B.box(0.035, 1.02, 0.03, sx * 0.19, 1.02, fz + 0.0, brassC); B.box(0.4, 0.035, 0.03, 0, 1.54, fz, brassC); B.box(0.4, 0.035, 0.03, 0, 0.5, fz, brassC); B.ball(0.025, 0.15, 1.02, fz + 0.03, brassC, 6);
        for (const sx of [-1, 1]) { B.cyl(0.04, 0.04, 0.3, sx * 0.1, 0.78, cz - 0.02, brassD, 8); B.cyl(0.045, 0.045, 0.03, sx * 0.1, 0.945, cz - 0.02, brassC, 8); B.limb(V(sx * 0.1, 0.96, cz - 0.02), V(sx * 0.1, 1.58, cz - 0.02), 0.004, 0.004, '#c8c8d0', 4); }       // two weights on chains
        B.box(0.6, 0.09, 0.44, 0, 1.69, cz, '#4a2c18'); B.box(0.66, 0.04, 0.48, 0, 1.745, cz, brassD);
        B.box(0.58, 0.8, 0.42, 0, 2.15, cz, '#5a3820'); for (const sx of [-1, 1]) { B.cyl(0.035, 0.035, 0.76, sx * 0.3, 2.15, fz - 0.01, brassC, 8); B.cyl(0.05, 0.05, 0.04, sx * 0.3, 1.77, fz - 0.01, brassD, 8); B.cyl(0.05, 0.05, 0.04, sx * 0.3, 2.55, fz - 0.01, brassD, 8); }
        B.box(0.66, 0.05, 0.46, 0, 2.575, cz, '#4a2c18'); B.geo(new THREE.CylinderGeometry(0.31, 0.31, 0.42, 16, 1, false, Math.PI / 2, Math.PI), (() => { const m = M4(0, 2.6, cz); m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)); return m; })(), '#5a3820');
        B.box(0.05, 0.08, 0.05, 0, 2.935, cz, brassC); B.ball(0.05, 0, 3.0, cz, brassC, 8); B.cyl(0.006, 0.006, 0.14, 0, 3.12, cz, brassC, 4); for (const sx of [-1, 1]) { B.cyl(0.03, 0.03, 0.04, sx * 0.3, 2.6, cz, brassD, 8); B.ball(0.04, sx * 0.3, 2.66, cz, brassC, 8); }
        B.limb(V(0, 2.1, fz + 0.002), V(0, 2.1, fz + 0.012), 0.2, 0.2, '#efe6c8', 20);            // the dial: an ivory disc with a brass rim
        B.geo(new THREE.TorusGeometry(0.205, 0.012, 6, 24), M4(0, 2.1, fz + 0.012), brassC);
        const dial = mesh(new THREE.CircleGeometry(0.2, 28), bas('#ffffff', { map: T_DIAL() }), 0, 2.1, fz + 0.0135); S.add(dial);
        const hand = (len, w, col) => { const g = new THREE.BoxGeometry(w, len, 0.004); g.translate(0, len / 2 - 0.02, 0); const m = new THREE.Mesh(g, bas(col)); const hg = new THREE.Group(); hg.add(m); hg.position.set(0, 2.1, fz + 0.016); S.add(hg); return hg; };
        const hh = hand(0.11, 0.018, '#14100c'), mh = hand(0.17, 0.012, '#14100c'), sh2 = hand(0.18, 0.005, '#8a1c1c'); this.clockHands = { h: hh, m: mh, s: sh2 };
        const pg = new THREE.Group(); pg.position.set(0, 1.5, fz - 0.03); const rod = mesh(new THREE.BoxGeometry(0.012, 0.8, 0.008), bas('#c8a040'), 0, -0.4, 0); const bob = mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.012, 16), bas('#d8b050'), 0, -0.8, 0); bob.rotation.x = Math.PI / 2; pg.add(rod, bob); S.add(pg); this.pendulum = pg;
        const gl = mesh(new THREE.PlaneGeometry(0.34, 0.94), bas('#cfe8ff', { transparent: true, opacity: 0.1, depthWrite: false }), 0, 1.02, fz + 0.012); S.add(gl);
        this.addCol(-0.42, 0.42, -HZ, -HZ + 0.56); this.clockPos = { x: 0, z: -HZ + 1.5 }; }
      // --- plants: potted palms / ficus in the corners, ferns on pedestals between the bookcases, dracaenas by the door
      const bl = (len, wid, bend, x, y, z, az, tilt, col, segs) => { const d = len * (0.88 * Math.sin(tilt) + bend * Math.cos(tilt)) + wid / 2 + 0.05; if (Math.abs(x + Math.sin(az) * d) < HX - 0.04 && Math.abs(z + Math.cos(az) * d) < HZ - 0.04) B.blade(len, wid, bend, x, y, z, az, tilt, col, segs); };      // a leaf that would poke through a wall is left out
      let pk = 0; const plant = (kind, x, z, y0 = 0, sc = 1) => {
        B.unit = 'plant' + (pk++); const gl = pick(['#1f5a4a', '#2a4a6a', '#6a3a22']), pot = [[0.001, 0], [0.12 * sc, 0], [0.14 * sc, 0.015], [0.2 * sc, 0.3 * sc], [0.22 * sc, 0.32 * sc], [0.2 * sc, 0.34 * sc], [0.17 * sc, 0.34 * sc], [0.17 * sc, 0.3 * sc], [0.001, 0.3 * sc]];
        B.cyl(0.19 * sc, 0.2 * sc, 0.03, x, y0 + 0.015, z, '#3a2a1a', 14); B.lathe(pot, x, y0 + 0.03, z, gl, 14); B.cyl(0.04 * sc, 0.04 * sc, 0.004, x, y0 + 0.03 + 0.3 * sc, z, '#2a1c12', 12); B.cyl(0.215 * sc, 0.215 * sc, 0.02, x, y0 + 0.03 + 0.25 * sc, z, brassC, 14);
        B.cyl(0.165 * sc, 0.165 * sc, 0.01, x, y0 + 0.03 + 0.31 * sc, z, '#2a1c12', 14);
        const top = y0 + 0.03 + 0.31 * sc, greens = ['#2a6a34', '#337a3c', '#245a30', '#3a8644', '#2e7438'];
        if (kind === 'palm') { for (let t = 0; t < 3; t++) { const a = t * 2.1 + 0.4, lean = 0.12 + t * 0.05, hh = (1.15 + t * 0.2) * sc, tip = V(x + Math.sin(a) * lean * 2, top + hh, z + Math.cos(a) * lean * 2);
              B.limb(V(x + Math.sin(a) * 0.03, top, z + Math.cos(a) * 0.03), V((tip.x + x) / 2 + Math.sin(a) * 0.05, top + hh * 0.5, (tip.z + z) / 2 + Math.cos(a) * 0.05), 0.026 * sc, 0.02 * sc, '#6a5030', 6); B.limb(V((tip.x + x) / 2 + Math.sin(a) * 0.05, top + hh * 0.5, (tip.z + z) / 2 + Math.cos(a) * 0.05), tip, 0.02 * sc, 0.013 * sc, '#6a5030', 6);
              for (let f = 0; f < 7; f++) { const az = f * 0.9 + t, tl = 0.55 + (f % 3) * 0.28; bl((0.9 + (f % 2) * 0.3) * sc, 0.2 * sc, 0.55, tip.x, tip.y - 0.01, tip.z, az, tl, pick(greens), 7); } B.ball(0.03 * sc, tip.x, tip.y, tip.z, '#3a2a1a', 5); } }
        else if (kind === 'ficus') { const tip = V(x + 0.04, top + 1.15 * sc, z);
          B.limb(V(x, top, z), V(x + 0.03, top + 0.6 * sc, z + 0.02), 0.03 * sc, 0.024 * sc, '#5a4028', 6); B.limb(V(x + 0.03, top + 0.6 * sc, z + 0.02), tip, 0.024 * sc, 0.014 * sc, '#5a4028', 6);
          for (let k = 0; k < 15; k++) { const t = k / 14, az = k * 2.39996, h = (0.4 + t * 0.78) * sc, bx = x + 0.03 * Math.min(1, t * 2), bz = z + 0.02 * Math.min(1, t * 2), reach = (0.07 + (1 - Math.abs(t - 0.45)) * 0.1) * sc, lx = bx + Math.sin(az) * reach, lz = bz + Math.cos(az) * reach;
            B.limb(V(bx, top + h - 0.01, bz), V(lx, top + h + 0.02, lz), 0.006, 0.005, '#4a6a30', 4); bl(0.3 * sc * (1 - t * 0.25), 0.19 * sc * (1 - t * 0.25), 0.35, lx, top + h + 0.02, lz, az, 1.15 + (1 - t) * 0.2, pick(greens), 5); } bl(0.2 * sc, 0.13 * sc, 0.1, tip.x, tip.y, tip.z, 0.4, 0.15, greens[0], 5); }
        else if (kind === 'fern') { for (let k = 0; k < 22; k++) { const az = k * 2.39996, tl = 0.55 + (k % 4) * 0.2, r0 = 0.05 + (k % 3) * 0.02; bl((0.55 + (k % 5) * 0.09) * sc, 0.1 * sc, 0.7, x + Math.sin(az) * r0, top, z + Math.cos(az) * r0, az, tl, pick(greens), 6); } }
        else { for (let ring = 0; ring < 2; ring++) for (let k = 0; k < 8; k++) { const az = (k + ring * 0.5) / 8 * Math.PI * 2; bl(1.0 * sc * (ring ? 0.8 : 1), 0.075 * sc, 0.5, x + Math.sin(az) * 0.03, top, z + Math.cos(az) * 0.03, az, ring ? 0.95 : 0.4, pick(greens), 6); } B.limb(V(x, top, z), V(x, top + 0.4 * sc, z), 0.024 * sc, 0.02 * sc, '#6a5030', 6); }
        this.addCol(x - 0.3 * sc, x + 0.3 * sc, z - 0.3 * sc, z + 0.3 * sc);
      };
      plant('palm', -11.1, -6.9, 0, 1.25); plant('ficus', 11.1, -6.9, 0, 1.2); plant('ficus', -11.1, 6.9, 0, 1.2); plant('palm', 11.1, 6.9, 0, 1.25);
      for (const [x, z] of [[11.35, -2.05], [11.35, 2.05], [-11.35, -3.1], [-11.35, 3.1]]) { B.unit = 'pedestal' + pk; B.box(0.42, 0.1, 0.42, x, 0.05, z, '#2a1a0e'); B.box(0.3, 0.32, 0.3, x, 0.26, z, '#d8c8a0'); B.box(0.4, 0.06, 0.4, x, 0.45, z, brassC); plant('fern', x, z, 0.48, 0.9); }
      plant('dracaena', -11.3, -1.15, 0, 1.2); plant('dracaena', -11.3, 1.15, 0, 1.2);
      // --- pendant lamps: a rose, a brass rod, a cap, an opal glass dome with a brass rim, a glowing bulb
      this.lamps.forEach(([x, z], i) => {
        B.unit = 'lamp' + i; B.cyl(0.2, 0.2, 0.05, x, RH - 0.025, z, brassD, 12); B.cyl(0.07, 0.07, 0.06, x, RH - 0.08, z, brassC, 10); B.cyl(0.015, 0.015, 0.95, x, RH - 0.575, z, brassC, 6); B.ball(0.05, x, RH - 1.05, z, brassC, 8); B.cyl(0.05, 0.05, 0.22, x, RH - 1.2, z, brassC, 8);
        B.lathe([[0.04, 0], [0.12, -0.03], [0.26, -0.12], [0.34, -0.26], [0.35, -0.3], [0.33, -0.3], [0.25, -0.24], [0.1, -0.12], [0.03, -0.04]], x, RH - 1.12, z, ['#c8e0d0', '#e8f0e0'], 16); B.cyl(0.36, 0.36, 0.03, x, RH - 1.12 - 0.3, z, brassC, 16);
        glow.push(emit(0.1, x, RH - 1.12 - 0.22, z));
      });
      // --- 3 chandeliers: a rosette, three chains, a brass ring with six arms with candle bulbs, a pendant at the bottom
      [-6, 0, 6].forEach((x, i) => {
        B.unit = 'chandelier' + i; const z = 0, ry = RH - 1.35;
        B.cyl(0.22, 0.22, 0.05, x, RH - 0.025, z, brassD, 12);
        for (let a = 0; a < 3; a++) { const an = a * 2.094 + 0.3; B.limb(V(x, RH - 0.05, z), V(x + Math.sin(an) * 0.62, ry + 0.02, z + Math.cos(an) * 0.62), 0.012, 0.012, brassC, 5); }
        B.geo(new THREE.TorusGeometry(0.62, 0.03, 6, 20), (() => { const m = M4(x, ry, z); m.multiply(new THREE.Matrix4().makeRotationX(Math.PI / 2)); return m; })(), brassC);
        for (let a = 0; a < 6; a++) { const an = a * Math.PI / 3, px = x + Math.sin(an) * 0.62, pz = z + Math.cos(an) * 0.62; B.cyl(0.035, 0.035, 0.1, px, ry + 0.07, pz, '#f0e8d0', 8); B.cyl(0.05, 0.03, 0.03, px, ry + 0.015, pz, brassC, 8); glow.push(emit(0.04, px, ry + 0.16, pz, '#ffe08a')); }
        for (let a = 0; a < 3; a++) { const an = a * 2.094 + 1.0; B.limb(V(x + Math.sin(an) * 0.62, ry, z + Math.cos(an) * 0.62), V(x, ry, z), 0.014, 0.014, brassC, 5); }
        B.lathe([[0.001, 0], [0.09, 0.06], [0.06, 0.16], [0.03, 0.3]], x, ry - 0.3, z, brassC, 10); B.cyl(0.02, 0.02, 0.05, x, ry - 0.0 - 0.0, z, brassC, 6);
      });
      // --- wall sconces between the frames on the long walls and a picture light above every wall frame
      for (const sgz of [-1, 1]) for (const x of [-9, -3, 3, 9]) { B.unit = 'sconce'; const z = sgz * (HZ - 0.12); B.box(0.16, 0.3, 0.04, x, 2.3, sgz * (HZ - 0.02), brassD); B.limb(V(x, 2.3, sgz * (HZ - 0.04)), V(x, 2.3, z), 0.015, 0.015, brassC, 5); B.lathe([[0.03, 0], [0.09, 0.06], [0.11, 0.2], [0.06, 0.26]], x, 2.32, z, ['#e8f0e0', '#f8f4d8'], 10); glow.push(emit(0.05, x, 2.44, z, '#ffe8a0')); }
      for (const s of LAYOUT.slots.mw) { B.unit = 'plight'; const ox = Math.sin(s.ry), oz = Math.cos(s.ry), wx = s.x - ox * 0.0, wz = s.z; B.box(0.3, 0.04, 0.03, s.x + ox * 0.02, 3.1, s.z + oz * 0.02, brassC, s.ry); B.box(0.2, 0.05, 0.04, s.x + ox * 0.17, 3.13, s.z + oz * 0.17, brassD, s.ry); B.limb(V(s.x + ox * 0.02, 3.1, s.z + oz * 0.02), V(s.x + ox * 0.17, 3.1, s.z + oz * 0.17), 0.012, 0.012, brassC, 4); }
      // --- brass plates under the wall frames, benches with cushions, a visitors' stand with a book, display pedestals with glass domes
      for (const s of LAYOUT.slots.mw) { B.unit = 'plate'; B.box(0.22, 0.07, 0.012, s.x + Math.sin(s.ry) * 0.006, 1.5, s.z + Math.cos(s.ry) * 0.006, brassC, s.ry); }
      [[-5, 1], [5, -1]].forEach(([x, dir], i) => {        // benches in the gaps between the large tables, their long side along z; the back is on the far side from the tables
        B.unit = 'bench' + i; const z = 0, bk = -0.21 * dir, w = (a, e) => [x + e, z - a];       // (a: along the bench, e: across) -> world, for a bench turned by 90 degrees
        B.box(1.4, 0.07, 0.46, x, 0.43, z, WOOD[2], Math.PI / 2); B.box(1.3, 0.07, 0.4, x, 0.5, z, '#6a1c1c', Math.PI / 2);
        for (const sa of [-1, 1]) for (const se of [-1, 1]) { const q = w(sa * 0.6, se * 0.17); B.cyl(0.035, 0.03, 0.4, q[0], 0.2, q[1], DARK, 6); }
        B.box(1.4, 0.05, 0.05, x, 0.34, z, DARK, Math.PI / 2); B.box(1.4, 0.3, 0.04, x + bk, 0.7, z, WOOD[2], Math.PI / 2); B.box(1.28, 0.2, 0.025, x + bk * 0.86, 0.7, z, '#6a1c1c', Math.PI / 2);
        this.addCol(x - 0.28, x + 0.28, z - 0.72, z + 0.72);
      });
      for (const [x, z, i] of [[-9.6, -1.6, 0], [-9.6, 1.6, 1], [9.6, -1.6, 2], [9.6, 1.6, 3]]) {
        B.unit = 'dome' + i; B.box(0.6, 0.1, 0.6, x, 0.05, z, '#2a1a0e'); B.box(0.5, 1.05, 0.5, x, 0.625, z, '#d8c8a0'); B.box(0.58, 0.07, 0.58, x, 1.185, z, brassC); B.cyl(0.2, 0.2, 0.012, x, 1.22, z, '#6a1c1c', 14);
        const sp = SPECIES_BY_ID.ornithoptera_alexandrae || SPECIES[i]; const qd = new QuadBatch(new THREE.CanvasTexture(Art.specimen(sp))); qd.tex.magFilter = qd.tex.minFilter = THREE.NearestFilter; qd.quad(x, 1.23, z, 0.34, 0.17, i * 0.8); S.add(qd.build());
        const dome = mesh(new THREE.SphereGeometry(0.28, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), bas('#cfe8ff', { transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide }), x, 1.22, z); S.add(dome);
        B.cyl(0.285, 0.285, 0.02, x, 1.225, z, brassC, 14); B.ball(0.03, x, 1.5, z, brassC, 6); this.addCol(x - 0.34, x + 0.34, z - 0.34, z + 0.34);
      }
      const furniture = B.build(); S.add(furniture); this.furniture = furniture; qb.forEach(q => { if (q.P.length) S.add(q.build()); }); this.glow = glow;
      // --- signs: the name of the hall on the north wall, the way back over the door
      const sg = mesh(new THREE.PlaneGeometry(2.4, 0.4), bas('#ffffff', { map: signTex('МУЗЕЙ КОЛЛЕКЦИИ', 220, 24, '#2a1a0e', '#f0d890') }), 0, 3.85, -HZ + 0.025); sg.userData.sign = true; S.add(sg);
      const sd = mesh(new THREE.PlaneGeometry(1.1, 0.22), bas('#ffffff', { map: signTex('← в кабинет', 130, 22, '#4a1020', '#f4d878', '#e0b848') }), -HX + 0.03, 2.88, 0); sd.rotation.y = Math.PI / 2; sd.userData.sign = true; S.add(sd);
      // --- stations: leave, and the zones where boxes are placed (the nearest one decides which tab opens)
      this.stations = [{ id: 'exit', x: -HX + 0.7, z: 0, r: 1.3, label: () => 'E — выйти в кабинет' }, { id: 'clock', x: 0, z: -HZ + 1.5, r: 1.7, label: () => { const d = new Date(); return `E — старинные часы: ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')} (послушать бой)`; } }];
      const zone = (tab, x, z, r, name) => this.stations.push({ id: 'place', tab, x, z, r, label: () => `E — расставить коробки: ${name} (на экспозиции: ${Save.data.boxes.filter(b => b.loc && b.loc.t === tab).length} из ${MUS[tab]})` });
      LAYOUT.tables.forEach(t => zone('mt', t.x, t.z + (t.z < 0 ? 1.1 : -1.1), 2.0, 'столы-витрины'));
      LAYOUT.large.forEach(t => zone('ml', t.x, t.z + 1.4, 1.9, 'большие столы'));
      LAYOUT.racks.forEach(k => zone('mr', k.x, k.z + k.f * 1.1, 1.9, 'стеллажи'));
      for (const s of LAYOUT.slots.mw) zone('mw', s.x + (s.ry === 0 ? 0 : s.ry === Math.PI ? 0 : s.ry > 0 ? 1.4 : -1.4), s.z + (s.ry === 0 ? 1.4 : s.ry === Math.PI ? -1.4 : 0), 1.7, 'стены');
    }

    // rebuild everything that depends on the saved boxes: frames on tables, racks and walls; outlines of the free places
    refresh() {
      const D = this.dynamic; while (D.children.length) { const o = D.children.pop(); o.traverse(n => { if (n.geometry) n.geometry.dispose(); }); }
      const fm = Boxes.STYLES.map(s => lam(s.fr[1]));
      const frame = (box, mode) => {                      // a group in a local frame: the support (wall / back panel / table top) at z = 0 / y = 0, the face towards +z (mode 'flat': face up)
        const { w, h } = Boxes.pxSize(box.size), W = w / PPM, H = h / PPM, tx = texFor(box), g = new THREE.Group(), fr = fm[box.style];
        if (mode === 'flat') { const m = mesh(new THREE.BoxGeometry(W, 0.05, H), [fr, fr, new THREE.MeshLambertMaterial({ map: tx }), fr, fr, fr], 0, 0.025 + 0.002, 0); g.add(m); }
        else { const m = mesh(new THREE.BoxGeometry(W, H, 0.07), [fr, fr, fr, fr, new THREE.MeshLambertMaterial({ map: tx }), fr], 0, mode === 'up' ? H / 2 + 0.004 : 0, 0.037); g.add(m);
          if (mode === 'wall') { const cy = 0, ny = H / 2 + 0.1, top = H / 2; g.add(mesh(new THREE.BoxGeometry(0.026, 0.026, 0.02), lam(BRASS), 0, ny, 0.012));
            for (const sx of [-1, 1]) { const ax = sx * W * 0.28, dx = -ax, dy = ny - top, L = Math.hypot(dx, dy), str = mesh(new THREE.BoxGeometry(0.006, L, 0.006), lam('#14100c'), ax + dx / 2, top + dy / 2, 0.034); str.rotation.z = Math.atan2(dx, dy) * -1; g.add(str); } } }
        g.userData = { W, H }; return g;
      };
      const put = (g, x, y, z, ry) => { g.position.set(x, y, z); g.rotation.y = ry; D.add(g); };
      for (const t of ['mt', 'ml', 'mr', 'mw']) LAYOUT.slots[t].forEach((s, i) => {
        const occ = Boxes.boxesAt(t, i)[0];
        if (occ) { const g = frame(occ, t === 'mr' ? 'up' : t === 'mw' ? 'wall' : 'flat'); put(g, s.x, t === 'mw' ? s.y : t === 'mr' ? s.y : s.y, s.z, s.ry); return; }
        // an empty place: a faint dashed outline
        if (t === 'mw') { const cls = MWCLS(i), sz = Boxes.pxSize(cls), q = mesh(new THREE.PlaneGeometry(sz.w / PPM, sz.h / PPM), bas('#ffffff', { map: outline(cls, '', cls), transparent: true, depthWrite: false }), 0, 0, 0.012); const g = new THREE.Group(); g.add(q); put(g, s.x, s.y, s.z, s.ry);
          const nail = mesh(new THREE.BoxGeometry(0.03, 0.03, 0.02), lam(BRASS), 0, sz.h / PPM / 2 - 0.05, 0.012); g.add(nail); }
        else if (t === 'mr') { const sz = Boxes.pxSize('M'), g = new THREE.Group(), q = mesh(new THREE.PlaneGeometry(sz.w / PPM * 0.9, sz.h / PPM * 0.9), bas('#ffffff', { map: outline('M', '', ''), transparent: true, depthWrite: false }), 0, sz.h / PPM * 0.45 + 0.01, 0.012); g.add(q); put(g, s.x, s.y, s.z, s.ry); }
        else { const sz = Boxes.pxSize(t === 'ml' ? 'L' : 'M'), q = mesh(new THREE.PlaneGeometry(sz.w / PPM, sz.h / PPM), bas('#ffffff', { map: outline(t === 'ml' ? 'L' : 'M', '', ''), transparent: true, depthWrite: false }), 0, 0.012, 0); q.rotation.x = -Math.PI / 2; const g = new THREE.Group(); g.add(q); put(g, s.x, s.y, s.z, s.ry); }
      });
    }

    // ------------------------------------------------------------ per-frame
    nearest() {
      const P = this.player; let best = null, bs = 9; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      for (const s of this.stations) { const dx = s.x - P.pos.x, dz = s.z - P.pos.z, d = Math.hypot(dx, dz); if (d > s.r) continue; const dot = d > 0.9 ? (dx * fx + dz * fz) / d : 1; if (dot < -0.1) continue; const sc = d / s.r; if (sc < bs) { bs = sc; best = s; } }
      return best;
    }
    update(dt, inp) {
      this.t += dt; const P = this.player;
      P.yaw -= inp.dx * 0.0022; P.pitch = clamp(P.pitch - inp.dy * 0.0022, -1.3, 1.3); inp.dx = inp.dy = 0;
      P.yaw += ((inp.keys.has('ArrowLeft') ? 1 : 0) - (inp.keys.has('ArrowRight') ? 1 : 0)) * dt * 1.9; P.pitch = clamp(P.pitch + ((inp.keys.has('ArrowUp') ? 1 : 0) - (inp.keys.has('ArrowDown') ? 1 : 0)) * dt * 1.4, -1.3, 1.3);
      let mx = 0, mz = 0; if (inp.keys.has('KeyW')) mz -= 1; if (inp.keys.has('KeyS')) mz += 1; if (inp.keys.has('KeyA')) mx -= 1; if (inp.keys.has('KeyD')) mx += 1;
      const len = Math.hypot(mx, mz); if (len > 0) { mx /= len; mz /= len; }
      const spd = inp.keys.has('ShiftLeft') ? 4.6 : 2.6; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
      P.vel.x = damp(P.vel.x, (fx * -mz + rx * mx) * spd, 12, dt); P.vel.y = damp(P.vel.y, (fz * -mz + rz * mx) * spd, 12, dt);
      let nx = P.pos.x + P.vel.x * dt, nz = P.pos.z + P.vel.y * dt; const pr = 0.3;
      for (const k of this.colliders) { if (nx > k.x0 - pr && nx < k.x1 + pr && nz > k.z0 - pr && nz < k.z1 + pr) { const l = nx - (k.x0 - pr), r = (k.x1 + pr) - nx, tp = nz - (k.z0 - pr), bt = (k.z1 + pr) - nz; const m = Math.min(l, r, tp, bt); if (m === l) nx = k.x0 - pr; else if (m === r) nx = k.x1 + pr; else if (m === tp) nz = k.z0 - pr; else nz = k.z1 + pr; } }
      nx = clamp(nx, -HX + 0.35, HX - 0.35); nz = clamp(nz, -HZ + 0.35, HZ - 0.35);
      const moved = Math.hypot(nx - P.pos.x, nz - P.pos.z); P.pos.x = nx; P.pos.z = nz; P.moving = moved > 0.002; P.bob += moved * 2.4; P.stepD += moved;
      if (P.stepD > 0.9) { P.stepD = 0; Snd.sfx.step('wood'); }
      this.camera.position.set(P.pos.x, 1.62 + Math.sin(P.bob) * 0.025, P.pos.z); this.camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
      this.prompt = this.nearest(); this.toastT = Math.max(0, this.toastT - dt);
      this.animate(dt);
    }
    animate(dt) {
      if (this.clockHands) { const d = new Date(), sec = d.getSeconds() + d.getMilliseconds() / 1000, min = d.getMinutes() + sec / 60, hr = d.getHours() % 12 + min / 60, H = this.clockHands;
        H.h.rotation.z = -hr / 12 * 6.2832; H.m.rotation.z = -min / 60 * 6.2832; H.s.rotation.z = -Math.floor(sec) / 60 * 6.2832 - (sec % 1 < 0.15 ? (0.15 - sec % 1) * 0.3 : 0); this.pendulum.rotation.z = 0.2 * Math.sin(Math.PI * sec);
        const whole = Math.floor(sec); if (this.lastSec !== whole) { this.lastSec = whole; const P = this.player, dd = Math.hypot(P.pos.x - this.clockPos.x, P.pos.z + HZ - 0.25); Snd.sfx.clockTick(whole % 2 === 0, clamp(1 - dd / 12)); }
        if (d.getMinutes() === 0 && sec < 1.5 && this.lastChime !== d.getHours()) { this.lastChime = d.getHours(); Snd.sfx.clockChime(d.getHours() % 12 || 12); } else if (d.getMinutes() !== 0) this.lastChime = undefined; }
      if (this.remotes) { this.remotes.update(dt); this.netAcc += dt; if (this.netAcc > 0.1) { this.netAcc = 0; const P = this.player; Net.send('pos', { x: Math.round(P.pos.x * 100) / 100, y: 1.65, z: Math.round(P.pos.z * 100) / 100, yaw: Math.round(P.yaw * 100) / 100, pitch: Math.round(P.pitch * 100) / 100, nz: 0, fl: 0, sw: 0, sp: Math.round(Math.hypot(P.vel.x, P.vel.y) * 10) / 10, st: 0, nt: NetParts.code(Save.curNet()) }); } }
    }
    // ------------------------------------------------------------ overlays / input
    open(name) { this.ov = name; this.hooks.unlock(); }
    close() { this.ov = null; this.refresh(); this.hooks.lock(); }
    interact() {
      const s = this.prompt; if (!s) return;
      if (s.id === 'exit') { Snd.sfx.door(); this.hooks.exitMuseum(); }
      else if (s.id === 'clock') { const n = new Date().getHours() % 12 || 12; Snd.sfx.clockChime(n); this.toast(`Часы бьют: ${n}`, 3); }
      else if (s.id === 'place') { Snd.sfx.page(); Boxes.place.open(s.tab); this.open('place'); }
    }
    key(e) {
      const ov = this.ov;
      if (!ov) { if (e.code === 'KeyE') this.interact(); else if (e.code === 'Tab') { Snd.sfx.page(); this.open('journal'); } else if (e.code === 'KeyP' || e.code === 'Escape') { this.ov = 'pause'; this.hooks.unlock(); } return; }
      if (ov === 'help') { this.closeHelp(); return; }
      if (ov === 'pause') { if (e.code === 'Escape') { this.ov = null; this.hooks.lock(); } return; }
      if (ov === 'journal') { const J = Screens.journal, nb = visibleBiomes().length; if (e.code === 'Escape' && J.escape()) { /* back from the aberrants list */ } else if (e.code === 'Escape' || e.code === 'Tab') { Snd.sfx.page(); this.close(); } else if (e.code === 'ArrowLeft') { J.tab = (J.tab + nb - 1) % nb; J.sel = 0; } else if (e.code === 'ArrowRight') { J.tab = (J.tab + 1) % nb; J.sel = 0; } else if (e.code === 'ArrowUp') J.turn(-1); else if (e.code === 'ArrowDown') J.turn(1); return; }
      if (e.code === 'Escape' || e.code === 'KeyE') { if (ov === 'place') this.close(); }
    }
    click(x, y) {
      const ov = this.ov;
      if (ov === 'journal') { if (Screens.journal.click(x, y) === 'close') { Snd.sfx.page(); this.close(); } }
      else if (ov === 'place') { const r = Boxes.place.click(x, y); if (r === 'close') this.close(); else if (r === 'changed') this.refresh(); }
      else if (ov === 'pause') { const id = Mus.pauseClick(x, y); this.pauseAct(id); }
      else if (ov === 'help') this.closeHelp();
    }
    closeHelp() { if (this.helpBack) { this.ov = 'pause'; } else { this.ov = null; this.hooks.lock(); } this.helpBack = false; }
    wheel(dy) { if (this.ov === 'journal') Screens.journal.turn(dy > 0 ? 1 : -1); else if (this.ov === 'place') Boxes.place.wheel(dy); }
    pauseAct(id) {
      if (!id) return; Snd.sfx.click();
      if (id === 'resume') { this.ov = null; this.hooks.lock(); } else if (id === 'help') { this.ov = 'help'; this.helpBack = true; } else if (id === 'settings') this.hooks.settings(); else if (id === 'stash') this.hooks.stash(); else if (id === 'cab') this.hooks.exitMuseum(); else if (id === 'map') this.hooks.map(); else if (id === 'title') this.hooks.title();
    }
    static pauseButtons() {
      const x = SW / 2 - 90; return [
        { id: 'resume', label: 'Продолжить', x, y: 76, w: 180, h: 20, size: 10 }, { id: 'help', label: 'Управление', x, y: 102, w: 88, h: 16 }, { id: 'stash', label: 'Склад (I)', x: x + 92, y: 102, w: 88, h: 16 },
        { id: 'settings', label: 'Настройки', x, y: 124, w: 180, h: 16 }, { id: 'cab', label: 'В кабинет энтомолога', x, y: 146, w: 180, h: 16 }, { id: 'map', label: 'В экспедицию (карта мира)', x, y: 168, w: 180, h: 16 }, { id: 'title', label: 'Выход в главное меню', x, y: 190, w: 180, h: 16 }];
    }
    static pauseClick(x, y) { const b = Mus.pauseButtons().find(b => UIK.hit(b, x, y)); return b ? b.id : null; }

    // ------------------------------------------------------------ 2D layer
    draw(ctx, t, m, dt) {
      const ov = this.ov;
      if (ov === 'journal') return Screens.journal.draw(ctx, t, m);
      if (ov === 'place') return Boxes.place.draw(ctx, t, m);
      this.hud(ctx, t);
      if (ov === 'pause') { ctx.fillStyle = 'rgba(4,12,10,0.7)'; ctx.fillRect(0, 0, SW, SH); UIK.panel(ctx, SW / 2 - 106, 38, 212, 182, { fill: 'rgba(16,32,28,0.96)', border: c.gold }); T.draw(ctx, 'Пауза', SW / 2, 46, { size: 14, align: 'c', color: c.gold }); T.draw(ctx, 'Музей коллекции', SW / 2, 63, { size: 8, align: 'c', color: c.dim }); Mus.pauseButtons().forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y))); }
      else if (ov === 'help') this.drawHelp(ctx);
    }
    hud(ctx, t) {
      const on = Save.data.boxes.filter(b => b.loc && MUS[b.loc.t]).length, total = MUS.mt + MUS.ml + MUS.mr + MUS.mw;
      UIK.panel(ctx, 6, 6, 186, 32, { fill: 'rgba(16,28,24,0.82)', border: c.line });
      T.draw(ctx, 'Музей коллекции', 12, 10, { size: 8, color: c.gold });
      T.draw(ctx, `на экспозиции: ${on} из ${total} мест`, 12, 21, { size: 8, color: c.text });
      if (this.remotes) T.draw(ctx, 'Онлайн: ' + [Net.name].concat(Object.values(Net.remote).map(r => r.name)).join(', '), 8, 42, { size: 8, color: '#9ae0b0', shadow: '#000' });
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(SW / 2 - 1, SH / 2 - 1, 2, 2);
      if (this.prompt && !this.ov) { const s = this.prompt.label(); const w = T.width(s, 8) + 20; UIK.panel(ctx, SW / 2 - w / 2, SH - 54, w, 18, { fill: 'rgba(16,28,24,0.9)', border: c.gold }); T.draw(ctx, s, SW / 2, SH - 49, { size: 8, align: 'c', color: c.text }); }
      if (this.toastT > 0) T.draw(ctx, this.toastText, SW / 2, 62, { size: 8, align: 'c', color: c.gold, shadow: '#000' });
      T.draw(ctx, 'WASD — ходить · мышь — осмотр · E — расставить коробки · Esc — пауза', 8, SH - 12, { size: 8, color: 'rgba(230,240,220,0.7)', shadow: '#000' });
    }
    drawHelp(ctx) {
      ctx.fillStyle = 'rgba(4,12,10,0.86)'; ctx.fillRect(0, 0, SW, SH); UIK.panel(ctx, 56, 34, 368, 190, { fill: 'rgba(16,32,28,0.97)', border: c.gold });
      T.draw(ctx, 'Музей коллекции', SW / 2, 42, { size: 14, align: 'c', color: c.gold });
      T.para(ctx, 'Большой зал с 12 столами-витринами, 4 большими столами, 6 стеллажами и стенами для рамок: всего 88 мест. Подойдите к столу, стеллажу или стене и нажмите E — откроется окно расстановки: выберите коробку слева и место справа. Коробки видны всем, кто зайдёт в музей.', 70, 66, 340, { size: 8, color: c.text, lh: 11 });
      T.para(ctx, 'Малые и средние коробки — на столы и стеллажи, большие — на большие столы и на стены (на стенах места разного размера: L, M, S).', 70, 126, 340, { size: 8, color: c.dim, lh: 11 });
      [['WASD', 'ходить'], ['Мышь', 'осмотреться'], ['E', 'расставить коробки / выйти'], ['Tab', 'коллекция'], ['Esc', 'пауза']].forEach(([k, d], i) => { T.draw(ctx, k, 80, 158 + i * 11, { size: 8, color: c.gold }); T.draw(ctx, d, 130, 158 + i * 11, { size: 8, color: c.text }); });
      T.draw(ctx, 'нажмите любую клавишу', SW / 2, 214, { size: 8, align: 'c', color: c.gold });
    }
    dispose() { if (this.remotes) { this.remotes.dispose(); Net.hooks.cab = Net.hooks.pjoin = Net.hooks.pleave = null; } Snd.stopAmbient(); this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  }
  Mus.LAYOUT = LAYOUT; Mus.RW = RW; Mus.RD = RD; Mus.RH = RH;
  return Mus;
})();
