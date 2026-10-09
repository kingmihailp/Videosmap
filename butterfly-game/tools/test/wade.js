const path = require('path'); const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } }); page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('file://' + path.resolve(__dirname, '../../Flora0world_Butterflies.html') + '#debug&nolock'); await page.waitForTimeout(1000);
  const run = async (biome, seed) => {
    await page.evaluate(([b, s]) => (Save.data.maps = Save.data.maps || {}, BIOMES.forEach(b => { if (b.map) Save.data.maps[b.map] = true; }), F0W.start)(b, s), [biome, seed]); await page.waitForTimeout(2500);
    await page.evaluate(() => { F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; });
    return page.evaluate(() => { const p = F0W.play, w = p.world, P = p.player; let sp = null;
      for (let a = 0; a < 6.28 && !sp; a += 0.1) for (let d = 8; d < 44; d += 1) { const x = Math.cos(a) * d, z = Math.sin(a) * d; if (w.inWater(x, z, 0) && !w.inWater(Math.cos(a) * (d - 1.5), Math.sin(a) * (d - 1.5), 0)) { sp = { x, z, a, d }; break; } }
      if (!sp) return { err: 'no water' };
      P.pos.set(Math.cos(sp.a) * (sp.d - 3), P.pos.y, Math.sin(sp.a) * (sp.d - 3)); P.yaw = Math.atan2(-Math.cos(sp.a), -Math.sin(sp.a)) ; // face outward
      const inp = { keys: new Set(['KeyW']), dx: 0, dy: 0, fire: false }; let maxD = 0, speedLand = 0, speedWater = 0, nL = 0, nW = 0, deepHit = false, last = [P.pos.x, P.pos.z];
      for (let i = 0; i < 20 * 25; i++) { p.update(1 / 20, inp); const sp2 = Math.hypot(P.pos.x - last[0], P.pos.z - last[1]) * 20; last = [P.pos.x, P.pos.z]; if (w.inWater(P.pos.x, P.pos.z, 0)) { speedWater += sp2; nW++; } else { speedLand += sp2; nL++; } maxD = Math.max(maxD, Math.hypot(P.pos.x, P.pos.z)); }
      return { landSpeed: +(speedLand / Math.max(1, nL)).toFixed(2), waterSpeed: +(speedWater / Math.max(1, nW)).toFixed(2), waterFrames: nW, endR: +Math.hypot(P.pos.x, P.pos.z).toFixed(1), edge: sp.d.toFixed(1), toasts: p.toasts.map(t => t.text) }; });
  };
  console.log('russia', JSON.stringify(await run('russia', 'WADE1')));
  console.log('ocean', JSON.stringify(await run('ocean', 'WADE2')));
  console.log(JSON.stringify(await page.evaluate(() => { BIOME_BY_ID.ocean.species.forEach(s => Save.add(s.id, 'ocean')); const r = revealOcean(); return { r, name: BIOME_BY_ID.ocean.name, secret: BIOME_BY_ID.ocean.secret, coll: collText() }; })));
  await page.evaluate(() => { F0W.screen = 'map'; Screens.wmap.sel = 8; }); await page.waitForTimeout(700); await page.screenshot({ path: '/tmp/t_map_rev.png' });
  await browser.close();
})();
