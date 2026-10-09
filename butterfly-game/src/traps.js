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
    scr: { id: 'scr', ru: 'Скритчушка', real: 'странная чёрная ловушка из океана', price: 2288, life: 426, cap: 12, ab: 0, only: 'ocean', baitOnly: 'pheromone', secret: true, desc: 'Чёрная, зубастая и улыбчивая. Ставится только в океане, берёт в приманку одну колбу феромонов и ничего больше. Ломается через 6 минут 66 секунд — с визгом.' },
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
    // sold only by the hooded trader of the secret market; goes into the honey place of a trap: wildly rarer visitors and 10% of them are aberrations
    { id: 'pheromone', ru: 'Непонятные феромоны', q: 25, tag: 'неведомый', price: 3000, col: '#8a4aff', secret: true, ab: 0.1, lure: 2.0, desc: 'Запечатанный флакон без этикетки. Пахнет тем, чего не бывает. Ловушка с ним зовёт самых редких, и каждая десятая бабочка оказывается не такой, как все.' },
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
  const rate = (fl, hn) => (FL[fl] ? 1.1 * FL[fl].scent : 0) + (HN[hn] ? (HN[hn].lure !== undefined ? HN[hn].lure : 0.4 * HN[hn].q) : 0);            // visits per minute
  const quality = hn => (HN[hn] ? HN[hn].q : 0);
  const rarK = (hn, rar) => 1 + 0.9 * quality(hn) * (rar - 1);                                           // multiplier of the weight of a species of rarity rar
  // the species a trap can lure: daytime butterflies of the location (no glowing or night ones)
  const lure = biome => biome.species.filter(sp => !sp.mystery && !(BEH[sp.beh] && BEH[sp.beh].light) && sp.biome !== 'ocean');
  // the visitor: only species of the current landscape (the 9-10 butterflies that live here, Play.pool); src is that list (or a biome: its daytime species, for tests)
  function pick(src, hn, type) {
    const list = type === 'scr' ? (Array.isArray(src) ? src : src.species) : (Array.isArray(src) ? src : lure(src)).filter(sp => !sp.mystery && !(BEH[sp.beh] && BEH[sp.beh].light) && sp.biome !== 'ocean');
    const pool = list.map(sp => ({ sp, w: sp.scarce ? sp.scarce * 0.3 * quality(hn) * 0.6 : (sp.rar === 1 ? 3 : sp.rar === 2 ? 2 : 1) * (sp.thin || 1) * rarK(hn, sp.rar || 1) })).filter(o => o.w > 0);
    if (!pool.length) return null; let r = Math.random() * pool.reduce((a, o) => a + o.w, 0); let sp = pool[pool.length - 1].sp; for (const o of pool) { r -= o.w; if (r <= 0) { sp = o.sp; break; } }
    const abp = TYPES[type].ab + ((HN[hn] && HN[hn].ab) || 0);          // the imported trap's 1% adds to what the bait gives
    return (abp && Aberr.eligible(sp) && Math.random() < abp) ? Aberr.make(sp, Aberr.randomCode()) : sp;
  }
  // where a trap may stand: the skrichushka only in the ocean, every other trap anywhere but the ocean
  const allowed = (type, loc) => (type === 'scr') === (loc === 'ocean') ? '' : (type === 'scr' ? 'Скритчушку можно поставить только в океане' : 'В океане можно поставить только скритчушку');
  // what a trap accepts as bait (the skrichushka: one flask of pheromones, nothing else)
  const accepts = (type, kind, id) => { const o = TYPES[type] && TYPES[type].baitOnly; return !o || (kind === 'hn' && id === o); };
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
    else if (type === 'scr') for (let i = 0; i < 9; i++) out.push({ x: ((i % 3) - 1) * 0.08, y: 0.5, z: 0.3 + (i % 2) * 0.04, a: Math.PI });
    else for (let i = 0; i < 9; i++) { const y = 0.3 + (i % 3) * 0.24, a = i * 2.1, r = 0.55 * Math.sqrt(Math.max(0.05, 1 - (y / 1.1) * (y / 1.1))) - 0.03; out.push({ x: Math.cos(a) * r, y, z: Math.sin(a) * r, a }); }
    return out;
  }
  // ---- detailed baits: real-looking flower heads (petals with a shaded gradient, stems, leaves) and honey (a honeycomb piece, a glossy puddle, a dipper); every part touches the one it grows from
  const tint = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return c; };
  const mixc = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);
  const Z3 = new THREE.Vector3(), Qt = new THREE.Quaternion(), Eu = new THREE.Euler();
  // merge parts [{g, m: Matrix4, c: colour or fn(x, y, z) -> colour}] into one vertex-coloured geometry
  function merged(parts) {
    let n = 0; const gs = parts.map(p => { const g = p.g.index ? p.g.toNonIndexed() : p.g.clone(); g.applyMatrix4(p.m); n += g.attributes.position.count; return g; });
    const P = new Float32Array(n * 3), N = new Float32Array(n * 3), C = new Float32Array(n * 3); let o = 0;
    gs.forEach((g, i) => { const pa = g.attributes.position, na = g.attributes.normal, p = parts[i], inv = new THREE.Matrix4().copy(p.m).invert(), v = new THREE.Vector3(), col = typeof p.c === 'function' ? null : new THREE.Color(p.c);
      for (let k = 0; k < pa.count; k++) { P[(o + k) * 3] = pa.getX(k); P[(o + k) * 3 + 1] = pa.getY(k); P[(o + k) * 3 + 2] = pa.getZ(k); N[(o + k) * 3] = na.getX(k); N[(o + k) * 3 + 1] = na.getY(k); N[(o + k) * 3 + 2] = na.getZ(k);
        const c = col || (v.set(pa.getX(k), pa.getY(k), pa.getZ(k)).applyMatrix4(inv), new THREE.Color(p.c(v.x, v.y, v.z))); C[(o + k) * 3] = c.r; C[(o + k) * 3 + 1] = c.g; C[(o + k) * 3 + 2] = c.b; } o += pa.count; g.dispose(); });
    const G = new THREE.BufferGeometry(); G.setAttribute('position', new THREE.BufferAttribute(P, 3)); G.setAttribute('normal', new THREE.BufferAttribute(N, 3)); G.setAttribute('color', new THREE.BufferAttribute(C, 3)); return G;
  }
  const MX = (x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), Qt.setFromEuler(Eu.set(rx, ry, rz, 'YXZ')).clone(), new THREE.Vector3(sx, sy, sz));
  // one petal: a leaf-shaped strip lying along +x (length L, width W); (x, y, z) -> t along it
  const petalGeo = (L, W, curl = 0) => { const rows = [0.25, 0.7, 1, 0.85, 0.35, 0], P = [], I = []; rows.forEach((w, r) => { const t = r / (rows.length - 1); P.push(t * L, -curl * L * t * t, -w * W / 2, t * L, -curl * L * t * t, w * W / 2); if (r) { const a = (r - 1) * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }); const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); g.computeVertexNormals(); return g; };
  const leafGeo = (L, W) => petalGeo(L, W, 0.25);
  const GREEN = ['#2e6a2a', '#3e8a34', '#58a63e'];
  function rodGeo(a, b, r) { const d = new THREE.Vector3().subVectors(b, a), L = d.length(), g = new THREE.CylinderGeometry(r * 0.7, r, L, 5); const m = new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()), new THREE.Vector3(1, 1, 1)); return { g, m }; }
  // a flower head at the origin of its own frame, looking up (+y); returns parts
  function headParts(f, k, rng) {
    const parts = [], c = f.col, light = tint(c, 1.28), dark = tint(c, 0.62), mid = c;
    const petal = (L, W, curl, ang, tilt, off, cA, cB, y = 0) => parts.push({ g: petalGeo(L, W, curl), m: MX(Math.cos(ang) * off, y, Math.sin(ang) * off, 0, -ang, tilt), c: (x, yy, z) => { const t = x / L, edge = Math.abs(z) / (W * 0.5 + 1e-6); return mixc(mixc(cA, cB, t), tint(cB, 0.8), clamp(edge * 0.6)); } });
    if (f.shape === 'daisy') {
      const n = 14; for (let i = 0; i < n; i++) petal(0.05, 0.016, 0.1, i / n * 6.283 + rng() * 0.1, 0.12 + rng() * 0.12, 0.014, '#fffef4', '#e8e4d0', 0.002 * (i % 2));
      parts.push({ g: new THREE.CylinderGeometry(0.016, 0.019, 0.012, 9), m: MX(0, 0.004, 0), c: (x, y, z) => ((Math.round(x * 500) + Math.round(z * 500)) % 2 ? '#e8b820' : '#f4d440') }); parts.push({ g: new THREE.SphereGeometry(0.012, 7, 4, 0, 6.3, 0, 1.4), m: MX(0, 0.006, 0), c: '#f8dc50' });
    } else if (f.shape === 'star') {
      for (let i = 0; i < 9; i++) { const a = i / 9 * 6.283; petal(0.036, 0.012, 0.2, a, 0.5, 0.008, tint(c, 0.8), light, 0.002); petal(0.026, 0.011, 0.2, a + 0.35, 0.78, 0.008, tint(c, 0.9), tint(c, 1.15), 0.006); }
      parts.push({ g: new THREE.SphereGeometry(0.012, 6, 5), m: MX(0, 0.004, 0), c: '#2a1e5a' }); for (let i = 0; i < 6; i++) parts.push({ g: new THREE.CylinderGeometry(0.002, 0.003, 0.014, 4), m: MX(Math.cos(i) * 0.006, 0.012, Math.sin(i) * 0.006, 0.2 * Math.cos(i), 0, 0.2 * Math.sin(i)), c: '#6a2a8a' });
      parts.push({ g: new THREE.SphereGeometry(0.014, 6, 4, 0, 6.3, 1.6, 1.5), m: MX(0, 0.002, 0), c: '#4a7a30' });
    } else if (f.shape === 'cone') {
      for (let i = 0; i < 13; i++) petal(0.058, 0.014, 0.5, i / 13 * 6.283 + rng() * 0.08, -0.55 - rng() * 0.2, 0.02, tint(c, 1.15), tint(c, 0.78), 0.004);
      parts.push({ g: new THREE.ConeGeometry(0.022, 0.03, 8), m: MX(0, 0.015, 0), c: (x, y, z) => (y > 0.0 ? mixc('#7a3a14', '#c8641e', clamp(y * 40 + 0.5)) : '#5a2a10') });
      for (let i = 0; i < 16; i++) { const a = i * 2.4, r = 0.004 + i * 0.001; parts.push({ g: new THREE.ConeGeometry(0.0035, 0.01, 4), m: MX(Math.cos(a) * r, 0.034 - i * 0.0012, Math.sin(a) * r), c: '#e0902a' }); }
    } else if (f.shape === 'ball') {
      parts.push({ g: new THREE.IcosahedronGeometry(0.024, 1), m: MX(0, 0.022, 0, 0, 0, 0, 1, 1.15, 1), c: (x, y, z) => mixc(tint(c, 0.7), tint(c, 1.1), clamp((y + 0.03) * 12)) });
      for (let i = 0; i < 34; i++) { const u = (i + 0.5) / 34, ph = Math.acos(1 - u * 1.9), th = i * 2.4; parts.push({ g: new THREE.ConeGeometry(0.0055, 0.015, 4), m: MX(Math.sin(ph) * Math.cos(th) * 0.026, 0.022 + Math.cos(ph) * 0.03, Math.sin(ph) * Math.sin(th) * 0.026, Math.sin(ph) * Math.sin(th) * 0.9, 0, -Math.sin(ph) * Math.cos(th) * 0.9), c: i % 3 ? tint(c, 1.22) : tint(c, 0.9) }); }
      for (let i = 0; i < 3; i++) { const a = i * 2.1; parts.push({ g: leafGeo(0.05, 0.026), m: MX(Math.cos(a) * 0.012, -0.002, Math.sin(a) * 0.012, 0, -a, 0.35), c: '#4a8a34' }); }
    } else if (f.shape === 'spike') {
      const buddle = f.id === 'buddleia', N = buddle ? 46 : 34, Hh = buddle ? 0.15 : 0.12;
      parts.push(rodRaw(new THREE.Vector3(0, -0.004, 0), new THREE.Vector3(0, Hh, 0), 0.0035, '#4a8a34'));
      for (let i = 0; i < N; i++) { const t = i / (N - 1), a = i * 2.4 + rng() * 0.4, rad = (buddle ? 0.026 : 0.017) * (1 - t * 0.75) + 0.004, y = t * Hh; const fc = i % 3 ? mixc(c, light, t * 0.4) : tint(c, 0.78);
        parts.push({ g: new THREE.OctahedronGeometry(buddle ? 0.0105 : 0.0085, 0), m: MX(Math.cos(a) * rad, y, Math.sin(a) * rad, 0.4, a, 0.3, 1, 1.25, 1), c: fc }); parts.push(rodRaw(new THREE.Vector3(0, y, 0), new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad), 0.0016, '#4a7a34'));
        if (buddle && i % 4 === 0) parts.push({ g: new THREE.SphereGeometry(0.0034, 4, 3), m: MX(Math.cos(a) * rad * 1.1, y + 0.002, Math.sin(a) * rad * 1.1), c: '#f09a20' }); }
      parts.push({ g: new THREE.OctahedronGeometry(0.009, 0), m: MX(0, Hh + 0.006, 0, 0, 0, 0, 1, 1.4, 1), c: light });
    } else {      // cluster: an umbel / panicle of small stalked florets
      const big = f.id === 'lilac', N = big ? 30 : 17, R = big ? 0.05 : 0.04;
      for (let i = 0; i < N; i++) { const a = i * 2.4 + rng() * 0.3, u = Math.sqrt((i + 0.5) / N), rad = R * u, y = (big ? 0.01 + (1 - u) * 0.07 : 0.026 - u * u * 0.012) + (i % 3) * 0.002, fc = i % 4 ? mixc(c, light, (i % 5) / 6) : dark;
        parts.push(rodRaw(new THREE.Vector3(0, big ? 0.0 : -0.002, 0), new THREE.Vector3(Math.cos(a) * rad, y, Math.sin(a) * rad), 0.0015, '#4a7a34'));
        for (let k = 0; k < 4; k++) parts.push({ g: petalGeo(0.0115, 0.0085, 0.2), m: MX(Math.cos(a) * rad, y, Math.sin(a) * rad, 0, -(k * 1.571 + a), 0.35), c: k % 2 ? fc : tint(fc, 1.15) });
        parts.push({ g: new THREE.SphereGeometry(0.0034, 4, 3), m: MX(Math.cos(a) * rad, y + 0.003, Math.sin(a) * rad), c: '#f8e8a0' }); }
    }
    return parts;
  }
  function rodRaw(a, b, r, c) { const o = rodGeo(a, b, r); return { g: o.g, m: o.m, c }; }
  // a stem with leaves and a head at its top; the base is the origin; the tip is at (tx, h, tz)
  function stemParts(f, h, tx, tz, rng) {
    const parts = [], base = new THREE.Vector3(0, 0, 0), mid = new THREE.Vector3(tx * 0.45, h * 0.5, tz * 0.45), tip = new THREE.Vector3(tx, h, tz);
    parts.push(rodRaw(base, mid, 0.0055, '#3a7a30'), rodRaw(mid, tip, 0.0045, '#4a8a38'));
    for (let i = 0; i < 3; i++) { const t = 0.2 + i * 0.22, p = base.clone().lerp(tip, t), a = i * 2.2 + rng() * 0.6; parts.push({ g: leafGeo(0.06 - i * 0.012, 0.022), m: MX(p.x, p.y, p.z, 0, -a, 0.55 - i * 0.12), c: (x, y, z) => mixc(GREEN[0], GREEN[2], clamp(x * 14)) }); }
    const hp = headParts(f, 1, rng), look = new THREE.Vector3(tx, h * 0.5, tz).normalize(), q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), look);
    for (const p of hp) { const m = new THREE.Matrix4().compose(tip.clone().add(new THREE.Vector3(0, -0.002, 0)), q, new THREE.Vector3(1, 1, 1)).multiply(p.m); parts.push({ g: p.g, m, c: p.c }); }
    return parts;
  }
  const seedRng = s => () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
  // a bunch standing in the dish (base at the dish top y), spread by sp
  function flowerBunch(g, y, f, r, ox = 0) {
    const rng = seedRng(f.id.length * 977 + f.scent * 31), parts = [], N = f.shape === 'spike' || f.shape === 'cluster' ? 6 : 7;
    for (let i = 0; i < N; i++) { const a = i / N * 6.283 + rng() * 0.5, lean = 0.05 + rng() * 0.07, h = 0.2 + rng() * 0.07 + (f.shape === 'spike' ? 0.03 : 0), tx = Math.cos(a) * (lean + 0.02), tz = Math.sin(a) * (lean + 0.02), bx = Math.cos(a) * 0.008, bz = Math.sin(a) * 0.008;
      for (const p of stemParts(f, h, tx - bx, tz - bz, rng)) parts.push({ g: p.g, m: new THREE.Matrix4().makeTranslation(bx, 0, bz).multiply(p.m), c: p.c }); }
    parts.push({ g: new THREE.CylinderGeometry(0.022, 0.017, 0.05, 8), m: MX(0, 0.025, 0), c: (x, yy, z) => (Math.abs(((yy * 90) % 2)) > 1 ? '#c8b080' : '#a89060') });      // a twine-wrapped paper cone around the stem bases
    const mesh0 = new THREE.Mesh(merged(parts), new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide, flatShading: true })); mesh0.position.set(ox, y - 0.002, 0); g.add(mesh0);
  }
  // honey: a honeycomb piece with a glossy puddle, drips, bubbles, a grooved dipper
  const WAX = '#e8c668';
  function honeyPiece(g, y, hn, ox = 0) {
    const col = new THREE.Color(hn.col), parts = [], wax = [], rng = seedRng(hn.q * 131 + hn.price), cells = [[0, 0], [1, 0], [-1, 0], [0.5, 0.87], [-0.5, 0.87], [0.5, -0.87], [-0.5, -0.87]], S = 0.034;
    // a puddle on the dish and drips over its edge
    parts.push({ g: new THREE.CylinderGeometry(0.1, 0.11, 0.012, 14), m: MX(0, 0.006, 0), c: (x, yy, z) => mixc(tint(col, 0.78), col, clamp(1 - Math.hypot(x, z) * 8)) });
    for (let i = 0; i < 6; i++) { const a = i * 1.1 + rng(), r = 0.1 + rng() * 0.012; parts.push({ g: new THREE.SphereGeometry(0.014 + rng() * 0.007, 6, 4), m: MX(Math.cos(a) * r, 0.007, Math.sin(a) * r, 0, 0, 0, 1.2, 0.5, 1.2), c: tint(col, 0.92) }); }
    // the comb: seven six-sided cells with brimming honey caps
    cells.forEach(([cx, cz], i) => { const x = cx * S * 1.75, z = cz * S * 1.75; wax.push({ g: new THREE.CylinderGeometry(S, S, 0.034, 6), m: MX(x, 0.029, z, 0, Math.PI / 6), c: (xx, yy, zz) => (Math.hypot(xx, zz) > S * 0.86 ? mixc(tint(WAX, 0.82), col, 0.3) : mixc(WAX, col, 0.4)) });
      parts.push({ g: new THREE.CylinderGeometry(S * 0.8, S * 0.8, 0.012, 6), m: MX(x, 0.047, z, 0, Math.PI / 6), c: i % 2 ? tint(col, 1.12) : col }); parts.push({ g: new THREE.SphereGeometry(S * 0.62, 6, 3, 0, 6.3, 0, 0.9), m: MX(x, 0.05, z, 0, 0, 0, 1, 0.35, 1), c: tint(col, 1.3) }); });
    // bubbles and, in the pale crystallising kinds, grains
    for (let i = 0; i < 6; i++) { const a = i * 2.3, r = 0.045 + rng() * 0.05; parts.push({ g: new THREE.SphereGeometry(0.004, 4, 3), m: MX(Math.cos(a) * r, 0.014, Math.sin(a) * r), c: tint(col, 1.45) }); }
    if (hn.id === 'sunflower' || hn.id === 'meadow') for (let i = 0; i < 12; i++) { const a = i * 2.1, r = 0.02 + rng() * 0.08; parts.push({ g: new THREE.OctahedronGeometry(0.004, 0), m: MX(Math.cos(a) * r, 0.016, Math.sin(a) * r), c: '#fff4c0' }); }
    // a wooden dipper lying in the honey and resting on the rim
    const d0 = new THREE.Vector3(-0.02, 0.03, 0.0), d1 = new THREE.Vector3(0.2, 0.012, 0.1); const rd = rodRaw(d0, d1, 0.006, '#9a6a3a'); wax.push(rd);
    for (let i = 0; i < 5; i++) { const t = i / 4, p = d0.clone().lerp(new THREE.Vector3(0.07, 0.04, 0.035), t * 0.8); wax.push({ g: new THREE.TorusGeometry(0.014 + (i % 2) * 0.004, 0.004, 4, 8), m: MX(p.x - 0.01 + t * 0.025, p.y, p.z, 0, 0.45, Math.PI / 2 - 0.1), c: '#b88a50' }); }
    const grp = new THREE.Group(); grp.position.set(ox, y, 0);
    grp.add(new THREE.Mesh(merged(parts), new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 95, specular: new THREE.Color('#fff0c0'), flatShading: false })));
    grp.add(new THREE.Mesh(merged(wax), new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true }))); g.add(grp);
  }
  // the strange pheromones: a sealed flask with a violet glowing liquid standing in a spilled puddle, a wax seal, a rune band and a thread of smoke
  function pheroPiece(g, y, hn, ox = 0) {
    const parts = [], glow = [], col = new THREE.Color(hn.col), rng = seedRng(77);
    parts.push({ g: new THREE.CylinderGeometry(0.085, 0.09, 0.008, 14), m: MX(0, 0.004, 0), c: (x, yy, z) => mixc('#3a1a6a', col, clamp(1 - Math.hypot(x, z) * 9)) });
    for (let i = 0; i < 5; i++) { const a = i * 1.3 + rng(), r = 0.085 + rng() * 0.01; parts.push({ g: new THREE.SphereGeometry(0.011 + rng() * 0.006, 6, 4), m: MX(Math.cos(a) * r, 0.006, Math.sin(a) * r, 0, 0, 0, 1.3, 0.45, 1.3), c: '#6a2ad0' }); }
    glow.push({ g: new THREE.CylinderGeometry(0.036, 0.04, 0.085, 10), m: MX(0, 0.0505, 0), c: (x, yy, z) => mixc('#5a1ac0', '#b890ff', clamp((yy + 0.04) * 10)) });       // the liquid
    parts.push({ g: new THREE.CylinderGeometry(0.042, 0.045, 0.014, 10), m: MX(0, 0.015, 0), c: '#dfe8ee' });                                  // the heavy glass foot
    parts.push({ g: new THREE.CylinderGeometry(0.02, 0.038, 0.03, 10), m: MX(0, 0.108, 0), c: '#cfdde6' }); parts.push({ g: new THREE.CylinderGeometry(0.017, 0.02, 0.026, 8), m: MX(0, 0.136, 0), c: '#cfdde6' });   // shoulder and neck
    parts.push({ g: new THREE.CylinderGeometry(0.021, 0.019, 0.014, 8), m: MX(0, 0.15, 0), c: '#7a1a1a' }); parts.push({ g: new THREE.SphereGeometry(0.014, 6, 4, 0, 6.3, 0, 1.4), m: MX(0, 0.156, 0), c: '#8a2222' });    // the wax seal
    parts.push({ g: new THREE.CylinderGeometry(0.0425, 0.0425, 0.012, 10, 1, true), m: MX(0, 0.06, 0), c: (x, yy, z) => (Math.abs(Math.atan2(x, z) * 7 % 2) > 1 ? '#e8d890' : '#a89850') });           // a band of runes
    for (let i = 0; i < 4; i++) parts.push({ g: new THREE.SphereGeometry(0.011 - i * 0.002, 5, 4), m: MX(0.006 * Math.sin(i * 1.7), 0.17 + i * 0.012, 0.006 * Math.cos(i * 1.7)), c: mixc('#c8a8ff', '#6a3ad0', i / 4) });   // a thread of smoke
    const grp = new THREE.Group(); grp.position.set(ox, y, 0);
    grp.add(new THREE.Mesh(merged(parts), new THREE.MeshPhongMaterial({ vertexColors: true, shininess: 110, specular: new THREE.Color('#ffffff'), flatShading: false })));
    grp.add(new THREE.Mesh(merged(glow), new THREE.MeshPhongMaterial({ vertexColors: true, emissive: new THREE.Color('#6a2ad0'), emissiveIntensity: 0.9, shininess: 120 }))); g.add(grp);
  }
  const honeyOrPhero = (g, y, hn, ox) => (hn.secret ? pheroPiece(g, y, hn, ox) : honeyPiece(g, y, hn, ox));
  // the bait dish contents: flowers and honey on the tray top at height y (r = tray radius)
  function bait(g, y, r, fl, hn) {
    if (HN[hn]) honeyOrPhero(g, y, HN[hn], FL[fl] ? -r * 0.36 : 0);
    if (FL[fl]) flowerBunch(g, y, FL[fl], r, HN[hn] ? r * 0.12 : 0);
  }
  // the three trap bodies; every part touches its neighbour (the float test checks it); y = 0 is the ground
  function body(type) {
    const g = new THREE.Group(), top = new THREE.Group(), baitG = new THREE.Group(); g.add(top); g.add(baitG); let trayY = 0.34, trayR = 0.26, jawRef = null;
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
      for (const [x, z, w, d] of [[0, 0.43, 0.86, 0.06], [0, -0.43, 0.86, 0.06], [0.43, 0, 0.06, 0.86], [-0.43, 0, 0.06, 0.86]]) { top.add(box(w, 0.06, d, wood, x, 1.36, z)); g.add(box(w, 0.05, d, wood, x, 0.6, z)); }   // top frame and the sill of the net walls
      for (const [x, z, w, d] of [[0, 0.43, 0.8, 0.012], [0, -0.43, 0.8, 0.012], [0.43, 0, 0.012, 0.8], [-0.43, 0, 0.012, 0.8]]) top.add(box(w, 0.74, d, netc, x, 0.98, z));   // mesh walls (the gap below the sill is the way in)
      for (const [x, z, w, d] of [[0, 0.43, 0.86, 0.02], [0, -0.43, 0.86, 0.02], [0.43, 0, 0.02, 0.86], [-0.43, 0, 0.02, 0.86]]) top.add(box(w, 0.025, d, M(IRON), x, 1.0, z));   // metal hoop
      top.add(mesh(new THREE.ConeGeometry(0.78, 0.3, 4), M('#4a5a50'), 0, 1.56, 0, 0, Math.PI / 4, 0)); top.add(mesh(new THREE.SphereGeometry(0.045, 6, 5), M(BRASS), 0, 1.73, 0));   // hip roof and its finial
      g.add(cyl(0.12, 0.2, 0.2, dw, 0, 0.26, 0, 8)); baitG.add(cyl(0.3, 0.3, 0.04, M('#5a4028'), 0, 0.38, 0, 12)); trayY = 0.4; trayR = 0.3;     // a pedestal and the dish on it
      g.add(box(0.2, 0.1, 0.012, brass, 0, 0.13, 0.495));                                                                                    // maker's plate on the plank edge
    } else if (type === 'scr') {
      // the «скритчушка»: a black thing with a toothy smile, three odd eyes and tentacles; the lower jaw (U.jaw) swings open when a butterfly comes
      const skin = M('#0c0a12'), skin2 = M('#181226'), lip = M('#2a0a1a'), tooth = M('#f4f0dc'), tongue = M('#b04a78'), eyeW = new THREE.MeshBasicMaterial({ color: '#ffffff' }), orb = new THREE.MeshBasicMaterial({ color: '#f4eaa0' }), cavity = new THREE.MeshBasicMaterial({ color: '#5a0a22' });
      const tap = (a, b, r0, r1, mat) => { const d = new THREE.Vector3().subVectors(b, a), L = d.length(), m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, L, 7), mat); m.position.copy(a).add(b).multiplyScalar(0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); return m; };
      const sm = (u) => u * u * (3 - 2 * u), V = (x, y, z) => new THREE.Vector3(x, y, z);
      const bodyM = mesh(new THREE.SphereGeometry(0.62, 20, 14), skin, 0, 0.82, 0); bodyM.scale.set(1.05, 1.08, 0.95); top.add(bodyM);
      // tentacles: they start inside the body, spread over the ground and curl their tips up
      const N = 8; for (let k = 0; k < N; k++) {
        const a = k * Math.PI * 2 / N + 0.2, reach = (Math.abs(Math.sin(a - Math.PI / 2)) > 0.9 ? 0.85 : 1.15 + (k % 3) * 0.18), th = 0.13 + (k % 2) * 0.03, pts = [];
        for (let i = 0; i <= 9; i++) { const u = i / 9, R = 0.38 + u * reach, y = u < 0.55 ? 0.42 - (0.42 - 0.06) * sm(u / 0.55) : 0.06 + Math.pow((u - 0.55) / 0.45, 2) * (0.22 + (k % 2) * 0.12), w = Math.sin(u * 5 + k) * 0.07 * u; pts.push(V(Math.cos(a) * R - Math.sin(a) * w, y, Math.sin(a) * R + Math.cos(a) * w)); }
        for (let i = 0; i < pts.length; i++) { const r = th * (1 - 0.82 * i / 9) + 0.015; g.add(mesh(new THREE.SphereGeometry(r, 7, 5), skin, pts[i].x, pts[i].y, pts[i].z)); if (i) g.add(tap(pts[i - 1], pts[i], th * (1 - 0.82 * (i - 1) / 9) + 0.015, r, skin)); }
        const tp = pts[9]; for (let q = 0; q < 2; q++) g.add(mesh(new THREE.SphereGeometry(0.02, 5, 4), skin2, tp.x + (q - 0.5) * 0.02, tp.y + 0.02, tp.z));       // a pale sucker at the tip
      }
      // three thin feelers on top with glowing tips
      for (let k = 0; k < 3; k++) { const a = k * 2.1 + 0.4, root = V(Math.cos(a) * 0.22, 1.36, Math.sin(a) * 0.22), pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push(V(root.x + Math.cos(a) * u * 0.5, root.y + u * 0.55 - u * u * 0.08, root.z + Math.sin(a) * u * 0.5 + Math.sin(u * 4) * 0.05)); }
        for (let i = 1; i < pts.length; i++) top.add(tap(pts[i - 1], pts[i], 0.035 - i * 0.003, 0.03 - i * 0.003, skin)); top.add(mesh(new THREE.SphereGeometry(0.055, 8, 6), orb, pts[6].x, pts[6].y + 0.03, pts[6].z)); }
      // warts
      for (let i = 0; i < 12; i++) { const th2 = i * 2.4 + 1, ph = 0.5 + (i * 0.37 % 1) * 2.1; if (Math.abs(Math.atan2(Math.sin(th2), Math.cos(th2)) - Math.PI / 2) < 0.9 && ph > 1.0 && ph < 2.3) continue; top.add(mesh(new THREE.SphereGeometry(0.04 + (i % 3) * 0.015, 6, 5), skin2, 0.63 * 0.96 * Math.sin(ph) * Math.cos(th2) * 1.05, 0.82 + 0.67 * 0.96 * Math.cos(ph), 0.59 * 0.96 * Math.sin(ph) * Math.sin(th2))); }
      // three eyes
      for (const [ex, ey, ez] of [[-0.22, 1.02, 0.5], [0.22, 1.02, 0.5], [0, 1.2, 0.44]]) { top.add(mesh(new THREE.SphereGeometry(0.075, 10, 8), eyeW, ex, ey, ez)); }
      // the cavity of the mouth, the upper lip with hanging teeth
      const cav = mesh(new THREE.SphereGeometry(1, 14, 8), cavity, 0, 0.56, 0.4); cav.scale.set(0.42, 0.17, 0.16); top.add(cav);
      const upper = new THREE.CatmullRomCurve3([V(-0.44, 0.74, 0.34), V(-0.24, 0.66, 0.53), V(0, 0.62, 0.58), V(0.24, 0.66, 0.53), V(0.44, 0.74, 0.34)]); top.add(mesh(new THREE.TubeGeometry(upper, 24, 0.045, 6), lip, 0, 0, 0));
      for (let i = 0; i < 10; i++) { const u = (i + 0.5) / 10, p = upper.getPoint(u), h = 0.085 + ((i * 7) % 4) * 0.018; top.add(mesh(new THREE.ConeGeometry(0.03, h, 5), tooth, p.x, p.y - 0.035 - h / 2 + 0.03, p.z - 0.012, Math.PI)); }
      // the lower jaw swings about its hinge
      const jaw = new THREE.Group(); jaw.position.set(0, 0.56, 0.36); top.add(jaw); const lower = new THREE.CatmullRomCurve3([V(-0.4, 0, 0), V(-0.22, -0.07, 0.17), V(0, -0.1, 0.22), V(0.22, -0.07, 0.17), V(0.4, 0, 0)]); jaw.add(mesh(new THREE.TubeGeometry(lower, 24, 0.045, 6), lip, 0, 0, 0));
      for (let i = 0; i < 9; i++) { const u = (i + 0.5) / 9, p = lower.getPoint(u), h = 0.07 + ((i * 5) % 3) * 0.02; jaw.add(mesh(new THREE.ConeGeometry(0.028, h, 5), tooth, p.x, p.y + 0.03 + h / 2 - 0.02, p.z - 0.008)); }
      const tg = mesh(new THREE.SphereGeometry(1, 10, 6), tongue, 0, -0.07, 0.1); tg.scale.set(0.27, 0.05, 0.15); jaw.add(tg); jaw.add(mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.08, 5), lip, 0, -0.02, 0.0, 0, 0, Math.PI / 2));   // tongue and the hinge pin
      // a crooked bowl on the head for the flask
      baitG.add(cyl(0.27, 0.21, 0.06, M('#cfc68a'), 0, 1.5, 0, 12)); baitG.add(mesh(new THREE.TorusGeometry(0.265, 0.018, 5, 14), M('#f4eaa0'), 0, 1.53, 0, Math.PI / 2));
      trayY = 1.53; trayR = 0.26; jawRef = jaw;
    } else {
      const netc = NET('#f4f6f0', 0.4), orange = M('#e8782a'), rib = M('#c8ccc4'), peg = M(IRON), line = M('#e8d8b0');
      g.add(mesh(new THREE.TorusGeometry(0.55, 0.022, 5, 18), rib, 0, 0.025, 0, Math.PI / 2));                                            // the base hoop on the ground
      const dome = mesh(new THREE.SphereGeometry(0.55, 16, 8, 0, Math.PI * 2, 0, 1.425), netc, 0, 0.02, 0); dome.scale.y = 2.0; top.add(dome);
      for (let k = 0; k < 3; k++) { const arc = mesh(new THREE.TorusGeometry(0.55, 0.012, 4, 18, Math.PI), rib, 0, 0.02, 0, 0, k * Math.PI / 3, 0); arc.scale.y = 2.0; top.add(arc); }   // arched ribs
      g.add(mesh(new THREE.CylinderGeometry(0.56, 0.56, 0.2, 20, 1, true, 0.5, Math.PI * 2 - 1.0), M('#e8782a', { side: THREE.DoubleSide }), 0, 0.1, 0));       // the coloured skirt with a doorway (centred on +z)
      for (const sd of [-1, 1]) g.add(box(0.03, 0.2, 0.012, M('#c85a1a'), sd * Math.sin(0.5) * 0.56, 0.1, Math.cos(0.5) * 0.56, 0, sd * 0.5, 0));      // the posts of the doorway
      top.add(mesh(new THREE.SphereGeometry(0.05, 6, 5), M(BRASS), 0, 1.12, 0)); top.add(rod([0, 1.1, 0], [0, 1.62, 0], 0.01, peg, 4)); top.add(mesh(new THREE.ConeGeometry(0.1, 0.24, 3), M('#d03a30'), 0.1, 1.5, 0, 0, 0, -Math.PI / 2));   // top cap and a pennant
      for (let k = 0; k < 4; k++) { const a = k * 1.571 + 0.78, X = Math.cos(a), Z = Math.sin(a); g.add(rod([X * 1.0, -0.05, Z * 1.0], [X * 0.92, 0.2, Z * 0.92], 0.014, peg, 4)); top.add(rod([X * 0.92, 0.2, Z * 0.92], [X * 0.45, 0.62, Z * 0.45], 0.005, line, 3)); }    // pegs and guy lines to the dome
      baitG.add(cyl(0.3, 0.3, 0.035, M('#3a4a58'), 0, 0.05, 0, 12)); trayY = 0.07; trayR = 0.3;
    }
    g.userData = { top, baitG, trayY, trayR, type, jaw: jawRef };
    return g;
  }
  // a whole model with its contents: fl / hn ids, n resting butterflies (cols: their colours), broken: collapsed
  function model(type, o = {}) {
    const g = body(type), U = g.userData; bait(U.baitG, U.trayY, U.trayR, o.fl, o.hn);
    const wings = new THREE.Group(); U.top.add(wings); U.wings = [];
    if (type === 'scr') { const nb = Math.min(9, o.n || 0); for (let i = 0; i < nb; i++) { const th = 2.0 + i * 0.52 + (i % 2) * 0.2, ph = 1.35 + (i % 3) * 0.4, col = (o.cols && o.cols[i]) || '#b070ff'; wings.add(mesh(new THREE.SphereGeometry(0.055, 7, 5), new THREE.MeshBasicMaterial({ color: col }), 0.62 * 1.05 * 0.93 * Math.sin(ph) * Math.cos(th), 0.82 + 0.67 * 0.93 * Math.cos(ph), 0.59 * 0.93 * Math.sin(ph) * Math.sin(th))); } return o.broken ? (setBroken(g, true), g) : g; }
    const spots = rests(type), n = Math.min(spots.length, o.n || 0);
    for (let i = 0; i < n; i++) { const s = spots[i], col = (o.cols && o.cols[i]) || '#e8a030', w = new THREE.Group(); w.position.set(s.x, s.y, s.z); w.rotation.y = -s.a + Math.PI / 2;
      const wl = mesh(new THREE.PlaneGeometry(0.07, 0.1), M(col, { side: THREE.DoubleSide }), -0.035, 0, 0.004), wr = mesh(new THREE.PlaneGeometry(0.07, 0.1), M(col, { side: THREE.DoubleSide }), 0.035, 0, 0.004);
      const bd = box(0.012, 0.09, 0.012, M('#2a2018'), 0, 0, 0.006); w.add(wl, wr, bd); wings.add(w); U.wings.push({ g: w, l: wl, r: wr, ph: i * 1.3 }); }
    if (o.broken) setBroken(g, true);
    return g;
  }
  // a worn-out trap: the body sags and leans, the net hangs torn (everything stays on its place so nothing floats)
  function setBroken(g, b) { const t = g.userData.top; t.scale.set(1, b ? 0.72 : 1, 1); t.rotation.z = b ? 0.12 : 0; t.position.y = 0; g.userData.broken = b; }
  // the label above a trap: its name and «сломается в m:ss» (redrawn when the text changes)
  function sprite(l1, l2, col = '#f0f0dc') {
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const x = cv.getContext('2d'), t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter;
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthTest: false, transparent: true })); s.scale.set(2.6, 0.65, 1); s.renderOrder = 9;
    s.userData.set = (a, b, c2, warn) => { const key = a + '|' + b + '|' + warn; if (s.userData.key === key) return; s.userData.key = key; x.clearRect(0, 0, 256, 64); x.fillStyle = 'rgba(16,28,24,0.85)'; x.fillRect(0, 0, 256, 64); x.strokeStyle = warn ? '#e07060' : '#8abaa0'; x.lineWidth = 3; x.strokeRect(1.5, 1.5, 253, 61); x.font = 'bold 21px sans-serif'; x.textAlign = 'center'; x.fillStyle = c2; x.fillText(a.slice(0, 24), 128, 25); x.fillStyle = warn ? '#ff9a80' : '#ffe9a0'; x.fillText(b, 128, 52); t.needsUpdate = true; };
    s.userData.set(l1, l2, col, false); return s;
  }
  const specCol = sp => { const b = SPECIES_BY_ID[sp.base] || sp; const a = b.art; const h = a && ((a.f && a.f[0]) || (a.h && a.h[0])); return typeof h === 'string' && h[0] === '#' ? h : '#e8a030'; };

  // ================================================================== a butterfly flying into a trap: it comes from afar, meanders, finds the way in (a gap under the net ring / over the sill / the doorway of the dome), rises to a spot inside and settles
  const UP = new THREE.Vector3(0, 1, 0);
  // the way in, in the trap's own frame: [outside, inside, higher up inside] for a visitor coming from direction a (radians in the xz plane)
  function doorway(type, a) {
    if (type === 'std') { const d = [Math.cos(a), Math.sin(a)]; return { dir: a, pts: [[d[0] * 1.2, 0.43, d[1] * 1.2], [d[0] * 0.26, 0.43, d[1] * 0.26], [d[0] * 0.05, 0.62, d[1] * 0.05], [0, 0.82, 0]] }; }
    if (type === 'str') { const k = Math.round(a / (Math.PI / 2)), aa = k * Math.PI / 2, d = [Math.round(Math.cos(aa)), Math.round(Math.sin(aa))]; return { dir: aa, pts: [[d[0] * 1.3, 0.48, d[1] * 1.3], [d[0] * 0.3, 0.48, d[1] * 0.3], [0, 0.52, 0], [0, 0.7, 0]] }; }
    if (type === 'scr') return { dir: Math.PI / 2, pts: [[0, 0.5, 1.5], [0, 0.49, 0.78], [0, 0.49, 0.5], [0, 0.48, 0.34]] };       // the skrichushka: straight into the mouth (centred on +z)
    return { dir: Math.PI / 2, pts: [[0, 0.09, 1.3], [0, 0.09, 0.42], [0, 0.14, 0.15], [0, 0.4, 0.04]] };       // the dome: a doorway centred on +z
  }
  class Flier {
    constructor(sys, trap, sp, spotIdx) {
      this.sys = sys; this.trap = trap; this.sp = sp; this.done = false; this.t = Math.random() * 6; const w = sys.world, yaw = trap.yaw;
      const toW = (x, y, z) => new THREE.Vector3(x, y, z).applyAxisAngle(UP, yaw).add(new THREE.Vector3(trap.x, trap.y, trap.z));
      const doorT = trap.type === 'imp' || trap.type === 'scr', a0 = doorT ? Math.PI / 2 + (Math.random() - 0.5) * 1.5 : Math.random() * 6.283;             // the side it comes from (local); the dome only from its door
      const door = doorway(trap.type, doorT ? 0 : a0); const out = toW(...door.pts[0]), inn = toW(...door.pts[1]);
      const away = doorT ? new THREE.Vector3(0, 0, 1).applyAxisAngle(UP, yaw) : new THREE.Vector3(Math.cos(door.dir), 0, Math.sin(door.dir)).applyAxisAngle(UP, yaw);
      const side = new THREE.Vector3(-away.z, 0, away.x), dist = 5 + Math.random() * 3, start = new THREE.Vector3(trap.x, 0, trap.z).addScaledVector(away, dist).addScaledVector(side, (Math.random() - 0.5) * 5); start.y = w.groundAt(start.x, start.z) + 1.1 + Math.random() * 1.1;
      const lat = (Math.random() < 0.5 ? -1 : 1) * (0.8 + Math.random() * 0.8), p1 = start.clone().lerp(out, 0.35).addScaledVector(side, lat); p1.y += 0.35; const p2 = start.clone().lerp(out, 0.72).addScaledVector(side, -lat * 0.6); p2.y = Math.max(out.y + 0.2, p2.y - 0.5);
      const rest = rests(trap.type)[spotIdx % 9], rw = toW(rest.x, rest.y, rest.z), pts = [start, p1, p2, out, inn, toW(...door.pts[2]), toW(...door.pts[3]), rw];
      this.curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal'); this.len = this.curve.getLength(); this.s = 0; this.sOut = pts.slice(0, 4).reduce((a, p, i, A) => a + (i ? p.distanceTo(A[i - 1]) : 0), 0) * 1.04;
      this.g = new THREE.Group(); const col = sp ? specCol(sp) : ['#e8a030', '#6a9ae0', '#f0f0e0', '#d05a5a', '#8ad060'][Math.floor(Math.random() * 5)], wm = M(col, { side: THREE.DoubleSide }), span = sp ? clamp((sp.mm[0] + sp.mm[1]) / 1000, 0.1, 0.17) : 0.12, wg = new THREE.PlaneGeometry(span / 2, span * 0.46).rotateX(-Math.PI / 2);
      this.wl = new THREE.Group(); this.wr = new THREE.Group(); const l = new THREE.Mesh(wg, wm), r = new THREE.Mesh(wg, wm); l.position.x = -span / 4; r.position.x = span / 4; this.wl.add(l); this.wr.add(r);
      const bd = box(0.009, 0.009, 0.05, M('#2a2018'), 0, 0, 0); this.g.add(bd, this.wl, this.wr); this.g.position.copy(start); sys.group.add(this.g); this.pos = start.clone(); this.last = start.clone(); this.log = [];
    }
    update(dt) {
      this.t += dt; const tr = this.trap, v = this.s < this.sOut ? 1.5 : 0.65; this.s = Math.min(this.len, this.s + v * dt); const u = this.s / this.len, p = this.curve.getPointAt(Math.min(0.9999, u));
      const k = this.s < this.sOut ? clamp(1 - this.s / this.sOut) * clamp((this.sOut - this.s) / 1.4) : 0;           // the meandering dies away near the door
      const tan = this.curve.getTangentAt(Math.min(0.9999, u)); const sd = new THREE.Vector3(-tan.z, 0, tan.x).normalize();
      p.addScaledVector(sd, Math.sin(this.t * 4.1) * 0.3 * k); p.y += Math.sin(this.t * 6.3) * 0.14 * k + Math.sin(this.t * 24) * 0.012;
      this.last.copy(this.pos); this.pos.copy(p); this.g.position.copy(p); this.g.lookAt(p.clone().add(tan)); const settle = clamp((1 - u) / 0.04), amp = settle * 0.95, fl = Math.sin(this.t * 44) * amp + (1 - settle) * 0.1;
      this.wl.rotation.z = -fl; this.wr.rotation.z = fl; this.log.push([+p.x.toFixed(2), +p.y.toFixed(2), +p.z.toFixed(2)]); if (this.log.length > 600) this.log.shift();
      if (this.s >= this.len) this.done = true;
    }
    dispose() { this.sys.group.remove(this.g); this.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
  }

  // ================================================================== the traps of a location
  class Sys {
    constructor(play) { this.play = play; this.list = []; this.fliers = []; this.group = new THREE.Group(); play.scene.add(this.group); this.seq = 0; this.cntT = 0; this.near = null; }
    get world() { return this.play.world; }
    own() { return this.list.filter(t => t.mine); }
    mk(spec, mine) {
      const T0 = TYPES[spec.type]; if (!T0) return null; const t = { tid: spec.tid, mine, owner: spec.owner, name: spec.name || '?', type: spec.type, x: spec.x, y: spec.y, z: spec.z, yaw: spec.yaw || 0, t: spec.age || 0, life: T0.life, cap: T0.cap, fl: spec.fl || '', hn: spec.hn || '', items: spec.items || [], n: spec.n || 0, inflight: 0, broken: false, goneT: 0, dirty: true, label: null };
      this.list.push(t); t.col = { x: spec.x, z: spec.z, r: 0.5, trap: t.tid }; this.world.colliders.push(t.col); this.rebuild(t); return t;
    }
    rebuild(t) {
      if (t.group) { this.group.remove(t.group); t.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
      const cols = t.mine ? t.items.slice(0, 9).map(specCol) : Array.from({ length: Math.min(9, t.n) }, (_, i) => ['#e8a030', '#6a9ae0', '#f0f0e0', '#d05a5a', '#8ad060'][i % 5]);
      const g = model(t.type, { fl: t.fl, hn: t.hn, n: t.mine ? t.items.length : t.n, cols, broken: t.broken }); g.position.set(t.x, t.y, t.z); g.rotation.y = t.yaw; this.group.add(g); t.group = g; t.dirty = false;
      if (!t.label) { t.label = sprite(t.mine ? TYPES[t.type].ru : t.name, 'сломается в ' + mmss(t.life - t.t), t.mine ? '#f0e8c0' : '#9ae0b0'); t.label.position.set(t.x, t.y + 2.4, t.z); this.group.add(t.label); }
    }
    net(m) {      // a message from the server about somebody else's trap
      if (m.k === 'put') { if (m.trap && !this.list.some(t => t.tid === m.trap.tid)) this.mk(m.trap, false); }
      else { const t = this.list.find(q => q.tid === m.tid && !q.mine); if (!t) return; if (m.k === 'set') { t.fl = m.fl; t.hn = m.hn; t.dirty = true; } else if (m.k === 'cnt') { t.n = m.n; t.dirty = true; } else if (m.k === 'del') this.drop(t); else if (m.k === 'arr') { if (!t.broken) this.spawn(t, null); } }
    }
    spawn(t, sp) { const idx = (t.mine ? t.items.length : t.n) + t.inflight; t.inflight++; this.fliers.push({ f: new Flier(this, t, sp, idx), t, sp }); }
    // a trap wears out: it vanishes together with everything in it (no catch is credited)
    expire(t) { if (t.type === 'scr' && Math.hypot(t.x - this.play.player.pos.x, t.z - this.play.player.pos.z) < 45) Snd.sfx.scream(); if (t.mine) { this.play.toast(`${TYPES[t.type].ru} сломалась — вместе с ней пропал улов (${t.items.length})`, 5, true); Snd.sfx.deny(); this.send({ k: 'del', tid: t.tid }); } this.drop(t); }
    // the landscape was regenerated: your traps and their catch are gone, nothing is credited
    lose() { const n = this.own().length; for (const t of this.own().slice()) { this.send({ k: 'del', tid: t.tid }); this.drop(t); } this.lost = n; return n; }
    drop(t) { this.list = this.list.filter(q => q !== t); this.fliers = this.fliers.filter(o => { if (o.t === t) { o.f.dispose(); return false; } return true; }); if (t.group) { this.group.remove(t.group); t.group.traverse(o => { if (o.geometry) o.geometry.dispose(); }); } if (t.label) this.group.remove(t.label); const w = this.world, ci = w.colliders.indexOf(t.col); if (ci >= 0) w.colliders.splice(ci, 1); if (this.near === t) this.near = null; }
    send(o) { if (Net.on && this.play.mp) Net.send('trap', o); }
    // G: put a trap of the chosen type in front of the player
    spot() { const P = this.play.player, w = this.world, fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), x = P.pos.x + fx * 1.7, z = P.pos.z + fz * 1.7; if ((w.canWalk && !w.canWalk(x, z)) || (w.inWater && w.inWater(x, z, 0.6))) return null; if (w.slopeAt && w.slopeAt(x, z) > 0.55) return null;
      for (const c of w.colliders) if (Math.hypot(c.x - x, c.z - z) < c.r + 0.8) return null; if (Math.hypot(x, z) > w.R - 1.5) return null; return { x, z, y: w.groundAt(x, z), yaw: P.yaw + Math.PI }; }
    place(type) {
      const P = this.play; if (!TYPES[type] || count('tr', type) < 1) return false; { const why = allowed(type, P.biome.id); if (why) { P.toast(why, 3.5); Snd.sfx.deny(); return false; } }
      const s = this.spot(); if (!s) { P.toast('Здесь ловушку не поставить: нужна ровная свободная земля', 3); Snd.sfx.deny(); return false; }
      add('tr', type, -1); const tid = (Net.on && P.mp ? Net.id : 'L') + '-' + Date.now().toString(36) + (++this.seq);
      const t = this.mk({ tid, owner: Net.on ? Net.id : 0, name: Net.name || 'Вы', type, x: s.x, y: s.y, z: s.z, yaw: s.yaw, age: 0 }, true); this.send({ k: 'put', tid, type, x: +s.x.toFixed(2), y: +s.y.toFixed(2), z: +s.z.toFixed(2), yaw: +s.yaw.toFixed(2) });
      P.toast(`${TYPES[type].ru} поставлена: положите приманку (E)`, 4, true); Snd.sfx.coin(); return t;
    }
    nearest() { const P = this.play.player, fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); let best = null, bd = 1e9; for (const t of this.list) { const dx = t.x - P.pos.x, dz = t.z - P.pos.z, d = Math.hypot(dx, dz); if (d < 2.6 && (d < 1.5 || (dx * fx + dz * fz) / (d || 1) > 0.2) && d < bd) { best = t; bd = d; } } return best; }
    label(t) { return t.mine ? `E — ловушка: ${TYPES[t.type].ru.toLowerCase()} (${t.broken ? 'сломана' : mmss(t.life - t.t)}, бабочек: ${t.items.length})` : `Ловушка игрока ${t.name} · бабочек внутри: ${t.n}`; }
    update(dt) {
      this.flyAll(dt); this.near = this.play.entering ? null : this.nearest(); const tt = this.play.t;
      for (const t of this.list.slice()) {
        t.t += dt; if (t.label) { const left = Math.max(0, t.life - t.t); t.label.userData.set(t.mine ? TYPES[t.type].ru : t.name, 'сломается в ' + mmss(left), t.mine ? '#f0e8c0' : '#9ae0b0', left < 20); }
        if (t.t >= t.life) { this.expire(t); continue; }
        if (t.mine && !t.broken && t.items.length + t.inflight < t.cap) {                 // a butterfly sets off towards the trap (it is in the trap only when it has flown in)
          const r = rate(t.fl, t.hn); if (r > 0 && Math.random() < r / 60 * dt) { const sp = pick(this.play.pool, t.hn, t.type); if (sp) { this.spawn(t, sp); this.send({ k: 'arr', tid: t.tid }); } }
        }
        if (t.dirty) { this.rebuild(t); setBroken(t.group, t.broken); }
        const U = t.group && t.group.userData;
        if (U && U.jaw) {       // the skrichushka's mouth opens when a butterfly is about to come in, and shuts (with a snap) after it
          const fo = this.fliers.find(o => o.t === t); if (fo && fo.f.s > fo.f.sOut * 0.55) t.hold = 0.7; t.hold = Math.max(0, (t.hold || 0) - dt); t.open = damp(t.open || 0, t.hold > 0 ? 1 : 0, 9, dt);
          if (t.open > 0.6) t.wasOpen = true; if (t.wasOpen && t.open < 0.3) { t.wasOpen = false; if (Math.hypot(t.x - this.play.player.pos.x, t.z - this.play.player.pos.z) < 30) Snd.sfx.chomp(); }
          U.jaw.rotation.x = 0.7 * t.open;
        }
        if (U && U.wings) for (const w of U.wings) { const f = Math.sin(tt * 3 + w.ph) * 0.5 + 0.5, open = (Math.sin(tt * 0.7 + w.ph * 3) > 0.7) ? f : 0.15; w.l.rotation.y = -open * 0.9; w.r.rotation.y = open * 0.9; }
        if (U && !t.broken) U.top.rotation.z = Math.sin(tt * 0.9 + t.x) * 0.012;
      }
    }
    flyAll(dt) {
      for (const o of this.fliers.slice()) { o.f.update(dt); if (o.f.done) { const t = o.t; o.f.dispose(); this.fliers = this.fliers.filter(q => q !== o); t.inflight = Math.max(0, t.inflight - 1); t.hold = Math.max(t.hold || 0, 0.5);
        if (t.mine && !t.broken && o.sp) { t.items.push(o.sp.id); t.dirty = true; this.send({ k: 'cnt', tid: t.tid, n: t.items.length }); } } }
    }
    bait(t, fl, hn) {      // put bait in: a slot is filled once and for all (nothing can be taken back out)
      if (!t.mine) return false; let ch = false;
      if (fl && !t.fl && FL[fl] && accepts(t.type, 'fl', fl) && count('fl', fl) >= 1) { add('fl', fl, -1); t.fl = fl; ch = true; }
      if (hn && !t.hn && HN[hn] && accepts(t.type, 'hn', hn) && count('hn', hn) >= 1) { add('hn', hn, -1); t.hn = hn; ch = true; }
      if (ch) { t.dirty = true; this.send({ k: 'set', tid: t.tid, fl: t.fl, hn: t.hn }); Snd.sfx.coin(); } return ch;
    }
    // take the butterflies out of an own trap (the new ones go to the cabinet as raw specimens)
    take(t, quiet) {
      if (!t.mine || !t.items.length) return 0; const P = this.play, ids = t.items.splice(0); let fresh = 0; for (const id of ids) { if (!Save.has((SPECIES_BY_ID[id].base) || id)) fresh++; Save.add(id, P.biome.id); P.caughtHere.add(id); }
      if (ids.some(id => SPECIES_BY_ID[id].mystery) && typeof revealOcean === 'function' && revealOcean()) P.toast('Все бабочки океана пойманы — тайна раскрыта!', 5, true);
      t.dirty = true; this.send({ k: 'cnt', tid: t.tid, n: 0 }); Wings.announce(Wings.check(), (s, d, imp) => P.toast(s, d, imp));
      if (!quiet) { P.toast(`Из ловушки взято бабочек: ${ids.length}` + (fresh ? ` · новых видов: ${fresh}` : ''), 4, true); Snd.sfx.reward(); }
      return ids.length;
    }
    // (not used any more: leaving the location, like a worn-out trap or a new landscape, takes the traps away with their catch)
    collectAll() { for (const t of this.own().slice()) { this.take(t, true); this.send({ k: 'del', tid: t.tid }); this.drop(t); } }
    dispose() { this.lose(); for (const o of this.fliers) o.f.dispose(); this.fliers = []; this.play.scene.remove(this.group); }
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
        this.r = { close(g, t, h = 0.3, cy = 0.14, el = 0.5) { const old = g.parent; sc.add(g); g.rotation.y = t || 0; const c2 = new THREE.OrthographicCamera(-h * 0.5, h * 0.5, h * 0.75, -h * 0.75, 0.05, 20); c2.position.set(1.4, cy + el, 1.4); c2.lookAt(0, cy, 0); ren.render(sc, c2); sc.remove(g); if (old) old.add(g); return ren.domElement; }, draw(g, t) { const old = g.parent, pos = g.position.clone(), rot = g.rotation.y; sc.add(g); g.position.set(0, 0, 0); g.rotation.y = rot + (t || 0); const bb = new THREE.Box3().setFromObject(g), hh = Math.max(bb.max.y, 0.5), wd = Math.max(bb.max.x, -bb.min.x, bb.max.z, -bb.min.z) * 1.08, half = Math.max(hh / 2 + 0.08, wd / 0.667); cam.top = half; cam.bottom = -half; cam.left = -half * 0.667; cam.right = half * 0.667; cam.updateProjectionMatrix(); cam.position.set(2.6 + wd, hh / 2 + 0.55 + wd * 0.2, 2.6 + wd); cam.lookAt(0, hh / 2, 0); ren.render(sc, cam); sc.remove(g); g.position.copy(pos); g.rotation.y = rot; if (old) old.add(g); return ren.domElement; } };
      } catch (e) { this.r = null; }
      return this.r;
    },
  };
  const UI = {
    mode: null, t: null, sel: 0, msg: '', msgT: 0, scroll: 0, btns: [],
    openPlace(play) { this.mode = 'place'; this.play = play; this.sel = Math.max(0, Object.keys(TYPES).findIndex(id => count('tr', id) > 0)); this.msg = ''; this.msgT = 0; },
    openTrap(play, t) { this.mode = t.mine ? 'manage' : 'view'; this.play = play; this.t = t; this.pf = ''; this.ph = ''; this.msg = ''; this.msgT = 0; this.scroll = 0; },
    say(m) { this.msg = m; this.msgT = 3.5; },
    // the candidate shown in a slider (it is not in the trap yet): always one of the items in stock; the arrows go round in both directions
    cand(kind) { const list = owned(kind).filter(x => !this.t || accepts(this.t.type, kind, x.id)), key = kind === 'fl' ? 'pf' : 'ph'; if (!list.length) return null; if (!list.some(x => x.id === this[key])) this[key] = list[0].id; return (kind === 'fl' ? FL : HN)[this[key]]; },
    step(kind, d) { const list = owned(kind).filter(x => !this.t || accepts(this.t.type, kind, x.id)), key = kind === 'fl' ? 'pf' : 'ph', n = list.length; if (!n) return false; const cur = list.findIndex(x => x.id === this[key]); this[key] = list[cur < 0 ? (d > 0 ? 0 : n - 1) : (cur + d + n) % n].id; Snd.sfx.click(); return true; },
    cyc(list, cur, d) { const ids = [''].concat(list.map(x => x.id)); const i = ids.indexOf(cur || ''); return ids[(i + d + ids.length) % ids.length]; },
    layout() {
      const b = [{ id: 'close', label: 'Закрыть ✕', x: SW - 82, y: 4, w: 74, h: 15 }];
      if (this.mode === 'place') Object.values(TYPES).forEach((T0, i) => b.push({ id: 'type' + i, tid: T0.id, x: 40, y: 50 + i * 48, w: 400, h: 44 }));
      else if (this.mode === 'manage') {
        const t = this.t;
        if (!t.fl && !TYPES[t.type].baitOnly) b.push({ id: 'flp', label: '<', x: 124, y: 94, w: 16, h: 14 }, { id: 'fln', label: '>', x: 142, y: 94, w: 16, h: 14 }, { id: 'flput', label: 'Положить', x: 162, y: 94, w: 78, h: 14, disabled: !this.cand('fl') });
        if (!t.hn) b.push({ id: 'hnp', label: '<', x: 124, y: 134, w: 16, h: 14 }, { id: 'hnn', label: '>', x: 142, y: 134, w: 16, h: 14 }, { id: 'hnput', label: 'Положить', x: 162, y: 134, w: 78, h: 14, disabled: !this.cand('hn') });
        b.push({ id: 'take', label: t.items.length ? `Забрать улов (${t.items.length})` : 'Улова нет', x: 12, y: 232, w: 150, h: 18, disabled: !t.items.length });
      }
      if (this.t && this.mode !== 'place' && this.play && !this.play.traps.list.includes(this.t)) b.length = 1;      // the trap is gone (it wore out): only the way out
      this.btns = b; return b;
    },
    click(x, y) {
      const bs = this.layout(), b = bs.find(q => !q.disabled && UIK.hit(q, x, y)); if (!b) return null; const P = this.play, S = P.traps;
      if (b.id === 'close') return 'close';
      if (b.tid) { if (count('tr', b.tid) < 1) { this.say('У вас нет такой ловушки: купите её у торговца ловушками на рынке'); Snd.sfx.deny(); return null; } return S.place(b.tid) ? 'close' : null; }
      const t = this.t; if (!t || !S.list.includes(t)) return 'close';
      if (b.id === 'flp' || b.id === 'fln') { if (!this.step('fl', b.id === 'fln' ? 1 : -1)) this.say('Нет цветов в запасе: их продаёт цветочница'); }
      else if (b.id === 'hnp' || b.id === 'hnn') { if (!this.step('hn', b.id === 'hnn' ? 1 : -1)) this.say('Нет мёда в запасе: его продаёт медовщик'); }
      else if (b.id === 'flput') { const c = this.cand('fl'); if (c && S.bait(t, c.id, undefined)) this.say('Цветы положены — достать их обратно нельзя'); else Snd.sfx.deny(); }
      else if (b.id === 'hnput') { const c = this.cand('hn'); if (c && S.bait(t, undefined, c.id)) this.say('Положено — достать обратно нельзя'); else Snd.sfx.deny(); }
      else if (b.id === 'take') { S.take(t); if (!S.list.includes(t)) return 'close'; }
      return null;
    },
    draw(ctx, t, m, dt) {
      this.msgT = Math.max(0, this.msgT - dt); const cl = UIK.col, bs = this.layout(), P = this.play, S = P.traps; const hv = b => UIK.hit(b, m.x, m.y);
      ctx.fillStyle = 'rgba(4,12,10,0.78)'; ctx.fillRect(0, 0, SW, SH);
      if (this.mode !== 'place' && this.t && !S.list.includes(this.t)) { UIK.panel(ctx, 90, 90, 300, 80, { fill: 'rgba(16,32,28,0.97)', border: '#e07060' }); T.draw(ctx, 'Ловушка сломалась', SW / 2, 104, { size: 10, align: 'c', color: '#e07060' }); T.para(ctx, 'Она исчезла вместе со всем, что в ней было.', 104, 126, 272, { size: 8, color: cl.text, lh: 10 }); UIK.btn(ctx, bs[0], hv(bs[0])); return; }
      if (this.mode === 'place') {
        UIK.panel(ctx, 20, 14, 440, 242, { fill: 'rgba(16,32,28,0.97)', border: cl.gold }); T.draw(ctx, 'Поставить ловушку', SW / 2, 22, { size: 12, align: 'c', color: cl.gold }); T.draw(ctx, 'Она встанет перед вами.', SW / 2, 40, { size: 8, align: 'c', color: cl.dim });
        bs.filter(b => b.tid).forEach(b => { const T0 = TYPES[b.tid], n = count('tr', b.tid), why = allowed(b.tid, P.biome.id), h = hv(b) && !why; UIK.panel(ctx, b.x, b.y, b.w, b.h, { fill: n && !why ? (h ? '#2a5a46' : '#1a3228') : '#1a2420', border: n && !why ? cl.gold : cl.line, shadow: false });
          T.draw(ctx, T0.ru, b.x + 8, b.y + 5, { size: 8, color: n ? '#fff' : cl.dim }); T.draw(ctx, `служит ${mmss(T0.life)} · вмещает ${T0.cap}` + (T0.ab ? ' · 1% аберрантов' : ''), b.x + 8, b.y + 17, { size: 8, color: cl.dim }); T.para(ctx, T0.desc, b.x + 8, b.y + 27, 380, { size: 8, color: '#8aa898', lh: 8 }); T.draw(ctx, why ? (T0.id === 'scr' ? 'только в океане' : 'не в океане') : n ? `есть: ${n}` : 'нет в запасе', b.x + b.w - 8, b.y + 5, { size: 8, align: 'r', color: why ? '#c8a060' : n ? '#9af0a0' : '#c87060' }); });
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
          const only = !!TYPES[tr.type].baitOnly, cf = !tr.fl && !only && this.cand('fl'), ch = !tr.hn && this.cand('hn'), sc = x => (x.scent ? `запах: ${SCENT[x.scent]}` : `${x.tag || QUAL[x.q]}`);
          T.draw(ctx, 'Цветы — зовут бабочек', 124, 70, { size: 8, color: cl.dim });
          T.draw(ctx, only ? 'Цветы не принимает: ей нужна только колба феромонов' : f ? `${f.ru} (запах: ${SCENT[f.scent]})` : cf ? `${cf.ru} (${sc(cf)})` : 'нет цветов в запасе — их продаёт цветочница', 124, 82, { size: 8, color: only ? cl.dim : f ? '#9af0a0' : cf ? '#f0e8d0' : '#c87060' });
          T.draw(ctx, only ? 'Феромоны — единственная приманка' : 'Мёд — приманивает редких', 124, 110, { size: 8, color: cl.dim });
          T.draw(ctx, h ? `${h.ru} (${h.tag || QUAL[h.q]})` : ch ? `${ch.ru} (${sc(ch)})` : (only ? 'нет колбы феромонов — их продаёт торговец в капюшоне' : 'нет мёда в запасе — его продаёт медовщик'), 124, 122, { size: 8, color: h ? '#9af0a0' : ch ? '#f0e8d0' : '#c87060' });
          for (const id of ['flp', 'fln', 'flput', 'hnp', 'hnn', 'hnput']) { const b = bs.find(q => q.id === id); if (b) UIK.btn(ctx, b, !b.disabled && hv(b)); }
          if (f) T.draw(ctx, 'Положено — достать обратно нельзя', 124, 97, { size: 8, color: '#e0a070' }); else T.draw(ctx, cf ? `в запасе: ${count('fl', cf.id)} (видов: ${owned('fl').length})` : '', 246, 97, { size: 8, color: cl.dim });
          if (h) T.draw(ctx, 'Положено — достать обратно нельзя', 124, 137, { size: 8, color: '#e0a070' }); else T.draw(ctx, ch ? `в запасе: ${count('hn', ch.id)} (видов: ${owned('hn').length})` : '', 246, 137, { size: 8, color: cl.dim });
          T.draw(ctx, tr.broken ? 'Ловушка сломана: новые бабочки не прилетят' : rr > 0 ? `Прилёт: около ${rr.toFixed(1)} бабочек в минуту` : 'Положите цветы или мёд — иначе ловушка пуста', 124, 160, { size: 8, color: !tr.broken && rr > 0 ? '#9af0a0' : '#e07060' });
          T.draw(ctx, h ? `Редкие виды: до ×${rarK(tr.hn, 3).toFixed(1)} чаще` : 'Редкие виды: обычный шанс', 124, 172, { size: 8, color: h ? '#e0c0ff' : cl.dim });
          { const abp = TYPES[tr.type].ab + ((h && h.ab) || 0); if (abp > 0) T.draw(ctx, `Аберранты: ${+(abp * 100).toFixed(1)}% (ловушка ${+(TYPES[tr.type].ab * 100).toFixed(1)}%${h && h.ab ? ` + приманка ${Math.round(h.ab * 100)}%` : ''})`, 124, 184, { size: 8, color: '#ff9ae8' }); }
          // the catch
          T.draw(ctx, 'Улов', 14, 196, { size: 8, color: cl.dim }); const sp = {}; for (const id of tr.items) sp[id] = (sp[id] || 0) + 1; const ids = Object.keys(sp);
          ids.slice(0, 12).forEach((id, i) => { const x = 14 + (i % 12) * 38, y = 207, S0 = SPECIES_BY_ID[id]; ctx.fillStyle = '#c8a870'; ctx.fillRect(x, y, 36, 20); ctx.imageSmoothingEnabled = false; ctx.drawImage(Art.specimen(S0), x + 1, y + 1, 34, 18); if (sp[id] > 1) T.draw(ctx, '×' + sp[id], x + 35, y + 12, { size: 8, align: 'r', color: '#fff', shadow: '#000' }); if (S0.ab) T.draw(ctx, 'аб.', x + 2, y + 2, { size: 8, color: '#ff9ae8', shadow: '#000' }); });
          if (!ids.length) T.draw(ctx, tr.broken ? 'В ловушке никого нет.' : 'Пока никто не прилетел.', 14, 212, { size: 8, color: cl.dim });
          bs.filter(b => b.id === 'take').forEach(b => UIK.btn(ctx, b, !b.disabled && hv(b))); T.draw(ctx, 'Уйдёте с локации, не забрав улов, — он пропадёт', 172, 238, { size: 8, color: '#e0a070' });
        } else {
          T.draw(ctx, 'Чужая ловушка: открыть её и забрать бабочек может только владелец.', 124, 80, { size: 8, color: cl.text }); const f = FL[tr.fl], h = HN[tr.hn]; T.draw(ctx, `Цветы: ${f ? f.ru : 'нет'}`, 124, 100, { size: 8, color: cl.dim }); T.draw(ctx, `Мёд: ${h ? h.ru : 'нет'}`, 124, 112, { size: 8, color: cl.dim });
        }
        if (this.msgT > 0) T.draw(ctx, this.msg, 300, 222, { size: 8, align: 'c', color: '#ffe070' });
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
  // a close-up picture (a canvas of 100 x 150) of a flower bunch or a honey piece lying on a dish: for the shops
  const closeCache = {};
  function closeup(kind, id, t = 0.6) {
    const R = Thumb.get(); if (!R) return null; const key = kind + id; let cv = closeCache[key];
    if (!cv) { const g = new THREE.Group(); if (kind === 'fl') { g.add(cyl(0.14, 0.14, 0.02, M('#6a4a2c'), 0, -0.01, 0, 14)); flowerBunch(g, 0, FL[id], 0.14, 0); } else { g.add(cyl(0.14, 0.14, 0.02, M('#6a4a2c'), 0, -0.01, 0, 14)); honeyOrPhero(g, 0, HN[id], 0); }
      const cam = kind === 'fl' ? [0.37, 0.165, 0.5] : id === 'pheromone' ? [0.26, 0.09, 0.7] : [0.3, 0.03, 1.1]; R.close(g, t, cam[0], cam[1], cam[2]); cv = document.createElement('canvas'); cv.width = 100; cv.height = 150; cv.getContext('2d').drawImage(R.close(g, t, cam[0], cam[1], cam[2]), 0, 0); closeCache[key] = cv; g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); }
    return cv;
  }
  return { allowed, accepts, closeup, drawFlower, drawJar, TYPES, FLOWERS, HONEYS, FL, HN, KINDS, SCENT, QUAL, inv, count, add, owned, buy, rate, quality, rarK, lure, pick, model, setBroken, rests, Sys, UI, mmss };
})();
