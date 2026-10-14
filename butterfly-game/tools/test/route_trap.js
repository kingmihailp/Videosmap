// the drive trap drives the route the player sets on a map (any points of the location); a sandstorm jams its navigation and the "map" module; 14-20 quicksand pits; the storm leaves a few metres of sight
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const SH = '/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/';
  await pg.evaluate(() => { Save.data.maps = { chihuahua: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('chihuahua', 'RT1'); });
  for (let i = 0; i < 200; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.overlay = 'hold'; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; const p = F0W.play; window.p = p; p.hintT = 0; Save.data.coins = 1e7; p.world.stormForce = null; window.step = (sec, dt = 0.1) => { for (let t = 0; t < sec; t += dt) { p.update(dt, F0W.inp); if (p.traps) p.traps.update(dt); } }; step(1);
    window.msgs = []; const tq = p.toast.bind(p); p.toast = (m, ...a) => { window.msgs.push(String(m)); return tq(m, ...a); }; });
  // ---------- pits: 14..20 (several seeds, only the count is needed)
  const cnt = await pg.evaluate(() => { const out = []; for (const sd of ['A1', 'B2', 'C3', 'D4', 'E5', 'F6']) { const w = World.build(BIOME_BY_ID.chihuahua, sd); out.push(w.quickPits.length); } return out; });
  T('14-20 quicksand pits on the big map', cnt.every(n => n >= 14 && n <= 20) && new Set(cnt).size > 1, cnt);
  // ---------- the trap, a route set point by point
  const r0 = await pg.evaluate(() => { Traps.add('tr', 'drv', 1); const t = p.traps.place('drv'); window.TR = t; t.life = 99999; const out = { placed: !!t };
    out.noRoute = p.traps.launch(t); out.noRouteMsg = window.msgs.slice(-1)[0]; return out; });
  T('without a route it does not start', r0.placed && r0.noRoute === false && /маршрут/i.test(r0.noRouteMsg), r0.noRouteMsg);
  // the editor: open it, click on the map
  const ed = await pg.evaluate(() => { p.traps.nearest(); Traps.UI.openTrap(p, TR); const U = Traps.UI; F0W.overlay = 'trap'; const out = {}; out.btn = U.layout().some(b => b.id === 'route'); U.click(284 + 5, 232 + 5); out.mode = U.mode;
    const R = p.world.R, M = U.mapRect(); const clickAt = (x, z) => { const [mx, my] = U.toMap(x, z); return U.click(mx, my); };
    const spots = [[-60, 40], [30, -90], [100, 20], [0, 0]]; spots.forEach(([x, z]) => clickAt(x, z)); out.n = TR.dr.route.length; out.route = TR.dr.route.map(q => [Math.round(q.x), Math.round(q.z)]);
    clickAt(R * 2, 0); out.outside = TR.dr.route.length;                                  // off the map: nothing
    U.click(M.x + M.w + 20, M.y + 10);
    for (let i = 0; i < 20; i++) clickAt(-100 + i * 8, 100); out.max = TR.dr.route.length;
    U.layout(); const b = U.btns.find(b => b.id === 'rundo'); U.click(b.x + 2, b.y + 2); out.afterUndo = TR.dr.route.length;
    const c = U.btns.find(b => b.id === 'rclear'); U.click(c.x + 2, c.y + 2); out.afterClear = TR.dr.route.length;
    spots.forEach(([x, z]) => clickAt(x, z)); out.again = TR.dr.route.length; return out; });
  console.log(JSON.stringify(ed)); T('the «Маршрут» button opens the editor', ed.btn && ed.mode === 'route'); T('clicks on the map add points (any place of the location)', ed.n === 4, ed.route);
  T('a click outside the location adds nothing', ed.outside === 4); T('at most 12 points', ed.max === 12, ed.max); T('«Убрать точку» / «Очистить»', ed.afterUndo === 11 && ed.afterClear === 0 && ed.again === 4, [ed.afterUndo, ed.afterClear, ed.again]);
  await pg.evaluate(() => { const c = document.createElement('canvas'); c.width = 480; c.height = 270; Traps.UI.draw(c.getContext('2d'), 0, { x: 100, y: 100 }, 0.016); window.edPic = c.toDataURL(); });
  require('fs').writeFileSync(SH + 'route_editor.png', Buffer.from((await pg.evaluate(() => window.edPic)).split(',')[1], 'base64'));
  // drive it: the points are visited in the order they were set, never through a pit; the stop at every point
  const dr = await pg.evaluate(() => { const D = TR.dr; F0W.overlay = 'hold'; const pts = D.route.map(q => [q.x, q.z]); const out = { arr: [], in: 0, d: 0, pts, mode0: null }; const orig = p.traps.arrive.bind(p.traps); p.traps.arrive = (t, f) => { out.arr.push({ i: t.dr.tgt, x: Math.round(t.x), z: Math.round(t.z), forced: !!f, stop: 0 }); orig(t, f); out.arr[out.arr.length - 1].stop = Math.round(t.dr.stopLeft); };
    p.traps.launch(TR); out.mode0 = D.mode; let px = TR.x, pz = TR.z; for (let i = 0; i < 20000 && out.arr.length < pts.length; i++) { p.update(0.1, F0W.inp); p.traps.update(0.1); out.d += Math.hypot(TR.x - px, TR.z - pz); px = TR.x; pz = TR.z; if (p.world.onQuick(TR.x, TR.z, 0)) out.in++; if (D.mode === 'stop' && !D.navErr) { D.stopLeft = Math.min(D.stopLeft, 0.3); } }
    out.end = D.mode; out.next = D.next; return out; });
  console.log(JSON.stringify(dr).slice(0, 700)); T('it drove', dr.mode0 === 'drive' && dr.d > 100, dr.d); T('every point was reached, in order, unforced', dr.arr.length === 4 && dr.arr.every((a, i) => a.i === i && !a.forced), dr.arr);
  T('each stop is near its point', dr.arr.every((a, i) => Math.hypot(a.x - dr.pts[i][0], a.z - dr.pts[i][1]) < 4), dr.arr.map((a, i) => Math.round(Math.hypot(a.x - dr.pts[i][0], a.z - dr.pts[i][1]))));
  T('never through quicksand', dr.in === 0, dr.in); T('stands long at a point (the pause is in the 15 s..4 min range)', dr.arr.every(a => a.stop >= 15 && a.stop <= 240), dr.arr.map(a => a.stop));
  await pg.evaluate(() => { for (let i = 0; i < 40; i++) { p.update(0.1, F0W.inp); p.traps.update(0.1); } });
  T('after the last point it stays and keeps catching', await pg.evaluate(() => ['hold', 'stop'].includes(TR.dr.mode)), await pg.evaluate(() => TR.dr.mode));
  // ---------- the sandstorm: navigation error, the module, visibility
  const st = await pg.evaluate(() => { const D = TR.dr; D.mode = 'hold'; D.next = 0; D.navErr = false; const w = p.world; w.stormForce = null; p.traps.launch(TR); step(8); const out = { driving: D.mode === 'drive', x0: TR.x, z0: TR.z };
    w.stormForce = { start: Date.now() - 30000, end: Date.now() + 1e8 }; step(1); out.mode = D.mode; out.err = D.navErr; out.run = TR.run; out.msg = window.msgs.slice(-1)[0]; const x1 = TR.x, z1 = TR.z; step(20); out.still = Math.hypot(TR.x - x1, TR.z - z1) < 0.05; out.relaunch = p.traps.launch(TR); out.relMsg = window.msgs.slice(-1)[0];
    out.fog = w.scene.fog.density; out.vis = 1 / out.fog; w.stormForce = null; step(30); out.after = D.mode; out.err2 = D.navErr; out.storm = w.storm; out.resumed = window.msgs.some(m => /Навигация восстановлена/.test(m)); return out; });
  console.log(JSON.stringify(st)); T('driving before the storm', st.driving); T('the storm stops it at once with a navigation error', st.mode === 'stop' && st.err && st.run === 0 && /навигац/i.test(st.msg), [st.mode, st.msg]); T('it stands still while the storm lasts and will not start', st.still && st.relaunch === false && /навигац/i.test(st.relMsg), st.relMsg);
  T('a few metres of sight in the storm (fog density ≥ 0.2)', st.fog >= 0.2, st.fog); T('when the storm is over the navigation recovers and it drives on by itself', st.resumed && !st.err2 && st.storm === 0 && (st.after === 'drive' || st.after === 'stop'), [st.after, st.err2]);
  // the map module in the storm: draws without errors, differs from the calm picture
  const mm = await pg.evaluate(() => { const S = p.netStats; S.map = true; const c = document.createElement('canvas'); c.width = 480; c.height = 270; const ctx = c.getContext('2d'); const w = p.world; const snap = () => { ctx.clearRect(0, 0, 480, 270); Gear.drawMap(p, ctx, 3.3); return ctx.getImageData(380, 150, 98, 100).data.reduce((a, v, i) => a + (i % 4 === 0 ? v : 0), 0); };
    w.stormForce = null; step(0.1); const calm = snap(); w.stormForce = { start: Date.now() - 30000, end: Date.now() + 1e8 }; step(0.5); const stormy = []; for (let i = 0; i < 6; i++) stormy.push(snap()); ctx.clearRect(0, 0, 480, 270); Gear.drawMap(p, ctx, 5.1); window.mapPic = c.toDataURL(); w.stormForce = null; return { calm, stormy }; });
  T('the map module draws in the storm (red glitchy picture)', mm.stormy.every(v => v > 0) && mm.stormy.some(v => Math.abs(v - mm.calm) > 2000), mm);
  require('fs').writeFileSync(SH + 'map_storm.png', Buffer.from((await pg.evaluate(() => window.mapPic)).split(',')[1], 'base64'));
  T('no errors', errs.length === 0, errs.slice(0, 3));
  console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
