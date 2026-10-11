// spreading boards: nine kinds, bought from the collection trader, swapped at the spreading desk; a batch is spread like its first butterfly; no dupes or errors
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const SH = process.env.SHOTS || '/tmp';
  const caps = await pg.evaluate(() => Spreaders.TYPES.map(t => [t.id, t.cap, t.price, !!t.mech]));
  T('nine boards: 1, 3, 6, 10, 16, 26, 33, 40, 50; only the mechanical one has a bonus', caps.map(c => c[1]).join() === '1,3,6,10,16,26,33,40,50' && caps.filter(c => c[3]).length === 1 && caps[8][3], caps);
  const mod = await pg.evaluate(() => Spreaders.TYPES.map(t => { const g = Spreaders.model(t.id); let n = 0; g.traverse(o => { if (o.isMesh) n++; }); const inst = []; g.traverse(o => { if (o.isInstancedMesh) inst.push(o.count); }); const bb = new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3()); return { id: t.id, n, inst: inst[0], w: +bb.x.toFixed(2), l: +bb.z.toFixed(2), pic: !!Spreaders.pic(t.id) }; }));
  T('every board has a 3D model and a picture', mod.every(m => m.n > 5 && m.pic && m.inst > 0), mod.map(m => [m.id, m.n, m.w, m.l, m.pic]));
  // the shop
  await pg.evaluate(() => { Save.data.spr = null; Save.data.coins = 0; F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMarket(); });
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(F0W.cab && F0W.cab.walkers)).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { const m = F0W.cab; m.ov = null; m.open('collect'); m.col.tab = 'spr'; m.col.ssel = 1; }); await pg.waitForTimeout(400);
  const buy = (i, coins) => pg.evaluate(([i, coins]) => { Save.data.coins = coins; const m = F0W.cab; m.col.ssel = i; m.collBuySpr(); return { coins: Save.data.coins, own: Spreaders.owned(Spreaders.TYPES[i].id), eq: Spreaders.equippedId() }; }, [i, coins]);
  let r = await buy(1, 4199); T('4199 coins: the 3-board is not sold', !r.own && r.coins === 4199, r);
  r = await buy(1, 4200); T('4200 coins: bought (4200) and put on the desk', r.own && r.coins === 0 && r.eq === 's3', r);
  r = await buy(1, 5000); T('buying it again does nothing (no dupes, no charge)', r.coins === 5000, r);
  await pg.evaluate(() => { const m = F0W.cab; m.col.ssel = 0; m.collBuySpr(); }); const e0 = await pg.evaluate(() => Spreaders.equippedId()); T('the basic board can be put back for free', e0 === 'basic', e0);
  await pg.evaluate(() => { Save.data.coins = 1e6; const m = F0W.cab; m.col.ssel = 8; m.collBuySpr(); m.col.ssel = 5; m.collBuySpr(); Spreaders.equip('basic'); }); await pg.waitForTimeout(300);
  await pg.evaluate(() => { F0W.cab.col.ssel = 8; }); await pg.waitForTimeout(300); await pg.screenshot({ path: SH + '/spr_shop.png' });
  // the picker and the batch
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; Save.data.coins = 1e6; for (const t of Spreaders.TYPES) Spreaders.buy(t.id); Save.data.specimens = []; Save.data.boxes.length = 0; const pool = SPECIES.filter(s => !s.mystery && s.biome !== 'ocean'); for (let i = 0; i < 14; i++) { const sp = pool[(i % 5) * 9 + 1]; Save.add(sp.id, sp.biome); } Save.data.seenCab = true; F0W.toCabinet(); });
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && F0W.cab.constructor.name === 'Cab').catch(() => false)) break; await pg.waitForTimeout(400); }
  const sel = await pg.evaluate(() => {
    const out = {}; Spreaders.equip('s6'); F0W.cab.open('pick'); const P = Spread.pick; P.open(); P.layout();
    out.cap = P.cap(); out.cards = P.cards.length;
    const clickCard = i => { P.layout(); const c = P.cards[i]; return P.click(c.x + 5, c.y + 5); };
    for (let k = 0; k < 8; k++) clickCard(k % P.cards.length); out.sel8 = P.sel.length; out.uniq = new Set(P.sel).size;
    P.sel = []; for (let k = 0; k < 3; k++) clickCard(0); out.stack = P.sel.length;
    // the 6-board with one stack of 3 clicked 3 times then a 4th click takes one off
    clickCard(0); out.afterFull = P.sel.length;
    P.sel = []; P.layout(); const fill = P.btns.find(b => b.id === 'fill'); P.click(fill.x + 2, fill.y + 2); out.fill = P.sel.length;
    const clear = P.btns.find(b => b.id === 'clear'); P.layout(); P.click(clear.x + 2, clear.y + 2); out.cleared = P.sel.length;
    return out;
  });
  T('the 6-board takes at most 6 chosen butterflies, no repeats', sel.cap === 6 && sel.sel8 <= 6 && sel.sel8 === sel.uniq, sel);
  T('«Выбрать до 6» fills the board and «Сброс» empties it', sel.fill === 6 && sel.cleared === 0, sel);
  await pg.evaluate(() => { Spread.pick.sel = []; Spread.pick.layout(); Spread.pick.fillTest = 1; const P = Spread.pick; for (const sp of P.list.slice(0, 6)) P.sel.push(sp.uid); }); await pg.waitForTimeout(400); await pg.screenshot({ path: SH + '/spr_pick.png' });
  const batch = await pg.evaluate(() => {
    const P = Spread.pick; P.layout(); const ch = P.chosen(); const before = Save.data.specimens.length; const raw0 = Save.rawList().length;
    const res = P.click(P.btns.find(b => b.id === 'go').x + 2, P.btns.find(b => b.id === 'go').y + 2);
    const G = Spread.G; G.begin(res.spec, res.extra); G.pins = [0, 1, 2, 3].map(() => ({ score: 87, acc: 87, tim: 87, gen: 87 })); G.pose = JSON.parse(JSON.stringify(Art.IDEAL)); G.finish();
    const all = ch.map(s => Save.spec(s.uid)); const qs = all.map(s => s.q), poses = new Set(all.map(s => JSON.stringify(s.pose)));
    return { n: ch.length, first: res.spec.uid === ch[0].uid, extra: res.extra.length, qs, poses: poses.size, total: Save.data.specimens.length === before, raw: Save.rawList().length, raw0, resN: G.res.n, others: Save.data.specimens.filter(s => !ch.some(c => c.uid === s.uid) && s.q !== null).length };
  });
  T('only the first is spread by hand, the 5 others get exactly the same result and pose', batch.n === 6 && batch.first && batch.extra === 5 && new Set(batch.qs).size === 1 && batch.qs[0] > 50 && batch.poses === 1 && batch.resN === 6, batch);
  T('no dupes or losses: the number of specimens is the same, the other raw ones are untouched', batch.total && batch.raw === batch.raw0 - 6 && batch.others === 0, batch);
  // a butterfly that disappeared (or was put into a box) during the work is skipped, not duplicated or revived
  const edge = await pg.evaluate(() => {
    const raws = Save.rawList().slice(0, 4); const G = Spread.G; Save.data.specimens = Save.data.specimens.filter(s => s.uid !== raws[2].uid); raws[3].box = 999;      // one sold, one in a box
    G.begin(raws[0], raws.slice(1)); G.pins = [0, 1, 2, 3].map(() => ({ score: 70, acc: 70, tim: 70, gen: 70 })); G.pose = JSON.parse(JSON.stringify(Art.IDEAL)); G.finish();
    return { q0: raws[0].q, q1: raws[1].q, q2: Save.spec(raws[2].uid), q3: raws[3].q, resN: G.res.n };
  });
  T('a sold or boxed butterfly in the batch is skipped (no revival, no change)', edge.q0 !== null && edge.q1 === edge.q0 && edge.q2 === undefined && edge.q3 === null && edge.resN === 2, edge);
  // the mechanical board: 10 % for +5
  const mech = await pg.evaluate(() => {
    Spreaders.equip('s50'); const G = Spread.G, rnd = Math.random, run = v => { Save.data.specimens = []; for (let i = 0; i < 3; i++) Save.add(SPECIES.find(s => !s.mystery && s.biome !== 'ocean').id, 'x'); const L = Save.rawList(); Math.random = () => v; G.begin(L[0], L.slice(1)); G.pins = [0, 1, 2, 3].map(() => ({ score: 80, acc: 80, tim: 80, gen: 80 })); G.pose = JSON.parse(JSON.stringify(Art.IDEAL)); G.finish(); return { qs: L.map(s => s.q), bonus: G.res.bonus }; };
    const lucky = run(0.05), unlucky = run(0.5); Math.random = rnd; return { lucky, unlucky };
  });
  T('mechanical board: a lucky batch (r < 0.1) gets +5 on every butterfly, an unlucky one does not', mech.lucky.bonus === 5 && new Set(mech.lucky.qs).size === 1 && mech.unlucky.bonus === 0 && mech.lucky.qs[0] === mech.unlucky.qs[0] + 5, mech);
  const chance = await pg.evaluate(() => { Spreaders.equip('s50'); const G = Spread.G; let hit = 0, N = 4000; for (let i = 0; i < N; i++) { Save.data.specimens = []; Save.add(SPECIES.find(s => !s.mystery && s.biome !== 'ocean').id, 'x'); const L = Save.rawList(); G.begin(L[0], []); G.pins = [0, 1, 2, 3].map(() => ({ score: 60, acc: 60, tim: 60, gen: 60 })); G.pose = JSON.parse(JSON.stringify(Art.IDEAL)); G.finish(); if (G.res.bonus) hit++; } return hit / N; });
  T('the mechanical bonus happens in about 10 % of batches', chance > 0.08 && chance < 0.12, chance);
  // swapping at the desk and a cap-1 board begin directly
  const sw = await pg.evaluate(() => { Spreaders.equip('basic'); Save.data.specimens = []; for (let i = 0; i < 3; i++) Save.add(SPECIES.find(s => !s.mystery && s.biome !== 'ocean').id, 'x'); const P = Spread.pick; P.open(); P.layout(); const c = P.cards[0]; const r = P.click(c.x + 5, c.y + 5); const sb = P.btns.find(b => b.id === 'swap'); const disabled = !!sb.disabled; Spreaders.equip('s6'); P.layout(); const sb2 = P.btns.find(b => b.id === 'swap'); P.click(sb2.x + 2, sb2.y + 2); return { begin: r && r.act, extra: r && r.extra.length, disabled, now: Spreaders.equippedId() }; });
  T('the 1-board begins at once; the swap button cycles through the owned boards', sw.begin === 'begin' && sw.extra === 0 && sw.now !== 's6', sw);
  if (errs.length) { bad++; console.log('ERR', errs); }
  console.log(bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
