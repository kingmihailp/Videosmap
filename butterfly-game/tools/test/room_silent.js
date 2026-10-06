const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000); await pg.keyboard.press('Space');
  await pg.evaluate(() => F0W.enterRoom('chalet', { biome: 'alps', seed: 'T1', at: { x: 0, z: 0, yaw: 0 } })); for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => F0W.cab && F0W.cab.constructor.name === 'Room').catch(() => false)) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; F0W.locked = true; const P = F0W.cab.player; P.pos.set(0, 0, 1.0); P.yaw = 0; P.pitch = -0.5; }); await pg.waitForTimeout(1500);
  await pg.screenshot({ path: '/tmp/room_floor.png' }); await br.close();
})();
