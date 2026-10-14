// the drive trap's path finding over many landscapes: every zone must be reached (not "stuck"), and the trap must stand in the zone it was heading for
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const biomes = (process.argv[2] || 'russia,amazon,borneo,alps').split(','), seeds = (process.argv[3] || 'A1,B2').split(','); let bad = 0, tot = 0;
  for (const b of biomes) for (const sd of seeds) {
    const pg = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
    await pg.goto(`file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&${process.env.LITE ? 'lite&' : ''}biome=${b}&seed=${sd}&hour=12`);
    for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(250); }
    const r = await pg.evaluate(() => { F0W.overlay = 'hold'; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; const p = F0W.play; p.hintT = 0; Save.data.coins = 1e7; const step = (sec, dt = 0.1) => { for (let t = 0; t < sec; t += dt) { p.update(dt, F0W.inp); p.traps.update(dt); } }; step(2, 1 / 30);
      const S = p.sectors; if (!S) return { none: true }; Traps.add('tr', 'drv', 1); const T = p.traps.place('drv'); if (!T) return { noplace: true }; T.life = 99999; { const z0 = S.at(T.x, T.z); T.dr.route = []; S.rects.forEach((q, i) => { if (i === z0) return; const sp = p.traps.routeSnap(T, (q.x0 + q.x1) / 2, (q.z0 + q.z1) / 2); if (sp) T.dr.route.push(sp); }); } p.traps.launch(T); const msgs = []; const tq = p.toast.bind(p); p.toast = (m, ...r) => { msgs.push(String(m).slice(0, 60)); return tq(m, ...r); }; const orig = p.traps.arrive.bind(p.traps), arr = []; p.traps.arrive = (t, forced) => { const tgt = S.at(t.dr.wp.x, t.dr.wp.z); orig(t, forced); arr.push({ tgt, at: S.at(t.x, t.z), forced: !!forced, x: Math.round(t.x), z: Math.round(t.z), t: Math.round(T.t), rp: t.dr.replans, d: Math.round(Math.hypot(t.dr.wp.x - t.x, t.dr.wp.z - t.z)) }); }; p.traps.launch(T);
      for (let i = 0; i < 40000 && T.dr.mode !== 'hold'; i++) { step(0.1); if (arr.length >= T.dr.route.length && T.dr.mode === 'stop') break; } return { n: S.rects.length, arr, visited: arr.length, skipped: msgs.filter(m => /не проехать|не нашла/.test(m)) }; });
    for (const a of r.arr || []) { tot++; if (a.forced || a.tgt !== a.at) { bad++; } }
    console.log(b, sd, r.none ? 'no zones' : JSON.stringify(r.arr), JSON.stringify(r.skipped || []), errs.length ? errs : ''); await pg.close();
  }
  console.log(bad ? `FAIL ${bad} of ${tot} arrivals were forced or in the wrong zone` : `ALL PASS (${tot} arrivals)`); await br.close(); process.exit(bad ? 1 : 0);
})();
