// ---------------------------------------------------------------- display boxes: rendering, workbench UI, placement UI
const Boxes = (() => {
  const c = UIK.col;
  const CW = 104, CH = 80, FR = 8;
  const DIM = { S: { c: 1, r: 1 }, M: { c: 2, r: 2 }, L: { c: 3, r: 3 } };
  const SIZE_NAME = { S: 'Малая', M: 'Средняя', L: 'Большая' };
  const PRICE = { S: 200, M: 300, L: 400 };            // what the collection trader asks for an empty box
  const UNITS = { S: 1, M: 2, L: 4 };
  const STYLES = [
    { name: 'Орех', fr: ['#3a2210', '#5a3820', '#7e5232'], bg: '#d8cfb0', lab: '#efe6c8', ink: '#3a2008', kind: 'linen' },
    { name: 'Дуб', fr: ['#7a5a30', '#a47c48', '#caa468'], bg: '#b8935c', lab: '#f4ecd0', ink: '#3a2008', kind: 'cork' },
    { name: 'Чёрный лак', fr: ['#0c0c12', '#1c1c26', '#3a3a4a'], bg: '#27382e', lab: '#e4dcc0', ink: '#2a1a08', kind: 'felt', brass: true },
  ];
  const cache = new Map();

  function pxSize(size) { const d = DIM[size]; return { w: d.c * CW + FR * 2, h: d.r * CH + FR * 2 }; }
  function sig(box) { return box.size + box.style + '|' + box.items.map(u => { const s = Save.spec(u); return s ? u + ':' + s.q : 0; }).join(','); }

  function canvas(box, bare) {
    const key = sig(box) + (bare ? '|bare' : ''); if (cache.has(key)) return cache.get(key);
    const d = DIM[box.size], st = STYLES[box.style] || STYLES[0], { w, h } = pxSize(box.size);
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
    // frame
    x.fillStyle = st.fr[0]; x.fillRect(0, 0, w, h); x.fillStyle = st.fr[2]; x.fillRect(0, 0, w, 2); x.fillRect(0, 0, 2, h); x.fillStyle = st.fr[1]; x.fillRect(2, 2, w - 4, 2); x.fillRect(2, 2, 2, h - 4); x.fillRect(w - 4, 2, 2, h - 4); x.fillRect(2, h - 4, w - 4, 2);
    x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, h - 2, w, 2); x.fillRect(w - 2, 0, 2, h);
    // background
    x.fillStyle = st.bg; x.fillRect(FR - 2, FR - 2, w - FR * 2 + 4, h - FR * 2 + 4);
    const R = mulberry32(box.uid * 7 + 3);
    for (let i = 0; i < w * h / 55; i++) { const px = FR + (R() * (w - FR * 2)) | 0, py = FR + (R() * (h - FR * 2)) | 0; x.fillStyle = R() < 0.5 ? 'rgba(0,0,0,0.09)' : 'rgba(255,255,255,0.08)'; if (st.kind === 'cork') x.fillRect(px, py, 1 + (R() * 2 | 0), 1); else x.fillRect(px, py, 1, 1); }
    if (st.kind === 'linen') { x.fillStyle = 'rgba(0,0,0,0.04)'; for (let i = FR; i < w - FR; i += 2) x.fillRect(i, FR, 1, h - FR * 2); }
    x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(FR - 2, FR - 2, w - FR * 2 + 4, 2); x.fillRect(FR - 2, FR - 2, 2, h - FR * 2 + 4);
    // cells
    box.items.forEach((u, i) => {
      const cx0 = FR + (i % d.c) * CW, cy0 = FR + Math.floor(i / d.c) * CH; const s = Save.spec(u);
      if (!s) { x.strokeStyle = 'rgba(0,0,0,0.12)'; x.setLineDash([2, 3]); x.strokeRect(cx0 + 10.5, cy0 + 8.5, CW - 21, CH - 21); x.setLineDash([]); return; }
      const sp = SPECIES_BY_ID[s.sp];
      if (!bare) { Art.drawPose(x, sp, s.pose, cx0 + CW / 2, cy0 + 32, 1);
        x.fillStyle = '#d0d4dc'; x.fillRect(cx0 + CW / 2 - 1, cy0 + 26, 2, 2); x.fillStyle = 'rgba(0,0,0,0.3)'; x.fillRect(cx0 + CW / 2 - 1, cy0 + 28, 2, 1); }
      // label
      x.fillStyle = st.lab; x.fillRect(cx0 + 14, cy0 + 60, CW - 28, 12); x.fillStyle = 'rgba(0,0,0,0.25)'; x.fillRect(cx0 + 14, cy0 + 72, CW - 28, 1);
      let nm = sp.ru; const tail = ' ' + s.q + '%'; while (T.width(nm + tail, 8) > CW - 32 && nm.length > 3) nm = nm.slice(0, -2) + '…';
      T.draw(x, nm + tail, cx0 + CW / 2, cy0 + 62, { size: 8, align: 'c', color: st.ink });
    });
    // brass corners
    if (st.brass) { x.fillStyle = '#d4a840'; for (const [a, b] of [[0, 0], [w - 8, 0], [0, h - 8], [w - 8, h - 8]]) { x.fillRect(a, b, 8, 8); } x.fillStyle = '#f0d070'; for (const [a, b] of [[1, 1], [w - 7, 1], [1, h - 7], [w - 7, h - 7]]) x.fillRect(a, b, 3, 1); x.fillStyle = '#6a4a10'; for (const [a, b] of [[3, 3], [w - 5, 3], [3, h - 5], [w - 5, h - 5]]) x.fillRect(a, b, 2, 2); }
    // glass
    x.fillStyle = 'rgba(255,255,255,0.07)'; x.beginPath(); x.moveTo(FR, FR); x.lineTo(FR + w * 0.45, FR); x.lineTo(FR, FR + h * 0.5); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.05)'; x.beginPath(); x.moveTo(w * 0.6, FR); x.lineTo(w * 0.72, FR); x.lineTo(FR + w * 0.25, h - FR); x.lineTo(FR + w * 0.13, h - FR); x.fill();
    x.fillStyle = 'rgba(255,255,255,0.28)'; x.fillRect(FR - 1, FR - 1, w - FR * 2 + 2, 1); x.fillRect(FR - 1, FR - 1, 1, h - FR * 2 + 2);
    if (cache.size > 40) cache.delete(cache.keys().next().value);
    cache.set(key, cv); return cv;
  }


  // ---- the pinned butterflies as real 3D models (for the cabinet and the museum): four wings per butterfly in their spread pose, slightly raised towards the tips,
  // a body with a head and antennae, a pin. One merged mesh for all the wings (a texture atlas of the wing parts) and one for the bodies, per frame.
  // The group is in "face" coordinates (x right, y up, z out of the frame), 1 canvas pixel = 1 / ppm metres, the origin at the middle of the frame.
  const m3cache = new Map();
  // items: [{ sp: species, pose, cx, cy (canvas pixels, the body centre as in Art.drawPose), sc (pixel scale, 1 = the framed boxes) }]; w, h: the canvas size in pixels
  function buildMount(items, w, h, ppm) {
    {
      const N = Art.N, list = items.map(it => [it, it]);
      const COLS = 6, tiles = list.length * 2, rows = Math.max(1, Math.ceil(tiles / COLS)), at = document.createElement('canvas'); at.width = COLS * N; at.height = rows * N; const ax = at.getContext('2d'); ax.imageSmoothingEnabled = false;
      const P = [], U = [], I = [], NR = [], BP = [], BN = [], BC = [], BI = []; let t = 0;
      const X = px => (px - w / 2) / ppm, Y = py => (h / 2 - py) / ppm;
      list.forEach(([it]) => {
        const sp = it.sp, parts = Art.wingParts(sp), cx = it.cx, cy = it.cy, sc = it.sc || 1, pose = it.pose || Art.RAW, tile = {};
        for (const part of ['h', 'f']) { const c0 = t % COLS, r0 = Math.floor(t / COLS); t++; ax.drawImage(parts[part], c0 * N, r0 * N); tile[part] = [c0, r0]; }
        for (const [k, part, m] of [['lh', 'h', -1], ['rh', 'h', 1], ['lf', 'f', -1], ['rf', 'f', 1]]) {
          const wg = pose[k]; if (!wg) continue; const piv = Art.PIV[part], ca = Math.cos(wg.a), sa = Math.sin(wg.a), base = part === 'h' ? 0.0045 : 0.0075, [c0, r0] = tile[part], SU = 4, SV = 2, i0 = P.length / 3;
          for (let a = 0; a <= SU; a++) for (let b = 0; b <= SV; b++) {
            const u = a / SU * N, v = b / SV * N, qx = wg.s * u, qy = v - piv, rx = (qx * ca - qy * sa) * sc, ry = (qx * sa + qy * ca) * sc, pxX = cx + m * rx, pxY = cy + (piv - 20) * sc + ry, tt = a / SU;
            P.push(X(pxX), Y(pxY), base + 0.014 * sc * Math.pow(tt, 1.4)); U.push((c0 * N + u) / at.width, 1 - (r0 * N + v) / at.height);
          }
          for (let a = 0; a < SU; a++) for (let b = 0; b < SV; b++) { const q = i0 + a * (SV + 1) + b; I.push(q, q + 1, q + SV + 1, q + 1, q + SV + 2, q + SV + 1); }
        }
        // the body: thorax, abdomen, head, two antennae, a pin with a bright head
        const bx = (px0, py0, wpx, hpx, z0, dz, col, rot) => { px0 = cx + (px0 - cx) * sc; py0 = cy + (py0 - cy) * sc; wpx *= sc; hpx *= sc; z0 *= sc; dz *= sc; const cxx = X(px0 + wpx / 2), cyy = Y(py0 + hpx / 2), hx = wpx / 2 / ppm, hy = hpx / 2 / ppm, hz = dz / 2, zc = z0 + hz, base = BP.length / 3, cr = Math.cos(rot || 0), sr = Math.sin(rot || 0);
          const V = [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1], [-1, -1, 1], [1, -1, 1], [1, 1, 1], [-1, 1, 1]]; const F = [[0, 1, 2, 3, 0, 0, -1], [5, 4, 7, 6, 0, 0, 1], [4, 0, 3, 7, -1, 0, 0], [1, 5, 6, 2, 1, 0, 0], [3, 2, 6, 7, 0, 1, 0], [4, 5, 1, 0, 0, -1, 0]];
          const c = new THREE.Color(col);
          for (const f of F) { const o = BP.length / 3; for (let q = 0; q < 4; q++) { const v = V[f[q]], lx = v[0] * hx, ly = v[1] * hy; BP.push(cxx + lx * cr - ly * sr, cyy + lx * sr + ly * cr, zc + v[2] * hz); BN.push(f[4] * cr - f[5] * sr, f[4] * sr + f[5] * cr, f[6]); BC.push(c.r, c.g, c.b); } BI.push(o, o + 1, o + 2, o, o + 2, o + 3); } };
        const ox = cx - w / 2 + w / 2, bz = 0.004;                        // body in canvas pixels relative to (cx, cy): drawBody's rectangles, y shifted by -20
        bx(cx - 2, cy - 9, 4, 6, bz, 0.011, '#2a1e16'); bx(cx - 1.2, cy - 3, 2.4, 13, bz, 0.008, '#1e1612'); bx(cx - 1.6, cy - 12, 3.2, 3.2, bz, 0.009, '#2a201a');
        bx(cx - 2.6, cy - 14.4, 0.9, 5, bz + 0.003, 0.002, '#120e0a', 0.35); bx(cx + 1.7, cy - 14.4, 0.9, 5, bz + 0.003, 0.002, '#120e0a', -0.35);
        bx(cx - 0.5, cy - 6, 1, 1, bz + 0.011, 0.012, '#c8ccd4'); bx(cx - 1.5, cy - 7, 3, 3, bz + 0.022, 0.004, '#f0f2f6');
      });
      const wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); wg.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); wg.setIndex(I); wg.computeVertexNormals();
      const bg = new THREE.BufferGeometry(); bg.setAttribute('position', new THREE.Float32BufferAttribute(BP, 3)); bg.setAttribute('normal', new THREE.Float32BufferAttribute(BN, 3)); bg.setAttribute('color', new THREE.Float32BufferAttribute(BC, 3)); bg.setIndex(BI);
      const tex = new THREE.CanvasTexture(at); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
      const wm = new THREE.MeshLambertMaterial({ map: tex, alphaTest: 0.5, side: THREE.DoubleSide, emissive: new THREE.Color('#ffffff'), emissiveMap: tex, emissiveIntensity: 0.3 }), bm = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: new THREE.Color('#2a2420') });
      for (const g of [wg, bg]) g.dispose = () => {};         // shared between refreshes (the scenes dispose what they remove)
      return { wg, bg, wm, bm };
    }
  }
  const mountGroup = e => { const g = new THREE.Group(); const a = new THREE.Mesh(e.wg, e.wm), b = new THREE.Mesh(e.bg, e.bm); a.userData.noFloat = b.userData.noFloat = true; g.add(a, b); return g; };
  function mount3D(box, ppm) {
    const key = sig(box) + '|' + ppm; let e = m3cache.get(key);
    if (!e) { const d = DIM[box.size], { w, h } = pxSize(box.size), items = []; box.items.forEach((u, i) => { const sp = u ? Save.spec(u) : null; if (sp && SPECIES_BY_ID[sp.sp]) items.push({ sp: SPECIES_BY_ID[sp.sp], pose: sp.pose, cx: FR + (i % d.c) * CW + CW / 2, cy: FR + Math.floor(i / d.c) * CH + 32, sc: 1 }); });
      e = buildMount(items, w, h, ppm); m3cache.set(key, e); if (m3cache.size > 160) m3cache.delete(m3cache.keys().next().value); }
    return mountGroup(e);
  }

  // ---- slot rules
  const WALL = ['L', 'M', 'S', 'S', 'M', 'L'];            // north wall: slot capacity classes (L takes anything)
  const TOPN = 2, DRAWERS = 3, DRAWER_UNITS = 4;
  // the museum: tables (2 flat slots each, small and medium), large tables (1 slot, any), racks (3 shelves x 2 upright slots, small and medium) and wall frames (L M S S M L ...)
  const MUS = { mt: 24, ml: 4, mr: 36, mw: 24 }, MWCLS = i => ['L', 'M', 'S', 'S', 'M', 'L'][i % 6], MUS_TABS = [['mt', 'Столы'], ['ml', 'Большие'], ['mr', 'Стеллажи'], ['mw', 'Стена']];
  const MUS_TITLE = { mt: 'Музей: столы-витрины', ml: 'Музей: большие столы', mr: 'Музей: стеллажи', mw: 'Музей: стены' };
  const rank = { S: 1, M: 2, L: 3 };
  const boxesAt = (t, i) => Save.data.boxes.filter(b => b.loc && b.loc.t === t && b.loc.i === i);
  function fits(box, t, i) {
    if (t === 'wall') return !boxesAt(t, i).length && rank[box.size] <= rank[WALL[i]];
    if (t === 'top') return !boxesAt(t, i).length && box.size !== 'L';
    if (t === 'drawer') return boxesAt(t, i).reduce((a, b) => a + UNITS[b.size], 0) + UNITS[box.size] <= DRAWER_UNITS;
    if (MUS[t]) return i >= 0 && i < MUS[t] && !boxesAt(t, i).length && (t === 'ml' || (t === 'mw' ? rank[box.size] <= rank[MWCLS(i)] : box.size !== 'L'));
    return false;
  }
  function place(box, t, i) { if (!fits(box, t, i)) return false; box.loc = { t, i }; Save.syncBoxLoc(box); return true; }
  function unplace(box) { box.loc = null; Save.syncBoxLoc(box); }
  const locName = b => !b.loc ? 'не размещена' : b.loc.t === 'wall' ? 'стена ' + (b.loc.i + 1) : b.loc.t === 'top' ? 'витрина ' + (b.loc.i + 1) : MUS[b.loc.t] ? 'музей, ' + ({ mt: 'стол ', ml: 'большой стол ', mr: 'стеллаж ', mw: 'стена ' })[b.loc.t] + (b.loc.i + 1) : 'ящик ' + (b.loc.i + 1);
  const fillOf = b => b.items.filter(Boolean).length;
  const boxLabel = b => `${SIZE_NAME[b.size]} · ${STYLES[b.style].name} · ${fillOf(b)}/${b.items.length}`;

  function drawBoxScaled(ctx, box, x, y, maxW, maxH) {
    const { w, h } = pxSize(box.size); const k = Math.min(maxW / w, maxH / h); const dw = Math.round(w * k), dh = Math.round(h * k);
    ctx.imageSmoothingEnabled = k < 1; ctx.drawImage(canvas(box), Math.round(x + (maxW - dw) / 2), Math.round(y + (maxH - dh) / 2), dw, dh); ctx.imageSmoothingEnabled = false;
    return { x: Math.round(x + (maxW - dw) / 2), y: Math.round(y + (maxH - dh) / 2), w: dw, h: dh, k };
  }

  // ================================================================== WORKBENCH

  // ================================================================== NET WORKSHOP (the «Сачки» tab of the workbench)
  const nbench = {
    sel: 0, scroll: 0, draft: { h: 'h_basic', r: 'r_basic', m: 'm_basic' }, msg: '', msgT: 0, btns: [], rows: [], slotBtns: [],
    list() { return [NetParts.BASIC].concat(Save.netList()); },
    isNew() { return this.sel >= this.list().length; },
    cfg() { return this.isNew() ? this.draft : this.list()[this.sel]; },
    say(t) { this.msg = t; this.msgT = 5; },
    options(slot) { return Object.keys(NetParts.PARTS).filter(id => NetParts.PARTS[id].slot === slot && (NetParts.isBasic(id) || Save.partCount(id) > 0)).sort((a, b) => NetParts.PARTS[a].price - NetParts.PARTS[b].price); },
    cycle(slot, d) { const o = this.options(slot), k = o.indexOf(this.draft[slot]), n = o.length; this.draft[slot] = o[(k + d + n * 4) % n] || o[0]; Snd.sfx.page(); },
    layout() {
      const L = this.list(), vis = 8, total = L.length + 1; this.sel = clamp(this.sel, 0, total - 1); this.scroll = clamp(this.scroll, 0, Math.max(0, total - vis));
      if (this.sel < this.scroll) this.scroll = this.sel; if (this.sel >= this.scroll + vis) this.scroll = this.sel - vis + 1;
      this.rows = []; for (let k = 0; k < vis; k++) { const i = this.scroll + k; if (i >= total) break; this.rows.push({ i, x: 8, y: 54 + k * 21, w: 144, h: 19 }); }
      for (const sl of NetParts.SLOTS) { const o = this.options(sl.id); if (o.indexOf(this.draft[sl.id]) < 0) this.draft[sl.id] = o[0]; }
      const isNew = this.isNew(), cur = this.cfg(), eq = (Save.data.netEq || 0) === cur.uid;
      this.slotBtns = []; if (isNew) NetParts.SLOTS.forEach((sl, k) => { const y = 64 + k * 48; this.slotBtns.push({ id: 'prev_' + sl.id, label: '<', x: 330, y: y + 11, w: 16, h: 16, slot: sl.id, d: -1 }, { id: 'next_' + sl.id, label: '>', x: 456, y: y + 11, w: 16, h: 16, slot: sl.id, d: 1 }); });
      this.btns = [
        { id: 'close', label: '← В кабинет', x: 8, y: 248, w: 80, h: 16 },
        isNew ? { id: 'make', label: 'Собрать сачок', x: 330, y: 210, w: 142, h: 18, disabled: ['h', 'r', 'm'].every(k => NetParts.isBasic(this.draft[k])) }
          : { id: 'equip', label: eq && cur.uid ? 'Снять (взять обычный)' : eq ? 'В руках' : 'Взять в руки', x: 94, y: 248, w: 112, h: 16, disabled: eq && !cur.uid },
        { id: 'take', label: 'Разобрать', x: 210, y: 248, w: 72, h: 16, disabled: isNew || !cur.uid },
      ];
    },
    draw(ctx, t, m, dt) {
      this.layout(); this.msgT = Math.max(0, this.msgT - 1 / 60); const L = this.list(), cur = this.cfg(), isNew = this.isNew(), eqU = Save.data.netEq || 0;
      T.draw(ctx, 'Мастерская сачков', SW / 2, 10, { size: 10, align: 'c', color: c.gold });
      T.draw(ctx, 'Сачки меняются только в кабинете', SW / 2, 22, { size: 8, align: 'c', color: c.dim });
      T.draw(ctx, `Ваши сачки (${L.length})`, 8, 40, { size: 8, color: c.dim });
      this.rows.forEach(r => {
        const sl = r.i === this.sel, hv = UIK.hit(r, m.x, m.y), isLast = r.i >= L.length; UIK.panel(ctx, r.x, r.y, r.w, r.h, { fill: sl ? '#2a5a46' : hv ? '#244a3c' : '#1a3228', border: sl ? c.gold : c.line, shadow: false });
        if (isLast) { T.draw(ctx, '+ Собрать новый', r.x + 6, r.y + 5, { size: 8, color: c.green }); return; }
        const n = L[r.i]; T.draw(ctx, NetParts.name(n, r.i - 1), r.x + 6, r.y + 5, { size: 8, color: c.text }); if (n.uid === eqU) T.draw(ctx, 'в руках', r.x + r.w - 5, r.y + 5, { size: 8, align: 'r', color: c.gold });
      });
      // centre: the picture and the numbers
      UIK.panel(ctx, 158, 32, 164, 208, { fill: '#10201c', border: c.line, shadow: false });
      NetParts.draw2D(ctx, cur, 166, 42, 148, 126);
      T.draw(ctx, isNew ? 'Новый сачок' : NetParts.name(cur, this.sel - 1), 240, 36, { size: 8, align: 'c', color: c.text });
      NetParts.statLines(cur).forEach((s, k) => T.draw(ctx, fitStr(s, 154), 164, 172 + k * 11, { size: 8, color: /обычн/.test(s) ? c.dim : c.green }));
      // right: the parts
      UIK.panel(ctx, 326, 32, 150, 208, { fill: '#10201c', border: c.line, shadow: false });
      T.draw(ctx, isNew ? 'Выберите детали' : 'Детали сачка', 401, 36, { size: 8, align: 'c', color: c.text });
      NetParts.SLOTS.forEach((sl, k) => {
        const y = 64 + k * 48, id = isNew ? this.draft[sl.id] : cur[sl.id], p = NetParts.PARTS[id]; T.draw(ctx, sl.ru, 330, y - 12, { size: 8, color: c.dim });
        const cnt = isNew && !NetParts.isBasic(id) ? ` ×${Save.partCount(id)}` : ''; T.draw(ctx, fitStr(p.ru + cnt, isNew ? 100 : 140), isNew ? 401 : 330, y + (isNew ? 15 : 2), { size: 8, align: isNew ? 'c' : 'l', color: NetParts.isBasic(id) ? c.text : '#fff' });
        const fl = NetParts.fxLines(p.fx); T.draw(ctx, fl[0] || (isNew ? '' : 'без бонуса'), isNew ? 401 : 330, y + (isNew ? 29 : 13), { size: 8, align: isNew ? 'c' : 'l', color: fl.length ? c.green : c.dim });
      });
      this.slotBtns.forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y)));
      if (isNew) { const free = NetParts.SLOTS.every(sl => this.options(sl.id).length === 1); if (free) T.para(ctx, 'Деталей нет. Купите их у продавца сачков на рынке насекомых.', 330, 196, 140, { size: 8, color: '#6a8a78', lh: 10 }); }
      this.btns.forEach(b => UIK.btn(ctx, b, !b.disabled && UIK.hit(b, m.x, m.y)));
      if (this.msgT > 0) T.draw(ctx, this.msg, 316, 252, { size: 8, align: 'r', color: c.gold });
      T.draw(ctx, `${Save.data.coins || 0} монет`, SW - 10, 252, { size: 8, align: 'r', color: '#ffe070' });
    },
    click(x, y) {
      const b = this.btns.find(b => !b.disabled && UIK.hit(b, x, y));
      if (b) {
        Snd.sfx.click(); if (b.id === 'close') return 'close';
        const cur = this.cfg();
        if (b.id === 'make') { const n = Save.assembleNet(this.draft); if (n) { this.sel = this.list().length - 1; this.say('Сачок собран!'); Snd.sfx.thud(); } else Snd.sfx.deny(); }
        else if (b.id === 'equip') { if (cur.uid && (Save.data.netEq || 0) === cur.uid) { Save.equipNet(0); this.say('В руках обычный сачок'); } else { Save.equipNet(cur.uid); this.say('Сачок взят в руки'); } Snd.sfx.pin(); }
        else if (b.id === 'take') { if (Save.disassembleNet(cur.uid)) { this.sel = Math.max(0, this.sel - 1); this.say('Сачок разобран: детали вернулись на склад'); Snd.sfx.deny(); } }
        return 'changed';
      }
      const sb = this.slotBtns.find(b => UIK.hit(b, x, y)); if (sb) { this.cycle(sb.slot, sb.d); return null; }
      const r = this.rows.find(r => UIK.hit(r, x, y)); if (r) { this.sel = r.i; Snd.sfx.click(); }
      return null;
    },
    wheel(dy) { this.scroll += dy > 0 ? 1 : -1; },
  };

  const bench = {
    sel: 0, style: 0, scroll: 0, sscroll: 0, btns: [], rows: [], srows: [], slots: [], info: '', f: { rar: 0, loc: 0, ab: 0, date: 0, fam: 0 }, fbtns: [],
    open() { this.sel = Math.min(this.sel, Save.data.boxes.length - 1); this.f = { rar: 0, loc: 0, ab: 0, date: 0, fam: 0 }; },
    cur() { return Save.data.boxes[this.sel] || null; },
    layout() {
      const B = Save.data.boxes; this.rows = []; const vis = 7;
      this.scroll = clamp(this.scroll, 0, Math.max(0, B.length - vis));
      B.slice(this.scroll, this.scroll + vis).forEach((b, i) => this.rows.push({ b, idx: this.scroll + i, x: 8, y: 84 + i * 21, w: 138, h: 19 }));
      this.allFree = Save.freeSpread(); const FL = Spread.pick.filtersFor(this.allFree); FL.forEach(fl => { this.f[fl.id] = Math.min(this.f[fl.id] || 0, fl.opts.length - 1); });
      const free = this.allFree.filter(sp => FL.every(fl => fl.opts[this.f[fl.id]].t(sp))); const vis2 = 9; this.sscroll = clamp(this.sscroll, 0, Math.max(0, free.length - vis2)); this.free = free;
      const SHORT = { rar: 'Ред', loc: 'Лок', ab: 'Абер', date: 'Дата', fam: 'Сем' };
      this.fbtns = FL.map((fl, i) => ({ id: 'f_' + fl.id, fid: fl.id, n: fl.opts.length, tip: fl.name + ': ' + fl.opts[this.f[fl.id]].n, label: SHORT[fl.id] + ': ' + fl.opts[this.f[fl.id]].n, on: this.f[fl.id] > 0, x: i < 4 ? 338 + (i % 2) * 68 : 338, y: 50 + (i < 4 ? Math.floor(i / 2) : 2) * 13, w: i < 4 ? 66 : 134, h: 12 }));
      this.srows = free.slice(this.sscroll, this.sscroll + vis2).map((s, i) => ({ s, x: 338, y: 92 + i * 15, w: 134, h: 14 })); this.nfree = free.length;
      const cb = this.cur();
      this.btns = [
        { id: 'S', label: 'Мал. ' + Save.stock('S'), x: 8, y: 32, w: 48, h: 16, disabled: !Save.stock('S') }, { id: 'M', label: 'Сред. ' + Save.stock('M'), x: 58, y: 32, w: 50, h: 16, disabled: !Save.stock('M') }, { id: 'L', label: 'Бол. ' + Save.stock('L'), x: 110, y: 32, w: 50, h: 16, disabled: !Save.stock('L') },
        { id: 'style', label: 'Стиль: ' + STYLES[this.style].name, x: 8, y: 50, w: 152, h: 14 },
        { id: 'close', label: '← В кабинет', x: 8, y: 248, w: 80, h: 16 },
        { id: 'auto', label: 'Авто', x: 168, y: 248, w: 52, h: 16, disabled: !cb || !this.nfree },
        { id: 'clear', label: 'Вынуть всё', x: 224, y: 248, w: 72, h: 16, disabled: !cb || !fillOf(cb) },
        { id: 'del', label: cb && cb.loc ? 'Снимите со стены/стола' : 'Разобрать (в запас)', x: 300, y: 248, w: 100, h: 16, disabled: !cb || !!cb.loc },
        { id: 'lup', label: '↑', x: 114, y: 67, w: 16, h: 13, disabled: this.scroll === 0 }, { id: 'ldown', label: '↓', x: 132, y: 67, w: 16, h: 13, disabled: this.scroll >= Math.max(0, B.length - vis) },
        { id: 'up', label: '↑', x: 448, y: 34, w: 24, h: 14, disabled: this.sscroll === 0 }, { id: 'down', label: '↓', x: 448, y: 236, w: 24, h: 14, disabled: this.sscroll >= Math.max(0, this.nfree - 9) },
      ];
      this.slots = [];
      if (cb) { const area = { x: 170, y: 50, w: 160, h: 170 }; const r = (this._r = drawBoxScaled({ drawImage() {}, set imageSmoothingEnabled(v) {} }, cb, area.x, area.y, area.w, area.h)); const d = DIM[cb.size]; for (let i = 0; i < cb.items.length; i++) this.slots.push({ i, x: r.x + (FR + (i % d.c) * CW) * r.k, y: r.y + (FR + Math.floor(i / d.c) * CH) * r.k, w: CW * r.k, h: CH * r.k }); }
    },
    tab: 'boxes', tabBtns() { return [{ id: 'boxes', label: 'Коробки', x: 8, y: 6, w: 52, h: 14 }, { id: 'nets', label: 'Сачки', x: 62, y: 6, w: 44, h: 14 }]; },
    draw(ctx, t, m) {
      Cab2.backdrop(ctx); UIK.panel(ctx, 4, 4, 472, 262, { fill: 'rgba(16,28,24,0.9)', border: c.line, shadow: false });
      this.tabBtns().forEach(b => { const on = b.id === this.tab; UIK.panel(ctx, b.x, b.y, b.w, b.h, { fill: on ? '#2a5a46' : UIK.hit(b, m.x, m.y) ? '#244a3c' : '#1a3228', border: on ? c.gold : c.line, shadow: false }); T.draw(ctx, b.label, b.x + b.w / 2, b.y + 3, { size: 8, align: 'c', color: on ? '#fff' : c.dim }); });
      if (this.tab === 'nets') return nbench.draw(ctx, t, m);
      this.mx = m.x; this.layout();
      T.draw(ctx, 'Мастерская коробок', SW / 2, 10, { size: 10, align: 'c', color: c.gold });
      T.draw(ctx, 'Новая коробка (из запаса):', 8, 21, { size: 8, color: c.dim });
      this.btns.forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y)));
      // list
      T.draw(ctx, `Ваши коробки (${Save.data.boxes.length})`, 8, 70, { size: 8, color: c.dim });
      if (!Save.data.boxes.length) T.para(ctx, Save.stockTotal() ? 'Пока пусто. Выберите размер (число — сколько коробок в запасе) и стиль — и создайте первую коробку.' : 'Пока пусто. Коробки продаёт торговец коллекциями на рынке насекомых: малая — 200, средняя — 300, большая — 400 монет. Стиль можно менять здесь.', 10, 86, 134, { size: 8, color: '#6a8a78', lh: 10 });
      this.rows.forEach(r => { const hv = UIK.hit(r, m.x, m.y), sl = r.idx === this.sel; UIK.panel(ctx, r.x, r.y, r.w, r.h, { fill: sl ? '#2a5a46' : hv ? '#244a3c' : '#1a3228', border: sl ? c.gold : c.line, shadow: false }); T.draw(ctx, `${r.b.size} ${STYLES[r.b.style].name} ${fillOf(r.b)}/${r.b.items.length}`, r.x + 4, r.y + 2, { size: 8, color: c.text }); T.draw(ctx, r.b.loc ? '▪' : '', r.x + r.w - 8, r.y + 2, { size: 8, color: c.gold }); });
      // centre: box view
      const cb = this.cur();
      UIK.panel(ctx, 166, 32, 168, 190, { fill: '#10201c', border: c.line, shadow: false });
      if (cb) {
        drawBoxScaled(ctx, cb, 170, 50, 160, 170);
        let hv = -1; this.slots.forEach(s => { if (UIK.hit(s, m.x, m.y)) hv = s.i; });
        this.slots.forEach(s => { const sp = Save.spec(cb.items[s.i]); if (UIK.hit(s, m.x, m.y)) { ctx.strokeStyle = sp ? c.red : c.green; ctx.strokeRect(Math.round(s.x) + 0.5, Math.round(s.y) + 0.5, Math.round(s.w), Math.round(s.h)); } });
        T.draw(ctx, boxLabel(cb), 250, 36, { size: 8, align: 'c', color: c.text });
        const hs = hv >= 0 ? Save.spec(cb.items[hv]) : null;
        T.draw(ctx, hs ? `${SPECIES_BY_ID[hs.sp].ru} ${hs.q}% — щёлк: вынуть` : cb.loc ? 'Коробка висит: ' + locName(cb) : 'Щёлкните экземпляр справа, чтобы положить', 250, 226, { size: 8, align: 'c', color: hs ? c.red : c.dim });
      } else T.para(ctx, 'Создайте коробку слева.', 176, 120, 150, { size: 8, color: '#6a8a78', lh: 10 });
      // right: free spread specimens
      T.draw(ctx, this.nfree === this.allFree.length ? `Расправленные (${this.nfree})` : `Расправленные (${this.nfree} из ${this.allFree.length})`, 338, 38, { size: 8, color: c.dim });
      this.fbtns.forEach(b => { const hv = UIK.hit(b, m.x, m.y); UIK.panel(ctx, b.x, b.y, b.w, b.h, { fill: b.on ? '#4a3a1c' : hv ? '#244a3c' : '#1a3228', border: b.on ? c.gold : c.line, shadow: false }); T.draw(ctx, fitStr(b.label, b.w - 4), b.x + b.w / 2, b.y + 2, { size: 8, align: 'c', color: b.on ? '#fff' : c.text }); });
      const hf = this.fbtns.find(b => UIK.hit(b, m.x, m.y)); if (hf) T.draw(ctx, hf.tip, 338, 238, { size: 8, color: c.gold });
      if (!this.nfree) T.para(ctx, this.allFree.length ? 'Под фильтры ничего не подходит — щёлкните фильтр, чтобы сменить значение.' : 'Нет свободных расправленных бабочек. Расправьте новых на расправилке!', 338, 96, 130, { size: 8, color: '#6a8a78', lh: 10 });
      this.srows.forEach(r => { const hv = UIK.hit(r, m.x, m.y); const g = Grade(r.s.q); ctx.fillStyle = hv ? '#2a5a46' : '#1a3228'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.fillStyle = g.col; ctx.fillRect(r.x + 1, r.y + 2, 3, 10); let nm = SPECIES_BY_ID[r.s.sp].ru; while (T.width(nm, 8) > 96 && nm.length > 3) nm = nm.slice(0, -2) + '…'; T.draw(ctx, nm, r.x + 8, r.y + 3, { size: 8, color: hv ? '#fff' : c.text }); T.draw(ctx, r.s.q + '%', r.x + r.w - 3, r.y + 3, { size: 8, align: 'r', color: g.col }); });
    },
    click(x, y) {
      const tb = this.tabBtns().find(b => UIK.hit(b, x, y)); if (tb) { if (this.tab !== tb.id) { this.tab = tb.id; Snd.sfx.page(); } return null; }
      if (this.tab === 'nets') return nbench.click(x, y);
      this.layout(); const fb = this.fbtns.find(b => UIK.hit(b, x, y)); if (fb) { this.f[fb.fid] = (this.f[fb.fid] + 1) % fb.n; this.sscroll = 0; Snd.sfx.click(); return null; }
      const b = this.btns.find(b => !b.disabled && UIK.hit(b, x, y));
      if (b) {
        Snd.sfx.click();
        if (b.id === 'close') return 'close';
        if (b.id === 'S' || b.id === 'M' || b.id === 'L') { if (Save.data.boxes.length >= 100 || !Save.useStock(b.id)) { Snd.sfx.deny(); return null; } Save.addBox(b.id, this.style); this.sel = Save.data.boxes.length - 1; this.scroll = Math.max(0, Save.data.boxes.length - 7); Snd.sfx.thud(); return 'changed'; }
        if (b.id === 'style') { this.style = (this.style + 1) % STYLES.length; const cb = this.cur(); if (cb && !cb.loc) { cb.style = this.style; Save.syncBoxStyle(cb); } return 'changed'; }
        if (b.id === 'up') this.sscroll--; else if (b.id === 'down') this.sscroll++; else if (b.id === 'lup') this.scroll--; else if (b.id === 'ldown') this.scroll++;
        const cb = this.cur();
        if (b.id === 'auto' && cb) { const free = this.free.slice(); cb.items.forEach((u, i) => { if (!u && free.length) Save.putIn(cb, i, free.shift().uid); }); Snd.sfx.pin(); return 'changed'; }
        if (b.id === 'clear' && cb) { cb.items.forEach((u, i) => { if (u) Save.takeOut(cb, i); }); return 'changed'; }
        if (b.id === 'del' && cb) { const sz = cb.size; if (Save.removeBox(cb.uid)) Save.addStock(sz, 1); this.sel = Math.max(0, this.sel - 1); Snd.sfx.deny(); return 'changed'; }
        return null;
      }
      const r = this.rows.find(r => UIK.hit(r, x, y)); if (r) { this.sel = r.idx; this.style = r.b.style; Snd.sfx.click(); return null; }
      const cb = this.cur();
      if (cb) { const s = this.slots.find(s => UIK.hit(s, x, y)); if (s && cb.items[s.i]) { Save.takeOut(cb, s.i); Snd.sfx.page(); return 'changed'; } }
      const sr = this.srows.find(r => UIK.hit(r, x, y));
      if (sr && cb) { const i = cb.items.findIndex(u => !u); if (i < 0) { Snd.sfx.deny(); return null; } Save.putIn(cb, i, sr.s.uid); Snd.sfx.pin(); return 'changed'; }
      return null;
    },
    wheel(dy) { if (this.tab === 'nets') nbench.wheel(dy); else if ((this.mx || 0) < 164) this.scroll += dy > 0 ? 1 : -1; else this.sscroll += dy > 0 ? 1 : -1; },
  };

  // ================================================================== PLACEMENT (wall / desk)
  const place_ = {
    tab: 'wall', sel: 0, scroll: 0, btns: [], rows: [], slots: [], tabs: [],
    open(tab) { if (tab) this.tab = tab; this.selUid = 0; },
    museum() { return !!MUS[this.tab]; },
    layout() {
      const un = Save.data.boxes.filter(b => !b.loc); const vis = 9; this.scroll = clamp(this.scroll, 0, Math.max(0, un.length - vis)); this.un = un;
      this.rows = un.slice(this.scroll, this.scroll + vis).map((b, i) => ({ b, x: 8, y: 54 + i * 21, w: 130, h: 19 }));
      this.tabs = this.museum() ? MUS_TABS.map(([id, label], k) => ({ id, label, x: 150 + k * 64, y: 30, w: 60, h: 16 })) : [{ id: 'wall', label: 'Стена', x: 150, y: 30, w: 60, h: 16 }, { id: 'desk', label: 'Стол', x: 214, y: 30, w: 60, h: 16 }];
      this.btns = [{ id: 'close', label: this.museum() ? '← В музей' : '← В кабинет', x: 8, y: 248, w: 80, h: 16 }];
      this.slots = [];
      if (this.museum()) {
        const t = this.tab, n = MUS[t];
        if (t === 'ml') for (let i = 0; i < n; i++) this.slots.push({ t, i, x: 154 + i * 80, y: 76, w: 74, h: 58 });
        else if (t === 'mr') for (let i = 0; i < n; i++) this.slots.push({ t, i, x: 192 + (i % 6) * 46, y: 62 + Math.floor(i / 6) * 28, w: 42, h: 24, rack: Math.floor(i / 6) });
        else for (let i = 0; i < n; i++) this.slots.push({ t, i, cls: t === 'mw' ? MWCLS(i) : 'M', x: 154 + (i % 6) * 53, y: 62 + Math.floor(i / 6) * 42, w: 48, h: 37 });
      } else if (this.tab === 'wall') {
        const k = 0.22, gap = 5; const ws = WALL.map(s => pxSize(s).w * k + 0); const total = ws.reduce((a, b) => a + b, 0) + gap * 5; let x = 150 + (326 - total) / 2;
        WALL.forEach((s, i) => { const sz = pxSize(s); this.slots.push({ t: 'wall', i, cls: s, x: Math.round(x), y: 68 + Math.round((pxSize('L').h * k - sz.h * k) / 2), w: Math.round(sz.w * k), h: Math.round(sz.h * k) }); x += sz.w * k + gap; });
      } else {
        for (let i = 0; i < TOPN; i++) this.slots.push({ t: 'top', i, x: 156 + i * 160, y: 62, w: 150, h: 66 });
        for (let i = 0; i < DRAWERS; i++) this.slots.push({ t: 'drawer', i, x: 156, y: 148 + i * 28, w: 310, h: 24 });
      }
    },
    cur() { return Save.box(this.selUid); },
    draw(ctx, t, m) {
      this.layout(); Cab2.backdrop(ctx);
      UIK.panel(ctx, 4, 4, 472, 262, { fill: 'rgba(16,28,24,0.9)', border: c.line, shadow: false });
      T.draw(ctx, MUS[this.tab] ? MUS_TITLE[this.tab] : this.tab === 'wall' ? 'Стена экспозиции' : 'Стол энтомолога', SW / 2, 10, { size: 10, align: 'c', color: c.gold });
      this.tabs.forEach(b => { UIK.btn(ctx, b, UIK.hit(b, m.x, m.y) || b.id === this.tab); if (b.id === this.tab) { ctx.fillStyle = c.gold; ctx.fillRect(b.x, b.y + b.h - 2, b.w, 2); } });
      this.btns.forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y)));
      T.draw(ctx, `Не размещены (${this.un.length})`, 8, 38, { size: 8, color: c.dim });
      if (!this.un.length) T.para(ctx, 'Все коробки на местах. Новые — в мастерской.', 10, 60, 128, { size: 8, color: '#6a8a78', lh: 10 });
      this.rows.forEach(r => { const hv = UIK.hit(r, m.x, m.y), sl = r.b.uid === this.selUid; UIK.panel(ctx, r.x, r.y, r.w, r.h, { fill: sl ? '#2a5a46' : hv ? '#244a3c' : '#1a3228', border: sl ? c.gold : c.line, shadow: false }); T.draw(ctx, `${r.b.size} ${STYLES[r.b.style].name} ${fillOf(r.b)}/${r.b.items.length}`, r.x + 4, r.y + 2, { size: 8, color: c.text }); });
      const cb = this.cur(); let hint = cb ? `Выбрана: ${boxLabel(cb)}. Щёлкните место.` : 'Выберите коробку слева, затем место. Щёлк по занятому — снять.';
      let hovBox = null;
      this.slots.forEach(s => {
        const hv = UIK.hit(s, m.x, m.y);
        if (s.t !== 'drawer') {
          const occ = boxesAt(s.t, s.i)[0]; const ok = cb && fits(cb, s.t, s.i);
          ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(s.x, s.y, s.w, s.h);
          if (occ) { ctx.imageSmoothingEnabled = true; ctx.drawImage(canvas(occ), s.x, s.y, s.w, s.h); ctx.imageSmoothingEnabled = false; if (hv) hovBox = occ; }
          ctx.strokeStyle = hv ? (occ ? c.red : ok ? c.green : '#555') : occ ? 'rgba(0,0,0,0)' : ok ? 'rgba(126,224,138,0.7)' : '#34504a'; ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1);
          if (!occ) T.draw(ctx, s.t === 'wall' || s.t === 'mw' ? s.cls : s.t === 'ml' ? 'L' : 'M', s.x + s.w / 2, s.y + s.h / 2 - 4, { size: 8, align: 'c', color: '#4a6a60' });
          if (s.t === 'wall') T.draw(ctx, String(s.i + 1), s.x + s.w / 2, s.y + s.h + 3, { size: 8, align: 'c', color: '#6a8a78' });
          else if (MUS[s.t] && s.t !== 'mr') T.draw(ctx, String(s.i + 1), s.x + 2, s.y + 1, { size: 8, color: occ ? '#e8e0c8' : '#6a8a78', shadow: '#000' });
          else if (s.t === 'mr' && s.i % 6 === 0) T.draw(ctx, 'Ст. ' + (s.rack + 1), s.x - 4, s.y + 8, { size: 8, align: 'r', color: '#6a8a78' });
        } else { // drawer
          const here = boxesAt('drawer', s.i); const used = here.reduce((a, b) => a + UNITS[b.size], 0);
          UIK.panel(ctx, s.x, s.y, s.w, s.h, { fill: '#2a1c12', border: hv && cb && fits(cb, 'drawer', s.i) ? c.green : '#6a4a2a', shadow: false });
          let ux = s.x + 4; const uw = (s.w - 8) / DRAWER_UNITS;
          here.forEach(b => { const w2 = UNITS[b.size] * uw - 3; const hh = UIK.hit({ x: ux, y: s.y + 3, w: w2, h: s.h - 6 }, m.x, m.y); ctx.fillStyle = hh ? '#8a6a3a' : '#5a3e22'; ctx.fillRect(Math.round(ux), s.y + 3, Math.round(w2), s.h - 6); T.draw(ctx, `${b.size} ${fillOf(b)}/${b.items.length}`, ux + w2 / 2, s.y + 9, { size: 8, align: 'c', color: '#f0e0b0' }); if (hh) hovBox = b; ux += UNITS[b.size] * uw; });
          T.draw(ctx, `Ящик ${s.i + 1}`, s.x + s.w - 4, s.y + 9, { size: 8, align: 'r', color: used ? 'rgba(240,224,176,0)' : '#7a5a3a' });
          if (!used) T.draw(ctx, `Ящик ${s.i + 1} · пусто`, s.x + 8, s.y + 9, { size: 8, color: '#7a5a3a' });
        }
      });
      if (this.tab === 'desk') { T.draw(ctx, 'Витрина под стеклом (малые и средние)', 156, 51, { size: 8, color: c.dim }); T.draw(ctx, 'Выдвижные ящики: 4 места (мал. 1, ср. 2, бол. 4)', 156, 135, { size: 8, color: c.dim }); }
      else if (this.tab === 'mt') T.draw(ctx, '12 столов по 2 витрины (малые и средние)', 154, 51, { size: 8, color: c.dim });
      else if (this.tab === 'ml') T.draw(ctx, 'Большие столы: одна коробка любого размера', 154, 62, { size: 8, color: c.dim });
      else if (this.tab === 'mr') T.draw(ctx, 'Стеллажи: 3 полки по 2 места (малые и средние)', 154, 47, { size: 8, color: c.dim });
      else if (this.tab === 'mw') T.draw(ctx, 'Стены: L — любая, M — малая и средняя, S — малая', 154, 51, { size: 8, color: c.dim });
      else T.draw(ctx, 'Стена: L — любая, M — малая и средняя, S — малая', 150, 52, { size: 8, color: c.dim });
      if (hovBox) hint = `${boxLabel(hovBox)} — щёлк: снять`;
      // contents preview of hovered / selected
      const pv = hovBox || cb;
      if (pv) {
        const lst = pv.items.map(Save.spec.bind(Save)).filter(Boolean).map(s => SPECIES_BY_ID[s.sp].ru);
        if (this.tab === 'wall') { UIK.panel(ctx, 150, 130, 322, 100, { fill: '#10201c', border: c.line, shadow: false }); drawBoxScaled(ctx, pv, 154, 134, 140, 92); T.para(ctx, lst.length ? lst.join(', ') : 'коробка пуста', 300, 136, 166, { size: 8, color: '#9ab8a4', lh: 10 }); }
        else T.draw(ctx, lst.length ? lst.join(', ').slice(0, 60) + (lst.join(', ').length > 60 ? '…' : '') : 'коробка пуста', 156, this.museum() ? 234 : 226, { size: 8, color: '#9ab8a4' });
      }
      T.draw(ctx, hint, SW / 2 + 70, 244, { size: 8, align: 'c', color: c.text });
    },
    click(x, y) {
      const b = this.btns.find(b => UIK.hit(b, x, y)); if (b) { Snd.sfx.click(); return 'close'; }
      const tb = this.tabs.find(b => UIK.hit(b, x, y)); if (tb) { this.tab = tb.id; Snd.sfx.page(); return null; }
      const r = this.rows.find(r => UIK.hit(r, x, y)); if (r) { this.selUid = r.b.uid; Snd.sfx.click(); return null; }
      const cb = this.cur();
      for (const s of this.slots) {
        if (!UIK.hit(s, x, y)) continue;
        if (s.t === 'drawer') {
          // a click on a box inside the drawer takes it back
          const here = boxesAt('drawer', s.i); const uw = (s.w - 8) / DRAWER_UNITS; let ux = s.x + 4;
          for (const bx of here) { const w2 = UNITS[bx.size] * uw - 3; if (UIK.hit({ x: ux, y: s.y + 3, w: w2, h: s.h - 6 }, x, y)) { unplace(bx); this.selUid = bx.uid; Snd.sfx.page(); return 'changed'; } ux += UNITS[bx.size] * uw; }
        } else { const occ = boxesAt(s.t, s.i)[0]; if (occ) { unplace(occ); this.selUid = occ.uid; Snd.sfx.page(); return 'changed'; } }
        if (cb && place(cb, s.t, s.i)) { Snd.sfx.thud(); this.selUid = 0; return 'changed'; }
        Snd.sfx.deny(); return null;
      }
      return null;
    },
    wheel(dy) { this.scroll += dy > 0 ? 1 : -1; },
  };
  return { PRICE, mount3D, buildMount, mountGroup, boxLabel, canvas, pxSize, bench, place: place_, WALL, TOPN, DRAWERS, MUS, MWCLS, rank, boxesAt, STYLES, fillOf, SIZE_NAME };
})();

// the empty boxes in stock (personal, like coins): bought from the collection trader, used up at the workbench, returned when a box is taken apart
Object.assign(Save, {
  stockObj() { return this.data.boxStock || (this.data.boxStock = { S: 0, M: 0, L: 0 }); },
  stock(size) { return this.stockObj()[size] || 0; },
  stockTotal() { const o = this.stockObj(); return (o.S || 0) + (o.M || 0) + (o.L || 0); },
  addStock(size, n = 1) { const o = this.stockObj(); o[size] = Math.max(0, (o[size] || 0) + n); this.write(); },
  useStock(size) { if (!this.stock(size)) return false; this.addStock(size, -1); return true; },
  buyBox(size) { const p = Boxes.PRICE[size]; if (!p || (this.data.coins || 0) < p) return 0; this.data.coins -= p; this.addStock(size, 1); return p; },
});
