const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#touch');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.screen = 'mp'; }); await pg.waitForTimeout(600);
  await pg.screenshot({ path: '/tmp/t_mp.png' });
  const info = await pg.evaluate(() => Screens.mp.fr.map(f => ({ i: f.i, x: f.x, y: f.y, w: f.w, h: f.h })));
  console.log(JSON.stringify(info));
  const st = await pg.evaluate(() => { const r = document.getElementById('ui').getBoundingClientRect(); return { l: r.left, t: r.top, w: r.width, h: r.height, SW, SH }; });
  const f = info[0]; await pg.touchscreen.tap(st.l + (f.x + f.w / 2) / st.SW * st.w, st.t + (f.y + f.h / 2) / st.SH * st.h); await pg.waitForTimeout(300);
  console.log('focused kb', await pg.evaluate(() => document.activeElement && document.activeElement.id));
  await pg.keyboard.type('10.0.0.5:3000'); await pg.keyboard.press('Backspace'); await pg.waitForTimeout(300);
  console.log('field', await pg.evaluate(() => Screens.mp.fields.map(f => f.val)));
  await pg.evaluate(() => { F0W.screen = 'title'; }); await pg.waitForTimeout(300);
  await pg.evaluate(() => F0W.toCabinet && F0W.toCabinet()); await pg.waitForTimeout(2500);
  console.log('cab', await pg.evaluate(() => ({ s: F0W.screen, ov: F0W.cab && F0W.cab.ov }))); await pg.screenshot({ path: '/tmp/t_cab.png' });
  await br.close();
})();
