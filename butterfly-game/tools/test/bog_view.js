// pictures of the bog from given spots: node bog_view.js '<[[x,z,yaw,pitch],...]>' [seed]
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'warning' || m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  await pg.evaluate(seed => { Save.data.maps = { bog: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('bog', seed); }, process.argv[3] || 'BOG1');
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; });
  const views = JSON.parse(process.argv[2] || '[[0,0,0,-0.1]]');
  for (let i = 0; i < views.length; i++) { const [x, z, yaw, pitch] = views[i]; await pg.evaluate(([x, z, yaw, pitch]) => { const P = F0W.play.player; P.pos.set(x, F0W.play.world.heightAt(x, z) + 1.65, z); P.y = P.pos.y; P.yaw = yaw; P.pitch = pitch; P.vel.set(0, 0); F0W.play.toasts = []; }, [x, z, yaw, pitch]); await pg.waitForTimeout(1800); await pg.screenshot({ path: `/tmp/bog${i}.png` }); }
  console.log('errors', errs, JSON.stringify(await pg.evaluate(() => ({ lm: F0W.play.world.landmarks, lp: F0W.play.world.lmPos, pools: F0W.play.world.waters.map(w => [Math.round(w.x), Math.round(w.z), +w.r.toFixed(1)]), flies: F0W.play.flies.length }))));
  await br.close();
})();
