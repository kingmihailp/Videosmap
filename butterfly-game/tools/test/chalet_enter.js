const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message)); pg.on('console', m => { if (m.type() === 'error') console.log('console', m.text().slice(0, 160)); });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=alps'); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.overlay = null; F0W.fade = 0; F0W.fadeTarget = 0; F0W.play.hintT = 0; const P = F0W.play.player, d = F0W.play.world.door; P.pos.set(d.x + Math.sin(d.yaw) * 1.8, 0, d.z + Math.cos(d.yaw) * 1.8); P.pos.y = F0W.play.world.heightAt(P.pos.x, P.pos.z) + 1.65; P.yaw = d.yaw; });
  await pg.waitForTimeout(500); console.log('near door', await pg.evaluate(() => F0W.play.doorNear)); await pg.screenshot({ path: '/tmp/ce0.png' });
  await pg.keyboard.press('KeyE'); await pg.waitForTimeout(3000);
  console.log('after E', await pg.evaluate(() => ({ screen: F0W.screen, room: F0W.cab && F0W.cab.constructor.name, ov: F0W.cab && F0W.cab.ov })));
  await pg.evaluate(() => { F0W.overlay = null; F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; F0W.locked = true; }); await pg.waitForTimeout(800); await pg.screenshot({ path: '/tmp/ce1.png' });
  await pg.evaluate(() => { const P = F0W.cab.player; P.yaw = Math.PI / 2; P.pos.set(2, 0, 0); }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/ce2.png' });
  await pg.evaluate(() => { const P = F0W.cab.player; P.pos.set(0, 0, 2.2); P.yaw = Math.PI; }); await pg.waitForTimeout(500); console.log('prompt', await pg.evaluate(() => F0W.cab.prompt && F0W.cab.prompt.id));
  await pg.keyboard.press('KeyE'); await pg.waitForTimeout(3500);
  console.log('after exit', await pg.evaluate(() => { const d = F0W.play && F0W.play.world.door, P = F0W.play && F0W.play.player; return { screen: F0W.screen, play: !!F0W.play, dist: d && P ? Math.hypot(d.x - P.pos.x, d.z - P.pos.z).toFixed(2) : null, biome: F0W.play && F0W.play.biome.id }; }));
  await br.close();
})();
