// ---------------------------------------------------------------- butterfly bait traps: the goods (flowers, honey, traps), the models, the trap system of a location and its windows
// A trap is bought from the trapper, put on the ground of an expedition location (G), loaded with a bunch of flowers (they decide how often butterflies come: the scent)
// and/or a jar of honey (it decides how rare the visitors are: its quality) and checked later (E). It lasts a while from the moment it is put (it breaks after that),
// holds only so many butterflies, and only its owner can take them. In multiplayer the traps of other players are seen (not opened): the server only relays the count.
const Traps = (() => {
  // type: price, life (s), capacity, chance that a visitor is an aberration
  const TYPES = {
    std: { id: 'std', ru: 'Стандартная ловушка', real: 'по образцу ловушки Ван Сомерена — Райдона', price: 900, life: 120, cap: 10, ab: 0, desc: 'Сетчатый цилиндр на треноге с приманочной чашей снизу — классика полевой энтомологии. Служит 2 минуты.' },
    str: { id: 'str', ru: 'Прочная ловушка', real: 'деревянный каркас, как садок-ловушка Девриса', price: 1800, life: 360, cap: 20, ab: 0, desc: 'Деревянный каркас с латунными скобами и мелкой сеткой, вместительная. Служит 6 минут.' },
    imp: { id: 'imp', ru: 'Импортная ловушка', real: 'складная палаточная ловушка (pop-up), как у BioQuip', price: 2800, life: 240, cap: 14, ab: 0.01, desc: 'Складной купол из тонкой сетки с растяжками. Служит 4 минуты, и 1% попавшихся бабочек — аберранты.' },
  };
  // real flowers visited by butterflies; scent 1..5 = how far the smell carries (more butterflies come)
  const SCENT = ['', 'едва уловимый', 'слабый', 'заметный', 'сильный', 'пьянящий'];
  const FLOWERS = [
    { id: 'cornflower', ru: 'Василёк синий', la: 'Centaurea cyanus', scent: 1, price: 20, col: '#3a5ac8', shape: 'star', desc: 'Полевой цветок с почти не пахнущими васильковыми «звёздочками»; нектар привлекает лишь случайных гостей.' },
    { id: 'chamomile', ru: 'Ромашка аптечная', la: 'Matricaria chamomilla', scent: 2, price: 30, col: '#f4f0e0', shape: 'daisy', desc: 'Тонкий яблочный запах; любимый цветок мелких бабочек.' },
    { id: 'redclover', ru: 'Клевер луговой', la: 'Trifolium pratense', scent: 2, price: 35, col: '#d0508a', shape: 'ball', desc: 'Сладковатый медовый запах; бабочки слетаются на нектар целыми лугами.' },
    { id: 'coneflower', ru: 'Эхинацея пурпурная', la: 'Echinacea purpurea', scent: 3, price: 55, col: '#c04a98', shape: 'cone', desc: 'Крупные корзинки с мягким пряным запахом; нектар доступен долго.' },
    { id: 'verbena', ru: 'Вербена буэнос-айресская', la: 'Verbena bonariensis', scent: 3, price: 60, col: '#9a5ac8', shape: 'cluster', desc: 'Фиолетовые щитки с лёгким цветочным ароматом: излюбленный цветок парусников.' },
    { id: 'thyme', ru: 'Тимьян ползучий (чабрец)', la: 'Thymus serpyllum', scent: 4, price: 70, col: '#b070c0', shape: 'cluster', desc: 'Пряный смолистый запах разогретой травы; бабочки облепляют его на солнцепёке.' },
    { id: 'oregano', ru: 'Душица обыкновенная', la: 'Origanum vulgare', scent: 4, price: 80, col: '#c0609a', shape: 'cluster', desc: 'Душистая трава с сильным запахом; её нектар любят нимфалиды и голубянки.' },
    { id: 'phlox', ru: 'Флокс метельчатый', la: 'Phlox paniculata', scent: 4, price: 90, col: '#e0508a', shape: 'ball', desc: 'Густой сладкий аромат, особенно к вечеру; ночные и дневные бабочки летят на него.' },
    { id: 'lavender', ru: 'Лаванда узколистная', la: 'Lavandula angustifolia', scent: 5, price: 110, col: '#8a70c8', shape: 'spike', desc: 'Пьянящий камфорный запах; на лавандовых полях бабочек больше, чем где-либо.' },
    { id: 'lilac', ru: 'Сирень обыкновенная', la: 'Syringa vulgaris', scent: 5, price: 120, col: '#b890d8', shape: 'cluster', desc: 'Мощный сладкий запах, который чувствуется за десятки метров.' },
    { id: 'buddleia', ru: 'Буддлея Давида («бабочкин куст»)', la: 'Buddleja davidii', scent: 5, price: 140, col: '#9a50d0', shape: 'spike', desc: 'Медовый запах, от которого она и получила название «бабочкин куст».' },
  ];
  // real honeys; quality 1..5 = how rare the visitors it lures are
  const QUAL = ['', 'простой', 'обычный', 'хороший', 'отборный', 'редчайший'];
  const HONEYS = [
    { id: 'sunflower', ru: 'Подсолнечный мёд', q: 1, price: 40, col: '#e8b020', desc: 'Светлый, быстро густеет; запах слабый.' },
    { id: 'meadow', ru: 'Луговой (цветочный) мёд', q: 1, price: 55, col: '#e0a020', desc: 'Классический мёд с разнотравья.' },
    { id: 'acacia', ru: 'Акациевый мёд', q: 2, price: 75, col: '#f0d060', desc: 'Прозрачный, долго остаётся жидким, нежный аромат.' },
    { id: 'linden', ru: 'Липовый мёд', q: 3, price: 100, col: '#d8a830', desc: 'Золотистый, с ярким липовым запахом.' },
    { id: 'mountain', ru: 'Горный мёд', q: 3, price: 115, col: '#c88a20', desc: 'Из горных лугов; пряный, насыщенный.' },
    { id: 'buckwheat', ru: 'Гречишный мёд', q: 4, price: 150, col: '#8a4a18', desc: 'Тёмный, с резким тягучим запахом: бабочки прилетают издалека.' },
    { id: 'chestnut', ru: 'Каштановый мёд', q: 4, price: 170, col: '#7a3c14', desc: 'Горьковатый, очень ароматный, почти чёрный.' },
    { id: 'heather', ru: 'Вересковый мёд', q: 5, price: 230, col: '#b86a20', desc: 'Редкий желеобразный мёд из пустошей; самая ценная приманка.' },
    { id: 'manuka', ru: 'Мёд манука', q: 5, price: 300, col: '#9a5818', desc: 'Импортный мёд из Новой Зеландии с насыщенным травяным ароматом.' },
  ];
  const FL = Object.fromEntries(FLOWERS.map(f => [f.id, f])), HN = Object.fromEntries(HONEYS.map(h => [h.id, h]));
  const KINDS = { tr: { list: Object.values(TYPES), by: TYPES, ru: 'ловушки' }, fl: { list: FLOWERS, by: FL, ru: 'цветы' }, hn: { list: HONEYS, by: HN, ru: 'мёд' } };
  // ---- the inventory (personal: it is part of the player's save, not of the shared cabinet)
  const inv = () => Save.data.trap || (Save.data.trap = { tr: {}, fl: {}, hn: {} });
  const count = (k, id) => (inv()[k] && inv()[k][id]) || 0;
  const add = (k, id, n = 1) => { const I = inv(); I[k] = I[k] || {}; I[k][id] = Math.max(0, (I[k][id] || 0) + n); if (!I[k][id]) delete I[k][id]; Save.write(); };
  const owned = k => KINDS[k].list.filter(x => count(k, x.id) > 0);
  function buy(k, id) { const it = KINDS[k].by[id]; if (!it || (Save.data.coins || 0) < it.price) return 0; Save.data.coins -= it.price; add(k, id, 1); return it.price; }
  // ---- the effect of what lies in a trap
  const rate = (fl, hn) => (FL[fl] ? 1.1 * FL[fl].scent : 0) + (HN[hn] ? 0.4 * HN[hn].q : 0);            // visits per minute
  const quality = hn => (HN[hn] ? HN[hn].q : 0);
  const rarK = (hn, rar) => 1 + 0.9 * quality(hn) * (rar - 1);                                           // multiplier of the weight of a species of rarity rar
  // the species a trap can lure: daytime butterflies of the location (no glowing or night ones)
  const lure = biome => biome.species.filter(sp => !sp.mystery && !(BEH[sp.beh] && BEH[sp.beh].light) && sp.biome !== 'ocean');
  function pick(biome, hn, type) {
    const pool = lure(biome).map(sp => ({ sp, w: sp.scarce ? sp.scarce * 0.3 * quality(hn) * 0.6 : (sp.rar === 1 ? 3 : sp.rar === 2 ? 2 : 1) * (sp.thin || 1) * rarK(hn, sp.rar || 1) })).filter(o => o.w > 0);
    if (!pool.length) return null; let r = Math.random() * pool.reduce((a, o) => a + o.w, 0); let sp = pool[pool.length - 1].sp; for (const o of pool) { r -= o.w; if (r <= 0) { sp = o.sp; break; } }
    return (TYPES[type].ab && Aberr.eligible(sp) && Math.random() < TYPES[type].ab) ? Aberr.make(sp, Aberr.randomCode()) : sp;
  }
  const mmss = s => { s = Math.max(0, Math.ceil(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

  // ================================================================== models
  const matCache = {};
  const M = (col, o = {}) => { const k = col + JSON.stringify(o); return matCache[k] || (matCache[k] = new THREE.MeshLambertMaterial(Object.assign({ color: col, flatShading: true }, o))); };
  const NET = (col = '#e4ece0', op = 0.42) => M(col, { transparent: true, opacity: op, side: THREE.DoubleSide, depthWrite: false });
  const mesh = (geo, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); return m; };
  const box = (w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) => mesh(new THREE.BoxGeometry(w, h, d), mat, x, y, z, rx, ry, rz);
  const cyl = (r0, r1, h, mat, x, y, z, seg = 8, open = false, rx = 0, ry = 0, rz = 0) => mesh(new THREE.CylinderGeometry(r1, r0, h, seg, 1, open), mat, x, y, z, rx, ry, rz);
  // a thin rod between two points
  function rod(a, b, r, mat, seg = 5) { const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length(), m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, seg), mat); m.position.copy(A).add(B).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m; }
  const WOOD = '#7a5430', DWOOD = '#4a3220', BRASS = '#c8a040', IRON = '#5a5a60';
  // where butterflies rest inside the net: {x,y,z, a} (a: the direction the wing quad faces, towards the axis)
  function rests(type) {
    const out = [];
    if (type === 'std') for (let i = 0; i < 9; i++) { const y = 0.75 + (i % 3) * 0.3, a = i * 2.4, r = 0.3 + (1.5 - y) * 0.04 - 0.035; out.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r, a }); }
    else if (type === 'str') for (let i = 0; i < 9; i++) { const y = 0.65 + (i % 3) * 0.28, a = i * 1.7, s = 0.415; const side = i % 4, t = ((i * 0.37) % 1 - 0.5) * 0.6; const p = [[t, s], [s, t], [t, -s], [-s, t]][side]; out.push({ x: p[0], y, z: p[1], a: [Math.PI, Math.PI * 1.5, 0, Math.PI * 0.5][side] }); }
    else for (let i = 0; i < 9; i++) { const y = 0.3 + (i % 3) * 0.24, a = i * 2.1, r = 0.55 * Math.sqrt(Math.max(0.05, 1 - (y / 1.1) * (y / 1.1))) - 0.03; out.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r, a }); }
    return out;
  }
  function flowerBunch(g, y, col, shape, rad) {
    const stem = M('#3a7a30');
    for (let i = 0; i < 7; i++) { const a = i * 0.9, r = rad * (0.25 + 0.7 * ((i * 0.37) % 1)), x = Math.cos(a) * r, z = Math.sin(a) * r;
      g.add(mesh(new THREE.SphereGeometry(shape === 'spike' ? 0.03 : 0.045, 6, 5), M(col), x, y + 0.05 + (i % 3) * 0.015, z)); if (shape === 'spike') g.add(mesh(new THREE.CylinderGeometry(0.018, 0.026, 0.1, 5), M(col), x, y + 0.05, z)); else g.add(box(0.012, 0.045, 0.012, stem, x, y + 0.02, z)); }
  }
  // the bait dish contents: flowers and a honey sponge on the tray top at height y (r = tray radius)
  function bait(g, y, r, fl, hn) {
    if (HN[hn]) { g.add(cyl(0.11, 0.1, 0.022, M(HN[hn].col), r * 0.0 + (FL[fl] ? -r * 0.35 : 0), y + 0.011, FL[fl] ? r * 0.1 : 0, 10)); g.add(mesh(new THREE.SphereGeometry(0.06, 7, 4, 0, 6.3, 0, 1.2), M(HN[hn].col), FL[fl] ? -r * 0.35 : 0, y + 0.002, FL[fl] ? r * 0.1 : 0)); }
    if (FL[fl]) { const b = new THREE.Group(); b.position.set(HN[hn] ? r * 0.3 : 0, 0, 0); flowerBunch(b, y, FL[fl].col, FL[fl].shape, r * 0.45); g.add(b); }
  }
  // the three trap bodies; every part touches its neighbour (the float test checks it); y = 0 is the ground
  function body(type) {
    const g = new THREE.Group(), top = new THREE.Group(), baitG = new THREE.Group(); g.add(top); g.add(baitG); let trayY = 0.34, trayR = 0.26;
    if (type === 'std') {
      const pole = M('#8a6a3a'), rope = M('#c8b890'), netc = NET('#d8e8d0', 0.4), rib = M('#9aa890');
      for (let k = 0; k < 3; k++) { const a = k * 2.094 + 0.4; g.add(rod([Math.cos(a) * 0.78, -0.02, Math.sin(a) * 0.78], [Math.cos(a) * 0.04, 2.08, Math.sin(a) * 0.04], 0.03, pole, 6)); }      // the tripod
      g.add(cyl(0.065, 0.065, 0.14, M('#c8b890'), 0, 2.03, 0, 8));                                                                         // the lashing at the apex
      top.add(rod([0, 1.98, 0], [0, 1.72, 0], 0.012, rope));                                                                               // hanger
      top.add(cyl(0.3, 0.02, 0.26, netc, 0, 1.62, 0, 12, true)); top.add(mesh(new THREE.TorusGeometry(0.3, 0.014, 5, 16), M(IRON), 0, 1.49, 0, Math.PI / 2));   // top cone and ring
      top.add(cyl(0.34, 0.3, 1.0, netc, 0, 0.99, 0, 14, true)); for (let k = 0; k < 8; k++) { const a = k * 0.785; top.add(rod([Math.cos(a) * 0.3, 1.49, Math.sin(a) * 0.3], [Math.cos(a) * 0.34, 0.49, Math.sin(a) * 0.34], 0.008, rib, 4)); }
      top.add(mesh(new THREE.TorusGeometry(0.34, 0.016, 5, 16), M(IRON), 0, 0.49, 0, Math.PI / 2));                                          // bottom ring
      top.add(cyl(0.34, 0.13, 0.2, netc, 0, 0.59, 0, 14, true));                                                                           // the funnel inside: the way in
      for (let k = 0; k < 3; k++) { const a = k * 2.094; top.add(rod([Math.cos(a) * 0.34, 0.49, Math.sin(a) * 0.34], [Math.cos(a) * 0.25, 0.33, Math.sin(a) * 0.25], 0.008, rope, 4)); }   // the cords carrying the dish
      baitG.add(cyl(0.26, 0.22, 0.04, M(DWOOD), 0, 0.32, 0, 12)); trayY = 0.34; trayR = 0.26;
    } else if (type === 'str') {
      const wood = M(WOOD), dw = M(DWOOD), brass = M(BRASS), netc = NET('#e0e8dc', 0.38);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) { g.add(box(0.1, 0.1, 0.1, dw, sx * 0.42, 0.05, sz * 0.42)); g.add(box(0.07, 1.22, 0.07, wood, sx * 0.43, 0.76, sz * 0.43)); top.add(box(0.1, 0.05, 0.1, brass, sx * 0.43, 1.39, sz * 0.43)); }   // feet, posts, brass caps
      g.add(box(0.98, 0.06, 0.98, wood, 0, 0.13, 0));                                                                                      // the floor plank
      for (const [x, z, w, d] of [[0, 0.43, 0.86, 0.06], [0, -0.43, 0.86, 0.06], [0.43, 0, 0.06, 0.86], [-0.43, 0, 0.06, 0.86]]) { top.add(box(w, 0.06, d, wood, x, 1.36, z)); g.add(box(w, 0.05, d, wood, x, 0.45, z)); }   // top frame and the sill of the net walls
      for (const [x, z, w, d] of [[0, 0.43, 0.8, 0.012], [0, -0.43, 0.8, 0.012], [0.43, 0, 0.012, 0.8], [-0.43, 0, 0.012, 0.8]]) top.add(box(w, 0.88, d, netc, x, 0.9, z));   // mesh walls (the gap below the sill is the way in)
      for (const [x, z, w, d] of [[0, 0.43, 0.86, 0.02], [0, -0.43, 0.86, 0.02], [0.43, 0, 0.02, 0.86], [-0.43, 0, 0.02, 0.86]]) top.add(box(w, 0.025, d, M(IRON), x, 0.9, z));   // metal hoop
      top.add(mesh(new THREE.ConeGeometry(0.78, 0.3, 4), M('#4a5a50'), 0, 1.56, 0, 0, Math.PI / 4, 0)); top.add(mesh(new THREE.SphereGeometry(0.045, 6, 5), M(BRASS), 0, 1.73, 0));   // hip roof and its finial
      g.add(cyl(0.12, 0.2, 0.2, dw, 0, 0.26, 0, 8)); baitG.add(cyl(0.3, 0.3, 0.04, M('#5a4028'), 0, 0.38, 0, 12)); trayY = 0.4; trayR = 0.3;     // a pedestal and the dish on it
      g.add(box(0.2, 0.1, 0.012, brass, 0, 0.13, 0.495));                                                                                    // maker's plate on the plank edge
    } else {
      const netc = NET('#f4f6f0', 0.4), orange = M('#e8782a'), rib = M('#c8ccc4'), peg = M(IRON), line = M('#e8d8b0');
      g.add(mesh(new THREE.TorusGeometry(0.55, 0.022, 5, 18), rib, 0, 0.025, 0, Math.PI / 2));                                            // the base hoop on the ground
      const dome = mesh(new THREE.SphereGeometry(0.55, 14, 8, 0, Math.PI * 2, 0, Math.PI / 2), netc, 0, 0.02, 0); dome.scale.y = 2.0; top.add(dome);
      for (let k = 0; k < 3; k++) { const arc = mesh(new THREE.TorusGeometry(0.55, 0.012, 4, 18, Math.PI), rib, 0, 0.02, 0, 0, k * Math.PI / 3, 0); arc.scale.y = 2.0; top.add(arc); }   // arched ribs
      g.add(cyl(0.56, 0.56, 0.16, orange, 0, 0.08, 0, 18, true));                                                                          // the coloured skirt
      top.add(mesh(new THREE.SphereGeometry(0.05, 6, 5), M(BRASS), 0, 1.12, 0)); top.add(rod([0, 1.1, 0], [0, 1.62, 0], 0.01, peg, 4)); top.add(mesh(new THREE.ConeGeometry(0.1, 0.24, 3), M('#d03a30'), 0.1, 1.5, 0, 0, 0, -Math.PI / 2));   // top cap and a pennant
      for (let k = 0; k < 4; k++) { const a = k * 1.571 + 0.78, X = Math.cos(a), Z = Math.sin(a); g.add(rod([X * 1.0, -0.05, Z * 1.0], [X * 0.92, 0.2, Z * 0.92], 0.014, peg, 4)); top.add(rod([X * 0.92, 0.2, Z * 0.92], [X * 0.45, 0.62, Z * 0.45], 0.005, line, 3)); }    // pegs and guy lines to the dome
      baitG.add(cyl(0.3, 0.3, 0.035, M('#3a4a58'), 0, 0.05, 0, 12)); trayY = 0.07; trayR = 0.3;
    }
    g.userData = { top, baitG, trayY, trayR, type };
    return g;
  }
  // a whole model with its contents: fl / hn ids, n resting butterflies (cols: their colours), broken: collapsed
  function model(type, o = {}) {
    const g = body(type), U = g.userData; bait(U.baitG, U.trayY, U.trayR, o.fl, o.hn);
    const wings = new THREE.Group(); U.top.add(wings); U.wings = [];
    const spots = rests(type), n = Math.min(spots.length, o.n || 0);
    for (let i = 0; i < n; i++) { const s = spots[i], col = (o.cols && o.cols[i]) || '#e8a030', w = new THREE.Group(); w.position.set(s.x, s.y, s.z); w.rotation.y = -s.a + Math.PI / 2;
      const wl = mesh(new THREE.PlaneGeometry(0.07, 0.1), M(col, { side: THREE.DoubleSide }), -0.035, 0, 0.004), wr = mesh(new THREE.PlaneGeometry(0.07, 0.1), M(col, { side: THREE.DoubleSide }), 0.035, 0, 0.004);
      const bd = box(0.012, 0.09, 0.012, M('#2a2018'), 0, 0, 0.006); w.add(wl, wr, bd); wings.add(w); U.wings.push({ g: w, l: wl, r: wr, ph: i * 1.3 }); }
    if (o.broken) setBroken(g, true);
    return g;
  }
  // a worn-out trap: the body sags and leans, the net hangs torn (everything stays on its place so nothing floats)
  function setBroken(g, b) { const t = g.userData.top; t.scale.set(1, b ? 0.72 : 1, 1); t.rotation.z = b ? 0.12 : 0; t.position.y = 0; g.userData.broken = b; }
  function sprite(text, col = '#f0f0dc') {
    const cv = document.createElement('canvas'); cv.width = 128; cv.height = 24; const x = cv.getContext('2d'); x.font = 'bold 14px sans-serif'; x.textAlign = 'center'; x.fillStyle = 'rgba(16,28,24,0.7)'; x.fillRect(0, 0, 128, 24); x.fillStyle = col; x.fillText(text.slice(0, 18), 64, 17);
    const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(1.2, 0.225, 1); s.renderOrder = 9; return s;
  }
  const specCol = sp => { const b = SPECIES_BY_ID[sp.base] || sp; const a = b.art; const h = a && ((a.f && a.f[0]) || (a.h && a.h[0])); return typeof h === 'string' && h[0] === '#' ? h : '#e8a030'; };

  // ================================================================== the traps of a location
  class Sys {
    constructor(play) { this.play = play; this.list = []; this.group = new THREE.Group(); play.scene.add(this.group); this.seq = 0; this.cntT = 0; this.near = null; }
    get world() { return this.play.world; }
    own() { return this.list.filter(t => t.mine); }
    mk(spec, mine) {
      const T0 = TYPES[spec.type]; if (!T0) return null; const t = { tid: spec.tid, mine, owner: spec.owner, name: spec.name || '?', type: spec.type, x: spec.x, y: spec.y, z: spec.z, yaw: spec.yaw || 0, t: spec.age || 0, life: T0.life, cap: T0.cap, fl: spec.fl || '', hn: spec.hn || '', items: spec.items || [], n: spec.n || 0, broken: false, goneT: 0, dirty: true, label: null };
      this.list.push(t); t.col = { x: spec.x, z: spec.z, r: 0.5, trap: t.tid }; this.world.colliders.push(t.col); this.rebuild(t); return t;
    }
    rebuild(t) {
      if (t.group) { this.group.remove(t.group); t.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
      const cols = t.mine ? t.items.slice(0, 9).map(specCol) : Array.from({ length: Math.min(9, t.n) }, (_, i) => ['#e8a030', '#6a9ae0', '#f0f0e0', '#d05a5a', '#8ad060'][i % 5]);
      const g = model(t.type, { fl: t.fl, hn: t.hn, n: t.mine ? t.items.length : t.n, cols, broken: t.broken }); g.position.set(t.x, t.y, t.z); g.rotation.y = t.yaw; this.group.add(g); t.group = g; t.dirty = false;
      if (!t.label) { t.label = sprite(t.mine ? TYPES[t.type].ru : t.name, t.mine ? '#f0e8c0' : '#9ae0b0'); t.label.position.set(t.x, t.y + 2.4, t.z); this.group.add(t.label); }
    }
    net(m) {      // a message from the server about somebody else's trap
      if (m.k === 'put') { if (m.trap && !this.list.some(t => t.tid === m.trap.tid)) this.mk(m.trap, false); }
      else { const t = this.list.find(q => q.tid === m.tid && !q.mine); if (!t) return; if (m.k === 'set') { t.fl = m.fl; t.hn = m.hn; t.dirty = true; } else if (m.k === 'cnt') { t.n = m.n; t.dirty = true; } else if (m.k === 'del') this.drop(t); }
    }
    drop(t) { this.list = this.list.filter(q => q !== t); if (t.group) { this.group.remove(t.group); t.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } if (t.label) this.group.remove(t.label); const w = this.world, ci = w.colliders.indexOf(t.col); if (ci >= 0) w.colliders.splice(ci, 1); if (this.near === t) this.near = null; }
    send(o) { if (Net.on && this.play.mp) Net.send('trap', o); }
    // G: put a trap of the chosen type in front of the player
    spot() { const P = this.play.player, w = this.world, fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), x = P.pos.x + fx * 1.7, z = P.pos.z + fz * 1.7; if ((w.canWalk && !w.canWalk(x, z)) || (w.inWater && w.inWater(x, z, 0.6))) return null; if (w.slopeAt && w.slopeAt(x, z) > 0.55) return null;
      for (const c of w.colliders) if (Math.hypot(c.x - x, c.z - z) < c.r + 0.8) return null; if (Math.hypot(x, z) > w.R - 1.5) return null; return { x, z, y: w.groundAt(x, z), yaw: P.yaw + Math.PI }; }
    place(type) {
      const P = this.play; if (!TYPES[type] || count('tr', type) < 1) return false; if (this.own().length >= 4) { P.toast('Не больше четырёх своих ловушек в одной локации', 3); Snd.sfx.deny(); return false; }
      const s = this.spot(); if (!s) { P.toast('Здесь ловушку не поставить: нужна ровная свободная земля', 3); Snd.sfx.deny(); return false; }
      add('tr', type, -1); const tid = (Net.on && P.mp ? Net.id : 'L') + '-' + Date.now().toString(36) + (++this.seq);
      const t = this.mk({ tid, owner: Net.on ? Net.id : 0, name: Net.name || 'Вы', type, x: s.x, y: s.y, z: s.z, yaw: s.yaw, age: 0 }, true); this.send({ k: 'put', tid, type, x: +s.x.toFixed(2), y: +s.y.toFixed(2), z: +s.z.toFixed(2), yaw: +s.yaw.toFixed(2) });
      P.toast(`${TYPES[type].ru} поставлена: положите приманку (E)`, 4, true); Snd.sfx.coin(); return t;
    }
    nearest() { const P = this.play.player, fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); let best = null, bd = 1e9; for (const t of this.list) { const dx = t.x - P.pos.x, dz = t.z - P.pos.z, d = Math.hypot(dx, dz); if (d < 2.6 && (d < 1.5 || (dx * fx + dz * fz) / (d || 1) > 0.2) && d < bd) { best = t; bd = d; } } return best; }
    label(t) { return t.mine ? `E — ловушка: ${TYPES[t.type].ru.toLowerCase()} (${t.broken ? 'сломана' : mmss(t.life - t.t)}, бабочек: ${t.items.length})` : `Ловушка игрока ${t.name} · бабочек внутри: ${t.n}`; }
    update(dt) {
      this.near = this.play.entering ? null : this.nearest(); const tt = this.play.t;
      for (const t of this.list.slice()) {
        t.t += dt;
        if (!t.broken && t.t >= t.life) { t.broken = true; t.dirty = true; if (t.mine) { this.play.toast(`${TYPES[t.type].ru} сломалась — заберите улов`, 4, true); Snd.sfx.deny(); } }
        if (t.mine && !t.broken && t.items.length < t.cap) {                 // butterflies come
          const r = rate(t.fl, t.hn); if (r > 0 && Math.random() < r / 60 * dt) { const sp = pick(this.play.biome, t.hn, t.type); if (sp) { t.items.push(sp.id); t.dirty = true; this.cntT = 0.01; this.send({ k: 'cnt', tid: t.tid, n: t.items.length }); } }
        }
        if (t.mine && t.broken && !t.items.length && !t.fl && !t.hn) { t.goneT += dt; if (t.goneT > 25) { this.send({ k: 'del', tid: t.tid }); this.drop(t); continue; } }
        if (t.dirty) { this.rebuild(t); setBroken(t.group, t.broken); }
        const U = t.group && t.group.userData; if (U && U.wings) for (const w of U.wings) { const f = Math.sin(tt * 3 + w.ph) * 0.5 + 0.5, open = (Math.sin(tt * 0.7 + w.ph * 3) > 0.7) ? f : 0.15; w.l.rotation.y = -open * 0.9; w.r.rotation.y = open * 0.9; }
        if (U && !t.broken) U.top.rotation.z = Math.sin(tt * 0.9 + t.x) * 0.012;
      }
    }
    bait(t, fl, hn) {      // change what lies in a trap (what was there goes back to the inventory)
      if (!t.mine || t.broken) return false; let ch = false;
      if (fl !== undefined && fl !== t.fl) { if (fl && count('fl', fl) < 1) return false; if (t.fl) add('fl', t.fl, 1); if (fl) add('fl', fl, -1); t.fl = fl; ch = true; }
      if (hn !== undefined && hn !== t.hn) { if (hn && count('hn', hn) < 1) return false; if (t.hn) add('hn', t.hn, 1); if (hn) add('hn', hn, -1); t.hn = hn; ch = true; }
      if (ch) { t.dirty = true; this.send({ k: 'set', tid: t.tid, fl: t.fl, hn: t.hn }); Snd.sfx.click(); } return ch;
    }
    // take the butterflies out of an own trap (the new ones go to the cabinet as raw specimens)
    take(t, quiet) {
      if (!t.mine || !t.items.length) return 0; const P = this.play, ids = t.items.splice(0); let fresh = 0; for (const id of ids) { if (!Save.has((SPECIES_BY_ID[id].base) || id)) fresh++; Save.add(id, P.biome.id); P.caughtHere.add(id); }
      t.dirty = true; this.send({ k: 'cnt', tid: t.tid, n: 0 }); Wings.announce(Wings.check(), (s, d, imp) => P.toast(s, d, imp));
      if (!quiet) { P.toast(`Из ловушки взято бабочек: ${ids.length}` + (fresh ? ` · новых видов: ${fresh}` : ''), 4, true); Snd.sfx.reward(); }
      if (t.broken) { if (t.fl) add('fl', t.fl, 0); this.send({ k: 'del', tid: t.tid }); this.drop(t); }
      return ids.length;
    }
    // leaving the location: what is caught goes to the cabinet, the baits that were left are lost with the traps
    collectAll() { for (const t of this.own().slice()) { this.take(t, true); this.send({ k: 'del', tid: t.tid }); this.drop(t); } }
    dispose() { this.collectAll(); this.play.scene.remove(this.group); }
  }

  // ================================================================== the windows: put a trap (G) and look into one (E)
  // an offscreen renderer for pictures of the models (created on first use; if WebGL is not available nothing is drawn)
  const Thumb = {
    r: null, tried: false,
    get() {
      if (this.r || this.tried) return this.r; this.tried = true;
      try {
        const ren = new THREE.WebGLRenderer({ antialias: false, alpha: true, preserveDrawingBuffer: true }); ren.setSize(100, 150, false); ren.setPixelRatio(1); ren.setClearColor(0x000000, 0);
        const sc = new THREE.Scene(), cam = new THREE.OrthographicCamera(-0.75, 0.75, 1.125, -1.125, 0.1, 20); sc.add(new THREE.HemisphereLight('#ffffff', '#6a7a60', 0.95)); const sun = new THREE.DirectionalLight('#fff4dc', 0.9); sun.position.set(2, 4, 3); sc.add(sun);
        this.r = { draw(g, t) { const old = g.parent, pos = g.position.clone(), rot = g.rotation.y; sc.add(g); g.position.set(0, 0, 0); g.rotation.y = rot + (t || 0); const bb = new THREE.Box3().setFromObject(g), hh = Math.max(bb.max.y, 0.5), half = hh / 2 + 0.08; cam.top = half; cam.bottom = -half; cam.left = -half * 0.667; cam.right = half * 0.667; cam.updateProjectionMatrix(); cam.position.set(2.6, hh / 2 + 0.55, 2.6); cam.lookAt(0, hh / 2, 0); ren.render(sc, cam); sc.remove(g); g.position.copy(pos); g.rotation.y = rot; if (old) old.add(g); return ren.domElement; } };
      } catch (e) { this.r = null; }
      return this.r;
    },
  };
  const UI = {
    mode: null, t: null, sel: 0, msg: '', msgT: 0, scroll: 0, btns: [],
    openPlace(play) { this.mode = 'place'; this.play = play; this.sel = Math.max(0, Object.keys(TYPES).findIndex(id => count('tr', id) > 0)); this.msg = ''; this.msgT = 0; },
    openTrap(play, t) { this.mode = t.mine ? 'manage' : 'view'; this.play = play; this.t = t; this.msg = ''; this.msgT = 0; this.scroll = 0; },
    say(m) { this.msg = m; this.msgT = 3.5; },
    cyc(list, cur, d) { const ids = [''].concat(list.map(x => x.id)); const i = ids.indexOf(cur || ''); return ids[(i + d + ids.length) % ids.length]; },
    layout() {
      const b = [{ id: 'close', label: 'Закрыть ✕', x: SW - 82, y: 4, w: 74, h: 15 }];
      if (this.mode === 'place') Object.values(TYPES).forEach((T0, i) => b.push({ id: 'type' + i, tid: T0.id, x: 40, y: 56 + i * 52, w: 400, h: 46 }));
      else if (this.mode === 'manage') {
        const t = this.t; b.push({ id: 'flp', label: '<', x: 124, y: 94, w: 16, h: 14 }, { id: 'fln', label: '>', x: 142, y: 94, w: 16, h: 14 }, { id: 'hnp', label: '<', x: 124, y: 134, w: 16, h: 14 }, { id: 'hnn', label: '>', x: 142, y: 134, w: 16, h: 14 });
        b.push({ id: 'take', label: t.items.length ? `Забрать улов (${t.items.length})` : 'Улова нет', x: 12, y: 232, w: 150, h: 18, disabled: !t.items.length });
        if (t.broken && !t.items.length) b.push({ id: 'remove', label: 'Убрать обломки', x: 170, y: 232, w: 120, h: 18 });
      }
      this.btns = b; return b;
    },
    click(x, y) {
      const bs = this.layout(), b = bs.find(q => !q.disabled && UIK.hit(q, x, y)); if (!b) return null; const P = this.play, S = P.traps;
      if (b.id === 'close') return 'close';
      if (b.tid) { if (count('tr', b.tid) < 1) { this.say('У вас нет такой ловушки: купите её у торговца ловушками на рынке'); Snd.sfx.deny(); return null; } return S.place(b.tid) ? 'close' : null; }
      const t = this.t; if (!t || !S.list.includes(t)) return 'close';
      if (b.id === 'flp' || b.id === 'fln') { const o = owned('fl'); if (t.fl && !o.some(f => f.id === t.fl)) o.push(FL[t.fl]); const nx = this.cyc(o, t.fl, b.id === 'fln' ? 1 : -1); if (!S.bait(t, nx, undefined)) this.say(t.broken ? 'Ловушка сломана' : 'Нет таких цветов — купите их у цветочницы'); }
      else if (b.id === 'hnp' || b.id === 'hnn') { const o = owned('hn'); if (t.hn && !o.some(f => f.id === t.hn)) o.push(HN[t.hn]); const nx = this.cyc(o, t.hn, b.id === 'hnn' ? 1 : -1); if (!S.bait(t, undefined, nx)) this.say(t.broken ? 'Ловушка сломана' : 'Нет такого мёда — купите его у медовщика'); }
      else if (b.id === 'take') { S.take(t); if (!S.list.includes(t)) return 'close'; }
      else if (b.id === 'remove') { S.send({ k: 'del', tid: t.tid }); S.drop(t); return 'close'; }
      return null;
    },
    draw(ctx, t, m, dt) {
      this.msgT = Math.max(0, this.msgT - dt); const cl = UIK.col, bs = this.layout(), P = this.play, S = P.traps; const hv = b => UIK.hit(b, m.x, m.y);
      ctx.fillStyle = 'rgba(4,12,10,0.78)'; ctx.fillRect(0, 0, SW, SH);
      if (this.mode === 'place') {
        UIK.panel(ctx, 20, 14, 440, 242, { fill: 'rgba(16,32,28,0.97)', border: cl.gold }); T.draw(ctx, 'Поставить ловушку', SW / 2, 22, { size: 12, align: 'c', color: cl.gold }); T.draw(ctx, 'Она встанет перед вами. Не больше четырёх своих ловушек на локацию.', SW / 2, 40, { size: 8, align: 'c', color: cl.dim });
        bs.filter(b => b.tid).forEach(b => { const T0 = TYPES[b.tid], n = count('tr', b.tid), h = hv(b); UIK.panel(ctx, b.x, b.y, b.w, b.h, { fill: n ? (h ? '#2a5a46' : '#1a3228') : '#1a2420', border: n ? cl.gold : cl.line, shadow: false });
          T.draw(ctx, T0.ru, b.x + 8, b.y + 5, { size: 8, color: n ? '#fff' : cl.dim }); T.draw(ctx, `служит ${mmss(T0.life)} · вмещает ${T0.cap}` + (T0.ab ? ' · 1% аберрантов' : ''), b.x + 8, b.y + 17, { size: 8, color: cl.dim }); T.para(ctx, T0.desc, b.x + 8, b.y + 29, 300, { size: 8, color: '#8aa898', lh: 8 }); T.draw(ctx, n ? `есть: ${n}` : 'нет в запасе', b.x + b.w - 8, b.y + 5, { size: 8, align: 'r', color: n ? '#9af0a0' : '#c87060' }); });
        T.draw(ctx, this.msgT > 0 ? this.msg : 'Купить ловушки можно у торговца ловушками на рынке насекомых.', SW / 2, 238, { size: 8, align: 'c', color: this.msgT > 0 ? '#ffb070' : cl.dim });
      } else if (this.t) {
        const tr = this.t, T0 = TYPES[tr.type], mine = this.mode === 'manage';
        UIK.panel(ctx, 6, 6, 468, 258, { fill: 'rgba(16,32,28,0.97)', border: cl.gold }); T.draw(ctx, mine ? T0.ru : `Ловушка игрока ${tr.name}`, 14, 12, { size: 10, color: cl.gold }); T.draw(ctx, T0.real, 14, 26, { size: 8, color: cl.dim });
        // the model, turned slowly
        ctx.fillStyle = '#10201c'; ctx.fillRect(14, 40, 100, 150); this.preview(ctx, tr, t, 14, 40);
        const left = Math.max(0, tr.life - tr.t), pct = clamp(left / tr.life); T.draw(ctx, tr.broken ? 'Сломана' : `Прочность: ${mmss(left)}`, 124, 42, { size: 8, color: tr.broken ? '#e07060' : cl.text }); ctx.fillStyle = '#10201c'; ctx.fillRect(124, 54, 150, 6); ctx.fillStyle = pct > 0.5 ? '#6ad070' : pct > 0.2 ? '#e0c040' : '#e05a4a'; ctx.fillRect(124, 54, Math.round(150 * pct), 6);
        const n = mine ? tr.items.length : tr.n; T.draw(ctx, `Бабочек внутри: ${n} из ${tr.cap}`, 290, 42, { size: 8, color: cl.text }); ctx.fillStyle = '#10201c'; ctx.fillRect(290, 54, 150, 6); ctx.fillStyle = '#e0a0e0'; ctx.fillRect(290, 54, Math.round(150 * n / tr.cap), 6);
        if (mine) {
          const f = FL[tr.fl], h = HN[tr.hn], rr = rate(tr.fl, tr.hn);
          T.draw(ctx, 'Цветы — зовут бабочек', 124, 70, { size: 8, color: cl.dim }); T.draw(ctx, f ? `${f.ru} (запах: ${SCENT[f.scent]})` : 'нет — без цветов бабочки почти не летят', 124, 82, { size: 8, color: f ? '#f0e8d0' : '#c87060' });
          T.draw(ctx, 'Мёд — приманивает редких', 124, 110, { size: 8, color: cl.dim }); T.draw(ctx, h ? `${h.ru} (${QUAL[h.q]})` : 'нет — редкие виды не привлекаются', 124, 122, { size: 8, color: h ? '#f0e8d0' : '#c87060' });
          for (const id of ['flp', 'fln', 'hnp', 'hnn']) { const b = bs.find(q => q.id === id); UIK.btn(ctx, b, hv(b)); }
          T.draw(ctx, f ? `в запасе: ${count('fl', f.id)}` : `в запасе видов: ${owned('fl').length}`, 166, 97, { size: 8, color: cl.dim }); T.draw(ctx, h ? `в запасе: ${count('hn', h.id)}` : `в запасе видов: ${owned('hn').length}`, 166, 137, { size: 8, color: cl.dim });
          T.draw(ctx, tr.broken ? 'Ловушка сломана: новые бабочки не прилетят' : rr > 0 ? `Прилёт: около ${rr.toFixed(1)} бабочек в минуту` : 'Положите цветы или мёд — иначе ловушка пуста', 124, 160, { size: 8, color: !tr.broken && rr > 0 ? '#9af0a0' : '#e07060' });
          T.draw(ctx, h ? `Редкие виды: до ×${rarK(tr.hn, 3).toFixed(1)} чаще` : 'Редкие виды: обычный шанс', 124, 172, { size: 8, color: h ? '#e0c0ff' : cl.dim });
          // the catch
          T.draw(ctx, 'Улов', 14, 196, { size: 8, color: cl.dim }); const sp = {}; for (const id of tr.items) sp[id] = (sp[id] || 0) + 1; const ids = Object.keys(sp);
          ids.slice(0, 12).forEach((id, i) => { const x = 14 + (i % 12) * 38, y = 207, S0 = SPECIES_BY_ID[id]; ctx.fillStyle = '#c8a870'; ctx.fillRect(x, y, 36, 20); ctx.imageSmoothingEnabled = false; ctx.drawImage(Art.specimen(S0), x + 1, y + 1, 34, 18); if (sp[id] > 1) T.draw(ctx, '×' + sp[id], x + 35, y + 12, { size: 8, align: 'r', color: '#fff', shadow: '#000' }); if (S0.ab) T.draw(ctx, 'аб.', x + 2, y + 2, { size: 8, color: '#ff9ae8', shadow: '#000' }); });
          if (!ids.length) T.draw(ctx, tr.broken ? 'В ловушке никого нет.' : 'Пока никто не прилетел.', 14, 212, { size: 8, color: cl.dim });
          bs.filter(b => b.id === 'take' || b.id === 'remove').forEach(b => UIK.btn(ctx, b, !b.disabled && hv(b)));
        } else {
          T.draw(ctx, 'Чужая ловушка: открыть её и забрать бабочек может только владелец.', 124, 80, { size: 8, color: cl.text }); const f = FL[tr.fl], h = HN[tr.hn]; T.draw(ctx, `Цветы: ${f ? f.ru : 'нет'}`, 124, 100, { size: 8, color: cl.dim }); T.draw(ctx, `Мёд: ${h ? h.ru : 'нет'}`, 124, 112, { size: 8, color: cl.dim });
        }
        if (this.msgT > 0) T.draw(ctx, this.msg, 300, 238, { size: 8, align: 'c', color: '#ffb070' });
      }
      UIK.btn(ctx, bs[0], hv(bs[0])); T.draw(ctx, `${Save.data.coins || 0} монет`, SW - 10, 24, { size: 8, align: 'r', color: '#ffe070' });
    },
    // the trap turning on its own small canvas (a second tiny scene is overkill: draw the real model through one shared renderer-free projection)
    // the real model drawn by a small renderer of its own (lazy, one shared canvas), turned by angle t; the picture is copied into the given 2D context
    preview(ctx, tr, t, px = 14, py = 40, pw = 100, ph = 150) {
      const g = tr.group; if (!g) return; const R = Thumb.get(); if (!R) return; ctx.imageSmoothingEnabled = false; ctx.drawImage(R.draw(g, t), px, py, pw, ph);
    },
  };

  // 2D pictures of the goods (shop windows): a flower head by its shape, a honey jar
  function drawFlower(ctx, x, y, f, k = 3) {
    const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a * k, y + b * k, w * k, h * k); }, c = f.col, d = '#f4d860';
    R(7, 8, 1, 8, '#3a7a30'); R(5, 12, 2, 1, '#4a9a3a'); R(8, 10, 2, 1, '#4a9a3a');
    if (f.shape === 'daisy') { for (const [a, b] of [[7, 0], [7, 6], [4, 3], [10, 3], [5, 1], [9, 1], [5, 5], [9, 5]]) R(a, b, 1, 2, c); R(6, 2, 3, 3, d); }
    else if (f.shape === 'ball') { R(5, 1, 5, 6, c); R(4, 2, 7, 4, c); R(6, 2, 2, 2, '#ffffff55'); }
    else if (f.shape === 'cone') { R(6, 2, 3, 4, '#8a4a20'); R(7, 1, 1, 1, '#a05a28'); for (const [a, b] of [[3, 2], [3, 4], [11, 2], [11, 4], [4, 6], [10, 6], [4, 0], [10, 0]]) R(a, b, 2, 1, c); }
    else if (f.shape === 'spike') { for (let j = 0; j < 7; j++) R(6 + (j % 2), j, 2, 1, c); R(7, 0, 1, 1, c); }
    else if (f.shape === 'star') { R(7, 1, 1, 5, c); R(5, 3, 5, 1, c); R(6, 2, 3, 3, c); R(7, 3, 1, 1, '#fff'); }
    else { for (const [a, b] of [[4, 2], [7, 1], [10, 2], [5, 4], [8, 4], [6, 6], [9, 6], [7, 3]]) R(a, b, 2, 2, c); }
  }
  function drawJar(ctx, x, y, h, k = 3) {
    const R = (a, b, w, hh, c) => { ctx.fillStyle = c; ctx.fillRect(x + a * k, y + b * k, w * k, hh * k); };
    R(3, 3, 10, 12, '#d8e8e8'); R(4, 5, 8, 10, h.col); R(4, 5, 8, 2, '#ffffff44'); R(5, 8, 1, 6, '#ffffff55'); R(4, 14, 8, 1, '#00000030'); R(3, 1, 10, 2, '#7a5a30'); R(4, 0, 8, 1, '#8a6a3a'); R(6, 9, 4, 3, '#f0e8c8'); R(7, 10, 2, 1, '#8a6a3a');
    for (let i = 0; i < h.q; i++) R(3 + i * 2, 16, 1, 1, '#ffe070');
  }
  return { drawFlower, drawJar, TYPES, FLOWERS, HONEYS, FL, HN, KINDS, SCENT, QUAL, inv, count, add, owned, buy, rate, quality, rarK, lure, pick, model, setBroken, rests, Sys, UI, mmss };
})();
