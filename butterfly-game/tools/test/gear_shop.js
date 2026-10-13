// the enthusiast's shop window: pictures of several items -> /tmp/gs_<n>.png; buys everything and checks the inventory
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000);
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { Save.data.coins = 5000000; F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMarket(); }); await pg.waitForTimeout(3000);
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; F0W.cab.open('gear'); });
  const shot = async n => { await pg.waitForTimeout(700); await pg.screenshot({ path: `/tmp/gs_${n}.png` }); };
  const sel = n => pg.evaluate(n => { F0W.cab.gr.sel = n; F0W.cab.gr.scroll = Math.max(0, Math.min(n, 13 - 7)); }, n);
  for (const n of [0, 1, 3, 11, 12]) { await sel(n); await shot(n); }
  { const r = await pg.evaluate(() => { const m = F0W.cab; m.goodsOpen('tr'); const a = m.goodsList().some(x => x.id === 'drv'); m.goodsOpen('fl'); const b = m.goodsList().some(x => x.id === 'synth'); return [a, b]; }); console.log(r[0] || r[1] ? 'FAIL gear items leaked into the florist/trapper lists ' + r : 'ok   drive trap and synthetic flowers are sold only by the enthusiast'); }
  // buy everything
  const res = await pg.evaluate(() => { const out = []; Gear.ITEMS.forEach((it, i) => { F0W.cab.gr.sel = i; const before = Save.data.coins; Gear.shopBuy ? 0 : 0; const got = Gear.buy(it); out.push([it.n, it.id, got, before - Save.data.coins, Gear.owned(it)]); }); return out; });
  console.log(JSON.stringify(res)); console.log('errors', errs); await br.close();
})();
