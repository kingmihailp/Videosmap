// ---------------------------------------------------------------- spreading board mini-game + specimen cards
const Grade = q => q >= 95 ? { name: 'Музейный экземпляр', col: '#ffe27a' } : q >= 85 ? { name: 'Отлично', col: '#9af0a0' } : q >= 70 ? { name: 'Хорошо', col: '#b8e0f0' } : q >= 50 ? { name: 'Средне', col: '#e8d0a0' } : { name: 'Небрежно', col: '#e88a70' };

const Cab2 = {
  backdrop(ctx) {
    ctx.fillStyle = '#241810'; ctx.fillRect(0, 0, SW, SH);
    for (let i = 0; i < 14; i++) { ctx.fillStyle = i % 2 ? '#2c1e14' : '#33241a'; ctx.fillRect(0, i * 20, SW, 20); ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(0, i * 20 + 19, SW, 1); }
    ctx.fillStyle = 'rgba(70,40,10,0.35)'; for (let i = 0; i < 60; i++) ctx.fillRect((i * 83) % SW, (i * 37) % SH, 18 + (i % 5) * 6, 1);
    const g = ctx.createRadialGradient(SW / 2, SH / 2, 60, SW / 2, SH / 2, 300); g.addColorStop(0, 'rgba(255,200,120,0.10)'); g.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
  },
};

// small card for a specimen: butterfly picture, name, line with date or quality
function specCard(ctx, x, y, w, h, spec, hover, sel, count) {
  const c = UIK.col; const sp = SPECIES_BY_ID[spec.sp];
  const ab = !!sp.ab, rare = Rare.is(sp);            // aberrations are lit up in purple, the very rare secret finds in red (an aberration of a rare one keeps its purple card and gets a red frame)
  UIK.panel(ctx, x, y, w, h, rare && !ab ? { fill: sel ? '#6a2a2a' : hover ? '#5a2424' : '#3a1a1a', border: sel ? c.gold : Rare.col, shadow: false } : ab ? { fill: sel ? '#5a3a8a' : hover ? '#4a3076' : '#35235a', border: sel ? c.gold : hover ? '#d0a8ff' : '#a070e8', shadow: false } : { fill: sel ? '#2a5a46' : hover ? '#244a3c' : '#1a3228', border: sel ? c.gold : hover ? '#8ab89a' : c.line, shadow: false });
  if (ab) { ctx.fillStyle = 'rgba(190,130,255,0.16)'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4); } else if (rare) { ctx.fillStyle = 'rgba(232,54,58,0.14)'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4); }
  if (rare && ab) { ctx.strokeStyle = Rare.col; ctx.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3); }
  { const rp = spec.q === null && !spec.pose ? Art.restingPic(sp) : null; if (rp) { const dh = Math.max(8, Math.round(40 * Math.max(0.22, Art.sizeShare(sp)))), dw = Math.round(dh * rp.width / rp.height); ctx.imageSmoothingEnabled = true; ctx.drawImage(rp, Math.round(x + (w - dw) / 2), y + 2 + (40 - dh), dw, dh); ctx.imageSmoothingEnabled = false; } else Art.drawPose(ctx, sp, spec.pose || Art.RAW, x + w / 2, y + 22, 1); }
  if (ab) { const lb = 'аберрант', lw = T.width(lb, 8) + 8; UIK.panel(ctx, x + 3, y + 3, lw, 12, { fill: 'rgba(60,30,100,0.95)', border: '#c090ff', shadow: false }); T.draw(ctx, lb, x + 3 + lw / 2, y + 5, { size: 8, align: 'c', color: '#f0d8ff' }); }
  if (rare) { const lb = 'редкий', lw = T.width(lb, 8) + 8; UIK.panel(ctx, ab ? x + w - lw - 3 : x + 3, y + 3, lw, 12, { fill: 'rgba(90,16,16,0.95)', border: Rare.col, shadow: false }); T.draw(ctx, lb, (ab ? x + w - lw - 3 : x + 3) + lw / 2, y + 5, { size: 8, align: 'c', color: '#ffd0d0' }); }
  const nm = ab ? (SPECIES_BY_ID[sp.base] || sp).ru : sp.ru;
  let n = nm; while (T.width(n, 8) > w - 6 && n.length > 3) n = n.slice(0, -2) + '…';
  T.draw(ctx, n, x + w / 2, y + h - 21, { size: 8, align: 'c', color: ab ? '#f0d8ff' : c.text });
  if (spec.q !== null) { const g = Grade(spec.q); T.draw(ctx, spec.q + '% ' + g.name.split(' ')[0], x + w / 2, y + h - 11, { size: 8, align: 'c', color: g.col }); }
  else T.draw(ctx, fmtDate(spec.date), x + w / 2, y + h - 11, { size: 8, align: 'c', color: c.dim });
  if (count > 1) {                                   // a stack of identical (unspread) specimens
    const tx = '×' + count, tw = T.width(tx, 8) + 8; UIK.panel(ctx, x + w - tw - 3, y + 3 + (rare ? 14 : 0), tw, 12, { fill: 'rgba(8,20,16,0.92)', border: c.gold, shadow: false }); T.draw(ctx, tx, x + w - tw / 2 - 3, y + 5 + (rare ? 14 : 0), { size: 8, align: 'c', color: c.gold });
  }
}

