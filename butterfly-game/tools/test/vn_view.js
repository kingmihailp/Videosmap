// pictures of the Vietnam highlands around its bridges: node vn_view.js [seed] [site 0|1] -> /tmp/vn0.png ...
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text().slice(0, 200)); });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const seed = process.argv[2] || 'VN1', si = +(process.argv[3] || 0);
  await pg.evaluate(([sd]) => { Save.data.maps = { bog: true, papua: true, vietnam: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('vietnam', sd); }, [seed]);
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; });
  const info = await pg.evaluate((si) => { const b = F0W.play.world.bridges[si]; return { a: b.a, cx: b.cx, cz: b.cz, nx: b.nx, nz: b.nz, tx: b.tx, tz: b.tz, W: b.W, Hs: b.Hs, weak: b.weak, Lh: b.Lh, all: F0W.play.world.bridges.map(q => [Math.round(q.cx), Math.round(q.cz), q.weak]) }; }, si);
  console.log(JSON.stringify(info));
  const yawOf = (dx, dz) => Math.atan2(-dx, -dz);
  const views = [
    ['pad-in looking across', -(info.W + 6), 0, info.nx, info.nz, 0.0, -0.12],
    ['pad-out looking back', (info.W + 6), 0, -info.nx, -info.nz, 0.0, -0.12],
    ['deck centre looking along gorge', 0, 0, info.tx, info.tz, 0, -0.35],
    ['deck centre looking down', 0, 0, info.nx, info.nz, 0, -1.2],
    ['pad-in far, wide', -(info.W + 14), 0, info.nx, info.nz, 0.0, 0.05],
  ];
  for (let i = 0; i < views.length; i++) {
    const [nm, u, v, dx, dz, , pitch] = views[i]; const x = info.cx + info.nx * u + info.tx * v, z = info.cz + info.nz * u + info.tz * v;
    await pg.evaluate(([x, z, yaw, pitch, hs]) => { const P = F0W.play.player, w = F0W.play.world; P.pos.set(x, w.groundAt(x, z) + 1.65, z); P.y = P.pos.y; P.yaw = yaw; P.pitch = pitch; }, [x, z, yawOf(dx, dz), pitch]);
    await pg.waitForTimeout(900); await pg.screenshot({ path: `/tmp/vn${i}.png` }); console.log('shot', i, nm);
  }
  console.log('errors', errs.slice(0, 5)); await br.close();
})();
