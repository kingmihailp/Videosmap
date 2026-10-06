const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready))) break; await pg.waitForTimeout(250); }
  const u = await pg.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 900; cv.height = 300; const r = new THREE.WebGLRenderer({ canvas: cv, preserveDrawingBuffer: true }); r.setSize(900, 300, false);
    const sc = new THREE.Scene(); sc.background = new THREE.Color('#8ab'); const sp = BIOMES[0].species[0]; const m = Art.makeButterfly(sp); sc.add(m);
    const cam = new THREE.PerspectiveCamera(30, 3, 0.01, 10); const span = m.userData.span; const out = [];
    for (const [px, py, pz] of [[0, 3.2, 0.6], [1.5, 1.2, -2.2], [2.2, 0.5, 0]]) { cam.position.set(px * span * 1.6, py * span * 1.6, pz * span * 1.6 + 0.0001); cam.lookAt(0, 0, -span * 0.15); r.render(sc, cam); out.push(cv.toDataURL()); }
    return out;
  });
  require('fs').writeFileSync('/tmp/bf0.png', Buffer.from(u[0].split(',')[1], 'base64')); require('fs').writeFileSync('/tmp/bf1.png', Buffer.from(u[1].split(',')[1], 'base64'));
  await br.close();
})();
