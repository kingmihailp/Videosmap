// renders the player avatar (Remotes.make) from several sides on a plain background -> /tmp/avN.png
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready))) break; await pg.waitForTimeout(250); }
  const urls = await pg.evaluate(() => {
    const cv = document.createElement('canvas'); cv.width = 480; cv.height = 480; const r = new THREE.WebGLRenderer({ canvas: cv, antialias: false, preserveDrawingBuffer: true }); r.setSize(480, 480, false);
    const sc = new THREE.Scene(); sc.background = new THREE.Color('#8ab'); sc.add(new THREE.AmbientLight('#fff', 0.8)); const dl = new THREE.DirectionalLight('#fff', 0.8); dl.position.set(2, 4, 3); sc.add(dl);
    const R = new Remotes(sc, {}); Net.remote = { a: { name: 'Anna', pos: { x: 0, y: 1.65, z: 0 }, yaw: 0, pitch: 0, t: performance.now(), speedNow: 0, sit: 0, flashOn: false, swinging: false } }; R.update(5);
    const cam = new THREE.PerspectiveCamera(40, 1, 0.1, 50); const out = [];
    for (const [ang, h] of [[0, 1], [Math.PI, 1], [Math.PI / 2, 1], [0.6, 1.9]]) { cam.position.set(Math.sin(ang) * 3.4, h + 0.2, Math.cos(ang) * 3.4); cam.lookAt(0, 1.0, 0); r.render(sc, cam); out.push(cv.toDataURL()); }
    return out;
  });
  const fs = require('fs'); urls.forEach((u, i) => fs.writeFileSync(`/tmp/av${i}.png`, Buffer.from(u.split(',')[1], 'base64')));
  await br.close();
})();
