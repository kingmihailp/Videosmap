const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1&hour=12');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMarket(); }); await pg.waitForTimeout(3500);
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; F0W.cab.open('shop'); }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/portrait_shop.png', clip: { x: 480, y: 70, width: 480, height: 130 } });
  await pg.evaluate(() => { F0W.cab.ov = null; F0W.cab.open('sell'); }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/portrait_sell.png', clip: { x: 480, y: 70, width: 480, height: 130 } });
  // large preview of both portraits
  const u = await pg.evaluate(() => { const cv = document.createElement('canvas'); cv.width = 100; cv.height = 52; const x = cv.getContext('2d'); x.fillStyle = '#e8dcb4'; x.fillRect(0, 0, 100, 52); Portrait.draw(x, 'buyer', 3, 2, 1, true); Portrait.draw(x, 'seller', 55, 2, 1, false); const big = document.createElement('canvas'); big.width = 600; big.height = 312; const b = big.getContext('2d'); b.imageSmoothingEnabled = false; b.drawImage(cv, 0, 0, 600, 312); return big.toDataURL(); });
  require('fs').writeFileSync('/tmp/portrait_big.png', Buffer.from(u.split(',')[1], 'base64'));
  await br.close();
})();
