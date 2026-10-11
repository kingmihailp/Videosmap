// ---------------------------------------------------------------- spreading boards: nine kinds (1 .. 50 butterflies), a personal choice of every player.
// A board takes several butterflies at once: the player picks them in «Что расправим?», spreads only the first one, and all the others come out with exactly the same result.
// The mechanical board (50) also has a 10 % chance to add 5 % to the result of the whole batch. Bought from the collection trader, swapped at the spreading desk.
const Spreaders = (() => {
  const TYPES = [
    { id: 'basic', ru: 'Обычная расправилка', cap: 1, price: 0, cols: 1, pal: { base: '#6a4a28', slat: '#c29a5c', groove: '#3a2814', trim: null }, desc: 'Простая доска с одной канавкой — на одну бабочку.' },
    { id: 's3', ru: 'Удлинённая расправилка', cap: 3, price: 3000, cols: 1, pal: { base: '#6a4a28', slat: '#d0a868', groove: '#3a2814', trim: '#c8a040' }, desc: 'Три канавки в ряд. Три бабочки за один раз.' },
    { id: 's6', ru: 'Сильно удлинённая расправилка', cap: 6, price: 4200, cols: 1, pal: { base: '#5a3a20', slat: '#b88848', groove: '#2e2010', trim: '#c8a040' }, desc: 'Длинная доска из ореха на шесть бабочек.' },
    { id: 's10', ru: 'Невероятно удлинённая расправилка', cap: 10, price: 5800, cols: 2, pal: { base: '#5a2a1c', slat: '#a86a3c', groove: '#2a1408', trim: '#d0a848' }, desc: 'Две дорожки красного дерева, десять бабочек.' },
    { id: 's16', ru: 'Огромная расправилка', cap: 16, price: 8000, cols: 2, pal: { base: '#6a5a3a', slat: '#e0c88c', groove: '#3a3018', trim: '#8a6a2a' }, desc: 'Светлый клён с тёмной инкрустацией, шестнадцать бабочек.' },
    { id: 's26', ru: 'Гигантская расправилка', cap: 26, price: 11000, cols: 3, pal: { base: '#241812', slat: '#e8dcc0', groove: '#14100c', trim: '#d8b048' }, desc: 'Эбеновая рама, планки из слоновой кости, двадцать шесть бабочек.' },
    { id: 's33', ru: 'Невероятно огромная расправилка', cap: 33, price: 14500, cols: 3, pal: { base: '#4a1c24', slat: '#c88a6a', groove: '#240a10', trim: '#e8c050' }, desc: 'Палисандр с золотой отделкой на тридцать три бабочки.' },
    { id: 's40', ru: 'Невероятно гигантская расправилка', cap: 40, price: 18500, cols: 4, pal: { base: '#e4dccb', slat: '#f4eedc', groove: '#9a9078', trim: '#e0b840', gem: '#3a78d8' }, desc: 'Ослепительная белая доска с золотом и сапфирами, сорок бабочек.' },
    { id: 's50', ru: 'Механическая расправилка', cap: 50, price: 24000, cols: 5, mech: { chance: 0.1, bonus: 5 }, pal: { base: '#7a8696', slat: '#c8ccd2', groove: '#3a4250', trim: '#c88a40', gem: '#d83a2a' }, desc: 'Латунные шестерни и пружины: пятьдесят бабочек, и с шансом 10 % результат всей партии растёт на 5 %.' },
  ];
  const BY = Object.fromEntries(TYPES.map(t => [t.id, t]));
  const st = () => Save.data.spr || (Save.data.spr = { own: {}, eq: 'basic' });
  const owned = id => id === 'basic' || !!st().own[id];
  const equippedId = () => (owned(st().eq) && BY[st().eq]) ? st().eq : 'basic';
  const equipped = () => BY[equippedId()];
  const ownedList = () => TYPES.filter(t => owned(t.id));
  const buy = id => { const t = BY[id]; if (!t || owned(id) || (Save.data.coins || 0) < t.price) return 0; Save.data.coins -= t.price; st().own[id] = true; Save.write(); return t.price; };
  const equip = id => { if (!owned(id)) return false; st().eq = id; Save.write(); return true; };
  const cycle = d => { const L = ownedList(), i = L.findIndex(t => t.id === equippedId()); const n = L[(i + d + L.length) % L.length]; equip(n.id); return n; };
  // layout of the slots on the board (columns across, rows along the groove)
  const UW = 0.19, UL = 0.12, rowsOf = t => Math.ceil(t.cap / t.cols);
  const sizeOf = t => t.cap === 1 ? { w: 0.46, l: 0.62 } : { w: t.cols * UW + 0.06, l: rowsOf(t) * UL + 0.07 };

  // ---------------------------------------------------------------- the 3D model (origin at the middle of the board, the top of the board at y ~ 0.05, the grooves run along z)
  const matC = {}; const lam = (c, o) => { const k = c + (o ? JSON.stringify(o) : ''); return matC[k] || (matC[k] = Object.assign(new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {})), { userData: { keep: true } })); };
  function model(id) {
    const T = BY[id] || BY.basic, P = T.pal, g = new THREE.Group(), S = sizeOf(T), box = (w, h, d, x, y, z, mat) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); g.add(m); return m; };
    const single = T.cap === 1, uw = single ? 0.46 : UW, ul = single ? 0.62 : UL, rows = rowsOf(T), baseM = lam(P.base), slatM = lam(P.slat), grM = lam(P.groove), trim = P.trim ? lam(P.trim, { emissive: '#080602' }) : null;
    // the base plate and a raised rim round it
    box(S.w, 0.02, S.l, 0, 0.01, 0, baseM);
    const rim = (w, d, x, z) => box(w, 0.045, d, x, 0.0425, z, trim && !single ? lam(P.base) : baseM);
    rim(S.w, 0.016, 0, -S.l / 2 + 0.008); rim(S.w, 0.016, 0, S.l / 2 - 0.008); rim(0.016, S.l - 0.032, -S.w / 2 + 0.008, 0); rim(0.016, S.l - 0.032, S.w / 2 - 0.008, 0);
    if (trim) { for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.034, 0.05, 0.034, sx * (S.w / 2 - 0.012), 0.045, sz * (S.l / 2 - 0.012), trim); box(S.w - 0.04, 0.008, 0.012, 0, 0.066, S.l / 2 - 0.008, trim); box(S.w - 0.04, 0.008, 0.012, 0, 0.066, -S.l / 2 + 0.008, trim); }
    // the slats: two per slot with a groove between them (instanced)
    const slotsX = []; for (let c = 0; c < T.cols; c++) slotsX.push((c - (T.cols - 1) / 2) * uw);
    const N = T.cap, slatG = new THREE.BoxGeometry(uw * 0.4, 0.028, ul * 0.94), grG = new THREE.BoxGeometry(uw * 0.14, 0.012, ul * 0.94), pinG = new THREE.CylinderGeometry(0.004, 0.004, 0.034, 5), headG = new THREE.SphereGeometry(0.008, 6, 5);
    const sl = new THREE.InstancedMesh(slatG, slatM, N * 2), gr = new THREE.InstancedMesh(grG, grM, N), pn = new THREE.InstancedMesh(pinG, lam('#d8dce4'), N * 2), ph = new THREE.InstancedMesh(headG, lam(P.gem || '#e8ecf4'), N * 2), m4 = new THREE.Matrix4();
    for (let i = 0; i < N; i++) {
      const c = i % T.cols, r = Math.floor(i / T.cols), x = slotsX[c], z = (r - (rows - 1) / 2) * ul;
      m4.makeTranslation(x - uw * 0.27, 0.034, z); sl.setMatrixAt(i * 2, m4); m4.makeTranslation(x + uw * 0.27, 0.034, z); sl.setMatrixAt(i * 2 + 1, m4); m4.makeTranslation(x, 0.026, z); gr.setMatrixAt(i, m4);
      for (const sx of [-1, 1]) { const px = x + sx * uw * 0.4, pz = z - ul * 0.38; m4.makeTranslation(px, 0.053, pz); pn.setMatrixAt(i * 2 + (sx > 0 ? 1 : 0), m4); m4.makeTranslation(px, 0.072, pz); ph.setMatrixAt(i * 2 + (sx > 0 ? 1 : 0), m4); }
    }
    g.add(sl, gr, pn, ph);
    // a brass name plate on the front edge; bigger boards also have a numbered brass tab on every row of five
    if (!single) box(Math.min(0.2, S.w - 0.08), 0.012, 0.03, 0, 0.026, S.l / 2 + 0.004, lam(P.trim || '#c8a040', { emissive: '#080602' }));
    // the top tiers: jewels in the corners (s40) ; the mechanical one: a steel frame, cogs, a crank, springs and a red lamp
    if (P.gem && T.id === 's40') for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const j = new THREE.Mesh(new THREE.OctahedronGeometry(0.018), lam(P.gem, { emissive: '#103060' })); j.position.set(sx * (S.w / 2 - 0.012), 0.092, sz * (S.l / 2 - 0.012)); g.add(j); }
    if (T.mech) {
      g.userData.cogs = []; const brass = lam('#c8a040', { emissive: '#080602' }), steel = lam('#9aa4b2'), dark = lam('#3a4250'), copper = lam('#b86a3a');
      const cog = (r, teeth, x, y, z, dir) => { const holder = new THREE.Group(), spin = new THREE.Group(); holder.position.set(x, y, z); holder.rotation.z = Math.PI / 2; holder.add(spin); spin.add(new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.014, 14), brass), new THREE.Mesh(new THREE.CylinderGeometry(r * 0.28, r * 0.28, 0.02, 8), dark)); for (let i = 0; i < teeth; i++) { const a = i / teeth * Math.PI * 2, t = new THREE.Mesh(new THREE.BoxGeometry(r * 0.28, 0.014, r * 0.2), brass); t.position.set(Math.cos(a) * (r + r * 0.1), 0, Math.sin(a) * (r + r * 0.1)); t.rotation.y = -a; spin.add(t); } g.add(holder); g.userData.cogs.push({ spin, dir }); };
      for (const sx of [-1, 1]) {
        const x = sx * (S.w / 2 + 0.03); box(0.02, 0.1, S.l * 0.9, x, 0.07, 0, steel); box(0.03, 0.02, S.l * 0.9, x, 0.125, 0, brass);
        for (let k = 0; k < 4; k++) { const z = (k - 1.5) * S.l * 0.22; cog(0.04 + (k % 2) * 0.016, 9 + (k % 2) * 2, x + sx * 0.016, 0.08, z, sx * (k % 2 ? 1 : -1)); box(0.012, 0.012, 0.012, x + sx * 0.016, 0.08, z, dark); }
        for (let k = 0; k < 6; k++) { const z = (k - 2.5) * S.l * 0.16, sp = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.003, 5, 10), copper); sp.position.set(x, 0.145, z); sp.rotation.y = Math.PI / 2; g.add(sp); }
      }
      const cr = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8), steel); cr.rotation.z = Math.PI / 2; cr.position.set(0, 0.07, -S.l / 2 - 0.045); g.add(cr);
      const hd = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.06, 8), dark); hd.position.set(S.w / 2 * 0.2 + 0.07, 0.07, -S.l / 2 - 0.045); hd.rotation.x = Math.PI / 2; g.add(hd);
      box(0.1, 0.05, 0.06, -S.w / 2 - 0.03 + 0.06, 0.04, -S.l / 2 - 0.05, steel); box(0.1, 0.05, 0.06, S.w / 2 + 0.03 - 0.06, 0.04, -S.l / 2 - 0.05, steel);
      const lamp = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), lam(P.gem, { emissive: '#8a1008' })); lamp.position.set(0, 0.11, S.l / 2 + 0.01); g.add(lamp); box(0.05, 0.02, 0.03, 0, 0.085, S.l / 2 + 0.01, dark);
      for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const pp = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.1, 6), copper); pp.position.set(sx * (S.w / 2 + 0.03), 0.14, sz * S.l * 0.46); g.add(pp); }
    }
    g.userData.size = S; g.userData.id = T.id; return g;
  }
  const picCache = {};
  // a picture of the board for 2D windows (the shop, the stash, the spreading table)
  function pic(id, w = 120, h = 80) { const k = id + w; if (picCache[k] !== undefined) return picCache[k]; return (picCache[k] = Art.snapshot(model(id), w, h, 0.7, 0.62)); }
  // draws the picture (or a plain fallback if WebGL is not available)
  function icon(ctx, id, x, y, w, h) { const p = pic(id, 120, 80); if (p) { const k = Math.min(w / p.width, h / p.height), dw = Math.round(p.width * k), dh = Math.round(p.height * k); ctx.imageSmoothingEnabled = true; ctx.drawImage(p, Math.round(x + (w - dw) / 2), Math.round(y + (h - dh) / 2), dw, dh); ctx.imageSmoothingEnabled = false; return; } ctx.fillStyle = BY[id].pal.base; ctx.fillRect(x + 2, y + h / 2 - 4, w - 4, 8); ctx.fillStyle = BY[id].pal.slat; ctx.fillRect(x + 4, y + h / 2 - 2, w - 8, 4); }
  const slotAt = (id, i) => { const T = BY[id], rows = rowsOf(T), c = i % T.cols, r = Math.floor(i / T.cols), uw = T.cap === 1 ? 0.46 : UW, ul = T.cap === 1 ? 0.62 : UL; return { x: (c - (T.cols - 1) / 2) * uw, z: (r - (rows - 1) / 2) * ul, uw, ul }; };
  return { slotAt, TYPES, BY, owned, ownedList, equipped, equippedId, buy, equip, cycle, model, pic, icon, sizeOf };
})();
