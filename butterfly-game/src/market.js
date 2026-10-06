// ---------------------------------------------------------------- the insect market: a long open-air street market with side alleys, stalls full of butterfly boxes,
// a plaza with a fountain and a merchant who buys butterflies for coins (see econ.js). Same interface as the Cabinet, so the main loop treats it as App.cab.
const Market = (() => {
  const c = UIK.col;
  // ------------------------------------------------------------ the street plan (metres). Houses fill a 4 m grid around the open streets.
  const RECTS = [[-28, 28, -4, 4], [-16, -12, -28, -4], [12, 16, -24, -4], [0, 4, 4, 28], [-24, -20, 4, 16]];     // x0, x1, z0, z1
  const CIRCS = [[24, 0, 8], [14, -24, 6], [2, 28, 6], [-14, -28, 5], [-22, 16, 4]];                              // cx, cz, r
  const BOUND = { x0: -30.5, x1: 31.4, z0: -33, z1: 33 };
  const streetDist = (x, z) => { let d = 1e9; for (const [x0, x1, z0, z1] of RECTS) d = Math.min(d, Math.hypot(Math.max(x0 - x, 0, x - x1), Math.max(z0 - z, 0, z - z1))); for (const [cx, cz, r] of CIRCS) d = Math.min(d, Math.max(0, Math.hypot(x - cx, z - cz) - r)); return d; };

  // ------------------------------------------------------------ helpers
  function ctex(w, h, draw, rx, ry) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; draw(x, w, h); const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } return t; }
  const lam = (col, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: col }, o));
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V3 = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), N3 = new THREE.Matrix3();
  const jit = (col, k) => { const a = hex2rgb(col); return [a[0] / 255 * k, a[1] / 255 * k, a[2] / 255 * k]; };

  const BOXG = new THREE.BoxGeometry(1, 1, 1);
  function gableGeo(w, d, h, ov = 0.25, alongX = true, ovR = ov) {   // a gable roof: ridge along x (alongX) or z
    const W = alongX ? w : d, D = alongX ? d : w; const hw = W / 2 + (alongX ? ov : 0), hd = D / 2 + (alongX ? 0 : 0), ex = alongX ? 0 : ov;
    const a = D / 2 + ov, b = W / 2 + ovR; const P = [], idx = [];
    // ridge runs along local x: eaves at z=+-a, ridge at y=h
    const v = [[-b, 0, -a], [b, 0, -a], [b, h, 0], [-b, h, 0], [-b, 0, a], [b, 0, a]];
    const tris = [[0, 1, 2], [0, 2, 3], [5, 4, 3], [5, 3, 2], [4, 0, 3], [1, 5, 2], [0, 5, 4], [0, 1, 5]];   // two slopes, two gable ends and the underside (soffit)
    const g = new THREE.BufferGeometry(); const pos = []; tris.forEach(t => t.forEach(i => pos.push(...v[i]))); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.computeVertexNormals(); if (!alongX) g.rotateY(Math.PI / 2); return g;
  }

  // ------------------------------------------------------------ textures
  const cobble = () => ctex(128, 128, (x, w, h) => { x.fillStyle = '#6a645a'; x.fillRect(0, 0, w, h); const r = new Rng(5); for (let j = 0; j < 8; j++) for (let i = 0; i < 8; i++) { const ox = (j % 2) * 8 + r.range(-1, 1), g = r.int(-14, 14); x.fillStyle = `rgb(${130 + g},${124 + g},${112 + g})`; x.fillRect(i * 16 + ox + 1, j * 16 + 1, 14, 14); x.fillStyle = `rgba(255,255,255,0.08)`; x.fillRect(i * 16 + ox + 2, j * 16 + 2, 8, 1); x.fillStyle = 'rgba(0,0,0,0.18)'; x.fillRect(i * 16 + ox + 1, j * 16 + 13, 14, 2); } for (let k = 0; k < 40; k++) { x.fillStyle = 'rgba(80,110,50,0.35)'; x.fillRect(r.int(0, 127), r.int(0, 127), 2, 1); } });
  const PALS = [{ wall: '#e8d8b0', trim: '#6a4428', shut: '#3a6a8a', roof: '#b5503a' }, { wall: '#d6a888', trim: '#5a3820', shut: '#4a7a4a', roof: '#6a4a30' }, { wall: '#bcd0c8', trim: '#4a3a2c', shut: '#a8483a', roof: '#4a5568' }, { wall: '#e8c870', trim: '#6a4a2a', shut: '#2f5a8a', roof: '#a8483a' }, { wall: '#c8b8d0', trim: '#4a3040', shut: '#6a8a3a', roof: '#3f6a50' }];
  function facadeTex(pal, ground, emissive) {      // one 4 m x 3.2 m tile = 80 x 64 px (repeats upwards, one tile per floor)
    return ctex(80, 64, (x, w, h) => {
      const r = new Rng(strSeed(pal.wall + ground));
      if (emissive) { x.fillStyle = '#000'; x.fillRect(0, 0, w, h); x.fillStyle = '#ffcf80'; if (ground) { x.fillRect(8, 22, 40, 26); } else { x.fillRect(11, 14, 16, 24); x.fillRect(53, 14, 16, 24); } return; }
      x.fillStyle = pal.wall; x.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { x.fillStyle = r.chance(0.5) ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.07)'; x.fillRect(r.int(0, 79), r.int(0, 63), r.int(1, 4), 1); }
      x.fillStyle = pal.trim; x.fillRect(0, 0, 2, h); x.fillRect(w - 2, 0, 2, h); x.fillRect(0, 0, w, 2); x.fillRect(0, h - 2, w, 2); x.fillRect(38, 0, 4, 4);
      if (!ground) { for (const wx of [11, 53]) { x.fillStyle = pal.shut; x.fillRect(wx - 5, 12, 5, 28); x.fillRect(wx + 16, 12, 5, 28); x.fillStyle = pal.trim; x.fillRect(wx - 1, 12, 18, 28); x.fillStyle = '#7a9ab0'; x.fillRect(wx, 14, 16, 24); x.fillStyle = '#c8e0f0'; x.fillRect(wx + 1, 15, 5, 8); x.fillStyle = pal.trim; x.fillRect(wx + 7, 14, 2, 24); x.fillRect(wx, 25, 16, 2); x.fillStyle = '#5a3a20'; x.fillRect(wx - 2, 39, 20, 4); if (r.chance(0.6)) { x.fillStyle = ['#d83a4a', '#f0c030', '#e070c0'][r.int(0, 2)]; for (let k = 0; k < 5; k++) x.fillRect(wx + k * 3, 36 + (k % 2), 2, 3); x.fillStyle = '#3a8a3a'; x.fillRect(wx, 39, 16, 1); } } }
      else { x.fillStyle = '#2a1c12'; x.fillRect(8 - 2, 22 - 2, 44, 30); x.fillStyle = '#8ab0c0'; x.fillRect(8, 22, 40, 26); x.fillStyle = '#c8e0ea'; x.fillRect(10, 24, 10, 10); x.fillStyle = pal.trim; x.fillRect(27, 22, 2, 26); x.fillStyle = '#5a3a20'; x.fillRect(6, 48, 44, 4);
        x.fillStyle = '#4a2c18'; x.fillRect(56, 18, 16, 46); x.fillStyle = '#6a4428'; x.fillRect(58, 20, 12, 18); x.fillRect(58, 40, 12, 22); x.fillStyle = '#d8b050'; x.fillRect(67, 42, 2, 2);
        for (let i = 0; i < 10; i++) { x.fillStyle = (i % 2) ? '#f2e8d0' : pal.shut; x.fillRect(4 + i * 5, 8, 5, 8); } x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(4, 16, 50, 2); }
    }, 1, 1);
  }
  const signTex = (text, w, h, bg, fg, border) => ctex(w, h, (x) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = border || '#2a1a0c'; x.fillRect(0, 0, w, 2); x.fillRect(0, h - 2, w, 2); x.fillRect(0, 0, 2, h); x.fillRect(w - 2, 0, 2, h); const lines = String(text).split('\n'); lines.forEach((l, i) => T.draw(x, l, w / 2, Math.round((h - lines.length * 10) / 2 + i * 10 + 1), { size: 8, align: 'c', color: fg })); });
  // a framed display box with pinned butterflies (cols x rows), chosen from every species (a few aberrants and rare ones for show)
  function boxTex(rng, cols, rows, bg) {
    return ctex(cols * 32, rows * 22 + 4, (x, w, h) => {
      x.fillStyle = bg || '#d8cfa8'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 40; i++) x.fillRect(rng.int(0, w - 1), rng.int(0, h - 1), 2, 1);
      const real = SPECIES.filter(s => !s.mystery && s.biome !== 'ocean');
      for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) { let sp = rng.pick(real); const r = rng.next(); if (r < 0.14) sp = Aberr.make(sp, Aberr.randomCode()); else if (r < 0.2) sp = rng.pick(SPECIES.filter(s => s.biome === 'ocean')); x.imageSmoothingEnabled = false; x.drawImage(Art.specimen(sp), i * 32 + 1, j * 22 + 4, 30, 15); }
      x.fillStyle = 'rgba(255,255,255,0.1)'; x.fillRect(0, 0, w, 2);
    });
  }
  const bannerTex = (sp, bg) => ctex(48, 96, (x, w, h) => { x.fillStyle = bg; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(255,255,255,0.18)'; x.fillRect(2, 2, w - 4, h - 4); x.fillStyle = bg; x.fillRect(4, 4, w - 8, h - 8); x.imageSmoothingEnabled = false; x.drawImage(Art.specimen(sp), 0, 24, 48, 24); x.drawImage(Art.specimen(sp), 8, 56, 32, 16); for (let i = 0; i < 6; i++) { x.fillStyle = '#f2e8d0'; x.fillRect(w / 2 - 1, 8 + i * 2, 2, 1); } x.fillStyle = bg; x.beginPath(); x.moveTo(0, h); x.lineTo(w / 2, h - 10); x.lineTo(w, h); x.fill(); });

  // ------------------------------------------------------------ people (blocky pixel-style characters)
  function person(o = {}) {
    const g = new THREE.Group(), skin = o.skin || '#e8c8a0', body = o.body || '#a85a3a', pants = o.pants || '#3a3a4a';
    const L = [-0.1, 0.1].map(sx => { const th = new THREE.Group(); th.position.set(sx, 0.78, 0); g.add(th); const m = new THREE.Mesh(BOXG, lam(pants)); m.scale.set(0.16, 0.78, 0.18); m.position.y = -0.39; th.add(m); return th; });
    const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.66, 8), lam(body)); torso.position.y = 1.1; g.add(torso);
    if (o.apron) { const ap = new THREE.Mesh(BOXG, lam(o.apron)); ap.scale.set(0.3, 0.5, 0.04); ap.position.set(0, 0.98, -0.23); g.add(ap); }
    const arms = [-1, 1].map(sx => { const a = new THREE.Group(); a.position.set(sx * 0.27, 1.38, 0); g.add(a); const m = new THREE.Mesh(BOXG, lam(body)); m.scale.set(0.11, 0.55, 0.12); m.position.y = -0.27; a.add(m); const h = new THREE.Mesh(new THREE.SphereGeometry(0.055, 6, 5), lam(skin)); h.position.y = -0.58; a.add(h); return a; });
    const head = new THREE.Group(); head.position.y = 1.6; g.add(head); head.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), lam(skin)));
    const nose = new THREE.Mesh(BOXG, lam('#d8a888')); nose.scale.set(0.04, 0.04, 0.06); nose.position.set(0, -0.01, -0.17); head.add(nose);
    for (const sx of [-1, 1]) { const e = new THREE.Mesh(BOXG, lam('#201810')); e.scale.set(0.035, 0.035, 0.02); e.position.set(sx * 0.06, 0.03, -0.155); head.add(e); }
    if (o.glasses) { for (const sx of [-1, 1]) { const gl = new THREE.Mesh(new THREE.TorusGeometry(0.045, 0.008, 4, 10), lam('#1a1a20')); gl.position.set(sx * 0.06, 0.03, -0.17); head.add(gl); } const br = new THREE.Mesh(BOXG, lam('#1a1a20')); br.scale.set(0.05, 0.008, 0.008); br.position.set(0, 0.03, -0.17); head.add(br); }
    if (o.hat === 'straw') { const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.03, 12), lam('#d8c070')); h1.position.y = 0.12; const h2 = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.14, 0.12, 10), lam('#c8a850')); h2.position.y = 0.19; head.add(h1, h2); }
    else if (o.hat === 'cap') { const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.1, 10), lam(o.hatCol || '#4a5a8a')); h1.position.y = 0.12; const h2 = new THREE.Mesh(BOXG, lam(o.hatCol || '#4a5a8a')); h2.scale.set(0.2, 0.025, 0.12); h2.position.set(0, 0.09, -0.2); head.add(h1, h2); }
    else if (o.hat === 'top') { const h1 = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.025, 12), lam('#1c1820')); h1.position.y = 0.13; const h2 = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.24, 10), lam('#1c1820')); h2.position.y = 0.26; const h3 = new THREE.Mesh(new THREE.CylinderGeometry(0.141, 0.141, 0.04, 10), lam('#8a2a3a')); h3.position.y = 0.17; head.add(h1, h2, h3); }
    else if (o.hat === 'scarf') { const h1 = new THREE.Mesh(new THREE.SphereGeometry(0.175, 8, 6, 0, 6.3, 0, 1.5), lam(o.hatCol || '#c8483a')); h1.position.y = 0.01; head.add(h1); }
    g.userData = { L, arms, head, torso }; return g;
  }
  function nameSprite(text, col = '#f0f0dc') {
    const w = Math.max(24, T.width(text, 8) + 8); const cv = document.createElement('canvas'); cv.width = w; cv.height = 12; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = 'rgba(8,16,14,0.72)'; x.fillRect(0, 0, w, 12); T.draw(x, text, w / 2, 2, { size: 8, align: 'c', color: col });
    const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false; const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, fog: false, depthWrite: false })); sp.scale.set(w / 40, 12 / 40, 1); return sp;
  }

  const CLOTH = [['#c83a3a', '#f2e8d0'], ['#2f6fb0', '#f2e8d0'], ['#3a9a5a', '#f2e8d0'], ['#d89a2a', '#f2e8d0'], ['#8a3a9a', '#f2e8d0'], ['#2a8a8a', '#f2e8d0'], ['#c8603a', '#f0d890']];
  const WOOD = '#8a5a32', DWOOD = '#5a3820', LWOOD = '#b08050', CRATE = '#a87a44', STONE = '#9a948a', IRON = '#2a2a30', BRASS = '#c8a040';
  // each vendor's profession matches what their stall sells
  const PROF = {
    flowers: { title: 'Цветочница', line: 'Свежие ромашки и колокольчики! Бабочки на них так и слетаются.', o: { hat: 'straw', body: '#5a8a4a', apron: '#f0e8d0' } },
    nets: { title: 'Продавец сачков', line: 'Лёгкий бамбук, прочная сетка — ни одна бабочка не уйдёт!', o: { hat: 'cap', hatCol: '#5a7a3a', body: '#8a6a3a', apron: '#4a3a2a' } },
    books: { title: 'Книготорговец', line: 'Определители, атласы и редкие тома по энтомологии.', o: { hat: 'cap', hatCol: '#2a2a3a', body: '#4a3a5a', glasses: true } },
    tea: { title: 'Чайный торговец', line: 'Липовый чай с мёдом — лучшее, что бывает после долгой охоты.', o: { hat: 'scarf', hatCol: '#a83a3a', body: '#8a4a3a', apron: '#e8e0d0' } },
    jars: { title: 'Медовщик', line: 'Гречишный мёд! Бабочки любят — и вы полюбите.', o: { hat: 'straw', body: '#c8a040', apron: '#f0e8d0' } },
    pins: { title: 'Булавочник', line: 'Булавки, расправилки, стёкла — всё для вашей коллекции.', o: { hat: 'cap', hatCol: '#3a3a4a', body: '#4a5a6a', apron: '#2a2a30', glasses: true } },
    boxes: { title: 'Торговец коллекциями', line: sign => `«${sign}»: лучшие экземпляры — на витрине. А свои приносите к скупщику под красным навесом.`, o: { hat: 'scarf', hatCol: '#2f6fb0', body: '#e8e0d0' } },
  };

  // ------------------------------------------------------------ the market
  class Mkt {
    constructor(hooks) {
      this.hooks = hooks; this.ov = null; this.t = 0; this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#9ac4ea'); this.scene.fog = new THREE.Fog('#9ac4ea', 38, 110);
      this.camera = new THREE.PerspectiveCamera(70, SW / SH, 0.07, 600); this.scene.add(this.camera);
      this.player = { pos: new THREE.Vector3(-23.5, 0, 0.5), yaw: -Math.PI / 2 + 0.05, pitch: -0.04, bob: 0, vel: new THREE.Vector2(), stepD: 0, moving: false };
      this.colliders = []; this.circles = []; this.stations = []; this.toastT = 0; this.toastText = ''; this.prompt = null; this.walkers = []; this.vendors = []; this.flutter = []; this.glowMats = []; this.lights = []; this.sell = null;
      { const hp = new URLSearchParams(location.hash.replace('#', '?')).get('hour'); if (hp !== null && !isNaN(+hp)) this.hourOverride = +hp; }
      this.build(); this.applyTime(this.realHour());
      Snd.startAmbient('market'); this.toast('Рынок насекомых', 3);
      this.netAcc = 0; if (Net.on) { this.remotes = new Remotes(this.scene); Net.hooks.pjoin = m => this.toast(`${m.name} пришёл на рынок`, 2.5); Net.hooks.pleave = (m, r) => this.toast(`${r ? r.name : 'Игрок'} ушёл с рынка`, 2.5); Net.hooks.cab = () => { if (this.ov === 'sell') this.sellRefresh(); }; }
      this.camera.position.set(this.player.pos.x, 1.62, this.player.pos.z);
    }
    toast(s, d = 2.5) { this.toastText = s; this.toastT = d; }
    addCol(x0, x1, z0, z1) { this.colliders.push({ x0, x1, z0, z1 }); }
    addCircle(x, z, r) { this.circles.push({ x, z, r }); }
    circAt(x, z, ry, lx, lz, r) { const c = Math.cos(ry), s = Math.sin(ry); this.addCircle(x + lx * c + lz * s, z - lx * s + lz * c, r); }   // a circle given in the local frame of a stall
    // footprint of a stall at (x, z) with yaw ry (multiples of 90 deg) and local size w x d
    fp(x, z, w, d, ry, pad = 0.15) { const q = Math.abs(Math.round(ry / (Math.PI / 2))) % 2; const hw = (q ? d : w) / 2 + pad, hd = (q ? w : d) / 2 + pad; this.addCol(x - hw, x + hw, z - hd, z + hd); }

    build() {
      const S = this.scene, rng = new Rng(4242); this.rng = rng; const B = this.B = new Batch(11), G = this.G = new Batch(12);   // B: lit geometry, G: glowing things (lanterns)
      this.sun = new THREE.DirectionalLight('#fff0cc', 1.4); this.sun.castShadow = true; this.sun.shadow.mapSize.set(2048, 2048); { const sc = this.sun.shadow.camera; sc.left = -26; sc.right = 26; sc.top = 26; sc.bottom = -26; sc.near = 1; sc.far = 140; } this.sun.shadow.bias = -0.0006; S.add(this.sun, this.sun.target);
      this.hemi = new THREE.HemisphereLight('#dfefff', '#7a6a50', 0.7); S.add(this.hemi); this.moonL = new THREE.DirectionalLight('#7a96d8', 0); S.add(this.moonL, this.moonL.target);
      // sky dome
      this.skyCv = document.createElement('canvas'); this.skyCv.width = 512; this.skyCv.height = 256; this.skyTex = new THREE.CanvasTexture(this.skyCv); this.skyTex.magFilter = THREE.NearestFilter;
      const dome = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), new THREE.MeshBasicMaterial({ map: this.skyTex, side: THREE.BackSide, fog: false, depthWrite: false })); this.dome = dome; S.add(dome);
      // ground
      const gt = cobble(); gt.repeat.set(26, 26); gt.wrapS = gt.wrapT = THREE.RepeatWrapping; this.ground = new THREE.Mesh(new THREE.PlaneGeometry(130, 130).rotateX(-Math.PI / 2), lam('#c4c0b6', { map: gt })); this.ground.receiveShadow = true; this.ground.position.set(0, 0, 0); S.add(this.ground);
      const hay = ctex(64, 64, (x, w, h) => { x.fillStyle = '#7ab04a'; x.fillRect(0, 0, w, h); for (let i = 0; i < 120; i++) { x.fillStyle = rng.chance(0.5) ? '#6a9a3a' : '#8ac05a'; x.fillRect(rng.int(0, 63), rng.int(0, 63), 1, 2); } }, 6, 6);
      this.buildHouses(); this.buildGate(); this.buildPlazas(); this.buildStalls(); this.buildDecor();
      // finish batches
      this.litMat = lam('#ffffff', { vertexColors: true, side: THREE.DoubleSide }); S.add(B.build(this.litMat)); const gm = new THREE.MeshBasicMaterial({ vertexColors: true }); S.add(G.build(gm, false));
      this.dynamic = new THREE.Group(); S.add(this.dynamic);
    }

    // ---- houses on the 4 m grid around the streets
    buildHouses() {
      const S = this.scene, B = this.B, rng = this.rng; this.facade = PALS.map(p => ({ g: facadeTex(p, true), u: facadeTex(p, false) })); this.emG = facadeTex(PALS[0], true, true); this.emU = facadeTex(PALS[0], false, true);
      this.winMats = []; this.cells = new Map();
      const sides = (cells, ht) => { const g = new THREE.BoxGeometry(4, ht, 4); const uv = g.attributes.uv; const fl = ht / 3.2; for (let i = 0; i < uv.count; i++) uv.setY(i, uv.getY(i) * fl); g.attributes.uv.needsUpdate = true; return g; };
      for (let gx = -36; gx < 40; gx += 4) for (let gz = -36; gz < 36; gz += 4) {
        const cx = gx + 2, cz = gz + 2, d = streetDist(cx, cz); if (d < 1.99 || d > 9) continue;
        const pi = rng.int(0, PALS.length - 1), pal = PALS[pi], fl = d < 5 ? rng.int(2, 3) : rng.int(3, 4); const ht = fl * 3.2;
        const gMat = lam('#ffffff', { map: this.facade[pi].g, emissiveMap: this.emG, emissive: '#ffffff', emissiveIntensity: 0 }), uMat = lam('#ffffff', { map: this.facade[pi].u, emissiveMap: this.emU, emissive: '#ffffff', emissiveIntensity: 0 }); this.winMats.push(gMat, uMat);
        const ground = new THREE.Mesh(new THREE.BoxGeometry(4, 3.2, 4), gMat); ground.position.set(cx, 1.6, cz); ground.castShadow = ground.receiveShadow = true; S.add(ground);
        const up = new THREE.Mesh(sides(0, ht - 3.2), uMat); up.position.set(cx, 3.2 + (ht - 3.2) / 2, cz); up.castShadow = up.receiveShadow = true; S.add(up);
        this.cells.set(gx + ',' + gz, ht); const along = this.ridgeAlongX(cx, cz); B.geo(gableGeo(4, 4, 2.2, 0.3, along, 0), B.mat(cx, ht, cz), pal.roof, 0.05);
        if (rng.chance(0.6)) { const rh = 2.6, chx = along ? cx + rng.range(-1, 1) : cx, chz = along ? cz : cz + rng.range(-1, 1); B.box(0.5, rh + 0.4, 0.5, chx, ht + (rh + 0.4) / 2, chz, '#8a5a48'); B.box(0.62, 0.12, 0.62, chx, ht + rh + 0.4, chz, '#5a4a40'); }
        this.addCol(cx - 2, cx + 2, cz - 2, cz + 2);
      }
      // an outer wall hides the void behind the houses
      const wallM = lam('#6a5a4a'); [[0, -35.5, 150, 1], [0, 35.5, 150, 1], [-35.5, 0, 1, 150], [39.5, 0, 1, 150]].forEach(([x, z, w, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, 16, d), wallM); m.position.set(x, 8, z); S.add(m); });
    }
    // the ridge of a house runs parallel to the nearest street, so a whole row of roofs lines up
    ridgeAlongX(cx, cz) {
      let best = 1e9, alongX = true; for (const [x0, x1, z0, z1] of RECTS) { const d = Math.hypot(Math.max(x0 - cx, 0, cx - x1), Math.max(z0 - cz, 0, cz - z1)); if (d < best - 0.01) { best = d; alongX = (x1 - x0) >= (z1 - z0); } }
      for (const [px, pz, r] of CIRCS) { const d = Math.max(0, Math.hypot(cx - px, cz - pz) - r); if (d < best - 0.01) { best = d; alongX = Math.abs(cz - pz) > Math.abs(cx - px); } } return alongX;
    }
    hasWall(x, z) { return this.cells.has(Math.floor(x / 4) * 4 + ',' + Math.floor(z / 4) * 4); }
    // ---- the western gate, the door to the cabinet, signs over the entrances
    buildGate() {
      const B = this.B, S = this.scene; const gx = -27.2;
      for (const z of [-3.6, 3.6]) { B.box(0.8, 5.2, 0.8, gx, 2.6, z, STONE); B.box(1.1, 0.3, 1.1, gx, 5.3, z, '#7a746a'); B.box(1.0, 0.25, 1.0, gx, 0.12, z, '#8a847a'); }
      B.box(0.7, 0.6, 8.6, gx, 5.4, 0, DWOOD); B.box(0.5, 0.25, 8.2, gx, 5.85, 0, WOOD);
      const st = new THREE.Mesh(new THREE.PlaneGeometry(5.4, 1.35), new THREE.MeshLambertMaterial({ map: signTex('РЫНОК НАСЕКОМЫХ', 150, 38, '#3a2414', '#f0d890', '#c8a040') })); st.position.set(gx + 0.37, 4.4, 0); st.rotation.y = Math.PI / 2; this.scene.add(st);
      const st2 = st.clone(); st2.position.x = gx - 0.37; st2.rotation.y = -Math.PI / 2; S.add(st2); for (const z of [-2.4, 2.4]) B.rope([gx + 0.2, 4.7, z], [gx + 0.2, 4.1, z * 0.9], 0, '#3a2a1c', 0.04, 2);
      this.stations.push({ id: 'exit', x: -25.2, z: 0, r: 2.6, label: () => 'E — выйти на карту экспедиций' });
      this.addCol(gx - 0.5, gx + 0.5, -4.2, -3.1); this.addCol(gx - 0.5, gx + 0.5, 3.1, 4.2); this.addCol(-31, -28.4, -5, 5);
      // the door of the entomologist's house on the east side of the plaza
      const dx = 31.95; const door = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.5), new THREE.MeshLambertMaterial({ map: ctex(24, 40, (x, w, h) => { x.fillStyle = '#3a2414'; x.fillRect(0, 0, w, h); x.fillStyle = '#6a4428'; x.fillRect(2, 2, w - 4, h - 4); x.fillStyle = '#7a5434'; x.fillRect(4, 4, w - 8, 14); x.fillRect(4, 22, w - 8, 14); x.fillStyle = BRASS; x.fillRect(w - 6, 20, 3, 3); }) })); door.position.set(dx, 1.25, 0); door.rotation.y = -Math.PI / 2; S.add(door);
      const ds = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.62), new THREE.MeshLambertMaterial({ map: signTex('Кабинет энтомолога', 100, 24, '#243a30', '#f0d890', '#c8a040') })); ds.position.set(dx, 2.95, 0); ds.rotation.y = -Math.PI / 2; S.add(ds);
      B.box(0.2, 0.2, 1.9, dx - 0.05, 2.6, 0, DWOOD); for (const z of [-1.5, 1.5]) { B.box(0.55, 0.06, 0.06, dx - 0.28, 2.62, z, IRON); this.lamp(dx - 0.5, 2.28, z, 0.2, '#ffd070', 0.1); }
      this.stations.push({ id: 'cabinet', x: 30.4, z: 0, r: 2.4, label: () => 'E — вернуться в кабинет энтомолога' });
    }
    // a glowing hanging lantern (also registers a warm light at night for a few of them)
    lamp(x, y, z, r = 0.2, col, cord = 0.14) { const cols = ['#ffb860', '#ff8a60', '#ffd870', '#ff9aa0', '#a8e0ff', '#c8f090']; const cc = col || cols[this.rng.int(0, cols.length - 1)]; this.G.sph(r, x, y, z, cc, 1, 1.25, 1, 8, 6); this.G.box(r * 0.9, 0.04, r * 0.9, x, y + r * 1.3, z, '#2a2018'); this.G.box(r * 0.9, 0.04, r * 0.9, x, y - r * 1.3, z, '#2a2018'); if (cord > 0) this.G.box(0.025, cord + 0.05, 0.025, x, y + r * 1.3 + cord / 2, z, '#2a2018', 0, 0, 0, 0); }
    // ---- plazas: the fountain, the wells, trees, benches
    buildPlazas() {
      const B = this.B, S = this.scene, rng = this.rng; const treeMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }); const env = World.ENV.russia;
      const tree = (x, z, s = 1, kind = 'birch') => { const t = World.TREES[kind](new Rng(Math.floor(x * 31 + z * 17 + 9)), env); const m = new THREE.Mesh(t.g, treeMat); m.position.set(x, 0, z); m.scale.setScalar(s); m.castShadow = m.receiveShadow = true; S.add(m); B.cyl(0.55, 0.62, 0.35, x, 0.17, z, STONE, 8); B.cyl(0.46, 0.46, 0.4, x, 0.2, z, '#5a4030', 8); this.addCol(x - 0.5, x + 0.5, z - 0.5, z + 0.5); };
      this.tree = tree;
      // east plaza: the big fountain
      const fx = 24, fz = 0; B.cyl(2.5, 2.7, 0.6, fx, 0.3, fz, '#9a948a', 20); B.geo(new THREE.TorusGeometry(2.55, 0.12, 6, 28), B.mat(fx, 0.62, fz, Math.PI / 2, 0, 0), '#aaa49a'); B.cyl(0.3, 0.45, 1.4, fx, 1.1, fz, '#a8a29a', 10); B.cyl(1.25, 0.5, 0.18, fx, 1.78, fz, '#9a948a', 14); B.cyl(0.18, 0.28, 0.8, fx, 2.2, fz, '#a8a29a', 8); B.cyl(0.8, 0.2, 0.14, fx, 2.65, fz, '#9a948a', 12);
      const wm = new THREE.Mesh(new THREE.CircleGeometry(2.38, 24).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ map: ctex(64, 64, (x, w, h) => { x.fillStyle = '#4a8ab8'; x.fillRect(0, 0, w, h); for (let i = 0; i < 90; i++) { x.fillStyle = rng.chance(0.5) ? '#6aa8d0' : '#3a78a8'; x.fillRect(rng.int(0, 61), rng.int(0, 63), rng.int(2, 6), 1); } }, 3, 3), transparent: true, opacity: 0.92 })); wm.position.set(fx, 0.64, fz); S.add(wm); this.water = wm; this.waterTex = wm.material.map;
      this.addCircle(fx, fz, 2.75);
      // benches and trees around the east plaza
      for (const [bx, bz, ry] of [[24, -6.9, Math.PI], [24, 6.9, 0]]) this.bench(bx, bz, ry);
      for (const [tx, tz] of [[29.7, -4.0], [29.7, 4.0], [18.6, -6.6], [18.6, 6.6]]) tree(tx, tz, 1.1);
      // north plaza (end of the second alley): a stone well, trees, benches
      const wx = 14, wz = -24; B.cyl(1.1, 1.15, 1.0, wx, 0.5, wz, '#8a847a', 12); B.cyl(0.8, 0.8, 0.1, wx, 1.0, wz, '#2a4a6a', 12); B.box(0.18, 2.4, 0.18, wx - 1.0, 2.2, wz, DWOOD); B.box(0.18, 2.4, 0.18, wx + 1.0, 2.2, wz, DWOOD); B.box(2.4, 0.16, 0.2, wx, 3.4, wz, DWOOD); B.cyl(0.1, 0.1, 2.0, wx, 3.1, wz, WOOD, 6, 0, 0, Math.PI / 2);
      B.geo(gableGeo(2.8, 2.0, 0.9, 0.2, true), B.mat(wx, 3.45, wz), '#b5503a'); this.addCircle(wx, wz, 1.2); B.cyl(0.03, 0.03, 1.1, wx, 2.55, wz, '#8a6a3a', 5); B.cyl(0.25, 0.22, 0.3, wx, 1.85, wz, '#6a4a2a', 8);
      for (const [tx, tz] of [[10.6, -27], [17.6, -27], [10.2, -21], [18, -21]]) tree(tx, tz, 1.15); for (const [bx, bz, ry] of [[14, -28.2, Math.PI], [9.3, -24, Math.PI / 2], [18.7, -24, -Math.PI / 2]]) this.bench(bx, bz, ry);
      // south plaza: a big tree and tea tables
      tree(2, 27.5, 1.6, 'birch'); tree(-2.2, 30.8, 1.2); tree(6.2, 30.8, 1.2); for (const [bx, bz, ry] of [[2, 23.4, Math.PI], [-2.2, 27.6, Math.PI / 2], [6.2, 27.6, -Math.PI / 2]]) this.bench(bx, bz, ry);
      // west garden at the end of the first alley: trees, a lily pond
      B.cyl(2.2, 2.3, 0.4, -14, 0.2, -28, '#8a847a', 16); const pw = new THREE.Mesh(new THREE.CircleGeometry(2.0, 16).rotateX(-Math.PI / 2), lam('#3a7a98')); pw.position.set(-14, 0.42, -28); S.add(pw); for (let i = 0; i < 6; i++) { const a = rng.range(0, 6.28), r = rng.range(0.3, 1.7); B.cyl(0.22, 0.22, 0.02, -14 + Math.cos(a) * r, 0.44, -28 + Math.sin(a) * r, '#4a9a4a', 7); } this.addCircle(-14, -28, 2.35);
      for (const [tx, tz] of [[-17.8, -30], [-10.2, -30], [-17.8, -25.8], [-10.2, -25.8]]) tree(tx, tz, 1.05); this.bench(-14, -24.5, 0);
      // tea garden at the end of the short alley
      tree(-25.0, 17.8, 1.0); this.bench(-19.2, 17.8, -Math.PI / 2);
    }
    bench(x, z, ry) { const B = this.B; B.at = null; const sv = B.base.clone(); B.base.multiply(new THREE.Matrix4().compose(new THREE.Vector3(x, 0, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ry, 0)), ONE)); B.box(1.6, 0.08, 0.45, 0, 0.5, 0, LWOOD); B.box(1.6, 0.4, 0.06, 0, 0.78, -0.2, WOOD, -0.15); B.box(0.1, 0.5, 0.4, -0.7, 0.25, 0, IRON); B.box(0.1, 0.5, 0.4, 0.7, 0.25, 0, IRON); B.base.copy(sv); this.fp(x, z, 1.7, 0.6, ry, 0.0); }

    // run a builder in the local frame of a group at (x, z) rotated by ry
    at(x, z, ry, fn) { const g = new THREE.Group(); g.position.set(x, 0, z); g.rotation.y = ry; g.updateMatrix(); const sv = this.B.base.clone(), sg = this.G.base.clone(); this.B.base.copy(g.matrix); this.G.base.copy(g.matrix); fn(g); this.B.base.copy(sv); this.G.base.copy(sg); this.scene.add(g); return g; }
    frame(g, w, h, tex, x, y, z, rx = 0, ry = 0, wood = LWOOD) { const f = new THREE.Group(); f.position.set(x, y, z); f.rotation.set(rx, ry, 0, 'YXZ'); const back = new THREE.Mesh(BOXG, lam(wood)); back.scale.set(w + 0.07, h + 0.07, 0.05); back.castShadow = true; f.add(back); const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshLambertMaterial({ map: tex })); face.position.z = 0.03; f.add(face); const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: '#cfe6ff', transparent: true, opacity: 0.12, depthWrite: false })); gl.position.z = 0.035; f.add(gl); g.add(f); return f; }
    boxes(g, n, w, x0, y, z, rx, spreadW) {            // a row of display boxes across a counter / shelf
      for (let i = 0; i < n; i++) { const cols = this.rng.chance(0.5) ? 3 : 2, rows = this.rng.chance(0.5) ? 2 : 3; const bw = (w / n) * 0.86, bh = bw * (rows * 22 + 4) / (cols * 32); const tex = this.boxTexFor(cols, rows); this.frame(g, bw, bh, tex, x0 + (i + 0.5) * (spreadW / n), y + bh / 2 * Math.cos(rx), z, rx); }
    }
    boxTexFor(cols, rows) { const k = cols + 'x' + rows, pool = this.boxTexPool || (this.boxTexPool = {}); const arr = pool[k] || (pool[k] = []); if (arr.length < 5) { const t = boxTex(this.rng, cols, rows, ['#d8cfa8', '#c8d8c0', '#d8c0b8', '#c0c8d8'][arr.length % 4]); arr.push(t); return t; } return this.rng.pick(arr); }
    awning(w, d, y0, y1, zBack, ci, drop = 0.4) {      // a striped sloping awning over a stall (local coords): n stripes across the width
      const B = this.B, cl = CLOTH[ci % CLOTH.length], n = Math.max(4, Math.round(w / 0.28)), sw = w / n, len = Math.hypot(d, y1 - y0), ang = Math.atan2(y0 - y1, d);
      for (let i = 0; i < n; i++) B.box(sw * 1.02, 0.04, len, -w / 2 + sw * (i + 0.5), (y0 + y1) / 2, zBack + d / 2, cl[i % 2], ang, 0, 0, 0.03);
      for (let i = 0; i < n; i++) B.box(sw * 1.02, drop, 0.03, -w / 2 + sw * (i + 0.5), y1 - drop / 2, zBack + d + 0.0, cl[i % 2], 0, 0, 0, 0.03);
      return cl;
    }
    goods(kind, g, w, y, z) {                         // things lying on a counter
      const B = this.B, rng = this.rng;
      if (kind === 'flowers') { for (let i = 0; i < Math.floor(w / 0.55); i++) { const x = -w / 2 + 0.35 + i * 0.55; B.cyl(0.17, 0.13, 0.32, x, y + 0.16, z, '#8a5a3a', 8); const col = ['#e84a6a', '#f0c030', '#c070e0', '#f0f0f0', '#ff8a40'][i % 5]; for (let k = 0; k < 7; k++) { const fx = x + rng.range(-0.11, 0.11), fz = z + rng.range(-0.09, 0.09), fy = y + 0.42 + rng.range(0, 0.16); B.box(0.015, fy - y - 0.3, 0.015, fx, y + 0.3 + (fy - y - 0.3) / 2, fz, '#3a7a3a'); B.sph(0.045, fx, fy, fz, col); } B.sph(0.12, x, y + 0.36, z, '#4a9a3a', 1, 0.5, 1); } }
      else if (kind === 'nets') {   // butterfly nets (the same model as the player's net) standing in a bucket, hoops up, bags alternately towards the customer and the vendor
        B.cyl(0.28, 0.23, 0.42, 0, y + 0.21, z, '#6a4a2a', 10); B.cyl(0.285, 0.285, 0.04, 0, y + 0.4, z, IRON, 10);
        for (let i = -2; i <= 2; i++) { const outer = new THREE.Group(); outer.position.set(i * 0.1, y + 0.12, z); outer.rotation.z = -i * 0.14; const nm = makeNetModel(); nm.roll.rotation.z = (i % 2 ? Math.PI / 2 : -Math.PI / 2); nm.g.rotation.x = Math.PI / 2; nm.g.scale.setScalar(0.6); nm.g.traverse(o => { o.castShadow = true; o.frustumCulled = false; }); outer.add(nm.g); g.add(outer); }
        B.box(w - 0.3, 0.04, 0.3, 0, y + 0.02, z + 0.38, '#c8b078'); for (let i = 0; i < 3; i++) B.box(0.25, 0.14, 0.25, -w / 2 + 0.5 + i * 0.4, y + 0.09, z + 0.38, ['#e8d890', '#d8b0a0', '#b8d0c0'][i]); }
      else if (kind === 'jars') { for (let i = 0; i < Math.floor(w / 0.4); i++) { const x = -w / 2 + 0.3 + i * 0.4; B.cyl(0.1, 0.1, 0.22, x, y + 0.11, z + (i % 2) * 0.15, '#e0a030', 8); B.cyl(0.105, 0.105, 0.04, x, y + 0.24, z + (i % 2) * 0.15, '#6a4a2a', 8); } }
      else if (kind === 'books') { for (let i = 0; i < 14; i++) { const x = -w / 2 + 0.2 + i * (w - 0.4) / 14; B.box(0.1, 0.28 + (i % 3) * 0.04, 0.2, x, y + 0.16, z, ['#8a2a3a', '#2a5a8a', '#3a7a4a', '#c8a040', '#6a3a7a'][i % 5]); } }
      else if (kind === 'tea') { for (let i = 0; i < 2; i++) { const x = -w / 4 + i * w / 2; B.cyl(0.2, 0.26, 0.5, x, y + 0.25, z, '#c8a040', 10); B.cyl(0.14, 0.2, 0.14, x, y + 0.56, z, '#c8a040', 10); B.cyl(0.04, 0.04, 0.1, x, y + 0.68, z, '#2a2018', 6); } for (let i = 0; i < 5; i++) B.cyl(0.07, 0.05, 0.1, -w / 2 + 0.4 + i * 0.3, y + 0.05, z + 0.3, '#f0f0e8', 8); }
      else if (kind === 'pins') { for (let i = 0; i < 6; i++) { B.box(0.3, 0.12, 0.2, -w / 2 + 0.3 + i * 0.4, y + 0.06, z, ['#3a6a4a', '#8a3a3a', '#2a4a8a'][i % 3]); } B.sph(0.12, 0.2, y + 0.14, z + 0.25, '#e8d890', 1, 0.7, 1); }
    }
    crates(g, x, z, n = 3) { const B = this.B, rng = this.rng; const s0 = rng.range(0.45, 0.6), s1 = rng.range(0.4, 0.55); B.box(s0, s0, s0, x, s0 / 2, z, CRATE, 0, rng.range(-0.3, 0.3), 0); if (n > 1) B.box(s1, s1, s1, x + s0 * 0.85, s1 / 2, z + rng.range(-0.1, 0.1), '#b88a54', 0, rng.range(-0.4, 0.4), 0); if (n > 2) { const s2 = rng.range(0.34, 0.42); B.box(s2, s2, s2, x + rng.range(-0.05, 0.05), s0 + s2 / 2, z, '#98703c', 0, rng.range(-0.5, 0.5), 0); } if (rng.chance(0.5)) { B.cyl(0.28, 0.28, 0.7, x - 0.75, 0.35, z, '#7a5a38', 10); B.cyl(0.285, 0.285, 0.05, x - 0.75, 0.2, z, IRON, 10); B.cyl(0.285, 0.285, 0.05, x - 0.75, 0.5, z, IRON, 10); } }

    // ---- stall builders (local frame: customers at +z, the back at -z)
    stallTable(x, z, ry, o = {}) {
      const w = o.w || 3.2, d = 1.3, ci = o.ci || 0, kind = o.goods || 'boxes'; this.fp(x, z, w, d + 0.6, ry);
      const g = this.at(x, z, ry, g => {
        const B = this.B, cd = 0.78, zc = d / 2 - cd / 2; B.box(w, 0.88, cd, 0, 0.44, zc, LWOOD); B.box(w + 0.12, 0.07, cd + 0.08, 0, 0.92, zc + 0.02, WOOD); B.box(w - 0.1, 0.5, 0.04, 0, 0.5, d / 2 + 0.01, '#6a4a2c');
        for (const sx of [-1, 1]) { B.cyl(0.05, 0.06, 2.55, sx * (w / 2 - 0.02), 1.28, -d / 2 - 0.08, DWOOD, 6); B.cyl(0.05, 0.06, 2.15, sx * (w / 2 - 0.02), 1.08, d / 2 + 0.55, DWOOD, 6); }
        this.awning(w + 0.2, d + 0.8, 2.55, 2.17, -d / 2 - 0.1, ci);
        B.box(w, 1.5, 0.08, 0, 1.7, -d / 2 - 0.1, '#6a4a2c', 0, 0, 0, 0.1);                    // back board
        if (kind === 'boxes') { this.boxes(g, Math.max(2, Math.round(w / 0.85)), w - 0.2, -w / 2 + 0.1, 0.98, 0.27, -0.55, w - 0.2); for (let i = 0; i < 2; i++) this.frame(g, 0.6, 0.45, this.boxTexFor(3, 2), -w / 4 + i * w / 2, 1.85, -d / 2 - 0.04, 0); this.frame(g, 0.5, 0.4, this.boxTexFor(2, 2), 0, 1.8, -d / 2 - 0.04, 0); }
        else this.goods(kind, g, w - 0.4, 0.96, 0.27);
        if (o.sign) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.4), new THREE.MeshLambertMaterial({ map: signTex(o.sign, 96, 26, '#3a2414', '#f0d890', '#c8a040') })); sg.position.set(0, 1.96, d / 2 + 0.74); g.add(sg); }
        this.crates(g, w / 2 + 0.55, -0.1, 3);
        this.vendor(g, 0, -0.5, kind, o.sign);
        for (const sx of [-1, 1]) { B.box(0.3, 0.04, 0.04, sx * (w / 2 + 0.1), 2.13, d / 2 + 0.55, DWOOD); this.lamp(sx * (w / 2 + 0.22), 1.867, d / 2 + 0.55, 0.11, null, 0.1); }
      });
    }
    stallRound(x, z, ry, o = {}) {
      const ci = o.ci || 1;
      this.circAt(x, z, ry, 0, 0.35, 1.2); this.circAt(x, z, ry, 0, -0.8, 0.32);          // the counter + the space behind it, and the umbrella pole
      this.at(x, z, ry, g => {
        // a semicircular counter in front; the vendor stands behind its straight edge (nothing solid where their legs are), the umbrella pole behind the vendor
        const B = this.B, CZ = 0.35, VZ = -0.15, PZ = -0.85, H = Math.PI;
        B.geo(new THREE.CylinderGeometry(1.0, 1.05, 0.9, 16, 1, false, -H / 2, H), B.mat(0, 0.45, CZ), LWOOD); B.box(2.1, 0.9, 0.05, 0, 0.45, CZ, '#6a4a2c');
        B.geo(new THREE.CylinderGeometry(1.12, 1.12, 0.07, 16, 1, false, -H / 2, H), B.mat(0, 0.93, CZ), WOOD); B.box(2.24, 0.07, 0.05, 0, 0.93, CZ, WOOD);
        B.cyl(0.07, 0.08, 3.0, 0, 1.5, PZ, DWOOD, 8);
        const cl = CLOTH[ci % CLOTH.length], N = 10, R = 2.3; for (let i = 0; i < N; i++) { const gm = new THREE.ConeGeometry(R, 0.9, 1, 1, true, i * 2 * Math.PI / N, 2 * Math.PI / N); B.geo(gm, B.mat(0, 3.05, PZ), cl[i % 2], 0.02); }
        for (let i = 0; i < N; i++) { const a = (i + 0.5) * 2 * Math.PI / N; B.box(0.55, 0.2, 0.03, Math.sin(a) * (R - 0.03), 2.55, PZ + Math.cos(a) * (R - 0.03), cl[i % 2], 0.0, a, 0); }
        for (let i = 0; i < 5; i++) { const a = -Math.PI * 0.42 + i * Math.PI * 0.21; this.frame(g, 0.5, 0.375, this.boxTexFor(2, 2), Math.sin(a) * 0.72, 1.12, CZ + Math.cos(a) * 0.72, -0.5, a); }
        this.lamp(0.55, 2.2, CZ + 0.5, 0.12, null, 0.37); this.lamp(-0.55, 2.2, CZ + 0.5, 0.12, null, 0.37); B.cyl(0.04, 0.04, 0.2, 0, 3.55, PZ, BRASS, 6);
        this.vendor(g, 0, VZ, 'boxes', o.sign || 'Коллекции');
      });
    }
    stallKiosk(x, z, ry, o = {}) {
      const w = 3.2, d = 2.4, ci = o.ci || 2; this.fp(x, z, w, d + 0.5, ry);
      this.at(x, z, ry, g => {
        const B = this.B, pal = PALS[(o.pal || 0) % PALS.length], t = 0.08;
        B.box(w, 0.06, d, 0, 0.03, 0, DWOOD);                                                   // floor
        B.box(t, 2.6, d, -w / 2 + t / 2, 1.3, 0, pal.wall); B.box(t, 2.6, d, w / 2 - t / 2, 1.3, 0, pal.wall); B.box(w, 2.6, t, 0, 1.3, -d / 2 + t / 2, pal.wall);   // side and back walls
        B.box(w, 1.0, t, 0, 0.5, d / 2 - t / 2, '#7a5030'); B.box(w, 0.7, t, 0, 2.25, d / 2 - t / 2, pal.wall);                   // front wall below and above the serving window (y 1.0 .. 1.9)
        for (const sx of [-1, 1]) B.box(0.14, 0.9, 0.1, sx * (w / 2 - 0.07), 1.45, d / 2 - t / 2, DWOOD);                           // window jambs
        B.box(w, 0.06, d, 0, 2.62, 0, DWOOD); B.box(w + 0.1, 0.1, 0.12, 0, 2.62, d / 2, DWOOD);                                    // ceiling and the front beam
        B.box(w + 0.2, 0.08, 0.8, 0, 1.0, d / 2 + 0.32, LWOOD);                                                                       // counter shelf outside
        B.geo(gableGeo(w, d, 1.0, 0.3, true), B.mat(0, 2.65, 0), pal.roof, 0.08);
        this.awning(w - 0.2, 1.15, 2.5, 1.95, d / 2, ci, 0.3); for (const sx of [-1, 1]) B.cyl(0.04, 0.05, 1.95, sx * (w / 2 - 0.12), 0.98, d / 2 + 1.1, DWOOD, 6);
        this.boxes(g, 3, w - 0.5, -w / 2 + 0.25, 1.05, d / 2 + 0.34, -0.45, w - 0.5);
        for (let i = 0; i < 3; i++) this.frame(g, 0.7, 0.5, this.boxTexFor(3, 2), -1.0 + i * 1.0, 1.75, -d / 2 + 0.14, 0);     // frames on the inner back wall (seen through the window)
        // the sign stands on two posts above the roof edge, in front of everything (the awning cannot hide it)
        for (const sx of [-1, 1]) B.cyl(0.04, 0.04, 0.8, sx * 0.85, 3.05, d / 2 + 0.3, DWOOD, 6);
        const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.46), new THREE.MeshLambertMaterial({ map: signTex(o.sign || 'Коллекционные виды', 112, 28, '#243a30', '#f0d890', '#c8a040') })); sg.position.set(0, 3.1, d / 2 + 0.34); g.add(sg);
        this.vendor(g, 0, d / 2 - 0.75, 'boxes', o.sign); this.lamp(0, 2.3, 0, 0.14, null, 0.1);
        this.crates(g, w / 2 + 0.6, d / 2, 3);
        for (const sx of [-1, 1]) { B.box(0.3, 0.04, 0.04, sx * (w / 2 + 0.0), 1.98, d / 2 + 1.1, DWOOD); this.lamp(sx * (w / 2 + 0.14), 1.73, d / 2 + 1.1, 0.1, null, 0.1); }
      });
    }
    stallCart(x, z, ry, o = {}) {
      const ci = o.ci || 3; this.fp(x, z, 2.4, 1.6, ry);
      this.at(x, z, ry, g => {
        const B = this.B; B.box(2.0, 0.12, 1.1, 0, 0.62, 0, WOOD); B.box(2.0, 0.28, 0.06, 0, 0.8, 0.56, LWOOD); B.box(2.0, 0.28, 0.06, 0, 0.8, -0.56, LWOOD); B.box(0.06, 0.28, 1.1, 1.0, 0.8, 0, LWOOD); B.box(0.06, 0.28, 1.1, -1.0, 0.8, 0, LWOOD);
        for (const sz of [-1, 1]) { B.cyl(0.5, 0.5, 0.07, 0, 0.5, sz * 0.64, DWOOD, 14, Math.PI / 2, 0, 0); B.cyl(0.08, 0.08, 0.14, 0, 0.5, sz * 0.64, IRON, 6, Math.PI / 2, 0, 0); for (let k = 0; k < 4; k++) B.box(0.06, 0.98, 0.05, 0, 0.5, sz * 0.64, WOOD, 0, 0, k * Math.PI / 4); }   // the wheels stand on the long sides (axle across the cart)
        B.seg([1.0, 0.72, -0.3], [2.3, 0.62, -0.3], 0.07, WOOD); B.seg([1.0, 0.72, 0.3], [2.3, 0.62, 0.3], 0.07, WOOD); B.seg([2.3, 0.62, -0.3], [2.3, 0.62, 0.3], 0.07, WOOD);
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.cyl(0.03, 0.03, 1.5, sx * 0.9, 1.4, sz * 0.5, DWOOD, 5);
        const cl = CLOTH[ci % CLOTH.length]; for (let i = 0; i < 8; i++) B.box(0.26, 0.03, 1.3, -0.9 + i * 0.255, 2.13 - Math.abs(i - 3.5) * 0.02, 0, cl[i % 2], 0, 0, 0.0, 0.02);
        this.boxes(g, 3, 1.8, -0.9, 0.8, 0.1, -0.6, 1.8); this.crates(g, -1.6, 0.4, 2); this.lamp(0, 1.88, 0.45, 0.1, null, 0.11);
        this.vendor(g, 0, -1.0, 'boxes', o.sign || 'Коллекции');
      });
    }
    stallShelves(x, z, ry, o = {}) {   // a free-standing two-sided shelf unit with many boxes
      const w = 3.2; this.fp(x, z, w, 0.8, ry);
      this.at(x, z, ry, g => {
        const B = this.B; for (const sx of [-1, 1]) B.box(0.08, 2.4, 0.7, sx * (w / 2), 1.2, 0, DWOOD); for (let i = 0; i < 4; i++) B.box(w, 0.06, 0.7, 0, 0.35 + i * 0.6, 0, WOOD); B.box(w, 2.4, 0.04, 0, 1.2, 0, '#4a3020'); B.box(w + 0.3, 0.12, 0.9, 0, 2.45, 0, DWOOD);
        for (const side of [1, -1]) for (let r = 0; r < 3; r++) for (let i = 0; i < 4; i++) this.frame(g, 0.6, 0.42, this.boxTexFor(3, 2), -w / 2 + 0.45 + i * 0.77, 0.6 + r * 0.6 + 0.2, side * 0.33, -0.1 * side * 0 + (side > 0 ? -0.12 : 0.12), side > 0 ? 0 : Math.PI);
        const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.4), new THREE.MeshLambertMaterial({ map: signTex(o.sign || 'Тропические виды', 112, 26, '#2a1a3a', '#f0d890', '#c8a040') })); sg.position.set(0, 2.72, 0.0); g.add(sg); const sg2 = sg.clone(); sg2.rotation.y = Math.PI; g.add(sg2);
      });
    }
    // the merchant: a big stall with a glass display counter, price board, scale and coin stacks
    stallMerchant(x, z, ry) {
      const w = 5.6, d = 1.9; this.fp(x, z, w, d + 0.4, ry, 0.1); this.merchantPos = { x, z, ry };
      const g = this.at(x, z, ry, g => {
        const B = this.B; B.box(w, 0.9, 0.95, 0, 0.45, 0.48, '#6a3a22'); B.box(w + 0.16, 0.08, 1.05, 0, 0.94, 0.48, DWOOD); B.box(w - 0.3, 0.5, 0.04, 0, 0.5, d / 2 + 0.01, '#8a5030');
        // glass display case on top of the counter (front half)
        B.box(w - 0.4, 0.04, 0.9, 0, 0.99, 0.45, '#cfe6ff', 0, 0, 0, 0); B.box(0.04, 0.34, 0.9, -w / 2 + 0.2, 1.17, 0.45, DWOOD); B.box(0.04, 0.34, 0.9, w / 2 - 0.2, 1.17, 0.45, DWOOD); B.box(w - 0.4, 0.04, 0.04, 0, 1.34, 0.9, DWOOD);
        for (let i = 0; i < 4; i++) this.frame(g, 0.8, 0.58, this.boxTexFor(3, 2), -1.58 + i * 1.05, 1.18, 0.45, -1.3);
        for (const sx of [-1, 1]) { B.cyl(0.07, 0.08, 3.2, sx * (w / 2 + 0.05), 1.6, -d / 2 - 0.1, DWOOD, 6); B.cyl(0.07, 0.08, 2.6, sx * (w / 2 + 0.05), 1.3, d / 2 + 0.8, DWOOD, 6); }
        this.awning(w + 0.4, d + 1.0, 3.2, 2.6, -d / 2 - 0.1, 0, 0.5); B.box(w, 2.2, 0.1, 0, 1.9, -d / 2 - 0.12, '#4a2c18');
        for (let r = 0; r < 2; r++) for (let i = 0; i < 4; i++) this.frame(g, 0.9, 0.62, this.boxTexFor(3, 2), -w / 2 + 0.85 + i * 1.3, 1.45 + r * 0.75, -d / 2 - 0.05, 0);
        const sg = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.7), new THREE.MeshLambertMaterial({ map: signTex('СКУПКА БАБОЧЕК\nПлатим монетами', 136, 30, '#5a1a1a', '#ffe8a0', '#e8c060') })); sg.position.set(0, 2.25, d / 2 + 0.98); g.add(sg);
        const pb = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1), new THREE.MeshLambertMaterial({ map: signTex('Цены:\nобычные 5-45\nредкие 15-45\nаберрант x6\nокеан 150+', 60, 74, '#1e2a22', '#f0f0dc', '#8a6a3a') })); pb.position.set(w / 2 - 0.1, 1.3, d / 2 + 0.55); pb.rotation.y = -0.3; g.add(pb); B.box(0.05, 0.9, 0.05, w / 2 - 0.1, 0.45, d / 2 + 0.52, WOOD);
        for (let i = 0; i < 3; i++) { for (let k = 0; k < 4 + i; k++) B.cyl(0.07, 0.07, 0.025, -2.45 + i * 0.2, 0.99 + k * 0.026 + 0.015, 0.45, BRASS, 8); }   // coin stacks on the counter
        B.cyl(0.18, 0.2, 0.08, 2.4, 1.03, 0.5, IRON, 8); B.cyl(0.02, 0.02, 0.45, 2.4, 1.28, 0.5, IRON, 5); B.box(0.5, 0.025, 0.04, 2.4, 1.5, 0.5, IRON); for (const sx of [-1, 1]) { const px = 2.4 + sx * 0.24; B.cyl(0.08, 0.06, 0.03, px, 1.36, 0.5, BRASS, 8); B.box(0.03, 0.03, 0.03, px, 1.5, 0.5, IRON); for (const [dx, dz] of [[0.075, 0], [-0.075, 0], [0, 0.075], [0, -0.075]]) B.seg([px, 1.5, 0.5], [px + dx, 1.375, 0.5 + dz], 0.008, '#3a3a40'); }   // scale pans hang from the beam on four cordss
        B.sph(0.16, 2.0, 1.15, 0.7, '#6a4a2a', 1, 1.15, 1); for (const sx of [-1, 1]) { B.box(0.5, 0.05, 0.05, sx * (w / 2 + 0.3), 2.55, d / 2 + 0.8, DWOOD); this.lamp(sx * (w / 2 + 0.5), 2.2, d / 2 + 0.8, 0.16, '#ffd870', 0.12); }
        this.crates(g, -w / 2 - 0.5, 0, 3); this.crates(g, w / 2 + 0.6, 0.0, 3);
        const m = person({ body: '#7a2a3a', pants: '#2a2630', apron: '#e8e0d0', hat: 'top', skin: '#e0b890' }); m.position.set(0.9, 0, -0.45); m.rotation.y = Math.PI; m.userData.base = m.position.y; g.add(m); this.merchant = m; const ns = nameSprite('Торговец бабочками', '#ffe8a0'); ns.position.set(0.9, 2.55, -0.45); g.add(ns);
      });
      this.stations.push({ id: 'sell', x: x + Math.sin(ry) * 1.6 + 0.0, z: z + Math.cos(ry) * 1.6, r: 2.4, label: () => 'E — продать бабочек торговцу' });
    }
    vendor(g, x, z, key, sign) {
      const pr = PROF[key] || PROF.boxes, p = person(Object.assign({ skin: this.rng.pick(['#e8c8a0', '#d8a878', '#c8946a']) }, pr.o)); p.position.set(x, 0, z); p.rotation.y = Math.PI; p.userData.ph = this.rng.range(0, 6); g.add(p); this.vendors.push(p);
      const line = typeof pr.line === 'function' ? pr.line(sign || 'Коллекции') : pr.line; const wp = new THREE.Vector3(); g.updateMatrixWorld(true); p.getWorldPosition(wp);
      this.stations.push({ id: 'chat', x: wp.x + Math.sin(g.rotation.y) * 1.3, z: wp.z + Math.cos(g.rotation.y) * 1.3, r: 1.9, line: [pr.title, line], label: () => `E — поговорить: ${pr.title}` });
    }

    // a stall standing against a wall: side N/S = wall at z (customers on the street side), W/E = wall at x
    wallStall(type, side, wall, along, o = {}) {
      const off = { table: 0.85, kiosk: 1.35, cart: 1.15 }[type] || 1, f = { N: [along, wall + off, 0], S: [along, wall - off, Math.PI], W: [wall + off, along, Math.PI / 2], E: [wall - off, along, -Math.PI / 2] }[side];
      const fn = { table: 'stallTable', kiosk: 'stallKiosk', cart: 'stallCart' }[type]; this[fn](f[0], f[1], f[2], o);
    }
    buildStalls() {
      const W = (t, s, w, a, o) => this.wallStall(t, s, w, a, o);
      // main street, north side (backs against the houses at z = -4)
      W('table', 'N', -4, -24.4, { goods: 'flowers', ci: 2, sign: 'Цветы' }); W('kiosk', 'N', -4, -19.6, { ci: 0, pal: 1, sign: 'Парусники' }); this.stallMerchant(-6.2, -4 + 1.15, 0);
      W('table', 'N', -4, -0.5, { ci: 3, sign: 'Нимфалиды' }); W('cart', 'N', -4, 4.4, { ci: 4, sign: 'Бабочки в коробках' }); W('table', 'N', -4, 8.6, { ci: 5, sign: 'Голубянки' });
      // main street, south side
      W('table', 'S', 4, -18, { goods: 'nets', ci: 1, sign: 'Сачки' }); W('kiosk', 'S', 4, -12.5, { ci: 1, pal: 2, sign: 'Тропики' }); W('table', 'S', 4, -6, { goods: 'books', ci: 4, sign: 'Книги' }); W('table', 'S', 4, -2.2, { goods: 'tea', ci: 6, sign: 'Чай' });
      W('table', 'S', 4, 6.4, { goods: 'jars', ci: 0, sign: 'Мёд' }); W('cart', 'S', 4, 10.6, { ci: 2, sign: 'Коллекции' }); W('table', 'S', 4, 14.2, { ci: 3, sign: 'Африка' });
      // first alley (north, x -16..-12)
      W('table', 'W', -16, -8, { ci: 1, sign: 'Альпы' }); W('kiosk', 'W', -16, -13.2, { ci: 5, pal: 4, sign: 'Ночные' }); W('table', 'E', -12, -9.5, { goods: 'pins', ci: 3, sign: 'Булавки' }); W('table', 'E', -12, -17.2, { goods: 'flowers', ci: 5, sign: 'Букеты' }); this.stallShelves(-14, -22.4, Math.PI / 2, { sign: 'Мотыльки' });
      // second alley (north, x 12..16)
      W('table', 'W', 12, -8, { ci: 0, sign: 'Прерия' }); W('kiosk', 'W', 12, -14.5, { ci: 6, pal: 3, sign: 'Азия' }); W('table', 'E', 16, -9.5, { goods: 'jars', ci: 6, sign: 'Мёд' }); W('table', 'E', 16, -19.5, { ci: 2, sign: 'Редкие виды' });
      // third alley (south, x 0..4)
      W('table', 'W', 0, 8, { ci: 2, sign: 'Европа' }); W('cart', 'W', 0, 14, { ci: 1, sign: 'Коллекции' }); W('kiosk', 'W', 0, 20.5, { ci: 4, pal: 0, sign: 'Австралия' }); W('table', 'E', 4, 10.5, { goods: 'flowers', ci: 5, sign: 'Букеты' }); W('table', 'E', 4, 16, { goods: 'books', ci: 3, sign: 'Книги' });
      // short alley (south-west): the tea garden
      W('table', 'W', -24, 8.5, { goods: 'tea', ci: 6, sign: 'Чайная' }); W('table', 'E', -20, 9.5, { goods: 'jars', ci: 2, sign: 'Мёд' }); for (const [tx, tz] of [[-23.4, 14.2], [-20.6, 14.2], [-22, 17.6]]) this.teaTable(tx, tz);
      // east plaza: round stalls around the fountain
      for (const [sx, sz] of [[26.7, 5.1], [26.7, -5.1], [21.3, 5.1], [21.3, -5.1]]) this.stallRound(sx, sz, Math.atan2(24 - sx, 0 - sz) + Math.PI * 0, { ci: Math.abs(Math.round(sx + sz)) % 7, sign: 'Бабочки' });
    }
    teaTable(x, z) { const B = this.B, ci = this.rng.int(0, CLOTH.length - 1), cl = CLOTH[ci]; B.cyl(0.55, 0.55, 0.05, x, 0.76, z, WOOD, 12); B.cyl(0.06, 0.08, 0.76, x, 0.38, z, DWOOD, 6); B.cyl(0.06, 0.06, 2.4, x, 1.2, z, DWOOD, 6); for (let i = 0; i < 8; i++) B.geo(new THREE.ConeGeometry(1.3, 0.5, 1, 1, true, i * Math.PI / 4, Math.PI / 4), B.mat(x, 2.35, z), cl[i % 2], 0.02); for (const [dx, dz] of [[0.85, 0], [-0.85, 0]]) { B.cyl(0.2, 0.2, 0.05, x + dx, 0.45, z + dz, LWOOD, 8); B.cyl(0.03, 0.03, 0.45, x + dx, 0.22, z + dz, DWOOD, 5); } B.cyl(0.07, 0.05, 0.1, x, 0.84, z, '#f0f0e8', 8); this.addCircle(x, z, 0.62); }

    buildDecor() {
      const B = this.B, G = this.G, S = this.scene, rng = this.rng;
      // cloth sails, lantern strings and pennants: only between two real house walls (never across alley mouths or the open plazas)
      const walls2 = (x, a, b) => this.hasWall(x, a) && this.hasWall(x, b);
      for (let i = 0; i < 7; i++) { const x = -24 + i * 8 + rng.range(-1, 1), cl = rng.pick(CLOTH), y = 5.3 + rng.range(-0.3, 0.3); if (!walls2(x - 1.4, -4.6, 4.6) || !walls2(x + 1.4, -4.6, 4.6)) continue; for (let k = 0; k < 10; k++) { const t = (k + 0.5) / 10, sag = Math.sin(t * Math.PI) * 0.35; B.box(2.4 + rng.range(0, 0.8), 0.03, 0.84, x, y - sag, -4.0 + t * 8.0, cl[k % 2], 0, 0, 0, 0.02); } B.box(2.6, 0.06, 0.1, x, y + 0.02, -3.98, DWOOD); B.box(2.6, 0.06, 0.1, x, y + 0.02, 3.98, DWOOD); }
      for (let i = 0; i < 12; i++) { const x = -26 + i * 4.7; if (!walls2(x, -4.6, 4.6)) continue; B.rope([x, 4.4, -4.0], [x, 4.4, 4.0], 0.5, '#2a1c10', 0.025, 10); for (let k = 0; k < 5; k++) { const t = (k + 0.5) / 5; this.lamp(x, 4.4 - Math.sin(t * Math.PI) * 0.5 - 0.14 - 0.21, -4.0 + t * 8.0, 0.16, null, 0.14); } }
      for (let i = 0; i < 8; i++) { const x = -26 + i * 7 + 1.5, col = rng.pick(['#e84a4a', '#f0c030', '#3a8ae0', '#3ac07a', '#d86ad0']); if (!this.hasWall(x, -4.6) || !this.hasWall(x + 4.5, 4.6)) continue; const a = [x, 5.0, -4.0], b = [x + 4.5, 5.0, 4.0]; B.rope(a, b, 0.7, '#2a1c10', 0.02, 14); for (let k = 1; k < 14; k++) { const t = k / 14, px = lerp(a[0], b[0], t), py = lerp(a[1], b[1], t) - 0.7 * Math.sin(t * Math.PI), pz = lerp(a[2], b[2], t); B.tri([px - 0.12, py, pz - 0.05], [px + 0.12, py, pz + 0.05], [px, py - 0.3, pz], rng.pick(['#e84a4a', '#f0c030', '#3a8ae0', '#3ac07a', '#d86ad0', '#f2e8d0'])); } }
      // lantern strings across the alleys (wall to wall)
      const across = (axis, c, a0, a1) => { const p0 = axis === 'x' ? [a0, 4.2, c] : [c, 4.2, a0], p1 = axis === 'x' ? [a1, 4.2, c] : [c, 4.2, a1]; const e0 = axis === 'x' ? [a0 - 0.6, c] : [c, a0 - 0.6], e1 = axis === 'x' ? [a1 + 0.6, c] : [c, a1 + 0.6]; if (!this.hasWall(e0[0], e0[1]) || !this.hasWall(e1[0], e1[1])) return; B.rope(p0, p1, 0.4, '#2a1c10', 0.025, 8); for (let k = 0; k < 3; k++) { const t = (k + 0.5) / 3, x = lerp(p0[0], p1[0], t), z = lerp(p0[2], p1[2], t); this.lamp(x, 4.2 - Math.sin(t * Math.PI) * 0.4 - 0.12 - 0.195, z, 0.15, null, 0.12); } };
      for (let z = -8; z > -23; z -= 4.5) { across('x', z, -16, -12); across('x', z, 12, 16); } for (let z = 7; z < 22; z += 4.5) across('x', z, 0, 4); for (let z = 7; z < 14; z += 4.5) across('x', z, -24, -20);
      // the fountain plaza: a string of lanterns between the lamp posts across the fountain
      B.rope([24, 3.8, -8.2], [24, 3.8, 8.2], 0.9, '#2a1c10', 0.025, 14); for (let k = 0; k < 7; k++) { const t = (k + 0.5) / 7; this.lamp(24, 3.8 - Math.sin(t * Math.PI) * 0.9 - 0.14 - 0.21, lerp(-8.2, 8.2, t), 0.16, null, 0.14); }
      // hanging banners with butterflies on the house walls (only where the wall exists)
      const bs = SPECIES.filter(s => s.biome !== 'ocean'); for (let i = 0; i < 14; i++) { const north = i % 2 === 0, x = -26 + Math.floor(i / 2) * 8 + 1.2 + (north ? 0 : 3), z = north ? -4.08 : 4.08; if (!this.hasWall(x - 0.4, north ? -4.6 : 4.6) || !this.hasWall(x + 0.4, north ? -4.6 : 4.6)) continue; const sp = bs[(i * 37 + 5) % bs.length]; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6), new THREE.MeshLambertMaterial({ map: bannerTex(sp, ['#3a2a5a', '#2a4a5a', '#5a2a2a', '#2a5a3a'][i % 4]), side: THREE.DoubleSide })); m.position.set(x, 3.6, z + (north ? 0.06 : -0.06)); if (!north) m.rotation.y = Math.PI; S.add(m); B.box(1.0, 0.07, 0.07, x, 4.45, z + (north ? 0.08 : -0.08), DWOOD); }
      // lamp posts along the alleys and plazas
      const post = (x, z) => { B.cyl(0.08, 0.1, 3.2, x, 1.6, z, IRON, 6); B.box(0.5, 0.06, 0.5, x, 3.25, z, IRON); this.lamp(x, 3.5, z, 0.22, '#ffd070', 0); B.box(0.3, 0.08, 0.3, x, 3.88, z, IRON); this.addCol(x - 0.15, x + 0.15, z - 0.15, z + 0.15); this.lampPositions = (this.lampPositions || []).concat([[x, 3.5, z]]); };
      [[-14, -6], [-14, -18.6], [14, -6], [14, -17.8], [2, 6], [2, 11.5], [2, 17.8], [-22, 6], [19, -3], [19, 3], [29, -6], [29, 6], [24, -8.2], [24, 8.2]].forEach(([x, z]) => post(x, z));
      // barrels, sacks, crates, planters, hay in nooks
      for (let i = 0; i < 40; i++) { const side = rng.chance(0.5) ? -1 : 1, x = -26 + rng.range(0, 52), z = side * rng.range(3.55, 3.85); if (x > -3 && x < 3 && side > 0) continue; const zz = z + (z > 0 ? -0.35 : 0.35); if (this.colliders.some(k => x + 0.8 > k.x0 && x - 0.8 < k.x1 && zz + 0.5 > k.z0 && zz - 0.5 < k.z1)) continue; this.deco(x, z, rng.int(0, 3)); }
      // planters with flowers along the alleys
      for (const [x, z] of [[-15.25, -4.9], [-12.75, -4.9], [12.75, -4.9], [15.25, -4.9], [0.75, 4.9], [3.25, 4.9], [-23.25, 4.9], [-20.75, 4.9]]) this.planter(x, z);
    }
    deco(x, z, kind) { const B = this.B, rng = this.rng; const zz = z + (z > 0 ? -0.35 : 0.35);
      if (kind === 0) { B.cyl(0.3, 0.3, 0.8, x, 0.4, zz, '#7a5a38', 10); B.cyl(0.305, 0.305, 0.05, x, 0.22, zz, IRON, 10); B.cyl(0.305, 0.305, 0.05, x, 0.6, zz, IRON, 10); this.addCol(x - 0.35, x + 0.35, zz - 0.35, zz + 0.35); }
      else if (kind === 1) { B.sph(0.3, x, 0.28, zz, '#c8b088', 1, 0.9, 0.9); B.sph(0.26, x + 0.35, 0.24, zz + 0.05, '#bca47c', 1, 0.9, 0.9); this.addCol(x - 0.4, x + 0.7, zz - 0.35, zz + 0.35); }
      else if (kind === 2) { B.box(0.55, 0.55, 0.55, x, 0.28, zz, CRATE, 0, rng.range(-0.3, 0.3), 0); B.box(0.45, 0.45, 0.45, x + 0.1, 0.78, zz, '#b88a54', 0, rng.range(-0.3, 0.3), 0); this.addCol(x - 0.4, x + 0.4, zz - 0.4, zz + 0.4); }
      else { B.box(0.9, 0.45, 0.5, x, 0.23, zz, '#c8aa58', 0, rng.range(-0.1, 0.1), 0); B.box(0.8, 0.3, 0.45, x + 0.05, 0.6, zz, '#d8ba68', 0, 0.1, 0); this.addCol(x - 0.5, x + 0.5, zz - 0.3, zz + 0.3); } }
    planter(x, z) { const B = this.B, rng = this.rng; B.box(1.2, 0.45, 0.5, x, 0.23, z, LWOOD); B.box(1.1, 0.06, 0.4, x, 0.46, z, '#4a3020'); for (const dx of [-0.35, 0, 0.35]) B.sph(0.27, x + dx, 0.62, z, '#4a9a3a', 1, 0.7, 0.85); for (let i = 0; i < 10; i++) { const fx = x + rng.range(-0.5, 0.5), fz = z + rng.range(-0.1, 0.1), top = 0.62 + 0.19 * Math.sqrt(Math.max(0, 1 - Math.pow(((fx - x) % 0.35) / 0.27, 2))) * 0.9 + 0.02; B.sph(0.06, fx, top + 0.04, fz, rng.pick(['#e84a6a', '#f0c030', '#c070e0', '#f0f0f0', '#ff8a40'])); } this.addCol(x - 0.65, x + 0.65, z - 0.3, z + 0.3); }
    // ---- time of day: the sky dome, the sun, lanterns and lit windows follow the clock
    realHour() { if (this.hourOverride !== undefined) return this.hourOverride; const d = new Date(); return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600; }
    setHour(h) { this.hourOverride = h; this.applyTime(h); }
    applyTime(h) {
      this.hour = h; const a = Math.PI * (h - 5.5) / 15, elev = Math.sin(a), dayK = smooth(-0.12, 0.25, elev);
      this.sunDir = new THREE.Vector3(Math.cos(a) * 0.9, Math.max(elev, 0.03) * 0.9 + 0.03, 0.35).normalize();
      this.sun.intensity = 1.2 * smooth(0.0, 0.18, elev); this.sun.color.set(mixHex('#ff8a40', '#fff0cc', smooth(0, 0.55, elev))); this.moonL.intensity = 0.45 * (1 - dayK); this.moonL.position.set(-20, 40, 10);
      this.hemi.intensity = 0.32 + 0.34 * dayK; this.hemi.color.set(mixHex('#3a4a7a', '#dfefff', dayK)); this.hemi.groundColor.set(mixHex('#14181e', '#7a6a50', dayK));
      const tw = Math.max(0, 1 - Math.abs(elev - 0.03) / 0.22), top = mixHex(mixHex('#04081a', '#4a90e0', dayK), '#5a5a9a', tw * 0.35), bot = mixHex(mixHex('#101c38', '#c8e6f6', dayK), '#ff8a50', tw * 0.8);
      this.scene.fog.color.set(bot); this.scene.background.set(bot);
      const x = this.skyCv.getContext('2d'), W = 512, H = 256; const gr = x.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, top); gr.addColorStop(0.5, bot); gr.addColorStop(1, bot); x.fillStyle = gr; x.fillRect(0, 0, W, H);
      const uv = d => ({ x: ((Math.atan2(d.z, -d.x) + 2 * Math.PI) % (2 * Math.PI)) / (2 * Math.PI) * W, y: Math.acos(clamp(d.y, -1, 1)) / Math.PI * H });
      if (dayK < 0.8) { const sr = new Rng(21); x.fillStyle = `rgba(255,255,255,${(1 - dayK) * 0.9})`; for (let i = 0; i < 160; i++) { const px = sr.int(0, W - 1), py = sr.int(0, 100); x.fillRect(px, py, 1, 1); } }
      const sp = uv(this.sunDir); x.fillStyle = 'rgba(255,220,150,0.35)'; x.beginPath(); x.arc(sp.x, sp.y, 14, 0, 6.3); x.fill(); x.fillStyle = mixHex('#ff8a40', '#fff4c8', smooth(0, 0.5, elev)); x.beginPath(); x.arc(sp.x, sp.y, 7, 0, 6.3); x.fill();
      if (dayK < 0.7) { const mp = uv(new THREE.Vector3(-0.5, 0.7, -0.3).normalize()); x.fillStyle = `rgba(200,220,255,${0.3 * (1 - dayK)})`; x.beginPath(); x.arc(mp.x, mp.y, 12, 0, 6.3); x.fill(); x.fillStyle = '#eef2ff'; x.beginPath(); x.arc(mp.x, mp.y, 6, 0, 6.3); x.fill(); }
      x.fillStyle = mixHex('#2a3450', '#ffffff', dayK); x.globalAlpha = 0.4 + 0.4 * dayK; for (let i = 0; i < 9; i++) { const cx = (i * 61 + 20) % W, cy = 50 + (i * 23) % 60; x.fillRect(cx, cy, 36, 4); x.fillRect(cx + 6, cy - 3, 22, 4); } x.globalAlpha = 1; this.skyTex.needsUpdate = true;
      const night = 1 - dayK; this.winMats.forEach(m => { m.emissiveIntensity = 0.95 * night; }); this.night = night;
      // a handful of real lights near the plazas and the merchant at night
      if (!this.lights.length) { const pts = [[-6.2, 2.4, -0.6], [24, 3.2, 0], [14, 3.4, -24], [2, 3.4, 22], [-14, 3.4, -26], [-22, 3.0, 12], [10, 3, 0], [-16, 3, 0]]; pts.forEach(p => { const L = new THREE.PointLight('#ffb860', 0, 15, 1.6); L.position.set(...p); this.scene.add(L); this.lights.push(L); }); }
      this.lights.forEach(L => { L.intensity = 1.7 * night; });
    }

    // ------------------------------------------------------------ per-frame
    update(dt, inp) {
      this.t += dt; const P = this.player;
      P.yaw -= inp.dx * 0.0022; P.pitch = clamp(P.pitch - inp.dy * 0.0022, -1.3, 1.3); inp.dx = inp.dy = 0;
      P.yaw += ((inp.keys.has('ArrowLeft') ? 1 : 0) - (inp.keys.has('ArrowRight') ? 1 : 0)) * dt * 1.9; P.pitch = clamp(P.pitch + ((inp.keys.has('ArrowUp') ? 1 : 0) - (inp.keys.has('ArrowDown') ? 1 : 0)) * dt * 1.4, -1.3, 1.3);
      let mx = 0, mz = 0; if (inp.keys.has('KeyW')) mz -= 1; if (inp.keys.has('KeyS')) mz += 1; if (inp.keys.has('KeyA')) mx -= 1; if (inp.keys.has('KeyD')) mx += 1;
      const len = Math.hypot(mx, mz); if (len > 0) { mx /= len; mz /= len; }
      const spd = inp.keys.has('ShiftLeft') ? 5.2 : 3.0; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
      P.vel.x = damp(P.vel.x, (fx * -mz + rx * mx) * spd, 12, dt); P.vel.y = damp(P.vel.y, (fz * -mz + rz * mx) * spd, 12, dt);
      let nx = P.pos.x + P.vel.x * dt, nz = P.pos.z + P.vel.y * dt; const pr = 0.3;
      for (const k of this.colliders) { if (nx > k.x0 - pr && nx < k.x1 + pr && nz > k.z0 - pr && nz < k.z1 + pr) { const l = nx - (k.x0 - pr), r = (k.x1 + pr) - nx, tp = nz - (k.z0 - pr), bt = (k.z1 + pr) - nz; const m = Math.min(l, r, tp, bt); if (m === l) nx = k.x0 - pr; else if (m === r) nx = k.x1 + pr; else if (m === tp) nz = k.z0 - pr; else nz = k.z1 + pr; } }
      for (let it = 0; it < 2; it++) for (const k of this.circles) { const dx = nx - k.x, dz = nz - k.z, d = Math.hypot(dx, dz), R = k.r + pr; if (d < R) { if (d < 1e-4) { nx = k.x + R; } else { nx = k.x + dx / d * R; nz = k.z + dz / d * R; } } }
      nx = clamp(nx, BOUND.x0, BOUND.x1); nz = clamp(nz, BOUND.z0, BOUND.z1);
      const moved = Math.hypot(nx - P.pos.x, nz - P.pos.z); P.pos.x = nx; P.pos.z = nz; P.moving = moved > 0.002; P.bob += moved * 2.2; P.stepD += moved;
      if (P.stepD > 0.8) { P.stepD = 0; Snd.sfx.step('stone'); }
      this.camera.position.set(P.pos.x, 1.62 + Math.sin(P.bob) * 0.025, P.pos.z); this.camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
      this.prompt = this.nearest(); this.toastT = Math.max(0, this.toastT - dt);
      this.animate(dt);
    }
    nearest() {
      const P = this.player; let best = null, bs = 9; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw);
      for (const s of this.stations) { const dx = s.x - P.pos.x, dz = s.z - P.pos.z, d = Math.hypot(dx, dz); if (d > s.r) continue; const dot = d > 0.9 ? (dx * fx + dz * fz) / d : 1; if (dot < -0.1 && s.id !== 'exit' && s.id !== 'cabinet') continue; const sc = d / s.r; if (sc < bs) { bs = sc; best = s; } }
      return best;
    }
    animate(dt) {
      if (Math.abs(this.realHour() - this.hour) > 1 / 120) this.applyTime(this.realHour());
      const P = this.player, t = this.t;
      // the sun's shadow box follows the player
      this.sun.target.position.set(Math.round(P.pos.x), 0, Math.round(P.pos.z)); this.sun.position.copy(this.sun.target.position).addScaledVector(this.sunDir, 70); this.moonL.target.position.copy(this.sun.target.position); this.dome.position.copy(this.camera.position);
      if (this.waterTex) { this.waterTex.offset.x = t * 0.03; this.waterTex.offset.y = t * 0.02; }
      for (const v of this.vendors) { v.position.y = Math.sin(t * 1.4 + v.userData.ph) * 0.01; v.userData.head.rotation.y = Math.sin(t * 0.6 + v.userData.ph) * 0.35; v.userData.arms[1].rotation.x = Math.sin(t * 1.1 + v.userData.ph) * 0.06; }
      if (this.merchant) { const m = this.merchant; m.userData.head.rotation.y = Math.sin(t * 0.7) * 0.3; m.userData.arms[0].rotation.x = Math.sin(t * 1.3) * 0.08; m.userData.arms[1].rotation.x = Math.sin(t * 1.3 + 1) * 0.08; }
      if (this.remotes) { this.remotes.update(dt); this.netAcc += dt; if (this.netAcc > 0.1) { this.netAcc = 0; Net.send('pos', { x: Math.round(P.pos.x * 100) / 100, y: 1.65, z: Math.round(P.pos.z * 100) / 100, yaw: Math.round(P.yaw * 100) / 100, pitch: Math.round(P.pitch * 100) / 100, nz: 0, fl: 0, sw: 0, sp: Math.round(Math.hypot(P.vel.x, P.vel.y) * 10) / 10, st: 0 }); } }
    }

    // ------------------------------------------------------------ interaction
    open(name) { this.ov = name; this.hooks.unlock(); if (name === 'sell') this.sellOpen(); }
    close() { this.ov = null; this.hooks.lock(); }
    interact() {
      const s = this.prompt; if (!s) return;
      if (s.id === 'sell') { Snd.sfx.page(); this.open('sell'); }
      else if (s.id === 'chat') { this.toast(`${s.line[0]}: «${s.line[1]}»`, 5); Snd.sfx.click(); }
      else if (s.id === 'exit') { Snd.sfx.door(); this.hooks.exit(); }
      else if (s.id === 'cabinet') { Snd.sfx.door(); this.hooks.cabinet(); }
    }
    key(e) {
      const ov = this.ov;
      if (!ov) { if (e.code === 'KeyE') this.interact(); else if (e.code === 'Tab') { Snd.sfx.page(); this.open('journal'); } else if (e.code === 'KeyP' || e.code === 'Escape') { this.ov = 'pause'; this.hooks.unlock(); } return; }
      if (ov === 'help') { this.closeHelp(); return; }
      if (ov === 'pause') { if (e.code === 'Escape') { this.ov = null; this.hooks.lock(); } return; }
      if (ov === 'journal') { const J = Screens.journal, nb = BIOMES.length; if (e.code === 'Escape' && J.escape()) { /* back from the aberrants list */ } else if (e.code === 'Escape' || e.code === 'Tab') { Snd.sfx.page(); this.close(); } else if (e.code === 'ArrowLeft') { J.tab = (J.tab + nb - 1) % nb; J.sel = 0; } else if (e.code === 'ArrowRight') { J.tab = (J.tab + 1) % nb; J.sel = 0; } else if (e.code === 'ArrowUp') J.turn(-1); else if (e.code === 'ArrowDown') J.turn(1); return; }
      if (ov === 'sell') { if (e.code === 'Escape' || e.code === 'KeyE') this.close(); else if (e.code === 'ArrowUp') this.sellMove(-1); else if (e.code === 'ArrowDown') this.sellMove(1); else if (e.code === 'Enter' || e.code === 'Space') this.sellOne(); else if (e.code === 'Tab') this.sellTab(1); }
    }
    click(x, y) {
      const ov = this.ov;
      if (ov === 'pause') { const id = this.pauseButtons().find(b => UIK.hit(b, x, y)); this.pauseAct(id && id.id); }
      else if (ov === 'help') this.closeHelp();
      else if (ov === 'journal') { if (Screens.journal.click(x, y) === 'close') { Snd.sfx.page(); this.close(); } }
      else if (ov === 'sell') this.sellClick(x, y);
    }
    wheel(dy) { if (this.ov === 'journal') Screens.journal.turn(dy > 0 ? 1 : -1); else if (this.ov === 'sell') this.sellMove(dy > 0 ? 1 : -1, true); }
    closeHelp() { if (this.helpBack) { this.ov = 'pause'; } else { this.ov = null; this.hooks.lock(); } this.helpBack = false; }
    pauseButtons() { const s = Save.data.settings, x = SW / 2 - 90; return [{ id: 'resume', label: 'Продолжить', x, y: 76, w: 180, h: 20, size: 10 }, { id: 'help', label: 'Управление', x, y: 102, w: 180, h: 16 }, { id: 'sound', label: s.sound ? 'Звук: вкл' : 'Звук: выкл', x, y: 124, w: 88, h: 16 }, { id: 'music', label: s.music ? 'Музыка: вкл' : 'Музыка: выкл', x: x + 92, y: 124, w: 88, h: 16 }, { id: 'cabinet', label: 'В кабинет энтомолога', x, y: 146, w: 180, h: 16 }, { id: 'map', label: 'В экспедицию (карта мира)', x, y: 168, w: 180, h: 16 }, { id: 'title', label: 'Главное меню', x, y: 190, w: 180, h: 16 }]; }
    pauseAct(id) {
      if (!id) return; Snd.sfx.click();
      if (id === 'resume') { this.ov = null; this.hooks.lock(); } else if (id === 'help') { this.ov = 'help'; this.helpBack = true; } else if (id === 'sound') this.hooks.toggle('sound'); else if (id === 'music') this.hooks.toggle('music'); else if (id === 'cabinet') this.hooks.cabinet(); else if (id === 'map') this.hooks.map(); else if (id === 'title') this.hooks.title();
    }

    // ------------------------------------------------------------ selling
    sellTabs() { return [{ id: 'all', label: 'Все', f: () => true }, { id: 'spread', label: 'Расправленные', f: i => i.spread }, { id: 'raw', label: 'Сырые', f: i => !i.spread }, { id: 'ab', label: 'Аберранты', f: i => i.isAb || i.isOcean }]; }
    sellOpen() { this.sell = { tab: 0, sel: 0, scroll: 0, msg: 'Добро пожаловать! Что у вас сегодня?', msgT: 4, last: 0, flash: 0, confirm: 0, clickT: 0, clickIdx: -1 }; this.sellRefresh(); }
    sellRefresh() {
      const S = this.sell; if (!S) return; const tab = this.sellTabs()[S.tab];
      S.items = Save.data.specimens.filter(s => Save.sellable(s)).map(s => ({ spec: s, i: Econ.info(s) })).filter(e => e.i && tab.f(e.i)).sort((a, b) => b.i.price - a.i.price || b.spec.date - a.spec.date);
      S.sel = clamp(S.sel, 0, Math.max(0, S.items.length - 1)); const vis = 7; S.scroll = clamp(S.scroll, 0, Math.max(0, S.items.length - vis)); if (S.sel < S.scroll) S.scroll = S.sel; if (S.sel >= S.scroll + vis) S.scroll = S.sel - vis + 1;
      S.bulk = S.items.filter(e => Econ.bulkOk(e.spec)); S.bulkSum = S.bulk.reduce((a, e) => a + e.i.price, 0);
    }
    sellMove(d, wheel) { const S = this.sell; if (!S || !S.items.length) return; S.confirm = 0; S.sel = clamp(S.sel + d, 0, S.items.length - 1); if (wheel) S.scroll = clamp(S.scroll + d, 0, Math.max(0, S.items.length - 7)); this.sellRefresh(); Snd.sfx.page(); }
    sellTab(d) { const S = this.sell; S.tab = (S.tab + d + 4) % 4; S.sel = 0; S.scroll = 0; this.sellRefresh(); Snd.sfx.page(); }
    sellOne() {
      const S = this.sell, e = S.items[S.sel]; if (!e) return;
      if ((e.i.isAb || e.i.isOcean) && S.confirm !== e.spec.uid) { S.confirm = e.spec.uid; S.confirmT = 4; S.msg = e.i.isAb ? 'Аберрант! Вы уверены, что хотите его продать? Нажмите «Продать» ещё раз.' : 'Бабочка из океана?.. Вы уверены? Нажмите «Продать» ещё раз.'; S.msgT = 4; Snd.sfx.deny(); return; }
      S.confirm = 0; const nm = e.i.sp.ru, p = Save.sell(e.spec.uid); if (!p) return;
      S.msg = e.i.isAb ? `Аберрант! Редчайшая вещь. Держите ${p} монет.` : e.i.isOcean ? `Что это за существо?.. Беру! ${p} монет.` : ['Хороший экземпляр!', 'Аккуратная работа.', 'Беру, покупатели такое любят.', 'Отличная булавка!'][Math.floor(Math.random() * 4)] + ` ${p} монет.`; S.msgT = 4; S.flash = 0.6; S.last = p; Snd.sfx.coin(); this.sellRefresh();
    }
    sellAll() { const S = this.sell; if (!S.bulk.length) return; let sum = 0, n = 0; for (const e of S.bulk) { const p = Save.sell(e.spec.uid); if (p) { sum += p; n++; } } S.msg = `Продано: ${n} шт. — ${sum} монет. Аберрантов и океанских не трогаю — это отдельный разговор.`; S.msgT = 5; S.flash = 0.8; S.last = sum; Snd.sfx.reward(); this.sellRefresh(); }
    sellLayout() {
      const S = this.sell; const tabs = this.sellTabs().map((t, i) => ({ id: 'tab' + i, i, label: t.label, x: 8 + i * 62 + (i > 1 ? 18 : 0) * 0, y: 40, w: [34, 74, 40, 56][i], h: 14 }));
      let x = 8; tabs.forEach(t => { t.x = x; x += t.w + 3; });
      const rows = []; for (let k = 0; k < 7; k++) { const idx = S.scroll + k; if (idx >= S.items.length) break; rows.push({ id: 'row', idx, x: 8, y: 58 + k * 27, w: 226, h: 25 }); }
      return { tabs, rows, sellBtn: { id: 'sell', label: (S.items[S.sel] && S.confirm === S.items[S.sel].spec.uid) ? 'Точно продать?' : 'Продать', x: 244, y: 204, w: 110, h: 18, size: 8, disabled: !S.items.length }, allBtn: { id: 'all', label: `Продать обычных (${S.bulk.length})`, x: 244, y: 226, w: 226, h: 16, disabled: !S.bulk.length }, closeBtn: { id: 'close', label: 'Уйти ✕', x: SW - 82, y: 4, w: 74, h: 15 }, up: { id: 'up', label: '^', x: 176, y: 249, w: 26, h: 14 }, dn: { id: 'dn', label: 'v', x: 206, y: 249, w: 26, h: 14 } };
    }
    sellClick(x, y) {
      const S = this.sell, L = this.sellLayout(); if (UIK.hit(L.closeBtn, x, y)) { Snd.sfx.page(); this.close(); return; }
      const tb = L.tabs.find(t => UIK.hit(t, x, y)); if (tb) { S.tab = tb.i; S.sel = 0; S.scroll = 0; this.sellRefresh(); Snd.sfx.page(); return; }
      const r = L.rows.find(r => UIK.hit(r, x, y)); if (r) { const now = performance.now(); if (S.sel === r.idx && S.clickIdx === r.idx && now - S.clickT < 450) { this.sellOne(); S.clickIdx = -1; } else { S.sel = r.idx; S.clickIdx = r.idx; S.clickT = now; S.confirm = 0; this.sellRefresh(); Snd.sfx.click(); } return; }
      if (!L.sellBtn.disabled && UIK.hit(L.sellBtn, x, y)) this.sellOne(); else if (!L.allBtn.disabled && UIK.hit(L.allBtn, x, y)) this.sellAll(); else if (UIK.hit(L.up, x, y)) this.sellMove(-1, true); else if (UIK.hit(L.dn, x, y)) this.sellMove(1, true);
    }
    drawSell(ctx, t, m, dt) {
      const S = this.sell; S.msgT = Math.max(0, S.msgT - dt); if (S.confirm) { S.confirmT -= dt; if (S.confirmT <= 0) S.confirm = 0; } S.flash = Math.max(0, S.flash - dt); const L = this.sellLayout(), tb = this.sellTabs();
      ctx.fillStyle = '#1c1410'; ctx.fillRect(0, 0, SW, SH); for (let i = 0; i < SW; i += 3) { ctx.fillStyle = (i % 9 === 0) ? '#241a14' : '#201610'; ctx.fillRect(i, 0, 3, SH); }
      T.draw(ctx, 'Скупка бабочек', 8, 6, { size: 10, color: c.gold }); T.draw(ctx, 'Кликните по экземпляру, затем «Продать» (или щёлкните дважды)', 8, 20, { size: 8, color: c.dim });
      this.drawCoins(ctx, SW - 92, 24, true); UIK.btn(ctx, L.closeBtn, UIK.hit(L.closeBtn, m.x, m.y));
      L.tabs.forEach(t2 => { const on = t2.i === S.tab, hv = UIK.hit(t2, m.x, m.y); UIK.panel(ctx, t2.x, t2.y, t2.w, t2.h, { fill: on ? '#4a3220' : hv ? '#34261a' : '#2a1e16', border: on ? c.gold : '#5a4430' }); T.draw(ctx, t2.label, t2.x + t2.w / 2, t2.y + 3, { size: 8, align: 'c', color: on ? '#fff' : '#c8b898' }); });
      // list
      UIK.panel(ctx, 6, 56, 230, 208, { fill: '#2a2018', border: '#5a4430', shadow: false });
      if (!S.items.length) T.para(ctx, S.tab === 0 ? 'Нечего продавать. Наловите бабочек в экспедициях! Экземпляры в коробках сначала достаньте из коробки.' : 'В этой вкладке пусто.', 16, 110, 210, { size: 8, color: c.dim, lh: 10 });
      L.rows.forEach(r => { const e = S.items[r.idx], on = r.idx === S.sel, hv = UIK.hit(r, m.x, m.y); ctx.fillStyle = on ? 'rgba(240,200,90,0.28)' : hv ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.18)'; ctx.fillRect(r.x, r.y, r.w, r.h); if (on) { ctx.strokeStyle = c.gold; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); }
        ctx.fillStyle = '#c8a870'; ctx.fillRect(r.x + 2, r.y + 2, 42, 22); ctx.imageSmoothingEnabled = false; ctx.drawImage(Art.specimen(e.i.sp), r.x + 3, r.y + 3, 40, 20);
        T.draw(ctx, fitTxt(e.i.sp.ru.replace(' · аберрант', ''), 112), r.x + 48, r.y + 3, { size: 8, color: e.i.isAb ? '#ff9ae8' : '#f0e8d0' }); T.draw(ctx, e.i.isAb ? 'аберрант' + (e.i.spread ? ` · ${e.spec.q}%` : '') : e.i.spread ? `расправлен ${e.spec.q}%` : 'сырой', r.x + 48, r.y + 14, { size: 8, color: e.i.isAb ? '#c070b0' : c.dim });
        this.drawCoin(ctx, r.x + r.w - 16 - T.width(String(e.i.price), 8), r.y + 8); T.draw(ctx, String(e.i.price), r.x + r.w - 6, r.y + 8, { size: 8, align: 'r', color: c.gold }); });
      if (S.items.length > 7) { UIK.btn(ctx, L.up, UIK.hit(L.up, m.x, m.y)); UIK.btn(ctx, L.dn, UIK.hit(L.dn, m.x, m.y)); T.draw(ctx, `${S.sel + 1}/${S.items.length}`, 12, 253, { size: 8, color: c.dim }); }
      // right: the merchant and the selected specimen
      UIK.panel(ctx, 240, 40, 234, 54, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false }); ctx.fillStyle = '#7a2a3a'; ctx.fillRect(246, 46, 36, 42); ctx.fillStyle = '#e0b890'; ctx.fillRect(254, 50, 20, 18); ctx.fillStyle = '#1c1820'; ctx.fillRect(252, 42, 24, 10); ctx.fillRect(250, 50, 28, 3); ctx.fillStyle = '#201810'; ctx.fillRect(257, 58, 3, 3); ctx.fillRect(268, 58, 3, 3); ctx.fillRect(259, 66, 10, 2); ctx.fillStyle = '#e8e0d0'; ctx.fillRect(250, 72, 28, 16);
      T.para(ctx, S.msg, 288, 46, 182, { size: 8, color: '#2a1a0c', lh: 10 });
      const e = S.items[S.sel]; UIK.panel(ctx, 240, 98, 234, 102, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false });
      if (e) { const i = e.i; ctx.fillStyle = '#c8a870'; ctx.fillRect(244, 102, 90, 46); ctx.imageSmoothingEnabled = false; ctx.drawImage(Art.specimen(i.sp), 247, 103, 84, 42);
        T.draw(ctx, fitTxt(i.sp.ru, 130), 340, 103, { size: 8, color: '#2a1a0c' }); T.draw(ctx, fitTxt(i.sp.la, 130), 340, 114, { size: 8, color: '#8a2a1a' }); T.draw(ctx, `${i.sp.mm[0]}–${i.sp.mm[1]} мм`, 340, 125, { size: 8, color: '#6a5030' }); T.draw(ctx, e.spec.by ? `поймал: ${e.spec.by}` : i.spread ? `качество ${e.spec.q}%` : 'не расправлен', 340, 136, { size: 8, color: '#6a5030' });
        const rows = [[`Вид (${i.isOcean ? 'редкость ???' : '★'.repeat(0) + 'редкость ' + (i.species.rar || 1) + '/3'})`, `${i.base}`], i.isAb ? ['Аберрант', `×${i.ab.toFixed(1)}`] : null, [i.spread ? `Расправлен ${e.spec.q}%` : 'Сырой экземпляр', `×${i.cond.toFixed(2)}`]].filter(Boolean);
        rows.forEach((r, k) => { T.draw(ctx, r[0], 248, 154 + k * 11, { size: 8, color: '#2a1a0c' }); T.draw(ctx, r[1], 466, 154 + k * 11, { size: 8, align: 'r', color: '#6a5030' }); });
        ctx.fillStyle = '#a8946a'; ctx.fillRect(246, 187, 222, 1); T.draw(ctx, 'Цена', 248, 189, { size: 8, color: '#2a1a0c' }); this.drawCoin(ctx, 424, 190); T.draw(ctx, String(i.price), 466, 189, { size: 8, align: 'r', color: '#8a5a10' });
      } else T.draw(ctx, 'Выберите экземпляр слева', 357, 140, { size: 8, align: 'c', color: '#6a5030' });
      UIK.btn(ctx, L.sellBtn, !L.sellBtn.disabled && UIK.hit(L.sellBtn, m.x, m.y)); UIK.btn(ctx, L.allBtn, !L.allBtn.disabled && UIK.hit(L.allBtn, m.x, m.y));
      T.draw(ctx, S.bulk.length ? `Все обычные: ${S.bulkSum} монет` : '', 244, 246, { size: 8, color: c.dim });
      if (S.flash > 0) { ctx.globalAlpha = Math.min(1, S.flash * 2); T.draw(ctx, `+${S.last}`, SW - 8, 40 - (0.8 - S.flash) * 8, { size: 10, align: 'r', color: '#ffe070', shadow: '#000' }); ctx.globalAlpha = 1; }
    }
    drawCoin(ctx, x, y) { ctx.fillStyle = '#8a5a10'; ctx.fillRect(x + 1, y, 5, 7); ctx.fillRect(x, y + 1, 7, 5); ctx.fillStyle = '#f0c040'; ctx.fillRect(x + 1, y + 1, 5, 5); ctx.fillStyle = '#fff0a0'; ctx.fillRect(x + 2, y + 1, 2, 1); ctx.fillStyle = '#c89020'; ctx.fillRect(x + 3, y + 2, 1, 3); }
    drawCoins(ctx, x, y, big) { this.drawCoin(ctx, x, y); T.draw(ctx, String(Save.data.coins || 0), x + 10, y - 1, { size: big ? 10 : 8, color: '#ffe070' }); }

    // ------------------------------------------------------------ 2D layer
    draw(ctx, t, m, dt) {
      const ov = this.ov;
      if (ov === 'sell') return this.drawSell(ctx, t, m, dt);
      if (ov === 'journal') return Screens.journal.draw(ctx, t, m);
      this.hud(ctx, t);
      if (ov === 'pause') this.drawPause(ctx, m); else if (ov === 'help') this.drawHelp(ctx);
    }
    hud(ctx, t) {
      UIK.panel(ctx, 6, 6, 150, 30, { fill: 'rgba(16,28,24,0.82)', border: c.line }); T.draw(ctx, 'Рынок насекомых', 12, 10, { size: 8, color: c.gold }); this.drawCoins(ctx, 12, 22);
      if (this.remotes) T.draw(ctx, 'Онлайн: ' + [Net.name].concat(Object.values(Net.remote).map(r => r.name)).join(', '), 8, 42, { size: 8, color: '#9ae0b0', shadow: '#000' });
      ctx.fillStyle = 'rgba(255,255,255,0.8)'; ctx.fillRect(SW / 2 - 1, SH / 2 - 1, 2, 2);
      if (this.prompt && !this.ov) { const s = this.prompt.label(); const w = T.width(s, 8) + 20; UIK.panel(ctx, SW / 2 - w / 2, SH - 54, w, 18, { fill: 'rgba(16,28,24,0.9)', border: c.gold }); T.draw(ctx, s, SW / 2, SH - 49, { size: 8, align: 'c', color: '#fff' }); }
      if (this.toastT > 0) { T.para(ctx, this.toastText, SW / 2 - 150, 62, 300, { size: 8, color: c.gold, shadow: '#000', lh: 10 }); }
      T.draw(ctx, 'WASD — ходить · мышь — осмотр · E — действие · Tab — журнал · Esc — пауза', 8, SH - 12, { size: 8, color: 'rgba(230,240,220,0.7)', shadow: '#000' });
    }
    drawPause(ctx, m) {
      ctx.fillStyle = 'rgba(4,12,10,0.7)'; ctx.fillRect(0, 0, SW, SH); UIK.panel(ctx, SW / 2 - 106, 38, 212, 180, { fill: 'rgba(16,32,28,0.96)', border: c.gold });
      T.draw(ctx, 'Пауза', SW / 2, 46, { size: 14, align: 'c', color: c.gold }); T.draw(ctx, 'Рынок насекомых', SW / 2, 63, { size: 8, align: 'c', color: c.dim });
      this.pauseButtons().forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y)));
    }
    drawHelp(ctx) {
      ctx.fillStyle = 'rgba(4,12,10,0.86)'; ctx.fillRect(0, 0, SW, SH); UIK.panel(ctx, 56, 30, 368, 200, { fill: 'rgba(16,32,28,0.97)', border: c.gold });
      T.draw(ctx, 'Рынок насекомых', SW / 2, 38, { size: 14, align: 'c', color: c.gold });
      [['WASD', 'ходить по рынку'], ['Мышь', 'осмотреться'], ['E', 'поговорить / продать / пройти'], ['Shift', 'быстрее'], ['Tab', 'журнал'], ['Esc', 'пауза / закрыть окно']].forEach((r, i) => { T.draw(ctx, r[0], 80, 62 + i * 13, { size: 8, color: c.gold }); T.draw(ctx, r[1], 150, 62 + i * 13, { size: 8, color: c.text }); });
      T.para(ctx, 'Торговец бабочками (стойка с красно-белым навесом и вывеской «Скупка бабочек») покупает ваши экземпляры из кабинета за монеты. Цена зависит от редкости вида; расправленные дороже сырых; аберранты стоят в разы дороже, а бабочки океана — особенно. Экземпляры в коробках сначала достаньте из коробки.', 76, 146, 330, { size: 8, color: c.text, lh: 10 });
      T.draw(ctx, 'нажмите любую клавишу', SW / 2, 214, { size: 8, align: 'c', color: c.gold });
    }
    dispose() { if (this.remotes) { this.remotes.dispose(); Net.hooks.cab = Net.hooks.pjoin = Net.hooks.pleave = null; } Snd.stopAmbient(); this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const mt = o.material; if (mt) (Array.isArray(mt) ? mt : [mt]).forEach(x => { if (x.map) x.map.dispose(); x.dispose(); }); }); }
  }
  const fitTxt = (s, maxW) => { if (T.width(s, 8) <= maxW) return s; while (s.length > 1 && T.width(s + '…', 8) > maxW) s = s.slice(0, -1); return s + '…'; };
  return Mkt;
})();
