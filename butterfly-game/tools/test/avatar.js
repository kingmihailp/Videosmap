const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1&hour=12');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  const views = JSON.parse(process.argv[2] || '[[0,0],[0.9,0],[2.4,0]]');   // [yaw offset of avatar, flashOn]
  for (let i = 0; i < views.length; i++) {
    await pg.evaluate(([yaw, fl]) => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; const p = F0W.play, P = p.player; window.__R = window.__R || new Remotes(p.scene, { flash: false });
      P.pitch = 0; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw); p.netGroup.visible = false; const pos = { x: P.pos.x + fx * 3 , y: P.pos.y, z: P.pos.z + fz * 3 };
      Net.remote = { a: { name: 'Anna', pos, yaw: P.yaw + Math.PI + yaw, pitch: 0, t: performance.now(), speedNow: 0, sit: 0, flashOn: !!fl, swinging: false } };
      p.cards = []; window.__R.update(5); }, views[i]);
    await pg.waitForTimeout(700); await pg.screenshot({ path: `/tmp/av${i}.png` });
  }
  await br.close();
})();
