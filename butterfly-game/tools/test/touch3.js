const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#touch&debug&biome=russia&seed=T1');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; }); await pg.waitForTimeout(500);
  // crouch toggle
  const btn = await pg.evaluate(() => { const b = [...document.querySelectorAll('#tc .b')].find(b => b.textContent === '⬇'); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, shown: getComputedStyle(b).display }; });
  console.log('crouch btn', btn);
  await pg.touchscreen.tap(btn.x, btn.y); await pg.waitForTimeout(400); console.log('after tap 1', await pg.evaluate(() => [...F0W.inp.keys]));
  await pg.screenshot({ path: '/tmp/t_crouch.png' });
  await pg.touchscreen.tap(btn.x, btn.y); await pg.waitForTimeout(400); console.log('after tap 2', await pg.evaluate(() => [...F0W.inp.keys]));
  // multiplayer: name field twice (second tap after "keyboard hidden" must refocus)
  await pg.evaluate(() => { F0W.toTitle(); F0W.screen = 'mp'; }); await pg.waitForTimeout(600);
  const tapField = async i => { const r = await pg.evaluate(i => { const f = Screens.mp.fr[i], u = document.getElementById('ui').getBoundingClientRect(); return { x: u.left + (f.x + f.w / 2) / SW * u.width, y: u.top + (f.y + f.h / 2) / SH * u.height }; }, i); await pg.touchscreen.tap(r.x, r.y); await pg.waitForTimeout(300); };
  await tapField(1); console.log('name focus', await pg.evaluate(() => document.activeElement.id));
  await pg.keyboard.type('Anya'); await pg.evaluate(() => document.activeElement.blur()); await tapField(1);
  console.log('refocus after hide', await pg.evaluate(() => document.activeElement.id)); await pg.keyboard.type('X');
  console.log('fields', await pg.evaluate(() => Screens.mp.fields.map(f => f.val)));
  await br.close();
})();
