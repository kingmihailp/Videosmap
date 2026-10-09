// a butterfly really flies into a trap: it starts several metres away, moves continuously (no jumps), crosses the wall of the trap only through its entrance (under the ring / over the sill / through the doorway),
// ends at a resting spot inside, and is counted in the trap only when it has landed
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  await pg.evaluate(() => { Save.data.coins = 1; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('russia', 'FLY1'); });
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  const res = await pg.evaluate(() => {
    const p = F0W.play, S = p.traps, w = p.world, out = [];
    ['std', 'str', 'imp'].forEach((type, ti) => {
      for (let rep = 0; rep < 4; rep++) {
        const x = 3 + ti * 6, z = -6 - rep * 3.2, yaw = rep * 0.9 + ti;
        const t = S.mk({ tid: `F${type}${rep}`, owner: 0, name: 'Вы', type, x, y: w.groundAt(x, z), z, yaw, age: 0, fl: 'lavender', hn: 'heather' }, true);
        const sp = Traps.lure(p.biome)[rep % 3]; const before = t.items.length; S.spawn(t, sp); const f = S.fliers[S.fliers.length - 1].f;
        const P = []; let counted = null, steps = 0; while (!f.done && steps < 4000) { S.flyAll(0.05); steps++; P.push(f.pos.clone()); if (!f.done && counted === null && t.items.length > before) counted = steps; }
        // into the trap's frame
        const loc = P.map(q => new THREE.Vector3(q.x - t.x, q.y - t.y, q.z - t.z).applyAxisAngle(new THREE.Vector3(0, 1, 0), -yaw));
        let maxStep = 0; for (let i = 1; i < P.length; i++) maxStep = Math.max(maxStep, P[i].distanceTo(P[i - 1]));
        const start = loc[0], end = loc[loc.length - 1], spots = Traps.rests(type), spot = spots[(0) % 9];
        // the crossing of the wall: the first sample inside the wall footprint
        const inside = q => type === 'std' ? Math.hypot(q.x, q.z) < 0.335 : type === 'str' ? Math.max(Math.abs(q.x), Math.abs(q.z)) < 0.425 : Math.hypot(q.x, q.z) < 0.55;
        const k = loc.findIndex(inside), cross = k >= 0 ? loc[k] : null;
        const gap = type === 'std' ? [0.36, 0.5] : type === 'str' ? [0.16, 0.58] : [0.0, 0.2];
        const ang = cross ? Math.atan2(cross.x, cross.z) : null;
        let through = cross && cross.y > gap[0] && cross.y < gap[1];
        if (type === 'imp' && cross) through = through && Math.abs(ang) < 0.62;          // the doorway is centred on +z
        out.push({ type, rep, steps, startDist: +Math.hypot(start.x, start.z).toFixed(1), startH: +(P[0].y - w.groundAt(P[0].x, P[0].z)).toFixed(2), maxStep: +maxStep.toFixed(3), crossY: cross ? +cross.y.toFixed(2) : null, through: !!through, endDist: +end.distanceTo(new THREE.Vector3(spot.x, spot.y, spot.z)).toFixed(3), counted: counted, after: t.items.length - before, inflight: t.inflight, flierSecs: +(steps * 0.05).toFixed(1) });
        S.drop(t);
      }
    });
    return out;
  });
  for (const type of ['std', 'str', 'imp']) {
    const R = res.filter(o => o.type === type);
    T(`${type}: every butterfly starts 4+ m away, in the air, and flies for several seconds`, R.every(o => o.startDist > 4 && o.startH > 0.9 && o.flierSecs > 3), R.map(o => [o.startDist, o.startH, o.flierSecs]));
    T(`${type}: the flight is continuous (no jumps, at most 0.15 m per 50 ms, i.e. under 3 m/s)`, R.every(o => o.maxStep < 0.15), R.map(o => o.maxStep));
    T(`${type}: it enters only through the entrance of the trap`, R.every(o => o.through), R.map(o => [o.crossY, o.through]));
    T(`${type}: it settles at its resting spot inside`, R.every(o => o.endDist < 0.12), R.map(o => o.endDist));
    T(`${type}: it is counted in the trap only after it has landed (not on the way)`, R.every(o => o.after === 1 && o.counted === null && o.inflight === 0), R.map(o => [o.counted, o.steps, o.after]));
  }
  // in the world: the roll creates a flier (nothing appears in the trap at once)
  const roll = await pg.evaluate(() => { const p = F0W.play, S = p.traps, w = p.world, x = -4, z = -8; const t = S.mk({ tid: 'ROLL', owner: 0, name: 'Вы', type: 'std', x, y: w.groundAt(x, z), z, yaw: 0, age: 0, fl: 'lavender', hn: 'heather' }, true);
    let first = null, steps = 0; while (steps < 6000 && t.items.length === 0) { S.update(0.1); steps++; if (first === null && S.fliers.length) first = { atStep: steps, items: t.items.length, fl: S.fliers.length }; } return { first, items: t.items.length, steps }; });
  T('a catch first appears as a flier on its way, and only later as a butterfly in the trap', roll.first && roll.first.items === 0 && roll.first.fl >= 1 && roll.items === 1 && roll.steps > roll.first.atStep + 20, roll);
  // a trap that breaks while a butterfly is on its way: it does not land
  const brk = await pg.evaluate(() => { const p = F0W.play, S = p.traps, w = p.world, t = S.list.find(q => q.tid === 'ROLL'); const n0 = t.items.length; const b0 = Save.data.specimens.length; S.spawn(t, p.pool[0]); t.t = t.life + 1; S.update(0.1); for (let i = 0; i < 300; i++) S.update(0.1); return { n0, listed: S.list.includes(t), fl: S.fliers.length, credited: Save.data.specimens.length - b0 }; });
  T('when the trap breaks, butterflies on their way do not get in', !brk.listed && brk.fl === 0 && brk.credited === 0, brk);
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5) : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
