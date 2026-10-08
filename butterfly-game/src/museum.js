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

  // a static batch of coloured boxes: one mesh for all the furniture; the boxes are remembered (userData.items) so a test can check what stands on what
  class Batch {
    constructor() { this.P = []; this.N = []; this.C = []; this.items = []; }
    box(w, h, d, x, y, z, col, ry = 0) {
      const cc = new THREE.Color(col), co = Math.cos(ry), si = Math.sin(ry), hw = w / 2, hh = h / 2, hd = d / 2; this.items.push([x, y, z, w, h, d, ry]);
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
    build() {
      const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3));
      const m = new THREE.Mesh(g, new THREE.MeshLambertMaterial({ vertexColors: true })); m.userData.items = this.items; m.frustumCulled = false; return m;
    }
  }
  Batch.FACES = [[[1, 0, 0], [[1, -1, -1], [1, 1, -1], [1, 1, 1], [1, -1, 1]]], [[-1, 0, 0], [[-1, -1, 1], [-1, 1, 1], [-1, 1, -1], [-1, -1, -1]]], [[0, 1, 0], [[-1, 1, -1], [-1, 1, 1], [1, 1, 1], [1, 1, -1]]],
    [[0, -1, 0], [[-1, -1, 1], [-1, -1, -1], [1, -1, -1], [1, -1, 1]]], [[0, 0, 1], [[1, -1, 1], [1, 1, 1], [-1, 1, 1], [-1, -1, 1]]], [[0, 0, -1], [[-1, -1, -1], [-1, 1, -1], [1, 1, -1], [1, -1, -1]]]];

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
    for (let i = 0; i < 8; i++) { L.lowcases.push({ x: -10.5 + 3 * i, z: -HZ + 0.3, w: 2.5, d: 0.5, ry: 0 }); L.lowcases.push({ x: -10.5 + 3 * i, z: HZ - 0.3, w: 2.5, d: 0.5, ry: Math.PI }); }
    for (const [z, w] of [[-4.1, 1.7], [0, 1.7], [4.1, 1.7]]) L.cases.push({ x: HX - 0.25, z, w, d: 0.45, h: 3.5, ry: -Math.PI / 2 });      // tall bookcases
    for (const z of [-4.75, 4.75]) L.cases.push({ x: -HX + 0.25, z, w: 1.2, d: 0.45, h: 3.5, ry: Math.PI / 2 });
    return L;
  })();

  // ------------------------------------------------------------ textures
  const T_FLOOR = () => ctex(64, 64, (x, w, h) => { for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const dark = (i + j) % 2; x.fillStyle = dark ? '#8a6a46' : '#a88458'; x.fillRect(i * 16, j * 16, 16, 16); x.fillStyle = 'rgba(40,20,8,0.28)'; for (let k = 0; k < 4; k++) x.fillRect(i * 16, j * 16 + 3 + k * 4, 16, 1); x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillRect(i * 16, j * 16, 16, 1); x.fillRect(i * 16, j * 16, 1, 16); } }, RW / 4, RD / 4);
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
      const S = this.scene, B = new Batch(), wallM = L => lam('#ffffff', { map: wallTex(L) });
      // --- lights: a warm hall with a few pendant lamps
      S.add(new THREE.HemisphereLight('#ffeacc', '#4a3624', 0.95));
      this.lamps = []; for (const [x, z] of [[-8, -4], [0, -4], [8, -4], [-8, 4], [0, 4], [8, 4]]) { const p = new THREE.PointLight('#ffd89a', 0.5, 12, 1.5); p.position.set(x, 3.7, z); S.add(p); this.lamps.push([x, z]); }
      // --- floor, ceiling, walls (the west wall has the door)
      const floor = mesh(new THREE.PlaneGeometry(RW, RD), lam('#ffffff', { map: T_FLOOR() }), 0, 0, 0); floor.rotation.x = -Math.PI / 2; floor.userData.noFloat = true; S.add(floor);
      const ceil = mesh(new THREE.PlaneGeometry(RW, RD), lam('#d8cca8'), 0, RH, 0); ceil.rotation.x = Math.PI / 2; ceil.userData.noFloat = true; S.add(ceil);
      const mkWall = (L, rotY, x, z, door) => {
        const sh = new THREE.Shape(), hl = L / 2;
        if (door) { sh.moveTo(-hl, 0); sh.lineTo(door[0], 0); sh.lineTo(door[0], door[2]); sh.lineTo(door[1], door[2]); sh.lineTo(door[1], 0); sh.lineTo(hl, 0); sh.lineTo(hl, RH); sh.lineTo(-hl, RH); sh.lineTo(-hl, 0); }
        else { sh.moveTo(-hl, 0); sh.lineTo(hl, 0); sh.lineTo(hl, RH); sh.lineTo(-hl, RH); sh.lineTo(-hl, 0); }
        const m = mesh(new THREE.ShapeGeometry(sh), wallM(L), x, 0, z); m.rotation.y = rotY; m.userData.noFloat = true; S.add(m);
      };
      mkWall(RW, 0, 0, -HZ); mkWall(RW, Math.PI, 0, HZ); mkWall(RD, -Math.PI / 2, HX, 0); mkWall(RD, Math.PI / 2, -HX, 0, [-0.55, 0.55, 2.3]);
      // --- ceiling beams and pendant lamps on cords
      for (let x = -10.5; x <= 10.5; x += 3) B.box(0.22, 0.24, RD, x, RH - 0.12, 0, DARK);
      B.box(RW, 0.2, 0.22, 0, RH - 0.1, -HZ + 0.2, DARK); B.box(RW, 0.2, 0.22, 0, RH - 0.1, HZ - 0.2, DARK);
      for (const [x, z] of this.lamps) { B.box(0.02, 1.15, 0.02, x, RH - 0.575, z, '#14100c'); B.box(0.5, 0.22, 0.5, x, RH - 1.2, z, '#2a6a4a'); B.box(0.12, 0.12, 0.12, x, RH - 1.38, z, '#fff2c0'); }
      // --- the door (west wall): frame, ajar leaf, a sign above
      B.box(0.14, 2.38, 0.1, -HX + 0.07, 1.19, -0.6, DARK); B.box(0.14, 2.38, 0.1, -HX + 0.07, 1.19, 0.6, DARK); B.box(0.14, 0.1, 1.3, -HX + 0.07, 2.33, 0, DARK);
      B.box(0.05, 2.2, 1.02, -HX + 0.1, 1.12, 0, '#5a3820', 0); B.box(0.06, 0.06, 0.06, -HX + 0.14, 1.12, 0.38, BRASS);
      // --- baseboards
      B.box(RW, 0.14, 0.05, 0, 0.07, -HZ + 0.025, '#3e2614'); B.box(RW, 0.14, 0.05, 0, 0.07, HZ - 0.025, '#3e2614'); B.box(0.05, 0.14, RD, HX - 0.025, 0.07, 0, '#3e2614');
      B.box(0.05, 0.14, 7.35, -HX + 0.025, 0.07, -4.275, '#3e2614'); B.box(0.05, 0.14, 7.35, -HX + 0.025, 0.07, 4.275, '#3e2614');
      // --- 12 display tables: legs, apron, top, a brass rim and a low glass-looking edge
      for (const t of LAYOUT.tables) {
        const hw = t.w / 2, hd = t.d / 2;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(0.09, TOP - 0.06, 0.09, t.x + sx * (hw - 0.1), (TOP - 0.06) / 2, t.z + sz * (hd - 0.1), WOOD[1]);
        B.box(t.w - 0.2, 0.12, 0.05, t.x, TOP - 0.15, t.z - hd + 0.1, WOOD[1]); B.box(t.w - 0.2, 0.12, 0.05, t.x, TOP - 0.15, t.z + hd - 0.1, WOOD[1]); B.box(0.05, 0.12, t.d - 0.2, t.x - hw + 0.1, TOP - 0.15, t.z, WOOD[1]); B.box(0.05, 0.12, t.d - 0.2, t.x + hw - 0.1, TOP - 0.15, t.z, WOOD[1]);
        B.box(t.w, 0.06, t.d, t.x, TOP - 0.03, t.z, '#2a5a46'); B.box(t.w + 0.04, 0.02, 0.03, t.x, TOP + 0.01, t.z - hd, BRASS); B.box(t.w + 0.04, 0.02, 0.03, t.x, TOP + 0.01, t.z + hd, BRASS); B.box(0.03, 0.02, t.d, t.x - hw, TOP + 0.01, t.z, BRASS); B.box(0.03, 0.02, t.d, t.x + hw, TOP + 0.01, t.z, BRASS);
        this.addCol(t.x - hw, t.x + hw, t.z - hd, t.z + hd);
      }
      // --- 4 large tables
      for (const t of LAYOUT.large) {
        const hw = t.w / 2, hd = t.d / 2;
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(0.12, TOP - 0.08, 0.12, t.x + sx * (hw - 0.12), (TOP - 0.08) / 2, t.z + sz * (hd - 0.12), DARK);
        B.box(t.w - 0.3, 0.14, t.d - 0.3, t.x, TOP - 0.15, t.z, DARK); B.box(t.w, 0.08, t.d, t.x, TOP - 0.04, t.z, '#6a1c1c'); B.box(t.w + 0.06, 0.03, 0.04, t.x, TOP + 0.015, t.z - hd, BRASS); B.box(t.w + 0.06, 0.03, 0.04, t.x, TOP + 0.015, t.z + hd, BRASS);
        this.addCol(t.x - hw, t.x + hw, t.z - hd, t.z + hd);
      }
      // --- 6 racks for the frames: two uprights, a back panel, a top, three shelves with a small lip
      for (const k of LAYOUT.racks) {
        const hw = k.w / 2, back = k.z - k.f * 0.22, sh = [0.38, 1.28, 2.18];
        B.box(0.06, k.h, k.d, k.x - hw + 0.03, k.h / 2, k.z, DARK); B.box(0.06, k.h, k.d, k.x + hw - 0.03, k.h / 2, k.z, DARK); B.box(k.w - 0.1, k.h - 0.2, 0.03, k.x, (k.h - 0.2) / 2 + 0.2, back - k.f * 0.015, '#5a4630');
        B.box(k.w + 0.06, 0.06, k.d + 0.04, k.x, k.h, k.z, DARK); B.box(k.w - 0.1, 0.2, 0.04, k.x, 0.1, k.z, DARK);
        for (const sy of sh) { B.box(k.w - 0.12, 0.04, k.d - 0.04, k.x, sy - 0.02, k.z, WOOD[0]); B.box(k.w - 0.12, 0.05, 0.02, k.x, sy + 0.02, k.z + k.f * (k.d / 2 - 0.04), BRASS); }
        this.addCol(k.x - hw, k.x + hw, k.z - k.d / 2, k.z + k.d / 2);
      }
      // --- low display cabinets under the wall frames (north and south): a carcass, a top, small jars and books on top
      for (const lc of LAYOUT.lowcases) {
        const g = lc.ry ? -1 : 1; B.box(lc.w, 0.9, lc.d, lc.x, 0.45, lc.z, WOOD[2]); B.box(lc.w + 0.06, 0.05, lc.d + 0.06, lc.x, 0.925, lc.z, DARK);
        for (const dx of [-0.8, 0, 0.8]) { B.box(0.7, 0.62, 0.02, lc.x + dx, 0.47, lc.z + g * (lc.d / 2 + 0.005), '#2a1a0e'); B.box(0.06, 0.03, 0.03, lc.x + dx, 0.5, lc.z + g * (lc.d / 2 + 0.03), BRASS); }
        for (let i = 0; i < 5; i++) { const col = ['#a8d0d8', '#c04a2a', '#2a6a4a', '#e0d4a0', '#8a5a9a'][i], jx = lc.x - 0.9 + i * 0.45 + R.range(-0.05, 0.05), jh = R.range(0.1, 0.2); B.box(0.1, jh, 0.1, jx, 0.95 + jh / 2, lc.z, col); }
        this.addCol(lc.x - lc.w / 2, lc.x + lc.w / 2, lc.z - lc.d / 2, lc.z + lc.d / 2);
      }
      // --- tall bookcases on the east and west walls (lots of shelves with books)
      for (const bc of LAYOUT.cases) {
        const along = Math.abs(Math.cos(bc.ry)) < 0.5;                // the case runs along z (the wall is east or west)
        const wx = bc.x, wz = bc.z, wd = bc.w, dd = bc.d, n = 6, sg = Math.sign(bc.x) || 1, pal = ['#7a2a24', '#2a4a6a', '#3e6a3a', '#8a6a2a', '#5a2a5a', '#2a5a5a', '#9a4a2a', '#4a3a2a'];
        B.box(dd, bc.h, wd, wx, bc.h / 2, wz, DARK); B.box(dd - 0.04, bc.h - 0.2, wd - 0.12, wx - sg * 0.03, (bc.h - 0.2) / 2 + 0.1, wz, '#1e1208');
        const front = wx - sg * (dd / 2 - 0.02);
        for (let i = 0; i <= n; i++) { const y = 0.12 + i * ((bc.h - 0.25) / n); B.box(dd - 0.06, 0.04, wd - 0.08, wx - sg * 0.03, y, wz, WOOD[0]); if (i === n) break;
          let z = wz - wd / 2 + 0.1; const end = wz + wd / 2 - 0.08; while (z < end - 0.05) { const bw = R.range(0.035, 0.07), bh = R.range(0.18, (bc.h - 0.25) / n - 0.1); if (R.next() < 0.1) { z += R.range(0.08, 0.16); continue; } B.box(dd - 0.2, bh, bw, wx - sg * 0.05, y + 0.02 + bh / 2, z + bw / 2, pal[(R.next() * pal.length) | 0]); z += bw + 0.004; } }
        this.addCol(wx - dd / 2, wx + dd / 2, wz - wd / 2, wz + wd / 2);
      }
      // --- visitor benches (aisles) and potted palms in the corners
      for (const [x, z, ry] of [[-3.3, 0, 0], [3.3, 0, 0]]) {
        B.box(1.4, 0.06, 0.45, x, 0.44, z, WOOD[2], ry); for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.box(0.07, 0.41, 0.07, x + sx * 0.6, 0.205, z + sz * 0.17, DARK); B.box(1.4, 0.05, 0.05, x, 0.52, z - 0.2, DARK);
        this.addCol(x - 0.72, x + 0.72, z - 0.26, z + 0.26);
      }
      for (const [x, z] of [[-11.1, -7.2], [-11.1, 7.2], [11.1, -7.2], [11.1, 7.2]]) {
        B.box(0.4, 0.4, 0.4, x, 0.2, z, '#b0623a'); B.box(0.34, 0.04, 0.34, x, 0.42, z, '#2a1c12');
        for (let k = 0; k < 9; k++) { const a = k * 2.4, h = 0.6 + (k % 3) * 0.35; B.box(0.05, h, 0.05, x + Math.sin(a) * 0.1, 0.44 + h / 2, z + Math.cos(a) * 0.1, ['#2a6a34', '#337a3c', '#3a8a40'][k % 3]); B.box(0.5, 0.04, 0.12, x + Math.sin(a) * 0.3, 0.44 + h + 0.02, z + Math.cos(a) * 0.3, ['#2a6a34', '#337a3c', '#3a8a40'][k % 3], a); }
        this.addCol(x - 0.3, x + 0.3, z - 0.3, z + 0.3);
      }
      const furniture = B.build(); S.add(furniture); this.furniture = furniture;
      // --- a long runner along the aisles
      const rug = mesh(new THREE.PlaneGeometry(RW - 6, 2.0), lam('#7a2020'), 0, 0.012, 2.0); rug.rotation.x = -Math.PI / 2; S.add(rug); const rug2 = rug.clone(); rug2.position.z = -2.0; S.add(rug2);
      // --- signs: the name of the hall over the entrance wall and the doors
      const sg = mesh(new THREE.PlaneGeometry(2.2, 0.4), bas('#ffffff', { map: signTex('МУЗЕЙ КОЛЛЕКЦИИ', 220, 24, '#2a1a0e', '#f0d890') }), 0, 3.9, -HZ + 0.02); S.add(sg);
      const sd = mesh(new THREE.PlaneGeometry(1.1, 0.22), bas('#ffffff', { map: signTex('← в кабинет', 130, 22, '#14281e', '#9af0a0', '#7a8a50') }), -HX + 0.03, 2.65, 0); sd.rotation.y = Math.PI / 2; S.add(sd);
      // --- stations: leave, and the zones where boxes are placed (the nearest one decides which tab opens)
      this.stations = [{ id: 'exit', x: -HX + 0.7, z: 0, r: 1.3, label: () => 'E — выйти в кабинет' }];
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
      if (this.remotes) { this.remotes.update(dt); this.netAcc += dt; if (this.netAcc > 0.1) { this.netAcc = 0; const P = this.player; Net.send('pos', { x: Math.round(P.pos.x * 100) / 100, y: 1.65, z: Math.round(P.pos.z * 100) / 100, yaw: Math.round(P.yaw * 100) / 100, pitch: Math.round(P.pitch * 100) / 100, nz: 0, fl: 0, sw: 0, sp: Math.round(Math.hypot(P.vel.x, P.vel.y) * 10) / 10, st: 0, nt: NetParts.code(Save.curNet()) }); } }
    }
    // ------------------------------------------------------------ overlays / input
    open(name) { this.ov = name; this.hooks.unlock(); }
    close() { this.ov = null; this.refresh(); this.hooks.lock(); }
    interact() {
      const s = this.prompt; if (!s) return;
      if (s.id === 'exit') { Snd.sfx.door(); this.hooks.exitMuseum(); }
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
