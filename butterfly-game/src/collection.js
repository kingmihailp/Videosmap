// ---------------------------------------------------------------- the collector: what a framed collection is worth, and the wings of the guiding butterfly (the way to the ocean)
// A frame (box) that is not hung up can be sold to the collector of the insect market. Its price is the price of the frame (by size) + the price of every butterfly in it
// (spread quality, aberration and, for the three rarest finds, a rarity bonus) 
// multiplied by a coefficient for every pattern the whole frame follows (only aberrations x1.7, only rare x1.9, one species x1.2, one family x1.5, one location x1.4, one colour x1.2, only different butterflies x1.5).
const Collection = (() => {
  const FRAME = { S: 100, M: 200, L: 300 }, RARE_K = 1.5;
  const baseOf = sp => SPECIES_BY_ID[sp.base] || sp;
  // a rough colour name of a butterfly (from its forewing colour)
  function colourOf(sp) {
    const a = sp.art, hex = a && ((a.f && a.f[0]) || (a.h && a.h[0])); if (!hex || typeof hex !== 'string' || hex[0] !== '#') return null;
    const n = parseInt(hex.slice(1), 16), r = (n >> 16 & 255) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn, s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    let h = 0; if (d) { h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h = (h * 60 + 360) % 360; }
    if (l < 0.2) return 'тёмные'; if (l > 0.78 && s < 0.6) return 'белые'; if (s < 0.18) return 'серые';
    if (h < 15 || h >= 345) return 'красные'; if (h < 38) return l < 0.42 ? 'коричневые' : 'рыжие'; if (h < 70) return 'жёлтые'; if (h < 170) return 'зелёные'; if (h < 255) return 'голубые и синие'; return 'фиолетовые и розовые';
  }
  // how well a sequence of keys runs in a row: the sum of the squares of the lengths of the runs of equal keys, over n squared (all equal = 1, alternating = about 1/n)
  const purity = keys => { const n = keys.length; if (!n) return 0; let sum = 0, run = 1; for (let i = 1; i <= n; i++) { if (i < n && keys[i] === keys[i - 1] && keys[i] !== null) run++; else { sum += run * run; run = 1; } } return sum / (n * n); };
  // every pattern that holds for the whole frame multiplies the price of the collection (frame + butterflies) by its coefficient; the coefficients of all the patterns multiply together
  const THEMES = [
    { id: 'aberr', k: 1.7, key: (sp) => sp.ab ? 'ab' : 'n', only: 'ab', name: () => 'только аберранты' },
    { id: 'rarity', k: 1.9, key: (sp) => Rare.is(sp) ? 'rare' : 'other', only: 'rare', name: () => 'только редкие' },
    { id: 'species', k: 1.2, key: (sp) => baseOf(sp).id, name: (sp) => `один вид: ${baseOf(sp).ru}` },
    { id: 'family', k: 1.5, key: (sp) => baseOf(sp).fam, name: (sp) => `одно семейство: ${baseOf(sp).fam}` },
    { id: 'biome', k: 1.4, key: (sp) => baseOf(sp).biome, name: (sp) => `одна локация: ${(BIOME_BY_ID[baseOf(sp).biome] || {}).short || (BIOME_BY_ID[baseOf(sp).biome] || {}).place || baseOf(sp).biome}` },
    { id: 'colour', k: 1.2, key: (sp) => colourOf(sp), name: (sp) => `один цвет: ${colourOf(sp)}` },
    { id: 'distinct', k: 1.5, distinct: true, key: (sp) => baseOf(sp).id, name: () => 'только разные бабочки' },
  ];
  function info(box) {
    const rows = []; for (const u of box.items) { if (!u) continue; const spec = Save.spec(u); if (!spec) continue; const sp = SPECIES_BY_ID[spec.sp]; if (!sp) continue; const i = Econ.info(spec); const rare = Rare.is(sp); rows.push({ spec, sp, ab: !!sp.ab, rare, price: Math.round((i ? i.price : 0) * (rare ? RARE_K : 1)), base: i ? i.price : 0 }); }
    const n = rows.length, cap = box.items.length, frame = FRAME[box.size] || 100, sum = rows.reduce((a, r) => a + r.price, 0), need = Math.max(3, Math.ceil(cap / 2));
    const themes = [];                                                                     // every pattern that holds for ALL the butterflies in the frame
    if (n >= need) {
      for (const t of THEMES) {
        const keys = rows.map(r => t.key(r.sp, r.spec)); if (keys.some(k => k === null || k === undefined)) continue;
        const ok = t.only ? keys.every(k => k === t.only) : t.distinct ? new Set(keys).size === n : keys.every(k => k === keys[0]);
        if (ok) themes.push({ id: t.id, coef: t.k, name: t.name(rows[0].sp) });
      }
    }
    const baseSum = frame + sum, mult = themes.reduce((a, t) => a * t.coef, 1), total = Math.round(baseSum * mult), bonus = total - baseSum, theme = themes[0] || null;
    return { n, cap, frame, rows, sum, theme, themes, mult, baseSum, bonus, total, need };
  }
  return { FRAME, RARE_K, info, colourOf, purity };
})();

