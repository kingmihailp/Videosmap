// the trader's shop screen: unowned and owned -> /tmp/shop_a.png /tmp/shop_b.png
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { Save.data.coins = 1800; F0W.toSecret(); }); for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => !!(F0W.cab && F0W.cab.seller))) break; await pg.waitForTimeout(300); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; F0W.cab.openShop('Карты. Места, которых нет ни на одной карте. Каждое место — дыхание земли. Выбирай, пока пыль не осела.'); F0W.cab.shop.chars = 999; });
  await pg.waitForTimeout(800); await pg.screenshot({ path: '/tmp/shop_a.png' });
  await pg.evaluate(() => { F0W.cab.buy(0); F0W.cab.shop.chars = 999; }); await pg.waitForTimeout(800); await pg.screenshot({ path: '/tmp/shop_b.png' });
  console.log(errs); await br.close();
})();
