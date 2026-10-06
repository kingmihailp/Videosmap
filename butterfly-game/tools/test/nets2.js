const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1&hour=12');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  const ev = (f, a) => pg.evaluate(f, a);
  console.log('parts', await ev(() => Object.keys(NetParts.PARTS).length), 'min price', await ev(() => Math.min(...NetParts.SHOP.map(i => NetParts.PARTS[i].price))), 'shop', await ev(() => NetParts.SHOP.length));
  console.log('all-in stats', await ev(() => JSON.stringify(NetParts.stats({ h: 'h_gem', r: 'r_double', m: 'm_gold' }))), await ev(() => JSON.stringify(NetParts.stats({ h: 'h_carbon', r: 'r_titan', m: 'm_web' }))));
  // shop tabs
  await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; Save.data.coins = 50000; F0W.toMarket(); }); await pg.waitForTimeout(3500);
  await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; F0W.cab.open('shop'); });
  const to = (x, y) => ev(([x, y]) => { const r = document.getElementById('ui').getBoundingClientRect(); return [r.left + x / SW * r.width, r.top + y / SH * r.height]; }, [x, y]);
  const click = async (x, y) => { const [cx, cy] = await to(x, y); await pg.mouse.click(cx, cy); await pg.waitForTimeout(250); };
  for (let t = 0; t < 3; t++) { await click(8 + t * 76 + 20, 47); const rows = await ev(() => F0W.cab.shopLayout().rows.map(r => [r.id, r.y])); console.log('tab', t, rows.map(r => r[0]).join(',')); await click(60, rows[rows.length - 1][1] + 8); await pg.screenshot({ path: `/tmp/shop_tab${t}.png` }); await click(300, 232); }
  console.log('bought', await ev(() => JSON.stringify(Save.data.parts)));
  // pictures of all new parts on the 3D model
  const urls = await ev(() => {
    const cv = document.createElement('canvas'); cv.width = 960; cv.height = 480; const r = new THREE.WebGLRenderer({ canvas: cv, preserveDrawingBuffer: true }); r.setSize(960, 480, false);
    const sc = new THREE.Scene(); sc.background = new THREE.Color('#8ab0c0'); sc.add(new THREE.AmbientLight('#fff', 0.9)); const dl = new THREE.DirectionalLight('#fff', 0.7); dl.position.set(2, 3, 2); sc.add(dl);
    const ids = NetParts.SHOP; const cam = new THREE.PerspectiveCamera(40, 2, 0.1, 50); cam.position.set(0, 0, 9); const cols = 7;
    ids.forEach((id, i) => { const p = NetParts.PARTS[id], cfg = { h: 'h_basic', r: 'r_basic', m: 'm_basic' }; cfg[p.slot] = id; const nm = makeNetModel(cfg); nm.roll.rotation.z = 0.5; const g = nm.g; g.scale.setScalar(1.0); g.rotation.set(0.1, 0.3, 0); g.position.set((i % cols - (cols - 1) / 2) * 1.9, 0.9 - Math.floor(i / cols) * 2.3 - 0.0, 0); const pivot = new THREE.Group(); pivot.add(g); sc.add(pivot); g.position.z = 1.2; });
    r.render(sc, cam); return cv.toDataURL();
  });
  require('fs').writeFileSync('/tmp/nets_all.png', Buffer.from(urls.split(',')[1], 'base64'));
  await br.close();
})();
