const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&hour=14'); await pg.waitForTimeout(2500);
  await pg.evaluate(() => F0W.toMarket()); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(F0W.cab && F0W.cab.walkers)).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.overlay = null; F0W.cab.ov = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; const c = F0W.cab; c.update = c.animate.bind(c); c.hud = () => {}; c.camera.far = 400; c.scene.fog.far = 400; c.scene.fog.near = 300; c.dome.visible = true; });
  const views = [[0, 75, 5, -Math.PI / 2 + 0.0, -1.5, 0], [-10, 30, 50, 0, -0.6, 0], [30, 25, -22, 2.2, -0.45, 0]]; let k = 0;
  for (const [x, y, z, yaw, pitch] of views) { await pg.evaluate(([x, y, z, yaw, pitch]) => { const c = F0W.cab; c.camera.position.set(x, y, z); c.camera.rotation.set(pitch, yaw, 0, 'YXZ'); }, [x, y, z, yaw, pitch]); await pg.waitForTimeout(1200); await pg.screenshot({ path: `/tmp/mkt${k++}.png` }); }
  await br.close();
})();
