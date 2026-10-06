// ---------------------------------------------------------------- butterfly nets: three parts (handle, hoop, mesh), assembled at the workbench, bought at the market
// Parts are consumed when a net is assembled and returned when it is taken apart. Effects of the three parts add up:
//   speed  — swing speed (+x%),  radius — catch radius (+x%),  ab — chance that a caught butterfly turns out to be an aberration (+x, absolute)
const NetParts = (() => {
  const SLOTS = [{ id: 'h', ru: 'Ручка' }, { id: 'r', ru: 'Обруч' }, { id: 'm', ru: 'Сетка' }];
  const PARTS = {
    h_basic: { slot: 'h', ru: 'Деревянная ручка', price: 0, fx: {}, vis: {}, desc: 'Обычная ручка. Всегда под рукой.' },
    r_basic: { slot: 'r', ru: 'Проволочный обруч', price: 0, fx: {}, vis: {}, desc: 'Обычный обруч. Всегда под рукой.' },
    m_basic: { slot: 'm', ru: 'Хлопковая сетка', price: 0, fx: {}, vis: {}, desc: 'Обычная сетка. Всегда под рукой.' },
    m_tough: { slot: 'm', ru: 'Сетка из прочного полотна', price: 700, fx: { speed: 0.12 }, vis: { mesh: '#c8b88a', wire: '#6a5a38', op: 0.6 }, desc: 'Плотная и лёгкая ткань не парусит.' },
    m_big: { slot: 'm', ru: 'Увеличенная сетка', price: 750, fx: { radius: 0.12 }, vis: { bag: 1.4 }, desc: 'Глубокий мешок — бабочке труднее выскользнуть.' },
    m_silk: { slot: 'm', ru: 'Сетка из шёлка', price: 2200, fx: { ab: 0.005 }, vis: { mesh: '#f6eaff', wire: '#b88ae8', op: 0.55 }, desc: 'Редкий шёлк: пойманная бабочка с шансом 0,5% окажется аберрантом.' },
    r_steel: { slot: 'r', ru: 'Обруч из стали', price: 850, fx: { speed: 0.12 }, vis: { hoop: '#8a96a6', th: 1.4 }, desc: 'Жёсткий обруч не гнётся на взмахе.' },
    r_big: { slot: 'r', ru: 'Увеличенный обруч', price: 1100, fx: { radius: 0.15 }, vis: { R: 1.35 }, desc: 'Широкий обруч захватывает больше.' },
    r_plastic: { slot: 'r', ru: 'Обруч из пластика', price: 1600, fx: { speed: 0.3 }, vis: { hoop: '#38c8e8', th: 1.5 }, desc: 'Почти невесомый обруч — взмах очень быстрый.' },
    h_long: { slot: 'h', ru: 'Удлинённая ручка', price: 800, fx: { radius: 0.1 }, vis: { len: 1.5 }, desc: 'Длинная ручка достаёт дальше.' },
    h_plastic: { slot: 'h', ru: 'Ручка из пластика', price: 950, fx: { speed: 0.15 }, vis: { handle: '#e8508c', grip: '#a82a5c' }, desc: 'Лёгкая ручка быстрее разгоняется.' },
    // second batch
    h_bamboo: { slot: 'h', ru: 'Ручка из бамбука', price: 500, fx: { speed: 0.1, radius: 0.04 }, vis: { handle: '#c8b060', grip: '#6a5a28', len: 1.1 }, desc: 'Лёгкий и упругий бамбук: чуть быстрее и чуть дальше.' },
    h_tele: { slot: 'h', ru: 'Телескопическая ручка', price: 1400, fx: { radius: 0.18 }, vis: { len: 1.7, th: 0.9, handle: '#a8b0b8', grip: '#383c44' }, desc: 'Выдвигается почти вдвое — достаёт самых осторожных.' },
    h_carbon: { slot: 'h', ru: 'Ручка из карбона', price: 1600, fx: { speed: 0.22 }, vis: { handle: '#2c2e36', grip: '#14161a' }, desc: 'Жёсткий карбон почти не гнётся — взмах очень быстрый.' },
    h_ebony: { slot: 'h', ru: 'Ручка из эбенового дерева', price: 1900, fx: { quiet: 0.2, ab: 0.003 }, vis: { handle: '#3a2418', grip: '#1a100a' }, desc: 'Тёмное дерево гасит звук взмаха; иногда приносит редкую удачу.' },
    h_gem: { slot: 'h', ru: 'Ручка с самоцветом', price: 2100, fx: { dbl: 0.08 }, vis: { handle: '#7a5ac8', grip: '#e8c840' }, desc: 'С шансом 8% пойманная бабочка достаётся вам дважды.' },
    r_titan: { slot: 'r', ru: 'Обруч из титана', price: 1500, fx: { speed: 0.2, radius: 0.05 }, vis: { hoop: '#7a8aa0', th: 1.6 }, desc: 'Лёгкий и прочный: быстрый взмах и чуть шире захват.' },
    r_double: { slot: 'r', ru: 'Двойной обруч', price: 1700, fx: { radius: 0.22 }, vis: { hoop: '#c8d0d8', th: 1.2, R: 1.5 }, desc: 'Очень широкий обруч — почти не промахнуться.' },
    r_carbon: { slot: 'r', ru: 'Обруч из углепластика', price: 1300, fx: { speed: 0.18, quiet: 0.15 }, vis: { hoop: '#2a2c34', th: 1.5 }, desc: 'Быстрый и тихий: бабочки меньше пугаются.' },
    r_silver: { slot: 'r', ru: 'Обруч из серебра', price: 2000, fx: { ab: 0.004 }, vis: { hoop: '#e8ecf0', th: 1.3 }, desc: 'Серебро притягивает редкие формы: +0,4% шанс аберранта.' },
    m_web: { slot: 'm', ru: 'Сетка из паутинного шёлка', price: 900, fx: { quiet: 0.25, speed: 0.08 }, vis: { mesh: '#f0f4f8', wire: '#aab4c0', op: 0.35 }, desc: 'Невесомая сетка рассекает воздух почти беззвучно.' },
    m_deep: { slot: 'm', ru: 'Глубокая сетка', price: 1200, fx: { radius: 0.08, dbl: 0.05 }, vis: { bag: 1.7, mesh: '#c8dcd0' }, desc: 'Глубокий мешок: иногда в него попадает вторая бабочка (5%).' },
    m_gold: { slot: 'm', ru: 'Позолоченная сетка', price: 1800, fx: { coin: 8 }, vis: { mesh: '#ffe9a0', wire: '#d8a830', op: 0.5 }, desc: 'За каждую пойманную бабочку — 8 монет от благодарных коллекционеров.' },
    h_chrome: { slot: 'h', ru: 'Ручка из хрома', price: 2400, fx: { ab: 0.005 }, vis: { handle: '#dce8f0', grip: '#8a98a8' }, desc: 'Блестящий хром: пойманная бабочка с шансом 0,5% окажется аберрантом.' },
  };
  const BASIC = { uid: 0, h: 'h_basic', r: 'r_basic', m: 'm_basic' };
  const SHOP = Object.keys(PARTS).filter(k => PARTS[k].price > 0);
  const isBasic = id => PARTS[id] && PARTS[id].price === 0;
  const parts = cfg => [PARTS[cfg.h] || PARTS.h_basic, PARTS[cfg.r] || PARTS.r_basic, PARTS[cfg.m] || PARTS.m_basic];
  function stats(cfg) { let sp = 0, rd = 0, ab = 0, q = 0, db = 0, co = 0; for (const p of parts(cfg || BASIC)) { sp += p.fx.speed || 0; rd += p.fx.radius || 0; ab += p.fx.ab || 0; q += p.fx.quiet || 0; db += p.fx.dbl || 0; co += p.fx.coin || 0; } return { speed: 1 + sp, radius: 1 + rd, ab, quiet: Math.min(0.6, q), dbl: db, coin: co }; }
  function vis(cfg) {
    const v = { handle: '#9a6a38', grip: '#2a2018', len: 1, th: 1, hoop: '#eef2f4', R: 1, hth: 1, mesh: '#d4e8e0', wire: '#6f9088', op: 0.4, bag: 1 };
    for (const p of parts(cfg || BASIC)) { const q = p.vis; for (const k in q) { if (k === 'th') { if (p.slot === 'r') v.hth = q.th; else v.th = q.th; } else v[k] = q[k]; } }
    return v;
  }
  const code = cfg => (cfg && (!isBasic(cfg.h) || !isBasic(cfg.r) || !isBasic(cfg.m))) ? `${cfg.h}.${cfg.r}.${cfg.m}` : '';
  function parse(s) { if (!s || typeof s !== 'string') return BASIC; const a = s.split('.'); if (a.length !== 3) return BASIC; const [h, r, m] = a; return (PARTS[h] && PARTS[h].slot === 'h' && PARTS[r] && PARTS[r].slot === 'r' && PARTS[m] && PARTS[m].slot === 'm') ? { uid: -1, h, r, m } : BASIC; }
  const fxLines = fx => { const o = []; if (fx.speed) o.push(`+${Math.round(fx.speed * 100)}% скорость взмаха`); if (fx.radius) o.push(`+${Math.round(fx.radius * 100)}% радиус ловли`); if (fx.ab) o.push(`+${(fx.ab * 100).toFixed(1).replace('.', ',')}% шанс аберранта`); if (fx.quiet) o.push(`-${Math.round(fx.quiet * 100)}% шум взмаха`); if (fx.dbl) o.push(`${Math.round(fx.dbl * 100)}% шанс двойного улова`); if (fx.coin) o.push(`+${fx.coin} монет за бабочку`); return o; };
  const fxShort = fx => fxLines(fx).map(s => s.replace('скорость взмаха', 'скор.').replace('радиус ловли', 'радиус').replace('шанс аберранта', 'аберрант').replace('шанс двойного улова', 'двойной улов').replace('шум взмаха', 'шум').replace(' монет за бабочку', ' монет/улов')).join(' · ');
  const statLines = cfg => { const s = stats(cfg), o = []; o.push(s.speed > 1 ? `Скорость взмаха: +${Math.round((s.speed - 1) * 100)}%` : 'Скорость взмаха: обычная'); o.push(s.radius > 1 ? `Радиус ловли: +${Math.round((s.radius - 1) * 100)}%` : 'Радиус ловли: обычный'); o.push(s.ab > 0 ? `Шанс аберранта: +${(s.ab * 100).toFixed(1).replace('.', ',')}%` : 'Шанс аберранта: обычный'); if (s.quiet) o.push(`Шум взмаха: -${Math.round(s.quiet * 100)}%`); if (s.dbl) o.push(`Двойной улов: ${Math.round(s.dbl * 100)}%`); if (s.coin) o.push(`Монеты за улов: +${s.coin}`); return o; };
  const name = (cfg, i) => cfg.uid === 0 ? 'Обычный сачок' : `Сачок №${i + 1}`;

  // 2D picture of a net (pixel lines), used by the workbench and the shop
  function line(ctx, x0, y0, x1, y1, w) { x0 = Math.round(x0); y0 = Math.round(y0); x1 = Math.round(x1); y1 = Math.round(y1); const dx = Math.abs(x1 - x0), dy = -Math.abs(y1 - y0), sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1; let e = dx + dy; for (let n = 0; n < 600; n++) { ctx.fillRect(x0, y0, w, w); if (x0 === x1 && y0 === y1) break; const e2 = 2 * e; if (e2 >= dy) { e += dy; x0 += sx; } if (e2 <= dx) { e += dx; y0 += sy; } } }
  function draw2D(ctx, cfg, x, y, w, h) {
    const V = vis(cfg), s = Math.min(w / 1.9, h / 2.3), POLE = 1.2 * V.len * s, R = 0.3 * V.R * s * 1.7, BAG = 0.9 * V.bag * s * 0.9; const d = { x: 0.6, y: -0.8 }, pp = { x: 0.8, y: 0.6 };
    const gx = x + w * 0.1, gy = y + h - 4, ex = gx + d.x * POLE, ey = gy + d.y * POLE, cx = ex + d.x * R, cy = ey + d.y * R, ap = { x: cx + 0.2 * BAG, y: cy + 0.95 * BAG };
    const ring = []; for (let i = 0; i < 24; i++) { const a = i / 24 * 6.2832; ring.push({ x: cx + d.x * Math.cos(a) * R + pp.x * Math.sin(a) * R * 0.5, y: cy + d.y * Math.cos(a) * R + pp.y * Math.sin(a) * R * 0.5 }); }
    ctx.save(); ctx.globalAlpha = 0.28 + V.op * 0.4; ctx.fillStyle = V.mesh; ctx.beginPath(); ring.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)); ctx.lineTo(ap.x, ap.y); ctx.closePath(); ctx.fill(); ctx.restore();
    ctx.fillStyle = V.wire; for (let i = 0; i < 24; i += 3) line(ctx, ring[i].x, ring[i].y, ap.x, ap.y, 1); for (const k of [0.33, 0.66]) { let prev = null; ring.forEach((p, i) => { const q = { x: p.x + (ap.x - p.x) * k, y: p.y + (ap.y - p.y) * k }; if (prev && i % 1 === 0) line(ctx, prev.x, prev.y, q.x, q.y, 1); prev = q; }); }
    const th = Math.max(1, Math.round(V.th * 1.5)); ctx.fillStyle = V.handle; line(ctx, gx, gy, ex, ey, th); ctx.fillStyle = V.grip; line(ctx, gx, gy, gx + d.x * POLE * 0.3, gy + d.y * POLE * 0.3, th + 1);
    ctx.fillStyle = V.hoop; const hr = Math.max(1, Math.round(V.hth * 1.3)); ring.forEach((p, i) => { const q = ring[(i + 1) % ring.length]; line(ctx, p.x, p.y, q.x, q.y, hr); });
  }
  return { SLOTS, PARTS, BASIC, SHOP, isBasic, stats, vis, code, parse, fxLines, fxShort, statLines, name, draw2D };
})();

