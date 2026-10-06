const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; const p = F0W.play; p.cards.push({ sp: p.pool[0], first: true, t: 60, d: 60, count: 1 }); p.cards.push({ sp: p.pool[1], first: false, t: 60, d: 60, count: 3 }); });
  await pg.waitForTimeout(1500); await pg.screenshot({ path: '/tmp/c_default.png' });
  const to = (x, y) => pg.evaluate(([x, y]) => { const r = document.getElementById('ui').getBoundingClientRect(); return [r.left + x / SW * r.width, r.top + y / SH * r.height]; }, [x, y]);
  await pg.keyboard.press('KeyP'); await pg.waitForTimeout(500);
  let b = await pg.evaluate(() => { Screens.pause.layout(F0W.play); const x = Screens.pause.btns.find(b => b.id === 'cardpos'); return [x.x + x.w / 2, x.y + 8]; });
  let [cx, cy] = await to(...b); await pg.mouse.click(cx, cy); await pg.waitForTimeout(400);
  console.log('overlay', await pg.evaluate(() => F0W.overlay)); await pg.screenshot({ path: '/tmp/c_edit.png' });
  const P = await pg.evaluate(() => F0W.play.cardPos()); let [sx, sy] = await to(P.x + 20, P.y + 20); let [ex, ey] = await to(300, 150);
  await pg.mouse.move(sx, sy); await pg.mouse.down(); await pg.mouse.move(ex, ey, { steps: 5 }); await pg.mouse.up(); await pg.waitForTimeout(300);
  console.log('after drag', await pg.evaluate(() => JSON.stringify(Save.data.settings.card)));
  const bb = await pg.evaluate(() => ({ b: Screens.cardpos.btns.map(b => [b.id, b.x + b.w / 2, b.y + 8]) }));
  const get = id => bb.b.find(x => x[0] === id);
  for (let i = 0; i < 2; i++) { [cx, cy] = await to(get('bigger')[1], get('bigger')[2]); await pg.mouse.click(cx, cy); await pg.waitForTimeout(150); }
  console.log('after bigger x2', await pg.evaluate(() => JSON.stringify(Save.data.settings.card))); await pg.screenshot({ path: '/tmp/c_edit2.png' });
  [cx, cy] = await to(get('done')[1], get('done')[2]); await pg.mouse.click(cx, cy); await pg.waitForTimeout(300);
  console.log('after done', await pg.evaluate(() => F0W.overlay));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(600); await pg.screenshot({ path: '/tmp/c_after.png' });
  console.log('overlay now', await pg.evaluate(() => F0W.overlay));
  await br.close();
})();
