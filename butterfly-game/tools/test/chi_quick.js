// the Chihuahuan Desert: quicksand (slow sinking, slowdown, recovery, being dragged under) , sandstorms (schedule, fog, butterflies grounded, sound level) and the drive trap going round the pits
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const sd = process.argv[2] || 'CH1';
  await pg.evaluate(([sd]) => { Save.data.maps = { chihuahua: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('chihuahua', sd); }, [sd]);
  for (let i = 0; i < 200; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.overlay = 'hold'; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; const p = F0W.play; window.p = p; p.hintT = 0; Save.data.coins = 1e7; p.world.stormForce = null;
    window.step = (sec, dt = 0.05) => { for (let t = 0; t < sec; t += dt) { p.update(dt, F0W.inp); if (p.traps) p.traps.update(dt); } }; window.sunkCalls = 0; F0W.sunk = () => { window.sunkCalls++; };
    window.put = (x, z) => { const P = p.player, w = p.world; P.pos.set(x, w.heightAt(x, z) + 1.65, z); P.y = P.pos.y; P.vel.set(0, 0); p.sinkT = 0; p.sink = 0; p.sunkDone = false; }; step(1); });
  // ---------- quicksand
  const q = await pg.evaluate(() => { const w = p.world, a = w.quickPits[0]; put(a.x, a.z); const y0 = p.player.y; step(4); const s4 = p.sink, y4 = y0 - p.player.y; step(4); return { s4, y4, s8: p.sink, sunk: window.sunkCalls }; });
  T('standing in a pit sinks slowly (4 s)', q.s4 > 0.1 && q.s4 < 0.6, q); T('the eyes go down', q.y4 > 0.1, q.y4); T('not yet dragged under after 8 s', q.sunk === 0, q);
  const q2 = await pg.evaluate(() => { step(8); const mid = { sink: p.sink, sunk: window.sunkCalls }; step(6); return { mid, end: window.sunkCalls, sink: p.sink }; });
  T('long standing drags the player under (~12 s in the heart of a pit)', q2.end === 1 && q2.sink >= 1, q2);
  const q3 = await pg.evaluate(() => { const w = p.world, a = w.quickPits[0]; put(a.x, a.z); step(4); const s = p.sink; put(a.x + a.r * 3, a.z); step(1); const firm = { qs: w.quicksand(p.player.pos.x, p.player.pos.z) }; return { s, firm }; });
  T('stepping out frees the legs again', q3.firm.qs === 0, q3);
  const q4 = await pg.evaluate(() => { const w = p.world, a = w.quickPits[0]; put(a.x + a.r * 1.3, a.z); F0W.inp.keys.add('KeyW'); p.player.yaw = Math.PI / 2; const out = []; let x0 = p.player.pos.x; const keys = F0W.inp.keys; for (let i = 0; i < 12; i++) { step(0.5); out.push([+(w.quicksand(p.player.pos.x, p.player.pos.z)).toFixed(2), +p.sink.toFixed(2), +p.player.pos.x.toFixed(1)]); } keys.delete('KeyW'); return { out, x0, sunk: window.sunkCalls }; });
  console.log('walk through', JSON.stringify(q4.out)); T('walking across a pit sinks only a little (it is crossed alive)', Math.max(...q4.out.map(o => o[1])) < 0.6, Math.max(...q4.out.map(o => o[1])));
  // ---------- sandstorm: schedule
  const sch = await pg.evaluate(() => { const w = p.world; delete w.stormForce; const S = 240000, out = { n: 0, slots: 0, durs: [], det: true, first: null }; w.stormForce = undefined; const t0 = Math.floor(Date.now() / S) * S; for (let k = 0; k < 400; k++) { const ms = t0 + k * S + 1; const a = w.stormSchedule(ms), b = w.stormSchedule(ms); if (JSON.stringify(a) !== JSON.stringify(b)) out.det = false; if (a && a.start >= t0 + k * S && a.start < t0 + (k + 1) * S) { out.n++; out.durs.push((a.end - a.start) / 1000); } out.slots++; } return { n: out.n, slots: out.slots, min: Math.min(...out.durs), max: Math.max(...out.durs), det: out.det }; });
  T('storm every few slots, 40-70 s long, deterministic', sch.n > 150 && sch.n < 330 && sch.min >= 40 && sch.max <= 70.01 && sch.det, sch);
  // ---------- sandstorm: effects
  const e0 = await pg.evaluate(() => { const w = p.world; put(0, 0); step(3); return { fog: w.scene.fog.density, storm: w.storm, flying: p.flies.filter(f => f.state === 0 || f.state === 2).length, n: p.flies.length, states: [...new Set(p.flies.map(f => f.state))] }; });
  console.log('calm', JSON.stringify(e0));
  const e1 = await pg.evaluate(() => { const w = p.world; w.stormForce = { start: Date.now() - 30000, end: Date.now() + 1e8 }; step(25); const out = { fog: w.scene.fog.density, storm: w.storm, high: p.flies.filter(f => (f.state === 0 || f.state === 2) && f.pos.y > w.flyH(f.pos.x, f.pos.z) + 0.3).length, aloft: p.flies.filter(f => f.state === 0 || f.state === 2).length, n: p.flies.length, perched: p.flies.filter(f => f.state === 1).length, ev: w.events.length }; return out; });
  console.log('storm', JSON.stringify(e1)); T('storm level 1, fog thick', e1.storm > 0.95 && e1.fog > e0.fog * 6, [e0.fog, e1.fog]); T('no butterfly flies in the storm: all sit on the ground or on a flower', e1.aloft === 0 && e1.perched === e1.n && e1.n > 5, e1);
  const e2 = await pg.evaluate(() => { const w = p.world; w.stormForce = null; step(40); return { storm: w.storm, fog: w.scene.fog.density, flying: p.flies.filter(f => f.state === 0 || f.state === 2).length, n: p.flies.length }; });
  T('after the storm the butterflies fly again', e2.storm === 0 && e2.flying > e2.n * 0.2 && Math.abs(e2.fog - e0.fog) < 1e-6, e2);
  if (process.argv[3] === 'notrap') { console.log('errors', JSON.stringify(errs)); await br.close(); process.exit(bad || errs.length ? 1 : 0); }
  // ---------- the drive trap goes round the pits
  const tr = await pg.evaluate(() => { const w = p.world; put(0, 0); Traps.add('tr', 'drv', 1); const t = p.traps.place('drv'); if (!t) return { noplace: true }; t.life = 99999; const out = { in: 0, steps: 0, arr: 0, dist: 0, zones: p.sectors ? p.sectors.rects.length : 0, minD: 99 }; const orig = p.traps.arrive.bind(p.traps); p.traps.arrive = (a, f) => { out.arr++; orig(a, f); };
    p.traps.launch(t); let px = t.x, pz = t.z; for (let i = 0; i < 20000 && t.dr.mode !== 'hold' && out.arr < 3; i++) { p.update(0.1, F0W.inp); p.traps.update(0.1); out.steps++; out.dist += Math.hypot(t.x - px, t.z - pz); px = t.x; pz = t.z; const d = w.onQuick(t.x, t.z, 0) ? 1 : 0; out.in += d; for (const q of w.quickPits) out.minD = Math.min(out.minD, Math.hypot(q.x - t.x, q.z - t.z) - q.r); } return out; });
  console.log('trap', JSON.stringify(tr)); T('trap placed', !tr.noplace); T('the rover never enters quicksand', tr.in === 0, tr); T('and it travelled', tr.dist > 100, tr.dist);
  console.log('errors', JSON.stringify(errs)); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
