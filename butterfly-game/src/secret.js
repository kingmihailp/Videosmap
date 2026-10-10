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

  // ------------------------------------------------------------ the stash (a modal window): slots with everything the player owns except butterflies and collections
  const stash = {
    btns: [], scroll: 0, mx: 0, my: 0, COLS: 10, ROWS: 5, X: 56, Y: 36, S: 32, G: 3, tcache: {},
    // every item the player has: { name, desc, n (a count, 0 = a single thing), draw(ctx, x, y, w, h), dim }
    items() {
      const o = [], H = UIK.col;
      FRAGS.forEach(f => { if (has(f.n)) o.push({ name: `Обрывок записки ${f.n}`, desc: `Цифры «${f.digits}». ${f.where}.`, n: 0, draw: (ctx, x, y, w, h) => { ctx.drawImage(paperCanvas(f.digits), x, y + 4, w, h - 8); } }); });
      Wings.START.forEach(b => { if (Wings.have(b.id)) { const pl = Wings.placed(b.id); o.push({ name: `Крыло путеводной бабочки: ${Wings.name(b)}`, desc: pl ? 'Лежит в рамке крыльев.' : 'Крыло можно положить в рамку (в кабинете).', n: 0, draw: (ctx, x, y, w, h) => WingsUI.icon(ctx, x + 6, y + 3, w - 12, h - 6, pl ? 0.45 : 1, null) }); } });
      Object.keys(NetParts.PARTS).forEach(id => { const n = Save.partCount(id), p = NetParts.PARTS[id]; if (n > 0) o.push({ name: p.ru, desc: p.desc, n, draw: (ctx, x, y, w, h) => { const base = Object.assign({}, NetParts.BASIC); base[p.slot] = id; NetParts.draw2D(ctx, base, x, y, w, h); } }); });
      Save.netList().forEach((nt, i) => o.push({ name: NetParts.name(nt, i), desc: ((Save.data.netEq || 0) === nt.uid ? 'В руках. ' : '') + NetParts.statLines(nt).join(' · '), n: 0, net: nt, draw: (ctx, x, y, w, h) => NetParts.draw2D(ctx, nt, x, y, w, h) }));
      for (const sz of ['S', 'M', 'L']) { const n = Save.stock(sz); if (n > 0) o.push({ name: `${Boxes.SIZE_NAME[sz]} коробка`, desc: `Пустая коробка на ${Save.CAP[sz]} бабочек. Оформить её можно на верстаке.`, n, draw: (ctx, x, y, w, h) => { const fake = { uid: 1, size: sz, style: 0, items: new Array(Save.CAP[sz]).fill(0), loc: null }, pz = Boxes.pxSize(sz), k = Math.min(w / pz.w, h / pz.h), dw = Math.max(1, Math.round(pz.w * k)), dh = Math.max(1, Math.round(pz.h * k)); ctx.imageSmoothingEnabled = k < 1; ctx.drawImage(Boxes.canvas(fake), Math.round(x + (w - dw) / 2), Math.round(y + (h - dh) / 2), dw, dh); ctx.imageSmoothingEnabled = false; } }); }
      Traps.KINDS.fl.list.forEach(f => { const n = Traps.count('fl', f.id); if (n > 0) o.push({ name: f.ru, desc: 'Цветы для приманки в ловушке.', n, draw: (ctx, x, y, w, h) => this.fit(ctx, this.kindPic('fl', f.id), x, y, w, h, () => Traps.drawFlower(ctx, x + 1, y + 2, f, 2)) }); });
      Traps.KINDS.hn.list.forEach(f => { const n = Traps.count('hn', f.id); if (n > 0) o.push({ name: f.ru, desc: f.desc, n, draw: (ctx, x, y, w, h) => this.fit(ctx, this.kindPic('hn', f.id), x, y, w, h, () => Traps.drawJar(ctx, x + 1, y, f, 2)) }); });
      Traps.KINDS.tr.list.forEach(f => { const n = Traps.count('tr', f.id); if (n > 0) o.push({ name: f.ru, desc: 'Ставится на локации клавишей G.', n, draw: (ctx, x, y, w, h) => { const cv = this.trapPic(f.id); if (cv) { const k = Math.min(w / cv.width, h / cv.height), dw = Math.max(1, Math.round(cv.width * k)), dh = Math.max(1, Math.round(cv.height * k)); ctx.drawImage(cv, x + Math.round((w - dw) / 2), y + Math.round((h - dh) / 2), dw, dh); } } }); });
      return o;
    },
    // the detailed close-up of a flower bunch / honey piece (the same 3D picture as in the shops), cut to its visible part
    kindPic(kind, id) { const k = kind + id; if (this.tcache[k] !== undefined) return this.tcache[k]; let cv = null; try { cv = this.crop(Traps.closeup(kind, id)); } catch (e) { cv = null; } return (this.tcache[k] = cv); },
    crop(src) { if (!src) return null; const W = src.width, H = src.height, d = src.getContext ? src.getContext('2d').getImageData(0, 0, W, H).data : null; if (!d) return src; let x0 = W, x1 = -1, y0 = H, y1 = -1; for (let j = 0; j < H; j++) for (let i = 0; i < W; i++) if (d[(j * W + i) * 4 + 3] > 20) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; } if (x1 < 0) return null; const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(src, -x0, -y0); return o; },
    fit(ctx, cv, x, y, w, h, fallback) { if (!cv) { fallback(); return; } const k = Math.min(w / cv.width, h / cv.height), dw = Math.max(1, Math.round(cv.width * k)), dh = Math.max(1, Math.round(cv.height * k)); ctx.imageSmoothingEnabled = false; ctx.drawImage(cv, x + Math.round((w - dw) / 2), y + Math.round((h - dh) / 2), dw, dh); },
    // a still picture of a trap (rendered once)
    trapPic(id) { if (this.tcache[id] !== undefined) return this.tcache[id]; let cv = null; try { const g = Traps.model(id, {}), r = Traps.UI; cv = document.createElement('canvas'); cv.width = 100; cv.height = 150; r.preview(cv.getContext('2d'), { group: g }, 0.7, 0, 0, 100, 150); const d = cv.getContext('2d').getImageData(0, 0, 100, 150).data; let x0 = 100, x1 = -1, y0 = 150, y1 = -1; for (let j = 0; j < 150; j++) for (let i = 0; i < 100; i++) if (d[(j * 100 + i) * 4 + 3] > 20) { if (i < x0) x0 = i; if (i > x1) x1 = i; if (j < y0) y0 = j; if (j > y1) y1 = j; } if (x1 >= 0) { const o = document.createElement('canvas'); o.width = x1 - x0 + 1; o.height = y1 - y0 + 1; o.getContext('2d').drawImage(cv, -x0, -y0); cv = o; } } catch (e) { cv = null; } return (this.tcache[id] = cv); },
    cells() { return this.COLS * this.ROWS; },
    slotRect(i) { const r = Math.floor(i / this.COLS), k = i % this.COLS; return { x: this.X + k * (this.S + this.G), y: this.Y + r * (this.S + this.G), w: this.S, h: this.S }; },
    layout() {
      const n = this.items().length, rows = Math.max(this.ROWS, Math.ceil(n / this.COLS)), maxS = Math.max(0, rows - this.ROWS); this.scroll = clamp(this.scroll, 0, maxS); this.maxS = maxS;
      this.btns = [{ id: 'close', label: 'Закрыть', x: SW / 2 - 50, y: 239, w: 100, h: 15, size: 8 }, { id: 'up', label: '^', x: 412, y: 36, w: 14, h: 14, disabled: this.scroll === 0 }, { id: 'dn', label: 'v', x: 412, y: 36 + (this.S + this.G) * this.ROWS - this.G - 14, w: 14, h: 14, disabled: this.scroll >= maxS }];
    },
    draw(ctx, t, m) {
      const c = UIK.col; this.mx = m.x; this.my = m.y; this.layout(); ctx.fillStyle = 'rgba(4,12,10,0.8)'; ctx.fillRect(0, 0, SW, SH); UIK.panel(ctx, 40, 12, 400, 246, { fill: 'rgba(16,32,28,0.98)', border: c.gold });
      const its = this.items(); T.draw(ctx, 'Склад', SW / 2, 17, { size: 14, align: 'c', color: c.gold }); T.draw(ctx, `предметов: ${its.length}`, 436, 22, { size: 8, align: 'r', color: c.dim });
      let hov = null; ctx.imageSmoothingEnabled = false;
      for (let i = 0; i < this.cells(); i++) {
        const r = this.slotRect(i), it = its[this.scroll * this.COLS + i], on = it && UIK.hit(r, m.x, m.y);
        ctx.fillStyle = on ? '#2a4a3c' : '#0e1a16'; ctx.fillRect(r.x, r.y, r.w, r.h); ctx.fillStyle = on ? c.gold : '#2e4a3e'; ctx.fillRect(r.x, r.y, r.w, 1); ctx.fillRect(r.x, r.y + r.h - 1, r.w, 1); ctx.fillRect(r.x, r.y, 1, r.h); ctx.fillRect(r.x + r.w - 1, r.y, 1, r.h);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fillRect(r.x + 1, r.y + 1, r.w - 2, 1); ctx.fillRect(r.x + 1, r.y + 1, 1, r.h - 2);
        if (!it) continue; if (on) hov = it;
        ctx.save(); ctx.beginPath(); ctx.rect(r.x + 2, r.y + 2, r.w - 4, r.h - 4); ctx.clip(); it.draw(ctx, r.x + 2, r.y + 2, r.w - 4, r.h - 4); ctx.restore();
        if (it.n > 1) T.draw(ctx, String(it.n), r.x + r.w - 3, r.y + r.h - 10, { size: 8, align: 'r', color: '#fff', shadow: '#000' });
      }
      this.btns.forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y)));
      if (this.maxS > 0) T.draw(ctx, `${this.scroll + 1}/${this.maxS + 1}`, 419, 36 + (this.S + this.G) * this.ROWS / 2 - 4, { size: 8, align: 'c', color: c.dim });
      UIK.panel(ctx, 52, 210, 376, 25, { fill: '#10201c', border: c.line, shadow: false });
      if (hov) { T.draw(ctx, hov.name + (hov.n > 1 ? ` ×${hov.n}` : ''), 58, 213, { size: 8, color: c.gold }); T.draw(ctx, fitStr(hov.desc || '', 360), 58, 224, { size: 8, color: c.text }); }
      else T.draw(ctx, its.length ? 'Наведите курсор на предмет' : 'Склад пуст. Сюда попадают обрывки записки, детали сачков, коробки, цветы, мёд, ловушки…', 58, 219, { size: 8, color: c.dim });
    },
    click(x, y) { this.layout(); const b = this.btns.find(b => !b.disabled && UIK.hit(b, x, y)); if (!b) return null; if (b.id === 'up') this.scroll--; else if (b.id === 'dn') this.scroll++; if (b.id !== 'close') Snd.sfx.click(); return b.id === 'close' ? 'close' : null; },
    wheel(dy) { this.scroll += dy > 0 ? 1 : -1; this.layout(); },
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
