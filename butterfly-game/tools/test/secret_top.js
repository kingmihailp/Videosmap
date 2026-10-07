const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1&hour=12');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toSecret(); }); await pg.waitForTimeout(3000);
  const u = await pg.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 800; const r = new THREE.WebGLRenderer({ canvas: cv, preserveDrawingBuffer: true }); r.setSize(1200, 800, false); r.localClippingEnabled = false; r.clippingPlanes = [new THREE.Plane(new THREE.Vector3(0, -1, 0), 2.6)];
    const sc = F0W.cab.scene; sc.fog = null; sc.add(new THREE.AmbientLight('#ffffff', 1.1)); const cam = new THREE.OrthographicCamera(-11.5, 11.5, 7.7, -7.7, 1, 100); cam.position.set(0, 30, -0.5); cam.up.set(0, 0, -1); cam.lookAt(0, 0, -0.5); r.render(sc, cam); return cv.toDataURL();
  });
  require('fs').writeFileSync('/tmp/secret_top.png', Buffer.from(u.split(',')[1], 'base64')); await br.close();
})();
