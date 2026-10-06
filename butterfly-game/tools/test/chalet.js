const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message)); pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('console', m.text().slice(0, 160)); });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=alps' + (process.argv[2] || '')); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.overlay = null; F0W.fade = 0; F0W.fadeTarget = 0; F0W.play.hintT = 0; F0W.play.netGroup.visible = false; });
  console.log('door', await pg.evaluate(() => JSON.stringify(F0W.play.world.door)));
  const views = JSON.parse(process.argv[3] || '[[10,1.7,0,0],[6,2.2,0.7,0],[14,1.7,2.4,-0.3]]'); let k = 0;
  for (const [f, h, side, dy] of views) { await pg.evaluate(([f, h, side, dy]) => { const P = F0W.play.player, d = F0W.play.world.door, ry = d.yaw; const ox = d.x + Math.sin(ry) * f + Math.cos(ry) * side, oz = d.z + Math.cos(ry) * f - Math.sin(ry) * side; P.pos.set(ox, F0W.play.world.heightAt(ox, oz) + h, oz); P.yaw = Math.atan2(-(d.x - ox), -(d.z - oz)) + dy + Math.PI * 0; P.pitch = -0.02; P.y = P.pos.y; }, [f, h, side, dy]); await pg.waitForTimeout(1200); await pg.screenshot({ path: `/tmp/ch${k++}.png` }); }
  await br.close();
})();
