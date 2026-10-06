const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('ERR', e.message)); const cdp = await ctx.newCDPSession(pg);
  const touch = (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map(p => ({ x: p[0], y: p[1], id: 1 })) });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#touch&debug&biome=russia&seed=T1');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = 'cardpos'; }); await pg.waitForTimeout(600);
  const P = await pg.evaluate(() => { const r = document.getElementById('ui').getBoundingClientRect(), p = F0W.play.cardPos(); return { x: r.left + (p.x + 30) / SW * r.width, y: r.top + (p.y + 20) / SH * r.height, k: r.width / SW, l: r.left }; });
  await touch('touchStart', [[P.x, P.y]]); for (let i = 1; i <= 6; i++) await touch('touchMove', [[P.x + i * 40, P.y + i * 20]]); await touch('touchEnd', [[P.x + 240, P.y + 120]]); await pg.waitForTimeout(500);
  console.log('card after touch drag', await pg.evaluate(() => JSON.stringify(Save.data.settings.card)), 'overlay', await pg.evaluate(() => F0W.overlay));
  await br.close();
})();
