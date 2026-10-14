// a contact sheet of desert plant models standing on sand: node chi_models.js [types]
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 640, height: 360 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const u = await pg.evaluate(([types]) => {
    const C = 4, Rw = Math.ceil(types.length / C), S = 300, cv = document.createElement('canvas'); cv.width = C * S; cv.height = Rw * S; const r = new THREE.WebGLRenderer({ canvas: cv, preserveDrawingBuffer: true }); r.setSize(C * S, Rw * S, false); r.setScissorTest(true);
    const sc = new THREE.Scene(); sc.background = new THREE.Color('#9ec4e8'); sc.add(new THREE.HemisphereLight('#fff4d8', '#b89462', 1.2)); const sun = new THREE.DirectionalLight('#fff1d2', 1.0); sun.position.set(3, 6, 4); sc.add(sun);
    const ground = new THREE.Mesh(new THREE.CircleGeometry(6, 24).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#d4b684' })); sc.add(ground); const mat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), env = World.ENV.chihuahua; env._bush = ['#8a8a50', '#9a9658'];
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 50);
    types.forEach((k, i) => { const t = World.TREES[k](new Rng(i * 7 + 3), env), m = new THREE.Mesh(t.g, mat); sc.add(m); const x = (i % C) * S, y = (Rw - 1 - Math.floor(i / C)) * S; r.setViewport(x, y, S, S); r.setScissor(x, y, S, S); const h = Math.max(t.h, 1), d = Math.max(3.2, h * 2.4); cam.position.set(d * 0.8, h * 0.7 + 0.5, d * 0.9); cam.lookAt(0, h * 0.42, 0); r.render(sc, cam); sc.remove(m); });
    return cv.toDataURL();
  }, [(process.argv[2] || 'nopal,yucca,creosote,barrel,cholla,agave,sotol,ocotillo').split(',')]);
  require('fs').writeFileSync('/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/models.png', Buffer.from(u.split(',')[1], 'base64')); await br.close();
})();
