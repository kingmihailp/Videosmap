// ---------------------------------------------------------------- the entomologist's cabinet: 3D room, stations, overlays
const Cabinet = (() => {
  const c = UIK.col;
  const RW = 9, RD = 6.4, RH = 3.4, HX = RW / 2, HZ = RD / 2;
  const PPM = 230; // box texture pixels per metre

  // ------------------------------------------------------------ small helpers
  function ctex(w, h, draw, rx, ry, smooth) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; draw(x, w, h);
    const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = smooth ? THREE.LinearMipmapLinearFilter : THREE.NearestFilter; t.generateMipmaps = !!smooth;
    if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } return t;
  }
  const lam = (col, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: col }, o));
  const bas = (col, o = {}) => new THREE.MeshBasicMaterial(Object.assign({ color: col }, o));
  function mesh(geo, mat, x, y, z, o = {}) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.castShadow = o.cast !== false; m.receiveShadow = o.recv !== false; return m; }
  function cube(g, w, h, d, x, y, z, mat, o) { const m = mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, o); g.add(m); return m; }
  function cyl(g, rt, rb, h, x, y, z, mat, seg = 10, o) { const m = mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, x, y, z, o); g.add(m); return m; }
  const R = new Rng(777);

  // ------------------------------------------------------------ procedural textures
  const T_FLOOR = () => ctex(128, 128, (x, w, h) => {
    const pl = 16; for (let r = 0; r < 8; r++) {
      const off = (r * 53) % 128; const base = [150 + (r * 17) % 22, 98 + (r * 11) % 16, 58 + (r * 7) % 12];
      for (let seg = 0; seg < 2; seg++) {
        const wd = 64; for (const x0 of [(off + seg * 64) % 128, (off + seg * 64) % 128 - 128]) {
          x.fillStyle = `rgb(${base[0] - seg * 8},${base[1] - seg * 5},${base[2] - seg * 3})`; x.fillRect(x0, r * pl, wd, pl);
          x.fillStyle = 'rgba(60,32,14,0.22)'; for (let k = 0; k < 7; k++) x.fillRect(x0 + ((k * 23 + r * 11) % (wd - 8)), r * pl + 2 + ((k * 5) % 11), 8 + (k % 3) * 6, 1);
          x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(x0, r * pl, 1, pl);
        }
      }
      x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(0, r * pl, 128, 1); x.fillStyle = 'rgba(255,220,160,0.14)'; x.fillRect(0, r * pl + 1, 128, 1);
    }
  }, 4.5, 3.2);
  function wallTex(L) {
    const k = 48, w = Math.round(L * k), h = Math.round(RH * k);
    const t = ctex(w, h, (x) => {
      const wain = Math.round(1.1 * k);
      // wallpaper: deep green with gold diamond motif
      x.fillStyle = '#2c5648'; x.fillRect(0, 0, w, h);
      for (let i = 0; i < w; i += 12) { x.fillStyle = (i / 12) % 2 ? '#2f5c4d' : '#295044'; x.fillRect(i, 0, 12, h); }
      for (let yy = 8; yy < h - wain; yy += 24) for (let xx = 6 + ((yy / 24) % 2) * 12; xx < w; xx += 24) { x.fillStyle = '#9a8a4a'; x.fillRect(xx, yy, 2, 2); x.fillRect(xx - 2, yy + 2, 2, 2); x.fillRect(xx + 2, yy + 2, 2, 2); x.fillRect(xx, yy + 4, 2, 2); x.fillStyle = '#c0aa5a'; x.fillRect(xx, yy + 2, 2, 2); }
      // dado + wood panels
      const wy = h - wain; x.fillStyle = '#5a3a22'; x.fillRect(0, wy, w, wain);
      for (let xx = 4; xx < w - 10; xx += 38) { x.fillStyle = '#6e4a2c'; x.fillRect(xx, wy + 8, 32, wain - 22); x.fillStyle = '#82583a'; x.fillRect(xx, wy + 8, 32, 1); x.fillRect(xx, wy + 8, 1, wain - 22); x.fillStyle = '#3e2614'; x.fillRect(xx + 31, wy + 8, 1, wain - 22); x.fillRect(xx, wy + wain - 15, 32, 1); }
      x.fillStyle = '#7e5434'; x.fillRect(0, wy - 1, w, 5); x.fillStyle = '#9a6c44'; x.fillRect(0, wy - 1, w, 1); x.fillStyle = '#2a180c'; x.fillRect(0, wy + 4, w, 1);
      x.fillStyle = '#3e2614'; x.fillRect(0, h - 7, w, 7); x.fillStyle = '#5a3a22'; x.fillRect(0, h - 7, w, 1);
      x.fillStyle = '#d8c89a'; x.fillRect(0, 0, w, 5); x.fillStyle = '#b8a678'; x.fillRect(0, 5, w, 2); x.fillStyle = '#8a7a50'; x.fillRect(0, 7, w, 1);
    });
    t.repeat.set(1 / L, 1 / RH); t.offset.set(0.5, 0); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; return t;
  }
  const T_WOOD = (a = '#7a4e2c', b = '#5e3a20') => ctex(64, 64, (x, w, h) => { x.fillStyle = a; x.fillRect(0, 0, w, h); for (let i = 0; i < 40; i++) { x.fillStyle = i % 3 ? b : '#8e6038'; x.globalAlpha = 0.35; x.fillRect((i * 29) % 64, (i * 7) % 64, 14 + (i % 4) * 8, 1); } x.globalAlpha = 1; }, 1, 1);
  const T_RUG = () => ctex(128, 96, (x, w, h) => {
    x.fillStyle = '#6a1c1c'; x.fillRect(0, 0, w, h); x.fillStyle = '#d0b060'; x.fillRect(4, 4, w - 8, h - 8); x.fillStyle = '#4a1414'; x.fillRect(6, 6, w - 12, h - 12);
    x.fillStyle = '#2c4a5a'; x.fillRect(14, 14, w - 28, h - 28); x.fillStyle = '#d0b060'; x.fillRect(16, 16, w - 32, h - 32); x.fillStyle = '#7a2424'; x.fillRect(18, 18, w - 36, h - 36);
    for (let i = 0; i < 6; i++) for (let j = 0; j < 4; j++) { const cx = 30 + i * 14, cy = 28 + j * 14; x.fillStyle = (i + j) % 2 ? '#d0b060' : '#2c4a5a'; x.fillRect(cx - 3, cy, 7, 1); x.fillRect(cx, cy - 3, 1, 7); x.fillRect(cx - 1, cy - 1, 3, 3); }
    x.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 300; i++) x.fillRect((i * 37) % w, (i * 53) % h, 1, 1);
  });
  const T_SKY = () => ctex(128, 64, (x, w, h) => {
    const g = x.createLinearGradient(0, 0, 0, h); g.addColorStop(0, '#6ab0f0'); g.addColorStop(0.7, '#cfe8f4'); g.addColorStop(1, '#e8f0d0'); x.fillStyle = g; x.fillRect(0, 0, w, h);
    x.fillStyle = 'rgba(255,255,255,0.8)'; [[12, 14, 26], [70, 8, 30], [100, 22, 20]].forEach(([a, b, l]) => { x.fillRect(a, b, l, 3); x.fillRect(a + 4, b - 2, l - 10, 3); });
    x.fillStyle = '#4a7a3a'; for (let i = 0; i < w; i += 6) { const hh = 12 + ((i * 13) % 14); x.fillRect(i, h - hh, 7, hh); } x.fillStyle = '#6a9a48'; for (let i = 3; i < w; i += 9) { const hh = 6 + ((i * 7) % 8); x.fillRect(i, h - hh, 8, hh); }
  });
  function signTex(text, w, h, bg, fg, border, smooth = true) {
    return ctex(w, h, (x) => { x.fillStyle = border || '#c8a040'; x.fillRect(0, 0, w, h); x.fillStyle = bg; x.fillRect(2, 2, w - 4, h - 4); T.draw(x, text, w / 2, Math.round((h - 8) / 2), { size: 8, align: 'c', color: fg }); }, 0, 0, smooth);
  }
  const T_PEG = () => ctex(96, 64, (x, w, h) => {
    x.fillStyle = '#8a6a44'; x.fillRect(0, 0, w, h); x.fillStyle = '#5a3e22'; for (let i = 3; i < w; i += 6) for (let j = 3; j < h; j += 6) x.fillRect(i, j, 1, 1);
    const tool = (px, py, w2, h2, col) => { x.fillStyle = col; x.fillRect(px, py, w2, h2); };
    tool(8, 8, 3, 22, '#aab0b8'); tool(5, 8, 9, 5, '#555'); tool(24, 10, 2, 24, '#c8ccd4'); tool(30, 10, 2, 24, '#c8ccd4'); tool(23, 32, 10, 6, '#b03a2a'); tool(46, 8, 3, 28, '#4a4a52'); tool(43, 8, 9, 3, '#c8ccd4');
    tool(62, 12, 12, 2, '#d8d0b0'); tool(62, 18, 12, 2, '#d8d0b0'); tool(62, 24, 12, 2, '#d8d0b0'); tool(78, 8, 8, 16, '#e0e4ea'); tool(79, 10, 6, 2, '#6a8ab0'); tool(10, 42, 24, 8, '#7a5a30'); tool(42, 44, 30, 3, '#b0b8c0');
  }, 0, 0, true);
  function bookPal() { return ['#7a2a24', '#2a4a6a', '#3e6a3a', '#8a6a2a', '#5a2a5a', '#2a5a5a', '#9a4a2a', '#4a3a2a', '#6a6a30', '#a0a0a0'].map(h => new THREE.Color(h)); }

  // box textures keyed by signature
  const boxTex = new Map();
  function texFor(box) {
    const cv = Boxes.canvas(box); const key = cv; if (boxTex.has(key)) return boxTex.get(key);
    const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.LinearMipmapLinearFilter; t.anisotropy = 4; boxTex.set(key, t); return t;
  }

  // ------------------------------------------------------------ the room
  class Cab {
    constructor(hooks, at) {
      this.hooks = hooks; this.ov = null; this.t = 0; this.sit = 0; this.sitDir = 0; this.sitFrom = null; this.sitOpen = null; this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#1a1410');
      this.camera = new THREE.PerspectiveCamera(70, SW / SH, 0.07, 700); this.scene.add(this.camera);
      this.player = { pos: new THREE.Vector3(at ? at.x : 3.5, 0, at ? at.z : 0.9), yaw: at ? at.yaw : Math.PI / 2 + 0.25, pitch: -0.05, bob: 0, vel: new THREE.Vector2(), stepD: 0, moving: false };
      this.colliders = []; this.stations = []; this.toastT = 0; this.toastText = ''; this.prompt = null;
      this.dynamic = new THREE.Group(); this.scene.add(this.dynamic);
      { const hp = new URLSearchParams(location.hash.replace('#', '?')).get('hour'); if (hp !== null && !isNaN(+hp)) this.hourOverride = +hp; }
      const newWings = Wings.check(); this.build(); this.applyTime(this.realHour()); this.refresh();
      Snd.startAmbient('cabinet'); this.toast('Добро пожаловать в кабинет!', 3); Wings.announce(newWings, (s2, d) => this.toast(s2, d));
      this.netAcc = 0; if (Net.on) { this.remotes = new Remotes(this.scene); Net.hooks.cab = () => this.refresh(); Net.hooks.pjoin = m => this.toast(`${m.name} вошёл в кабинет`, 2.5); Net.hooks.pleave = (m, r) => this.toast(`${r ? r.name : 'Игрок'} вышел`, 2.5); }
      this.camera.position.set(this.player.pos.x, 1.62, this.player.pos.z);
    }
    toast(s, d = 2.5) { this.toastText = s; this.toastT = d; }
    addCol(x0, x1, z0, z1) { this.colliders.push({ x0, x1, z0, z1 }); }

    build() {
      const S = this.scene, wood = lam('#7a4e2c', { map: T_WOOD() }), darkWood = lam('#4a2c18', { map: T_WOOD('#5a3820', '#3e2414') }), brass = lam('#c8a040'), metalM = lam('#9aa0aa');
      // --- lights
      this.hemi = new THREE.HemisphereLight('#ffeacc', '#4a3624', 0.62); S.add(this.hemi);
      this.moonL = new THREE.DirectionalLight('#7a96d8', 0); this.moonL.position.set(-9, 6, 1); this.moonL.target.position.set(-1.5, 0, 0.3); S.add(this.moonL, this.moonL.target);
      const sun = this.sun = new THREE.DirectionalLight('#ffe2a8', 1.35); sun.position.set(-9, 5.4, -1.6); sun.target.position.set(-1.5, 0, 0.3); S.add(sun, sun.target);
      sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024); const sc = sun.shadow.camera; sc.left = -7; sc.right = 7; sc.top = 7; sc.bottom = -7; sc.near = 1; sc.far = 24; sun.shadow.bias = -0.0008;
      this.pend = new THREE.PointLight('#ffcf8a', 0.9, 9, 1.6); this.pend.position.set(0.3, 2.7, 0.4); S.add(this.pend);
      const l1 = this.l1 = new THREE.PointLight('#ffd89a', 0.55, 5.5, 1.8); l1.position.set(-3.6, 1.45, -0.9); S.add(l1);
      const l2 = this.l2 = new THREE.PointLight('#ffd89a', 0.5, 5.5, 1.8); l2.position.set(3.5, 1.5, 1.6); S.add(l2);
      // --- floor, ceiling, rug
      const floor = mesh(new THREE.PlaneGeometry(RW, RD), lam('#ffffff', { map: T_FLOOR() }), 0, 0, 0, { cast: false }); floor.rotation.x = -Math.PI / 2; S.add(floor);
      const ceil = mesh(new THREE.PlaneGeometry(RW, RD), lam('#d8cca8'), 0, RH, 0, { cast: true, recv: false }); ceil.rotation.x = Math.PI / 2; S.add(ceil);
      for (const bx of [-3.2, -1.1, 1.1, 3.2]) cube(S, 0.2, 0.2, RD, bx, RH - 0.1, 0, darkWood, { cast: false });
      cube(S, RW, 0.18, 0.2, 0, RH - 0.09, 0, darkWood, { cast: false });
      const rug = mesh(new THREE.PlaneGeometry(4.6, 3.2), lam('#ffffff', { map: T_RUG() }), 0.2, 0.012, 0.3, { cast: false }); rug.rotation.x = -Math.PI / 2; S.add(rug);
      // --- walls
      const wallMat = L => lam('#ffffff', { map: wallTex(L) });
      const mkWall = (L, rotY, x, z, notch) => {
        const sh = new THREE.Shape(); const hl = L / 2;
        if (notch && notch.type === 'door') { sh.moveTo(-hl, 0); for (const [a, b, dh] of notch.doors) { sh.lineTo(a, 0); sh.lineTo(a, dh); sh.lineTo(b, dh); sh.lineTo(b, 0); } sh.lineTo(hl, 0); sh.lineTo(hl, RH); sh.lineTo(-hl, RH); sh.lineTo(-hl, 0); }
        else { sh.moveTo(-hl, 0); sh.lineTo(hl, 0); sh.lineTo(hl, RH); sh.lineTo(-hl, RH); sh.lineTo(-hl, 0); if (notch) { const p = new THREE.Path(); p.moveTo(notch.u0, notch.y0); p.lineTo(notch.u0, notch.y1); p.lineTo(notch.u1, notch.y1); p.lineTo(notch.u1, notch.y0); p.lineTo(notch.u0, notch.y0); sh.holes.push(p); } }
        const m = mesh(new THREE.ShapeGeometry(sh), wallMat(L), x, 0, z, { cast: true }); m.rotation.y = rotY; S.add(m); return m;
      };
      mkWall(RW, 0, 0, -HZ); mkWall(RW, Math.PI, 0, HZ);
      mkWall(RD, Math.PI / 2, -HX, 0, { u0: -1.35, u1: 1.35, y0: 0.95, y1: 2.85 });
      mkWall(RD, -Math.PI / 2, HX, 0, { type: 'door', doors: [[-2.15, -1.05, 2.35], [-0.42, 0.62, 2.35]] });      // the way out to the map and the door of the museum
      // --- window (west)
      const wx = -HX;
      this.skyCv = document.createElement('canvas'); this.skyCv.width = 256; this.skyCv.height = 128; this.skyTex = new THREE.CanvasTexture(this.skyCv); this.skyTex.magFilter = this.skyTex.minFilter = THREE.NearestFilter; this.skyTex.generateMipmaps = false;
      const sky = mesh(new THREE.PlaneGeometry(14, 7), bas('#ffffff', { map: this.skyTex }), wx - 5, 2.6, 0, { cast: false, recv: false }); sky.rotation.y = Math.PI / 2; S.add(sky);
      const fm = darkWood; cube(S, 0.14, 0.08, 2.9, wx + 0.04, 0.95, 0, fm); cube(S, 0.14, 0.08, 2.9, wx + 0.04, 2.87, 0, fm); cube(S, 0.14, 1.92, 0.08, wx + 0.04, 1.9, -1.4, fm); cube(S, 0.14, 1.92, 0.08, wx + 0.04, 1.9, 1.4, fm);
      cube(S, 0.07, 1.9, 0.07, wx + 0.04, 1.9, 0, fm); cube(S, 0.07, 0.07, 2.8, wx + 0.04, 1.95, 0, fm); cube(S, 0.07, 0.07, 2.8, wx + 0.04, 2.55, 0, fm);
      cube(S, 0.3, 0.06, 3.0, wx + 0.14, 0.93, 0, wood);
      const glass = mesh(new THREE.PlaneGeometry(2.7, 1.9), bas('#bfe0ff', { transparent: true, opacity: 0.1, depthWrite: false }), wx + 0.02, 1.9, 0, { cast: false, recv: false }); glass.rotation.y = Math.PI / 2; S.add(glass);
      // curtains
      for (const sg of [-1, 1]) { const cur = cube(S, 0.12, 2.3, 0.5, wx + 0.14, 1.85, sg * 1.85, lam('#7a2a2a'), { cast: false }); for (let i = 0; i < 4; i++) cube(S, 0.14, 2.3, 0.04, wx + 0.15, 1.85, sg * 1.85 - 0.18 + i * 0.12, lam('#5a1c1c'), { cast: false }); }
      cube(S, 0.1, 0.06, 4.6, wx + 0.16, 3.05, 0, brass, { cast: false });
      // --- sun shafts (soft on every edge) + dust; direction, strength and visibility follow the time of day (see applyTime)
      const bt = ctex(32, 64, (x, w, h) => { const im = x.createImageData(w, h); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const u = (i + 0.5) / w * 2 - 1, v = j / (h - 1); const al = Math.pow(1 - Math.abs(u), 1.6) * Math.pow(1 - v, 1.3) * Math.min(1, v * 6 + 0.25); const k = (j * w + i) * 4; im.data[k] = 255; im.data[k + 1] = 232; im.data[k + 2] = 170; im.data[k + 3] = Math.round(255 * al * 0.8); } x.putImageData(im, 0, 0); }, 0, 0, true);
      this.beam = new THREE.Group(); this.beam.position.set(wx + 0.1, 1.9, 0); this.beamMats = [];
      for (let i = 0; i < 3; i++) { const mt = new THREE.MeshBasicMaterial({ map: bt, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, opacity: 0.2 }); this.beamMats.push(mt); const q = new THREE.Mesh(new THREE.PlaneGeometry(i === 1 ? 1.7 : 2.6, 7.5), mt); q.position.y = -3.75; q.rotation.y = i === 1 ? Math.PI / 2 : 0; const h = new THREE.Group(); h.add(q); h.rotation.y = i === 2 ? 0.0 : 0; this.beam.add(h); }
      S.add(this.beam);
      const N = 90, dp = new Float32Array(N * 3); this.dustBase = []; this.dustJit = []; for (let i = 0; i < N; i++) { this.dustBase.push([R.range(0, 6.28), R.range(0.1, 0.3)]); this.dustJit.push([R.range(0.5, 4.6), R.range(-0.8, 0.8), R.range(-0.8, 0.8), R.range(-1.2, 1.2)]); }
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(dp, 3)); this.dustMat = new THREE.PointsMaterial({ color: '#fff0c0', size: 0.035, transparent: true, opacity: 0.8, depthWrite: false }); this.dust = new THREE.Points(dg, this.dustMat); S.add(this.dust); this.dust0 = dp.slice();
      // --- spreading desk (west)
      const sd = new THREE.Group(); S.add(sd); const dx0 = -3.85;
      cube(sd, 1.0, 0.07, 2.3, dx0, 0.8, 0, wood); for (const [lx, lz] of [[-0.42, -1.05], [0.42, -1.05], [-0.42, 1.05], [0.42, 1.05]]) cube(sd, 0.08, 0.77, 0.08, dx0 + lx, 0.385, lz, darkWood);
      cube(sd, 0.9, 0.2, 2.1, dx0, 0.66, 0, darkWood); for (const zz of [-0.55, 0.55]) { cube(sd, 0.02, 0.14, 0.7, dx0 + 0.46, 0.66, zz, wood); cube(sd, 0.03, 0.04, 0.16, dx0 + 0.47, 0.66, zz, brass); }
      this.addCol(dx0 - 0.55, dx0 + 0.55, -1.2, 1.2);
      // spreading board: base plate, two slats with a groove between them, specimen lying across the groove
      const bd = new THREE.Group(); bd.position.set(dx0 + 0.02, 0.835, 0.2); sd.add(bd);
      cube(bd, 0.46, 0.02, 0.62, 0, 0.01, 0, lam('#6a4a28')); cube(bd, 0.19, 0.03, 0.6, -0.135, 0.035, 0, lam('#c29a5c')); cube(bd, 0.19, 0.03, 0.6, 0.135, 0.035, 0, lam('#c29a5c'));
      const sample = SPECIES[Math.floor((new Date().getDate() * 7) % SPECIES.length)]; const st = new THREE.CanvasTexture(Art.specimen(sample)); st.magFilter = st.minFilter = THREE.NearestFilter;
      const sm = mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshLambertMaterial({ map: st, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide }), 0, 0.0515, 0, { cast: false }); sm.rotation.x = -Math.PI / 2; sm.rotation.z = Math.PI / 2; bd.add(sm);
      for (const zz of [-0.17, -0.06, 0.07, 0.18]) { cube(bd, 0.004, 0.03, 0.004, 0.05, 0.065, zz, metalM, { cast: false }); cube(bd, 0.12, 0.002, 0.012, 0.0, 0.0535, zz * 1.0, lam('#efe6c8'), { cast: false }); }
      // jar with a lid, standing on the desk
      cyl(sd, 0.05, 0.05, 0.12, dx0 + 0.25, 0.895, -0.75, lam('#a8d0d8', { transparent: true, opacity: 0.55 }), 10); cyl(sd, 0.053, 0.053, 0.02, dx0 + 0.25, 0.965, -0.75, metalM, 10);
      // open field journal lying flat: leather cover, two page blocks, spine, ruled lines, a pen
      const jx = dx0 + 0.18, jz = 0.88;
      cube(sd, 0.3, 0.01, 0.22, jx, 0.84, jz, lam('#5a2a1c')); cube(sd, 0.135, 0.014, 0.195, jx - 0.075, 0.852, jz, lam('#efe6c8')); cube(sd, 0.135, 0.014, 0.195, jx + 0.075, 0.852, jz, lam('#efe6c8')); cube(sd, 0.006, 0.016, 0.2, jx, 0.853, jz, lam('#3a2a1a'));
      for (let i = 0; i < 5; i++) { cube(sd, 0.1, 0.002, 0.003, jx - 0.075, 0.8605, jz - 0.07 + i * 0.035, lam('#6a5a4a'), { cast: false }); if (i < 3) cube(sd, 0.1, 0.002, 0.003, jx + 0.075, 0.8605, jz - 0.07 + i * 0.035, lam('#6a5a4a'), { cast: false }); }
      const pen = cyl(sd, 0.006, 0.006, 0.16, jx + 0.2, 0.845, jz - 0.02, lam('#1a1a24'), 6); pen.rotation.z = Math.PI / 2; pen.rotation.y = 0.5;
      // magnifier lying flat: ring, glass and a handle along one line
      const mgx = dx0 + 0.3, mgz = 0.5, mg = new THREE.Group(); mg.position.set(mgx, 0.847, mgz); sd.add(mg);
      const lensRing = mesh(new THREE.TorusGeometry(0.07, 0.009, 6, 18), lam('#caa040'), 0, 0, 0, { cast: false }); lensRing.rotation.x = Math.PI / 2; mg.add(lensRing);
      const lens = mesh(new THREE.CircleGeometry(0.066, 18), bas('#cfe8ff', { transparent: true, opacity: 0.28, depthWrite: false, side: THREE.DoubleSide }), 0, 0.001, 0, { cast: false, recv: false }); lens.rotation.x = -Math.PI / 2; mg.add(lens);
      const hd2 = cyl(mg, 0.008, 0.011, 0.15, 0, 0, 0.145, darkWood, 6, { cast: false }); hd2.rotation.x = Math.PI / 2;
      // desk lamp
      cyl(sd, 0.1, 0.12, 0.03, dx0 - 0.3, 0.85, -0.7, lam('#2a2a30'), 12); cube(sd, 0.02, 0.5, 0.02, dx0 - 0.3, 1.1, -0.7, metalM); cube(sd, 0.3, 0.02, 0.02, dx0 - 0.18, 1.34, -0.7, metalM);
      const shade = cyl(sd, 0.03, 0.12, 0.14, dx0, 1.28, -0.7, lam('#2a6a4a'), 12); this.lampBulb = mesh(new THREE.SphereGeometry(0.03, 8, 6), bas('#fff0b0'), dx0, 1.2, -0.7, { cast: false, recv: false }); sd.add(this.lampBulb);
      // lectern with the collection journal (E opens it)
      const lc = new THREE.Group(); lc.position.set(2.3, 0, -2.4); S.add(lc);
      cube(lc, 0.52, 0.95, 0.34, 0, 0.475, 0, darkWood); cube(lc, 0.6, 0.05, 0.4, 0, 0.0, 0.0, darkWood).position.y = 0.025;
      const slant = new THREE.Group(); slant.position.set(0, 1.0, 0); slant.rotation.x = 0.38; lc.add(slant);
      cube(slant, 0.62, 0.04, 0.46, 0, 0, 0, wood); cube(slant, 0.62, 0.05, 0.03, 0, 0.03, 0.22, wood);
      cube(slant, 0.5, 0.02, 0.34, 0, 0.03, -0.02, lam('#6a1c1c')); cube(slant, 0.23, 0.022, 0.31, -0.12, 0.048, -0.02, lam('#efe6c8')); cube(slant, 0.23, 0.022, 0.31, 0.12, 0.048, -0.02, lam('#efe6c8')); cube(slant, 0.008, 0.026, 0.32, 0, 0.05, -0.02, lam('#3a2a1a'));
      for (let i = 0; i < 6; i++) { cube(slant, 0.18, 0.002, 0.004, -0.12, 0.0605, -0.15 + i * 0.05, lam('#6a5a4a'), { cast: false }); cube(slant, 0.18, 0.002, 0.004, 0.12, 0.0605, -0.15 + i * 0.05, lam('#6a5a4a'), { cast: false }); }
      const plq = mesh(new THREE.PlaneGeometry(0.34, 0.1), bas('#ffffff', { map: signTex('Коллекция', 110, 24, '#2a1a0e', '#f0d890', null, false) }), 0, 0.62, 0.176, { cast: false, recv: false }); lc.add(plq);
      this.addCol(2.3 - 0.4, 2.3 + 0.4, -2.4 - 0.3, -2.4 + 0.3);
      // chair
      const ch = new THREE.Group(); ch.position.set(dx0 + 1.1, 0, 0.1); ch.rotation.y = 0.2; S.add(ch);
      cube(ch, 0.46, 0.05, 0.46, 0, 0.46, 0, lam('#6a2a22')); for (const [a, b] of [[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]]) cube(ch, 0.04, 0.44, 0.04, a, 0.22, b, darkWood);
      cube(ch, 0.05, 0.5, 0.44, 0.22, 0.74, 0, darkWood); cube(ch, 0.02, 0.36, 0.34, 0.2, 0.76, 0, lam('#6a2a22'));
      // --- workbench (east, south)
      const wb = new THREE.Group(); S.add(wb); const bx0 = 3.95, bz0 = 1.7;
      cube(wb, 1.0, 0.07, 2.0, bx0, 0.85, bz0, wood); for (const [lx, lz] of [[-0.43, -0.9], [0.43, -0.9], [-0.43, 0.9], [0.43, 0.9]]) cube(wb, 0.08, 0.82, 0.08, bx0 + lx, 0.41, bz0 + lz, darkWood);
      cube(wb, 0.9, 0.06, 1.9, bx0, 0.28, bz0, darkWood); this.addCol(bx0 - 0.55, HX, bz0 - 1.05, bz0 + 1.05);
      // stacked frames and parts
      [['#3a2210', 0.5, 0.32, 0.03], ['#a47c48', 0.38, 0.26, 0.03], ['#14141a', 0.28, 0.2, 0.03]].forEach(([col, w, d, hh], i) => { const f = cube(wb, w, hh, d, bx0 - 0.1, 0.9 + i * 0.032, bz0 - 0.5 + i * 0.01, lam(col)); f.rotation.y = 0.1 * i; });
      cyl(wb, 0.04, 0.045, 0.1, bx0 + 0.2, 0.93, bz0 + 0.4, lam('#e0e0c8'), 8); cyl(wb, 0.02, 0.03, 0.05, bx0 + 0.2, 0.995, bz0 + 0.4, lam('#c04a2a'), 8);
      cube(wb, 0.3, 0.02, 0.18, bx0, 0.89, bz0 + 0.1, lam('#2a6a4a')); cube(wb, 0.1, 0.01, 0.01, bx0 - 0.1, 0.91, bz0 + 0.1, metalM); cube(wb, 0.2, 0.008, 0.02, bx0 + 0.18, 0.9, bz0 + 0.7, metalM);
      for (let i = 0; i < 6; i++) cube(wb, 0.04, 0.04, 0.04, bx0 + 0.25 - i * 0.03, 0.9, bz0 - 0.2, lam('#caa040'), { cast: false });
      const peg = mesh(new THREE.PlaneGeometry(1.7, 1.1), lam('#ffffff', { map: T_PEG() }), HX - 0.02, 1.75, bz0, { cast: false }); peg.rotation.y = -Math.PI / 2; S.add(peg);
      const sgn = mesh(new THREE.PlaneGeometry(0.9, 0.2), bas('#ffffff', { map: signTex('Мастерская коробок', 150, 22, '#2a1a0e', '#f0d890', null, false) }), HX - 0.03, 2.5, bz0, { cast: false, recv: false }); sgn.rotation.y = -Math.PI / 2; S.add(sgn);
      // --- door (east)
      const dz = -1.6; cube(S, 0.12, 2.42, 0.08, HX - 0.05, 1.21, dz - 0.55, darkWood); cube(S, 0.12, 2.42, 0.08, HX - 0.05, 1.21, dz + 0.55, darkWood); cube(S, 0.12, 0.08, 1.18, HX - 0.05, 2.39, dz, darkWood);
      const door = cube(S, 0.05, 2.32, 1.02, HX - 0.04, 1.16, dz, lam('#6a4426', { map: T_WOOD('#6a4426', '#4a2c18') })); cube(S, 0.02, 0.9, 0.64, HX - 0.07, 1.65, dz, lam('#5a3820')); cube(S, 0.02, 0.9, 0.64, HX - 0.07, 0.62, dz, lam('#5a3820'));
      cube(S, 0.05, 0.05, 0.05, HX - 0.1, 1.15, dz + 0.4, brass); const dsg = mesh(new THREE.PlaneGeometry(0.9, 0.2), bas('#ffffff', { map: signTex('ВЫХОД · на карту', 150, 22, '#14281e', '#9af0a0', '#7a8a50', false) }), HX - 0.03, 2.62, dz, { cast: false, recv: false }); dsg.rotation.y = -Math.PI / 2; S.add(dsg);
      // --- the door of the museum (east wall, between the way out and the workshop): dark burgundy with raised panels and a golden handle and lock plate
      { const mz = 0.1, gold = lam('#e8c048'), burg = lam('#5a1626', { map: T_WOOD('#6a1a2c', '#46101e') }), burgD = lam('#3e0e1a'); cube(S, 0.12, 2.42, 0.08, HX - 0.05, 1.21, mz - 0.55, darkWood); cube(S, 0.12, 2.42, 0.08, HX - 0.05, 1.21, mz + 0.55, darkWood); cube(S, 0.12, 0.08, 1.18, HX - 0.05, 2.39, mz, darkWood);
        cube(S, 0.05, 2.32, 1.0, HX - 0.04, 1.16, mz, burg); cube(S, 0.02, 0.9, 0.62, HX - 0.07, 1.65, mz, burgD); cube(S, 0.02, 0.9, 0.62, HX - 0.07, 0.62, mz, burgD);
        for (const y of [1.65, 0.62]) { cube(S, 0.02, 0.04, 0.66, HX - 0.075, y + 0.47, mz, gold, { cast: false }); cube(S, 0.02, 0.04, 0.66, HX - 0.075, y - 0.47, mz, gold, { cast: false }); }      // gold beading around the panels
        cube(S, 0.02, 0.2, 0.07, HX - 0.075, 1.15, mz - 0.38, gold, { cast: false });                                                             // the lock plate
        cyl(S, 0.028, 0.028, 0.07, HX - 0.1, 1.15, mz - 0.38, gold, 10).rotation.z = Math.PI / 2; const knob = mesh(new THREE.SphereGeometry(0.05, 10, 8), gold, HX - 0.14, 1.15, mz - 0.38); S.add(knob);       // the golden handle: a rose and a round knob
        for (const y of [0.3, 2.0]) cube(S, 0.04, 0.12, 0.05, HX - 0.075, y, mz + 0.5, gold, { cast: false });                                       // hinges
        const msg = mesh(new THREE.PlaneGeometry(0.9, 0.2), bas('#ffffff', { map: signTex('МУЗЕЙ коллекций', 150, 22, '#4a1020', '#f4d878', '#e0b848', false) }), HX - 0.03, 2.62, mz, { cast: false, recv: false }); msg.rotation.y = -Math.PI / 2; S.add(msg); }
      // --- display desk (centre)
      const dd = new THREE.Group(); S.add(dd); const ddx = 0, ddz = 0.4;
      cube(dd, 2.5, 0.08, 1.3, ddx, 0.86, ddz, wood); cube(dd, 2.36, 0.62, 1.16, ddx, 0.5, ddz, darkWood);
      for (const [lx, lz] of [[-1.15, -0.55], [1.15, -0.55], [-1.15, 0.55], [1.15, 0.55]]) cube(dd, 0.1, 0.2, 0.1, ddx + lx, 0.1, ddz + lz, darkWood);
      for (const side of [-1, 1]) for (let i = 0; i < 3; i++) { const x0 = ddx - 0.78 + i * 0.78; cube(dd, 0.7, 0.5, 0.03, x0, 0.5, ddz + side * 0.595, lam('#6a4426', { map: T_WOOD('#6a4426', '#4a2c18') })); cube(dd, 0.16, 0.03, 0.04, x0, 0.58, ddz + side * 0.62, brass); cube(dd, 0.12, 0.06, 0.01, x0, 0.46, ddz + side * 0.615, lam('#e8dcb0')); }
      cube(dd, 2.4, 0.04, 0.05, ddx, 0.96, ddz - 0.6, brass); cube(dd, 2.4, 0.04, 0.05, ddx, 0.96, ddz + 0.6, brass);
      this.dglass = mesh(new THREE.PlaneGeometry(2.3, 1.15), bas('#cfe8ff', { transparent: true, opacity: 0.09, depthWrite: false }), ddx, 0.96, ddz, { cast: false, recv: false }); this.dglass.rotation.x = -Math.PI / 2; dd.add(this.dglass);
      this.addCol(-1.3, 1.3, ddz - 0.7, ddz + 0.7);
      // --- bookcases + herbarium cabinet (south)
      this.bookcase(-2.4, 3.2 - 0.2, 2.5, 2.7); this.bookcase(2.4, 3.2 - 0.2, 2.5, 2.7);
      const hc = new THREE.Group(); S.add(hc); const hz = 3.2 - 0.3; cube(hc, 1.5, 1.35, 0.55, 0, 0.7, hz, darkWood); cube(hc, 1.56, 0.06, 0.6, 0, 1.4, hz, wood); this.addCol(-0.8, 0.8, hz - 0.3, HZ);
      for (let r = 0; r < 4; r++) for (let q = 0; q < 4; q++) { const px = -0.54 + q * 0.36, py = 0.28 + r * 0.31; cube(hc, 0.32, 0.27, 0.02, px, py + 0.1, hz - 0.28, lam('#6a4426', { map: T_WOOD('#6a4426', '#4a2c18') })); cube(hc, 0.08, 0.02, 0.025, px, py + 0.2, hz - 0.3, brass); cube(hc, 0.1, 0.05, 0.01, px, py + 0.1, hz - 0.29, lam('#efe6c8')); }
      cyl(hc, 0.1, 0.09, 0.22, -0.5, 1.54, hz, lam('#a8d0d8', { transparent: true, opacity: 0.6 }), 10); cyl(hc, 0.015, 0.015, 0.3, 0.45, 1.58, hz, lam('#8a5a2a'), 6);
      // clock
      const clock = this.clock = new THREE.Group(); clock.position.set(0, 2.35, HZ - 0.04); clock.rotation.y = Math.PI; S.add(clock);
      const face = new THREE.Mesh(new THREE.CircleGeometry(0.28, 20), bas('#ffffff', { map: ctex(64, 64, (x) => { x.fillStyle = '#efe6c8'; x.beginPath(); x.arc(32, 32, 31, 0, 6.3); x.fill(); x.fillStyle = '#2a1a0e'; for (let i = 0; i < 12; i++) { const a = i / 12 * 6.283; x.fillRect(32 + Math.sin(a) * 26 - 1, 32 - Math.cos(a) * 26 - 1, 3, 3); } }, 0, 0, false) })); clock.add(face);
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.29, 0.03, 6, 20), lam('#5a3820')); clock.add(ring);
      this.hHand = cube(clock, 0.02, 0.16, 0.01, 0, 0, 0.02, bas('#14100c'), { cast: false }); this.mHand = cube(clock, 0.015, 0.23, 0.01, 0, 0, 0.03, bas('#14100c'), { cast: false });
      this.hHand.geometry.translate(0, 0.08, 0); this.mHand.geometry.translate(0, 0.115, 0);
      // --- framed specimens
      const fr = (x, y, z, ry, sp) => { const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; S.add(g); cube(g, 0.66, 0.46, 0.05, 0, 0, 0, darkWood, { cast: false }); cube(g, 0.56, 0.36, 0.01, 0, 0, 0.03, lam('#efe6c8'), { cast: false }); const tx = new THREE.CanvasTexture(Art.specimen(sp)); tx.magFilter = tx.minFilter = THREE.NearestFilter; const q = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.25), new THREE.MeshLambertMaterial({ map: tx, transparent: true, alphaTest: 0.5 })); q.position.z = 0.04; g.add(q); };
      fr(-HX + 0.04, 1.85, -2.4, Math.PI / 2, SPECIES_BY_ID.machaon || SPECIES[0]); fr(-HX + 0.04, 1.85, 2.4, Math.PI / 2, SPECIES[Math.min(10, SPECIES.length - 1)]);
      // --- pendant lamp, plants, globe
      cyl(S, 0.01, 0.01, 0.7, 0.3, RH - 0.45, 0.4, bas('#14100c'), 4, { cast: false }); cyl(S, 0.08, 0.34, 0.26, 0.3, RH - 0.9, 0.4, lam('#2a6a4a', { side: THREE.DoubleSide }), 14); this.bulb = mesh(new THREE.SphereGeometry(0.08, 8, 6), bas('#fff2c0'), 0.3, RH - 0.98, 0.4, { cast: false, recv: false }); S.add(this.bulb);
      // houseplants: a proper pot with soil and either a rubber-plant (broad leaves on a trunk) or a dracaena (arching blades)
      const leafGeo = (w, l, bend) => { const g = new THREE.PlaneGeometry(w, l, 2, 6); const pp = g.attributes.position; for (let k = 0; k < pp.count; k++) { const t = (pp.getY(k) + l / 2) / l, x = pp.getX(k); const tap = Math.pow(Math.sin(Math.PI * Math.min(1, t * 0.92 + 0.04)), 0.7); pp.setX(k, x * tap); pp.setY(k, t * l); pp.setZ(k, bend * t * t * l + Math.abs(x) * 0.35); } g.computeVertexNormals(); return g; };
      const LEAFG = { broad: leafGeo(0.2, 0.34, -0.5), blade: leafGeo(0.075, 1.05, -0.85) };
      const plant = (x, z, kind, sc = 1, seed = 1) => {
        const g = new THREE.Group(); g.position.set(x, 0, z); g.scale.setScalar(sc); S.add(g); const rr = new Rng(seed);
        const pot = lam('#b0623a'), potDark = lam('#8a4a2a');
        // one lathed clay pot (outer wall, rim, inner wall) + a soil disc sitting below the rim, so no surfaces share a plane
        const prof = [[0.001, 0], [0.105, 0], [0.115, 0.012], [0.165, 0.27], [0.185, 0.28], [0.19, 0.30], [0.183, 0.318], [0.168, 0.318], [0.162, 0.30], [0.158, 0.27], [0.001, 0.27]].map(([r, y]) => new THREE.Vector2(r, y));
        const potM = new THREE.Mesh(new THREE.LatheGeometry(prof, 16), new THREE.MeshLambertMaterial({ color: '#b0623a', side: THREE.DoubleSide })); potM.castShadow = true; potM.receiveShadow = true; g.add(potM);
        const soil = new THREE.Mesh(new THREE.CircleGeometry(0.158, 16), lam('#2a1c12')); soil.rotation.x = -Math.PI / 2; soil.position.y = 0.31; g.add(soil);
        const saucer = cyl(g, 0.15, 0.17, 0.025, 0, 0.0125, 0, potDark, 16); saucer.position.y = -0.0005; potM.position.y = 0.025;
        const leafMat = (c) => new THREE.MeshLambertMaterial({ color: c, side: THREE.DoubleSide });
        const greens = kind === 'ficus' ? ['#2a6a34', '#337a3c', '#245a30', '#3a8644'] : ['#3a8a3c', '#4a9a44', '#2e7a38', '#58a84c'];
        if (kind === 'ficus') {
          // a trunk with leaves on short stalks; each leaf has its own height and azimuth (golden angle) and hangs outward, so nothing crosses
          const trunk = cyl(g, 0.02, 0.032, 0.95, 0.0, 0.78, 0, lam('#5a4028'), 6);
          for (let k = 0; k < 16; k++) {
            const t = k / 15, az = k * 2.39996, h = 0.5 + t * 0.78, reach = 0.05 + (1 - Math.abs(t - 0.4)) * 0.07;
            const tip = new THREE.Vector3(Math.sin(az) * (reach + 0.06), h + 0.01, Math.cos(az) * (reach + 0.06)), root = new THREE.Vector3(0, h - 0.015, 0), sl = root.distanceTo(tip);      // the stalk runs from the trunk to the leaf base, so every leaf is attached
            const stG = new THREE.CylinderGeometry(0.006, 0.01, sl, 4); stG.translate(0, sl / 2, 0); const st = new THREE.Mesh(stG, lam('#4a6a30')); st.position.copy(root); st.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), tip.clone().sub(root).normalize()); g.add(st);
            const lf = new THREE.Mesh(LEAFG.broad, leafMat(greens[k % 4])); lf.castShadow = true; lf.receiveShadow = true;
            lf.position.set(Math.sin(az) * (reach + 0.06), h + 0.01, Math.cos(az) * (reach + 0.06)); lf.rotation.set(1.05 + (1 - t) * 0.25, az, 0, 'YXZ'); lf.scale.setScalar(1.0 - t * 0.3); g.add(lf);
          }
          const top = new THREE.Mesh(LEAFG.broad, leafMat(greens[0])); top.position.set(0, 1.28, 0); top.rotation.set(-0.12, 0.4, 0); top.scale.setScalar(0.55); g.add(top);
        } else {
          // dracaena rosette: two rings of blades at evenly spaced azimuths, outer ring flatter and offset by half a step, so the blades fan out without crossing
          for (let ring = 0; ring < 2; ring++) for (let k = 0; k < 7; k++) {
            const az = (k + ring * 0.5) / 7 * Math.PI * 2, tilt = ring ? 0.95 : 0.38; const lf = new THREE.Mesh(LEAFG.blade, leafMat(greens[(k + ring) % 4])); lf.castShadow = true;
            lf.position.set(Math.sin(az) * 0.035, 0.31 + ring * 0.01, Math.cos(az) * 0.035); lf.rotation.set(tilt, az, 0, 'YXZ'); lf.scale.set(1, ring ? 0.8 : 1.0, 1); g.add(lf);
          }
        }
        this.addCol(x - 0.28, x + 0.28, z - 0.28, z + 0.28);
      };
      plant(-4.0, -2.7, 'ficus', 1.25, 3); plant(4.0, -2.7, 'dracaena', 1.35, 5); plant(-3.9, 2.65, 'ficus', 1.05, 8);
      const gl = new THREE.Group(); gl.position.set(-1.75, 0, -2.3); S.add(gl); cyl(gl, 0.18, 0.2, 0.05, 0, 0.9 + 0.02, 0, darkWood, 10); cyl(gl, 0.04, 0.04, 0.88, 0, 0.48, 0, darkWood, 8); cyl(gl, 0.26, 0.2, 0.06, 0, 0.03, 0, darkWood, 10);
      const gtex = ctex(64, 32, (x, w, h) => { x.fillStyle = '#3a78a8'; x.fillRect(0, 0, w, h); const nz = new Noise2(9); for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) { const v = nz.fbm(i * 0.09, j * 0.12, 3); if (v > 0.52) { x.fillStyle = v > 0.66 ? '#6a8a3a' : '#4e9a48'; x.fillRect(i, j, 1, 1); } } }, 0, 0, false);
      const globe = mesh(new THREE.SphereGeometry(0.3, 14, 10), lam('#ffffff', { map: gtex }), 0, 1.3, 0, {}); globe.rotation.z = 0.4; gl.add(globe); this.globe = globe; this.addCol(-2.1, -1.4, -2.65, -1.95);
      // --- the easel with the frame of the guiding butterfly's wings (west side; the picture itself is made in refresh())
      { const ez = 2.5, ex = -2.0, ea = new THREE.Group(); ea.position.set(ex, 0, ez); S.add(ea);
        for (const sx of [-1, 1]) cube(ea, 0.06, 1.65, 0.05, sx * 0.66, 0.82, 0.12, darkWood);
        cube(ea, 1.32, 0.05, 0.05, 0, 1.55, 0.12, darkWood);
        cube(ea, 1.5, 0.05, 0.3, 0, 0.62, -0.03, wood); cube(ea, 1.46, 0.05, 0.04, 0, 0.62, -0.19, brass);
        this.easelPos = { x: ex, y: 1.06, z: ez + 0.02 }; this.addCol(ex - 0.8, ex + 0.8, ez - 0.25, ez + 0.25); }
      // wall hook guides for the exhibition wall are part of refresh()
      // --- window sill light spot marker none; interactions
      this.stations = [
        { id: 'spread', x: -3.0, z: 0.1, r: 1.6, label: () => { const n = Save.rawList().length; return n ? `E — расправить бабочку (ждут: ${n})` : 'E — расправилка (нет бабочек — наловите новых)'; } },
        { id: 'journal', x: 2.3, z: -1.75, r: 1.3, label: () => `E — открыть коллекцию (${collText()})` },
        { id: 'bench', x: 3.1, z: 1.7, r: 1.5, label: () => `E — мастерская: коробки и сачки (коробок: ${Save.data.boxes.length})` },
        { id: 'desk', x: 0, z: 0.4, r: 1.8, label: () => 'E — разместить коробки на столе' },
        { id: 'wall', x: 0, z: -2.5, r: 3.4, label: () => 'E — развесить коробки на стене' },
        { id: 'exit', x: 4.0, z: -1.6, r: 1.1, label: () => 'E — выйти на карту экспедиций' },
        { id: 'wings', x: -2.0, z: 1.75, r: 1.2, label: () => Wings.done() ? 'E — рамка путеводных крыльев (продана)' : `E — рамка с крыльями путеводной бабочки (${Wings.inFrame()}/${Wings.START.length})` },
        { id: 'museum', x: 4.0, z: 0.1, r: 0.95, label: () => `E — войти в музей (на экспозиции: ${Save.data.boxes.filter(b => b.loc && Boxes.MUS[b.loc.t]).length})` },
      ];
      this.addCol(-HX, HX, -HZ - 1, -HZ + 0.12); // keep away from the north wall displays
    }

    bookcase(cx, cz, w, h) {
      const S = this.scene, darkWood = lam('#4a2c18', { map: T_WOOD('#5a3820', '#3e2414') }); const g = new THREE.Group(); S.add(g); const d = 0.4;
      cube(g, w, h, 0.04, cx, h / 2, cz + d / 2 - 0.02, lam('#2a1a0e')); cube(g, 0.05, h, d, cx - w / 2, h / 2, cz, darkWood); cube(g, 0.05, h, d, cx + w / 2, h / 2, cz, darkWood); cube(g, w + 0.1, 0.06, d + 0.05, cx, h, cz, darkWood);
      const n = 5; const inst = []; const pal = bookPal();
      for (let i = 0; i <= n; i++) { const y = 0.1 + i * ((h - 0.1) / n); cube(g, w, 0.04, d, cx, y, cz, darkWood); if (i === n) break; let x = cx - w / 2 + 0.07; const end = cx + w / 2 - 0.05;
        while (x < end - 0.06) { const bw = R.range(0.035, 0.075), bh = R.range(0.18, (h - 0.1) / n - 0.06); if (R.next() < 0.08) { x += R.range(0.1, 0.2); continue; } inst.push([x + bw / 2, y + 0.02 + bh / 2, cz + 0.02, bw, bh, d - 0.12, pal[(R.next() * pal.length) | 0]]); x += bw + 0.004; } }
      const im = new THREE.InstancedMesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshLambertMaterial({ color: '#ffffff' }), inst.length); const m4 = new THREE.Matrix4();
      inst.forEach((b, i) => { m4.makeScale(b[3], b[4], b[5]); m4.setPosition(b[0], b[1], b[2]); im.setMatrixAt(i, m4); im.setColorAt(i, b[6]); }); im.castShadow = true; im.receiveShadow = true; g.add(im);
      this.addCol(cx - w / 2, cx + w / 2, cz - d / 2, cz + d / 2 + 0.3);
    }

    // rebuild everything that depends on saved boxes: wall and desk-top displays
    refresh() {
      const D = this.dynamic; if (this.wingMap) { this.wingMap.dispose(); this.wingMap = null; } while (D.children.length) { const o = D.children.pop(); o.traverse(n => { if (n.geometry) n.geometry.dispose(); }); }
      const frameMats = Boxes.STYLES.map(s => lam(s.fr[1]));
      const mk = (box, flat) => {
        const { w, h } = Boxes.pxSize(box.size), W = w / PPM, H = h / PPM; const tx = texFor(box);
        if (!flat) { const mats = [frameMats[box.style], frameMats[box.style], frameMats[box.style], frameMats[box.style], new THREE.MeshLambertMaterial({ map: tx }), frameMats[box.style]]; return { m: mesh(new THREE.BoxGeometry(W, H, 0.07), mats, 0, 0, 0), W, H }; }
        const mats = [frameMats[box.style], frameMats[box.style], new THREE.MeshLambertMaterial({ map: tx }), frameMats[box.style], frameMats[box.style], frameMats[box.style]];
        return { m: mesh(new THREE.BoxGeometry(W, 0.05, H), mats, 0, 0, 0), W, H };
      };
      // wall: 6 slots along the north wall
      const gap = 0.24; const widths = Boxes.WALL.map(s => Boxes.pxSize(s).w / PPM); const total = widths.reduce((a, b) => a + b, 0) + gap * 5; let x = -total / 2;
      Boxes.WALL.forEach((cls, i) => {
        const wd = widths[i], cx = x + wd / 2; x += wd + gap; const occ = Boxes.boxesAt('wall', i)[0]; const cy = 1.95;
        if (occ) { const { m, W, H } = mk(occ, false); m.position.set(cx, cy, -HZ + 0.045); D.add(m); const ny = cy + H / 2 + 0.1, top = cy + H / 2; cube(D, 0.026, 0.026, 0.02, cx, ny, -HZ + 0.02, lam('#c8a040'), { cast: false });
          for (const sx of [-1, 1]) { const ax = cx + sx * W * 0.28, dx = cx - ax, dy = ny - top, L = Math.hypot(dx, dy); const str = cube(D, 0.006, L, 0.006, ax + dx / 2, top + dy / 2, -HZ + 0.032, lam('#14100c'), { cast: false }); str.rotation.z = Math.atan2(-dx, dy); }   // two cords run from the frame's top corners up to the nail (a "V")
        }
        else { // empty slot: a small brass nail and a faint outline
          const hh = Boxes.pxSize(cls).h / PPM; const tex = ctex(64, 48, (g, w2, h2) => { g.strokeStyle = 'rgba(200,170,90,0.55)'; g.setLineDash([3, 3]); g.strokeRect(2.5, 2.5, w2 - 5, h2 - 5); T.draw(g, cls, w2 / 2, h2 / 2 - 4, { size: 8, align: 'c', color: 'rgba(200,170,90,0.7)' }); }, 0, 0, true);
          const q = mesh(new THREE.PlaneGeometry(wd, hh), bas('#ffffff', { map: tex, transparent: true, depthWrite: false }), cx, cy, -HZ + 0.015, { cast: false, recv: false }); D.add(q); cube(D, 0.03, 0.03, 0.02, cx, cy + hh / 2 - 0.05, -HZ + 0.02, lam('#c8a040'), { cast: false });
        }
      });
      // desk top: two flat slots
      for (let i = 0; i < Boxes.TOPN; i++) {
        const occ = Boxes.boxesAt('top', i)[0]; const px = (i ? 1 : -1) * 0.6, pz = 0.4;
        if (occ) { const { m } = mk(occ, true); m.position.set(px, 0.92, pz); m.rotation.y = 0; D.add(m); }
        else { const tex = ctex(64, 48, (g, w2, h2) => { g.strokeStyle = 'rgba(220,190,110,0.5)'; g.setLineDash([3, 3]); g.strokeRect(2.5, 2.5, w2 - 5, h2 - 5); }, 0, 0, true); const q = mesh(new THREE.PlaneGeometry(1.0, 0.78), bas('#ffffff', { map: tex, transparent: true, depthWrite: false }), px, 0.905, pz, { cast: false, recv: false }); q.rotation.x = -Math.PI / 2; D.add(q); }
      }
      // the frame of the guiding butterfly's wings on the easel (it fills up as the wings are laid into it)
      if (this.easelPos) { const E = this.easelPos, tx = WingsUI.tex(); this.wingMap = tx; const pic = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.77), new THREE.MeshLambertMaterial({ map: tx })); pic.rotation.y = Math.PI; pic.position.set(E.x, E.y, E.z - 0.02); D.add(pic);
        const fm = lam(Wings.built() ? '#d8b048' : '#4a2c18'); for (const [w, h, x, y] of [[1.5, 0.05, 0, 0.41], [1.5, 0.05, 0, -0.41], [0.05, 0.87, 0.725, 0], [0.05, 0.87, -0.725, 0]]) cube(D, w, h, 0.05, E.x + x, E.y + y, E.z - 0.01, fm); }
      // drawers indicator: count of boxes inside on the desk label
    }

    // ------------------------------------------------------------ time of day: the sky, the sun, the moon and the lamps follow the clock
    realHour() { if (this.hourOverride !== undefined) return this.hourOverride; const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }
    setHour(h) { this.hourOverride = h; this.applyTime(h); }
    applyTime(h) {
      this.hour = h; const a = Math.PI * (h - 5.5) / 15, elev = Math.sin(a), dayK = smooth(-0.12, 0.25, elev);
      const sv = new THREE.Vector3(Math.cos(a), Math.max(elev, 0.02) * 0.8 + 0.02, -0.12).normalize();     // from the room towards the sun
      this.sun.position.copy(this.sun.target.position).addScaledVector(sv, 16);
      this.sun.intensity = 1.5 * smooth(0.0, 0.18, elev); this.sun.color.set(mixHex('#ff8a40', '#fff0cc', smooth(0, 0.55, elev)));
      this.moonL.intensity = 0.4 * (1 - dayK);
      this.hemi.intensity = 0.3 + 0.34 * dayK; this.hemi.color.set(mixHex('#3a4a7a', '#ffeacc', dayK)); this.hemi.groundColor.set(mixHex('#14181e', '#4a3624', dayK));
      this.pend.intensity = 0.4 + 0.65 * (1 - dayK); this.l1.intensity = 0.25 + 0.4 * (1 - dayK); this.l2.intensity = 0.25 + 0.38 * (1 - dayK);
      // shafts only when the sun is low enough in the west to shine through the window
      const enter = clamp((-sv.x - 0.12) * 2.2) * smooth(0.02, 0.2, elev); this.beam.visible = enter > 0.02; this.dust.visible = enter > 0.02; this.dustMat.opacity = 0.8 * enter;
      this.beamMats.forEach(m => { m.opacity = 0.2 * enter; m.color.set(mixHex('#ff9a50', '#ffe8b0', smooth(0, 0.5, elev))); });
      const dir = sv.clone().negate(); this.beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), dir);
      const dp = this.dust0; for (let i = 0; i < this.dustJit.length; i++) { const j = this.dustJit[i]; dp[i * 3] = -HX + 0.3 + dir.x * j[0] + j[1]; dp[i * 3 + 1] = Math.max(0.2, 1.9 + dir.y * j[0] + j[2]); dp[i * 3 + 2] = dir.z * j[0] + j[3]; }
      this.drawSky(h, elev, dayK, sv, a);
    }
    drawSky(h, elev, dayK, sv, a) {
      const x = this.skyCv.getContext('2d'), W = 256, H = 128; const tw = Math.max(0, 1 - Math.abs(elev - 0.03) / 0.22);
      const top = mixHex(mixHex('#04081a', '#4a90e0', dayK), '#5a5a9a', tw * 0.35), bot = mixHex(mixHex('#101c38', '#c8e6f6', dayK), '#ff8a50', tw * 0.8);
      const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, top); g.addColorStop(1, bot); x.fillStyle = g; x.fillRect(0, 0, W, H);
      const sr = new Rng(11);
      if (dayK < 0.7) { x.fillStyle = `rgba(255,255,255,${(1 - dayK) * 0.9})`; for (let i = 0; i < 60; i++) { const px = sr.int(0, W - 1), py = sr.int(0, 80); x.fillRect(px, py, 1, 1); } }
      if (elev < 0.15) { const mx = 188, my = 30; x.fillStyle = `rgba(200,220,255,${0.25 * (1 - dayK)})`; x.beginPath(); x.arc(mx, my, 14, 0, 6.3); x.fill(); x.fillStyle = '#eef2ff'; x.beginPath(); x.arc(mx, my, 8, 0, 6.3); x.fill(); x.fillStyle = '#c8d4f0'; x.fillRect(mx - 3, my - 2, 2, 2); x.fillRect(mx + 2, my + 2, 2, 2); }
      if (sv.x < -0.05 && elev > -0.05) { const sx = 60 + clamp((a - Math.PI / 2) / (Math.PI / 2)) * 130, sy = 104 - Math.max(0, elev) * 96; x.fillStyle = `rgba(255,200,120,0.35)`; x.beginPath(); x.arc(sx, sy, 16, 0, 6.3); x.fill(); x.fillStyle = mixHex('#ff8a40', '#fff4c8', smooth(0, 0.5, elev)); x.beginPath(); x.arc(sx, sy, 8, 0, 6.3); x.fill(); }
      const cl = mixHex(mixHex('#2a3450', '#ffffff', dayK), '#ffb080', tw * 0.7); x.fillStyle = cl; x.globalAlpha = 0.5 + 0.4 * dayK; [[12, 14, 26], [70, 8, 30], [100, 22, 20], [190, 12, 28]].forEach(([a2, b2, l]) => { x.fillRect(a2, b2, l, 3); x.fillRect(a2 + 4, b2 - 2, l - 10, 3); }); x.globalAlpha = 1;
      const t1 = mixHex('#0a1410', '#4a7a3a', dayK * 0.9 + tw * 0.1), t2 = mixHex('#0e1c16', '#6a9a48', dayK * 0.9 + tw * 0.1);
      x.fillStyle = t1; for (let i = 0; i < W; i += 6) { const hh = 12 + ((i * 13) % 14); x.fillRect(i, H - hh, 7, hh); } x.fillStyle = t2; for (let i = 3; i < W; i += 9) { const hh = 6 + ((i * 7) % 8); x.fillRect(i, H - hh, 8, hh); }
      if (elev < 0) { x.fillStyle = '#ffd890'; for (let i = 0; i < 5; i++) x.fillRect(20 + i * 47 + (i % 2) * 6, H - 6 - (i % 3) * 3, 2, 2); }   // lit windows far away at night
      this.skyTex.needsUpdate = true;
    }

    // ------------------------------------------------------------ per-frame
    nearest() {
      const P = this.player; let best = null, bs = 9; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      for (const s of this.stations) { const dx = s.x - P.pos.x, dz = s.z - P.pos.z, d = Math.hypot(dx, dz); if (d > s.r) continue; const dot = d > 0.9 ? (dx * fx + dz * fz) / d : 1; if (dot < -0.1 && s.id !== 'desk') continue; const sc = d / s.r; if (sc < bs) { bs = sc; best = s; } }
      return best;
    }
    update(dt, inp) {
      this.t += dt; const P = this.player;
      if (this.sitDir || this.sit > 0) { inp.dx = inp.dy = 0; P.vel.x = P.vel.y = 0; P.moving = false; this.prompt = null; this.animate(dt); return; }
      P.yaw -= inp.dx * 0.0022; P.pitch = clamp(P.pitch - inp.dy * 0.0022, -1.3, 1.3); inp.dx = inp.dy = 0;
      P.yaw += ((inp.keys.has('ArrowLeft') ? 1 : 0) - (inp.keys.has('ArrowRight') ? 1 : 0)) * dt * 1.9; P.pitch = clamp(P.pitch + ((inp.keys.has('ArrowUp') ? 1 : 0) - (inp.keys.has('ArrowDown') ? 1 : 0)) * dt * 1.4, -1.3, 1.3);
      let mx = 0, mz = 0; if (inp.keys.has('KeyW')) mz -= 1; if (inp.keys.has('KeyS')) mz += 1; if (inp.keys.has('KeyA')) mx -= 1; if (inp.keys.has('KeyD')) mx += 1;
      const len = Math.hypot(mx, mz); if (len > 0) { mx /= len; mz /= len; }
      const spd = inp.keys.has('ShiftLeft') ? 4.4 : 2.5; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
      P.vel.x = damp(P.vel.x, (fx * -mz + rx * mx) * spd, 12, dt); P.vel.y = damp(P.vel.y, (fz * -mz + rz * mx) * spd, 12, dt);
      let nx = P.pos.x + P.vel.x * dt, nz = P.pos.z + P.vel.y * dt; const pr = 0.3;
      for (const k of this.colliders) { if (nx > k.x0 - pr && nx < k.x1 + pr && nz > k.z0 - pr && nz < k.z1 + pr) { const l = nx - (k.x0 - pr), r = (k.x1 + pr) - nx, tp = nz - (k.z0 - pr), bt = (k.z1 + pr) - nz; const m = Math.min(l, r, tp, bt); if (m === l) nx = k.x0 - pr; else if (m === r) nx = k.x1 + pr; else if (m === tp) nz = k.z0 - pr; else nz = k.z1 + pr; } }
      nx = clamp(nx, -HX + 0.35, HX - 0.35); nz = clamp(nz, -HZ + 0.35, HZ - 0.35);
      const moved = Math.hypot(nx - P.pos.x, nz - P.pos.z); P.pos.x = nx; P.pos.z = nz; P.moving = moved > 0.002; P.bob += moved * 2.4; P.stepD += moved;
      if (P.stepD > 0.85) { P.stepD = 0; Snd.sfx.step('wood'); }
      this.camera.position.set(P.pos.x, 1.62 + Math.sin(P.bob) * 0.025, P.pos.z); this.camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
      this.prompt = this.nearest(); this.toastT = Math.max(0, this.toastT - dt);
      this.animate(dt);
    }
    animate(dt) {
      if (Math.abs(this.realHour() - this.hour) > 1 / 120) this.applyTime(this.realHour());
      this.sitStep(dt);
      if (this.remotes) { this.remotes.update(dt); this.netAcc += dt; if (this.netAcc > 0.1) { this.netAcc = 0; const P = this.player; Net.send('pos', { x: Math.round(P.pos.x * 100) / 100, y: 1.65, z: Math.round(P.pos.z * 100) / 100, yaw: Math.round(P.yaw * 100) / 100, pitch: Math.round(P.pitch * 100) / 100, nz: 0, fl: 0, sw: 0, sp: Math.round(Math.hypot(P.vel.x, P.vel.y) * 10) / 10, st: Math.round(this.sit * 100) / 100 , nt: NetParts.code(Save.curNet()) }); } }
      const t = this.t; const dp = this.dust.geometry.attributes.position; for (let i = 0; i < dp.count; i++) { const b = this.dustBase[i]; dp.array[i * 3] = this.dust0[i * 3] + Math.sin(t * 0.2 + b[0]) * b[1]; dp.array[i * 3 + 1] = this.dust0[i * 3 + 1] + Math.sin(t * 0.3 + b[0] * 2) * b[1] * 0.7; dp.array[i * 3 + 2] = this.dust0[i * 3 + 2] + Math.cos(t * 0.25 + b[0]) * b[1]; } dp.needsUpdate = true;
      const d = new Date(); this.mHand.rotation.z = -(d.getMinutes() + d.getSeconds() / 60) / 60 * 6.283; this.hHand.rotation.z = -((d.getHours() % 12) + d.getMinutes() / 60) / 12 * 6.283;
      this.globe.rotation.y += dt * 0.15; this.pend.intensity = 0.9 + Math.sin(t * 1.3) * 0.02;
    }
    // ------------------------------------------------------------ overlays / input
    // the entomologist sits down on the chair by the spreading desk (and stands up again) with a short animation
    sitStep(dt) {
      if (!this.sitDir && this.sit <= 0) return; const P = this.player, SEAT = { x: -2.83, z: 0.14 }, SYAW = Math.PI / 2 + 0.15;
      this.sit = clamp(this.sit + (this.sitDir ? dt : -dt) / 0.95, 0, 1); const k = ease(this.sit), f = this.sitFrom || { x: P.pos.x, z: P.pos.z, yaw: P.yaw, pitch: P.pitch };
      const mv = ease(clamp(this.sit / 0.6)), dy = Math.atan2(Math.sin(SYAW - f.yaw), Math.cos(SYAW - f.yaw));
      P.pos.x = f.x + (SEAT.x - f.x) * mv; P.pos.z = f.z + (SEAT.z - f.z) * mv; P.yaw = f.yaw + dy * mv; P.pitch = f.pitch + (-0.5 - f.pitch) * k; P.bob = 0;
      const hop = Math.sin(clamp(this.sit / 0.6) * Math.PI) * 0.04 * (1 - k);
      this.camera.position.set(P.pos.x, 1.62 - 0.2 * k + hop, P.pos.z); this.camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
      if (this.sitDir && this.sit >= 1 && this.sitOpen) { const n = this.sitOpen; this.sitOpen = null; this.open(n); }
      if (this.sitDir && this.sit >= 1 && !this.sitOpen && !this.ov) this.standUp();
      if (!this.sitDir && this.sit <= 0) this.sitFrom = null;
    }
    standUp() { if (this.sit > 0 || this.sitDir) { this.sitDir = 0; this.sitOpen = null; Snd.sfx.step('wood'); } }
    open(name) { this.ov = name; this.hooks.unlock(); if (name === 'pick') Spread.pick.open(); if (name === 'bench') Boxes.bench.open(); if (name === 'wings') WingsUI.open(); }
    close() { this.ov = null; this.standUp(); this.refresh(); this.hooks.lock(); }
    interact() {
      const s = this.prompt; if (!s) return;
      if (s.id === 'spread') { if (!Save.rawList().length) { Snd.sfx.deny(); this.toast('Нет неразобранных бабочек: наловите их в экспедиции', 3); return; } Snd.sfx.page(); this.sitFrom = { x: this.player.pos.x, z: this.player.pos.z, yaw: this.player.yaw, pitch: this.player.pitch }; this.sitDir = 1; this.sitOpen = 'pick'; }
      else if (s.id === 'journal') { Snd.sfx.page(); this.open('journal'); }
      else if (s.id === 'bench') { Snd.sfx.page(); this.open('bench'); }
      else if (s.id === 'desk') { Snd.sfx.page(); Boxes.place.open('desk'); this.open('place'); }
      else if (s.id === 'wall') { Snd.sfx.page(); Boxes.place.open('wall'); this.open('place'); }
      else if (s.id === 'exit') { Snd.sfx.door(); this.hooks.exit(); }
      else if (s.id === 'wings') { Snd.sfx.page(); this.open('wings'); }
      else if (s.id === 'museum') { Snd.sfx.door(); this.hooks.museum(); }
    }
    key(e) {
      const ov = this.ov;
      if (!ov && (this.sitDir || this.sit > 0)) return;
      if (!ov) { if (e.code === 'KeyE') this.interact(); else if (e.code === 'Tab') { Snd.sfx.page(); this.open('journal'); } else if (e.code === 'KeyP' || e.code === 'Escape') { this.ov = 'pause'; this.hooks.unlock(); } return; }
      if (ov === 'help') { this.closeHelp(); return; }
      if (ov === 'pause') { if (e.code === 'Escape') { this.ov = null; this.hooks.lock(); } return; }
      if (ov === 'spread') {
        const G = Spread.G;
        if (e.code === 'Space') { if (G.phase === 'result') { Snd.sfx.click(); this.ov = Save.rawList().length ? 'pick' : null; if (!this.ov) this.close(); } else G.press(); }
        else if (e.code === 'Escape' && G.phase !== 'result') { G.phase = 'none'; this.ov = 'pick'; }
        return;
      }
      if (ov === 'journal') { const J = Screens.journal, nb = visibleBiomes().length; if (e.code === 'Escape' && J.escape()) { /* back from the aberrants list */ } else if (e.code === 'Escape' || e.code === 'Tab') { Snd.sfx.page(); this.close(); } else if (e.code === 'ArrowLeft') { J.tab = (J.tab + nb - 1) % nb; J.sel = 0; } else if (e.code === 'ArrowRight') { J.tab = (J.tab + 1) % nb; J.sel = 0; } else if (e.code === 'ArrowUp') J.turn(-1); else if (e.code === 'ArrowDown') J.turn(1); return; }
      if (e.code === 'Escape' || (e.code === 'KeyE' && ov !== 'pick')) { if (this.ov === 'bench' || this.ov === 'place' || this.ov === 'pick' || this.ov === 'wings') this.close(); }
    }
    click(x, y) {
      const ov = this.ov;
      if (ov === 'pick') { const r = Spread.pick.click(x, y); if (r && r.act === 'close') this.close(); else if (r && r.act === 'begin') { Snd.sfx.click(); Spread.G.begin(r.spec); this.ov = 'spread'; } }
      else if (ov === 'spread') { if (Spread.G.click(x, y) === 'done') { this.ov = Save.rawList().length ? 'pick' : null; if (!this.ov) this.close(); else Spread.pick.open(); } else if (Spread.G.phase === 'work') { /* mouse is used for the needle; clicks do nothing */ } }
      else if (ov === 'journal') { if (Screens.journal.click(x, y) === 'close') { Snd.sfx.page(); this.close(); } }
      else if (ov === 'bench') { const r = Boxes.bench.click(x, y); if (r === 'close') this.close(); }
      else if (ov === 'place') { const r = Boxes.place.click(x, y); if (r === 'close') this.close(); else if (r === 'changed') this.refresh(); }
      else if (ov === 'wings') { const r = WingsUI.click(x, y); if (r === 'close') { Snd.sfx.page(); this.close(); } else if (r === 'changed') this.refresh(); }
      else if (ov === 'pause') { const id = Cab.pauseClick(x, y); this.pauseAct(id); }
      else if (ov === 'help') this.closeHelp();
    }
    closeHelp() { if (this.helpBack) { this.ov = 'pause'; } else { this.ov = null; this.hooks.lock(); } this.helpBack = false; }
    wheel(dy) { if (this.ov === 'journal') Screens.journal.turn(dy > 0 ? 1 : -1); else if (this.ov === 'bench') Boxes.bench.wheel(dy); else if (this.ov === 'place') Boxes.place.wheel(dy); }
    pauseAct(id) {
      if (!id) return; Snd.sfx.click();
      if (id === 'resume') { this.ov = null; this.hooks.lock(); } else if (id === 'help') { this.ov = 'help'; this.helpBack = true; } else if (id === 'settings') this.hooks.settings(); else if (id === 'stash') this.hooks.stash(); else if (id === 'market') this.hooks.market(); else if (id === 'map') this.hooks.map(); else if (id === 'title') this.hooks.title();
    }
    static pauseButtons() {
      const s = Save.data.settings; const x = SW / 2 - 90; return [
        { id: 'resume', label: 'Продолжить', x, y: 76, w: 180, h: 20, size: 10 }, { id: 'help', label: 'Управление', x, y: 102, w: 88, h: 16 }, { id: 'stash', label: 'Склад (I)', x: x + 92, y: 102, w: 88, h: 16 },
        { id: 'settings', label: 'Настройки', x, y: 124, w: 180, h: 16 },
        { id: 'market', label: 'На рынок насекомых', x, y: 146, w: 180, h: 16 }, { id: 'map', label: 'В экспедицию (карта мира)', x, y: 168, w: 180, h: 16 }, { id: 'title', label: 'Выход в главное меню', x, y: 190, w: 180, h: 16 }];
    }
    static pauseClick(x, y) { const b = Cab.pauseButtons().find(b => UIK.hit(b, x, y)); return b ? b.id : null; }

    // ------------------------------------------------------------ 2D layer
    draw(ctx, t, m, dt) {
      const ov = this.ov;
      if (ov === 'pick') return Spread.pick.draw(ctx, t, m);
      if (ov === 'spread') { Spread.G.update(dt, m); Spread.G.tick(dt); return Spread.G.draw(ctx, t, m); }
      if (ov === 'journal') return Screens.journal.draw(ctx, t, m);
      if (ov === 'bench') return Boxes.bench.draw(ctx, t, m);
      if (ov === 'place') return Boxes.place.draw(ctx, t, m);
      if (ov === 'wings') return WingsUI.draw(ctx, t, m, dt);
      this.hud(ctx, t);
      if (ov === 'pause') this.drawPause(ctx, m);
      else if (ov === 'help') this.drawHelp(ctx);
    }
    hud(ctx, t) {
      const raw = Save.rawList().length, sp = Save.spreadList().length, bx = Save.data.boxes.length, on = Save.data.boxes.filter(b => b.loc).length;
      UIK.panel(ctx, 6, 6, 186, 44, { fill: 'rgba(16,28,24,0.82)', border: c.line });
      T.draw(ctx, 'Кабинет энтомолога', 12, 10, { size: 8, color: c.gold });
      T.draw(ctx, `ждут: ${raw} · расправлено: ${sp}`, 12, 21, { size: 8, color: c.text });
      T.draw(ctx, `коробок: ${bx}   на выставке: ${on}`, 12, 32, { size: 8, color: c.dim });
      if (this.remotes) T.draw(ctx, 'Онлайн: ' + [Net.name].concat(Object.values(Net.remote).map(r => r.name)).join(', '), 8, 54, { size: 8, color: '#9ae0b0', shadow: '#000' });
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(SW / 2 - 1, SH / 2 - 1, 2, 2);
      if (this.prompt && !this.ov) { const s = this.prompt.label(); const w = T.width(s, 8) + 20; UIK.panel(ctx, SW / 2 - w / 2, SH - 54, w, 18, { fill: 'rgba(16,28,24,0.9)', border: c.gold }); T.draw(ctx, s, SW / 2, SH - 49, { size: 8, align: 'c', color: '#fff' }); }
      if (this.toastT > 0) T.draw(ctx, this.toastText, SW / 2, 62, { size: 8, align: 'c', color: c.gold, shadow: '#000' });
      T.draw(ctx, 'WASD — ходить · мышь — осмотр · E — действие · Esc — пауза', 8, SH - 12, { size: 8, color: 'rgba(230,240,220,0.7)', shadow: '#000' });
    }
    drawPause(ctx, m) {
      ctx.fillStyle = 'rgba(4,12,10,0.7)'; ctx.fillRect(0, 0, SW, SH); UIK.panel(ctx, SW / 2 - 106, 38, 212, 182, { fill: 'rgba(16,32,28,0.96)', border: c.gold });
      T.draw(ctx, 'Пауза', SW / 2, 46, { size: 14, align: 'c', color: c.gold }); T.draw(ctx, 'Кабинет энтомолога', SW / 2, 63, { size: 8, align: 'c', color: c.dim });
      Cab.pauseButtons().forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y)));
    }
    drawHelp(ctx) {
      ctx.fillStyle = 'rgba(4,12,10,0.86)'; ctx.fillRect(0, 0, SW, SH); UIK.panel(ctx, 56, 24, 368, 224, { fill: 'rgba(16,32,28,0.97)', border: c.gold });
      T.draw(ctx, 'Кабинет энтомолога', SW / 2, 32, { size: 14, align: 'c', color: c.gold });
      [['WASD', 'ходить по кабинету'], ['Мышь', 'осмотреться'], ['E', 'взаимодействовать'], ['Shift', 'быстрее'], ['Esc', 'пауза / закрыть окно'], ['Пробел', 'поставить булавку (расправилка)']].forEach((r, i) => { T.draw(ctx, r[0], 76, 58 + i * 12, { size: 8, color: c.green }); T.draw(ctx, r[1], 160, 58 + i * 12, { size: 8, color: c.text }); });
      T.para(ctx, 'Расправилка (у окна): подцепите иглой кончик крыла, плавно переведите его к золотой точке и нажмите ПРОБЕЛ, когда кольцо сожмётся. Резкие движения рвут крыло. Мастерская (справа): создайте коробку S, M или L и разложите расправленных бабочек. Стол в центре и стена на севере — выставка ваших коллекций.', 76, 140, 330, { size: 8, color: c.dim, lh: 10 });
      T.draw(ctx, 'нажмите любую клавишу', SW / 2, 228, { size: 8, align: 'c', color: c.gold });
    }
    dispose() { if (this.remotes) { this.remotes.dispose(); Net.hooks.cab = Net.hooks.pjoin = Net.hooks.pleave = null; } Snd.stopAmbient(); this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const mt = o.material; if (mt) (Array.isArray(mt) ? mt : [mt]).forEach(x => { if (x.map && !boxTex.has(x.map.image)) x.map.dispose(); x.dispose(); }); }); }
  }
  return Cab;
})();
