// renders the market scene from above (orthographic) -> /tmp/market_top.png ; args: cx cz half
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const [cx, cz, half] = [+(process.argv[2] || 0), +(process.argv[3] || 0), +(process.argv[4] || 40)];
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1&hour=12');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMarket(); }); await pg.waitForTimeout(3500);
  const u = await pg.evaluate(([cx, cz, half]) => {
    const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 1000; const r = new THREE.WebGLRenderer({ canvas: cv, preserveDrawingBuffer: true }); r.setSize(1000, 1000, false);
    const sc = F0W.cab.scene, cam = new THREE.OrthographicCamera(-half, half, half, -half, 1, 400); cam.position.set(cx, 60, cz); cam.up.set(0, 0, -1); cam.lookAt(cx, 0, cz);
    sc.fog = null; sc.background = new THREE.Color('#222'); const hide = []; sc.traverse(o => { if (o.geometry && o.geometry.type === 'BoxGeometry' && o.position.y > 5 && o.geometry.parameters.width > 40) { hide.push(o); o.visible = false; } }); const dome = F0W.cab.dome; dome.visible = false;
    r.render(sc, cam); return cv.toDataURL();
  }, [cx, cz, half]);
  require('fs').writeFileSync('/tmp/market_top.png', Buffer.from(u.split(',')[1], 'base64'));
  await br.close();
})();