// inventory / assembly / equipment (everything here is personal, like coins)
Object.assign(Save, {
  netList() { return this.data.nets || (this.data.nets = []); },
  partsObj() { return this.data.parts || (this.data.parts = {}); },
  partCount(id) { return this.partsObj()[id] || 0; },
  buyPart(id) { const p = NetParts.PARTS[id]; if (!p || !p.price || (this.data.coins || 0) < p.price) return false; this.data.coins -= p.price; this.partsObj()[id] = this.partCount(id) + 1; this.write(); return true; },
  curNet() { const u = this.data.netEq || 0; return (u && this.netList().find(n => n.uid === u)) || NetParts.BASIC; },
  assembleNet(sel) {                                  // sel = { h, r, m } part ids; basic parts are free, the others are taken from the inventory
    const ids = [sel.h, sel.r, sel.m]; if (ids.every(NetParts.isBasic)) return null;
    for (const id of ids) if (!NetParts.isBasic(id) && this.partCount(id) < ids.filter(x => x === id).length) return null;
    if (this.netList().length >= 12) return null;
    for (const id of ids) if (!NetParts.isBasic(id)) this.partsObj()[id]--;
    const n = { uid: this.data.netUid = (this.data.netUid || 1) + 1, h: sel.h, r: sel.r, m: sel.m }; this.netList().push(n); this.write(); return n;
  },
  disassembleNet(uid) {
    const L = this.netList(), i = L.findIndex(n => n.uid === uid); if (i < 0) return false; const n = L[i];
    for (const id of [n.h, n.r, n.m]) if (!NetParts.isBasic(id)) this.partsObj()[id] = this.partCount(id) + 1;
    L.splice(i, 1); if (this.data.netEq === uid) this.data.netEq = 0; this.write(); return true;
  },
  equipNet(uid) { if (uid && !this.netList().some(n => n.uid === uid)) return false; this.data.netEq = uid || 0; this.write(); return true; },
});
