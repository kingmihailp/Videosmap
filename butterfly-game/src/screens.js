// ---------------------------------------------------------------- menu screens (all drawn on the 480x270 UI canvas)
const collText = () => { const sec = BIOME_BY_ID.ocean.secret; const mine = SPECIES.filter(s => !s.mystery && Maps.allowed(s.biome)); const have = mine.filter(s => Save.has(s.id)).length; return `${have}/${mine.length}`; };
const Screens = (() => {
  const c = UIK.col;
  const short = { ocean: '???', russia: 'Луг РФ', alps: 'Альпы', med: 'Греция', amazon: 'Амазония', borneo: 'Борнео', kenya: 'Кения', prairie: 'Прерия', japan: 'Япония', bog: 'Болото', papua: 'Н. Гвинея', vietnam: 'Вьетнам' };
  const biomeCol = { ocean: '#c0304a', russia: '#7ac04a', alps: '#8ab8e8', med: '#c8a860', amazon: '#2e9a4a', borneo: '#3ec0a0', kenya: '#e8b040', prairie: '#c8c850', japan: '#e86a8a', bog: '#8aa860', papua: '#38c070', vietnam: '#e0903a' };
  const fit = (str, maxW, size = 8) => { if (T.width(str, size) <= maxW) return str; while (str.length > 1 && T.width(str + '…', size) > maxW) str = str.slice(0, -1); return str + '…'; };
  const R = new Rng(2024);
  const fireflies = Array.from({ length: 34 }, () => ({ x: R.range(0, SW), y: R.range(110, 250), sp: R.range(0.3, 1), ph: R.range(0, 6.28), a: R.range(6, 22) }));
  const stars = Array.from({ length: 70 }, () => ({ x: R.range(0, SW), y: R.range(0, 120), b: R.range(0.3, 1), ph: R.range(0, 6.28) }));
  const flyers = SPECIES.filter((s, i) => i % 5 === 0).slice(0, 8).map((sp, i) => ({ sp, x: R.range(-60, SW), y: R.range(40, 190), v: R.range(14, 30), ph: R.range(0, 6.28), a: R.range(8, 22), s: R.range(0.5, 1) }));
  const pines = Array.from({ length: 18 }, (_, i) => ({ x: i * 28 + R.range(-6, 6), h: R.range(34, 64), w: R.range(10, 15) }));
  let mapCanvas = null;

  // everything in the menu backdrop is drawn with whole pixels only (no anti-aliased paths or smooth gradients)
  function pine(ctx, x, base, h, w) {
    for (let k = 0; k < 5; k++) { const yy = base - h + k * h / 5.2, ww = w * (0.35 + k * 0.22), y0 = Math.round(yy - h / 5), y1 = Math.round(yy + h / 4.4);
      for (let y = y0; y <= y1; y++) { const hw = Math.round(ww * (y - y0) / Math.max(1, y1 - y0)); ctx.fillRect(x - hw, y, hw * 2 + 1, 1); } }
    ctx.fillRect(x - 1, base - 4, 3, 4);
  }
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  let skyImg = null;
  function skyCache() {                       // night sky + moon + moon glow, pre-rendered once with ordered dithering
    if (skyImg) return skyImg; const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH; const x = cv.getContext('2d'); const im = x.createImageData(SW, SH), d = im.data;
    const stops = [[0, [8, 20, 44]], [0.6, [22, 58, 82]], [1, [36, 90, 84]]], N = 12, MX = 392, MY = 52;
    const col = t => { const i = t < 0.6 ? 0 : 1, A = stops[i], B = stops[i + 1], u = (t - A[0]) / (B[0] - A[0]); return A[1].map((v, k) => v + (B[1][k] - v) * u); };
    for (let y = 0; y < SH; y++) for (let xx = 0; xx < SW; xx++) {
      const bay = (BAYER[(y & 3) * 4 + (xx & 3)] + 0.5) / 16; let c = col(Math.min(1, Math.floor(y / SH * N + bay) / N));
      const dx = xx - MX, dy = y - MY, dist = Math.hypot(dx, dy);
      if (dist > 16 && dist < 80) { const glow = 0.4 * (1 - (dist - 16) / 64); if (glow * 0.6 > bay * 0.22) c = c.map((v, k) => v + ([120, 150, 200][k] - v) * 0.28); }
      if (dist <= 16) { c = [238, 232, 192]; for (const [cx, cy, cr] of [[-5, -4, 3], [4, 3, 4], [-3, 8, 2], [6, -6, 2]]) if (Math.hypot(dx - cx, dy - cy) <= cr) c = [216, 210, 168]; }
      const o = (y * SW + xx) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    x.putImageData(im, 0, 0); return skyImg = cv;
  }
  function nightBackdrop(ctx, t, dim = 0) {
    ctx.imageSmoothingEnabled = false; ctx.drawImage(skyCache(), 0, 0);
    for (const s of stars) { const a = 0.35 + 0.65 * Math.abs(Math.sin(t * s.b + s.ph)); ctx.fillStyle = `rgba(230,240,255,${a * s.b})`; ctx.fillRect(Math.round(s.x), Math.round(s.y), 1, 1); }
    const sc = t * 3, hillY = wx => 164 + Math.sin(wx * 0.03) * 10 + Math.sin(wx * 0.09) * 5;                 // the hill scrolls with the trees, so the trees stay planted on it
    ctx.fillStyle = '#0e2a3a'; for (let x = 0; x < SW; x++) { const hy = Math.round(hillY(x + sc)); ctx.fillRect(x, hy, 1, SH - hy); }
    ctx.fillStyle = '#0a2230'; pines.forEach(p => { const sx = ((p.x - sc) % (SW + 40) + (SW + 40)) % (SW + 40) - 20; pine(ctx, Math.round(sx), Math.round(hillY(sx + sc)) + 7, Math.round(p.h), Math.round(p.w)); });
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
        { id: 'play', label: 'Играть', x, y: 138, w, h: 20, size: 10 },
        { id: 'journal', label: `Коллекция  ${collText()}`, x, y: 162, w, h: 16, size: 8 },
        { id: 'cabinet', label: 'Кабинет энтомолога', x, y: 181, w, h: 16, size: 8 },
        { id: 'mp', label: Net.on ? `Онлайн: ${Net.count()} · ${Net.name}` : 'Мультиплеер', x, y: 200, w, h: 16, size: 8 },
        { id: 'help', label: 'Управление', x, y: 219, w: 68, h: 16 },
        { id: 'sound', label: s.sound ? 'Звук: вкл' : 'Звук: выкл', x: x + 72, y: 219, w: 68, h: 16 },
        { id: 'keys', label: 'Клавиши управления', x, y: 238, w, h: 16 },
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
      this.hover = -1; this.btns.forEach((b, i) => { const h = UIK.hit(b, m.x, m.y); if (h) this.hover = i; UIK.btn(ctx, b, h); });
      T.draw(ctx, '© Flora0world: HUB · данные о видах — по открытым источникам', SW / 2, SH - 12, { size: 8, align: 'c', color: '#6a8a78' });
    },
    click(x, y) { const b = this.btns.find(b => UIK.hit(b, x, y)); return b ? b.id : null; },
  };

  // ------------------------------------------------------------------ MULTIPLAYER (connect to a server)
  const mp = {
    fields: [{ id: 'addr', label: 'Адрес сервера', val: '', max: 60 }, { id: 'name', label: 'Ваше имя', val: '', max: 16 }], focus: 0, msg: '', busy: false, btns: [], inited: false,
    init() { if (this.inited) return; this.inited = true; let d = {}; try { d = JSON.parse(localStorage.getItem('f0w_mp') || '{}'); } catch (e) {} this.fields[0].val = d.addr || Net.defaultUrl(); this.fields[1].val = d.name || ''; },
    layout() {
      const x = SW / 2 - 110; this.rect = { x: SW / 2 - 140, y: 36, w: 280, h: 200 };
      this.fr = this.fields.map((f, i) => ({ id: 'f' + i, i, x, y: 90 + i * 34, w: 220, h: 16 }));
      this.btns = Net.on ? [{ id: 'disc', label: 'Отключиться', x, y: 190, w: 106, h: 18 }, { id: 'back', label: '← Назад', x: x + 114, y: 190, w: 106, h: 18 }]
        : [{ id: 'connect', label: this.busy ? 'Подключение…' : 'Подключиться', x, y: 190, w: 106, h: 18, size: 8, disabled: this.busy }, { id: 'back', label: '← Назад', x: x + 114, y: 190, w: 106, h: 18 }, { id: 'info', label: this.info ? 'К форме' : 'Как играть вместе?', x, y: 212, w: 220, h: 16 }];
      if (this.info) this.btns = [{ id: 'info', label: 'К форме', x, y: 212, w: 220, h: 16 }, { id: 'back', label: '← Назад', x, y: 192, w: 220, h: 16 }];
      else if (Net.on) this.btns.push({ id: 'info', label: this.info ? 'К списку' : 'Как играть вместе?', x, y: 212, w: 220, h: 16 });
    },
    draw(ctx, t, m) {
      this.init(); this.layout(); nightBackdrop(ctx, t, 0.45); const r = this.rect;
      UIK.panel(ctx, r.x, r.y, r.w, r.h, { fill: 'rgba(16,32,28,0.95)', border: c.gold });
      T.draw(ctx, 'Мультиплеер', SW / 2, r.y + 8, { size: 14, align: 'c', color: c.gold });
      if (this.info) {
        let yy = r.y + 26; [['ЗАПУСК СЕРВЕРА', c.gold], ['В папке server: npm install, затем node server.js [порт] (по умолчанию 3000). Откройте http://<адрес>:3000 — сервер сам отдаёт игру, адрес подставится сам.', c.text], ['ОБЩЕЕ', c.gold], ['Локации и бабочки, кабинет, коробки, стена, стол. Бабочку получает тот, кто поймал первым. Расправлять и раскладывать можно и чужих бабочек.', c.text], ['ЛИЧНОЕ', c.gold], ['Дневник и настройки.', c.text]].forEach(([tx, col]) => { yy += T.para(ctx, tx, r.x + 14, yy, 252, { size: 8, color: col, lh: 10 }) + 2; });
      } else if (Net.on) {
        T.draw(ctx, `Вы в сети: ${Net.name}`, SW / 2, r.y + 34, { size: 8, align: 'c', color: c.green }); T.draw(ctx, Net.url, SW / 2, r.y + 46, { size: 8, align: 'c', color: c.dim });
        T.draw(ctx, `Игроки онлайн (${Net.count()}):`, r.x + 16, r.y + 66, { size: 8, color: c.text });
        Net.list.slice(0, 8).forEach((p, i) => T.draw(ctx, `${p.name}${p.id === Net.id ? ' (вы)' : ''} — ${p.loc ? (p.loc === 'cabinet' ? 'кабинет' : p.loc === 'market' ? 'рынок' : p.loc === 'museum' ? 'музей' : (short[p.loc] || p.loc)) : 'на карте'}`, r.x + 22, r.y + 80 + i * 10, { size: 8, color: p.id === Net.id ? c.gold : c.dim }));
        T.draw(ctx, 'Локации, бабочки и кабинет общие для всех на сервере', SW / 2, r.y + 172, { size: 8, align: 'c', color: '#6a8a78' });
      } else {
        T.draw(ctx, 'Общие локации, бабочки и кабинет энтомолога', SW / 2, r.y + 24, { size: 8, align: 'c', color: c.dim });
        if (!this.info) this.fr.forEach(fr => { const f = this.fields[fr.i], on = this.focus === fr.i; T.draw(ctx, f.label, fr.x, fr.y - 11, { size: 8, color: c.text }); UIK.panel(ctx, fr.x, fr.y, fr.w, fr.h, { fill: '#0a1612', border: on ? c.gold : c.line, shadow: false }); const txt = f.val; const w = T.width(txt, 8); const sh = Math.max(0, w - (fr.w - 8)); ctx.save(); ctx.beginPath(); ctx.rect(fr.x + 2, fr.y + 1, fr.w - 4, fr.h - 2); ctx.clip(); T.draw(ctx, txt, fr.x + 4 - sh, fr.y + 4, { size: 8, color: '#fff' }); if (on && Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = c.gold; ctx.fillRect(fr.x + 4 - sh + w + 1, fr.y + 3, 1, 10); } ctx.restore(); });
      }
      if (this.msg) T.draw(ctx, this.msg, SW / 2, r.y + 150, { size: 8, align: 'c', color: this.msg.startsWith('Подкл') ? c.dim : c.red });
      this.btns.forEach(b => UIK.btn(ctx, b, !b.disabled && UIK.hit(b, m.x, m.y)));
    },
    click(x, y) { const f = this.fr.find(f => UIK.hit(f, x, y)); if (f && !Net.on && !this.info) { this.focus = f.i; return null; } const b = this.btns.find(b => !b.disabled && UIK.hit(b, x, y)); return b ? b.id : null; },
    key(e) {
      const f = this.fields[this.focus];
      if (e.code === 'Escape') return 'back'; if (e.code === 'Enter') return Net.on ? null : 'connect';
      if (Net.on) return null;
      if (e.code === 'Tab' || e.code === 'ArrowDown' || e.code === 'ArrowUp') { this.focus = (this.focus + 1) % this.fields.length; return null; }
      if (e.code === 'Backspace') { f.val = f.val.slice(0, -1); return null; }
      if ((e.ctrlKey || e.metaKey) && e.code === 'KeyV') { try { navigator.clipboard.readText().then(tx => { f.val = (f.val + tx.replace(/[\r\n]/g, '')).slice(0, f.max); }); } catch (er) {} return null; }
      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && f.val.length < f.max) f.val += e.key;
      return null;
    },
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
    layout() { this.btns = [{ id: 'back', label: '← Назад', x: 8, y: 8, w: 62, h: 16 }, { id: 'cabinet', label: 'Кабинет', x: 76, y: 8, w: 62, h: 16 }, { id: 'market', label: 'Рынок', x: 142, y: 8, w: 52, h: 16 }, { id: 'journal', label: `Коллекция ${collText()}`, x: SW - 128, y: 8, w: 120, h: 16 }]; this.go = { id: 'go', label: 'В ПУТЬ ›', x: SW - 76, y: SH - 28, w: 68, h: 20, size: 10, disabled: this.sel < 0 }; },
    draw(ctx, t, m) {
      this.layout(); if (!mapCanvas) mapCanvas = buildMapCanvas();
      ctx.fillStyle = '#10201c'; ctx.fillRect(0, 0, SW, SH);
      // wooden desk
      for (let i = 0; i < 24; i++) { ctx.fillStyle = i % 2 ? '#2e2018' : '#34261c'; ctx.fillRect(i * 20, 0, 20, SH); } ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(0, 0, SW, SH);
      T.draw(ctx, 'Выбери место для ловли', 266, 11, { size: 8, align: 'c', color: c.gold, shadow: '#000' });
      if (window.F0W && F0W.mapNote && performance.now() < F0W.mapNote.until) { const w = T.width(F0W.mapNote.text, 8) + 16; UIK.panel(ctx, 266 - w / 2, 22, w, 16, { fill: 'rgba(60,16,16,0.94)', border: '#c85a3a' }); T.draw(ctx, F0W.mapNote.text, 266, 26, { size: 8, align: 'c', color: '#ffd8c0' }); }
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
      visibleBiomes().forEach((b, i) => { const p = pinPos(b); if (Math.hypot(m.x - p.x, m.y - (p.y - 6)) < 9) this.hover = i; });
      visibleBiomes().forEach((b, i) => {
        const p = pinPos(b); const cnt = Save.biomeCount(b); const done = cnt === b.species.length; const sel = i === this.sel, hov = i === this.hover; const bob = sel || hov ? Math.round(Math.sin(t * 6) * 1.5) : 0; const col = biomeCol[b.id];
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(p.x - 3, p.y, 7, 2);
        ctx.fillStyle = '#1a0e06'; ctx.fillRect(p.x - 4, p.y - 13 + bob, 9, 9); ctx.fillRect(p.x - 2, p.y - 5 + bob, 5, 4); ctx.fillRect(p.x - 1, p.y - 2 + bob, 3, 2);
        ctx.fillStyle = col; ctx.fillRect(p.x - 3, p.y - 12 + bob, 7, 7); ctx.fillRect(p.x - 1, p.y - 5 + bob, 3, 3); ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(p.x - 2, p.y - 11 + bob, 2, 2);
        if (done) { ctx.fillStyle = c.gold; ctx.fillRect(p.x - 1, p.y - 17 + bob, 3, 3); ctx.fillRect(p.x - 2, p.y - 16 + bob, 5, 1); }
        if (sel) { ctx.strokeStyle = c.gold; ctx.strokeRect(p.x - 7.5, p.y - 16.5 + bob, 15, 17); }
        { const n = String(i + 1); if (n.length === 1) T.draw(ctx, n, p.x + 1, p.y - 13 + bob, { size: 8, align: 'c', color: '#10201c' }); else { T.draw(ctx, n[0], p.x - 1, p.y - 13 + bob, { size: 8, align: 'c', color: '#10201c' }); T.draw(ctx, n[1], p.x + 3, p.y - 13 + bob, { size: 8, align: 'c', color: '#10201c' }); } }      // the 3x5 glyph sits in the middle of the 7x7 marker; pins past the ninth have two digits
        if (hov || sel) T.draw(ctx, short[b.id], p.x, p.y + 2, { size: 8, align: 'c', color: '#2a1608', outline: '#f4e8c0' });
      });
      // other players: small figures next to the pin of the place they are in, a roster in the corner, names when a pin is hovered
      if (Net.on && Net.list && Net.list.length) {
        const by = {}; for (const pl of Net.list) (by[pl.loc || '_'] = by[pl.loc || '_'] || []).push(pl);
        const col = n => { let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return `hsl(${h % 360},55%,42%)`; };
        const person = (x, y, pl) => { x = Math.round(x); y = Math.round(y); ctx.fillStyle = '#1a0e06'; ctx.fillRect(x - 1, y - 1, 7, 12); ctx.fillStyle = '#e8c8a0'; ctx.fillRect(x + 1, y, 3, 3); ctx.fillStyle = col(pl.name); ctx.fillRect(x, y + 3, 5, 5); ctx.fillStyle = '#2a2a34'; ctx.fillRect(x + 1, y + 8, 1, 2); ctx.fillRect(x + 3, y + 8, 1, 2); if (pl.id === Net.id) { ctx.fillStyle = c.gold; ctx.fillRect(x - 1, y + 11, 7, 1); } };
        visibleBiomes().forEach((b, i) => {
          const L = by[b.id]; if (!L) return; const p = pinPos(b); L.slice(0, 4).forEach((pl, k) => person(p.x + 8 + k * 8, p.y - 12, pl));
          if (L.length > 4) T.draw(ctx, '+' + (L.length - 4), p.x + 8 + 4 * 8, p.y - 10, { size: 8, color: '#2a1608', outline: '#f4e8c0' });
          if (i === this.hover) { const w = Math.max(...L.map(pl => T.width(pl.name + (pl.id === Net.id ? ' (вы)' : ''), 8))) + 10, h = L.length * 10 + 6, x = clamp(p.x + 8, 4, SW - w - 4), y = Math.max(MAPY + 2, p.y - 18 - h); UIK.panel(ctx, x, y, w, h, { fill: 'rgba(16,32,28,0.95)', border: c.gold }); L.forEach((pl, k) => T.draw(ctx, pl.name + (pl.id === Net.id ? ' (вы)' : ''), x + 5, y + 4 + k * 10, { size: 8, color: pl.id === Net.id ? c.gold : '#fff' })); }
        });
        const where = pl => pl.loc === 'cabinet' ? 'в кабинете' : pl.loc === 'market' ? 'на рынке' : pl.loc === 'museum' ? 'в музее' : pl.loc && short[pl.loc] && Maps.allowed(pl.loc) ? short[pl.loc] : 'на карте';
        const rows = Net.list.slice(0, 8).map(pl => [pl.name + (pl.id === Net.id ? ' (вы)' : ''), where(pl), pl.id === Net.id]); const w1 = Math.max(...rows.map(r => T.width(r[0], 8))), w2 = Math.max(...rows.map(r => T.width(r[1], 8))), pw = w1 + w2 + 24, ph = rows.length * 10 + 18;
        const px = MAPX + MAP_W * MS - pw - 6, py = MAPY + MAP_H * MS - ph - 6; UIK.panel(ctx, px, py, pw, ph, { fill: 'rgba(16,32,28,0.88)', border: c.line, shadow: false });
        T.draw(ctx, `Онлайн: ${Net.list.length}`, px + 6, py + 4, { size: 8, color: c.green }); rows.forEach((r, k) => { T.draw(ctx, r[0], px + 6, py + 16 + k * 10, { size: 8, color: r[2] ? c.gold : '#fff' }); T.draw(ctx, r[1], px + pw - 6, py + 16 + k * 10, { size: 8, align: 'r', color: c.dim }); });
      }
      // info panel
      const VB = visibleBiomes(); const b = VB[this.sel >= 0 && this.sel < VB.length ? this.sel : this.hover >= 0 ? this.hover : 0]; const show = this.sel >= 0 || this.hover >= 0;
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
      const VB = visibleBiomes(), tw = Math.min(51, Math.floor(468 / VB.length) - 2), ts = Math.min(53, 468 / VB.length); this.tab = Math.min(this.tab, VB.length - 1); this.tabs = VB.map((b, i) => ({ id: 'tab' + i, i, x: 6 + Math.round(i * ts), y: 22, w: tw, h: 15 }));
      this.slots = []; const b = VB[this.tab]; this.sel = clamp(this.sel, 0, b.species.length - 1); this.page = Math.floor(this.sel / 6); this.pages = Math.ceil(b.species.length / 6);
      b.species.forEach((sp, k) => { if (Math.floor(k / 6) !== this.page) return; const j = k % 6; this.slots.push({ k, sp, x: 10 + (j % 2) * 103, y: 46 + Math.floor(j / 2) * 72, w: 101, h: 68 }); });
      this.pgBtns = [{ id: 'prev', label: '←', x: 262, y: 4, w: 22, h: 15, disabled: this.page === 0 }, { id: 'next', label: '→', x: 350, y: 4, w: 22, h: 15, disabled: this.page >= this.pages - 1 }];
      this.close = { id: 'close', label: 'Закрыть ✕', x: SW - 82, y: 4, w: 74, h: 15 };
      this.fragRect = (this.tab === VB.length - 1 && this.page === this.pages - 1 && !Secret.has(4)) ? { x: SW - 6 - 84, y: 204, w: 76, h: 56 } : null;     // the last piece of the note, taped to the last page
    },
    draw(ctx, t, m) {
      if (this.ab && this.ab.tab !== this.tab) this.ab = null;
      if (this.ab) return this.drawAb(ctx, t, m);
      this.layout(); const b = visibleBiomes()[this.tab];
      ctx.fillStyle = '#1c1410'; ctx.fillRect(0, 0, SW, SH); for (let i = 0; i < SW; i += 3) { ctx.fillStyle = (i % 9 === 0) ? '#241a14' : '#201610'; ctx.fillRect(i, 0, 3, SH); }
      T.draw(ctx, 'Энтомологическая коллекция', 8, 6, { size: 10, color: c.gold }); T.draw(ctx, collText() + (Save.aberrTotal() ? `  · аберр. ${Save.aberrTotal()}` : ''), 200, 7, { size: 8, color: c.text });
      this.tabs.forEach(tb => { const on = tb.i === this.tab, hv = UIK.hit(tb, m.x, m.y); const bb = visibleBiomes()[tb.i]; const full = Save.biomeCount(bb) === bb.species.length; UIK.panel(ctx, tb.x, tb.y, tb.w, tb.h, { fill: on ? '#4a3220' : hv ? '#34261a' : '#2a1e16', border: on ? c.gold : '#5a4430' }); T.draw(ctx, short[bb.id], tb.x + tb.w / 2, tb.y + 3, { size: 8, align: 'c', color: on ? '#fff' : full ? c.gold : '#c8b898' }); });
      // drawer with cork
      UIK.panel(ctx, 6, 42, 216, 222, { fill: '#6a4a2a', border: '#2a1a0c' }); ctx.fillStyle = '#c8a870'; ctx.fillRect(9, 45, 210, 216);
      for (let i = 0; i < 240; i++) { const x = 9 + (i * 97) % 210, y = 45 + (i * 53) % 216; ctx.fillStyle = i % 3 ? '#b89860' : '#d8b880'; ctx.fillRect(x, y, 2, 1); }
      this.slots.forEach(s => {
        const has = Save.has(s.sp.id), on = s.k === this.sel, hv = UIK.hit(s, m.x, m.y);
        ctx.fillStyle = on ? 'rgba(240,200,90,0.35)' : hv ? 'rgba(255,255,255,0.18)' : 'rgba(0,0,0,0.0)'; ctx.fillRect(s.x, s.y, s.w, s.h); if (on) { ctx.strokeStyle = c.gold; ctx.strokeRect(s.x + 0.5, s.y + 0.5, s.w - 1, s.h - 1); }
        ctx.imageSmoothingEnabled = false; ctx.globalAlpha = 0.5; ctx.fillStyle = '#000'; ctx.fillRect(s.x + 12, s.y + 44, 78, 2); ctx.globalAlpha = 1;
        ctx.drawImage(Art.specimen(s.sp, !has), s.x + 11, s.y + 5, 80, 40);
        if (has) { ctx.fillStyle = '#111'; ctx.fillRect(s.x + 50, s.y + 15, 2, 2); }
        { const plus = (cx, c1, c2) => { ctx.fillStyle = c1; ctx.fillRect(cx, s.y + 5, 1, 5); ctx.fillRect(cx - 2, s.y + 7, 5, 1); ctx.fillStyle = c2; ctx.fillRect(cx, s.y + 7, 1, 1); };      // a purple cross: an aberration is caught; a red one: a rare find (both side by side)
          const ab = has && Save.aberrants(s.sp.id).length > 0, rare = has && Rare.is(s.sp); if (ab) plus(s.x + s.w - 9, '#c0309a', '#ff9ae8'); if (rare) plus(s.x + s.w - 9 - (ab ? 8 : 0), '#d02028', '#ff8a8a'); }
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
      let y = 136; const abl = has ? Save.aberrants(sp.id) : [], bottom = this.fragRect ? 200 : abl.length ? 240 : 262, lh = 9; let left = 0; this.abBtn = null;
      if (abl.length) { this.abBtn = { id: 'ab', label: `Аберранты (${abl.length})`, x: x0 + 8, y: 244, w: w0 - 16, h: 15 }; UIK.btn(ctx, this.abBtn, UIK.hit(this.abBtn, m.x, m.y)); }
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
      if (this.fragRect) { const f = this.fragRect, hv = UIK.hit(f, m.x, m.y); ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(f.x + 3, f.y + 3, f.w, f.h); ctx.imageSmoothingEnabled = false; ctx.drawImage(Secret.paperCanvas('01'), f.x, f.y, f.w, f.h); ctx.fillStyle = 'rgba(216,200,128,0.85)'; ctx.fillRect(f.x + 4, f.y - 2, 16, 6); ctx.fillRect(f.x + f.w - 20, f.y - 2, 16, 6); if (hv) { ctx.strokeStyle = c.gold; ctx.strokeRect(f.x - 0.5, f.y - 0.5, f.w + 1, f.h + 1); T.draw(ctx, 'Забрать обрывок', f.x + f.w / 2, f.y - 12, { size: 8, align: 'c', color: '#2a1a0c' }); } }
      if (this.msgUntil && performance.now() < this.msgUntil) T.draw(ctx, this.msg, 12, 252, { size: 8, color: c.gold, shadow: '#000' });
      this.pgBtns.forEach(bt => UIK.btn(ctx, bt, !bt.disabled && UIK.hit(bt, m.x, m.y))); T.draw(ctx, `стр. ${this.page + 1}/${this.pages}`, 317, 7, { size: 8, align: 'c', color: c.text });
      UIK.btn(ctx, this.close, UIK.hit(this.close, m.x, m.y));
    },
    escape() { if (this.ab) { this.ab = null; Snd.sfx.page(); return true; } return false; },
    drawAb(ctx, t, m) {
      const ab = this.ab, base = SPECIES_BY_ID[ab.base], list = Save.aberrants(ab.base).slice().reverse(), PER = 6; ab.pages = Math.max(1, Math.ceil(list.length / PER)); ab.page = clamp(ab.page, 0, ab.pages - 1);
      ctx.fillStyle = '#1c1410'; ctx.fillRect(0, 0, SW, SH); for (let i = 0; i < SW; i += 3) { ctx.fillStyle = (i % 9 === 0) ? '#241a14' : '#201610'; ctx.fillRect(i, 0, 3, SH); }
      T.draw(ctx, 'Аберранты: ' + base.ru, 8, 6, { size: 10, color: c.gold }); T.draw(ctx, `${list.length} найдено · ${base.la}`, 8, 19, { size: 8, color: c.dim });
      this.abBtns = [{ id: 'abback', label: '← К виду', x: SW - 164, y: 4, w: 78, h: 15 }, { id: 'abprev', label: '←', x: 168, y: 4, w: 22, h: 15, disabled: ab.page === 0 }, { id: 'abnext', label: '→', x: 256, y: 4, w: 22, h: 15, disabled: ab.page >= ab.pages - 1 }];
      this.close = { id: 'close', label: 'Закрыть ✕', x: SW - 82, y: 4, w: 74, h: 15 };
      this.abBtns.forEach(bt => UIK.btn(ctx, bt, !bt.disabled && UIK.hit(bt, m.x, m.y))); UIK.btn(ctx, this.close, UIK.hit(this.close, m.x, m.y)); T.draw(ctx, `стр. ${ab.page + 1}/${ab.pages}`, 223, 7, { size: 8, align: 'c', color: c.text });
      // the regular form for comparison
      UIK.panel(ctx, 8, 34, 464, 40, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false }); ctx.fillStyle = '#c8a870'; ctx.fillRect(12, 36, 84, 36); ctx.imageSmoothingEnabled = false; ctx.drawImage(Art.specimen(base), 14, 34, 80, 40);
      T.draw(ctx, 'Обычная форма вида', 104, 40, { size: 8, color: '#2a1a0c' }); T.draw(ctx, `Размах ${base.mm[0]}–${base.mm[1]} мм · ${base.fam}`, 104, 52, { size: 8, color: '#6a5030' });
      T.draw(ctx, 'Аберранты — редкие отклонения окраски, рисунка и размера', 104, 63, { size: 8, color: '#8a2a1a' });
      list.slice(ab.page * PER, ab.page * PER + PER).forEach((rec, i) => {
        const sp = SPECIES_BY_ID[base.id + '~' + rec.code]; if (!sp) return; const x = 8 + (i % 2) * 235, y = 80 + Math.floor(i / 2) * 61, w = 229, h = 58, hv = UIK.hit({ x, y, w, h }, m.x, m.y);
        UIK.panel(ctx, x, y, w, h, { fill: hv ? '#f0e6c0' : '#e8dcb4', border: '#5a3a1c', shadow: false }); ctx.fillStyle = '#c8a870'; ctx.fillRect(x + 3, y + 3, 84, 44); ctx.drawImage(Art.specimen(sp), x + 5, y + 5, 80, 40);
        T.draw(ctx, `ab. ${sp.ab.name}`, x + 92, y + 4, { size: 8, color: '#8a2a1a' }); T.draw(ctx, '#' + rec.code, x + w - 6, y + 4, { size: 8, align: 'r', color: '#6a5030' });
        const lines = T.wrap(sp.ab.desc.join(', '), w - 98, 8); lines.slice(0, 3).forEach((l, k) => T.draw(ctx, l, x + 92, y + 15 + k * 9, { size: 8, color: '#2a1a0c' }));
        T.draw(ctx, `${sp.mm[0]}–${sp.mm[1]} мм`, x + 5, y + 48, { size: 8, color: '#6a5030' }); T.draw(ctx, `${fmtDate(rec.first)} · ${short[rec.place] || ''}`, x + w - 6, y + 47, { size: 8, align: 'r', color: '#6a5030' });
      });
      if (!list.length) T.draw(ctx, 'Пока ни одного аберранта', SW / 2, 150, { size: 8, align: 'c', color: c.dim });
    },
    turn(d) { if (this.ab) { this.ab.page = clamp(this.ab.page + d, 0, (this.ab.pages || 1) - 1); Snd.sfx.page(); return; } const b = visibleBiomes()[this.tab]; const pg = clamp(Math.floor(this.sel / 6) + d, 0, Math.ceil(b.species.length / 6) - 1); this.sel = Math.min(pg * 6, b.species.length - 1); Snd.sfx.page(); },
    click(x, y) {
      if (UIK.hit(this.close, x, y)) return 'close';
      if (!this.ab && this.fragRect && UIK.hit(this.fragRect, x, y)) { if (Secret.take(4)) { this.msg = 'Обрывок записки: 01. Он лежит на складе (I).'; this.msgUntil = performance.now() + 4500; Snd.sfx.coin(); } return 'frag'; }
      if (this.ab) { const bt = (this.abBtns || []).find(b => !b.disabled && UIK.hit(b, x, y)); if (bt) { if (bt.id === 'abback') this.ab = null; else this.turn(bt.id === 'abnext' ? 1 : -1); Snd.sfx.page(); return 'ab'; } return null; }
      if (this.abBtn && UIK.hit(this.abBtn, x, y)) { this.ab = { base: visibleBiomes()[this.tab].species[this.sel].id, page: 0, tab: this.tab }; Snd.sfx.page(); return 'ab'; }
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
      const x = SW / 2 - 90; this.btns = [
        { id: 'resume', label: 'Продолжить', x, y: 78, w: 180, h: 20, size: 10 },
        { id: 'journal', label: 'Журнал (Tab)', x, y: 104, w: 180, h: 16 },
        { id: 'cabinet', label: 'Кабинет энтомолога', x, y: 124, w: 180, h: 16 },
        { id: 'help', label: 'Управление', x, y: 144, w: 88, h: 16 },
        { id: 'stash', label: 'Склад (I)', x: x + 92, y: 144, w: 88, h: 16 },
        { id: 'settings', label: 'Настройки', x, y: 164, w: 180, h: 16 },
        { id: 'regen', label: 'Сгенерировать новую местность', x, y: 184, w: 180, h: 16 },
        { id: 'map', label: 'Выбрать другое место', x, y: 204, w: 180, h: 16 },
        { id: 'title', label: 'Выход в главное меню', x, y: 224, w: 180, h: 16 },
      ];
    },
    draw(ctx, t, m, play) {
      this.layout(play); ctx.fillStyle = 'rgba(4,12,10,0.7)'; ctx.fillRect(0, 0, SW, SH);
      UIK.panel(ctx, SW / 2 - 106, 38, 212, 222, { fill: 'rgba(16,32,28,0.96)', border: c.gold });
      T.draw(ctx, 'Пауза', SW / 2, 44, { size: 14, align: 'c', color: c.gold }); T.draw(ctx, `${play.biome.name} · зерно ${play.seed}`, SW / 2, 63, { size: 8, align: 'c', color: c.dim });
      this.btns.forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y)));
      T.draw(ctx, `Видов в этом биоме поймано: ${Save.biomeCount(play.biome)} / ${play.biome.secret ? '???' : play.biome.species.length}`, SW / 2, 246, { size: 8, align: 'c', color: c.text });
    },
    click(x, y) { const b = this.btns.find(b => UIK.hit(b, x, y)); return b ? b.id : null; },
  };
  // ------------------------------------------------------------------ SETTINGS (modal over any pause menu)
  const settings = {
    btns: [],
    layout() {
      const s = Save.data.settings, x = SW / 2 - 90, inPlay = !!(window.F0W && F0W.screen === 'play' && F0W.play); let y = 76; const out = [];
      out.push({ id: 'sound', label: s.sound ? 'Звук: вкл' : 'Звук: выкл', x, y, w: 88, h: 16 }, { id: 'music', label: s.music ? 'Музыка: вкл' : 'Музыка: выкл', x: x + 92, y, w: 88, h: 16 }); y += 22;
      if (inPlay) { out.push({ id: 'quality', label: s.quality === 'low' ? 'Качество: низкое (быстрее)' : 'Качество: высокое (тени)', x, y, w: 180, h: 16 }); y += 22; }
      out.push({ id: 'keys', label: 'Клавиши управления', x, y, w: 180, h: 16 }); y += 22;
      if (inPlay) { out.push({ id: 'card', label: 'Карточка улова: положение и размер', x, y, w: 180, h: 16 }); y += 22; }
      out.push({ id: 'back', label: 'Назад', x, y: y + 6, w: 180, h: 20, size: 10 }); this.btns = out; this.h = y + 34 - 52;
    },
    draw(ctx, t, m) {
      this.layout(); ctx.fillStyle = 'rgba(4,12,10,0.93)'; ctx.fillRect(0, 0, SW, SH);
      UIK.panel(ctx, SW / 2 - 106, 52, 212, this.h, { fill: 'rgba(16,32,28,0.98)', border: c.gold });
      T.draw(ctx, 'Настройки', SW / 2, 58, { size: 14, align: 'c', color: c.gold });
      this.btns.forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y)));
    },
    click(x, y) { this.layout(); const b = this.btns.find(b => UIK.hit(b, x, y)); return b ? b.id : null; },
  };
  // ------------------------------------------------------------------ KEY BINDINGS
  const keysScr = {
    wait: -1, btns: [], rows: [], msg: '',
    layout() {
      const x0 = SW / 2 - 130; this.rows = Keys.ACTIONS.map((a, i) => ({ id: 'row' + i, i, x: x0, y: 34 + i * 13, w: 260, h: 11 }));
      this.btns = [{ id: 'reset', label: 'Сбросить', x: SW / 2 - 130, y: 235, w: 80, h: 16 }, { id: 'back', label: 'Готово', x: SW / 2 - 40, y: 235, w: 170, h: 16, size: 10 }];
    },
    draw(ctx, t, m) {
      this.layout(); ctx.fillStyle = 'rgba(4,12,10,0.88)'; ctx.fillRect(0, 0, SW, SH); UIK.panel(ctx, SW / 2 - 150, 10, 300, 252, { fill: 'rgba(16,32,28,0.97)', border: c.gold });
      T.draw(ctx, 'Клавиши управления', SW / 2, 16, { size: 14, align: 'c', color: c.gold });
      this.rows.forEach(r => {
        const a = Keys.ACTIONS[r.i], hot = UIK.hit(r, m.x, m.y) || this.wait === r.i;
        UIK.panel(ctx, r.x, r.y, r.w, r.h, { fill: hot ? 'rgba(40,70,58,0.95)' : 'rgba(10,22,18,0.9)', border: this.wait === r.i ? c.gold : c.line, shadow: false });
        T.draw(ctx, a.ru, r.x + 6, r.y + 1, { size: 8, color: c.text });
        T.draw(ctx, this.wait === r.i ? 'нажмите клавишу…' : Keys.name(Keys.bound(a.id)), r.x + r.w - 6, r.y + 1, { size: 8, align: 'r', color: this.wait === r.i ? c.gold : c.green });
      });
      T.draw(ctx, this.msg || 'Нажмите на действие, затем на новую клавишу (Esc — отмена)', SW / 2, 222, { size: 8, align: 'c', color: this.msg ? c.red : c.dim });
      this.btns.forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y)));
    },
    click(x, y) {                                   // returns true when the screen should close
      this.layout(); this.msg = ''; const b = this.btns.find(b => UIK.hit(b, x, y));
      if (b) { Snd.sfx.click(); if (b.id === 'back') { this.wait = -1; return true; } if (b.id === 'reset') { Keys.reset(); this.wait = -1; } return false; }
      const r = this.rows.find(r => UIK.hit(r, x, y)); this.wait = r ? (this.wait === r.i ? -1 : r.i) : -1; if (r) Snd.sfx.click(); return false;
    },
    key(e) {                                        // raw key presses; returns true when the screen should close
      if (this.wait >= 0) {
        if (e.code === 'Escape') { this.wait = -1; return false; }
        if (['ShiftLeft', 'ShiftRight', 'ControlLeft', 'ControlRight', 'AltLeft', 'AltRight'].indexOf(e.code) >= 0 && e.type === 'keydown' && false) return false;
        if (Keys.set(Keys.ACTIONS[this.wait].id, e.code)) { Snd.sfx.click(); this.msg = ''; } else this.msg = 'Эту клавишу назначить нельзя';
        this.wait = -1; return false;
      }
      if (e.code === 'Escape') return true; return false;
    },
  };
  // move / scale the catch card
  const cardpos = {
    drag: null, btns: [],
    draw(ctx, t, m, play) {
      const st = Play.CARD_SCALES, cs = Save.data.settings.card || (Save.data.settings.card = {}); let P = play.cardPos();
      if (this.drag) { const w = 214 * P.s, h = 62 * P.s; cs.x = clamp(m.x - this.drag.dx, 0, SW - w); cs.y = clamp(m.y - this.drag.dy, 0, SH - h); P = play.cardPos(); }
      ctx.fillStyle = 'rgba(4,12,10,0.45)'; ctx.fillRect(0, 0, SW, SH);
      ctx.strokeStyle = c.green; ctx.setLineDash([3, 3]); ctx.strokeRect(Math.round(P.x) - 2.5, Math.round(P.y) - 2.5, P.w + 5, P.h + 5); ctx.setLineDash([]);
      const sp = play.pool[0]; play.drawCard(ctx, { sp, first: true, t: 3, d: 6, count: 1 }, 0, P);
      UIK.panel(ctx, SW / 2 - 150, SH - 70, 300, 30, { fill: 'rgba(16,32,28,0.95)', border: c.gold });
      T.draw(ctx, 'Перетащи карточку улова в любое место экрана', SW / 2, SH - 66, { size: 8, align: 'c', color: c.text });
      T.draw(ctx, `Размер: ${Math.round(P.s * 100)}%  (колесо мыши тоже меняет)`, SW / 2, SH - 54, { size: 8, align: 'c', color: c.dim });
      const y = SH - 34; this.btns = [
        { id: 'smaller', label: '-', x: SW / 2 - 130, y, w: 30, h: 18, size: 10 }, { id: 'bigger', label: '+', x: SW / 2 - 96, y, w: 30, h: 18, size: 10 },
        { id: 'reset', label: 'Сброс', x: SW / 2 - 58, y, w: 56, h: 18 }, { id: 'done', label: 'Готово', x: SW / 2 + 6, y, w: 124, h: 18, size: 10 },
      ];
      this.btns.forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y)));
    },
    step(play, d) { const cs = Save.data.settings.card || (Save.data.settings.card = {}), P = play.cardPos(), st = Play.CARD_SCALES; let i = st.indexOf(P.s); cs.s = clamp(i + d, 0, st.length - 1); cs.x = P.x; cs.y = P.y; Save.write(); },
    press(x, y, play) {                                // returns an id when a button was hit, otherwise starts a drag when the card was hit
      const b = this.btns.find(b => UIK.hit(b, x, y)); if (b) {
        if (b.id === 'smaller') this.step(play, -1); else if (b.id === 'bigger') this.step(play, 1); else if (b.id === 'reset') { delete Save.data.settings.card; Save.write(); }
        return b.id;
      }
      const P = play.cardPos(); if (x >= P.x && x <= P.x + P.w && y >= P.y && y <= P.y + P.h) this.drag = { dx: x - P.x, dy: y - P.y }; return null;
    },
    release() { if (this.drag) { this.drag = null; Save.write(); } },
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
  return { pinPos, title, wmap, journal, pause, cardpos, settings, keys: keysScr, help, loading, mp, nightBackdrop, biomeCol, short };
})();