// ---------------------------------------------------------------- the wings of the guiding butterfly: one per starting location whose butterflies are all caught; eight of them in a frame buy the map of the ocean
const Wings = (() => {
  const START = BIOMES.filter(b => !b.secret && !b.map);
  const st = () => Save.data.wing || (Save.data.wing = { have: {}, placed: {}, built: false, done: false });
  const name = b => b.wingName || b.short || (b.place || b.name).split(',')[0];
  const api = {
    START, name,
    have: id => !!st().have[id], placed: id => !!st().placed[id], built: () => !!st().built, done: () => !!st().done,
    count: () => START.filter(b => st().have[b.id]).length, inStash: () => START.filter(b => st().have[b.id] && !st().placed[b.id]).length, inFrame: () => START.filter(b => st().placed[b.id]).length,
    // grant the wings of every starting location whose butterflies are all caught; returns the locations that are new
    check() {
      const out = [], W = st(); for (const b of START) { if (!W.have[b.id] && b.species.length && Save.biomeCount(b) >= b.species.length) { W.have[b.id] = true; out.push(b); } }
      // the ocean was open before: whoever has already caught its butterflies keeps the map
      if (!Maps.has('ocean') && SPECIES.some(s => s.biome === 'ocean' && Save.has(s.id))) Maps.grant('ocean');
      if (out.length) Save.write(); return out;
    },
    announce(list, toast) { if (list.length && toast) { toast(list.length === 1 ? `Все бабочки здесь пойманы! На склад (I) положено крыло путеводной бабочки: ${name(list[0])}` : `На склад (I) положено ${list.length} крыльев путеводной бабочки`, 6, true); } },
    place(id) { const W = st(); if (!W.have[id] || W.placed[id] || W.built) return false; W.placed[id] = true; Save.write(); return true; },
    take(id) { const W = st(); if (!W.placed[id] || W.built) return false; delete W.placed[id]; Save.write(); return true; },
    build() { const W = st(); if (W.built || W.done || api.inFrame() < START.length) return false; W.built = true; Save.write(); return true; },
    // the collector buys the finished frame: the price of an ordinary large frame, and the map of the ocean on top
    sell() { const W = st(); if (!W.built) return null; W.built = false; W.done = true; W.placed = {}; const coins = Collection.FRAME.L; Save.data.coins = (Save.data.coins || 0) + coins; Maps.grant('ocean'); Save.write(); return { coins }; },
  };
  return api;
})();

