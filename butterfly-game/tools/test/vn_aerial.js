// aerial pictures of the Vietnam archipelago (a free camera): node vn_aerial.js [seed] -> /tmp/vna0.png ...; prints the islands and the bridges
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const seed = process.argv[2] || 'VN1';
  await pg.evaluate(([sd]) => { Save.data.maps = { vietnam: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('vietnam', sd); }, [seed]);
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  console.log(JSON.stringify(await pg.evaluate(() => { const w = F0W.play.world; return { islands: w.islands.map(o => [Math.round(o.x), Math.round(o.z), Math.round(o.R), +o.Hr.toFixed(1)]), bridges: w.bridges.map(b => ({ isl: b.isl, len: +(2 * b.Lh).toFixed(1), weak: b.weak, loop: b.loop })) }; })));
  const cams = [[0, 75, 95, 0, -0.62], [60, 45, 0, -1.57, -0.5], [-70, 40, -30, 1.9, -0.45], [0, 100, 0.1, 0, -1.5]];
  for (let i = 0; i < cams.length; i++) {
    await pg.evaluate(([x, y, z, yaw, pitch]) => { const p = F0W.play; F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; if (!p.__orig) { p.__orig = p.update.bind(p); } p.update = function (dt, inp, ...r) { p.__orig(dt, inp, ...r); p.camera.position.set(x, y, z); p.camera.rotation.set(pitch, yaw, 0, 'YXZ'); }; }, cams[i]);
    await pg.waitForTimeout(1200); await pg.screenshot({ path: `/tmp/vna${i}.png` });
  }
  console.log('errors', errs.slice(0, 4)); await br.close();
})();
