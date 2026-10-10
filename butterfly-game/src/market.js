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
  // a golden eye on a dark ground (the sign of the strange stall and of the secret door)
  const eyeTex = () => ctex(32, 16, (x, w, h) => {
    x.fillStyle = '#14100c'; x.fillRect(0, 0, w, h); x.fillStyle = '#b8964a'; x.fillRect(0, 0, w, 1); x.fillRect(0, h - 1, w, 1); x.fillRect(0, 0, 1, h); x.fillRect(w - 1, 0, 1, h);
    const cx = 16, cy = 8; for (let i = -10; i <= 10; i++) { const hh = Math.round(4.5 * Math.sqrt(1 - (i / 10) ** 2)); x.fillStyle = '#b8964a'; x.fillRect(cx + i, cy - hh, 1, 1); x.fillRect(cx + i, cy + hh, 1, 1); x.fillStyle = '#d8cdb0'; x.fillRect(cx + i, cy - hh + 1, 1, Math.max(0, hh * 2 - 1)); }
    x.fillStyle = '#8a3020'; x.fillRect(cx - 3, cy - 3, 6, 6); x.fillStyle = '#5a1810'; x.fillRect(cx - 3, cy + 2, 6, 1); x.fillStyle = '#050308'; x.fillRect(cx - 1, cy - 1, 3, 3); x.fillStyle = '#ffffff'; x.fillRect(cx - 2, cy - 2, 1, 1);
    x.fillStyle = '#b8964a'; for (const lx of [-8, -5, -2, 2, 5, 8]) x.fillRect(cx + lx, cy - 7 + Math.abs(lx) / 3, 1, 2);
    x.fillStyle = '#8a7a58'; for (const [sx, sy] of [[3, 3], [28, 4], [5, 12], [27, 12]]) x.fillRect(sx, sy, 1, 1);
  });
  // a framed display box with pinned butterflies (cols x rows), chosen from every species (a few aberrants and rare ones for show)
  function boxTex(rng, cols, rows, bg) {
    return ctex(cols * 32, rows * 22 + 4, (x, w, h) => {
      x.fillStyle = bg || '#d8cfa8'; x.fillRect(0, 0, w, h); x.fillStyle = 'rgba(0,0,0,0.12)'; for (let i = 0; i < 40; i++) x.fillRect(rng.int(0, w - 1), rng.int(0, h - 1), 2, 1);
      const real = SPECIES.filter(s => !s.mystery && s.biome !== 'ocean' && Maps.allowed(s.biome));
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
    if (o.hood) {                                       // a cloak down to the ground and a deep hood: the face is only darkness
      const cl = o.body || '#2a2238', ch0 = o.sit ? 1.12 : 1.4, cloak = new THREE.Mesh(new THREE.CylinderGeometry(0.27, o.sit ? 0.5 : 0.45, ch0, 10), lam(cl)); cloak.position.y = 1.45 - ch0 / 2; g.add(cloak);
      head.children.forEach((ch, i) => { if (i > 0) ch.visible = false; }); head.children[0].material = lam('#050308');
      const hood = new THREE.Mesh(new THREE.SphereGeometry(0.235, 12, 8, -Math.PI / 2 + 0.8, Math.PI * 2 - 1.6), lam(cl, { side: THREE.DoubleSide })); hood.scale.set(1.02, 1.14, 1.1); hood.position.set(0, 0.03, 0.03); head.add(hood);
      const tip = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.22, 8), lam(cl)); tip.position.set(0, 0.2, 0.14); tip.rotation.x = 0.9; head.add(tip);
      const col = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.12, 10), lam(cl)); col.position.y = 1.43; g.add(col);
    }
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
    collector: { title: 'Торговец коллекциями', line: 'Готовые рамки с бабочками? Несите, оценю. Чем стройнее подобрана коллекция — тем больше плачу.', o: { hat: 'top', body: '#2c3a2a', apron: '#7a2a2a', glasses: true } },
    traps: { title: 'Торговец ловушками', line: 'Ловушки для дневных бабочек — как в полевых экспедициях. Нужна приманка: цветы и мёд продаются рядом.', o: { hat: 'cap', hatCol: '#b8a068', body: '#8a7a4a', apron: '#e8e0c0', glasses: false } },
    boxes: { title: 'Торговец коробками', line: sign => `«${sign}»: лучшие экземпляры — на витрине. А свои приносите к скупщику под красным навесом.`, o: { hat: 'scarf', hatCol: '#2f6fb0', body: '#e8e0d0' } },
  };

  // ------------------------------------------------------------ the market
  const fmtK = k => String(Math.round(k * 100) / 100).replace('.', ',');
  class Mkt {
    constructor(hooks, at) {
      this.hooks = hooks; this.ov = null; this.t = 0; this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#9ac4ea'); this.scene.fog = new THREE.Fog('#9ac4ea', 38, 110);
      this.camera = new THREE.PerspectiveCamera(70, SW / SH, 0.07, 600); this.scene.add(this.camera);
      this.player = { pos: new THREE.Vector3(-23.5, 0, 0.5), yaw: -Math.PI / 2 + 0.05, pitch: -0.04, bob: 0, vel: new THREE.Vector2(), stepD: 0, moving: false };
      this.colliders = []; this.circles = []; this.stations = []; this.toastT = 0; this.toastText = ''; this.prompt = null; this.walkers = []; this.vendors = []; this.flutter = []; this.glowMats = []; this.lights = []; this.sell = null;
      { const hp = new URLSearchParams(location.hash.replace('#', '?')).get('hour'); if (hp !== null && !isNaN(+hp)) this.hourOverride = +hp; }
      this.build(); this.applyTime(this.realHour());
      Snd.startAmbient('market'); this.toast('Рынок насекомых', 3);
      this.netAcc = 0; if (Net.on) { this.remotes = new Remotes(this.scene); Net.hooks.pjoin = m => this.toast(`${m.name} пришёл на рынок`, 2.5); Net.hooks.pleave = (m, r) => this.toast(`${r ? r.name : 'Игрок'} ушёл с рынка`, 2.5); Net.hooks.cab = () => { if (this.ov === 'sell') this.sellRefresh(); if (this.ov === 'collect') this.collRefresh(); }; }
      if (at) { this.player.pos.set(at.x, 0, at.z); this.player.yaw = at.yaw; this.player.pitch = 0; }
      this.camera.position.set(this.player.pos.x, 1.62, this.player.pos.z);
    }
    toast(s, d = 2.5) { this.toastText = s; this.toastT = d; }
    addCol(x0, x1, z0, z1) { this.colliders.push({ x0, x1, z0, z1 }); }
    addCircle(x, z, r) { this.circles.push({ x, z, r }); }
    circAt(x, z, ry, lx, lz, r) { const c = Math.cos(ry), s = Math.sin(ry); this.addCircle(x + lx * c + lz * s, z - lx * s + lz * c, r); }   // a circle given in the local frame of a stall
    // footprint of a rectangle given in the local frame of a stall (yaw a multiple of 90 deg)
    fpr(x, z, ry, x0, x1, z0, z1) { const c = Math.cos(ry), sn = Math.sin(ry), P = [[x0, z0], [x1, z0], [x0, z1], [x1, z1]].map(([lx, lz]) => [x + lx * c + lz * sn, z - lx * sn + lz * c]); this.addCol(Math.min(...P.map(p => p[0])), Math.max(...P.map(p => p[0])), Math.min(...P.map(p => p[1])), Math.max(...P.map(p => p[1]))); }
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
      this.buildHouses(); this.buildGate(); this.buildPlazas(); this.buildStalls(); this.buildDecor(); this.buildSecrets();
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
      const st2 = st.clone(); st2.position.x = gx - 0.37; st2.rotation.y = -Math.PI / 2; S.add(st2); for (const z of [-2.4, 2.4]) B.rope([gx + 0.2, 5.12, z], [gx + 0.2, 4.1, z * 0.9], 0, '#3a2a1c', 0.04, 3);
      this.stations.push({ id: 'exit', x: -25.2, z: 0, r: 2.6, label: () => 'E — выйти на карту экспедиций' });
      this.addCol(gx - 0.5, gx + 0.5, -4.2, -3.1); this.addCol(gx - 0.5, gx + 0.5, 3.1, 4.2); this.addCol(-31, -28.4, -5, 5);
      // the door of the entomologist's house on the east side of the plaza
      const dx = 31.95; const door = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 2.5), new THREE.MeshLambertMaterial({ map: ctex(24, 40, (x, w, h) => { x.fillStyle = '#3a2414'; x.fillRect(0, 0, w, h); x.fillStyle = '#6a4428'; x.fillRect(2, 2, w - 4, h - 4); x.fillStyle = '#7a5434'; x.fillRect(4, 4, w - 8, 14); x.fillRect(4, 22, w - 8, 14); x.fillStyle = BRASS; x.fillRect(w - 6, 20, 3, 3); }) })); door.position.set(dx, 1.25, 0); door.rotation.y = -Math.PI / 2; S.add(door);
      const ds = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.62), new THREE.MeshLambertMaterial({ map: signTex('Кабинет энтомолога', 100, 24, '#243a30', '#f0d890', '#c8a040') })); ds.position.set(dx, 2.95, 0); ds.rotation.y = -Math.PI / 2; S.add(ds);
      B.box(0.2, 0.2, 3.8, dx - 0.05, 2.6, 0, DWOOD); for (const z of [-1.5, 1.5]) { B.box(0.55, 0.06, 0.06, dx - 0.28, 2.62, z, IRON); this.lamp(dx - 0.5, 2.28, z, 0.2, '#ffd070', 0.1); }
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
      B.geo(gableGeo(2.8, 2.0, 0.9, 0.2, true), B.mat(wx, 3.45, wz), '#b5503a'); this.addCircle(wx, wz, 1.2); B.cyl(0.14, 0.14, 0.7, wx, 3.1, wz, '#6a4a2a', 8, 0, 0, Math.PI / 2); B.cyl(0.045, 0.045, 1.3, wx, 2.4, wz, '#9a7a48', 5); B.box(0.6, 0.07, 0.07, wx, 3.1, wz, DWOOD);        // rope wound on the drum, down to the bucket's bail
      B.seg([wx - 0.24, 1.72, wz], [wx, 1.78, wz], 0.03, IRON); B.seg([wx + 0.24, 1.72, wz], [wx, 1.78, wz], 0.03, IRON); B.box(0.1, 0.1, 0.1, wx, 1.76, wz, IRON);                                  // bail + ring
      B.cyl(0.26, 0.2, 0.36, wx, 1.52, wz, '#6a4a2a', 10); B.cyl(0.27, 0.27, 0.04, wx, 1.66, wz, IRON, 10); B.cyl(0.22, 0.22, 0.04, wx, 1.36, wz, IRON, 10);                                    // the bucket and its hoops
      for (const [tx, tz] of [[10.6, -27], [17.6, -27], [10.2, -21], [18, -21]]) tree(tx, tz, 1.15); for (const [bx, bz, ry] of [[14, -28.2, Math.PI], [9.3, -24, Math.PI / 2], [18.7, -24, -Math.PI / 2]]) this.bench(bx, bz, ry);
      // south plaza: a big tree and tea tables
      tree(2, 27.5, 1.6, 'birch'); tree(-2.2, 30.8, 1.2); tree(6.2, 30.8, 1.2); for (const [bx, bz, ry] of [[2, 23.4, Math.PI], [-2.2, 27.6, Math.PI / 2], [6.2, 27.6, -Math.PI / 2]]) this.bench(bx, bz, ry);
      // west garden at the end of the first alley: trees, a lily pond
      B.cyl(1.4, 1.5, 0.4, -12, 0.2, -28, '#8a847a', 16); const pw = new THREE.Mesh(new THREE.CircleGeometry(1.25, 16).rotateX(-Math.PI / 2), lam('#3a7a98')); pw.position.set(-12, 0.42, -28); S.add(pw); for (let i = 0; i < 5; i++) { const a = rng.range(0, 6.28), r = rng.range(0.2, 0.95); B.cyl(0.2, 0.2, 0.02, -12 + Math.cos(a) * r, 0.44, -28 + Math.sin(a) * r, '#4a9a4a', 7); } this.addCircle(-12, -28, 1.6);
      for (const [tx, tz] of [[-17.8, -30], [-10.2, -30], [-17.8, -25.8], [-10.2, -25.8]]) tree(tx, tz, 1.05); this.bench(-11.8, -24.6, 0);
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
    awning(w, d, y0, y1, zBack, ci, drop = 0.4, cols) {      // a striped sloping awning over a stall (local coords): n stripes across the width
      const B = this.B, cl = cols || CLOTH[ci % CLOTH.length], n = Math.max(4, Math.round(w / 0.28)), sw = w / n, len = Math.hypot(d, y1 - y0), ang = Math.atan2(y0 - y1, d);
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
      else if (kind === 'traps') { ['std', 'str', 'imp'].forEach((tp, i) => { const m = Traps.model(tp, {}); m.scale.setScalar(0.3); m.position.set(-w / 2 + 0.55 + i * (w - 1.1) / 2, y, z); m.rotation.y = 0.3 - i * 0.25; g.add(m); }); }
      else if (kind === 'jars') { for (let i = 0; i < Math.floor(w / 0.4); i++) { const x = -w / 2 + 0.3 + i * 0.4; B.cyl(0.1, 0.1, 0.22, x, y + 0.11, z + (i % 2) * 0.15, '#e0a030', 8); B.cyl(0.105, 0.105, 0.04, x, y + 0.24, z + (i % 2) * 0.15, '#6a4a2a', 8); } }
      else if (kind === 'books') { for (let i = 0; i < 14; i++) { const x = -w / 2 + 0.2 + i * (w - 0.4) / 14; B.box(0.1, 0.28 + (i % 3) * 0.04, 0.2, x, y + 0.16, z, ['#8a2a3a', '#2a5a8a', '#3a7a4a', '#c8a040', '#6a3a7a'][i % 5]); } }
      else if (kind === 'tea') { for (let i = 0; i < 2; i++) { const x = -w / 4 + i * w / 2; B.cyl(0.2, 0.26, 0.5, x, y + 0.25, z, '#c8a040', 10); B.cyl(0.14, 0.2, 0.14, x, y + 0.56, z, '#c8a040', 10); B.cyl(0.04, 0.04, 0.1, x, y + 0.68, z, '#2a2018', 6); } for (let i = 0; i < 5; i++) B.cyl(0.07, 0.05, 0.1, -w / 2 + 0.4 + i * 0.3, y + 0.05, z + 0.3, '#f0f0e8', 8); }
      else if (kind === 'pins') { for (let i = 0; i < 6; i++) { B.box(0.3, 0.12, 0.2, -w / 2 + 0.3 + i * 0.4, y + 0.06, z, ['#3a6a4a', '#8a3a3a', '#2a4a8a'][i % 3]); } B.sph(0.12, 0.2, y + 0.14, z + 0.25, '#e8d890', 1, 0.7, 1); }
    }
    crates(g, x, z, n = 3) { const B = this.B, rng = this.rng; const s0 = rng.range(0.45, 0.6), s1 = rng.range(0.4, 0.55); B.box(s0, s0, s0, x, s0 / 2, z, CRATE, 0, rng.range(-0.3, 0.3), 0); if (n > 1) B.box(s1, s1, s1, x + s0 * 0.85, s1 / 2, z + rng.range(-0.1, 0.1), '#b88a54', 0, rng.range(-0.4, 0.4), 0); if (n > 2) { const s2 = rng.range(0.34, 0.42); B.box(s2, s2, s2, x + rng.range(-0.05, 0.05), s0 + s2 / 2, z, '#98703c', 0, rng.range(-0.5, 0.5), 0); } if (rng.chance(0.5)) { B.cyl(0.28, 0.28, 0.7, x - 0.75, 0.35, z, '#7a5a38', 10); B.cyl(0.285, 0.285, 0.05, x - 0.75, 0.2, z, IRON, 10); B.cyl(0.285, 0.285, 0.05, x - 0.75, 0.5, z, IRON, 10); } }

    // ---- stall builders (local frame: customers at +z, the back at -z)
    stallTable(x, z, ry, o = {}) {
      const w = o.w || 3.2, d = 1.3, ci = o.ci || 0, kind = o.goods || 'boxes', pz = o.short ? d / 2 + 0.15 : d / 2 + 0.55; this.fp(x, z, w, d + 0.2, ry, 0.1);   // pz: z of the front posts (alley stalls keep them inside their footprint)
      const g = this.at(x, z, ry, g => {
        const B = this.B, cd = 0.78, zc = d / 2 - cd / 2; B.box(w, 0.88, cd, 0, 0.44, zc, LWOOD); B.box(w + 0.12, 0.07, cd + 0.08, 0, 0.92, zc + 0.02, WOOD); B.box(w - 0.1, 0.5, 0.04, 0, 0.5, d / 2 + 0.01, '#6a4a2c');
        for (const sx of [-1, 1]) { B.cyl(0.05, 0.06, 2.55, sx * (w / 2 - 0.02), 1.28, -d / 2 - 0.08, DWOOD, 6); B.cyl(0.05, 0.06, 2.15, sx * (w / 2 - 0.02), 1.08, pz, DWOOD, 6); }
        this.awning(w + 0.2, pz + 0.9, 2.55, 2.17, -d / 2 - 0.1, ci);
        B.box(w, 1.5, 0.08, 0, 1.7, -d / 2 - 0.1, '#6a4a2c', 0, 0, 0, 0.1);                    // back board
        if (kind === 'boxes') { this.boxes(g, Math.max(2, Math.round(w / 0.85)), w - 0.2, -w / 2 + 0.1, 0.98, 0.27, -0.55, w - 0.2); for (let i = 0; i < 2; i++) this.frame(g, 0.6, 0.45, this.boxTexFor(3, 2), -w / 4 + i * w / 2, 1.85, -d / 2 - 0.04, 0); this.frame(g, 0.5, 0.4, this.boxTexFor(2, 2), 0, 1.8, -d / 2 - 0.04, 0); }
        else this.goods(kind, g, w - 0.4, 0.96, 0.27);
        if (o.sign) { const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 0.4), new THREE.MeshLambertMaterial({ map: signTex(o.sign, 96, 26, '#3a2414', '#f0d890', '#c8a040') })); sg.position.set(0, 1.96, pz + 0.19); g.add(sg); }
        if (!o.nocrate) this.crates(g, w / 2 + 0.55, -0.1, 3);
        this.vendor(g, 0, -0.5, kind, o.sign, o.shop);
        for (const sx of [-1, 1]) { B.box(0.3, 0.04, 0.04, sx * (w / 2 + 0.1), 2.13, pz, DWOOD); this.lamp(sx * (w / 2 + 0.22), 1.867, pz, 0.11, null, 0.1); }
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
        this.vendor(g, 0, VZ, o.collector ? 'collector' : 'boxes', o.sign || 'Коллекции');
      });
    }
    stallKiosk(x, z, ry, o = {}) {
      const w = 3.2, d = o.short ? 1.8 : 2.4, ci = o.ci || 2, aw = o.short ? 0.6 : 1.15, ps = o.short ? 0.55 : 1.1, sh = o.short ? [0.6, 0.22] : [0.8, 0.32];   // in an alley the hut is shallower and its awning shorter
      if (o.short) this.fpr(x, z, ry, -w / 2 - 0.1, w / 2 + 0.1, -d / 2 - 0.05, d / 2 + ps + 0.1); else this.fp(x, z, w, d - 0.1, ry, 0.1);
      this.at(x, z, ry, g => {
        const B = this.B, pal = PALS[(o.pal || 0) % PALS.length], t = 0.08;
        B.box(w, 0.06, d, 0, 0.03, 0, DWOOD);                                                   // floor
        B.box(t, 2.6, d, -w / 2 + t / 2, 1.3, 0, pal.wall); B.box(t, 2.6, d, w / 2 - t / 2, 1.3, 0, pal.wall); B.box(w, 2.6, t, 0, 1.3, -d / 2 + t / 2, pal.wall);   // side and back walls
        B.box(w, 1.0, t, 0, 0.5, d / 2 - t / 2, '#7a5030'); B.box(w, 0.7, t, 0, 2.25, d / 2 - t / 2, pal.wall);                   // front wall below and above the serving window (y 1.0 .. 1.9)
        for (const sx of [-1, 1]) B.box(0.14, 0.9, 0.1, sx * (w / 2 - 0.07), 1.45, d / 2 - t / 2, DWOOD);                           // window jambs
        B.box(w, 0.06, d, 0, 2.62, 0, DWOOD); B.box(w + 0.1, 0.1, 0.12, 0, 2.62, d / 2, DWOOD);                                    // ceiling and the front beam
        B.box(w + 0.2, 0.08, sh[0], 0, 1.0, d / 2 + sh[1], LWOOD);                                                                       // counter shelf outside
        B.geo(gableGeo(w, d, 1.0, 0.3, true), B.mat(0, 2.65, 0), pal.roof, 0.08);
        this.awning(w - 0.2, aw, 2.5, 1.95, d / 2, ci, 0.3); for (const sx of [-1, 1]) B.cyl(0.04, 0.05, 1.95, sx * (w / 2 - 0.12), 0.98, d / 2 + ps, DWOOD, 6);
        this.boxes(g, 3, w - 0.5, -w / 2 + 0.25, 1.05, d / 2 + sh[1] + 0.02, -0.45, w - 0.5);
        for (let i = 0; i < 3; i++) this.frame(g, 0.7, 0.5, this.boxTexFor(3, 2), -1.0 + i * 1.0, 1.75, -d / 2 + 0.14, 0);     // frames on the inner back wall (seen through the window)
        // the sign stands on two posts above the roof edge, in front of everything (the awning cannot hide it)
        for (const sx of [-1, 1]) B.cyl(0.04, 0.04, 0.8, sx * 0.85, 3.05, d / 2 + 0.3, DWOOD, 6);
        const sg = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.46), new THREE.MeshLambertMaterial({ map: signTex(o.sign || 'Коллекционные виды', 112, 28, '#243a30', '#f0d890', '#c8a040') })); sg.position.set(0, 3.1, d / 2 + 0.34); g.add(sg);
        this.vendor(g, 0, d / 2 - 0.75, 'boxes', o.sign); this.lamp(0, 2.3, 0, 0.14, null, 0.1);
        if (!o.nocrate) this.crates(g, w / 2 + 0.6, d / 2, 3);
        for (const sx of [-1, 1]) { B.box(0.3, 0.04, 0.04, sx * (w / 2 + 0.0), 1.98, d / 2 + ps, DWOOD); this.lamp(sx * (w / 2 + 0.14), 1.73, d / 2 + ps, 0.1, null, 0.1); }
      });
    }
    stallCart(x, z, ry, o = {}) {
      const ci = o.ci || 3; this.fp(x, z, 2.4, 1.6, ry);
      this.at(x, z, ry, g => {
        const B = this.B; B.box(2.0, 0.12, 1.1, 0, 0.62, 0, WOOD); B.box(2.0, 0.28, 0.06, 0, 0.8, 0.56, LWOOD); B.box(2.0, 0.28, 0.06, 0, 0.8, -0.56, LWOOD); B.box(0.06, 0.28, 1.1, 1.0, 0.8, 0, LWOOD); B.box(0.06, 0.28, 1.1, -1.0, 0.8, 0, LWOOD);
        for (const sz of [-1, 1]) { B.cyl(0.5, 0.5, 0.07, 0, 0.5, sz * 0.64, DWOOD, 14, Math.PI / 2, 0, 0); B.cyl(0.08, 0.08, 0.14, 0, 0.5, sz * 0.64, IRON, 6, Math.PI / 2, 0, 0); for (let k = 0; k < 4; k++) B.box(0.06, 0.98, 0.05, 0, 0.5, sz * 0.64, WOOD, 0, 0, k * Math.PI / 4); }   // the wheels stand on the long sides (axle across the cart)
        if (o.short) { for (const sz of [-1, 1]) B.box(0.07, 0.56, 0.07, 0.9, 0.34, sz * 0.4, WOOD); B.box(0.07, 0.07, 0.9, 0.9, 0.08, 0, WOOD); }       // in an alley the cart stands on props instead of sticking its shafts into the way
        else { B.seg([1.0, 0.72, -0.3], [2.3, 0.62, -0.3], 0.07, WOOD); B.seg([1.0, 0.72, 0.3], [2.3, 0.62, 0.3], 0.07, WOOD); B.seg([2.3, 0.62, -0.3], [2.3, 0.62, 0.3], 0.07, WOOD); }
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.cyl(0.03, 0.03, 1.5, sx * 0.9, 1.4, sz * 0.5, DWOOD, 5);
        const cl = CLOTH[ci % CLOTH.length]; for (let i = 0; i < 8; i++) B.box(0.26, 0.03, 1.3, -0.9 + i * 0.255, 2.13 - Math.abs(i - 3.5) * 0.02, 0, cl[i % 2], 0, 0, 0.0, 0.02);
        this.boxes(g, 3, 1.8, -0.9, 0.8, 0.1, -0.6, 1.8); if (!o.nocrate) this.crates(g, -1.6, 0.4, 2); this.lamp(0, 1.88, 0.45, 0.1, null, 0.11);
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
    vendor(g, x, z, key, sign, shop) {
      const pr = PROF[key] || PROF.boxes, p = person(Object.assign({ skin: this.rng.pick(['#e8c8a0', '#d8a878', '#c8946a']) }, pr.o)); p.position.set(x, 0, z); p.rotation.y = Math.PI; p.userData.ph = this.rng.range(0, 6); g.add(p); this.vendors.push(p);
      const line = typeof pr.line === 'function' ? pr.line(sign || 'Коллекции') : pr.line; const wp = new THREE.Vector3(); g.updateMatrixWorld(true); p.getWorldPosition(wp);
      if (key === 'collector') { const ns = nameSprite('Торговец коллекциями', '#a8e8b0'); ns.position.set(x, 2.3, z); g.add(ns); }
      if (shop) { this.stations.push({ id: 'goods', kind: shop, x: wp.x + Math.sin(g.rotation.y) * 1.3, z: wp.z + Math.cos(g.rotation.y) * 1.3, r: 1.9, label: () => `E — ${pr.title.toLowerCase()}: купить` }); return; }
      this.stations.push({ id: key === 'nets' ? 'netshop' : key === 'collector' ? 'collect' : 'chat', x: wp.x + Math.sin(g.rotation.y) * 1.3, z: wp.z + Math.cos(g.rotation.y) * 1.3, r: 1.9, line: [pr.title, line], label: () => key === 'nets' ? 'E — купить детали для сачков' : key === 'collector' ? 'E — продать рамку торговцу коллекциями' : `E — поговорить: ${pr.title}` });
    }

    // a stall standing against a wall: side N/S = wall at z (customers on the street side), W/E = wall at x
    wallStall(type, side, wall, along, o = {}) {
      const off = { table: 0.85, kiosk: (side === 'W' || side === 'E') ? 1.05 : 1.35, cart: 1.15 }[type] || 1, f = { N: [along, wall + off, 0], S: [along, wall - off, Math.PI], W: [wall + off, along, Math.PI / 2], E: [wall - off, along, -Math.PI / 2] }[side];
      if (side === 'W' || side === 'E') o = Object.assign({ short: true, nocrate: true }, o);       // in the narrow alleys: no side crates, front posts inside the footprint
      const fn = { table: 'stallTable', kiosk: 'stallKiosk', cart: 'stallCart' }[type]; this[fn](f[0], f[1], f[2], o);
    }
    buildStalls() {
      const W = (t, s, w, a, o) => this.wallStall(t, s, w, a, o);
      // main street, north side (backs against the houses at z = -4)
      W('table', 'N', -4, -24.4, { goods: 'flowers', ci: 2, sign: 'Цветы', shop: 'fl' }); W('kiosk', 'N', -4, -19.6, { ci: 0, pal: 1, sign: 'Парусники' }); this.stallMerchant(-6.2, -4 + 1.15, 0);
      W('table', 'N', -4, -0.5, { ci: 3, sign: 'Нимфалиды' }); W('cart', 'N', -4, 4.4, { ci: 4, sign: 'Бабочки в коробках' }); W('table', 'N', -4, 8.6, { ci: 5, sign: 'Голубянки' });
      // main street, south side
      W('table', 'S', 4, -18, { goods: 'nets', ci: 1, sign: 'Сачки' }); W('kiosk', 'S', 4, -12.5, { ci: 1, pal: 2, sign: 'Тропики' }); W('table', 'S', 4, -6, { goods: 'books', ci: 4, sign: 'Книги' }); W('table', 'S', 4, -2.2, { goods: 'tea', ci: 6, sign: 'Чай' });
      W('table', 'S', 4, 6.4, { goods: 'jars', ci: 0, sign: 'Мёд', shop: 'hn' }); W('table', 'S', 4, 10.6, { goods: 'traps', ci: 2, sign: 'Ловушки', shop: 'tr' }); W('table', 'S', 4, 14.2, { ci: 3, sign: 'Африка' });
      // the alleys are 4 m wide: stalls alternate between the two walls (never opposite each other) so a zig-zag path stays open all the way to the plaza
      // first alley (north, x -16..-12)
      W('table', 'W', -16, -6.8, { ci: 1, sign: 'Альпы' }); W('table', 'E', -12, -11.6, { goods: 'pins', ci: 3, sign: 'Булавки' }); W('kiosk', 'W', -16, -16.2, { ci: 5, pal: 4, sign: 'Ночные' }); W('table', 'E', -12, -20.6, { goods: 'flowers', ci: 5, sign: 'Букеты' }); this.stallShelves(-15.45, -21.6, Math.PI / 2, { sign: 'Мотыльки' });
      // second alley (north, x 12..16): the houses end at z = -16, then the plaza opens
      W('table', 'W', 12, -5.7, { ci: 0, w: 2.8, sign: 'Прерия' }); W('table', 'E', 16, -9.8, { goods: 'jars', ci: 6, w: 2.8, sign: 'Редкие виды' }); W('kiosk', 'W', 12, -14.5, { ci: 6, pal: 3, sign: 'Азия' });
      // third alley (south, x 0..4)
      W('table', 'W', 0, 6.0, { ci: 2, sign: 'Европа' }); W('table', 'E', 4, 10.6, { goods: 'flowers', ci: 5, sign: 'Букеты' }); W('cart', 'W', 0, 14.8, { ci: 1, sign: 'Коллекции' }); W('table', 'E', 4, 18.8, { goods: 'books', ci: 3, w: 2.8, sign: 'Книги' });
      // short alley (south-west): the tea garden
      W('table', 'W', -24, 7.2, { goods: 'tea', ci: 6, sign: 'Чайная' }); W('table', 'E', -20, 11.6, { goods: 'jars', ci: 2, sign: 'Мёд' }); for (const [tx, tz] of [[-23.4, 14.2], [-20.6, 14.2], [-22, 17.6]]) this.teaTable(tx, tz);
      // east plaza: round stalls around the fountain
      for (const [sx, sz] of [[26.7, 5.1], [26.7, -5.1], [21.3, 5.1], [21.3, -5.1]]) this.stallRound(sx, sz, Math.atan2(24 - sx, 0 - sz) + Math.PI * 0, { ci: Math.abs(Math.round(sx + sz)) % 7, sign: 'Бабочки', collector: sx > 26 && sz < 0 });
    }

    // ------------------------------------------------------------ secrets: the strange stall in the first alley and the code door in the far corner of the north plaza
    buildSecrets() {
      this.stallStrange(-15.15, -26.3, Math.PI / 2); this.addCol(-16.7, -16.5, -28.5, -24.1);
      this.buildSecretDoor(18, -31.98);
    }
    // the forbidden stall: aged ebony planks, blackened iron and brass, strange apparatus; nothing is for sale. Local frame: customers at +z, the stone wall at -z
    stallStrange(x, z, ry) {
      const w = 3.0; this.fp(x, z, w + 0.2, 2.0, ry, 0.1);
      this.circAt(x, z, ry, 1.75, 0.55, 0.33); this.circAt(x, z, ry, -1.85, 0.45, 0.45);       // the barrel and the trunk beside the stall
      const eye = new THREE.MeshLambertMaterial({ map: eyeTex(), emissive: '#2a2a2a' });
      const EB = '#2a1b13', EB2 = '#36241a', EB3 = '#1d130d', FE = '#2e2f35', FE2 = '#44454c', BR = BRASS, y0 = 0.97;
      const g = this.at(x, z, ry, g => {
        const B = this.B, G = this.G, rng = this.rng;
        B.box(4.0, 3.3, 0.4, 0, 1.65, -1.12, '#706a60'); B.box(4.3, 0.2, 0.56, 0, 3.4, -1.12, '#8a847a'); for (const sx of [-1, 1]) { B.box(0.5, 3.5, 0.56, sx * 2.1, 1.75, -1.12, '#7a746a'); B.box(0.62, 0.14, 0.68, sx * 2.1, 3.57, -1.12, '#9a948a'); }     // an old stone wall closes the nook behind the stall
        for (let i = 0; i < 14; i++) { const ix = -1.8 + i * 0.27 + rng.next() * 0.1, iy = 0.3 + rng.next() * 2.2; if (Math.abs(ix) < 1.6 && iy < 2.5) continue; B.box(0.12 + rng.next() * 0.1, 0.1 + rng.next() * 0.12, 0.03, ix, iy, -0.91, ['#3a5a2a', '#4a6a30', '#2a4a24'][i % 3], 0, 0, rng.next(), 0.1); }   // ivy on the stone beside the stall
        B.box(w + 0.5, 0.02, 2.5, 0, 0.01, 0.1, EB3); B.box(w - 0.2, 0.03, 0.5, 0, 0.025, 0.95, '#3a1a18');                              // worn boards and a dark red runner in front of the counter
        // the back wall: dark plank panelling
        B.box(w, 2.5, 0.1, 0, 1.25, -0.85, EB3); for (let i = 0; i < 15; i++) B.box(0.012, 2.46, 0.01, -w / 2 + 0.1 + i * 0.2, 1.25, -0.795, '#0f0906');
        // thick posts with iron collars, a beam across the front
        for (const sx of [-1, 1]) {
          B.box(0.13, 2.65, 0.13, sx * (w / 2 - 0.02), 1.325, -0.85, EB); B.box(0.13, 2.2, 0.13, sx * (w / 2 - 0.02), 1.1, 0.95, EB);
          for (const yy of [0.3, 1.2, 2.0]) B.box(0.16, 0.05, 0.16, sx * (w / 2 - 0.02), yy, 0.95, FE);
          B.box(0.16, 0.05, 0.16, sx * (w / 2 - 0.02), 1.5, -0.85, FE); B.box(0.16, 0.05, 0.16, sx * (w / 2 - 0.02), 2.4, -0.85, FE);
          B.box(0.05, 0.6, 0.04, sx * (w / 2 - 0.02), 2.0, 0.89, FE); B.seg([sx * (w / 2 - 0.02), 2.2, 0.95], [sx * (w / 2 - 0.02 - sx * 0.45), 2.2, 0.0], 0.04, EB);
        }
        this.awning(w + 0.2, 1.9, 2.65, 2.2, -0.9, 0, 0.3, ['#2b2018', '#18110c']);
        // the counter: ebony planks under an iron-bound top, a hatch with a chain and padlock
        B.box(w, 0.9, 0.7, 0, 0.45, 0.25, EB3); B.box(w + 0.14, 0.07, 0.82, 0, 0.935, 0.25, EB); B.box(w + 0.1, 0.03, 0.04, 0, 0.9, 0.67, FE);
        for (let i = 0; i < 15; i++) B.box(0.195, 0.8, 0.03, -w / 2 + 0.1 + i * 0.2, 0.43, 0.62, [EB, EB2, '#22160e'][i % 3]);
        for (const yy of [0.12, 0.74]) { B.box(w - 0.04, 0.07, 0.02, 0, yy, 0.645, FE); for (let i = 0; i < 12; i++) B.box(0.035, 0.035, 0.02, -w / 2 + 0.2 + i * 0.24, yy, 0.66, FE2); }
        B.box(0.72, 0.5, 0.025, 0.6, 0.43, 0.65, '#150d08'); for (const [hx, hy] of [[0.6, 0.18], [0.6, 0.68]]) B.box(0.78, 0.04, 0.03, hx, hy, 0.66, FE); for (const sx of [-1, 1]) B.box(0.04, 0.54, 0.03, 0.6 + sx * 0.37, 0.43, 0.66, FE);
        B.box(0.1, 0.12, 0.05, 0.6, 0.45, 0.7, BR); B.box(0.1, 0.02, 0.02, 0.6, 0.55, 0.7, FE2); B.box(0.015, 0.08, 0.015, 0.56, 0.6, 0.7, FE2); B.box(0.015, 0.08, 0.015, 0.64, 0.6, 0.7, FE2); B.box(0.09, 0.015, 0.015, 0.6, 0.64, 0.7, FE2);
        B.rope([0.35, 0.5, 0.68], [0.6, 0.5, 0.71], 0.04, FE2, 0.012, 6); B.rope([0.85, 0.5, 0.68], [0.6, 0.5, 0.71], 0.04, FE2, 0.012, 6);
        // ---- on the counter ----
        // brass scales
        { const sx = -1.18, sz = -0.62, y0 = 1.81; B.cyl(0.1, 0.12, 0.04, sx, y0 + 0.02, sz, BR, 10); B.cyl(0.015, 0.02, 0.36, sx, y0 + 0.22, sz, BR, 6); B.box(0.5, 0.02, 0.02, sx, y0 + 0.4, sz, BR); B.cyl(0.03, 0.03, 0.03, sx, y0 + 0.42, sz, BR, 8);
          for (const d of [-1, 1]) { const px = sx + d * 0.23; B.cyl(0.075, 0.05, 0.02, px, y0 + 0.12, sz, BR, 10); for (const a of [0.4, 2.5, 4.6]) B.seg([px, y0 + 0.39, sz], [px + Math.cos(a) * 0.07, y0 + 0.13, sz + Math.sin(a) * 0.07], 0.006, '#8a6a30'); }
          B.cyl(0.03, 0.03, 0.06, sx - 0.23, y0 + 0.16, sz, '#3a4a46', 8); B.cyl(0.03, 0.03, 0.025, sx + 0.23, y0 + 0.145, sz, FE2, 8); B.cyl(0.02, 0.02, 0.025, sx + 0.25, y0 + 0.17, sz + 0.02, FE2, 8); }
        // rack of corked vials
        { const vx = -0.78, vz = -0.02; B.box(0.6, 0.03, 0.14, vx, y0 + 0.015, vz, EB2); B.box(0.6, 0.02, 0.14, vx, y0 + 0.11, vz, EB2); for (const sx of [-1, 1]) B.box(0.03, 0.14, 0.14, vx + sx * 0.285, y0 + 0.07, vz, EB2);
          for (let i = 0; i < 6; i++) { const c = ['#5a2a2a', '#2a4a3a', '#4a4a22', '#2a2a5a', '#4a2a4a', '#33433a'][i]; B.cyl(0.026, 0.026, 0.15, vx - 0.25 + i * 0.1, y0 + 0.105, vz, c, 8); B.cyl(0.018, 0.02, 0.03, vx - 0.25 + i * 0.1, y0 + 0.195, vz, '#7a5a38', 6); } }
        // alembic: an iron stove with a glowing slit, a flask, a swan neck, a cooling tube on a stand and a receiving jar
        { const ax = -1.2, az = 0.28; B.box(0.3, 0.16, 0.3, ax, y0 + 0.08, az, FE); B.box(0.34, 0.025, 0.34, ax, y0 + 0.17, az, FE2); G.box(0.16, 0.025, 0.012, ax, y0 + 0.07, az + 0.152, '#ff7a30'); B.cyl(0.05, 0.06, 0.06, ax, y0 + 0.2, az, BR, 8);
          B.sph(0.12, ax, y0 + 0.31, az, '#46604f', 1, 1, 1, 10, 8); B.cyl(0.04, 0.06, 0.12, ax, y0 + 0.47, az, '#46604f', 8); B.sph(0.055, ax, y0 + 0.57, az, '#46604f', 1, 0.8, 1, 8, 6);
          B.seg([ax + 0.03, y0 + 0.58, az], [ax + 0.27, y0 + 0.52, az], 0.03, '#5a7060');
          B.cyl(0.015, 0.02, 0.62, ax + 0.42, y0 + 0.32, az - 0.06, FE2, 6); B.cyl(0.07, 0.08, 0.02, ax + 0.42, y0 + 0.01, az - 0.06, FE, 10);
          B.seg([ax + 0.27, y0 + 0.52, az], [ax + 0.57, y0 + 0.28, az], 0.075, '#6a7c72'); B.box(0.06, 0.03, 0.09, ax + 0.42, y0 + 0.4, az - 0.03, FE2);
          B.cyl(0.07, 0.065, 0.15, ax + 0.6, y0 + 0.075, az, '#3a5a4a', 9); B.cyl(0.075, 0.075, 0.02, ax + 0.6, y0 + 0.16, az, '#5a3a20', 9); }
        // the gear machine: wooden base, two brass plates, meshing cogs, a crank and a dial
        { const gx = 0.7, gz = 0.3, AB = '#8a6a2c'; B.box(0.46, 0.05, 0.3, gx, y0 + 0.025, gz, EB2); for (const dz of [-1, 1]) B.box(0.36, 0.3, 0.02, gx, y0 + 0.2, gz + dz * 0.07, AB);
          const cog = (cx, cy, r, n, col) => { B.cyl(r, r, 0.04, gx + cx, y0 + cy, gz, col, 14, Math.PI / 2, 0, 0); for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2; B.box(r * 0.3, r * 0.34, 0.04, gx + cx + Math.cos(a) * (r + 0.008), y0 + cy + Math.sin(a) * (r + 0.008), gz, col, 0, 0, a - Math.PI / 2); } B.cyl(0.012, 0.012, 0.2, gx + cx, y0 + cy, gz, FE2, 6, Math.PI / 2, 0, 0); };
          cog(-0.07, 0.19, 0.085, 12, '#b8923e'); cog(0.08, 0.25, 0.05, 8, '#a07c34'); cog(0.1, 0.11, 0.06, 9, '#b08a3a');
          B.seg([gx - 0.07, y0 + 0.19, gz + 0.11], [gx - 0.17, y0 + 0.12, gz + 0.16], 0.014, FE2); B.cyl(0.02, 0.02, 0.06, gx - 0.17, y0 + 0.12, gz + 0.19, EB, 6, Math.PI / 2, 0, 0);
          B.cyl(0.04, 0.04, 0.015, gx + 0.1, y0 + 0.28, gz + 0.09, '#d8c8a0', 12, Math.PI / 2, 0, 0); B.box(0.004, 0.032, 0.012, gx + 0.1, y0 + 0.29, gz + 0.1, '#201008', 0, 0, 0.5); }
        // a brass microscope
        { const mx = 1.2, mz = 0.1; B.box(0.14, 0.03, 0.2, mx, y0 + 0.015, mz, BR); B.cyl(0.016, 0.02, 0.3, mx, y0 + 0.18, mz - 0.07, BR, 6); B.box(0.1, 0.014, 0.1, mx, y0 + 0.1, mz + 0.02, '#2a2018');
          B.seg([mx, y0 + 0.34, mz - 0.075], [mx, y0 + 0.17, mz + 0.0], 0.032, BR); B.seg([mx, y0 + 0.17, mz + 0.0], [mx, y0 + 0.13, mz + 0.012], 0.018, '#2a2a30'); B.cyl(0.025, 0.03, 0.045, mx, y0 + 0.365, mz - 0.085, '#1a1a1e', 8);
          B.box(0.03, 0.02, 0.07, mx, y0 + 0.07, mz - 0.03, BR); B.cyl(0.035, 0.035, 0.008, mx, y0 + 0.045, mz + 0.02, '#c8d0d8', 10); B.seg([mx, y0 + 0.045, mz + 0.02], [mx, y0 + 0.03, mz - 0.07], 0.01, BR); }
        // an iron lantern with a dim amber flame, and a small stack of leather books under it
        { const lx = 1.38, lz = 0.45; B.box(0.26, 0.04, 0.17, lx - 0.0, y0 + 0.02, lz, '#2a1410'); B.box(0.22, 0.035, 0.15, lx, y0 + 0.058, lz, '#3a1c14'); B.box(0.12, 0.03, 0.12, lx, y0 + 0.09, lz, FE); for (const dx of [-1, 1]) for (const dz of [-1, 1]) B.box(0.012, 0.16, 0.012, lx + dx * 0.05, y0 + 0.18, lz + dz * 0.05, FE);
          G.sph(0.035, lx, y0 + 0.17, lz, '#ffa850', 1, 1.5, 1, 6, 5); B.box(0.13, 0.015, 0.13, lx, y0 + 0.27, lz, FE); B.cyl(0.0, 0.075, 0.07, lx, y0 + 0.31, lz, FE, 4); B.seg([lx - 0.03, y0 + 0.34, lz], [lx + 0.03, y0 + 0.3, lz], 0.012, FE); }
        // ---- the back wall of the stall ----
        // a cabinet of many little drawers with brass pulls and paper labels
        B.box(0.92, 1.75, 0.3, -1.0, 0.875, -0.63, EB); B.box(0.98, 0.06, 0.34, -1.0, 1.78, -0.62, EB2);
        for (let r = 0; r < 7; r++) for (let c = 0; c < 3; c++) { const dx = -1.0 + (c - 1) * 0.29, dy = 0.17 + r * 0.24; B.box(0.27, 0.22, 0.02, dx, dy, -0.47, [EB2, '#2f1f15', '#3a281c'][(r + c) % 3]); B.box(0.08, 0.016, 0.025, dx, dy - 0.01, -0.45, BR); B.box(0.1, 0.045, 0.008, dx, dy + 0.06, -0.457, '#c8b890'); }
        B.box(0.2, 0.05, 0.14, -0.7, 1.835, -0.62, '#241410'); B.box(0.18, 0.045, 0.13, -0.7, 1.88, -0.62, '#3a2a1c'); B.box(0.16, 0.04, 0.12, -0.7, 1.925, -0.62, '#1c1410'); B.box(0.15, 0.035, 0.11, -0.7, 1.962, -0.62, '#2c1e16');   // jar, books and a plain skull
        // shelves on the right: bottles, a rolled map, a compass, a closed ledger
        for (const sy of [1.25, 1.75]) { B.box(1.25, 0.045, 0.3, 0.75, sy, -0.68, EB); for (const sx of [0.2, 1.3]) B.box(0.04, 0.2, 0.26, sx, sy - 0.12, -0.68, FE); }
        for (let i = 0; i < 7; i++) { const c = ['#2a3a2a', '#3a2a22', '#2a2a3a', '#40381f', '#33262e'][i % 5]; const bh = 0.16 + (i % 3) * 0.04; B.cyl(0.04, 0.045, bh, 0.34 + i * 0.1, 1.27 + bh / 2, -0.68, c, 8); B.cyl(0.017, 0.02, 0.05, 0.34 + i * 0.1, 1.27 + bh + 0.03, -0.68, '#6a4a2a', 6); }
        B.box(0.22, 0.05, 0.16, 1.15, 1.295, -0.68, '#241410'); B.box(0.2, 0.045, 0.15, 1.15, 1.34, -0.68, '#3a2418'); B.cyl(0.05, 0.05, 0.012, 1.18, 1.37, -0.68, BR, 10); G.box(0.004, 0.02, 0.004, 1.18, 1.385, -0.68, '#e0c070');
        B.cyl(0.04, 0.04, 0.3, 0.45, 1.82, -0.68, '#c8b888', 8, 0, 0, Math.PI / 2); B.cyl(0.035, 0.035, 0.26, 0.5, 1.9, -0.68, '#bfae7e', 8, 0, 0, Math.PI / 2 + 0.1);
        B.cyl(0.06, 0.06, 0.02, 0.9, 1.8, -0.68, BR, 10); B.cyl(0.05, 0.05, 0.015, 0.9, 1.82, -0.68, '#d8c8a0', 10); B.box(0.18, 0.12, 0.14, 1.12, 1.835, -0.68, '#2e2f35'); B.box(0.1, 0.03, 0.01, 1.12, 1.835, -0.605, BR);
        // a case of pinned dark moths above the vendor
        B.box(0.58, 0.42, 0.04, 0.0, 2.12, -0.76, EB3); B.box(0.5, 0.34, 0.012, 0, 2.12, -0.735, '#6a5a48');
        for (let i = 0; i < 6; i++) { const mx = -0.15 + (i % 3) * 0.15, my = 2.18 - Math.floor(i / 3) * 0.14, c = ['#2a2030', '#4a2a2a', '#2a3a40', '#3a2a1a', '#33243a', '#2a2a22'][i]; for (const sd of [-1, 1]) B.box(0.07, 0.05, 0.006, mx + sd * 0.04, my, -0.72, c, 0, 0, sd * 0.45); B.box(0.014, 0.07, 0.01, mx, my, -0.716, '#14100c'); B.sph(0.008, mx, my, -0.708, '#a8a8b0'); }
        // rusty keys on rings hanging from the awning
        for (let i = 0; i < 5; i++) { const kx = 0.55 + i * 0.17, ky = 2.3 - (i % 2) * 0.05; B.seg([kx, 2.62, -0.55], [kx, ky + 0.08, -0.55], 0.008, FE2); B.cyl(0.03, 0.03, 0.01, kx, ky + 0.05, -0.55, '#6a4a2a', 8, Math.PI / 2, 0, 0); B.seg([kx, ky + 0.02, -0.55], [kx, ky - 0.17, -0.55], 0.014, '#5a3a22'); B.box(0.035, 0.02, 0.01, kx + 0.02, ky - 0.15, -0.55, '#5a3a22'); B.box(0.03, 0.02, 0.01, kx + 0.02, ky - 0.1, -0.55, '#5a3a22'); }
        // chains with a hook, hanging from the front beam
        for (const hx of [-1.15, -0.75]) { B.rope([hx, 2.6, 0.1], [hx, 2.0, 0.1], 0, FE2, 0.015, 7); B.cyl(0.03, 0.03, 0.01, hx, 1.96, 0.1, FE2, 8, Math.PI / 2, 0, 0); }
        // the sign with an eye: dark wood, hung by iron rods from the front edge of the awning
        const SX = -0.98; for (const sx of [-1, 1]) { B.seg([SX + sx * 0.45, 2.2, 1.0], [SX + sx * 0.45, 2.1, 1.0], 0.016, FE); B.box(0.06, 0.52, 0.06, SX + sx * 0.48, 1.86, 1.0, EB3); }
        B.box(1.02, 0.07, 0.06, SX, 2.1, 1.0, EB3); B.box(1.02, 0.07, 0.06, SX, 1.62, 1.0, EB3); const sg = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 0.45), eye); sg.position.set(SX, 1.86, 1.0); g.add(sg);
        for (const sx of [-1, 1]) { B.box(0.3, 0.04, 0.04, sx * (w / 2 + 0.1), 2.13, 0.95, FE); this.lamp(sx * (w / 2 + 0.2), 1.87, 0.95, 0.11, '#c8782a', 0.1); }
        B.cyl(0.2, 0.2, 0.05, 0, 0.47, -0.45, EB, 10); for (const a of [0.5, 2.6, 4.7]) B.cyl(0.025, 0.03, 0.45, Math.cos(a) * 0.14, 0.225, -0.45 + Math.sin(a) * 0.14, EB3, 5);   // the stool
        // beside the stall: a hooped barrel and an iron-bound trunk
        { const bx = 1.75, bz = 0.55; B.cyl(0.27, 0.27, 0.7, bx, 0.35, bz, EB2, 10); B.cyl(0.3, 0.3, 0.06, bx, 0.35, bz, EB2, 10); for (const yy of [0.12, 0.58]) B.cyl(0.285, 0.285, 0.035, bx, yy, bz, FE, 10); B.cyl(0.25, 0.25, 0.02, bx, 0.71, bz, EB3, 10); }
        { const tx = -1.85, tz = 0.45; B.box(0.5, 0.38, 0.74, tx, 0.19, tz, EB); B.box(0.52, 0.06, 0.76, tx, 0.41, tz, EB2); for (const dz of [-0.27, 0.27]) B.box(0.54, 0.4, 0.04, tx, 0.2, tz + dz, FE); B.box(0.07, 0.1, 0.03, tx + 0.27, 0.34, tz, BR); B.box(0.05, 0.05, 0.03, tx + 0.28, 0.27, tz, BR); }
        const p = person({ hood: true, sit: true, body: '#262028', skin: '#b8a898', pants: '#14101c' }); p.position.set(0, -0.28, -0.45); p.rotation.y = Math.PI; p.userData.L.forEach(l => { l.scale.y = 0.6; }); p.userData.arms.forEach(a => { a.rotation.x = 1.35; }); g.add(p); this.strange = p;
        const pl = new THREE.PointLight('#ff9040', 0.9, 5.5, 1.8); pl.position.set(1.2, 1.3, 0.5); g.add(pl); this.strangeLight = pl;
      });
      const wp = { x: x + Math.sin(ry) * 1.6, z: z + Math.cos(ry) * 1.6 };
      this.stations.push({ id: 'strange', x: wp.x, z: wp.z, r: 2.0, label: () => 'E — поговорить с торговцем в капюшоне' });
    }
    buildSecretDoor(cx, cz) {
      const B = this.B, G = this.G, S = this.scene, DK = '#3a2a1c';
      this.at(cx, cz, 0, g => {                                       // local frame: +z is the plaza, the wall face is at z = -0.02
        for (const sx of [-1, 1]) B.box(0.22, 2.75, 0.2, sx * 0.99, 1.375, 0.08, DK);
        B.box(2.4, 0.28, 0.24, 0, 2.89, 0.1, '#8a847a'); B.box(0.5, 0.2, 0.28, 0, 3.12, 0.12, '#9a948a'); B.box(2.0, 0.06, 0.2, 0, 2.72, 0.08, DK);
        B.box(2.2, 0.1, 0.5, 0, 0.05, 0.23, STONE); B.box(1.9, 0.07, 0.3, 0, 0.12, 0.12, '#7a746a');              // the step
        B.box(1.78, 2.62, 0.02, 0, 1.31, -0.01, '#030203');                                                         // the black opening behind the leaf
        for (const sx of [-1, 1]) { B.box(0.4, 0.04, 0.04, sx * 1.45, 2.6, 0.17, IRON); this.lamp(sx * 1.55, 2.32, 0.17, 0.12, '#a070ff', 0.1); B.box(0.04, 0.04, 0.2, sx * 1.55 - sx * 0.2, 2.6, 0.07, IRON); }
        // the code lock beside the door: a plate on the wall with a window of eight digits and a lamp
        B.box(0.62, 0.4, 0.05, 1.5, 1.3, 0.005, '#5a4a2a'); B.box(0.56, 0.34, 0.02, 1.5, 1.3, 0.04, '#8a6a30'); for (const [dx, dy] of [[-0.26, 0.15], [0.26, 0.15], [-0.26, -0.15], [0.26, -0.15]]) B.box(0.03, 0.03, 0.02, 1.5 + dx, 1.3 + dy, 0.06, '#c8a860');
        B.box(0.5, 0.16, 0.02, 1.5, 1.25, 0.055, '#14100a'); B.box(0.5, 0.025, 0.03, 1.5, 1.345, 0.06, '#6a4a1c');
        const kc = document.createElement('canvas'); kc.width = 64; kc.height = 20; const ktex = new THREE.CanvasTexture(kc); ktex.magFilter = ktex.minFilter = THREE.NearestFilter; ktex.generateMipmaps = false; this.keypadTex = ktex;
        const kp = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.14), new THREE.MeshBasicMaterial({ map: ktex })); kp.position.set(1.5, 1.25, 0.068); g.add(kp);
        const light = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), new THREE.MeshBasicMaterial({ color: '#c02020' })); light.position.set(1.5, 1.405, 0.07); g.add(light);
        const eyeP = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.3), new THREE.MeshLambertMaterial({ map: eyeTex() })); eyeP.position.set(0, 3.38, -0.015 + 0.0); g.add(eyeP); B.box(0.66, 0.36, 0.01, 0, 3.38, -0.025, DK);
        // the leaf: planks, iron bands, rivets, a ring and a keyhole plate, hinged on the left
        const pivot = new THREE.Group(); pivot.position.set(-0.88, 0, 0.07); g.add(pivot); const leaf = new THREE.Group(); leaf.position.x = 0.88; pivot.add(leaf);
        const mk = (w, h, d, x, y, z, col) => { const m = new THREE.Mesh(BOXG, lam(col)); m.scale.set(w, h, d); m.position.set(x, y, z); m.castShadow = true; leaf.add(m); return m; };
        for (let i = 0; i < 7; i++) mk(0.25, 2.6, 0.1, -0.75 + i * 0.25, 1.3, 0, ['#4a3220', '#523824', '#463020', '#4e3622'][i % 4]);
        for (const y of [0.35, 1.3, 2.25]) { mk(1.76, 0.12, 0.02, 0, y, 0.06, IRON); for (let i = 0; i < 6; i++) mk(0.04, 0.04, 0.03, -0.7 + i * 0.28, y, 0.075, '#4a4a54'); }
        const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.015, 6, 14), lam(IRON)); ring.position.set(0.62, 1.15, 0.09); leaf.add(ring); mk(0.16, 0.2, 0.02, 0.62, 1.3, 0.065, IRON); mk(0.03, 0.06, 0.02, 0.62, 1.3, 0.08, '#d8b050');
        for (const y of [0.35, 2.25]) mk(0.3, 0.1, 0.04, -0.72, y, 0.08, '#2a2a30');
        this.secretDoor = { pivot, light, open: null }; const open = Secret.unlocked(); pivot.rotation.y = open ? -1.75 : 0; this.setDoorState(open, true);
      });
      this.stations.push({ id: 'codedoor', x: cx, z: cz + 1.55, r: 2.1, label: () => Secret.unlocked() ? 'E — войти в потайную дверь' : 'E — кодовый замок' });
      this.addCol(cx - 1.2, cx + 1.9, cz - 0.1, cz + 0.55);       // the step and the wall plate: nothing behind the door to walk into
    }
    setDoorState(open, first) {
      const sd = this.secretDoor; if (!sd) return; sd.open = open; sd.light.material.color.set(open ? '#40e060' : '#c02020');
      const kc = this.keypadTex.image, x = kc.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = '#0a0806'; x.fillRect(0, 0, 64, 20);
      for (let i = 0; i < 8; i++) { x.fillStyle = open ? '#102a14' : '#1a1410'; x.fillRect(1 + i * 8, 2, 7, 16); T.draw(x, open ? Secret.CODE[i] : '-', 4 + i * 8, 6, { size: 8, align: 'c', color: open ? '#60ff80' : '#6a5a40' }); }
      this.keypadTex.needsUpdate = true; if (open && !sd.col) { sd.col = true; this.addCol(17.0, 17.25, -31.9, -30.15); }
    }
    teaTable(x, z) { const B = this.B, ci = this.rng.int(0, CLOTH.length - 1), cl = CLOTH[ci]; B.cyl(0.55, 0.55, 0.05, x, 0.76, z, WOOD, 12); B.cyl(0.06, 0.08, 0.76, x, 0.38, z, DWOOD, 6); B.cyl(0.06, 0.06, 2.4, x, 1.2, z, DWOOD, 6); for (let i = 0; i < 8; i++) B.geo(new THREE.ConeGeometry(1.3, 0.5, 1, 1, true, i * Math.PI / 4, Math.PI / 4), B.mat(x, 2.35, z), cl[i % 2], 0.02); for (const [dx, dz] of [[0.85, 0], [-0.85, 0]]) { B.cyl(0.2, 0.2, 0.05, x + dx, 0.45, z + dz, LWOOD, 8); B.cyl(0.03, 0.03, 0.45, x + dx, 0.22, z + dz, DWOOD, 5); } B.cyl(0.07, 0.05, 0.1, x, 0.84, z, '#f0f0e8', 8); this.addCircle(x, z, 0.62); }

    buildDecor() {
      const B = this.B, G = this.G, S = this.scene, rng = this.rng;
      // cloth sails, lantern strings and pennants: only between two real house walls (never across alley mouths or the open plazas)
      const walls2 = (x, a, b) => this.hasWall(x, a) && this.hasWall(x, b);
      for (let i = 0; i < 7; i++) { const x = -24 + i * 8 + rng.range(-1, 1), cl = rng.pick(CLOTH), y = 5.3 + rng.range(-0.3, 0.3); if (!walls2(x - 1.4, -4.6, 4.6) || !walls2(x + 1.4, -4.6, 4.6)) continue; for (let k = 0; k < 10; k++) { const t = (k + 0.5) / 10, sag = Math.sin(t * Math.PI) * 0.35; B.box(2.4 + rng.range(0, 0.8), 0.03, 0.84, x, y - sag, -4.0 + t * 8.0, cl[k % 2], Math.atan(0.35 * Math.PI * Math.cos(t * Math.PI) / 8), 0, 0, 0.02); } B.box(2.6, 0.06, 0.1, x, y + 0.02, -3.98, DWOOD); B.box(2.6, 0.06, 0.1, x, y + 0.02, 3.98, DWOOD); }
      for (let i = 0; i < 12; i++) { const x = -26 + i * 4.7; if (!walls2(x, -4.6, 4.6)) continue; B.rope([x, 4.4, -4.0], [x, 4.4, 4.0], 0.5, '#2a1c10', 0.025, 10); for (let k = 0; k < 5; k++) { const t = (k + 0.5) / 5; this.lamp(x, 4.4 - Math.sin(t * Math.PI) * 0.5 - 0.14 - 0.21, -4.0 + t * 8.0, 0.16, null, 0.14); } }
      for (let i = 0; i < 8; i++) { const x = -26 + i * 7 + 1.5, col = rng.pick(['#e84a4a', '#f0c030', '#3a8ae0', '#3ac07a', '#d86ad0']); if (!this.hasWall(x, -4.6) || !this.hasWall(x + 4.5, 4.6)) continue; const a = [x, 5.0, -4.0], b = [x + 4.5, 5.0, 4.0]; B.rope(a, b, 0.7, '#2a1c10', 0.02, 14); for (let k = 1; k < 14; k++) { const t = k / 14, px = lerp(a[0], b[0], t), py = lerp(a[1], b[1], t) - 0.7 * Math.sin(t * Math.PI), pz = lerp(a[2], b[2], t); B.tri([px - 0.12, py, pz - 0.05], [px + 0.12, py, pz + 0.05], [px, py - 0.3, pz], rng.pick(['#e84a4a', '#f0c030', '#3a8ae0', '#3ac07a', '#d86ad0', '#f2e8d0'])); } }
      // lantern strings across the alleys (wall to wall)
      const across = (axis, c, a0, a1) => { const p0 = axis === 'x' ? [a0, 4.2, c] : [c, 4.2, a0], p1 = axis === 'x' ? [a1, 4.2, c] : [c, 4.2, a1]; const e0 = axis === 'x' ? [a0 - 0.6, c] : [c, a0 - 0.6], e1 = axis === 'x' ? [a1 + 0.6, c] : [c, a1 + 0.6]; if (!this.hasWall(e0[0], e0[1]) || !this.hasWall(e1[0], e1[1])) return; B.rope(p0, p1, 0.4, '#2a1c10', 0.025, 8); for (let k = 0; k < 3; k++) { const t = (k + 0.5) / 3, x = lerp(p0[0], p1[0], t), z = lerp(p0[2], p1[2], t); this.lamp(x, 4.2 - Math.sin(t * Math.PI) * 0.4 - 0.12 - 0.195, z, 0.15, null, 0.12); } };
      for (let z = -8; z > -23; z -= 4.5) { across('x', z, -16, -12); across('x', z, 12, 16); } for (let z = 7; z < 22; z += 4.5) across('x', z, 0, 4); for (let z = 7; z < 14; z += 4.5) across('x', z, -24, -20);
      // the fountain plaza: a string of lanterns between the lamp posts across the fountain
      B.rope([24, 3.8, -8.2], [24, 3.8, 8.2], 0.9, '#2a1c10', 0.025, 14); for (let k = 0; k < 7; k++) { const t = (k + 0.5) / 7; this.lamp(24, 3.8 - Math.sin(t * Math.PI) * 0.9 - 0.14 - 0.21, lerp(-8.2, 8.2, t), 0.16, null, 0.14); }
      // hanging banners with butterflies on the house walls (only where the wall exists)
      const bs = SPECIES.filter(s => s.biome !== 'ocean' && Maps.allowed(s.biome)); for (let i = 0; i < 14; i++) { const north = i % 2 === 0, x = -26 + Math.floor(i / 2) * 8 + 1.2 + (north ? 0 : 3), z = north ? -4.08 : 4.08; if (!this.hasWall(x - 0.4, north ? -4.6 : 4.6) || !this.hasWall(x + 0.4, north ? -4.6 : 4.6)) continue; const sp = bs[(i * 37 + 5) % bs.length]; const m = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.6), new THREE.MeshLambertMaterial({ map: bannerTex(sp, ['#3a2a5a', '#2a4a5a', '#5a2a2a', '#2a5a3a'][i % 4]), side: THREE.DoubleSide })); m.position.set(x, 3.6, z + (north ? 0.06 : -0.06)); if (!north) m.rotation.y = Math.PI; S.add(m); B.box(1.0, 0.07, 0.07, x, 4.45, z + (north ? 0.08 : -0.08), DWOOD); }
      // lamp posts along the alleys and plazas
      const post = (x, z) => { B.cyl(0.08, 0.1, 3.2, x, 1.6, z, IRON, 6); B.box(0.5, 0.06, 0.5, x, 3.25, z, IRON); this.lamp(x, 3.5, z, 0.22, '#ffd070', 0); B.box(0.3, 0.08, 0.3, x, 3.88, z, IRON); this.addCol(x - 0.15, x + 0.15, z - 0.15, z + 0.15); this.lampPositions = (this.lampPositions || []).concat([[x, 3.5, z]]); };
      [[19, -3], [19, 3], [29, -6], [29, 6], [24, -8.2], [24, 8.2]].forEach(([x, z]) => post(x, z));
      // inside the narrow alleys the lamps hang from iron arms on the house walls (a post in the middle would block the way)
      const arm = (wx, z, dir) => { const lx = wx + dir * 0.8; B.box(0.9, 0.07, 0.07, wx + dir * 0.45, 3.9, z, IRON); B.box(0.06, 0.45, 0.06, wx + dir * 0.1, 3.68, z, IRON, 0, 0, -dir * 0.6); this.lamp(lx, 3.48, z, 0.2, '#ffd070', 0.12); this.lampPositions = (this.lampPositions || []).concat([[lx, 3.48, z]]); };
      [[-16, -6, 1], [-12, -13.2, -1], [-16, -19.0, 1], [12, -6, 1], [16, -12.5, -1], [0, 6, 1], [4, 12.6, -1], [0, 17.8, 1], [-24, 6, 1], [-20, 9.0, -1]].forEach(([wx, z, d]) => arm(wx, z, d));
      // barrels, sacks, crates, planters, hay in nooks
      for (let i = 0; i < 40; i++) { const side = rng.chance(0.5) ? -1 : 1, x = -26 + rng.range(0, 52), z = side * rng.range(3.55, 3.85); if (x > -3 && x < 3 && side > 0) continue; const zz = z + (z > 0 ? -0.35 : 0.35); if (this.colliders.some(k => x + 0.8 > k.x0 && x - 0.8 < k.x1 && zz + 0.5 > k.z0 && zz - 0.5 < k.z1)) continue; this.deco(x, z, rng.int(0, 3)); }
      // planters with flowers along the alleys
      for (const [x, z] of [[-15.35, -4.9], [15.35, -4.9], [3.35, 4.9], [-23.35, 4.9]]) this.planter(x, z);
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
      if (this.codeCloseT > 0) { this.codeCloseT -= dt; if (this.codeCloseT <= 0 && this.ov === 'code') this.close(); }
      if (this.secretDoor) { const sd = this.secretDoor, open = Secret.unlocked(); if (open !== sd.open) this.setDoorState(open); const target = open ? -1.75 : 0; sd.pivot.rotation.y += (target - sd.pivot.rotation.y) * Math.min(1, dt * 3); }
      if (this.strange) { const p = this.strange; p.position.y = -0.28 + Math.sin(t * 1.1) * 0.006; p.userData.head.rotation.y = Math.sin(t * 0.35) * 0.25; p.userData.head.rotation.x = 0.1 + Math.sin(t * 0.5) * 0.03; p.userData.arms[0].rotation.x = 1.35 + Math.sin(t * 0.8) * 0.03; p.userData.arms[1].rotation.x = 1.35 + Math.sin(t * 0.8 + 1) * 0.03; if (this.strangeLight) this.strangeLight.intensity = 0.8 + Math.sin(t * 3.1) * 0.12; }
      for (const v of this.vendors) { v.position.y = Math.sin(t * 1.4 + v.userData.ph) * 0.01; v.userData.head.rotation.y = Math.sin(t * 0.6 + v.userData.ph) * 0.35; v.userData.arms[1].rotation.x = Math.sin(t * 1.1 + v.userData.ph) * 0.06; }
      if (this.merchant) { const m = this.merchant; m.userData.head.rotation.y = Math.sin(t * 0.7) * 0.3; m.userData.arms[0].rotation.x = Math.sin(t * 1.3) * 0.08; m.userData.arms[1].rotation.x = Math.sin(t * 1.3 + 1) * 0.08; }
      if (this.remotes) { this.remotes.update(dt); this.netAcc += dt; if (this.netAcc > 0.1) { this.netAcc = 0; Net.send('pos', { x: Math.round(P.pos.x * 100) / 100, y: 1.65, z: Math.round(P.pos.z * 100) / 100, yaw: Math.round(P.yaw * 100) / 100, pitch: Math.round(P.pitch * 100) / 100, nz: 0, fl: 0, sw: 0, sp: Math.round(Math.hypot(P.vel.x, P.vel.y) * 10) / 10, st: 0 , nt: NetParts.code(Save.curNet()) }); } }
    }

    // ------------------------------------------------------------ interaction
    open(name) { this.ov = name; this.hooks.unlock(); if (name === 'sell') this.sellOpen(); if (name === 'shop') this.shopOpen(); if (name === 'collect') this.collOpen(); }
    close() { this.ov = null; this.hooks.lock(); }
    openTalk(who) { const sp = Secret.speech(who); this.talk = { who, lines: sp.lines, give: sp.give, giveAt: sp.giveAt, i: 0, chars: 0 }; this.open('talk'); }
    talkNext() {
      const T0 = this.talk; if (!T0) return; const len = T0.lines[T0.i].length; if (T0.chars < len) { T0.chars = len; return; }
      if (T0.give && T0.i === T0.giveAt) { T0.give = 0; if (Secret.take(1)) { this.toast('Получен обрывок записки: 27. Он лежит на складе (I).', 5); Snd.sfx.coin(); } }
      if (T0.i < T0.lines.length - 1) { T0.i++; T0.chars = 0; Snd.sfx.page(); } else this.close();
    }
    interact() {
      const s = this.prompt; if (!s) return;
      if (s.id === 'sell') { Snd.sfx.page(); this.open('sell'); }
      else if (s.id === 'goods') { Snd.sfx.page(); this.open('goods'); this.goodsOpen(s.kind); }
      else if (s.id === 'collect') { Snd.sfx.page(); this.open('collect'); }
      else if (s.id === 'netshop') { Snd.sfx.page(); this.open('shop'); }
      else if (s.id === 'strange') { Snd.sfx.page(); this.openTalk('strange'); }
      else if (s.id === 'codedoor') { if (Secret.unlocked()) { Snd.sfx.door(); this.hooks.secret(); } else { Secret.lock.reset(); this.open('code'); } }
      else if (s.id === 'chat') { this.toast(`${s.line[0]}: «${s.line[1]}»`, 5); Snd.sfx.click(); }
      else if (s.id === 'exit') { Snd.sfx.door(); this.hooks.exit(); }
      else if (s.id === 'cabinet') { Snd.sfx.door(); this.hooks.cabinet(); }
    }
    key(e) {
      const ov = this.ov;
      if (!ov) { if (e.code === 'KeyE') this.interact(); else if (e.code === 'Tab') { Snd.sfx.page(); this.open('journal'); } else if (e.code === 'KeyP' || e.code === 'Escape') { this.ov = 'pause'; this.hooks.unlock(); } return; }
      if (ov === 'help') { this.closeHelp(); return; }
      if (ov === 'pause') { if (e.code === 'Escape') { this.ov = null; this.hooks.lock(); } return; }
      if (ov === 'journal') { const J = Screens.journal, nb = visibleBiomes().length; if (e.code === 'Escape' && J.escape()) { /* back from the aberrants list */ } else if (e.code === 'Escape' || e.code === 'Tab') { Snd.sfx.page(); this.close(); } else if (e.code === 'ArrowLeft') { J.tab = (J.tab + nb - 1) % nb; J.sel = 0; } else if (e.code === 'ArrowRight') { J.tab = (J.tab + 1) % nb; J.sel = 0; } else if (e.code === 'ArrowUp') J.turn(-1); else if (e.code === 'ArrowDown') J.turn(1); return; }
      if (ov === 'code') { if (e.code === 'Escape') this.close(); else if (Secret.lock.key(e) === 'ok') this.codeCloseT = 1.5; return; }
      if (ov === 'talk') { if (e.code === 'Escape') this.close(); else if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') this.talkNext(); return; }
      if (ov === 'shop') { if (e.code === 'Escape' || e.code === 'KeyE') this.close(); else if (e.code === 'ArrowUp') this.shopMove(-1); else if (e.code === 'ArrowDown') this.shopMove(1); else if (e.code === 'Enter' || e.code === 'Space') this.shopBuy(); else if (e.code === 'Tab') this.shopTab(this.shop.tab + 1); else if (e.code === 'ArrowLeft') this.shopTab(this.shop.tab - 1); else if (e.code === 'ArrowRight') this.shopTab(this.shop.tab + 1); return; }
      if (ov === 'goods') { if (e.code === 'Escape' || e.code === 'KeyE') this.close(); else if (e.code === 'ArrowUp') this.goodsMove(-1); else if (e.code === 'ArrowDown') this.goodsMove(1); else if (e.code === 'Enter' || e.code === 'Space') this.goodsBuy(); return; }
      if (ov === 'collect') { if (e.code === 'Escape' || e.code === 'KeyE') this.close(); else if (e.code === 'ArrowUp') this.collMove(-1); else if (e.code === 'ArrowDown') this.collMove(1); else if (e.code === 'Enter' || e.code === 'Space') this.collSell(); return; }
      if (ov === 'sell') { if (e.code === 'Escape' || e.code === 'KeyE') this.close(); else if (e.code === 'ArrowUp') this.sellMove(-1); else if (e.code === 'ArrowDown') this.sellMove(1); else if (e.code === 'Enter' || e.code === 'Space') this.sellOne(); else if (e.code === 'Tab') this.sellTab(1); }
    }
    click(x, y) {
      const ov = this.ov;
      if (ov === 'pause') { const id = this.pauseButtons().find(b => UIK.hit(b, x, y)); this.pauseAct(id && id.id); }
      else if (ov === 'help') this.closeHelp();
      else if (ov === 'journal') { if (Screens.journal.click(x, y) === 'close') { Snd.sfx.page(); this.close(); } }
      else if (ov === 'sell') this.sellClick(x, y);
      else if (ov === 'goods') this.goodsClick(x, y);
      else if (ov === 'collect') this.collClick(x, y);
      else if (ov === 'shop') this.shopClick(x, y);
      else if (ov === 'code') { if (Secret.lock.click(x, y) === 'ok') this.codeCloseT = 1.5; }
      else if (ov === 'talk') this.talkNext();
    }
    wheel(dy) { if (this.ov === 'journal') Screens.journal.turn(dy > 0 ? 1 : -1); else if (this.ov === 'sell') this.sellMove(dy > 0 ? 1 : -1, true); else if (this.ov === 'goods') this.goodsMove(dy > 0 ? 1 : -1); else if (this.ov === 'collect') this.collMove(dy > 0 ? 1 : -1); else if (this.ov === 'shop') this.shopMove(dy > 0 ? 1 : -1); else if (this.ov === 'code') Secret.lock.wheel(dy); }
    closeHelp() { if (this.helpBack) { this.ov = 'pause'; } else { this.ov = null; this.hooks.lock(); } this.helpBack = false; }
    pauseButtons() { const s = Save.data.settings, x = SW / 2 - 90; return [{ id: 'resume', label: 'Продолжить', x, y: 76, w: 180, h: 20, size: 10 }, { id: 'help', label: 'Управление', x, y: 102, w: 88, h: 16 }, { id: 'stash', label: 'Склад (I)', x: x + 92, y: 102, w: 88, h: 16 }, { id: 'settings', label: 'Настройки', x, y: 124, w: 180, h: 16 }, { id: 'cabinet', label: 'В кабинет энтомолога', x, y: 146, w: 180, h: 16 }, { id: 'map', label: 'В экспедицию (карта мира)', x, y: 168, w: 180, h: 16 }, { id: 'title', label: 'Выход в главное меню', x, y: 190, w: 180, h: 16 }]; }
    pauseAct(id) {
      if (!id) return; Snd.sfx.click();
      if (id === 'resume') { this.ov = null; this.hooks.lock(); } else if (id === 'help') { this.ov = 'help'; this.helpBack = true; } else if (id === 'settings') this.hooks.settings(); else if (id === 'stash') this.hooks.stash(); else if (id === 'cabinet') this.hooks.cabinet(); else if (id === 'map') this.hooks.map(); else if (id === 'title') this.hooks.title();
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
        T.draw(ctx, fitTxt(e.i.sp.ru.replace(' · аберрант', ''), 112), r.x + 48, r.y + 3, { size: 8, color: e.i.isAb ? '#ff9ae8' : Rare.is(e.i.sp) ? '#ff5a5a' : '#f0e8d0' }); T.draw(ctx, e.i.isAb ? 'аберрант' + (e.i.spread ? ` · ${e.spec.q}%` : '') : e.i.spread ? `расправлен ${e.spec.q}%` : 'сырой', r.x + 48, r.y + 14, { size: 8, color: e.i.isAb ? '#c070b0' : c.dim });
        this.drawCoin(ctx, r.x + r.w - 16 - T.width(String(e.i.price), 8), r.y + 8); T.draw(ctx, String(e.i.price), r.x + r.w - 6, r.y + 8, { size: 8, align: 'r', color: c.gold }); });
      if (S.items.length > 7) { UIK.btn(ctx, L.up, UIK.hit(L.up, m.x, m.y)); UIK.btn(ctx, L.dn, UIK.hit(L.dn, m.x, m.y)); T.draw(ctx, `${S.sel + 1}/${S.items.length}`, 12, 253, { size: 8, color: c.dim }); }
      // right: the merchant and the selected specimen
      UIK.panel(ctx, 240, 40, 234, 54, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false }); Portrait.draw(ctx, 'buyer', 247, 43, t, S.msgT > 0);
      T.para(ctx, S.msg, 294, 46, 176, { size: 8, color: '#2a1a0c', lh: 10 });
      const e = S.items[S.sel]; UIK.panel(ctx, 240, 98, 234, 102, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false });
      if (e) { const i = e.i; ctx.fillStyle = '#c8a870'; ctx.fillRect(244, 102, 90, 46); ctx.imageSmoothingEnabled = false; ctx.drawImage(Art.specimen(i.sp), 247, 103, 84, 42);
        T.draw(ctx, fitTxt(i.sp.ru, 130), 340, 103, { size: 8, color: Rare.is(i.sp) ? '#c01818' : '#2a1a0c' }); T.draw(ctx, fitTxt(i.sp.la, 130), 340, 114, { size: 8, color: '#8a2a1a' }); T.draw(ctx, `${i.sp.mm[0]}–${i.sp.mm[1]} мм`, 340, 125, { size: 8, color: '#6a5030' }); T.draw(ctx, e.spec.by ? `поймал: ${e.spec.by}` : i.spread ? `качество ${e.spec.q}%` : 'не расправлен', 340, 136, { size: 8, color: '#6a5030' });
        const rows = [[`Вид (${i.isOcean ? 'редкость ???' : '★'.repeat(0) + 'редкость ' + (i.species.rar || 1) + '/3'})`, `${i.base}`], i.loc > 1 ? ['Особая локация', `×${i.loc}`] : null, i.isAb ? ['Аберрант', `×${i.ab.toFixed(1)}`] : null, [i.spread ? `Расправлен ${e.spec.q}%` : 'Сырой экземпляр', `×${i.cond.toFixed(2)}`]].filter(Boolean);
        rows.forEach((r, k) => { const ry = rows.length > 3 ? 148 + k * 9 : 154 + k * 11; T.draw(ctx, r[0], 248, ry, { size: 8, color: '#2a1a0c' }); T.draw(ctx, r[1], 466, ry, { size: 8, align: 'r', color: '#6a5030' }); });
        ctx.fillStyle = '#a8946a'; ctx.fillRect(246, 187, 222, 1); T.draw(ctx, 'Цена', 248, 189, { size: 8, color: '#2a1a0c' }); this.drawCoin(ctx, 424, 190); T.draw(ctx, String(i.price), 466, 189, { size: 8, align: 'r', color: '#8a5a10' });
      } else T.draw(ctx, 'Выберите экземпляр слева', 357, 140, { size: 8, align: 'c', color: '#6a5030' });
      UIK.btn(ctx, L.sellBtn, !L.sellBtn.disabled && UIK.hit(L.sellBtn, m.x, m.y)); UIK.btn(ctx, L.allBtn, !L.allBtn.disabled && UIK.hit(L.allBtn, m.x, m.y));
      T.draw(ctx, S.bulk.length ? `Все обычные: ${S.bulkSum} монет` : '', 244, 246, { size: 8, color: c.dim });
      if (S.flash > 0) { ctx.globalAlpha = Math.min(1, S.flash * 2); T.draw(ctx, `+${S.last}`, SW - 8, 40 - (0.8 - S.flash) * 8, { size: 10, align: 'r', color: '#ffe070', shadow: '#000' }); ctx.globalAlpha = 1; }
    }
    // ------------------------------------------------------------ the collector: buys framed collections that are not hung up (and the frame of the guiding butterfly's wings)
    collOpen() { Wings.announce(Wings.check(), (s, d) => this.toast(s, d)); this.col = { tab: 'sell', bsel: 0, sel: 0, scroll: 0, msg: 'Принесли рамку? Покажите, что в ней. Стройная коллекция стоит дороже набора случайных бабочек.', msgT: 6, flash: 0, last: 0, confirm: 0, clickT: 0, clickIdx: -1 }; this.collRefresh(); }
    collRefresh() {
      const S = this.col; if (!S) return; const items = [];
      if (Wings.built()) items.push({ wing: true, total: Collection.FRAME.L });
      for (const b of Save.data.boxes) if (!b.loc && b.items.some(Boolean)) { const inf = Collection.info(b); if (inf.n) items.push({ box: b, inf, total: inf.total }); }
      S.items = items.sort((a, b) => (b.wing ? 1e9 : b.total) - (a.wing ? 1e9 : a.total)); S.sel = clamp(S.sel, 0, Math.max(0, items.length - 1)); const vis = 6; S.scroll = clamp(S.scroll, 0, Math.max(0, items.length - vis)); if (S.sel < S.scroll) S.scroll = S.sel; if (S.sel >= S.scroll + vis) S.scroll = S.sel - vis + 1;
    }
    collMove(d) { const S = this.col; if (S && S.tab === 'buy') { S.bsel = clamp(S.bsel + d, 0, 2); Snd.sfx.page(); return; } if (!S || !S.items.length) return; S.confirm = 0; S.sel = clamp(S.sel + d, 0, S.items.length - 1); this.collRefresh(); Snd.sfx.page(); }
    collBuy() {
      const S = this.col, sz = ['S', 'M', 'L'][S.bsel], pr = Boxes.PRICE[sz], nm = Boxes.SIZE_NAME[sz].toLowerCase();
      if (Save.data.boxes.length + Save.stockTotal() >= 100) { S.msg = 'Столько коробок вам уже не унести. Развесьте или продайте те, что есть.'; S.msgT = 5; Snd.sfx.deny(); return; }
      if (!Save.buyBox(sz)) { S.msg = `Не хватает монет: ${nm} коробка стоит ${pr}.`; S.msgT = 4; Snd.sfx.deny(); return; }
      S.msg = `Держите: ${nm} коробка. Собрать и оформить её можно на верстаке в кабинете.`; S.msgT = 5; S.flash = 0.8; S.last = -pr; Snd.sfx.coin();
    }
    collSell() {
      const S = this.col; if (S.tab === 'buy') return this.collBuy(); const e = S.items[S.sel]; if (!e) return;
      if (e.wing) { const r = Wings.sell(); if (!r) return; S.msg = 'Крылья путеводной бабочки... со всех концов света! Вот ваша карта океана — и ' + r.coins + ' монет за рамку. Берегите себя там, за горизонтом.'; S.msgT = 9; S.flash = 0.8; S.last = r.coins; Snd.sfx.reward(); this.toast('Получена карта океана! Она открыта на карте мира.', 6); this.collRefresh(); return; }
      if (e.inf.n >= 3 && e.inf.rows.some(r => r.ab || r.rare) && S.confirm !== e.box.uid) { S.confirm = e.box.uid; S.confirmT = 4; S.msg = 'В рамке аберранты или редчайшие находки! Уверены? Нажмите «Продать» ещё раз.'; S.msgT = 4; Snd.sfx.deny(); return; }
      S.confirm = 0; const p = Save.sellBox(e.box.uid); if (!p) return;
      S.msg = e.inf.themes.length ? `Прекрасно подобрано (закономерностей: ${e.inf.themes.length}, цена ×${fmtK(e.inf.mult)})! Держите ${p} монет.` : `Беру. ${p} монет. Соберите все бабочки по одному признаку — заплачу больше.`; S.msgT = 6; S.flash = 0.8; S.last = p; Snd.sfx.reward(); this.collRefresh();
    }
    collLayout() {
      const S = this.col, rows = []; for (let k = 0; k < 6; k++) { const idx = S.scroll + k; if (idx >= S.items.length) break; rows.push({ id: 'row', idx, x: 8, y: 44 + k * 35, w: 226, h: 33 }); }
      const e = S.items[S.sel];
      return { rows, sellBtn: { id: 'sell', label: S.tab === 'buy' ? 'Купить' : (e && !e.wing && S.confirm === e.box.uid) ? 'Точно продать?' : e && e.wing ? 'Отдать рамку' : 'Продать рамку', x: 244, y: 232, w: 120, h: 18, size: 8, disabled: S.tab === 'buy' ? false : !e }, closeBtn: { id: 'close', label: 'Уйти ✕', x: SW - 82, y: 4, w: 74, h: 15 }, up: { id: 'up', label: '^', x: 176, y: 252, w: 26, h: 12 }, dn: { id: 'dn', label: 'v', x: 206, y: 252, w: 26, h: 12 },
        tabs: [{ id: 'sell', label: 'Продать', x: 140, y: 5, w: 56, h: 14 }, { id: 'buy', label: 'Коробки', x: 198, y: 5, w: 56, h: 14 }], brows: [0, 1, 2].map(i => ({ id: 'brow', i, x: 8, y: 44 + i * 35, w: 226, h: 33 })) };
    }
    collClick(x, y) {
      const S = this.col, L = this.collLayout(); if (UIK.hit(L.closeBtn, x, y)) { Snd.sfx.page(); this.close(); return; }
      const tb = L.tabs.find(b => UIK.hit(b, x, y)); if (tb) { if (S.tab !== tb.id) { S.tab = tb.id; S.confirm = 0; Snd.sfx.page(); } return; }
      if (S.tab === 'buy') { const br = L.brows.find(r => UIK.hit(r, x, y)); if (br) { const now = performance.now(); if (S.bsel === br.i && S.clickIdx === br.i && now - S.clickT < 450) { this.collBuy(); S.clickIdx = -1; } else { S.bsel = br.i; S.clickIdx = br.i; S.clickT = now; Snd.sfx.click(); } return; } if (UIK.hit(L.sellBtn, x, y)) this.collBuy(); return; }
      const r = L.rows.find(r => UIK.hit(r, x, y)); if (r) { const now = performance.now(); if (S.sel === r.idx && S.clickIdx === r.idx && now - S.clickT < 450) { this.collSell(); S.clickIdx = -1; } else { S.sel = r.idx; S.clickIdx = r.idx; S.clickT = now; S.confirm = 0; this.collRefresh(); Snd.sfx.click(); } return; }
      if (!L.sellBtn.disabled && UIK.hit(L.sellBtn, x, y)) this.collSell(); else if (UIK.hit(L.up, x, y)) this.collMove(-1); else if (UIK.hit(L.dn, x, y)) this.collMove(1);
    }
    drawBoxThumb(ctx, box, x, y, w, h) { const sz = Boxes.pxSize(box.size), k = Math.min(w / sz.w, h / sz.h), dw = Math.round(sz.w * k), dh = Math.round(sz.h * k); ctx.imageSmoothingEnabled = k < 1; ctx.drawImage(Boxes.canvas(box), Math.round(x + (w - dw) / 2), Math.round(y + (h - dh) / 2), dw, dh); ctx.imageSmoothingEnabled = false; }
    drawBuyBoxes(ctx, t, m, L) {
      const S = this.col, pick = ['S', 'M', 'L'][S.bsel];
      T.draw(ctx, 'Пустые коробки для коллекций. Выберите размер и нажмите «Купить» (или щёлкните дважды)', 8, 20, { size: 8, color: c.dim });
      T.draw(ctx, 'Коробки', 8, 32, { size: 8, color: c.dim }); this.drawCoins(ctx, SW - 92, 24, true); UIK.btn(ctx, L.closeBtn, UIK.hit(L.closeBtn, m.x, m.y));
      UIK.panel(ctx, 6, 42, 230, 212, { fill: '#1e2c24', border: '#46604f', shadow: false });
      L.brows.forEach(r => { const sz = ['S', 'M', 'L'][r.i], on = r.i === S.bsel, hv = UIK.hit(r, m.x, m.y), fake = { uid: 1, size: sz, style: 0, items: new Array(Save.CAP[sz]).fill(0), loc: null };
        ctx.fillStyle = on ? 'rgba(240,200,90,0.26)' : hv ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)'; ctx.fillRect(r.x, r.y, r.w, r.h); if (on) { ctx.strokeStyle = c.gold; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); }
        ctx.fillStyle = '#0c1612'; ctx.fillRect(r.x + 2, r.y + 2, 54, 29); this.drawBoxThumb(ctx, fake, r.x + 3, r.y + 3, 52, 27);
        T.draw(ctx, `${Boxes.SIZE_NAME[sz]} коробка`, r.x + 60, r.y + 5, { size: 8, color: '#f0e8d0' }); T.draw(ctx, `вмещает ${Save.CAP[sz]} · у вас: ${Save.stock(sz)}`, r.x + 60, r.y + 17, { size: 8, color: c.dim });
        const pr = Boxes.PRICE[sz]; this.drawCoin(ctx, r.x + r.w - 16 - T.width(String(pr), 8), r.y + 5); T.draw(ctx, String(pr), r.x + r.w - 6, r.y + 5, { size: 8, align: 'r', color: (Save.data.coins || 0) >= pr ? c.gold : c.red }); });
      UIK.panel(ctx, 240, 40, 234, 54, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false }); Portrait.draw(ctx, 'collector', 247, 43, t, S.msgT > 0);
      T.para(ctx, S.msg, 294, 44, 176, { size: 8, color: '#2a1a0c', lh: 9 });
      UIK.panel(ctx, 240, 98, 234, 130, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false });
      const fake = { uid: 1, size: pick, style: 0, items: new Array(Save.CAP[pick]).fill(0), loc: null }, pr = Boxes.PRICE[pick];
      ctx.fillStyle = '#10201c'; ctx.fillRect(244, 102, 90, 60); this.drawBoxThumb(ctx, fake, 246, 104, 86, 56);
      T.draw(ctx, `${Boxes.SIZE_NAME[pick]} коробка`, 340, 103, { size: 8, color: '#2a1a0c' }); T.draw(ctx, `вмещает бабочек: ${Save.CAP[pick]}`, 340, 114, { size: 8, color: '#6a5030' }); T.draw(ctx, `в запасе: ${Save.stock(pick)}`, 340, 125, { size: 8, color: '#2a6a1a' });
      T.para(ctx, 'Пустая коробка. Вид — орех, дуб или чёрный лак — выбирается на верстаке в кабинете, там же в неё кладут расправленных бабочек. Разобранная коробка возвращается в запас.', 248, 168, 218, { size: 8, color: '#4a3a20', lh: 9 });
      ctx.fillStyle = '#a8946a'; ctx.fillRect(246, 214, 222, 1); T.draw(ctx, 'Цена', 248, 217, { size: 8, color: '#2a1a0c' }); this.drawCoin(ctx, 424, 218); T.draw(ctx, String(pr), 466, 217, { size: 8, align: 'r', color: '#8a5a10' });
      UIK.btn(ctx, L.sellBtn, UIK.hit(L.sellBtn, m.x, m.y));
      T.draw(ctx, `Всего в запасе: ${Save.stockTotal()}`, 372, 238, { size: 8, color: c.dim });
      if (S.flash > 0) { ctx.globalAlpha = Math.min(1, S.flash * 2); T.draw(ctx, String(S.last), SW - 8, 40 - (0.8 - S.flash) * 8, { size: 10, align: 'r', color: '#ffb0a0', shadow: '#000' }); ctx.globalAlpha = 1; }
    }
    drawColl(ctx, t, m, dt) {
      const S = this.col; S.msgT = Math.max(0, S.msgT - dt); if (S.confirm) { S.confirmT -= dt; if (S.confirmT <= 0) S.confirm = 0; } S.flash = Math.max(0, S.flash - dt); const L = this.collLayout();
      ctx.fillStyle = '#14201a'; ctx.fillRect(0, 0, SW, SH); for (let i = 0; i < SW; i += 3) { ctx.fillStyle = (i % 9 === 0) ? '#1a2a22' : '#16241c'; ctx.fillRect(i, 0, 3, SH); }
      T.draw(ctx, 'Торговец коллекциями', 8, 6, { size: 10, color: c.gold }); L.tabs.forEach(b => { const on = b.id === S.tab; UIK.panel(ctx, b.x, b.y, b.w, b.h, { fill: on ? '#2a5a46' : UIK.hit(b, m.x, m.y) ? '#244a3c' : '#1a3228', border: on ? c.gold : c.line, shadow: false }); T.draw(ctx, b.label, b.x + b.w / 2, b.y + 3, { size: 8, align: 'c', color: on ? '#fff' : c.dim }); });
      if (S.tab === 'buy') return this.drawBuyBoxes(ctx, t, m, L);
      T.draw(ctx, 'Покупает готовые рамки, не повешенные на стену. Выберите рамку и нажмите «Продать»', 8, 20, { size: 8, color: c.dim });
      T.draw(ctx, 'Рамки (не на стене)', 8, 32, { size: 8, color: c.dim }); this.drawCoins(ctx, SW - 92, 24, true); UIK.btn(ctx, L.closeBtn, UIK.hit(L.closeBtn, m.x, m.y));
      UIK.panel(ctx, 6, 42, 230, 212, { fill: '#1e2c24', border: '#46604f', shadow: false });
      if (!S.items.length) T.para(ctx, 'Здесь пусто. Соберите в кабинете рамку с бабочками (верстак → коробка) и не вешайте её на стену — или снимите со стены.', 16, 90, 210, { size: 8, color: c.dim, lh: 10 });
      L.rows.forEach(r => { const e = S.items[r.idx], on = r.idx === S.sel, hv = UIK.hit(r, m.x, m.y); ctx.fillStyle = on ? 'rgba(240,200,90,0.26)' : hv ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)'; ctx.fillRect(r.x, r.y, r.w, r.h); if (on) { ctx.strokeStyle = c.gold; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); }
        ctx.fillStyle = '#0c1612'; ctx.fillRect(r.x + 2, r.y + 2, 54, 29);
        if (e.wing) { ctx.fillStyle = '#6a4a2c'; ctx.fillRect(r.x + 8, r.y + 6, 42, 21); const a = Art.specimen(SPECIES_BY_ID.lux_ductrix || SPECIES[0]); ctx.drawImage(a, r.x + 10, r.y + 8, 38, 17); T.draw(ctx, 'Рамка путеводных крыльев', r.x + 60, r.y + 5, { size: 8, color: '#a8e8b0' }); T.draw(ctx, '8 крыльев · особый заказ', r.x + 60, r.y + 17, { size: 8, color: c.dim }); }
        else { this.drawBoxThumb(ctx, e.box, r.x + 3, r.y + 3, 52, 27); T.draw(ctx, fitTxt(Boxes.boxLabel ? Boxes.boxLabel(e.box) : `${Boxes.SIZE_NAME[e.box.size]} · ${e.inf.n}/${e.inf.cap}`, 160), r.x + 60, r.y + 5, { size: 8, color: '#f0e8d0' }); T.draw(ctx, e.inf.themes.length > 1 ? `закономерностей: ${e.inf.themes.length}` : e.inf.theme ? fitTxt(e.inf.theme.name, 120) : 'без закономерности', r.x + 60, r.y + 17, { size: 8, color: e.inf.themes.length ? '#9ae0b0' : c.dim }); }
        this.drawCoin(ctx, r.x + r.w - 16 - T.width(String(e.total), 8), r.y + 5); T.draw(ctx, String(e.total), r.x + r.w - 6, r.y + 5, { size: 8, align: 'r', color: c.gold }); });
      if (S.items.length > 6) { UIK.btn(ctx, L.up, UIK.hit(L.up, m.x, m.y)); UIK.btn(ctx, L.dn, UIK.hit(L.dn, m.x, m.y)); T.draw(ctx, `${S.sel + 1}/${S.items.length}`, 12, 255, { size: 8, color: c.dim }); }
      UIK.panel(ctx, 240, 40, 234, 54, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false }); Portrait.draw(ctx, 'collector', 247, 43, t, S.msgT > 0);
      T.para(ctx, S.msg, 294, 44, 176, { size: 8, color: '#2a1a0c', lh: 9 });
      const e = S.items[S.sel]; UIK.panel(ctx, 240, 98, 234, 130, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false });
      const line = (k, a, b, col) => { T.draw(ctx, a, 248, 148 + k * 10, { size: 8, color: col || '#2a1a0c' }); T.draw(ctx, b, 466, 148 + k * 10, { size: 8, align: 'r', color: col || '#6a5030' }); };
      if (e && e.wing) {
        ctx.fillStyle = '#10201c'; ctx.fillRect(244, 102, 90, 42); const a = Art.specimen(SPECIES_BY_ID.lux_ductrix || SPECIES[0]); ctx.drawImage(a, 247, 105, 84, 36);
        T.draw(ctx, 'Рамка путеводных крыльев', 340, 103, { size: 8, color: '#2a1a0c' }); T.draw(ctx, 'по крылу с каждой начальной локации', 340, 114, { size: 8, color: '#8a2a1a' });
        line(0, 'Рамка (большая)', String(Collection.FRAME.L)); line(1, 'Карта океана', 'в подарок', '#2a6a1a'); T.para(ctx, 'Такой рамки в моей коллекции ещё не было. За неё отдаю карту океана.', 248, 172, 218, { size: 8, color: '#4a3a20', lh: 10 });
        ctx.fillStyle = '#a8946a'; ctx.fillRect(246, 212, 222, 1); T.draw(ctx, 'Цена', 248, 215, { size: 8, color: '#2a1a0c' }); this.drawCoin(ctx, 424, 216); T.draw(ctx, String(e.total), 466, 215, { size: 8, align: 'r', color: '#8a5a10' });
      } else if (e) {
        const i = e.inf; ctx.fillStyle = '#10201c'; ctx.fillRect(244, 102, 90, 32); this.drawBoxThumb(ctx, e.box, 246, 103, 86, 30);
        T.draw(ctx, `Бабочек: ${i.n} из ${i.cap}`, 340, 103, { size: 8, color: '#2a1a0c' }); T.draw(ctx, i.themes.length ? `закономерностей: ${i.themes.length}` : i.n < i.need ? `нужно хотя бы ${i.need}` : 'закономерность не видна', 340, 114, { size: 8, color: i.themes.length ? '#2a6a1a' : '#8a2a1a' });
        const L9 = (k, a2, b2, col) => { T.draw(ctx, a2, 248, 138 + k * 9, { size: 8, color: col || '#2a1a0c' }); T.draw(ctx, b2, 466, 138 + k * 9, { size: 8, align: 'r', color: col || '#6a5030' }); };
        let k = 0; L9(k++, `Рамка (${Boxes.SIZE_NAME[e.box.size].toLowerCase()}) + бабочки (${i.n})`, String(i.baseSum));
        i.themes.slice(0, 7).forEach(th => L9(k++, fitTxt(th.name, 170), '×' + fmtK(th.coef), '#2a6a1a')); if (i.themes.length > 1) L9(k++, 'Все закономерности вместе', '×' + fmtK(i.mult), '#1a5a1a');
        if (!i.themes.length) T.para(ctx, 'Все бабочки в рамке должны подходить под признак — тогда цена умножается: только аберранты ×1,7, только редкие ×1,9, одно семейство ×1,5, только разные ×1,5, одна локация ×1,4, один вид ×1,2, один цвет ×1,2. Коэффициенты перемножаются.', 248, 138 + k * 9, 218, { size: 8, color: '#4a3a20', lh: 9 });
        ctx.fillStyle = '#a8946a'; ctx.fillRect(246, 214, 222, 1); T.draw(ctx, 'Цена', 248, 217, { size: 8, color: '#2a1a0c' }); this.drawCoin(ctx, 424, 218); T.draw(ctx, String(i.total), 466, 217, { size: 8, align: 'r', color: '#8a5a10' });
      } else T.draw(ctx, 'Выберите рамку слева', 357, 150, { size: 8, align: 'c', color: '#6a5030' });
      UIK.btn(ctx, L.sellBtn, !L.sellBtn.disabled && UIK.hit(L.sellBtn, m.x, m.y));
      if (S.flash > 0) { ctx.globalAlpha = Math.min(1, S.flash * 2); T.draw(ctx, `+${S.last}`, SW - 8, 40 - (0.8 - S.flash) * 8, { size: 10, align: 'r', color: '#ffe070', shadow: '#000' }); ctx.globalAlpha = 1; }
    }
    // ------------------------------------------------------------ the three traders of the trap trade: flowers (scent), honey (rarity) and the traps themselves
    goodsOpen(kind) {
      const L = { fl: 'Цветочница', hn: 'Медовщик', tr: 'Торговец ловушками' }, M0 = { fl: 'Свежие цветы с полей! Чем сильнее запах, тем больше бабочек прилетит в ловушку.', hn: 'Мёд разных сортов. Чем он ценнее, тем более редкие гости слетаются на запах.', tr: 'Ловушки для дневных бабочек. Ставьте их в экспедиции (G), кладите приманку, забирайте улов (E) — до того, как ловушка сломается или вы уйдёте с локации: улов пропадает вместе с ловушкой.' };
      this.gd = { kind, sel: 0, scroll: 0, msg: M0[kind], msgT: 6, flash: 0, last: 0, who: L[kind], t0: 0 };
    }
    goodsList() { return Traps.KINDS[this.gd.kind].list.filter(x => !x.secret); }
    goodsMove(d) { const G = this.gd, n = this.goodsList().length; G.sel = clamp(G.sel + d, 0, n - 1); if (G.sel < G.scroll) G.scroll = G.sel; if (G.sel >= G.scroll + 6) G.scroll = G.sel - 5; Snd.sfx.page(); }
    goodsBuy() {
      const G = this.gd, it = this.goodsList()[G.sel]; if (!it) return; const got = Traps.buy(G.kind, it.id);
      if (got) { G.msg = G.kind === 'tr' ? 'Хороший выбор! Не забудьте приманку.' : ['Свежайшее!', 'Берите, не пожалеете.', 'Отличный выбор для приманки.'][(Math.random() * 3) | 0]; G.last = -got; G.flash = 0.8; Snd.sfx.coin(); }
      else { G.msg = 'Не хватает монет. Продайте бабочек или рамку коллекционеру.'; Snd.sfx.deny(); } G.msgT = 5;
    }
    goodsLayout() {
      const G = this.gd, list = this.goodsList(), rows = []; for (let k = 0; k < 6; k++) { const i = G.scroll + k; if (i >= list.length) break; rows.push({ id: 'row', i, x: 8, y: 44 + k * 35, w: 226, h: 33 }); }
      return { rows, buy: { id: 'buy', label: 'Купить', x: 244, y: 232, w: 110, h: 18 }, closeBtn: { id: 'close', label: 'Уйти ✕', x: SW - 82, y: 4, w: 74, h: 15 }, up: { id: 'up', label: '^', x: 176, y: 252, w: 26, h: 12 }, dn: { id: 'dn', label: 'v', x: 206, y: 252, w: 26, h: 12 } };
    }
    goodsClick(x, y) {
      const G = this.gd, L = this.goodsLayout(); if (UIK.hit(L.closeBtn, x, y)) { Snd.sfx.page(); this.close(); return; }
      const r = L.rows.find(r => UIK.hit(r, x, y)); if (r) { if (G.sel !== r.i) { G.sel = r.i; Snd.sfx.click(); } else this.goodsBuy(); return; }
      if (UIK.hit(L.buy, x, y)) this.goodsBuy(); else if (UIK.hit(L.up, x, y)) this.goodsMove(-1); else if (UIK.hit(L.dn, x, y)) this.goodsMove(1);
    }
    goodsIcon(ctx, kind, it, x, y, k) { if (kind !== 'tr') { const cv = Traps.closeup(kind, it.id); if (cv) { ctx.imageSmoothingEnabled = false; const h = Math.round(k * 17), w = Math.round(h * 0.667); ctx.drawImage(cv, x + Math.round(((k > 2 ? 62 : 32) - w) / 2) - (k > 2 ? 0 : 0), y - (k > 2 ? 4 : 0), w, h); return; } } if (kind === 'fl') Traps.drawFlower(ctx, x, y, it, k); else if (kind === 'hn') Traps.drawJar(ctx, x, y, it, k); else { if (!this.trapThumb) this.trapThumb = {}; const g = this.trapThumb[it.id] || (this.trapThumb[it.id] = Traps.model(it.id, {})); Traps.UI.preview(ctx, { group: g }, this.t * 0.7, x, y, Math.round(k * 0.67), k); } }
    drawGoods(ctx, t, m, dt) {
      const G = this.gd, K = G.kind, list = this.goodsList(), L = this.goodsLayout(), it = list[G.sel]; G.msgT = Math.max(0, G.msgT - dt); G.flash = Math.max(0, G.flash - dt);
      const title = { fl: 'Цветы', hn: 'Мёд', tr: 'Ловушки для бабочек' }[K], por = { fl: 'florist', hn: 'beekeeper', tr: 'trapper' }[K];
      ctx.fillStyle = '#1c1410'; ctx.fillRect(0, 0, SW, SH); for (let i = 0; i < SW; i += 3) { ctx.fillStyle = (i % 9 === 0) ? '#241a14' : '#201610'; ctx.fillRect(i, 0, 3, SH); }
      T.draw(ctx, title, 8, 6, { size: 10, color: c.gold }); T.draw(ctx, 'Выберите товар и нажмите «Купить» (или щёлкните дважды)', 8, 20, { size: 8, color: c.dim }); T.draw(ctx, G.who, 8, 32, { size: 8, color: c.dim });
      this.drawCoins(ctx, SW - 92, 24, true); UIK.btn(ctx, L.closeBtn, UIK.hit(L.closeBtn, m.x, m.y));
      UIK.panel(ctx, 6, 42, 230, 212, { fill: '#2a2018', border: '#5a4430', shadow: false });
      L.rows.forEach(r => { const q = list[r.i], on = r.i === G.sel, hv = UIK.hit(r, m.x, m.y), own = Traps.count(K, q.id); ctx.fillStyle = on ? 'rgba(240,200,90,0.28)' : hv ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.18)'; ctx.fillRect(r.x, r.y, r.w, r.h); if (on) { ctx.strokeStyle = c.gold; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); }
        ctx.fillStyle = '#16100c'; ctx.fillRect(r.x + 2, r.y + 2, 32, 29); this.goodsIcon(ctx, K, q, r.x + (K === 'tr' ? 8 : 4), r.y + (K === 'tr' ? 2 : 5), K === 'tr' ? 29 : 1.8);
        T.draw(ctx, fitTxt(q.ru, 150), r.x + 38, r.y + 4, { size: 8, color: '#f0e8d0' }); const sub = K === 'fl' ? `запах: ${Traps.SCENT[q.scent]}` : K === 'hn' ? `качество: ${Traps.QUAL[q.q]}` : `служит ${Traps.mmss(q.life)} · вмещает ${q.cap}`; T.draw(ctx, fitTxt(sub, 150), r.x + 38, r.y + 15, { size: 8, color: '#9ac88a' });
        if (own) T.draw(ctx, `есть: ${own}`, r.x + 38, r.y + 24, { size: 8, color: c.dim }); this.drawCoin(ctx, r.x + r.w - 16 - T.width(String(q.price), 8), r.y + 4); T.draw(ctx, String(q.price), r.x + r.w - 6, r.y + 4, { size: 8, align: 'r', color: c.gold }); });
      if (list.length > 6) { UIK.btn(ctx, L.up, UIK.hit(L.up, m.x, m.y)); UIK.btn(ctx, L.dn, UIK.hit(L.dn, m.x, m.y)); T.draw(ctx, `${G.sel + 1}/${list.length}`, 12, 255, { size: 8, color: c.dim }); }
      UIK.panel(ctx, 240, 40, 234, 54, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false }); Portrait.draw(ctx, por, 247, 43, t, G.msgT > 0); T.para(ctx, G.msg, 294, 44, 176, { size: 8, color: '#2a1a0c', lh: 9 });
      UIK.panel(ctx, 240, 98, 234, 130, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false });
      if (it) {
        ctx.fillStyle = '#c8a870'; ctx.fillRect(244, 102, 62, 62); this.goodsIcon(ctx, K, it, K === 'tr' ? 255 : 250, K === 'tr' ? 103 : 108, K === 'tr' ? 60 : 3.4);
        T.draw(ctx, fitTxt(it.ru, 160), 312, 103, { size: 8, color: '#2a1a0c' }); T.draw(ctx, fitTxt(it.la || it.real || '', 160), 312, 114, { size: 8, color: '#8a2a1a' });
        if (K === 'fl') { T.draw(ctx, `Запах: ${it.scent} из 5`, 312, 126, { size: 8, color: '#2a6a1a' }); T.draw(ctx, `≈ ${(1.1 * it.scent).toFixed(1)} бабочек/мин`, 312, 137, { size: 8, color: '#4a3a20' }); }
        else if (K === 'hn') { T.draw(ctx, `Качество: ${it.q} из 5`, 312, 126, { size: 8, color: '#2a6a1a' }); T.draw(ctx, `редкие гости до ×${Traps.rarK(it.id, 3).toFixed(1)}`, 312, 137, { size: 8, color: '#4a3a20' }); }
        else { T.draw(ctx, `Служит ${Traps.mmss(it.life)}`, 312, 126, { size: 8, color: '#2a6a1a' }); T.draw(ctx, `Вмещает ${it.cap} бабочек`, 312, 137, { size: 8, color: '#4a3a20' }); }
        T.para(ctx, it.desc, 248, 170, 222, { size: 8, color: '#4a3a20', lh: 9 });
        ctx.fillStyle = '#a8946a'; ctx.fillRect(246, 212, 222, 1); T.draw(ctx, 'Цена', 248, 215, { size: 8, color: '#2a1a0c' }); this.drawCoin(ctx, 424, 216); T.draw(ctx, String(it.price), 466, 215, { size: 8, align: 'r', color: '#8a5a10' });
      }
      UIK.btn(ctx, L.buy, UIK.hit(L.buy, m.x, m.y)); T.draw(ctx, it ? `у вас: ${Traps.count(K, it.id)}` : '', 372, 237, { size: 8, color: c.dim });
      if (G.flash > 0) { ctx.globalAlpha = Math.min(1, G.flash * 2); T.draw(ctx, String(G.last), SW - 8, 40 - (0.8 - G.flash) * 8, { size: 10, align: 'r', color: '#ff9070', shadow: '#000' }); ctx.globalAlpha = 1; }
    }
    // ------------------------------------------------------------ the net seller: parts for nets
    shopOpen() { this.shop = { tab: 0, sel: 0, msg: 'Всё для настоящего сачка! Собрать его можно на верстаке в кабинете.', msgT: 5, flash: 0, last: 0 }; }
    shopList() { const slot = NetParts.SLOTS[this.shop.tab].id; return NetParts.SHOP.filter(id => NetParts.PARTS[id].slot === slot).sort((a, b) => NetParts.PARTS[a].price - NetParts.PARTS[b].price); }
    shopMove(d) { const S = this.shop; if (!S) return; S.sel = clamp(S.sel + d, 0, this.shopList().length - 1); Snd.sfx.page(); }
    shopTab(t) { const S = this.shop; S.tab = (t + 3) % 3; S.sel = 0; Snd.sfx.page(); }
    shopLayout() {
      const rows = this.shopList().map((id, k) => ({ id, k, x: 8, y: 60 + k * 24, w: 226, h: 22 })), tabs = NetParts.SLOTS.map((sl, i) => ({ id: 'tab' + i, i, label: ['Ручки', 'Обручи', 'Сетки'][i], x: 8 + i * 76, y: 40, w: 72, h: 15 }));
      return { rows, tabs, buy: { id: 'buy', label: 'Купить', x: 244, y: 224, w: 110, h: 18 }, closeBtn: { id: 'close', label: 'Уйти ✕', x: SW - 82, y: 4, w: 74, h: 15 } };
    }
    shopBuy() {
      const S = this.shop, id = this.shopList()[S.sel], p = NetParts.PARTS[id]; if (!p) return;
      if (Save.buyPart(id)) { S.msg = ['Отличный выбор!', 'Берите, не пожалеете.', 'Хорошая деталь — служит годами.'][(Math.random() * 3) | 0]; S.last = -p.price; S.flash = 0.8; Snd.sfx.coin(); }
      else { S.msg = 'Не хватает монет. Продайте бабочек скупщику — тот, что под красным навесом.'; Snd.sfx.deny(); } S.msgT = 5;
    }
    shopClick(x, y) {
      const S = this.shop, L = this.shopLayout(); if (UIK.hit(L.closeBtn, x, y)) { Snd.sfx.page(); this.close(); return; }
      const tb = L.tabs.find(t => UIK.hit(t, x, y)); if (tb) { this.shopTab(tb.i); return; }
      const r = L.rows.find(r => UIK.hit(r, x, y)); if (r) { if (S.sel !== r.k) { S.sel = r.k; Snd.sfx.click(); } else this.shopBuy(); return; }
      if (UIK.hit(L.buy, x, y)) this.shopBuy();
    }
    drawShop(ctx, t, m, dt) {
      const S = this.shop; S.msgT = Math.max(0, S.msgT - dt); S.flash = Math.max(0, S.flash - dt); const L = this.shopLayout(), list = this.shopList(), id = list[S.sel], p = NetParts.PARTS[id];
      ctx.fillStyle = '#1c1410'; ctx.fillRect(0, 0, SW, SH); for (let i = 0; i < SW; i += 3) { ctx.fillStyle = (i % 9 === 0) ? '#241a14' : '#201610'; ctx.fillRect(i, 0, 3, SH); }
      T.draw(ctx, 'Детали для сачков', 8, 6, { size: 10, color: c.gold }); T.draw(ctx, 'Выберите деталь и нажмите «Купить» (или щёлкните дважды). Tab — следующая вкладка', 8, 20, { size: 8, color: c.dim });
      this.drawCoins(ctx, SW - 92, 24, true); UIK.btn(ctx, L.closeBtn, UIK.hit(L.closeBtn, m.x, m.y));
      L.tabs.forEach(tb => { const on = tb.i === S.tab; UIK.panel(ctx, tb.x, tb.y, tb.w, tb.h, { fill: on ? '#4a3220' : UIK.hit(tb, m.x, m.y) ? '#34261a' : '#2a1e16', border: on ? c.gold : '#5a4430' }); T.draw(ctx, tb.label, tb.x + tb.w / 2, tb.y + 4, { size: 8, align: 'c', color: on ? '#ffe9a0' : '#b8a888' }); });
      UIK.panel(ctx, 6, 56, 230, 208, { fill: '#2a2018', border: '#5a4430', shadow: false });
      L.rows.forEach(r => {
        const q = NetParts.PARTS[r.id], on = r.k === S.sel, hv = UIK.hit(r, m.x, m.y); ctx.fillStyle = on ? 'rgba(240,200,90,0.28)' : hv ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.18)'; ctx.fillRect(r.x, r.y, r.w, r.h); if (on) { ctx.strokeStyle = c.gold; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); }
        const own = Save.partCount(r.id); T.draw(ctx, fitTxt(q.ru, 150), r.x + 5, r.y + 3, { size: 8, color: '#f0e8d0' }); T.draw(ctx, fitTxt(NetParts.fxShort(q.fx), own ? 150 : 214), r.x + 5, r.y + 12, { size: 8, color: '#9ac88a' });
        this.drawCoin(ctx, r.x + r.w - 16 - T.width(String(q.price), 8), r.y + 3); T.draw(ctx, String(q.price), r.x + r.w - 6, r.y + 3, { size: 8, align: 'r', color: c.gold }); if (own) T.draw(ctx, `есть: ${own}`, r.x + r.w - 6, r.y + 12, { size: 8, align: 'r', color: c.dim });
      });
      UIK.panel(ctx, 240, 40, 234, 54, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false }); Portrait.draw(ctx, 'seller', 247, 43, t, S.msgT > 0);
      T.para(ctx, S.msg, 294, 46, 176, { size: 8, color: '#2a1a0c', lh: 10 });
      UIK.panel(ctx, 240, 98, 234, 122, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false });
      if (p) {
        const base = Object.assign({}, NetParts.BASIC); base[p.slot] = id; ctx.fillStyle = '#10201c'; ctx.fillRect(244, 102, 80, 80); NetParts.draw2D(ctx, base, 246, 104, 76, 76);
        T.draw(ctx, fitTxt(p.ru, 140), 330, 103, { size: 8, color: '#2a1a0c' }); T.draw(ctx, NetParts.SLOTS.find(s => s.id === p.slot).ru, 330, 114, { size: 8, color: '#8a2a1a' });
        NetParts.fxLines(p.fx).forEach((s, k) => T.draw(ctx, s, 330, 128 + k * 11, { size: 8, color: '#2a6a1a' }));
        T.para(ctx, p.desc, 246, 188, 222, { size: 8, color: '#4a3a20', lh: 10 });
        UIK.btn(ctx, L.buy, Save.data.coins >= p.price && UIK.hit(L.buy, m.x, m.y)); T.draw(ctx, `есть: ${Save.partCount(id)}`, 364, 228, { size: 8, color: c.dim });
      }
      if (S.flash > 0) { ctx.globalAlpha = Math.min(1, S.flash * 2); T.draw(ctx, String(S.last), SW - 8, 40 - (0.8 - S.flash) * 8, { size: 10, align: 'r', color: '#ff9070', shadow: '#000' }); ctx.globalAlpha = 1; }
    }
    drawCoin(ctx, x, y) { ctx.fillStyle = '#8a5a10'; ctx.fillRect(x + 1, y, 5, 7); ctx.fillRect(x, y + 1, 7, 5); ctx.fillStyle = '#f0c040'; ctx.fillRect(x + 1, y + 1, 5, 5); ctx.fillStyle = '#fff0a0'; ctx.fillRect(x + 2, y + 1, 2, 1); ctx.fillStyle = '#c89020'; ctx.fillRect(x + 3, y + 2, 1, 3); }
    drawCoins(ctx, x, y, big) { this.drawCoin(ctx, x, y); T.draw(ctx, String(Save.data.coins || 0), x + 10, y - 1, { size: big ? 10 : 8, color: '#ffe070' }); }

    // ------------------------------------------------------------ 2D layer
    draw(ctx, t, m, dt) {
      const ov = this.ov;
      if (ov === 'sell') return this.drawSell(ctx, t, m, dt);
      if (ov === 'goods') return this.drawGoods(ctx, t, m, dt);
      if (ov === 'collect') return this.drawColl(ctx, t, m, dt);
      if (ov === 'shop') return this.drawShop(ctx, t, m, dt);
      if (ov === 'journal') return Screens.journal.draw(ctx, t, m);
      this.hud(ctx, t);
      if (ov === 'code') Secret.lock.draw(ctx, t, m, dt); else if (ov === 'talk') this.drawTalk(ctx, t, dt);
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
    drawTalk(ctx, t, dt) {
      const T0 = this.talk; if (!T0) return; const c2 = UIK.col, line = T0.lines[T0.i]; T0.chars = Math.min(line.length, T0.chars + dt * 34); const shown = line.slice(0, Math.floor(T0.chars));
      UIK.panel(ctx, 14, 178, 452, 76, { fill: 'rgba(20,14,30,0.95)', border: '#a070e0' }); Portrait.draw(ctx, 'hooded', 24, 189, t, T0.chars < line.length);
      T.draw(ctx, T0.who === 'inside' ? 'Торговец в капюшоне' : '???', 78, 184, { size: 8, color: '#c8a8f0' }); T.para(ctx, shown, 78, 198, 376, { size: 10, color: '#f0e8ff', lh: 13 });
      T.draw(ctx, T0.chars < line.length ? 'E — пропустить' : T0.i < T0.lines.length - 1 ? 'E — дальше' : 'E — закрыть', 458, 242, { size: 8, align: 'r', color: '#8a78a8' });
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
  Mkt.person = person; Mkt.eyeTex = eyeTex; Mkt.ctex = ctex;
  return Mkt;
})();
