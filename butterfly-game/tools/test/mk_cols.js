const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage(); await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&hour=14'); await pg.waitForTimeout(2500);
  await pg.evaluate(() => F0W.toMarket()); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(F0W.cab && F0W.cab.walkers)).catch(() => false)) break; await pg.waitForTimeout(500); }
  const [X0, X1, Z0, Z1] = process.argv.slice(2).map(Number);
  console.log(await pg.evaluate(([X0, X1, Z0, Z1]) => { const c = F0W.cab; return c.colliders.filter(k => k.x1 > X0 && k.x0 < X1 && k.z1 > Z0 && k.z0 < Z1).map(k => [k.x0, k.x1, k.z0, k.z1].map(v => +v.toFixed(2)).join(' ')).join('\n') + '\ncircles:\n' + c.circles.filter(k => k.x + k.r > X0 && k.x - k.r < X1 && k.z + k.r > Z0 && k.z - k.r < Z1).map(k => [k.x, k.z, k.r].map(v => +v.toFixed(2)).join(' ')).join('\n'); }, [X0, X1, Z0, Z1]));
  await br.close();
})();
