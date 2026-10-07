// the foot of the relic trees (buttresses, surface roots, bark): /tmp/relic_base.png
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1200, height: 700 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const url = await pg.evaluate(() => {
    const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); R.setSize(1200, 700); const sc = new THREE.Scene(); sc.background = new THREE.Color('#6a8a78'); sc.add(new THREE.HemisphereLight('#b0e0c4', '#2c4a30', 1.1)); const d = new THREE.DirectionalLight('#f0f4d0', 0.8); d.position.set(5, 9, 6); sc.add(d);
    sc.add(new THREE.Mesh(new THREE.PlaneGeometry(60, 40).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#34462a' })));
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    [0, 1, 2].forEach(i => { const t = World.TREES.relic(new Rng(21 + i * 13), {}); const m = new THREE.Mesh(t.g, mat); m.position.set(-9 + i * 9, 0, 0); sc.add(m); });
    const cam = new THREE.PerspectiveCamera(46, 1200 / 700, 0.1, 200); cam.position.set(0, 4.2, 15); cam.lookAt(0, 3.2, 0); R.render(sc, cam); return R.domElement.toDataURL();
  });
  require('fs').writeFileSync('/tmp/relic_base.png', Buffer.from(url.split(',')[1], 'base64')); console.log(errs); await br.close();
})();
