// ---------------------------------------------------------------- the secret market: code fragments, the code lock, the stash (everything here is personal, never shared in multiplayer)
// The door code is 27378801 — four torn pieces of a note, each with two digits: 27 (hooded trader), 37 (abandoned house in the Alps), 88 (the lighthouse in the ocean), 01 (the last page of the journal).
const Secret = (() => {
  const CODE = '27378801';
  const FRAGS = [
    { n: 1, digits: '27', where: 'Дала странная торговка рынка' }, { n: 2, digits: '37', where: 'Лежала в углу заброшенного дома' },
    { n: 3, digits: '88', where: 'Была приклеена к маяку' }, { n: 4, digits: '01', where: 'Была вложена в конец журнала' },
  ];
  const st = () => Save.data.secret || (Save.data.secret = { frags: {}, unlocked: false });
  const has = n => !!st().frags[n], count = () => FRAGS.filter(f => has(f.n)).length, unlocked = () => !!st().unlocked;
  function take(n) { if (has(n)) return false; st().frags[n] = true; Save.write(); Snd.sfx.page(); return true; }
  function tryCode(s) { if (s !== CODE) return false; st().unlocked = true; Save.write(); return true; }
  // a torn piece of paper (canvas, transparent outside the jagged edge) with two big digits
  const cache = {};
  function paperCanvas(digits, seed = 7) {
    const k = digits + seed; if (cache[k]) return cache[k]; const W = 48, H = 36, cv = document.createElement('canvas'); cv.width = W; cv.height = H; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; const r = new Rng(seed * 131 + digits.charCodeAt(0));
    for (let j = 0; j < H; j++) { const l = 1 + (r.next() < 0.5 ? 0 : 1) + (j % 7 === 3 ? 1 : 0), rr = W - 1 - (r.next() < 0.5 ? 0 : 1) - (j % 5 === 2 ? 2 : 0); const top = j < 2 ? 3 + r.int(0, 3) : 0, bot = j > H - 3 ? 3 + r.int(0, 4) : 0; if (j < 1 || j >= H - 1) continue; x.fillStyle = j % 2 ? '#e8dcb8' : '#e4d8b0'; x.fillRect(l + top, j, rr - l - top - bot, 1); }
    { const d = x.getImageData(0, 0, W, H), o = new Uint8ClampedArray(d.data); for (let j = 1; j < H - 1; j++) for (let i = 1; i < W - 1; i++) { const a = (j * W + i) * 4 + 3; if (o[a] && (!o[a - 4] || !o[a + 4] || !o[a - W * 4] || !o[a + W * 4])) { d.data[a - 3] = 120; d.data[a - 2] = 98; d.data[a - 1] = 62; } } x.putImageData(d, 0, 0); }   // a darker rim
    x.fillStyle = '#c8b888'; for (let i = 0; i < 40; i++) x.fillRect(r.int(3, W - 4), r.int(3, H - 4), r.int(1, 3), 1);              // age spots
    x.fillStyle = 'rgba(120,90,50,0.35)'; x.fillRect(W / 2 - 1, 2, 1, H - 4); x.fillRect(2, H / 2, W - 4, 1);                           // folds
    x.fillStyle = 'rgba(40,24,10,0.5)'; for (let i = 0; i < 3; i++) x.fillRect(5, 6 + i * 3, 10 + r.int(0, 10), 1);                       // scribbles
    T.draw(x, digits, W / 2, 10, { size: 22, align: 'c', color: '#2a1608' });                                                          // the digits
    x.fillStyle = 'rgba(40,24,10,0.5)'; for (let i = 0; i < 2; i++) x.fillRect(8, H - 7 + i * 2, 14 + r.int(0, 12), 1);
    cache[k] = cv; return cv;
  }
  // a taped note for a wall / floor (a plane with a transparent edge and two strips of tape)
  function paperMesh(digits, seed = 7) {
    const g = new THREE.Group(), tex = new THREE.CanvasTexture(paperCanvas(digits, seed)); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    const p = new THREE.Mesh(new THREE.PlaneGeometry(0.36, 0.27), new THREE.MeshLambertMaterial({ map: tex, transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, emissive: '#6a5a30', emissiveIntensity: 0.9 })); g.add(p);
    for (const sx of [-1, 1]) { const tp = new THREE.Mesh(new THREE.PlaneGeometry(0.075, 0.032), new THREE.MeshBasicMaterial({ color: '#d8c880', transparent: true, opacity: 0.85 })); tp.position.set(sx * 0.135, 0.1, 0.004); tp.rotation.z = -sx * 0.6; g.add(tp); }
    g.userData.paper = p; return g;
  }

  // ------------------------------------------------------------ the stash (a modal window: fragments + net parts)
  const stash = {
    btns: [],
    layout() { this.btns = [{ id: 'close', label: 'Закрыть', x: SW / 2 - 50, y: 232, w: 100, h: 18, size: 10 }]; },
    draw(ctx, t, m) {
      const c = UIK.col; this.layout(); ctx.fillStyle = 'rgba(4,12,10,0.8)'; ctx.fillRect(0, 0, SW, SH); UIK.panel(ctx, 40, 14, 400, 242, { fill: 'rgba(16,32,28,0.98)', border: c.gold });
      T.draw(ctx, 'Склад', SW / 2, 20, { size: 14, align: 'c', color: c.gold });
      T.draw(ctx, 'Обрывки записки', 54, 30, { size: 8, color: c.dim });
      FRAGS.forEach((f, i) => {
        const x = 54 + i * 92, y = 40, got = has(f.n); UIK.panel(ctx, x, y, 86, 62, { fill: '#10201c', border: got ? c.gold : c.line, shadow: false });
        if (got) { ctx.imageSmoothingEnabled = false; ctx.drawImage(paperCanvas(f.digits), x + 4, y + 4, 78, 54); } else { ctx.globalAlpha = 0.35; ctx.imageSmoothingEnabled = false; ctx.drawImage(paperCanvas('??', 3), x + 4, y + 4, 78, 54); ctx.globalAlpha = 1; ctx.fillStyle = 'rgba(8,16,14,0.6)'; ctx.fillRect(x + 4, y + 4, 78, 54); T.draw(ctx, '?', x + 43, y + 24, { size: 14, align: 'c', color: c.dim }); }
        T.draw(ctx, `Обрывок ${f.n}`, x + 43, y + 66, { size: 8, align: 'c', color: got ? c.text : c.dim });
      });
      const full = count() === 4; T.draw(ctx, full ? 'Код: ' + FRAGS.map(f => f.digits).join('') : 'Код: ' + FRAGS.map(f => has(f.n) ? f.digits : '??').join(' '), SW / 2, 120, { size: 10, align: 'c', color: full ? '#9af0a0' : c.text });
      let y = 136;
      FRAGS.forEach(f => { if (has(f.n)) { T.draw(ctx, `${f.n}. ${f.where}`, 54, y, { size: 8, color: c.text }); y += 10; } });
      if (!count()) T.para(ctx, 'Здесь будут лежать найденные обрывки. Говорят, они разбросаны по всему свету…', 54, y, 372, { size: 8, color: c.dim, lh: 10 });
      T.draw(ctx, 'Детали сачков', 54, 182, { size: 8, color: c.dim });
      const owned = Object.keys(NetParts.PARTS).filter(id => Save.partCount(id) > 0);
      if (!owned.length) T.draw(ctx, 'Пока нет. Их продаёт продавец сачков на рынке насекомых.', 54, 194, { size: 8, color: c.dim });
      owned.slice(0, 8).forEach((id, i) => { const col = i % 2, row = Math.floor(i / 2); T.draw(ctx, fitStr(`${NetParts.PARTS[id].ru} ×${Save.partCount(id)}`, 180), 54 + col * 190, 194 + row * 9, { size: 8, color: c.text }); });
      // the wings of the guiding butterfly (one per starting location)
      Wings.START.forEach((b, i) => { const x = 52 + i * 17, got = Wings.have(b.id); ctx.fillStyle = '#10201c'; ctx.fillRect(x, 232, 15, 18); ctx.strokeStyle = got ? c.gold : c.line; ctx.strokeRect(x + 0.5, 232.5, 14, 17); if (got) WingsUI.icon(ctx, x + 1, 235, 13, 12, Wings.placed(b.id) ? 0.45 : 1, null); });
      T.draw(ctx, `Крылья: ${Wings.count()}/${Wings.START.length}`, 300, 238, { size: 8, color: Wings.count() ? c.gold : c.dim });
      this.btns.forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y)));
    },
    click(x, y) { this.layout(); const b = this.btns.find(b => UIK.hit(b, x, y)); return b ? b.id : null; },
  };

  // ------------------------------------------------------------ the code lock: eight digit drums
  const lock = {
    d: [0, 0, 0, 0, 0, 0, 0, 0], sel: 0, shake: 0, ok: 0, msg: '', msgT: 0, mx: 0, my: 0, btns: [], drums: [],
    reset() { this.d = [0, 0, 0, 0, 0, 0, 0, 0]; this.sel = 0; this.shake = 0; this.ok = 0; this.msg = ''; this.msgT = 0; },
    layout() {
      this.drums = this.d.map((v, i) => ({ i, x: 80 + i * 40, y: 90, w: 34, h: 44 }));
      this.btns = [{ id: 'try', label: 'Открыть', x: SW / 2 - 52, y: 168, w: 104, h: 18, size: 10 }];
      for (const dr of this.drums) { this.btns.push({ id: 'up' + dr.i, label: '^', x: dr.x, y: dr.y - 15, w: dr.w, h: 12, drum: dr.i, d: 1 }, { id: 'dn' + dr.i, label: 'v', x: dr.x, y: dr.y + dr.h + 3, w: dr.w, h: 12, drum: dr.i, d: -1 }); }
    },
    turn(i, d) { this.d[i] = (this.d[i] + d + 10) % 10; this.sel = i; Snd.sfx.click(); },
    submit() {
      if (this.ok) return; const s = this.d.join('');
      if (tryCode(s)) { this.ok = 1.4; this.msg = 'Замок щёлкнул. Дверь поддалась…'; this.msgT = 3; Snd.sfx.door(); Snd.sfx.pin(); return 'ok'; }
      this.shake = 0.5; this.msg = 'Замок не поддаётся…'; this.msgT = 2.5; Snd.sfx.deny(); return 'no';
    },
    key(e) {
      if (this.ok) return; const k = e.key;
      if (e.code === 'Enter') return this.submit(); if (/^[0-9]$/.test(k)) { this.d[this.sel] = +k; this.sel = Math.min(7, this.sel + 1); Snd.sfx.click(); return; }
      if (e.code === 'Backspace') { this.sel = Math.max(0, this.sel - 1); this.d[this.sel] = 0; Snd.sfx.click(); } else if (e.code === 'ArrowLeft') this.sel = Math.max(0, this.sel - 1); else if (e.code === 'ArrowRight') this.sel = Math.min(7, this.sel + 1);
      else if (e.code === 'ArrowUp') this.turn(this.sel, 1); else if (e.code === 'ArrowDown') this.turn(this.sel, -1);
    },
    click(x, y) {
      if (this.ok) return; this.layout(); const b = this.btns.find(b => UIK.hit(b, x, y)); if (b) { if (b.id === 'try') return this.submit(); this.turn(b.drum, b.d); return; }
      const dr = this.drums.find(d => UIK.hit(d, x, y)); if (dr) { this.sel = dr.i; Snd.sfx.click(); }
    },
    wheel(dy) { if (this.ok) return; const dr = this.drums.find(d => UIK.hit(d, this.mx, this.my)); this.turn(dr ? dr.i : this.sel, dy > 0 ? -1 : 1); },
    draw(ctx, t, m, dt) {
      const c = UIK.col; this.mx = m.x; this.my = m.y; this.layout(); this.shake = Math.max(0, this.shake - dt); this.msgT = Math.max(0, this.msgT - dt); if (this.ok) this.ok = Math.max(0, this.ok - dt);
      ctx.fillStyle = 'rgba(4,8,8,0.72)'; ctx.fillRect(0, 0, SW, SH);
      const sx = this.shake > 0 ? Math.round(Math.sin(t * 60) * 3 * this.shake * 2) : 0, ox = sx, oy = 0, good = unlocked() && this.ok > 0;
      // brass plate with rivets
      const px = 56 + ox, py = 44 + oy, pw = 368, ph = 154; UIK.panel(ctx, px, py, pw, ph, { fill: '#8a6a30', border: '#3a2a10' }); ctx.fillStyle = '#a88440'; ctx.fillRect(px + 3, py + 3, pw - 6, 4); ctx.fillStyle = '#6a4a1c'; ctx.fillRect(px + 3, py + ph - 7, pw - 6, 4);
      for (const [rx, ry] of [[6, 6], [pw - 10, 6], [6, ph - 10], [pw - 10, ph - 10]]) { ctx.fillStyle = '#c8a860'; ctx.fillRect(px + rx, py + ry, 4, 4); ctx.fillStyle = '#4a3010'; ctx.fillRect(px + rx + 3, py + ry + 3, 1, 1); }
      T.draw(ctx, 'КОДОВЫЙ ЗАМОК', SW / 2 + ox, py + 8, { size: 10, align: 'c', color: '#2a1a08' });
      T.draw(ctx, 'восемь цифр', SW / 2 + ox, py + 19, { size: 8, align: 'c', color: '#4a3010' });
      this.drums.forEach(dr => {
        const x = dr.x + ox, y = dr.y + oy, on = dr.i === this.sel, v = this.d[dr.i]; UIK.panel(ctx, x, y, dr.w, dr.h, { fill: '#e8e0c8', border: on ? c.gold : '#2a1a08', shadow: false });
        ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.fillRect(x + 1, y + 1, dr.w - 2, 10); ctx.fillRect(x + 1, y + dr.h - 11, dr.w - 2, 10); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x + 1, y + 16, dr.w - 2, 12);
        T.draw(ctx, String((v + 9) % 10), x + dr.w / 2, y + 2, { size: 8, align: 'c', color: '#9a8a68' }); T.draw(ctx, String((v + 1) % 10), x + dr.w / 2, y + dr.h - 10, { size: 8, align: 'c', color: '#9a8a68' });
        T.draw(ctx, String(v), x + dr.w / 2, y + 15, { size: 14, align: 'c', color: good ? '#1a6a2a' : this.shake > 0 ? '#9a1a1a' : '#2a1a08' });
      });
      this.btns.forEach(b => { const bb = Object.assign({}, b, { x: b.x + ox, y: b.y + oy }); UIK.btn(ctx, bb, UIK.hit(b, m.x, m.y)); });
      // the indicator lamp
      ctx.fillStyle = '#2a1a08'; ctx.fillRect(px + pw - 26 + ox, py + 8, 12, 12); ctx.fillStyle = good ? '#40e060' : this.shake > 0 ? '#ff4040' : '#702020'; ctx.fillRect(px + pw - 24 + ox, py + 10, 8, 8);
      // notes: the fragments found so far
      T.draw(ctx, 'Обрывки записки:', 56, 213, { size: 8, color: c.dim }); FRAGS.forEach((f, i) => T.draw(ctx, has(f.n) ? f.digits : '??', 170 + i * 30, 213, { size: 8, color: has(f.n) ? c.gold : c.dim }));
      T.draw(ctx, count() ? 'Все обрывки — на складе (I)' : 'Обрывков пока нет', 424, 213, { size: 8, align: 'r', color: c.dim });
      T.draw(ctx, 'Цифры — с клавиатуры · стрелки — колёса · Enter — открыть · Esc — отойти', SW / 2, 228, { size: 8, align: 'c', color: c.dim });
      if (this.msgT > 0) T.draw(ctx, this.msg, SW / 2, 201, { size: 8, align: 'c', color: good ? '#9af0a0' : '#ff9a8a', shadow: '#000' });
    },
  };

  // ------------------------------------------------------------ speeches of the hooded traders
  const LINES = {
    first: ['…Ты пришёл. Я ждал. Или это ты ждал?..', 'Не оглядывайся. Здесь всё слышит… даже камни.', 'Я ничего не продаю. Я лишь храню то, что рассыпано.', 'Возьми. Это не моё — и не твоё. Часть двери. Первая.'],
    gave: ['Остальное — там, где пыль помнит, где море светит и где страницы молчат. Иди.'],
    again: ['Пыль помнит… а ты?', 'Дверь прячется в углу самого дальнего переулка.', 'Восемь цифр. Четыре голоса. Ни один не лжёт.', 'Я не продаю. Я напоминаю.'],
    shop: ['Карты. Места, которых нет ни на одной карте.', 'Каждое место — дыхание земли. Выбирай.', 'Я не торгуюсь. Монеты… или тишина.'], sold: ['Теперь ты знаешь дорогу. Не оглядывайся там.', 'Карта твоя. Место ждало… давно.'], poor: ['Не хватает. Земля не любит должников.', 'Монет мало. Приходи, когда пыль осядет.'], have: ['Эта карта уже у тебя. Идти — тебе.'],
    full: ['Ты собрал голоса. Теперь произнеси их… цифрами.'], opened: ['Дверь уже открыта. Не заставляй их ждать…'],
    inside: ['Лавка закрыта… пока. Товар ещё в пути.', 'Приходи, когда пыль осядет.', 'Я продаю тишину. Сегодня её нет в наличии… шучу. Её не продают.', 'Здесь ничего нет. Пока. Но ты запомнишь это место.'],
  };
  const speech = who => {
    if (LINES[who] && who !== 'first' && who !== 'gave' && who !== 'again' && who !== 'full' && who !== 'opened' && who !== 'inside') return { lines: [LINES[who][(Math.random() * LINES[who].length) | 0]], give: 0 };
    if (who === 'inside') return { lines: [LINES.inside[(Math.random() * LINES.inside.length) | 0]], give: 0 };
    if (!has(1)) return { lines: LINES.first.concat(LINES.gave), give: 1, giveAt: LINES.first.length - 1 };
    if (unlocked()) return { lines: LINES.opened, give: 0 }; if (count() === 4) return { lines: LINES.full, give: 0 };
    return { lines: [LINES.again[(Math.random() * LINES.again.length) | 0]], give: 0 };
  };
  return { CODE, FRAGS, has, count, unlocked, take, tryCode, paperCanvas, paperMesh, stash, lock, speech };
})();
