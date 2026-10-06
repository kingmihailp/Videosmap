const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; const sp = BIOMES[0].species; for (let i = 0; i < 4; i++) Save.add(sp[0].id, 'russia'); for (let i = 0; i < 2; i++) Save.add(sp[1].id, 'russia'); Save.add(sp[2].id, 'russia'); Save.add(Aberr.make(sp[0], 'AAAAA').id, 'russia'); Save.add(Aberr.make(sp[0], 'BBBBB').id, 'russia'); Save.add(Aberr.make(sp[0], 'BBBBB').id, 'russia'); F0W.toCabinet(); });
  await pg.waitForTimeout(3000); await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; F0W.cab.open('pick'); }); await pg.waitForTimeout(700);
  console.log(await pg.evaluate(() => JSON.stringify(Spread.pick.cards.map(c => [c.s.sp, c.n])))); await pg.screenshot({ path: '/tmp/stack.png' });
  await br.close();
})();
