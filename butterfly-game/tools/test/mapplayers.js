const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; Net.on = true; Net.id = 1; Net.name = 'Mihail'; Net.list = [{ id: 1, name: 'Mihail', loc: null }, { id: 2, name: 'Anya', loc: 'alps' }, { id: 3, name: 'Boris', loc: 'alps' }, { id: 4, name: 'Vera', loc: 'japan' }, { id: 5, name: 'Gleb', loc: 'cabinet' }, { id: 6, name: 'Dina', loc: 'amazon' }]; F0W.toMap(); });
  await pg.waitForTimeout(800);
  const h = await pg.evaluate(() => { const b = BIOMES.find(b => b.id === 'alps'), p = Screens.pinPos(b), r = document.getElementById('ui').getBoundingClientRect(); return [r.left + p.x / SW * r.width, r.top + (p.y - 6) / SH * r.height]; });
  await pg.mouse.move(h[0], h[1]); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/map_players.png' });
  await br.close();
})();
