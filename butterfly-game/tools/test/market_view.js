// pictures of the market from given spots: node market_view.js '<[[x,z,yaw,pitch],...]>' [unlock]
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1&hour=' + (process.argv[4] || 12));
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(u => { if (u === '1') { Save.data.secret = { frags: { 1: true, 2: true, 3: true, 4: true }, unlocked: true }; } F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMarket(); }, process.argv[3] || '0'); await pg.waitForTimeout(3500);
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; });
  const views = JSON.parse(process.argv[2]);
  for (let i = 0; i < views.length; i++) { const [x, z, yaw, pitch] = views[i]; await pg.evaluate(([x, z, yaw, pitch]) => { const P = F0W.cab.player; P.pos.set(x, 0, z); P.yaw = yaw; P.pitch = pitch; P.vel.set(0, 0); F0W.cab.toastT = 0; }, [x, z, yaw, pitch]); await pg.waitForTimeout(1500); await pg.screenshot({ path: `/tmp/mv${i}.png` }); }
  await br.close();
})();
