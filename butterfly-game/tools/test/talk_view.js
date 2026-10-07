const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1&hour=12');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { delete Save.data.secret; F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMarket(); }); await pg.waitForTimeout(3500);
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; const s = F0W.cab.stations.find(s => s.id === 'strange'); const P = F0W.cab.player; P.pos.set(s.x + 1.2, 0, s.z); P.yaw = Math.PI / 2; P.pitch = -0.05; F0W.cab.openTalk('strange'); F0W.cab.talk.chars = 999; }); await pg.waitForTimeout(1500);
  await pg.screenshot({ path: '/tmp/talk_full.png' });
  await br.close();
})();