// ---------------------------------------------------------------- the cabinet side of the wings: the picture on the easel and the 2D overlay where the wings are laid into the frame
const WingsUI = (() => {
  const guide = () => SPECIES_BY_ID.lux_ductrix || SPECIES[0];
  // the left half of the guiding butterfly (one wing), drawn into a rectangle; tint dims it when it is not in the frame yet
  function drawWing(ctx, x, y, w, h, alpha, tint) {
    const a = Art.specimen(guide()); ctx.save(); ctx.imageSmoothingEnabled = false; ctx.globalAlpha = alpha; ctx.drawImage(a, 0, 0, a.width / 2, a.height, x, y, w, h);
    if (tint) { ctx.globalCompositeOperation = 'source-atop'; ctx.fillStyle = tint; ctx.fillRect(x, y, w, h); } ctx.restore();
  }
  // the whole frame as a texture for the easel: 4 x 2 cells, one wing per starting location
  function tex() {
    const cv = document.createElement('canvas'); cv.width = 160; cv.height = 88; const x = cv.getContext('2d'), built = Wings.built(); x.imageSmoothingEnabled = false;
    x.fillStyle = built ? '#e8dcb4' : '#2a1c22'; x.fillRect(0, 0, 160, 88); x.fillStyle = built ? '#d8c890' : '#341e26'; for (let i = 0; i < 160; i += 4) x.fillRect(i, 0, 1, 88);
    Wings.START.forEach((b, i) => { const cx = 4 + (i % 4) * 39, cy = 4 + (i >> 2) * 42; x.fillStyle = built ? '#f4ecd0' : '#1c1218'; x.fillRect(cx, cy, 37, 38);
      if (Wings.placed(b.id)) { drawWing(x, cx + 2, cy + 4, 33, 28, 1, null); x.fillStyle = '#8a8a90'; x.fillRect(cx + 17, cy + 32, 1, 4); }
      else { x.strokeStyle = Wings.have(b.id) ? '#e0b848' : '#4a3640'; x.lineWidth = 1; x.setLineDash([2, 2]); x.strokeRect(cx + 2.5, cy + 2.5, 32, 33); } });
    const t = new THREE.CanvasTexture(cv); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; return t;
  }
  const S = { sel: 0, msg: '', msgT: 0, flash: 0 };
  const cells = () => Wings.START.map((b, i) => ({ id: 'cell', i, b, x: 10 + (i % 4) * 112, y: 60 + (i >> 2) * 84, w: 106, h: 78 }));
  const btns = () => ({ build: { id: 'build', label: 'Собрать рамку', x: 10, y: 234, w: 120, h: 18, size: 8, disabled: Wings.built() || Wings.done() || Wings.inFrame() < Wings.START.length }, closeBtn: { id: 'close', label: 'Закрыть ✕', x: SW - 82, y: 4, w: 74, h: 15 } });
  const say = (m, t) => { S.msg = m; S.msgT = t || 4; };
  function act(cell) {
    const b = cell.b; if (Wings.built() || Wings.done()) { say('Рамка уже собрана. Отнесите её торговцу коллекциями на рынке насекомых.'); return; }
    if (Wings.placed(b.id)) { Wings.take(b.id); Snd.sfx.page(); say('Крыло снято с рамки — вернулось на склад.'); }
    else if (Wings.have(b.id)) { Wings.place(b.id); Snd.sfx.click(); say(Wings.inFrame() >= Wings.START.length ? 'Все восемь крыльев на месте! Теперь можно собрать рамку.' : 'Крыло уложено в рамку.'); }
    else { Snd.sfx.deny(); say(`Здесь ещё не все бабочки пойманы: ${Save.biomeCount(b)} из ${b.species.length}.`); }
  }
  return {
    tex, icon: drawWing, open() { Wings.announce(Wings.check(), (s) => say(s, 5)); S.msgT = Math.max(S.msgT, 0); },
    click(x, y) {
      const B = btns(); if (UIK.hit(B.closeBtn, x, y)) return 'close';
      if (!B.build.disabled && UIK.hit(B.build, x, y)) { if (Wings.build()) { Snd.sfx.reward(); say('Рамка собрана! Продайте её торговцу коллекциями на рынке — он даст карту океана.', 7); return 'changed'; } }
      const cl = cells().find(q => UIK.hit(q, x, y)); if (cl) { act(cl); return 'changed'; }
    },
    draw(ctx, t, m, dt) {
      const cl = UIK.col, B = btns(); S.msgT = Math.max(0, S.msgT - dt);
      ctx.fillStyle = '#1a1214'; ctx.fillRect(0, 0, SW, SH); for (let i = 0; i < SW; i += 3) { ctx.fillStyle = (i % 9 === 0) ? '#22181a' : '#1e1416'; ctx.fillRect(i, 0, 3, SH); }
      T.draw(ctx, 'Крылья путеводной бабочки', 8, 6, { size: 10, color: cl.gold }); T.draw(ctx, `Положено в рамку: ${Wings.inFrame()} из ${Wings.START.length} · на складе: ${Wings.inStash()}`, 8, 22, { size: 8, color: cl.dim });
      T.para(ctx, 'Поймали всех бабочек локации — получили крыло путеводной бабочки. Уложите по крылу от каждой локации, соберите рамку и продайте её торговцу коллекциями: он даст карту океана.', 8, 34, SW - 16, { size: 8, color: cl.text, lh: 9 });
      UIK.btn(ctx, B.closeBtn, UIK.hit(B.closeBtn, m.x, m.y));
      const built = Wings.built(); UIK.panel(ctx, 6, 54, 468, 176, { fill: built ? '#e8dcb4' : '#2a1c22', border: built ? '#a07838' : '#6a5030', shadow: false });
      cells().forEach(q => { const b = q.b, hv = UIK.hit(q, m.x, m.y), pl = Wings.placed(b.id), hv2 = Wings.have(b.id);
        ctx.fillStyle = built ? '#f4ecd0' : pl ? '#3a2830' : hv ? '#2a1e24' : '#1c1218'; ctx.fillRect(q.x, q.y, q.w, q.h); ctx.strokeStyle = pl ? cl.gold : hv2 ? '#a08838' : '#4a3640'; ctx.strokeRect(q.x + 0.5, q.y + 0.5, q.w - 1, q.h - 1);
        if (pl) drawWing(ctx, q.x + 8, q.y + 4, q.w - 16, 50, 1, null); else if (hv2) drawWing(ctx, q.x + 8, q.y + 4, q.w - 16, 50, 0.4, 'rgba(20,10,20,0.6)'); else { T.draw(ctx, '?', q.x + q.w / 2, q.y + 18, { size: 14, align: 'c', color: '#4a3640' }); }
        T.draw(ctx, Wings.name(b), q.x + q.w / 2, q.y + 56, { size: 8, align: 'c', color: built ? '#2a1a0c' : '#e8dcc8' });
        T.draw(ctx, pl ? 'в рамке' : hv2 ? 'на складе — положить' : `поймано ${Save.biomeCount(b)}/${b.species.length}`, q.x + q.w / 2, q.y + 66, { size: 8, align: 'c', color: pl ? '#80d890' : hv2 ? cl.gold : cl.dim }); });
      UIK.btn(ctx, B.build, !B.build.disabled && UIK.hit(B.build, m.x, m.y));
      T.draw(ctx, Wings.done() ? 'Рамка продана — карта океана получена.' : built ? 'Рамка собрана: отнесите её торговцу коллекциями (рынок насекомых).' : S.msgT > 0 ? S.msg : 'Щёлкните крыло, чтобы положить в рамку или снять.', 140, 238, { size: 8, color: S.msgT > 0 ? cl.gold : cl.dim });
    },
  };
})();