const Spread = (() => {
  const c = UIK.col;
  const SC = 3, CX = 240, CY = 142;
  const ORDER = ['rf', 'lf', 'rh', 'lh'];
  const NAMES = { rf: 'правое переднее', lf: 'левое переднее', rh: 'правое заднее', lh: 'левое заднее' };
  const part = k => k[1], mir = k => (k[0] === 'l' ? -1 : 1);
  const pivot = k => ({ x: CX, y: CY + (Art.PIV[part(k)] - 20) * SC });
  const copy = p => JSON.parse(JSON.stringify(p));

  // ------------------------------------------------------------------ specimen picker
  const pick = {
    page: 0, hover: -1, cards: [], btns: [], list: [], all: [], f: { rar: 0, loc: 0, ab: 0, date: 0, fam: 0 }, fbtns: [],
    open() { this.page = 0; this.f = { rar: 0, loc: 0, ab: 0, date: 0, fam: 0 }; },
    // the filters: every one cycles through «все» and the values that occur among the waiting butterflies
    filters() { return this.filtersFor(this.all); },
    filtersFor(all) {
      const base = s => SPECIES_BY_ID[s.sp].base ? SPECIES_BY_ID[SPECIES_BY_ID[s.sp].base] || SPECIES_BY_ID[s.sp] : SPECIES_BY_ID[s.sp], DAY = 864e5, now = Date.now();
      const uniq = f => [...new Set(all.map(f))];
      const locName = id => { const b = BIOME_BY_ID[id]; return b ? (b.short || (b.place || b.name).split(',')[0]) : id; };
      return [
        { id: 'rar', name: 'Редкость', opts: [{ n: 'все', t: () => true }].concat(uniq(s => base(s).rar || 1).sort().map(r => ({ n: '★'.repeat(r), t: s => (base(s).rar || 1) === r }))) },
        { id: 'loc', name: 'Локация', opts: [{ n: 'все', t: () => true }].concat(uniq(s => s.biome || base(s).biome).sort().map(b => ({ n: locName(b), t: s => (s.biome || base(s).biome) === b }))) },
        { id: 'ab', name: 'Аберрация', opts: [{ n: 'все', t: () => true }, { n: 'аберранты', t: s => !!SPECIES_BY_ID[s.sp].ab }, { n: 'обычные', t: s => !SPECIES_BY_ID[s.sp].ab }] },
        { id: 'date', name: 'Поймано', opts: [{ n: 'любая', t: () => true }, { n: 'сегодня', t: s => now - s.date < DAY }, { n: 'за 3 дня', t: s => now - s.date < 3 * DAY }, { n: 'за неделю', t: s => now - s.date < 7 * DAY }, { n: 'давно (>7 дн.)', t: s => now - s.date >= 7 * DAY }] },
        { id: 'fam', name: 'Семейство', opts: [{ n: 'все', t: () => true }].concat(uniq(s => base(s).fam).sort().map(fm => ({ n: fm, t: s => base(s).fam === fm }))) },
      ];
    },
    layout() {
      this.all = Save.rawList(); const per = 12, FL = this.filters(); FL.forEach(fl => { this.f[fl.id] = Math.min(this.f[fl.id] || 0, fl.opts.length - 1); });
      this.list = this.all.filter(sp => FL.every(fl => fl.opts[this.f[fl.id]].t(sp)));
      this.fbtns = FL.map((fl, i) => ({ id: 'f_' + fl.id, fid: fl.id, n: fl.opts.length, label: fl.name + ': ' + fl.opts[this.f[fl.id]].n, on: this.f[fl.id] > 0, x: 12 + i * 94, y: 36, w: 90, h: 13 }));
      const groups = [], by = new Map(); for (const sp of this.list) { let g = by.get(sp.sp); if (!g) { g = { s: sp, n: 0 }; by.set(sp.sp, g); groups.push(g); } g.n++; }   // same species stack; aberrants have their own ids, so they stay apart
      const ord = new Map(); for (const g of groups) { const b = SPECIES_BY_ID[g.s.sp].base || g.s.sp; if (!ord.has(b)) ord.set(b, ord.size); }
      groups.sort((a, b) => { const sa = SPECIES_BY_ID[a.s.sp], sb = SPECIES_BY_ID[b.s.sp]; return (ord.get(sa.base || sa.id) - ord.get(sb.base || sb.id)) || ((sa.ab ? 1 : 0) - (sb.ab ? 1 : 0)) || (sa.id < sb.id ? -1 : 1); });   // every aberration stands right after its normal form
      const pages = Math.max(1, Math.ceil(groups.length / per)); this.page = Math.min(this.page, pages - 1);
      this.cards = groups.slice(this.page * per, this.page * per + per).map(({ s, n }, i) => ({ s, n, x: 23 + (i % 4) * 110, y: 54 + Math.floor(i / 4) * 64, w: 104, h: 62 }));
      this.btns = [{ id: 'close', label: '← В кабинет', x: 12, y: 246, w: 90, h: 16 }, { id: 'prev', label: '←', x: 190, y: 246, w: 24, h: 16, disabled: this.page === 0 }, { id: 'next', label: '›', x: 266, y: 246, w: 24, h: 16, disabled: this.page >= pages - 1 }];
      this.pages = pages;
    },
    draw(ctx, t, m) {
      this.layout(); Cab2.backdrop(ctx);
      T.draw(ctx, 'Что расправим?', SW / 2, 10, { size: 14, align: 'c', color: c.gold, shadow: '#000' });
      T.draw(ctx, this.list.length ? 'выберите пойманную бабочку — ей потребуются точные движения' : this.all.length ? 'под фильтры ничего не подходит — щёлкните фильтр, чтобы сменить значение' : 'нет неразобранных бабочек: наловите новых в экспедициях!', SW / 2, 26, { size: 8, align: 'c', color: c.dim });
      this.fbtns.forEach(b => { const hv = UIK.hit(b, m.x, m.y); UIK.panel(ctx, b.x, b.y, b.w, b.h, { fill: b.on ? '#4a3a1c' : hv ? '#244a3c' : '#1a3228', border: b.on ? c.gold : c.line, shadow: false }); T.draw(ctx, fitStr(b.label, b.w - 6), b.x + b.w / 2, b.y + 3, { size: 8, align: 'c', color: b.on ? '#fff' : c.text }); });
      this.hover = -1; this.cards.forEach((cd, i) => { const h = UIK.hit(cd, m.x, m.y); if (h) this.hover = i; specCard(ctx, cd.x, cd.y, cd.w, cd.h, cd.s, h, false, cd.n); });
      this.btns.forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y)));
      T.draw(ctx, `${this.page + 1} / ${this.pages}`, 240, 250, { size: 8, align: 'c', color: c.text });
      T.draw(ctx, this.list.length === this.all.length ? `всего необработанных: ${this.all.length}` : `показано ${this.list.length} из ${this.all.length}`, SW - 12, 250, { size: 8, align: 'r', color: c.dim });
    },
    click(x, y) {
      const fb = this.fbtns.find(b => UIK.hit(b, x, y)); if (fb) { this.f[fb.fid] = (this.f[fb.fid] + 1) % fb.n; this.page = 0; Snd.sfx.click(); return null; }
      const b = this.btns.find(b => !b.disabled && UIK.hit(b, x, y)); if (b) { if (b.id === 'prev') this.page--; else if (b.id === 'next') this.page++; Snd.sfx.click(); return b.id === 'close' ? { act: 'close' } : null; }
      const cd = this.cards.find(cd => UIK.hit(cd, x, y)); if (cd) return { act: 'begin', spec: cd.s };
      return null;
    },
  };

  // ------------------------------------------------------------------ the mini-game
  const G = {
    phase: 'none', spec: null, sp: null, pose: null, wi: 0, grabbed: false, pins: [], tear: 0, ring: 0, speed: 0, last: { x: 0, y: 0 }, doneT: 0, res: null, flash: 0, cur: { x: 0, y: 0 }, t: 0, tearSfx: 0, intro: 0,
    begin(spec) {
      this.spec = spec; this.sp = SPECIES_BY_ID[spec.sp]; this.pose = copy(Art.RAW); this.wi = 0; this.grabbed = false; this.pins = []; this.tear = 0; this.ring = 0; this.speed = 0; this.phase = 'work'; this.res = null; this.flash = 0; this.t = 0; this.intro = 4;
      this.last = { x: -100, y: -100 }; this.cur = { x: -100, y: -100 };
    },
    key() { return ORDER[this.wi]; },
    tipScreen(k, w) { const p = pivot(k), t = Art.tipPos(this.sp, k, w); return { x: p.x + mir(k) * t[0] * SC, y: p.y + t[1] * SC }; },
    update(dt, m) {
      this.t += dt; this.intro = Math.max(0, this.intro - dt);
      if (this.phase !== 'work') return;
      const k = this.key(), w = this.pose[k], p = pivot(k), P = Art.wingParts(this.sp), tip = part(k) === 'f' ? P.tf : P.th;
      const tr = 0.35 * this.sp.rar; // hand tremor grows with species fragility
      const mx = m.x + Math.sin(this.t * 7.1) * tr + Math.sin(this.t * 13.3) * tr * 0.5, my = m.y + Math.cos(this.t * 6.3) * tr + Math.cos(this.t * 11.7) * tr * 0.5;
      this.cur.x = mx; this.cur.y = my;
      this.ring = (this.ring + dt / 1.2) % 1;
      const sp = Math.hypot(m.x - this.last.x, m.y - this.last.y) / Math.max(dt, 1e-3); this.last.x = m.x; this.last.y = m.y;
      this.speed = damp(this.speed, Math.min(sp, 900), 10, dt);
      if (!this.grabbed) {
        const ts = this.tipScreen(k, w); if (Math.hypot(mx - ts.x, my - ts.y) < 15) { this.grabbed = true; Snd.sfx.grab(); }
      } else {
        const vx = (mx - p.x) / SC * mir(k), vy = (my - p.y) / SC; const tx = tip[0], ty = tip[1];
        const s2 = vx * vx + vy * vy - ty * ty; const s = clamp(s2 > 0 ? Math.sqrt(s2) / tx : 0.3, 0.3, 1.1);
        const a = clamp(Math.atan2(vy, vx) - Math.atan2(ty, s * tx), -2.6, 1.0);
        w.a = lerp(w.a, a, Math.min(1, dt * 20)); w.s = lerp(w.s, s, Math.min(1, dt * 20));
        if (this.speed > 260) { this.tear = Math.min(1, this.tear + (this.speed - 260) * dt / 520); this.flash = 0.25; this.tearSfx -= dt; if (this.tearSfx <= 0) { Snd.sfx.tear(); this.tearSfx = 0.35; } }
        this.flash = Math.max(0, this.flash - dt);
      }
    },
    press() {
      if (this.phase === 'result') return;
      if (this.phase !== 'work' || !this.grabbed) { Snd.sfx.deny(); return; }
      const k = this.key(), w = this.pose[k];
      const at = Art.tipPos(this.sp, k, w), id = Art.tipPos(this.sp, k, Art.IDEAL[k]);
      const d = Math.hypot(at[0] - id[0], at[1] - id[1]);
      const acc = Math.exp(-Math.pow(d / 5, 2)); const tim = clamp(1 - Math.abs(this.ring - 0.92) / 0.3); const gen = 1 - this.tear;
      const jit = (Math.random() - 0.5) * 0.09 * (1 - tim); w.a += jit;
      const score = 100 * (0.55 * acc + 0.2 * tim + 0.25 * gen);
      this.pins.push({ k, acc, tim, gen, d, score }); Snd.sfx.stick(score / 100);
      this.wi++; this.grabbed = false; this.tear = 0; this.ring = 0; this.speed = 0;
      if (this.wi >= 4) { this.phase = 'finish'; this.doneT = 0.9; }
    },
    finish() {
      const pn = this.pins; const avg = f => pn.reduce((a, b) => a + f(b), 0) / pn.length * 100;
      const dR = (kR, kL) => { const a = Art.tipPos(this.sp, kR, this.pose[kR]), b = Art.tipPos(this.sp, kL, this.pose[kL]); return Math.hypot(a[0] - b[0], a[1] - b[1]); };
      const sym = 100 * Math.exp(-Math.pow((dR('rf', 'lf') + dR('rh', 'lh')) / 2 / 5, 2));
      const mean = pn.reduce((a, b) => a + b.score, 0) / pn.length;
      const q = Math.round(clamp(0.85 * mean + 0.15 * sym, 1, 100));
      this.res = { acc: avg(p => p.acc), tim: avg(p => p.tim), gen: avg(p => p.gen), sym, q };
      this.spec.q = q; this.spec.pose = copy(this.pose); Save.syncSpread(this.spec);
      this.phase = 'result'; this.resT = 0; Snd.sfx.grade(q);
    },
    tick(dt) { if (this.phase === 'finish') { this.doneT -= dt; if (this.doneT <= 0) this.finish(); } if (this.phase === 'result') this.resT += dt; },

    drawBoard(ctx) {
      // desk
      Cab2.backdrop(ctx);
      // board: two slats with a groove, cork underlay
      ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(92, 62, 308, 156);
      for (const [x0, x1] of [[88, 228], [252, 392]]) {
        ctx.fillStyle = '#7a5834'; ctx.fillRect(x0, 58, x1 - x0, 152);
        ctx.fillStyle = '#a4c0a0'; ctx.fillStyle = '#b89a68'; ctx.fillRect(x0 + 3, 61, x1 - x0 - 6, 146);
        ctx.fillStyle = 'rgba(80,50,20,0.15)'; for (let i = 0; i < 18; i++) ctx.fillRect(x0 + 3 + (i * 37) % (x1 - x0 - 8), 61 + (i * 53) % 142, 2, 1);
        ctx.fillStyle = 'rgba(255,230,170,0.25)'; ctx.fillRect(x0, 58, x1 - x0, 1);
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fillRect(x0, 209, x1 - x0, 1);
      }
      ctx.fillStyle = '#2a1a0e'; ctx.fillRect(228, 58, 24, 152); ctx.fillStyle = '#16100a'; ctx.fillRect(232, 58, 16, 152);
      ctx.fillStyle = 'rgba(255,255,255,0.05)'; for (let i = 0; i < 6; i++) ctx.fillRect(88, 78 + i * 24, 304, 1);
    },
    drawWingExtras(ctx, t) {
      // paper strips and pins
      for (const p of this.pins) {
        const k = p.k, w = this.pose[k], pv = pivot(k), ts = this.tipScreen(k, w); const dx = ts.x - pv.x, dy = ts.y - pv.y, L = Math.hypot(dx, dy) || 1;
        ctx.save(); ctx.translate(pv.x + dx * 0.6, pv.y + dy * 0.6); ctx.rotate(Math.atan2(dy, dx) + Math.PI / 2);
        ctx.fillStyle = 'rgba(244,238,214,0.62)'; ctx.fillRect(-16, -2, 32, 5); ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.fillRect(-16, 3, 32, 1);
        ctx.fillStyle = '#d0d4dc'; ctx.fillRect(-17, -1, 2, 2); ctx.fillRect(15, -1, 2, 2); ctx.restore();
        const g = p.score >= 85 ? '#ffe27a' : '#e0e4ec';
        ctx.fillStyle = 'rgba(0,0,0,0.4)'; ctx.fillRect(Math.round(ts.x) - 1, Math.round(ts.y) + 1, 4, 3);
        ctx.fillStyle = g; ctx.fillRect(Math.round(ts.x) - 2, Math.round(ts.y) - 3, 4, 4); ctx.fillStyle = '#fff'; ctx.fillRect(Math.round(ts.x) - 2, Math.round(ts.y) - 3, 2, 2);
      }
    },
    draw(ctx, t, m) {
      if (this.phase === 'result') return this.drawResult(ctx, t, m);
      this.drawBoard(ctx);
      Art.drawPose(ctx, this.sp, this.pose, CX, CY, SC);
      if (this.phase === 'work') {
        const k = this.key(), w = this.pose[k], id = this.tipScreen(k, Art.IDEAL[k]);
        // target ring converging on the ideal tip
        const r = 22 - 18 * this.ring, near = clamp(1 - Math.abs(this.ring - 0.92) / 0.12);
        ctx.strokeStyle = near > 0.5 ? '#9af0a0' : 'rgba(240,200,90,0.9)'; ctx.lineWidth = 1; ctx.strokeRect(Math.round(id.x - r) + 0.5, Math.round(id.y - r) + 0.5, Math.round(r * 2), Math.round(r * 2));
        ctx.fillStyle = near > 0.5 ? '#9af0a0' : c.gold; ctx.fillRect(Math.round(id.x) - 1, Math.round(id.y) - 1, 3, 3);
        ctx.fillStyle = 'rgba(240,200,90,0.35)'; for (let i = -6; i <= 6; i += 4) { ctx.fillRect(Math.round(id.x) + i, Math.round(id.y) - 9, 1, 2); ctx.fillRect(Math.round(id.x) + i, Math.round(id.y) + 8, 1, 2); }
        // hint ring on the wing tip if not grabbed
        const ts = this.tipScreen(k, w);
        if (!this.grabbed) { const b = 8 + Math.sin(t * 8) * 2; ctx.strokeStyle = '#fff'; ctx.strokeRect(Math.round(ts.x - b) + 0.5, Math.round(ts.y - b) + 0.5, Math.round(b * 2), Math.round(b * 2)); }
        if (this.flash > 0) { ctx.fillStyle = `rgba(232,60,40,${this.flash * 0.8})`; ctx.fillRect(Math.round(ts.x) - 3, Math.round(ts.y) - 3, 7, 7); }
      }
      this.drawWingExtras(ctx, t);
      // header
      UIK.panel(ctx, 8, 6, 464, 40, { fill: 'rgba(16,32,28,0.92)', border: c.line });
      T.draw(ctx, `${this.sp.ru} · ${this.sp.la}`, 16, 10, { size: 8, color: c.gold });
      if (this.phase === 'work') {
        const k = this.key(); T.draw(ctx, `Крыло ${this.wi + 1} из 4: ${NAMES[k]}`, 16, 22, { size: 8, color: c.text });
        T.draw(ctx, this.grabbed ? 'Ведите иглу к золотой точке. Когда кольцо сожмётся — ПРОБЕЛ!' : 'Подведите иглу к кончику крыла (белая рамка), чтобы подцепить его.', 16, 33, { size: 8, color: this.grabbed ? '#9af0a0' : c.dim });
        // fragility bar
        T.draw(ctx, 'Хрупкость', 380, 10, { size: 8, color: c.dim }); ctx.fillStyle = '#0a1612'; ctx.fillRect(380, 22, 84, 8); ctx.fillStyle = this.tear > 0.6 ? c.red : this.tear > 0.3 ? '#e8b040' : '#7ee08a'; ctx.fillRect(381, 23, Math.round(82 * (1 - this.tear)), 6);
        T.draw(ctx, this.speed > 260 ? 'не так резко!' : 'двигайте плавно', 380, 33, { size: 8, color: this.speed > 260 ? c.red : '#6a8a78' });
      } else T.draw(ctx, 'Готово — подписываем этикетку…', 16, 22, { size: 8, color: c.text });
      for (let i = 0; i < 4; i++) { const ok = i < this.pins.length; ctx.fillStyle = ok ? (this.pins[i].score >= 85 ? '#ffe27a' : '#cfd4dc') : '#2a4a3c'; ctx.fillRect(16 + i * 12, 232, 8, 8); ctx.strokeStyle = '#0a1612'; ctx.strokeRect(15.5 + i * 12, 231.5, 9, 9); }
      T.draw(ctx, 'Esc — отменить', SW - 12, 232, { size: 8, align: 'r', color: '#6a8a78' });
      // needle cursor
      if (this.phase === 'work') {
        const x = Math.round(this.cur.x), y = Math.round(this.cur.y);
        ctx.fillStyle = 'rgba(0,0,0,0.35)'; for (let i = 0; i < 14; i++) ctx.fillRect(x + i + 2, y - i + 2, 1, 1);
        ctx.fillStyle = '#e8ecf4'; for (let i = 0; i < 14; i++) ctx.fillRect(x + i, y - i, 1, 1); ctx.fillStyle = '#8890a0'; for (let i = 0; i < 14; i++) ctx.fillRect(x + i + 1, y - i, 1, 1);
        ctx.fillStyle = this.grabbed ? '#9af0a0' : c.gold; ctx.fillRect(x - 1, y - 1, 3, 3); ctx.fillStyle = '#c04a4a'; ctx.fillRect(x + 13, y - 15, 3, 3);
      }
    },
    drawResult(ctx, t, m) {
      Cab2.backdrop(ctx); const r = this.res, g = Grade(r.q);
      // specimen on a card
      UIK.panel(ctx, 14, 30, 220, 200, { fill: '#e8dcb8', border: '#5a3a1c' });
      ctx.fillStyle = '#d8c898'; ctx.fillRect(18, 34, 212, 192);
      Art.drawPose(ctx, this.sp, this.pose, 124, 100, 2); // wings @2x
      const lw = (Math.floor(this.resT * 30));
      T.draw(ctx, this.sp.ru, 124, 168, { size: 8, align: 'c', color: '#3a2008' }); T.draw(ctx, this.sp.la, 124, 180, { size: 8, align: 'c', color: '#5a3a1c' });
      T.draw(ctx, `${BIOME_BY_ID[this.spec.biome].place}`, 124, 194, { size: 8, align: 'c', color: '#5a3a1c' }); T.draw(ctx, fmtDate(this.spec.date), 124, 206, { size: 8, align: 'c', color: '#5a3a1c' });
      // score
      UIK.panel(ctx, 244, 30, 224, 200, { fill: 'rgba(16,32,28,0.95)', border: g.col });
      T.draw(ctx, 'Результат расправления', 356, 36, { size: 8, align: 'c', color: c.dim });
      const grow = Math.min(1, this.resT / 0.8), q = Math.round(r.q * grow);
      T.draw(ctx, q + '%', 356, 50, { size: 22, align: 'c', color: g.col, outline: '#000' });
      T.draw(ctx, g.name, 356, 80, { size: 10, align: 'c', color: g.col, shadow: '#000' });
      const bars = [['Точность булавок', r.acc], ['Ритм постановки', r.tim], ['Бережность', r.gen], ['Симметрия', r.sym]];
      bars.forEach(([n, v], i) => { const y = 102 + i * 24; T.draw(ctx, n, 256, y, { size: 8, color: c.text }); T.draw(ctx, Math.round(v * grow) + '%', 456, y, { size: 8, align: 'r', color: c.dim }); ctx.fillStyle = '#0a1612'; ctx.fillRect(256, y + 11, 200, 6); ctx.fillStyle = v > 85 ? '#7ee08a' : v > 60 ? '#e8c860' : '#e8704a'; ctx.fillRect(257, y + 12, Math.round(198 * v / 100 * grow), 4); });
      const tips = r.q >= 95 ? 'Ювелирная работа — такую можно в музей!' : r.q >= 70 ? 'Крылья лежат ровно. Можно в коробку.' : r.q >= 50 ? 'Рука дрогнула. В коробку можно, но на стену лучше получше.' : 'Лучше расправить следующую аккуратнее.';
      T.para(ctx, tips, 256, 200, 205, { size: 8, color: c.dim, lh: 10 });
      this.btn = { id: 'ok', label: 'Готово', x: 360, y: 240, w: 110, h: 20, size: 10 }; UIK.btn(ctx, this.btn, UIK.hit(this.btn, m.x, m.y));
      T.draw(ctx, 'бабочка перенесена в «расправленные»', 12, 246, { size: 8, color: '#6a8a78' });
    },
    click(x, y) { if (this.phase === 'result' && this.btn && UIK.hit(this.btn, x, y)) { Snd.sfx.click(); return 'done'; } return null; },
  };
  return { pick, G };
})();
