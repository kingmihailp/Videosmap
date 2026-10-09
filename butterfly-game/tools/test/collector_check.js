// the collector (framed collections are priced by size + butterflies + a bonus for a systematic collection) and the wings of the guiding butterfly that open the ocean
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const shot = n => pg.screenshot({ path: `/tmp/coll_${n}.png` });
  const waitScr = async (s, k) => { for (let i = 0; i < 80; i++) { if (await pg.evaluate(([s, k]) => F0W.screen === s && (!k || (F0W.cab && F0W.cab.constructor.name === k)), [s, k]).catch(() => false)) return true; await pg.waitForTimeout(400); } return false; };
  // ---- the ocean is closed at the start
  const a = await pg.evaluate(() => { Save.data.maps = {}; Save.data.caught = {}; Save.data.wing = null; Save.data.specimens = []; Save.data.boxes = []; Save.data.coins = 0; return { start: Wings.START.map(b => b.id), ocean: Maps.allowed('ocean'), vis: visibleBiomes().map(b => b.id), chk: Wings.check().length }; });
  T('8 starting locations, the ocean is not among them', a.start.length === 8 && !a.start.includes('ocean'), a.start);
  T('the ocean is closed and not on the map', !a.ocean && !a.vis.includes('ocean') && a.chk === 0, a.vis);
  // ---- price: size + butterflies + bonus
  const p = await pg.evaluate(() => {
    const out = {}; const mkBox = (size, ids, q) => { const b = Save.addBox(size, 0); ids.forEach((id, i) => { Save.add(id, SPECIES_BY_ID[id].biome); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.q = q === undefined ? 80 : q; s.box = b.uid; b.items[i] = s.uid; }); return b; };
    const fam = {}; for (const s of SPECIES) { if (s.mystery || s.ab || s.biome === 'ocean') continue; (fam[s.fam] = fam[s.fam] || []).push(s.id); }
    const big = Object.entries(fam).sort((x, y) => y[1].length - x[1].length)[0]; out.fam = big[0]; const same = big[1].slice(0, 4);
    const mixed = [], used = new Set(); for (const b of Wings.START) { const sp = b.species.find(x => !used.has(x.fam)); if (sp && mixed.length < 4) { used.add(sp.fam); mixed.push(sp.id); } }
    const bS = mkBox('S', same), bM = mkBox('S', mixed), bL = mkBox('L', same), bE = mkBox('M', []);
    out.same = Collection.info(bS); out.mixed = Collection.info(bM); out.L = Collection.info(bL); out.empty = Collection.info(bE);
    const strip = i => ({ n: i.n, cap: i.cap, frame: i.frame, sum: i.sum, bonus: i.bonus, total: i.total, theme: i.theme && i.theme.name, found: i.found.map(f => f.id) });
    out.same = strip(out.same); out.mixed = strip(out.mixed); out.L = strip(out.L); out.empty = strip(out.empty);
    out.sumCheck = bS.items.filter(Boolean).reduce((a, u) => a + Econ.info(Save.spec(u)).price, 0);
    // a spread one costs more than a raw one in the same frame
    const bR = mkBox('S', same, null); out.raw = Collection.info(bR).sum; out.spread = Collection.info(bS).sum; out.uid = bS.uid;
    // sizes
    out.frames = { S: Collection.info(bS).frame, M: Collection.info(bE).frame, L: Collection.info(bL).frame };
    return out;
  });
  T('frame price by size: 100 / 200 / 300', p.frames.S === 100 && p.frames.M === 200 && p.frames.L === 300, p.frames);
  T('total = frame + butterflies + bonus', p.same.total === p.same.frame + p.same.sum + p.same.bonus && p.same.sum === p.sumCheck, p.same);
  T('a family in a row gives a bonus (at least 400 per pattern), a mixed frame none', p.same.bonus >= 400 && p.mixed.bonus === 0, [p.same, p.mixed]);
  T('spread butterflies are worth more than raw ones', p.spread > p.raw, [p.raw, p.spread]);
  T('a half-empty large frame earns no collection bonus (needs at least half filled)', p.L.frame === 300 && p.L.bonus === 0 && p.L.total === 300 + p.L.sum, p.L);
  // themes: aberrants only, one location, one species, ordering matters
  const q = await pg.evaluate(() => {
    const ids = Save.data.specimens.map(s => s.sp); const info = (size, spIds, q) => { const b = Save.addBox(size, 0); spIds.forEach((id, i) => { Save.add(id, 'x'); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.q = q ? q[i] : 80; s.box = b.uid; b.items[i] = s.uid; }); const r = Collection.info(b); return { n: r.n, bonus: r.bonus, theme: r.theme && r.theme.id, found: r.found.map(f => f.id) }; };
    const out = {}; const bi = SPECIES.filter(s => s.biome === 'ornithoptera' || s.biome === 'papua').length;
    const ab = []; for (const s of SPECIES) { if (ab.length >= 4) break; if (s.mystery || s.biome === 'ocean' || s.ab || s.rar === 3) continue; try { ab.push(Aberr.make(s, 'ABCDE').id); } catch (e) {} }
    out.ab = info('S', ab); const first = Wings.START[0].species.slice(0, 4).map(s => s.id), mixedBiomes = Wings.START.slice(0, 4).map(b => b.species[0].id);
    out.biome = info('S', first); out.mixB = info('S', mixedBiomes);
    const sp1 = first[0]; out.oneSp = info('S', [sp1, sp1, sp1, sp1]);
    const f2 = Wings.START[1].species[0].id; out.alt = info('S', [first[0], f2, first[1], f2]);
    return out;
  });
  T('only aberrants → bonus', q.ab.bonus >= 400 && q.ab.found.includes('aberr'), q.ab);
  T('one location → bonus, four different locations → no location bonus', q.biome.bonus >= 400 && q.biome.found.includes('biome') && !q.mixB.found.includes('biome'), [q.biome, q.mixB]);
  T('one species four times → bonus', q.oneSp.bonus >= 400 && q.oneSp.found.includes('species'), q.oneSp);
  T('order matters: the same butterflies in a row earn more than alternating ones', q.alt.bonus < q.biome.bonus, [q.alt, q.biome]);
  // every pattern is paid, not only the first one: four aberrants of one location and one family
  const mt = await pg.evaluate(() => {
    const fam = {}; for (const s of SPECIES) { if (s.mystery || s.ab || s.biome === 'ocean' || !Aberr.eligible(s)) continue; const k = s.biome + '|' + s.fam; (fam[k] = fam[k] || []).push(s); }
    const pickList = Object.values(fam).sort((a, b) => b.length - a.length)[0].slice(0, 4); const b = Save.addBox('S', 0); pickList.forEach((sp, i) => { const ab = Aberr.make(sp, 'ABCDE'); Save.add(ab.id, sp.biome); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.q = 80; s.box = b.uid; b.items[i] = s.uid; });
    const r = Collection.info(b); return { n: r.n, ids: r.themes.map(t => t.id), bonuses: r.themes.map(t => t.bonus), bonus: r.bonus, sum: r.themes.reduce((a, t) => a + t.bonus, 0), total: r.total, parts: r.frame + r.sum + r.bonus };
  });
  T('aberrants of one location and one family: the aberration, location and family patterns are all counted and their bonuses add up', mt.n === 4 && ['aberr', 'biome', 'family'].every(x => mt.ids.includes(x)) && mt.bonus === mt.sum && mt.bonus >= 1200 && mt.total === mt.parts, mt);
  // ---- selling a frame: the butterflies and the box go, the coins come
  const s1 = await pg.evaluate(uid => { const c0 = Save.data.coins, inf = Collection.info(Save.box(uid)); const got = Save.sellBox(uid); return { got, exp: inf.total, d: Save.data.coins - c0, box: !!Save.box(uid), left: Save.data.specimens.some(s => s.box === uid) }; }, p.uid);
  T('selling a frame pays its price and removes the box with its butterflies', s1.got === s1.exp && s1.d === s1.exp && !s1.box && !s1.left, s1);
  const s2 = await pg.evaluate(() => { const b = Save.addBox('S', 0); const r = Save.sellBox(b.uid); b.loc = { t: 'wall', i: 0 }; Save.add('papilio_machaon', 'x'); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.box = b.uid; b.items[0] = s.uid; return { empty: r, hung: Save.sellBox(b.uid) }; });
  T('an empty frame or a frame on the wall cannot be sold', s2.empty === 0 && s2.hung === 0, s2);
  // ---- wings: all butterflies of a location -> one wing
  const w1 = await pg.evaluate(() => { Save.data.caught = {}; Save.data.specimens = []; Save.data.boxes = []; Save.data.wing = null; const b = Wings.START[0]; b.species.slice(0, -1).forEach(s => Save.add(s.id, b.id)); const none = Wings.check().length; Save.add(b.species[b.species.length - 1].id, b.id); const got = Wings.check(); return { none, got: got.map(x => x.id), have: Wings.count(), again: Wings.check().length }; });
  T('a wing appears only when the last butterfly of the location is caught, once', w1.none === 0 && w1.got.length === 1 && w1.have === 1 && w1.again === 0, w1);
  // catching through the game (toast, op) works the same
  const w2 = await pg.evaluate(() => { for (const b of Wings.START) for (const s of b.species) if (!Save.has(s.id)) Save.add(s.id, b.id); const n = Wings.check().length; return { n, count: Wings.count(), ocean: Maps.allowed('ocean') }; });
  T('all eight starting locations → eight wings, the ocean is still closed', w2.count === 8 && w2.n === 7 && !w2.ocean, w2);
  // ---- the cabinet: the easel and the overlay
  await pg.evaluate(() => { Save.data.seenCab = true; F0W.fade = 0; F0W.fadeTarget = 0; F0W.toCabinet(); }); T('the cabinet opens', await waitScr('cabinet', 'Cab'));
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; const c = F0W.cab; c.player.pos.set(-2.0, 0, 0.7); c.player.yaw = Math.PI; c.player.pitch = -0.05; c.prompt = c.nearest(); c.toastT = 0; });
  await pg.waitForTimeout(600); const pr = await pg.evaluate(() => F0W.cab.prompt && F0W.cab.prompt.id); T('near the easel the prompt is the wings frame', pr === 'wings', pr); await shot('easel_empty');
  await pg.evaluate(() => F0W.cab.key({ code: 'KeyE' })); await pg.waitForTimeout(500); T('E opens the wings window', await pg.evaluate(() => F0W.cab.ov) === 'wings'); await shot('wings_stash');
  const clickCell = i => pg.evaluate(i => { const x = 10 + (i % 4) * 112 + 50, y = 60 + (i >> 2) * 84 + 30; F0W.cab.click(x, y); return Wings.inFrame(); }, i);
  for (let i = 0; i < 7; i++) await clickCell(i); const n7 = await clickCell(0); T('clicking a wing takes it back, clicking again lays it', n7 === 6, n7); await clickCell(0); await clickCell(7);
  const f8 = await pg.evaluate(() => ({ inF: Wings.inFrame(), built: Wings.built() })); T('eight wings lie in the frame, it is not built yet', f8.inF === 8 && !f8.built, f8); await pg.waitForTimeout(300); await shot('wings_eight');
  await pg.evaluate(() => F0W.cab.click(40, 240)); const bl = await pg.evaluate(() => Wings.built()); T('«Собрать рамку» builds it', bl === true);
  await pg.evaluate(() => { F0W.cab.click(40, 100); }); T('a built frame cannot be taken apart', await pg.evaluate(() => Wings.inFrame()) === 8); await pg.waitForTimeout(300); await shot('wings_built');
  await pg.evaluate(() => F0W.cab.close()); await pg.waitForTimeout(500); await pg.evaluate(() => { F0W.cab.player.yaw = Math.PI; F0W.cab.toastT = 0; }); await pg.waitForTimeout(500); await shot('easel_built');
  // ---- the market: the collector
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMarket(); }); T('the market opens', await waitScr('cabinet', 'Mkt'));
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; const m = F0W.cab; const st = m.stations.find(s => s.id === 'collect'); window.__st = st && [st.x, st.z]; m.ov = null; if (st) { m.player.pos.set(st.x, 0, st.z); m.player.yaw = Math.atan2(-(24 - st.x), -(0 - st.z)); m.player.pitch = -0.05; m.prompt = m.nearest(); } });
  const st = await pg.evaluate(() => window.__st); T('the collector has a station on the east plaza', !!st, st); await pg.evaluate(() => { const m = F0W.cab; m.player.pos.set(28.4, 0, -1.4); m.player.yaw = Math.atan2(1.6, 3.8); m.player.pitch = -0.08; m.toastT = 0; }); await pg.waitForTimeout(900); await shot('collector_stall');
  await pg.evaluate(() => { const m = F0W.cab; m.player.pos.set(window.__st[0] + 0.0, 0, window.__st[1]); m.prompt = m.nearest(); m.toastT = 0; }); const pm = await pg.evaluate(() => F0W.cab.prompt && F0W.cab.prompt.id); T('his prompt is «collect»', pm === 'collect', pm);
  // put a good frame next to the wing frame
  await pg.evaluate(() => { const b = Save.addBox('M', 0); const ids = SPECIES.filter(s => s.fam === 'Парусники' && !s.mystery && !s.ab && s.biome !== 'ocean').slice(0, 5).map(s => s.id); ids.forEach((id, i) => { Save.add(id, 'x'); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.q = 85; s.box = b.uid; b.items[i] = s.uid; }); F0W.cab.ov = null; F0W.cab.prompt = F0W.cab.stations.find(s => s.id === 'collect'); F0W.cab.key({ code: 'KeyE' }); });
  await pg.waitForTimeout(500); T('E opens the collector window', await pg.evaluate(() => F0W.cab.ov) === 'collect'); await pg.waitForTimeout(300); await shot('collect_wing');
  const c1 = await pg.evaluate(() => ({ items: F0W.cab.col.items.map(e => e.wing ? 'wing' : e.total), sel: F0W.cab.col.sel })); T('the wing frame is the first entry, the other frame follows', c1.items[0] === 'wing' && c1.items.length === 2, c1);
  await pg.evaluate(() => { F0W.cab.col.sel = 1; F0W.cab.collRefresh(); }); await pg.waitForTimeout(300); await shot('collect_frame');
  await pg.evaluate(() => { F0W.cab.col.sel = 0; F0W.cab.collRefresh(); const c0 = Save.data.coins; window.__c0 = c0; F0W.cab.collSell(); });
  const c2 = await pg.evaluate(() => ({ ocean: Maps.has('ocean'), allowed: Maps.allowed('ocean'), done: Wings.done(), built: Wings.built(), d: Save.data.coins - window.__c0, vis: visibleBiomes().some(b => b.id === 'ocean') })); await pg.waitForTimeout(300); await shot('collect_sold');
  T('giving the wing frame to the collector gives 300 coins and the ocean map', c2.ocean && c2.allowed && c2.done && !c2.built && c2.d === 300 && c2.vis, c2);
  const c3 = await pg.evaluate(() => { const e = F0W.cab.col.items[0]; const c0 = Save.data.coins; F0W.cab.collSell(); if (F0W.cab.col.confirm) F0W.cab.collSell(); return { had: !!e && !e.wing, d: Save.data.coins - c0, left: F0W.cab.col.items.length }; });
  T('an ordinary good frame is sold for its price (with confirmation for rare/aberrant ones)', c3.had && c3.d > 0 && c3.left === 0, c3);
  // ---- legacy saves: a player who had already caught ocean butterflies keeps the map
  const lg = await pg.evaluate(() => { Save.data.maps = {}; Save.data.wing = null; Save.data.caught = {}; const s = SPECIES.find(x => x.biome === 'ocean'); Save.data.caught[s.id] = { count: 1, first: 1, place: 'ocean' }; Wings.check(); return Maps.has('ocean'); });
  T('a save with ocean catches keeps its ocean map', lg === true);
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5) : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
