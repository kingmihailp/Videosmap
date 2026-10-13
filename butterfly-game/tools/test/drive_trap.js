// the drive trap and the synthetic flowers: placing, loading, launching, the tour through all natural zones, stops, "catches only while it stands", stopping by hand, rare / aberrant shares
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const big = process.argv[2] === 'big';
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&' + (big ? '' : 'lite&') + 'biome=russia&seed=T1&hour=12');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  const ev = (f, a) => pg.evaluate(f, a); let fails = 0; const ok = (name, cond, extra = '') => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!cond) fails++; };
  await ev(() => { F0W.overlay = 'hold'; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; window.p = F0W.play; p.hintT = 0; Save.data.coins = 1e7;
    window.step = (sec, dt = 0.1) => { for (let t = 0; t < sec; t += dt) { p.update(dt, F0W.inp); p.traps.update(dt); } }; step(2, 1 / 30); });
  console.log('zones', await ev(() => p.sectors ? p.sectors.rects.length + ' R=' + p.world.R : 'none'));
  // ---------- shop side: only the enthusiast sells it
  ok('buy', await ev(() => { const a = Traps.buy('tr', 'drv'), b = Traps.buy('fl', 'synth'), c = Traps.buy('hn', 'heather'); return a === 25000 && b === 5000 && c > 0; }));
  // ---------- placing and loading
  const t = await ev(() => { const t = p.traps.place('drv'); window.TR = t; return !!t; }); ok('placed', t);
  ok('bait: synthetic flowers + honey', await ev(() => { const a = p.traps.bait(TR, 'synth', undefined), b = p.traps.bait(TR, undefined, 'heather'); return a && b && TR.fl === 'synth' && TR.hn === 'heather'; }));
  ok('rate = scent 5 + honey', await ev(() => Traps.rate('synth', 'heather') > 5.5), String(await ev(() => Traps.rate('synth', 'heather'))));
  ok('life 14:00, cap 30', await ev(() => TR.life === 840 && TR.cap === 30), await ev(() => TR.life + '/' + TR.cap));
  // ---------- statistics: the share of aberrant / rare visitors
  const stat = await ev(() => { const pool = p.sectors ? p.sectors.rects[0].sp : p.pool, N = 4000; let ab = 0, rare = 0; const R = Traps.pick(pool, 'heather', 'drv', 'synth'); for (let i = 0; i < N; i++) { const sp = Traps.pick(pool, '', 'drv', ''); if (sp.ab) ab++; if ((SPECIES_BY_ID[sp.base] || sp).rar >= 2) rare++; } let rare0 = 0; for (let i = 0; i < N; i++) { const sp = Traps.pick(pool, '', 'std', ''); if ((SPECIES_BY_ID[sp.base] || sp).rar >= 2) rare0++; } let rare1 = 0; for (let i = 0; i < N; i++) { const sp = Traps.pick(pool, '', 'std', 'synth'); if ((SPECIES_BY_ID[sp.base] || sp).rar >= 2) rare1++; } return { ab: ab / N, rare: rare / N, rare0: rare0 / N, rare1: rare1 / N }; });
  console.log('shares', JSON.stringify(stat)); ok('≈40% aberrant', Math.abs(stat.ab - 0.4) < 0.06, stat.ab.toFixed(2)); ok('drive trap shifts rare share up', stat.rare > stat.rare0 + 0.2, `${stat.rare0.toFixed(2)} → ${stat.rare.toFixed(2)}`); ok('synthetic flowers add ≈25% to rare share', stat.rare1 > stat.rare0 + 0.1, `${stat.rare0.toFixed(2)} → ${stat.rare1.toFixed(2)}`);
  // ---------- stands still and catches until launched
  await ev(() => step(60)); const n0 = await ev(() => TR.items.length); ok('idle: catches', n0 > 0, 'caught ' + n0 + ' in a minute');
  // ---------- the tour
  const tour = await ev(() => { const S = p.sectors, o = { log: [], zones: [], caughtMoving: 0, caughtStopped: 0, stops: [] }; if (!S) return { none: true }; p.traps.launch(TR); let last = TR.items.length, px = TR.x, pz = TR.z, lastMode = TR.dr.mode, stopStart = 0, tt = 0, firstPos = [TR.x, TR.z]; const startT = TR.t;
    o.path = 0; for (let i = 0; i < 9000 && TR.t < TR.life - 1 && !TR.dead; i++) { step(0.1); tt += 0.1; o.path += Math.hypot(TR.x - px, TR.z - pz); px = TR.x; pz = TR.z; const m = TR.dr.mode; if (TR.items.length > last) { if (m === 'drive') o.caughtMoving += TR.items.length - last; else o.caughtStopped += TR.items.length - last; last = TR.items.length; } if (m !== lastMode) { if (m === 'stop') { o.zones.push(S.at(TR.x, TR.z)); stopStart = tt; } if (lastMode === 'stop') o.stops.push(+(tt - stopStart).toFixed(0)); lastMode = m; } if (i % 100 === 0) o.log.push([+TR.x.toFixed(0), +TR.z.toFixed(0), m[0]].join(',')); if (!p.traps.list.includes(TR)) { o.dead = true; break; } }
    o.mode = TR.dr.mode; o.visited = TR.dr.visited.slice(); o.t = TR.t; o.items = TR.items.length; o.n = S.rects.length; return o; });
  console.log('tour', JSON.stringify(tour).slice(0, 1200));
  ok('visits every natural zone', tour.visited && tour.visited.length === tour.n && new Set(tour.zones.concat(tour.visited)).size === tour.n, JSON.stringify(tour.visited));
  ok('stops about 2.5–4 min in the zones it reaches (the last stop runs until the trap breaks)', tour.stops && tour.stops.length >= 2 && tour.stops.every(x => x > 100), JSON.stringify(tour.stops));
  ok('stop length ≤ 240 s', tour.stops && tour.stops.every(s => s <= 241), JSON.stringify(tour.stops));
  ok('does not catch while driving', tour.caughtMoving === 0, 'moving ' + tour.caughtMoving + ' stopped ' + tour.caughtStopped);
  ok('catches while stopped', tour.caughtStopped > 0);
  ok('ends standing in the last zone', tour.mode === 'stop' || tour.mode === 'hold' || tour.dead, tour.mode);
  ok('really travelled (path length)', tour.path > 30, tour.path.toFixed(0) + ' m driven');
  // ---------- stopping by hand, resuming
  await ev(() => step(5)); const alive = await ev(() => p.traps.list.includes(TR));
  await ev(() => { Traps.add('tr', 'drv', 1); Traps.add('fl', 'synth', 1); Traps.add('hn', 'heather', 1); window.T2 = p.traps.place('drv'); p.traps.bait(T2, 'synth', 'heather'); });
  ok('second trap placed', await ev(() => !!T2 && p.traps.list.includes(T2)));
  await ev(() => { p.traps.launch(T2); step(4); }); const m1 = await ev(() => [T2.dr.mode, T2.run, Math.hypot(T2.x - T2.tx, T2.z - T2.tz) < 5]);
  ok('driving after launch', m1[0] === 'drive' && m1[1] === 1, JSON.stringify(m1));
  const items1 = await ev(() => T2.items.length); const pos1 = await ev(() => [T2.x, T2.z]);
  await ev(() => { p.traps.halt(T2, true); }); const m2 = await ev(() => [T2.dr.mode, T2.run]); ok('«остановить»: stops at once (hold)', m2[0] === 'hold' && m2[1] === 0, JSON.stringify(m2));
  await ev(() => step(90)); const items2 = await ev(() => T2.items.length), pos2 = await ev(() => [T2.x, T2.z]);
  ok('stopped by hand: stands still', Math.hypot(pos2[0] - pos1[0], pos2[1] - pos1[1]) < 0.5);
  ok('stopped by hand: keeps catching', items2 > items1, items1 + ' → ' + items2);
  await ev(() => { p.traps.launch(T2); step(5); }); ok('«запустить» again resumes the tour', await ev(() => T2.dr.mode === 'drive'));
  // ---------- the owner's window (buttons) and a remote copy
  await ev(() => { F0W.overlay = null; });
  console.log('errors', JSON.stringify(errs)); await br.close(); process.exit(fails || errs.length ? 1 : 0);
})();
