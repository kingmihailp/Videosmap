// walks into the secret market and takes pictures: node secret_view.js '<views JSON [x,z,yaw,pitch]>'
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message)); pg.on('console', m => { if (m.type() === 'error') console.log('console.error', m.text().slice(0, 200)); });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1&hour=12');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toSecret(); }); await pg.waitForTimeout(3000);
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; });
  const views = JSON.parse(process.argv[2] || '[[0,4.8,0,-0.02],[0,1.8,0,-0.05]]');
  for (let i = 0; i < views.length; i++) { const [x, z, yaw, pitch] = views[i]; await pg.evaluate(([x, z, yaw, pitch]) => { const P = F0W.cab.player; P.pos.set(x, 0, z); P.yaw = yaw; P.pitch = pitch; P.vel.set(0, 0); F0W.cab.toastT = 0; }, [x, z, yaw, pitch]); await pg.waitForTimeout(800); await pg.screenshot({ path: `/tmp/sec${i}.png` }); }
  await br.close();
})();
