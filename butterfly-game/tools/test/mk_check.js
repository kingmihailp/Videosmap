const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&hour=14'); await pg.waitForTimeout(2500);
  await pg.evaluate(() => F0W.toMarket()); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(F0W.cab && F0W.cab.walkers)).catch(() => false)) break; await pg.waitForTimeout(500); }
  const r = await pg.evaluate(() => { const c = F0W.cab, out = { flutter: (c.flutter || []).length, butterfliesInScene: 0, stations: {}, bad: [] }; c.scene.traverse(o => { if (o.userData && o.userData.L && o.userData.R) out.butterfliesInScene++; });
    c.stations.forEach(s => { const k = s.id === 'chat' ? s.label() : s.id; out.stations[k] = (out.stations[k] || 0) + 1; });
    // every stall footprint must be clear of the fountain, other stalls and houses: check collider overlaps (stall vs house/fountain)
    const cols = c.colliders; let overlaps = 0; for (let i = 0; i < cols.length; i++) for (let j = i + 1; j < cols.length; j++) { const a = cols[i], b = cols[j]; const ox = Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0), oz = Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0); if (ox > 0.25 && oz > 0.25) { overlaps++; if (out.bad.length < 12) out.bad.push([a, b].map(k => `${k.x0.toFixed(1)},${k.x1.toFixed(1)}|${k.z0.toFixed(1)},${k.z1.toFixed(1)}`).join('  X  ')); } } out.overlaps = overlaps; out.colliders = cols.length; return out; });
  console.log(JSON.stringify(r, null, 1)); console.log('errors', errs); await br.close();
})();
