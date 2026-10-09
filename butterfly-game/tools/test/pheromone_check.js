// the strange pheromones: sold only by the hooded trader (secret market), 3000 coins, go into the honey place of a trap, hugely raise the rarity of the visitors and make 10% of them aberrations
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const d = await pg.evaluate(() => {
    const ph = Traps.HN.pheromone, b = BIOME_BY_ID.russia, N = 30000, o = { price: ph.price, secret: ph.secret, ab: ph.ab, honeyShop: Traps.HONEYS.filter(h => !h.secret).some(h => h.id === 'pheromone') };
    const share = hn => { let r3 = 0, r2 = 0, ab = 0; for (let i = 0; i < N; i++) { const sp = Traps.pick(b, hn, 'std'); const base = SPECIES_BY_ID[sp.base] || sp; if (base.rar === 3) r3++; else if (base.rar === 2) r2++; if (sp.ab) ab++; } return { r3: r3 / N, r2: r2 / N, ab: ab / N }; };
    o.none = share(''); o.heather = share('heather'); o.ph = share('pheromone'); o.rate = Traps.rate('', 'pheromone'); o.rateBoth = Traps.rate('lavender', 'pheromone');
    let abI = 0; for (let i = 0; i < 20000; i++) if (Traps.pick(b, 'pheromone', 'imp').ab) abI++; o.abImp = abI / 20000; return o;
  });
  T('3000 coins, secret item, not in the honey seller\'s shop', d.price === 3000 && d.secret && !d.honeyShop, [d.price, d.secret, d.honeyShop]);
  T('about 10% of the visitors are aberrations (standard trap), and the imported trap's own 1% is added: about 11%', d.ph.ab > 0.085 && d.ph.ab < 0.115 && d.heather.ab === 0 && d.abImp > 0.095 && d.abImp < 0.125 && d.abImp > d.ph.ab - 0.002, [d.ph.ab, d.heather.ab, d.abImp]);
  const rare = o => o.r2 + o.r3;
  T('it raises the rarity far more than the best honey: almost every visitor is uncommon or rare', rare(d.ph) > 0.85 && rare(d.heather) < 0.75 && rare(d.none) < 0.35 && d.ph.r3 > d.heather.r3, [rare(d.none), rare(d.heather), rare(d.ph)]);
  T('as a bait it brings visitors itself', d.rate > 0 && d.rateBoth > d.rate, [d.rate, d.rateBoth]);
  // the trader's shop
  await pg.evaluate(() => { Save.data.coins = 2999; Save.data.trap = null; F0W.fade = 0; F0W.fadeTarget = 0; F0W.toSecret(); });
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && F0W.cab.constructor.name !== 'Mkt' && F0W.cab.constructor.name !== 'Cab' && !!F0W.cab.openShop).catch(() => false)) break; await pg.waitForTimeout(400); }
  const s0 = await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; const r = F0W.cab; r.ov = null; r.openShop(); return { cls: r.constructor.name, tabs: r.shopTabs().length }; });
  T('the hooded trader\'s shop has a second tab', s0.tabs === 2, s0);
  await pg.evaluate(() => { const r = F0W.cab, b = r.shopTabs()[1]; r.click(b.x + 3, b.y + 3); }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/phero_shop.png' });
  const p1 = await pg.evaluate(() => { const r = F0W.cab; const b = r.shopRows()[0]; r.click(b.x + 3, b.y + 3); return { tab: r.shop.tab, n: Traps.count('hn', 'pheromone'), coins: Save.data.coins }; });
  T('with 2999 coins nothing is sold', p1.tab === 1 && p1.n === 0 && p1.coins === 2999, p1);
  const p2 = await pg.evaluate(() => { Save.data.coins = 3100; const r = F0W.cab; const b = r.shopRows()[0]; r.click(b.x + 3, b.y + 3); return { n: Traps.count('hn', 'pheromone'), coins: Save.data.coins }; });
  T('with enough coins one flask is bought for 3000', p2.n === 1 && p2.coins === 100, p2); await pg.waitForTimeout(400); await pg.screenshot({ path: '/tmp/phero_shop2.png' });
  // in a trap
  await pg.evaluate(() => { F0W.cab.ov = null; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('russia', 'PH1'); });
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  const tr = await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; const p = F0W.play; Traps.add('tr', 'imp', 1); const t = p.traps.place('imp'); p.traps.bait(t, undefined, 'pheromone'); window.__t = t;
    const o = { hn: t.hn, left: Traps.count('hn', 'pheromone'), rate: Traps.rate(t.fl, t.hn) }; t.life = 99999; let tot = 0; for (let i = 0; i < 6000 && tot < 8; i++) { p.traps.update(0.25); tot = t.items.length; } o.got = t.items.length; o.abs = t.items.filter(id => SPECIES_BY_ID[id].ab).length; return o; });
  T('the flask goes into the honey place of a trap and brings butterflies', tr.hn === 'pheromone' && tr.left === 0 && tr.rate > 0 && tr.got >= 5, tr);
  await pg.evaluate(() => { const p = F0W.play, t = window.__t; p.player.pos.set(t.x + 1.0, p.player.pos.y, t.z); p.player.yaw = Math.atan2(-(t.x - p.player.pos.x), -(t.z - p.player.pos.z)); p.traps.update(0.02); Traps.UI.openTrap(p, t); F0W.overlay = 'trap'; }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/phero_trap.png' });
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5) : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
