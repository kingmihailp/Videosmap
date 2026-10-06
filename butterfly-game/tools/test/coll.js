const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&hour=14'); await pg.waitForTimeout(2500);
  await pg.evaluate(() => F0W.toMarket()); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(F0W.cab && F0W.cab.circles)).catch(() => false)) break; await pg.waitForTimeout(500); }
  const r = await pg.evaluate(() => { const c = F0W.cab; c.ov = null; const out = []; const inp = { keys: new Set(['KeyW']), dx: 0, dy: 0 };
    for (const k of c.circles.slice(0, 40)) { // walk straight into every circle from 3.5 m away on 4 sides
      for (const a of [0, 1.57, 3.14, 4.71]) { const P = c.player; P.pos.set(k.x + Math.sin(a) * (k.r + 3), 1.65, k.z + Math.cos(a) * (k.r + 3)); P.yaw = a; P.pitch = 0; P.vel.set(0, 0); for (let i = 0; i < 120; i++) c.update(1 / 30, inp); const d = Math.hypot(P.pos.x - k.x, P.pos.z - k.z); if (d < k.r + 0.25) out.push([k.x.toFixed(1), k.z.toFixed(1), d.toFixed(2)]); } }
    return { circles: c.circles.length, penetrations: out.slice(0, 8), n: out.length }; });
  console.log(JSON.stringify(r)); await br.close();
})();
