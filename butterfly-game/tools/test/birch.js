const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1280, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia'); for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => new Promise(r => { F0W.overlay = null; F0W.fade = 0; F0W.fadeTarget = 0; const p = F0W.play; p.draw = () => {}; p.update = () => {}; p.netGroup.visible = false; p.flies.forEach(f => { f.mesh.visible = false; f.shadow.visible = false; });
    const sc = new THREE.Scene(); sc.background = new THREE.Color('#bcd8ec'); sc.add(new THREE.HemisphereLight('#dfefff', '#6a7a50', 0.9)); const sun = new THREE.DirectionalLight('#fff4dc', 1.0); sun.position.set(30, 60, 20); sc.add(sun);
    sc.add(new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#7a9a50' })));
    const env = World.ENV.russia; const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    for (let i = 0; i < 8; i++) { const t = World.TREES.birch(new Rng(i * 7 + 3), env); const m = new THREE.Mesh(t.g, mat); m.position.set((i - 3.5) * 3.4, 0, 0); sc.add(m); }
    const cam = new THREE.PerspectiveCamera(46, 1280 / 540, 0.1, 500); cam.position.set(0, 3.2, 17); cam.lookAt(0, 3.4, 0); p.scene = sc; p.camera = cam; setTimeout(r, 400); }));
  await pg.screenshot({ path: process.argv[2] || '/tmp/birch.png' }); await br.close();
})();
