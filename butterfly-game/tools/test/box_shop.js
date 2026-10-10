// boxes are bought from the collection trader (200 / 300 / 400), used up at the workbench, returned when taken apart; the stash shows slots with every item
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const SH = process.env.SHOTS || '/tmp';
  // the workbench with no stock
  await pg.evaluate(() => { Save.data.boxes.length = 0; Save.data.boxStock = { S: 0, M: 0, L: 0 }; Save.data.coins = 0; F0W.fade = 0; F0W.fadeTarget = 0; F0W.toCabinet(); });
  for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && !!F0W.cab.open).catch(() => false)) break; await pg.waitForTimeout(400); }
  await pg.evaluate(() => { const r = F0W.cab; r.ov = null; r.open('bench'); Boxes.bench.tab = 'boxes'; }); await pg.waitForTimeout(400);
  const clickBtn = id => pg.evaluate(id => { Boxes.bench.layout(); const b = Boxes.bench.btns.find(b => b.id === id); F0W.cab.click(b.x + 2, b.y + 2); return { dis: !!b.disabled, label: b.label, n: Save.data.boxes.length }; }, id);
  const r0 = await clickBtn('S'); T('no stock: the button is off and nothing is created', r0.dis && r0.n === 0, r0);
  await pg.screenshot({ path: SH + '/bench_empty.png' });
  // the trader
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMarket(); });
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(F0W.cab && F0W.cab.walkers)).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { const m = F0W.cab; m.ov = null; m.open('collect'); }); await pg.waitForTimeout(300);
  const click = (x, y) => pg.evaluate(([x, y]) => F0W.cab.click(x, y), [x, y]);
  await click(226, 12); await pg.waitForTimeout(300);
  const tab = await pg.evaluate(() => F0W.cab.col.tab); T('the «Коробки» tab opens', tab === 'buy', tab);
  const L = await pg.evaluate(() => F0W.cab.collLayout().brows);
  const buy = async (i, coins) => { await pg.evaluate(c => { Save.data.coins = c; }, coins); await click(L[i].x + 5, L[i].y + 5); await click(L[i].x + 5, L[i].y + 5); await pg.waitForTimeout(150); return pg.evaluate(() => ({ coins: Save.data.coins, st: Object.assign({}, Save.data.boxStock) })); };
  let r = await buy(0, 199); T('199 coins: a small box is not sold', r.coins === 199 && r.st.S === 0, r);
  r = await buy(0, 200); T('200 coins: a small box (200)', r.coins === 0 && r.st.S === 1, r);
  r = await buy(1, 299); T('299: medium not sold', r.coins === 299 && r.st.M === 0, r);
  r = await buy(1, 300); T('300: medium (300)', r.coins === 0 && r.st.M === 1, r);
  r = await buy(2, 400); T('400: large (400)', r.coins === 0 && r.st.L === 1, r);
  await pg.evaluate(() => { Save.data.coins = 1000; Save.addStock('M', 1); }); await pg.waitForTimeout(200); await pg.screenshot({ path: SH + '/trader_boxes.png' });
  // the workbench: use up the stock, take it apart
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toCabinet(); });
  for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && !!F0W.cab.open).catch(() => false)) break; await pg.waitForTimeout(400); }
  await pg.evaluate(() => { const r = F0W.cab; r.ov = null; r.open('bench'); Boxes.bench.tab = 'boxes'; }); await pg.waitForTimeout(300);
  let c1 = await clickBtn('S'); const afterS = await pg.evaluate(() => ({ n: Save.data.boxes.length, st: Object.assign({}, Save.data.boxStock) }));
  T('a small box is made from stock (stock 1 → 0)', afterS.n === 1 && afterS.st.S === 0, afterS);
  const c2 = await clickBtn('S'); T('no more small boxes: denied', c2.dis && c2.n === 1, c2);
  await clickBtn('M'); await clickBtn('M'); const m2 = await pg.evaluate(() => ({ n: Save.data.boxes.length, st: Object.assign({}, Save.data.boxStock) })); T('two medium boxes made, stock 0', m2.n === 3 && m2.st.M === 0, m2);
  await pg.evaluate(() => { Boxes.bench.sel = Save.data.boxes.length - 1; });
  const st0 = await pg.evaluate(() => { Boxes.bench.style = 0; return Save.data.boxes[Save.data.boxes.length - 1].style; });
  await clickBtn('style'); const st1 = await pg.evaluate(() => Save.data.boxes[Save.data.boxes.length - 1].style); T('the look (walnut/oak/black) is still changed at the workbench', st1 !== st0, [st0, st1]);
  await clickBtn('del'); const d = await pg.evaluate(() => ({ n: Save.data.boxes.length, st: Object.assign({}, Save.data.boxStock) })); T('taking a box apart returns it to stock', d.n === 2 && d.st.M === 1, d);
  await pg.screenshot({ path: SH + '/bench_stock.png' });
  // the stash: slots with all the items
  await pg.evaluate(() => { Secret.take(1); Secret.take(3); Save.addStock('L', 2); Traps.add('fl', 'daisy' in Traps.FL ? 'daisy' : Traps.FLOWERS[0].id, 3); Traps.add('fl', Traps.FLOWERS[3].id, 1); Traps.add('hn', Traps.HONEYS[0].id, 2); Traps.add('hn', 'pheromone', 1); Traps.add('tr', 'std', 1); Traps.add('tr', 'imp', 2); Traps.add('tr', 'scr', 1); Save.partsObj().m_gold = 2; Save.partsObj().h_long = 1; Save.partsObj().r_titan = 12; Save.assembleNet({ h: 'h_basic', r: 'r_titan', m: 'm_gold' }); Wings.check(); const W = Save.data.wing || (Save.data.wing = { have: {}, placed: {} }); Wings.START.slice(0, 3).forEach(b => W.have[b.id] = true); F0W.modal = 'stash'; });
  await pg.waitForTimeout(500); await pg.screenshot({ path: SH + '/stash.png' });
  const its = await pg.evaluate(() => Secret.stash.items().map(i => [i.name, i.n]));
  T('the stash lists fragments, wings, parts, a net, boxes, flowers, honey, traps', its.length >= 16 && its.some(i => /Обрывок/.test(i[0])) && its.some(i => /Крыло/.test(i[0])) && its.some(i => /коробка/.test(i[0])) && its.some(i => /ловушка/i.test(i[0]) || /Скритчушка/.test(i[0])), its.length);
  T('no butterflies or collections among them', !its.some(i => /бабочк[аи]$/i.test(i[0]) && !/Крыло/.test(i[0])) && !its.some(i => /рамк|коллекц/i.test(i[0])), its.map(i => i[0]));
  // many items: scroll
  await pg.evaluate(() => { Traps.FLOWERS.forEach(f => Traps.add('fl', f.id, 1)); Traps.HONEYS.forEach(f => Traps.add('hn', f.id, 1)); Object.keys(NetParts.PARTS).forEach(id => { Save.partsObj()[id] = 1; }); });
  const sc = await pg.evaluate(() => { const S = Secret.stash; S.scroll = 0; S.layout(); const mx = S.maxS; S.wheel(1); return { n: S.items().length, maxS: mx, scroll: S.scroll }; }); T('more than 50 items: the grid scrolls', sc.maxS > 0 && sc.scroll === 1, sc);
  await pg.waitForTimeout(300); await pg.screenshot({ path: SH + '/stash2.png' });
  const close = await pg.evaluate(() => { const b = Secret.stash.btns.find(b => b.id === 'close'); return Secret.stash.click(b.x + 2, b.y + 2); }); T('close button', close === 'close');
  if (errs.length) { bad++; console.log('ERR', errs); }
  console.log(bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
