// traps: buy, put, load with flowers / honey, butterflies arrive (rarer with better honey), durability, aberrations of the imported one, taking the catch, leaving the location
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const shot = n => pg.screenshot({ path: `/tmp/trap_${n}.png` });
  // ---- the goods and the numbers
  const g = await pg.evaluate(() => {
    const o = {}; o.types = Traps.TYPES; o.nF = Traps.FLOWERS.length; o.nH = Traps.HONEYS.length; o.rate = [Traps.rate('', ''), Traps.rate('cornflower', ''), Traps.rate('lavender', ''), Traps.rate('', 'heather'), Traps.rate('lavender', 'heather')];
    const b = BIOME_BY_ID.russia, cnt = h => { const c = { 1: 0, 2: 0, 3: 0 }; for (let i = 0; i < 4000; i++) { const sp = Traps.pick(b, h, 'std'); c[sp.rar || 1]++; } return c; }; o.none = cnt(''); o.best = cnt('heather');
    let ab = 0, abS = 0; for (let i = 0; i < 20000; i++) { if (Traps.pick(b, 'meadow', 'imp').ab) ab++; if (Traps.pick(b, 'meadow', 'std').ab) abS++; } o.ab = ab / 20000; o.abS = abS;
    o.day = Traps.lure(BIOME_BY_ID.russia).every(s => !s.mystery);
    return o;
  });
  T('three traps: 900 / 1800 / 2800 coins, life 2 / 6 / 4 minutes', g.types.std.price === 900 && g.types.str.price === 1800 && g.types.imp.price === 2800 && g.types.std.life === 120 && g.types.str.life === 360 && g.types.imp.life === 240, [g.types.std.life, g.types.str.life, g.types.imp.life]);
  T('real flowers (several scent levels) and honeys (several qualities)', g.nF >= 8 && g.nH >= 8, [g.nF, g.nH]);
  T('nothing in the trap → nobody comes; flowers bring them, stronger scent more often', g.rate[0] === 0 && g.rate[2] > g.rate[1] && g.rate[1] > 0, g.rate);
  T('honey raises the share of rare butterflies', g.best[3] / (g.best[1] + g.best[2] + g.best[3]) > 2 * g.none[3] / (g.none[1] + g.none[2] + g.none[3]) - 1e-9 && g.best[2] / 4000 > g.none[2] / 4000, [g.none, g.best]);
  T('only the imported trap gives aberrations (about 1%)', g.ab > 0.004 && g.ab < 0.02 && g.abS === 0, [g.ab, g.abS]);
  // ---- an expedition
  await pg.evaluate(() => { Save.data.coins = 10000; Save.data.trap = null; Save.data.maps = Save.data.maps || {}; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('russia', 'TRAP1'); });
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; });
  const none = await pg.evaluate(() => { const p = F0W.play; p.traps.place('std'); return { n: p.traps.list.length, overlay: F0W.overlay }; });
  T('without a trap in the stock nothing is put', none.n === 0, none);
  await pg.evaluate(() => { for (const [k, id] of [['tr', 'std'], ['tr', 'imp'], ['fl', 'lavender'], ['fl', 'chamomile'], ['hn', 'heather'], ['hn', 'meadow']]) Traps.add(k, id, 1); const m = F0W.cab; });
  // G opens the window, a click puts the trap
  await pg.evaluate(() => { const p = F0W.play, P = p.player, w = p.world; P.yaw = 0.3; window.__spot = p.traps.spot(); F0W.overlay = null; window.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyG', bubbles: true })); });
  await pg.waitForTimeout(300); const ov = await pg.evaluate(() => [F0W.overlay, Traps.UI.mode]); T('G opens the «put a trap» window', ov[0] === 'trap' && ov[1] === 'place', ov); await shot('place');
  await pg.evaluate(() => { F0W.mouse = F0W.mouse; const b = Traps.UI.layout().find(q => q.tid === 'std'); const r = Traps.UI.click(b.x + 3, b.y + 3); if (r === 'close') F0W.overlay = null; });
  const t1 = await pg.evaluate(() => { const p = F0W.play, t = p.traps.list[0]; return t && { type: t.type, y: t.y, ground: p.world.groundAt(t.x, t.z), col: p.world.colliders.some(c => c.trap === t.tid), stock: Traps.count('tr', 'std'), life: t.life, d: Math.hypot(t.x - p.player.pos.x, t.z - p.player.pos.z) }; });
  T('a click puts the trap on the ground in front of the player (and takes it from the stock)', t1 && t1.type === 'std' && Math.abs(t1.y - t1.ground) < 0.01 && t1.col && t1.stock === 0 && t1.d > 1 && t1.d < 2.5, t1);
  const t2 = await pg.evaluate(() => { const p = F0W.play, t = p.traps.list[0]; p.traps.update(3); return { n: t.items.length, near: !!p.traps.near }; });
  T('an empty trap catches nothing', t2.n === 0, t2);
  // loading: flowers + honey through the window
  await pg.evaluate(() => { const p = F0W.play, t = p.traps.list[0]; p.player.pos.set(t.x + 1.0, p.player.pos.y, t.z); p.player.yaw = Math.atan2(-(t.x - p.player.pos.x), -(t.z - p.player.pos.z)); p.traps.update(0.02); Traps.UI.openTrap(p, p.traps.near); F0W.overlay = 'trap'; });
  const nr = await pg.evaluate(() => [Traps.UI.mode, !!F0W.play.traps.near]); T('walking up to your trap and pressing E shows its window', nr[0] === 'manage' && nr[1], nr); await shot('manage_empty');
  // the sliders go round in both directions
  const sl = await pg.evaluate(() => { const U = Traps.UI; for (const id of ['chamomile', 'cornflower']) Traps.add('fl', id, 1); const names = Traps.owned('fl').map(f => f.id), n = names.length, seen = [], click = id => { const b = U.layout().find(q => q.id === id); U.click(b.x + 2, b.y + 2); return U.cand('fl').id; };
    const start = U.cand('fl').id; const fwd = []; for (let i = 0; i <= n; i++) fwd.push(click('fln')); const back = []; for (let i = 0; i <= n; i++) back.push(click('flp'));
    return { n, start, fwd, back, names }; });
  T('the flower slider goes round forwards (all items once, then the first again) and backwards', sl.n >= 3 && new Set(sl.fwd.slice(0, sl.n)).size === sl.n && sl.fwd[sl.n - 1] === sl.start && new Set(sl.back.slice(0, sl.n)).size === sl.n && sl.back[sl.n - 1] === sl.fwd[sl.n], sl);
  const lk = await pg.evaluate(() => { const U = Traps.UI, S = F0W.play.traps, t = S.list[0]; const put = id => { const b = U.layout().find(q => q.id === id); U.click(b.x + 2, b.y + 2); };
    const cf = U.cand('fl').id, ch = U.cand('hn').id, stF = Traps.count('fl', cf), stH = Traps.count('hn', ch); put('flput'); put('hnput');
    const o = { fl: t.fl === cf, hn: t.hn === ch, stF: stF - Traps.count('fl', cf), stH: stH - Traps.count('hn', ch) };
    o.buttons = U.layout().map(q => q.id).filter(id => /^(fl|hn)/.test(id)); o.again = S.bait(t, 'lavender', 'meadow'); o.same = t.fl === cf && t.hn === ch; o.afterStock = [Traps.count('fl', 'lavender'), Traps.count('hn', 'meadow')]; return o; });
  T('a slot is filled once: flowers and honey are taken from the stock and cannot be taken out or replaced', lk.fl && lk.hn && lk.stF === 1 && lk.stH === 1 && lk.buttons.length === 0 && lk.again === false && lk.same && lk.afterStock[0] >= 1, lk);
  const bt = await pg.evaluate(() => { const t = F0W.play.traps.list[0]; return { fl: t.fl, hn: t.hn }; });
  await pg.evaluate(() => { for (let i = 0; i < 240; i++) F0W.play.traps.update(0.25); }); const mid = await pg.evaluate(() => F0W.play.traps.list[0].items.length); T('with bait butterflies come', mid > 0, mid);
  // «Забрать улов» while the trap is still working
  await pg.evaluate(() => { const t = F0W.play.traps.list[0]; const r = Traps.UI.layout().find(q => q.id === 'take'); window.__n = t.items.length; window.__spec = Save.data.specimens.length; Traps.UI.click(r.x + 3, r.y + 3); });
  const tk = await pg.evaluate(() => ({ got: Save.data.specimens.length - window.__spec, want: window.__n, left: F0W.play.traps.list.length, now: F0W.play.traps.list[0].items.length }));
  T('«Забрать улов» moves the butterflies into the cabinet; the trap stays', tk.got === tk.want && tk.want > 0 && tk.left === 1 && tk.now === 0, tk);
  // a trap that wears out vanishes together with its catch (nothing is credited)
  await pg.evaluate(() => { const p = F0W.play, t = p.traps.list[0]; const L0 = t.life; t.life = 99999; for (let i = 0; i < 4000 && t.items.length < 2; i++) p.traps.update(0.25); window.__n = t.items.length; window.__spec = Save.data.specimens.length; t.life = L0; t.t = L0 - 1; for (let i = 0; i < 8; i++) p.traps.update(0.25); });
  const worn = await pg.evaluate(() => ({ had: window.__n, listed: F0W.play.traps.list.length, fliers: F0W.play.traps.fliers.length, credited: Save.data.specimens.length - window.__spec, colliders: F0W.play.world.colliders.filter(c => c.trap).length }));
  T('a trap that wears out disappears with its catch: nothing is credited, no collider and no flier is left', worn.had >= 2 && worn.listed === 0 && worn.fliers === 0 && worn.credited === 0 && worn.colliders === 0, worn); await shot('manage_full');
  // no limit on the number of traps: ten of them stand at once
  const many = await pg.evaluate(() => { const p = F0W.play, S = p.traps; Traps.add('tr', 'std', 12); const before = S.list.length; let ok = 0; for (let i = 0; i < 12; i++) { p.player.yaw = i * 0.52; p.player.pos.x += 2.2 * Math.cos(i); p.player.pos.z += 2.2 * Math.sin(i); if (S.place('std')) ok++; } const r = { placed: ok, own: S.own().length, before, stock: Traps.count('tr', 'std') }; for (const t of S.own().slice()) S.drop(t); return r; });
  T('there is no limit on the number of traps per player or location', many.placed >= 8 && many.own - many.before === many.placed && many.own > 4, many);
  // the imported trap: durability 4 minutes; leaving the location without taking the catch loses it
  await pg.evaluate(() => { F0W.overlay = null; const p = F0W.play; const t = p.traps.place('imp'); t.fl = 'lavender'; t.hn = 'heather'; for (let i = 0; i < 400 && !t.items.length; i++) p.traps.update(0.25); for (let i = 0; i < 80; i++) p.traps.update(0.25); window.__before = Save.data.specimens.length; window.__in = t.items.length; });
  const sw = await pg.evaluate(() => ({ life: F0W.play.traps.list[0].life, n: window.__in }));
  T('the imported trap lives 4 minutes and fills up', sw.life === 240 && sw.n > 0, sw);
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMap(); }); await pg.waitForTimeout(800);
  const lv = await pg.evaluate(() => ({ got: Save.data.specimens.length - window.__before, n: window.__in, screen: F0W.screen })); T('leaving the location without taking the butterflies out loses them: nothing is credited', lv.got === 0 && lv.n > 0, lv);
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5) : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
