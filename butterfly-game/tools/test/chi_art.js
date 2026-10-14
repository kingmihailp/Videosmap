// a contact sheet of the desert's butterflies (top view): node chi_art.js [biome]
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const u = await pg.evaluate(async ([bid]) => {
    const list = BIOMES.find(b => b.id === bid).species, C = 7, Rw = Math.ceil(list.length / C), S = 150;
    const cv = document.createElement('canvas'); cv.width = C * S; cv.height = Rw * S; const r = new THREE.WebGLRenderer({ canvas: cv, preserveDrawingBuffer: true }); r.setSize(C * S, Rw * S, false); r.setScissorTest(true);
    const sc = new THREE.Scene(); sc.background = new THREE.Color('#8fa7b8'); sc.add(new THREE.HemisphereLight('#ffffff', '#99a', 1.6)); const cam = new THREE.PerspectiveCamera(30, 1, 0.01, 10);
    list.forEach((sp, i) => { const m = Art.makeButterfly(sp); Art.setFlap(m, 1.2); sc.add(m); const span = m.userData.span, x = (i % C) * S, y = (Rw - 1 - Math.floor(i / C)) * S; r.setViewport(x, y, S, S); r.setScissor(x, y, S, S); cam.position.set(0, span * 2.6, 0.0001); cam.lookAt(0, 0, 0); r.render(sc, cam); sc.remove(m); });
    return cv.toDataURL();
  }, [process.argv[2] || 'chihuahua']);
  require('fs').writeFileSync('/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/art.png', Buffer.from(u.split(',')[1], 'base64')); await br.close();
})();
