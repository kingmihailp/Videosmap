// ---------------------------------------------------------------- menu screens (all drawn on the 480x270 UI canvas)
const collText = () => BIOME_BY_ID.ocean.secret ? `${Save.total()}/${REAL}+???` : `${Save.total()}/${SPECIES.length}`;
const Screens = (() => {
  const c = UIK.col;
  const short = { ocean: '???', russia: 'Луг РФ', alps: 'Альпы', med: 'Греция', amazon: 'Амазония', borneo: 'Борнео', kenya: 'Кения', prairie: 'Прерия', japan: 'Япония' };
  const biomeCol = { ocean: '#c0304a', russia: '#7ac04a', alps: '#8ab8e8', med: '#c8a860', amazon: '#2e9a4a', borneo: '#3ec0a0', kenya: '#e8b040', prairie: '#c8c850', japan: '#e86a8a' };
  const fit = (str, maxW, size = 8) => { if (T.width(str, size) <= maxW) return str; while (str.length > 1 && T.width(str + '…', size) > maxW) str = str.slice(0, -1); return str + '…'; };
  const R = new Rng(2024);
  const fireflies = Array.from({ length: 34 }, () => ({ x: R.range(0, SW), y: R.range(110, 250), sp: R.range(0.3, 1), ph: R.range(0, 6.28), a: R.range(6, 22) }));
  const stars = Array.from({ length: 70 }, () => ({ x: R.range(0, SW), y: R.range(0, 120), b: R.range(0.3, 1), ph: R.range(0, 6.28) }));
  const flyers = SPECIES.filter((s, i) => i % 5 === 0).slice(0, 8).map((sp, i) => ({ sp, x: R.range(-60, SW), y: R.range(40, 190), v: R.range(14, 30), ph: R.range(0, 6.28), a: R.range(8, 22), s: R.range(0.5, 1) }));
  const pines = Array.from({ length: 18 }, (_, i) => ({ x: i * 28 + R.range(-6, 6), h: R.range(34, 64), w: R.range(10, 15) }));
  let mapCanvas = null;

  function pine(ctx, x, base, h, w, col) { for (let k = 0; k < 5; k++) { const yy = base - h + k * h / 5.2, ww = w * (0.35 + k * 0.22); ctx.beginPath(); ctx.moveTo(x, yy - h / 5); ctx.lineTo(x - ww, yy + h / 4.4); ctx.lineTo(x + ww, yy + h / 4.4); ctx.fill(); } ctx.fillRect(x - 1, base - 4, 3, 4); }

  function nightBackdrop(ctx, t, dim = 0) {
    const g = ctx.createLinearGradient(0, 0, 0, SH); g.addColorStop(0, '#08142c'); g.addColorStop(0.6, '#163a52'); g.addColorStop(1, '#245a54'); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
    for (const s of stars) { const a = 0.35 + 0.65 * Math.abs(Math.sin(t * s.b + s.ph)); ctx.fillStyle = `rgba(230,240,255,${a * s.b})`; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
    ctx.fillStyle = '#eee8c0'; ctx.beginPath(); ctx.arc(392, 52, 16, 0, 6.3); ctx.fill(); ctx.fillStyle = '#d8d2a8'; [[-5, -4, 3], [4, 3, 4], [-3, 8, 2], [6, -6, 2]].forEach(([x, y, r]) => { ctx.beginPath(); ctx.arc(392 + x, 52 + y, r, 0, 6.3); ctx.fill(); });
    const mg = ctx.createRadialGradient(392, 52, 10, 392, 52, 80); mg.addColorStop(0, 'rgba(120,150,200,0.35)'); mg.addColorStop(1, 'rgba(120,150,200,0)'); ctx.fillStyle = mg; ctx.fillRect(300, 0, 180, 140);
    const sc = t * 3, hillY = wx => 164 + Math.sin(wx * 0.03) * 10 + Math.sin(wx * 0.09) * 5;                 // the hill scrolls with the trees, so the trees stay planted on it
    ctx.fillStyle = '#0e2a3a'; ctx.beginPath(); ctx.moveTo(0, SH); for (let x = 0; x <= SW + 4; x += 4) ctx.lineTo(x, hillY(x + sc)); ctx.lineTo(SW + 4, SH); ctx.fill();
    ctx.fillStyle = '#0a2230'; pines.forEach(p => { const sx = ((p.x - sc) % (SW + 40) + (SW + 40)) % (SW + 40) - 20; pine(ctx, Math.round(sx), Math.round(hillY(sx + sc)) + 7, p.h, p.w, '#0a2230'); });
    ctx.fillStyle = '#06161e'; ctx.fillRect(0, 214, SW, SH - 214);
    for (let i = 0; i < 70; i++) { const x = (i * 37) % SW, h = 5 + (i * 13) % 14, sw = Math.sin(t * 1.4 + i) * 2; ctx.fillStyle = i % 3 ? '#0c2a1c' : '#123a26'; ctx.fillRect(x, SH - h - 6 + 0, 1, h); ctx.fillRect(x + Math.round(sw / 2), SH - h - 6 - 3, 1, 3); }
    for (const f of fireflies) { const x = f.x + Math.sin(t * f.sp + f.ph) * f.a, y = f.y + Math.cos(t * f.sp * 0.8 + f.ph) * f.a * 0.5; const b = Math.max(0, Math.sin(t * 1.6 * f.sp + f.ph * 3)) ** 3; if (b > 0.1) { ctx.fillStyle = `rgba(200,255,120,${b})`; ctx.fillRect(Math.round(x), Math.round(y), 2, 2); ctx.fillStyle = `rgba(160,240,90,${b * 0.2})`; ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2, 6, 6); } }
    if (dim) { ctx.fillStyle = `rgba(0,0,0,${dim})`; ctx.fillRect(0, 0, SW, SH); }
  }
  function drawFlyer(ctx, f, t) {
    const x = (f.x + t * f.v) % (SW + 120) - 60, y = f.y + Math.sin(t * 0.9 + f.ph) * f.a; const fl = Math.abs(Math.cos(t * 7 + f.ph)) * 0.8 + 0.2;
    const vy = Math.cos(t * 0.9 + f.ph) * 0.9 * f.a; const ang = Math.atan2(vy, f.v);       // fly head-first along the path (the picture's head points up)
    const img = Art.specimen(f.sp); const w = 80 * f.s, h = 40 * f.s; ctx.imageSmoothingEnabled = false;
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(Math.PI / 2 + ang); ctx.drawImage(img, 0, 0, 80, 40, -w / 2 * fl, -h / 2, w * fl, h); ctx.restore();
  }

  // ------------------------------------------------------------------ TITLE
  const title = {
    btns: [], hover: -1,
    layout() {
      const x = SW / 2 - 70, w = 140; const s = Save.data.settings;
      this.btns = [
        { id: 'play', label: 'Играть', x, y: 144, w, h: 20, size: 10 },
        { id: 'journal', label: `Коллекция  ${collText()}`, x, y: 168, w, h: 16, size: 8 },
        { id: 'cabinet', label: 'Кабинет энтомолога', x, y: 188, w, h: 16, size: 8 },
        { id: 'help', label: 'Управление', x, y: 208, w: 68, h: 16 },
        { id: 'sound', label: s.sound ? 'Звук: вкл' : 'Звук: выкл', x: x + 72, y: 208, w: 68, h: 16 },
      ];
    },
    draw(ctx, t, m) {
      this.layout(); nightBackdrop(ctx, t);
      flyers.forEach(f => drawFlyer(ctx, f, t));
      // logo (2x pixel doubling)
      ctx.save(); ctx.scale(2, 2); const lx = SW / 4;
      T.draw(ctx, 'Flora0world', lx, 16, { size: 22, align: 'c', color: '#b8f090', outline: '#0c2a1a', shadow: '#061810' });
      ctx.restore();
      T.draw(ctx, 'BUTTERFLIES', SW / 2, 78, { size: 14, align: 'c', color: c.gold, outline: '#2a1a08', shadow: '#000' });
      T.draw(ctx, 'пиксельная энтомологическая игра: ловим бабочек по всему миру', SW / 2, 104, { size: 8, align: 'c', color: c.text, shadow: '#000' });
      T.draw(ctx, BIOME_BY_ID.ocean.secret ? `8 биомов · ${REAL} реальных видов · и одно место, которого нет на карте…` : `9 биомов · ${SPECIES.length} видов · тайна океана раскрыта`, SW / 2, 116, { size: 8, align: 'c', color: c.dim, shadow: '#000' });
      this.hover = -1; this.btns.forEach((b, i) => { const h = UIK.hit(b, m.x, m.y); if (h) this.hover = i; UIK.btn(ctx, b, h); });
      T.draw(ctx, '© Flora0world: HUB · данные о видах — по открытым источникам', SW / 2, SH - 12, { size: 8, align: 'c', color: '#6a8a78' });
    },
    click(x, y) { const b = this.btns.find(b => UIK.hit(b, x, y)); return b ? b.id : null; },
  };

  // ------------------------------------------------------------------ WORLD MAP
  function buildMapCanvas() {
    const cv = document.createElement('canvas'); cv.width = MAP_W; cv.height = MAP_H; const x = cv.getContext('2d'); const d = x.createImageData(MAP_W, MAP_H); const nz = new Noise2(5);
    const land = (i, j) => (i >= 0 && j >= 0 && i < MAP_W && j < MAP_H) ? MAP_ROWS[j][i] === '1' : false;
    for (let j = 0; j < MAP_H; j++) for (let i = 0; i < MAP_W; i++) {
      const lon = i / MAP_W * 360 - 180, lat = MAP_LAT_TOP - j / MAP_H * (MAP_LAT_TOP - MAP_LAT_BOT); const o = (j * MAP_W + i) * 4; let col;
      const n = nz.fbm(i * 0.18, j * 0.18, 3), n2 = nz.at(i * 0.9, j * 0.9);
      if (land(i, j)) {
        const al = Math.abs(lat); let base;
        if (al > 66) base = '#dce8ec'; else if (al > 55) base = '#4e7058'; else if (al > 40) base = '#5a8a42'; else if (al > 25) base = '#7a9a4a'; else if (al > 12) base = '#a0a050'; else base = '#3c7e3a';
        if (lat > 14 && lat < 33 && lon > -16 && lon < 58) base = '#d8bc7c';
        if (lat < -19 && lat > -33 && lon > 118 && lon < 146) base = '#d4b070';
        if (lat > 36 && lat < 48 && lon > 85 && lon < 118) base = '#b8a878';
        if (lat > 30 && lat < 38 && lon > -118 && lon < -105) base = '#c8b070';
        if (lat < -20 && lat > -34 && lon > 12 && lon < 24) base = '#c8b078';
        col = hex2rgb(base); const k = 0.9 + n * 0.22 + (n2 - 0.5) * 0.08; col = col.map(v => v * k);
        if (!land(i, j - 1) || !land(i - 1, j) || !land(i + 1, j) || !land(i, j + 1)) col = col.map(v => v * 0.62);
        else if (!land(i - 1, j - 1) || !land(i + 1, j + 1)) col = col.map(v => v * 0.85);
      } else {
        let near = 0; for (let dj = -2; dj <= 2; dj++) for (let di = -2; di <= 2; di++) if (land(i + di, j + dj)) near = Math.max(near, 3 - Math.max(Math.abs(di), Math.abs(dj)));
        col = hex2rgb('#3a6a88').map(v => v * (0.85 + n * 0.25 + near * 0.06)); if (near === 0 && ((i + j * 2) % 7 === 0) && n2 > 0.5) col = col.map(v => v + 14);
      }
      d.data[o] = col[0]; d.data[o + 1] = col[1]; d.data[o + 2] = col[2]; d.data[o + 3] = 255;
    }
    x.putImageData(d, 0, 0);
    // tiny mountain glyphs
    x.fillStyle = '#6a5a48'; [[28, 85], [46, 9], [44, 100], [45, -110], [-15, -70], [-30, -70], [60, 60], [36, 138], [5, 116], [-1, 35], [40, 71], [62, -150]].forEach(([lat, lon]) => { const px = Math.round((lon + 180) / 360 * MAP_W), py = Math.round((MAP_LAT_TOP - lat) / (MAP_LAT_TOP - MAP_LAT_BOT) * MAP_H); x.fillRect(px, py - 1, 1, 1); x.fillRect(px - 1, py, 3, 1); x.fillStyle = '#f0ece0'; x.fillRect(px, py - 1, 1, 1); x.fillStyle = '#6a5a48'; });
    return cv;
  }
  const MAPX = 40, MAPY = 30, MS = 2;
  const pinPos = b => ({ x: MAPX + (b.lon + 180) / 360 * MAP_W * MS, y: MAPY + (MAP_LAT_TOP - b.lat) / (MAP_LAT_TOP - MAP_LAT_BOT) * MAP_H * MS });
  const wmap = {
    sel: -1, hover: -1, btns: [], t0: 0,
    layout() { this.btns = [{ id: 'back', label: '← Назад', x: 8, y: 8, w: 62, h: 16 }, { id: 'cabinet', label: 'Кабинет', x: 76, y: 8, w: 78, h: 16 }, { id: 'journal', label: `Коллекция ${collText()}`, x: SW - 128, y: 8, w: 120, h: 16 }]; this.go = { id: 'go', label: 'В ПУТЬ ›', x: SW - 76, y: SH - 28, w: 68, h: 20, size: 10, disabled: this.sel < 0 }; },
    draw(ctx, t, m) {
      this.layout(); if (!mapCanvas) mapCanvas = buildMapCanvas();
      ctx.fillStyle = '#10201c'; ctx.fillRect(0, 0, SW, SH);
      // wooden desk
      for (let i = 0; i < 24; i++) { ctx.fillStyle = i % 2 ? '#2e2018' : '#34261c'; ctx.fillRect(i * 20, 0, 20, SH); } ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, SW, SH);
      T.draw(ctx, 'Выбери место для ловли', SW / 2, 10, { size: 10, align: 'c', color: c.gold, shadow: '#000' });
      // parchment frame
      UIK.panel(ctx, MAPX - 8, MAPY - 6, MAP_W * MS + 16, MAP_H * MS + 12, { fill: c.parch, border: '#5a3a1c' }); ctx.strokeStyle = '#8a6a3a'; ctx.strokeRect(MAPX - 5.5, MAPY - 3.5, MAP_W * MS + 11, MAP_H * MS + 6);
      ctx.imageSmoothingEnabled = false; ctx.drawImage(mapCanvas, MAPX, MAPY, MAP_W * MS, MAP_H * MS);
      // graticule
      ctx.fillStyle = 'rgba(40,24,8,0.35)'; for (let lon = -150; lon <= 150; lon += 30) { const px = MAPX + (lon + 180) / 360 * MAP_W * MS; for (let y = MAPY; y < MAPY + MAP_H * MS; y += 4) ctx.fillRect(Math.round(px), y, 1, 1); }
      for (let lat = -30; lat <= 60; lat += 30) { const py = MAPY + (MAP_LAT_TOP - lat) / (MAP_LAT_TOP - MAP_LAT_BOT) * MAP_H * MS; for (let x = MAPX; x < MAPX + MAP_W * MS; x += 4) ctx.fillRect(x, Math.round(py), 1, 1); T.draw(ctx, (lat > 0 ? lat + '°N' : lat < 0 ? -lat + '°S' : '0°'), MAPX + 2, py - 9, { size: 8, color: 'rgba(40,24,8,0.7)' }); }
      // compass
      const cx = MAPX + 22, cy = MAPY + MAP_H * MS - 22; ctx.fillStyle = '#4a2a10'; ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx + 3, cy); ctx.lineTo(cx, cy + 12); ctx.lineTo(cx - 3, cy); ctx.fill(); ctx.fillStyle = '#b02a1c'; ctx.beginPath(); ctx.moveTo(cx, cy - 12); ctx.lineTo(cx + 3, cy); ctx.lineTo(cx - 3, cy); ctx.fill(); ctx.fillStyle = '#4a2a10'; ctx.fillRect(cx - 12, cy, 24, 1); T.draw(ctx, 'N', cx, cy - 22, { size: 8, align: 'c', color: '#3a2008' });
      // pins
      this.hover = -1;
      BIOMES.forEach((b, i) => { const p = pinPos(b); if (Math.hypot(m.x - p.x, m.y - (p.y - 6)) < 9) this.hover = i; });
      BIOMES.forEach((b, i) => {
        const p = pinPos(b); const cnt = Save.biomeCount(b); const done = cnt === b.species.length; const sel = i === this.sel, hov = i === this.hover; const bob = sel || hov ? Math.round(Math.sin(t * 6) * 1.5) : 0; const col = biomeCol[b.id];
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(p.x - 3, p.y, 7, 2);
        ctx.fillStyle = '#1a0e06'; ctx.fillRect(p.x - 4, p.y - 13 + bob, 9, 9); ctx.fillRect(p.x - 2, p.y - 5 + bob, 5, 4); ctx.fillRect(p.x - 1, p.y - 2 + bob, 3, 2);
        ctx.fillStyle = col; ctx.fillRect(p.x - 3, p.y - 12 + bob, 7, 7); ctx.fillRect(p.x - 1, p.y - 5 + bob, 3, 3); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(p.x - 2, p.y - 11 + bob, 2, 2);
        if (done) { ctx.fillStyle = c.gold; ctx.fillRect(p.x - 1, p.y - 17 + bob, 3, 3); ctx.fillRect(p.x - 2, p.y - 16 + bob, 5, 1); }
        if (sel) { ctx.strokeStyle = c.gold; ctx.strokeRect(p.x - 7.5, p.y - 16.5 + bob, 15, 17); }
        T.draw(ctx, String(i + 1), p.x, p.y - 12 + bob, { size: 8, align: 'c', color: '#10201c' });
        if (hov || sel) T.draw(ctx, short[b.id], p.x, p.y + 2, { size: 8, align: 'c', color: '#2a1608', outline: '#f4e8c0' });
      });
      // info panel
      const b = BIOMES[this.sel >= 0 ? this.sel : this.hover >= 0 ? this.hover : 0]; const show = this.sel >= 0 || this.hover >= 0;
      const py0 = MAPY + MAP_H * MS + 10; UIK.panel(ctx, 8, py0, SW - 16, SH - py0 - 6, { fill: 'rgba(16,32,28,0.92)' });
      const iy = py0 + 4;
      if (!show) { T.draw(ctx, 'Наведи на булавку и выбери биом. Цифры 1–9 — быстрый выбор.', SW / 2, iy + 22, { size: 8, align: 'c', color: c.dim }); }
      else {
        T.draw(ctx, b.name, 14, iy, { size: 10, color: biomeCol[b.id] });
        if (b.secret) { T.draw(ctx, `${b.place} · ${Math.abs(b.lat).toFixed(1)}°S ${Math.abs(b.lon).toFixed(1)}°W`, 14, iy + 13, { size: 8, color: c.dim }); T.para(ctx, b.desc, 14, iy + 25, 250, { size: 8, color: c.text, lh: 10 }); for (let k = 0; k < 18; k++) { ctx.fillStyle = '#1a2a2a'; ctx.fillRect(276 + (k % 9) * 22, iy + Math.floor(k / 9) * 11, 20, 10); T.draw(ctx, '?', 286 + (k % 9) * 22, iy + Math.floor(k / 9) * 11 + 1, { size: 8, align: 'c', color: Math.random() < 0.02 ? c.red : '#4a6a60' }); } T.draw(ctx, `поймано ${Save.biomeCount(b)} из ???`, 276, iy + 45, { size: 8, color: c.text }); T.draw(ctx, fit(b.climate, 116), 276, iy + 56, { size: 8, color: c.red }); } else {
        T.draw(ctx, `${b.place} · ${Math.abs(b.lat).toFixed(1)}°${b.lat >= 0 ? 'N' : 'S'} ${Math.abs(b.lon).toFixed(1)}°${b.lon >= 0 ? 'E' : 'W'}`, 14, iy + 13, { size: 8, color: c.dim });
        T.para(ctx, b.desc, 14, iy + 25, 250, { size: 8, color: c.text, lh: 10 });
        b.species.forEach((sp, k) => { const has = Save.has(sp.id); ctx.imageSmoothingEnabled = false; ctx.drawImage(Art.specimen(sp, !has, '#587868'), 276 + (k % 9) * 22, iy + Math.floor(k / 9) * 11, 20, 10); });
        T.draw(ctx, `поймано ${Save.biomeCount(b)} из ${b.species.length}`, 276, iy + 45, { size: 8, color: c.text });
        T.draw(ctx, fit(`${b.alt} · ${b.climate}`, 116), 276, iy + 56, { size: 8, color: c.dim });
        }
      }
      this.btns.forEach(bt => UIK.btn(ctx, bt, UIK.hit(bt, m.x, m.y))); UIK.btn(ctx, this.go, !this.go.disabled && UIK.hit(this.go, m.x, m.y));
    },
    click(x, y) {
      const bt = this.btns.find(b => UIK.hit(b, x, y)); if (bt) return bt.id;
      if (!this.go.disabled && UIK.hit(this.go, x, y)) return 'go';
      if (this.hover >= 0) { if (this.sel === this.hover) return 'go'; this.sel = this.hover; Snd.sfx.pin(); return 'sel'; }
      return null;
    },
  };

  // ------------------------------------------------------------------ JOURNAL (entomological drawer)
  const journal = {
    tab: 0, sel: 0, btns: [], slots: [], tabs: [],
    layout() {
      this.tabs = BIOMES.map((b, i) => ({ id: 'tab' + i, i, x: 6 + i * 53, y: 22, w: 51, h: 15 }));
      this.slots = []; const b = BIOMES[this.tab]; this.sel = clamp(this.sel, 0, b.species.length - 1); this.page = Math.floor(this.sel / 6); this.pages = Math.ceil(b.species.length / 6);
      b.species.forEach((sp, k) => { if (Math.floor(k / 6) !== this.page) return; const j = k % 6; this.slots.push({ k, sp, x: 10 + (j % 2) * 103, y: 46 + Math.floor(j / 2) * 72, w: 101, h: 68 }); });
      this.pgBtns = [{ id: 'prev', label: '←', x: 262, y: 4, w: 22, h: 15, disabled: this.page === 0 }, { id: 'next', label: '→', x: 350, y: 4, w: 22, h: 15, disabled: this.page >= this.pages - 1 }];
      this.close = { id: 'close', label: 'Закрыть ✕', x: SW - 82, y: 4, w: 74, h: 15 };
    },
    draw(ctx, t, m) {
      this.layout(); const b = BIOMES[this.tab];
      ctx.fillStyle = '#1c1410'; ctx.fillRect(0, 0, SW, SH); for (let i = 0; i < SW; i += 3) { ctx.fillStyle = (i % 9 === 0) ? '#241a14' : '#201610'; ctx.fillRect(i, 0, 3, SH); }
      T.draw(ctx, 'Энтомологическая коллекция', 8, 6, { size: 10, color: c.gold }); T.draw(ctx, collText(), 200, 7, { size: 8, color: c.text });
      this.tabs.forEach(tb => { const on = tb.i === this.tab, hv = UIK.hit(tb, m.x, m.y); const bb = BIOMES[tb.i]; const full = Save.biomeCount(bb) === bb.species.length; UIK.panel(ctx, tb.x, tb.y, tb.w, tb.h, { fill: on ? '#4a3220' : hv ? '#34261a' : '#2a1e16', border: on ? c.gold : '#5a4430' }); T.draw(ctx, short[bb.id], tb.x + tb.w / 2, tb.y + 3, { size: 8, align: 'c', color: on ? '#fff' : full ? c.gold : '#c8b898' }); });
      // drawer with cork
      UIK.panel(ctx, 6, 42, 216, 222, { fill: '#6a4a2a', border: '#2a1a0c' }); ctx.fillStyle = '#c8a870'; ctx.fillRect(9, 45, 210, 216);
      for (let i = 0; i < 240; i++) { const x = 9 + (i * 97) % 210, y = 45 + (i * 53) % 216; ctx.fillStyle = i % 3 ? '#b89860' : '#d8b880'; ctx.fillRect(x, y, 2, 1); }
      this.slots.forEach(s => {
        const has = Save.has(s.sp.id), on = s.k === this.sel, hv = UIK.hit(s, m.x, m.y);
        ctx.fillStyle = on ? 'rgba(240,200,90,0.35)' : hv ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.0)'; ctx.fillRect(s.x, s.y, s.w, s.h); if (on) { ctx.strokeStyle = c.gold; ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1); }
        ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 0.5; ctx.fillStyle = '#000'; ctx.fillRect(s.x + 12, s.y + 44, 78, 2); ctx.globalAlpha = 1;
        ctx.drawImage(Art.specimen(s.sp, !has), s.x + 11, s.y + 5, 80, 40);
        if (has) { ctx.fillStyle = '#111'; ctx.fillRect(s.x + 50, s.y + 15, 2, 2); }
        ctx.fillStyle = '#f2ead0'; ctx.fillRect(s.x + 4, s.y + 50, s.w - 8, 14); ctx.fillStyle = '#8a7650'; ctx.fillRect(s.x + 4, s.y + 63, s.w - 8, 1);
        T.draw(ctx, has ? fit(s.sp.ru, s.w - 12) : '??? Не найдено', s.x + s.w / 2, s.y + 52, { size: 8, align: 'c', color: has ? '#2a1a0c' : '#8a7a5a' });
      });
      // detail page
      const sp = b.species[this.sel], has = Save.has(sp.id), x0 = 228, w0 = SW - x0 - 6;
      UIK.panel(ctx, x0, 42, w0, 222, { fill: '#e8dcb4', border: '#5a3a1c' }); ctx.fillStyle = '#d4c494'; ctx.fillRect(x0 + 2, 44, w0 - 4, 1);
      ctx.fillStyle = '#c8a870'; ctx.fillRect(x0 + 6, 48, 164, 84); ctx.imageSmoothingEnabled = false; ctx.drawImage(Art.specimen(sp, !has), x0 + 8, 50, 160, 80);
      if (has) { ctx.fillStyle = '#111'; ctx.fillRect(x0 + 86, 72, 3, 3); }
      const ink = '#2a1a0c', dim = '#6a5030'; const tx = x0 + 8, tw = w0 - 16;
      // stat box
      const sx = x0 + 176, sw2 = w0 - 182; UIK.panel(ctx, sx, 48, sw2, 84, { fill: '#f6efd0', border: '#a8946a', shadow: false });
      const cu = Save.data.caught[sp.id];
      T.draw(ctx, 'Размах', sx + 4, 51, { size: 8, color: dim }); T.draw(ctx, has ? `${sp.mm[0]}–${sp.mm[1]} мм${sp.approx ? '≈' : ''}` : `≈${sp.mm[0]}–${sp.mm[1]} мм`, sx + 4, 60, { size: 8, color: ink });
      T.draw(ctx, 'Семейство', sx + 4, 72, { size: 8, color: dim }); T.draw(ctx, sp.fam, sx + 4, 81, { size: 8, color: ink });
      T.draw(ctx, 'Редкость', sx + 4, 93, { size: 8, color: dim }); for (let i = 0; i < 3; i++) { const on = i < sp.rar; const px = sx + 50 + i * 8, py = 94; ctx.fillStyle = on ? '#d8a020' : '#cdbf94'; ctx.fillRect(px + 2, py, 3, 7); ctx.fillRect(px, py + 2, 7, 3); ctx.fillRect(px + 1, py + 1, 5, 5); }
      T.draw(ctx, has ? `Поймано ×${cu.count}` : 'Не поймано', sx + 4, 106, { size: 8, color: has ? '#2a6a2a' : dim }); T.draw(ctx, has ? fmtDate(cu.first) : '—', sx + 4, 115, { size: 8, color: ink });
      let y = 136; const bottom = 262, lh = 9; let left = 0;
      const take = (str, want, reserve, col, fx = tx) => { const lines = T.wrap(str, tw, 8); const n = Math.max(1, Math.min(lines.length, want, left - reserve)); if (left <= 0) return; for (let i = 0; i < n; i++) { let l = lines[i]; if (i === n - 1 && n < lines.length) l = fit(l + ' ' + lines[i + 1], tw); T.draw(ctx, l, tx, y, { size: 8, color: col }); y += lh; left--; } y += 1; };
      if (has) {
        T.draw(ctx, sp.ru, tx, y, { size: 10, color: ink }); y += 12; T.draw(ctx, fit(sp.la + ' · ' + sp.en, tw), tx, y, { size: 8, color: '#8a2a1a' }); y += 12;
        left = Math.floor((bottom - y) / lh);
        take('Среда: ' + sp.hab, 3, 6, ink); take('Ареал: ' + sp.range, 3, 4, ink); take('Корм: ' + sp.host, 1, 3, ink); take('★ ' + sp.fact, 4, 1, '#5a3a10'); take('Поймано в: ' + BIOME_BY_ID[cu.place].place, 1, 0, dim);
      } else {
        T.draw(ctx, '??? ???', tx, y, { size: 10, color: ink }); y += 13; T.draw(ctx, 'Вид ещё не найден', tx, y, { size: 8, color: dim }); y += 13;
        left = Math.floor((bottom - y) / lh);
        take(b.secret ? 'Где искать: ???. Что-то мерцает в темноте…' : `Где искать: ${b.name} (${b.place}). ${sp.look}.`, 4, 3, ink); take('Поймай бабочку сачком — и подробности о среде, ареале и повадках появятся в журнале.', 4, 0, '#8a6a3a');
      }
      this.pgBtns.forEach(bt => UIK.btn(ctx, bt, !bt.disabled && UIK.hit(bt, m.x, m.y))); T.draw(ctx, `стр. ${this.page + 1}/${this.pages}`, 317, 7, { size: 8, align: 'c', color: c.text });
      UIK.btn(ctx, this.close, UIK.hit(this.close, m.x, m.y));
    },
    turn(d) { const b = BIOMES[this.tab]; const pg = clamp(Math.floor(this.sel / 6) + d, 0, Math.ceil(b.species.length / 6) - 1); this.sel = Math.min(pg * 6, b.species.length - 1); Snd.sfx.page(); },
    click(x, y) {
      if (UIK.hit(this.close, x, y)) return 'close';
      const pb = this.pgBtns.find(b => !b.disabled && UIK.hit(b, x, y)); if (pb) { this.turn(pb.id === 'next' ? 1 : -1); return 'page'; }
      const tb = this.tabs.find(t => UIK.hit(t, x, y)); if (tb) { this.tab = tb.i; this.sel = 0; Snd.sfx.page(); return 'tab'; }
      const s = this.slots.find(s => UIK.hit(s, x, y)); if (s) { this.sel = s.k; Snd.sfx.click(); return 'slot'; }
      return null;
    },
  };

  // ------------------------------------------------------------------ PAUSE / HELP overlays
  const pause = {
    btns: [],
    layout(play) {
      const s = Save.data.settings; const x = SW / 2 - 90; this.btns = [
        { id: 'resume', label: 'Продолжить', x, y: 78, w: 180, h: 20, size: 10 },
        { id: 'journal', label: 'Журнал (Tab)', x, y: 101, w: 180, h: 16 },
        { id: 'cabinet', label: 'Кабинет энтомолога', x, y: 120, w: 180, h: 16 },
        { id: 'help', label: 'Управление', x, y: 139, w: 180, h: 16 },
        { id: 'sound', label: s.sound ? 'Звук: вкл' : 'Звук: выкл', x, y: 158, w: 88, h: 16 },
        { id: 'music', label: s.music ? 'Музыка: вкл' : 'Музыка: выкл', x: x + 92, y: 158, w: 88, h: 16 },
        { id: 'quality', label: s.quality === 'low' ? 'Качество: низкое (быстрее)' : 'Качество: высокое (тени)', x, y: 177, w: 180, h: 16 },
        { id: 'regen', label: 'Сгенерировать новую местность', x, y: 196, w: 180, h: 16 },
        { id: 'map', label: 'Выбрать другое место', x, y: 215, w: 180, h: 16 },
      ];
    },
    draw(ctx, t, m, play) {
      this.layout(play); ctx.fillStyle = 'rgba(4,12,10,0.7)'; ctx.fillRect(0, 0, SW, SH);
      UIK.panel(ctx, SW / 2 - 106, 38, 212, 218, { fill: 'rgba(16,32,28,0.96)', border: c.gold });
      T.draw(ctx, 'Пауза', SW / 2, 44, { size: 14, align: 'c', color: c.gold }); T.draw(ctx, `${play.biome.name} · зерно ${play.seed}`, SW / 2, 63, { size: 8, align: 'c', color: c.dim });
      this.btns.forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y)));
      T.draw(ctx, `Видов в этом биоме поймано: ${Save.biomeCount(play.biome)} / ${play.biome.secret ? '???' : play.biome.species.length}`, SW / 2, 236, { size: 8, align: 'c', color: c.text });
    },
    click(x, y) { const b = this.btns.find(b => UIK.hit(b, x, y)); return b ? b.id : null; },
  };
  const help = {
    draw(ctx, t, m) {
      ctx.fillStyle = 'rgba(4,12,10,0.84)'; ctx.fillRect(0, 0, SW, SH); UIK.panel(ctx, 56, 14, 368, 244, { fill: 'rgba(16,32,28,0.97)', border: c.gold });
      T.draw(ctx, 'Как ловить бабочек', SW / 2, 22, { size: 14, align: 'c', color: c.gold });
      const rows = [['WASD', 'ходьба'], ['Мышь', 'осмотреться'], ['ЛКМ / Пробел', 'взмах сачка'], ['Ctrl / C', 'красться: тихий шаг'], ['Shift', 'бег (бабочки пугаются)'], ['H', 'нюх: стрелка к ближайшей бабочке'], ['Tab', 'журнал-коллекция'], ['F', 'полный экран'], ['Esc', 'пауза']];
      rows.forEach((r, i) => { T.draw(ctx, r[0], 76, 46 + i * 12, { size: 8, color: c.green }); T.draw(ctx, r[1], 180, 46 + i * 12, { size: 8, color: c.text }); });
      T.para(ctx, 'Бабочки сидят на цветах и летают между ними. Чем громче шум (шкала слева внизу), тем раньше они улетают: подкрадывайтесь с Ctrl и делайте взмах, когда прицел зеленеет. Каждый вид живёт в своём биоме и у каждого свой нрав: одни любят цветущие луга, другие — спелые плоды, соль у воды или кроны деревьев.', 76, 162, 330, { size: 8, color: c.dim, lh: 10 });
      T.draw(ctx, 'нажмите любую клавишу или кнопку мыши', SW / 2, 240, { size: 8, align: 'c', color: c.gold });
    },
  };
  const loading = {
    draw(ctx, t, text) {
      nightBackdrop(ctx, t, 0.35); T.draw(ctx, text || 'Загрузка…', SW / 2, 126, { size: 14, align: 'c', color: c.gold, shadow: '#000' });
      const f = SPECIES[((Math.floor(Math.abs(t) * 0.7) % SPECIES.length) + SPECIES.length) % SPECIES.length]; const fl = Math.abs(Math.cos(t * 9)) * 0.8 + 0.2; ctx.imageSmoothingEnabled = false; ctx.drawImage(Art.specimen(f), 0, 0, 80, 40, SW / 2 - 40 * fl, 150, 80 * fl, 40);
    },
  };
  return { title, wmap, journal, pause, help, loading, nightBackdrop, biomeCol, short };
})();
