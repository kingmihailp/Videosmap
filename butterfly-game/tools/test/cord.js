const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000);
  await pg.evaluate(() => F0W.toCabinet()); for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => !!F0W.cab).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.overlay = null; F0W.cab.ov = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; const b1 = Save.addBox('L', 1), b2 = Save.addBox('M', 2), b3 = Save.addBox('S', 3); [[b1, 0], [b2, 1], [b3, 2]].forEach(([b, i]) => { b.loc = { t: 'wall', i }; }); F0W.cab.refresh(); const P = F0W.cab.player; P.pos.set(-1.3, 1.65, -1.6); P.yaw = 0.0; P.pitch = 0.18; });
  await pg.waitForTimeout(1200); await pg.screenshot({ path: '/tmp/cord.png' }); await br.close();
})();
