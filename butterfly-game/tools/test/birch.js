const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1&hour=12');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; const p = F0W.play; p.cards = []; p.netGroup.visible = false; });
  // find birches: trees with white trunks are in world.trees? fall back to flying the camera up and looking at the canopy
  for (let k = 0; k < 3; k++) {
    await pg.evaluate(k => { const p = F0W.play, P = p.player; P.pos.y += 0; P.yaw = k * 2.1; P.pitch = 0.42; }, k); await pg.waitForTimeout(900); await pg.screenshot({ path: `/tmp/birch${k}.png` });
  }
  await br.close();
})();
