// gallery of the bog's plant models: node bog_models.js -> /tmp/bog_models.png
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1200, height: 700 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const url = await pg.evaluate(() => {
    const R = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true }); R.setSize(1200, 700); const sc = new THREE.Scene(); sc.background = new THREE.Color('#8a928e'); sc.add(new THREE.HemisphereLight('#c8d0cc', '#3a4230', 1.0)); const d = new THREE.DirectionalLight('#dfe4e0', 0.7); d.position.set(3, 8, 4); sc.add(d);
    const gr = new THREE.Mesh(new THREE.PlaneGeometry(40, 20).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#4a5a34' })); sc.add(gr);
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }); const env = { _bush: ['#3a5a2e'] }; const names = ['ryam', 'ryam', 'snag', 'dbirch', 'ledum', 'cassandra', 'hummock', 'hummock', 'hummock', 'tussock', 'tussock', 'tussock'];
    names.forEach((n, i) => { const r = new Rng(100 + i * 7); const t = World.TREES[n](r, env); const m = new THREE.Mesh(t.g, mat); const col = i % 6, row = Math.floor(i / 6); m.position.set(-8.5 + col * 3.4, 0, -3 + row * 5.5); sc.add(m); });
    const cam = new THREE.PerspectiveCamera(40, 1200 / 700, 0.1, 100); cam.position.set(0, 4.6, 14); cam.lookAt(0, 1.3, 0); R.render(sc, cam); return R.domElement.toDataURL();
  });
  require('fs').writeFileSync('/tmp/bog_models.png', Buffer.from(url.split(',')[1], 'base64')); console.log(errs); await br.close();
})();
