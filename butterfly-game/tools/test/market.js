const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message)); pg.on('console', m => { if (m.type() === 'error') console.log('console', m.text().slice(0, 200)); });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&hour=' + (process.argv[2] || 14)); await pg.waitForTimeout(2500);
  const t0 = Date.now(); await pg.evaluate(() => F0W.toMarket()); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(F0W.cab && F0W.cab.walkers)).catch(() => false)) break; await pg.waitForTimeout(500); } console.log('built in', Date.now() - t0, 'ms');
  await pg.evaluate(() => { F0W.overlay = null; F0W.cab.ov = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; });
  const views = JSON.parse(process.argv[3] || '[[-23.5,0.5,-1.57,-0.04],[-10,0,-1.57,-0.05],[-6,0.5,0,-0.05],[10,0,-1.57,-0.04],[22,0,-1.57,-0.1],[-14,-8,0,-0.05]]');
  let k = 0; for (const [x, z, yaw, pitch] of views) { await pg.evaluate(([x, z, yaw, pitch]) => { const P = F0W.cab.player; P.pos.set(x, 1.65, z); P.yaw = yaw; P.pitch = pitch; }, [x, z, yaw, pitch]); await pg.waitForTimeout(1500); await pg.screenshot({ path: `/tmp/mk${k++}.png` }); }
  console.log('stats', await pg.evaluate(() => ({ calls: F0W.cab.scene.children.length, tris: App ? 0 : 0 })).catch(() => 'n/a'));
  await br.close();
})();
