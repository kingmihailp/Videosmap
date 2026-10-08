// the edge of the world must not show lines: pictures looking at the corners of the map from the highest point, with layers switched off one by one -> /tmp/ve*.png
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  await pg.evaluate(([sd]) => { Save.data.maps = { vietnam: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('vietnam', sd); }, [process.argv[2] || 'VN1']);
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; });
  const shot = async (nm, yaw, pitch, hide) => {
    await pg.evaluate(([yaw, pitch, hide]) => { const P = F0W.play.player, w = F0W.play.world; if (!window.__s) { window.__s = [0, 0].map(() => null); } P.pos.set(0, w.groundAt(0, 0) + 1.65 + (window.__hi || 0), 0); P.y = P.pos.y; P.yaw = yaw; P.pitch = pitch;
      w.scene.traverse(o => { if (o.geometry && o.geometry.type === 'PlaneGeometry') { const p = o.geometry.parameters; if (p.radius === 690) o.visible = !hide.includes('sea'); if (p.width === 360) o.visible = !hide.includes('terrain'); } }); }, [yaw, pitch, hide]);
    await pg.waitForTimeout(900); await pg.screenshot({ path: `/tmp/ve_${nm}.png` }); console.log('shot', nm);
  };
  await pg.evaluate(() => { window.__hi = 0; });
  for (let k = 0; k < 4; k++) await shot('c' + k, Math.PI / 4 + k * Math.PI / 2, -0.12, []);
  await pg.evaluate(() => { window.__hi = 40; }); for (let k = 0; k < 4; k++) await shot('h' + k, Math.PI / 4 + k * Math.PI / 2, -0.05, []);
  await shot('nosea', Math.PI / 4, -0.12, ['sea']); await shot('noterrain', Math.PI / 4, -0.12, ['terrain']);
  console.log('errors', errs.slice(0, 5)); await br.close();
})();
