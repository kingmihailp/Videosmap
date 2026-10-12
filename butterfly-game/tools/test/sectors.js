// sectors: the layout (five rectangles that tile the map, never inside each other), the species per sector, the menu, the flies' home sectors, border crossings, sector traps, the 30-minute regeneration (alone)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const enter = async (b, sd) => { await pg.evaluate(([b, sd]) => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.start(b, sd); }, [b, sd]); for (let i = 0; i < 160; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); } await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; }); await pg.waitForTimeout(800); };

  // ---- 1. the layout and the species of every location over many seeds
  const lay = await pg.evaluate(() => {
    const out = { bad: [], sizes: {}, n: 0 };
    for (const b of BIOMES.filter(b => b.id !== 'ocean')) for (let k = 0; k < 40; k++) {
      const R = b.id === 'vietnam' ? 120 : 130, S = Sectors.make(b, 'SD' + k, R), q = S.rects; out.n++;
      let area = 0; for (const r of q) area += (r.x1 - r.x0) * (r.z1 - r.z0); if (Math.abs(area - 4 * R * R) > 1e-6) out.bad.push([b.id, k, 'area']);
      if (q.length !== 5) out.bad.push([b.id, k, 'count']);
      for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++) {          // no overlap (so nobody lies inside another), borders may only touch
        const a = q[i], c = q[j], ox = Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0), oz = Math.min(a.z1, c.z1) - Math.max(a.z0, c.z0);
        if (ox > 1e-9 && oz > 1e-9) out.bad.push([b.id, k, 'overlap', i, j]);
      }
      const touch = (a, c) => { const ox = Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0), oz = Math.min(a.z1, c.z1) - Math.max(a.z0, c.z0); return (Math.abs(a.x1 - c.x0) < 1e-9 || Math.abs(c.x1 - a.x0) < 1e-9) && oz > 1e-9 || (Math.abs(a.z1 - c.z0) < 1e-9 || Math.abs(c.z1 - a.z0) < 1e-9) && ox > 1e-9; };
      const seen = new Set([0]); for (let it = 0; it < 5; it++) for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) if (seen.has(i) && i !== j && touch(q[i], q[j])) seen.add(j); if (seen.size !== 5) out.bad.push([b.id, k, 'not adjoining']);
      for (const r of q) if (Math.min(r.x1 - r.x0, r.z1 - r.z0) < R * 0.2) out.bad.push([b.id, k, 'sliver']);
      const ids = q.flatMap(r => r.sp.map(s => s.id)); if (ids.length !== b.species.length || new Set(ids).size !== b.species.length || !b.species.every(s => ids.includes(s.id))) out.bad.push([b.id, k, 'species lost or doubled']);
      const sz = q.map(r => r.sp.length).sort(); const base = Math.floor(b.species.length / 5), rem = b.species.length - base * 5;
      if (sz.filter(v => v === base).length !== 5 - rem || sz.filter(v => v === base + 1).length !== rem) out.bad.push([b.id, k, 'distribution', sz]);
      out.sizes[b.id] = sz.join(',');
      for (const s of b.species) if (S.homeOf(s) === null || !q[S.homeOf(s)].sp.includes(s)) out.bad.push([b.id, k, 'home']);
      const cols = new Set(q.map(r => r.col)); if (cols.size !== 5) out.bad.push([b.id, k, 'colours']);
    }
    // the same seed gives the same layout, another seed a different one
    const b = BIOME_BY_ID.russia, A = JSON.stringify(Sectors.make(b, 'X1', 130).rects.map(r => [r.x0, r.z0, r.x1, r.z1, r.sp.map(s => s.id)])), B = JSON.stringify(Sectors.make(b, 'X1', 130).rects.map(r => [r.x0, r.z0, r.x1, r.z1, r.sp.map(s => s.id)])), C = JSON.stringify(Sectors.make(b, 'X2', 130).rects.map(r => [r.x0, r.z0, r.x1, r.z1, r.sp.map(s => s.id)]));
    out.same = A === B; out.diff = A !== C;
    const shapes = new Set(); for (let k = 0; k < 40; k++) shapes.add(Sectors.make(b, 'SH' + k, 130).rects.map(r => Math.round(r.x0) + ':' + Math.round(r.z0)).join()); out.shapes = shapes.size;
    return out;
  });
  T(`layouts valid for ${lay.n} (location × seed): they tile the map, never overlap or lie inside each other, adjoin tightly, no slivers, 31 species = 6+6+6+6+7`, lay.bad.length === 0, lay.bad.slice(0, 4));
  T('species per sector', true, lay.sizes);
  T('the layout is a function of the seed only; other seeds give other layouts', lay.same && lay.diff && lay.shapes > 20, [lay.same, lay.diff, lay.shapes]);

  // ---- 2. in the game: the whole fauna lives on the map, every species in its own sector; the menu
  await enter('russia', 'SEC-A');
  const g = await pg.evaluate(() => { const p = F0W.play, S = p.sectors; return { pool: p.pool.length, flies: p.flies.length, home: p.flies.filter(f => S.at(f.pos.x, f.pos.z) === f.home).length, bySpecies: new Set(p.flies.map(f => f.sp.base || f.sp.id)).size, w: p.world.R, ttl: Math.round(p.regenLeft()) }; });
  T('all 31 species are on the map at once (no pool of 9)', g.pool === 31 && g.bySpecies >= 28, g);
  T('at the start almost every butterfly is inside its own sector', g.home >= g.flies * 0.9, [g.home, g.flies]);
  T('the map is very large (R 184 instead of 58) and the landscape lives an hour', g.w === 184 && g.ttl > 3590 && g.ttl <= 3600, [g.w, g.ttl]);
  // the whole map walk: every sector can be walked into
  const walk = await pg.evaluate(() => { const p = F0W.play, S = p.sectors, got = new Set(), w = p.world; for (const q of S.rects) { const x = (q.x0 + q.x1) / 2, z = (q.z0 + q.z1) / 2; got.add(S.at(x, z)); } return { sectors: got.size, tall: S.rects.map(q => Math.round(w.heightAt((q.x0 + q.x1) / 2, (q.z0 + q.z1) / 2))) }; });
  T('every sector has a centre on the map', walk.sectors === 5, walk);
  // crossing borders: simulate 10 minutes of the flies
  const cross = await pg.evaluate(() => { const p = F0W.play, S = p.sectors; p.hasMod = () => false; let ever = new Set(), away = 0, tot = 0; for (const f of p.flies) f.mesh.visible = false;
    for (let step = 0; step < 4000; step++) { for (const f of p.flies) { if (f.kind) continue; f.update(0.15, 100 + step * 0.15); if (S.at(f.pos.x, f.pos.z) !== f.home) ever.add(f.id); } if (step % 40 === 0 && step > 1000) for (const f of p.flies) { if (f.kind) continue; tot++; if (S.at(f.pos.x, f.pos.z) !== f.home) away++; } }
    return { ever: ever.size, of: p.flies.filter(f => !f.kind).length, awayShare: +(away / tot).toFixed(2) }; });
  T('after 10 minutes some butterflies have flown into another sector, but most stay at home', cross.ever >= 3 && cross.awayShare < 0.45, cross);

  // the menu: M opens it, hover shows the sector, Esc/M closes; the species cells show "?"
  await pg.keyboard.press('KeyM'); await pg.waitForTimeout(300);
  const m1 = await pg.evaluate(() => ({ ov: F0W.overlay, cells: (Sectors.UI.layout(), Sectors.UI.cells.length) }));
  T('M opens the map and species menu with all 31 species', m1.ov === 'sectors' && m1.cells === 31, m1);
  const hv = await pg.evaluate(() => { const U = Sectors.UI, S = U.S, q = S.rects[2], x = (q.x0 + q.x1) / 2, z = (q.z0 + q.z1) / 2, [px, py] = U.mapPos(x, z); U.update({ x: px, y: py }); const h1 = U.hover; const c = U.cells.find(c => c.sec === 4); U.update({ x: c.x + 3, y: c.y + 3 }); return { h1, h2: U.hover, hs: !!U.hs, shown: U.cells.filter(c => c.sec === 2).length === S.rects[2].sp.length }; });
  T('hovering a sector on the map selects it; hovering a species selects its sector', hv.h1 === 2 && hv.h2 === 4 && hv.hs && hv.shown, hv);
  await pg.mouse.move(480, 270); await pg.waitForTimeout(300); await pg.screenshot({ path: '/tmp/sectors_menu.png' });
  await pg.keyboard.press('KeyM'); await pg.waitForTimeout(300); T('M closes it again', await pg.evaluate(() => F0W.overlay === null));
  await pg.keyboard.press('KeyP'); await pg.waitForTimeout(300);
  const pm = await pg.evaluate(() => { Screens.pause.layout(F0W.play); return { ov: F0W.overlay, ids: Screens.pause.btns.map(b => b.id) }; });
  T('the pause menu has no «new landscape» button, but has the map', pm.ov === 'pause' && !pm.ids.includes('regen') && pm.ids.includes('sectors'), pm.ids);
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(500);

  // ---- 3. traps catch the butterflies of the sector they stand in; on a border a random one of the two
  const tr = await pg.evaluate(() => {
    const p = F0W.play, S = p.sectors, Sys = p.traps, out = {}; const mk = (x, z) => ({ x, z, type: 'str', hn: 'meadow' });
    const draw = (t, n) => { const seen = {}; for (let i = 0; i < n; i++) { const sp = Traps.pick(Sys.visitors(t), t.hn, t.type), id = sp.base || sp.id; seen[id] = (seen[id] || 0) + 1; } return seen; };
    out.inside = []; for (const q of S.rects) { const t = mk((q.x0 + q.x1) / 2, (q.z0 + q.z1) / 2), seen = draw(t, 3000), here = S.at(t.x, t.z); out.inside.push([Object.keys(seen).every(id => q.sp.some(s => s.id === id)) && here === q.i, Object.keys(seen).length, q.sp.length]); }
    // a border: take a shared border point
    let a, nb, bx, bz, off;
    outer: for (const A of S.rects) for (const B of S.rects) { if (A === B) continue; const oz = Math.min(A.z1, B.z1) - Math.max(A.z0, B.z0), ox = Math.min(A.x1, B.x1) - Math.max(A.x0, B.x0);
      if (Math.abs(A.x1 - B.x0) < 1e-6 && oz > 10) { a = A; nb = B; bx = A.x1; bz = (Math.max(A.z0, B.z0) + Math.min(A.z1, B.z1)) / 2; off = mk(bx - 4, bz); break outer; }
      if (Math.abs(A.z1 - B.z0) < 1e-6 && ox > 10) { a = A; nb = B; bz = A.z1; bx = (Math.max(A.x0, B.x0) + Math.min(A.x1, B.x1)) / 2; off = mk(bx, bz - 4); break outer; } }
    const bt = mk(bx, bz), picks = { a: 0, b: 0, other: 0 }; for (let i = 0; i < 2000; i++) { const sp = Sys.visitors(bt); const k = sp === a.sp ? 'a' : sp === nb.sp ? 'b' : 'other'; picks[k]++; }
    out.border = picks; out.near = S.near(bx, bz, Sectors.EDGE).length; const seen = draw(bt, 6000), ids = Object.keys(seen); out.bothSectors = ids.some(id => a.sp.some(s => s.id === id)) && ids.some(id => nb.sp.some(s => s.id === id)); out.onlyTwo = ids.every(id => a.sp.some(s => s.id === id) || nb.sp.some(s => s.id === id));
    const pk = { n: 0, x: 0 }; for (let i = 0; i < 200; i++) { const v = Sys.visitors(off); pk[v === S.rects[S.at(off.x, off.z)].sp ? 'n' : 'x']++; } out.off = pk;
    return out; });
  T('a trap in the middle of a sector lures only the butterflies of that sector (all of them can come)', tr.inside.every(v => v[0] && v[1] >= v[2] - 2), tr.inside);
  T('a trap right on the border of two sectors picks one of the two at random (both about half), and only their butterflies come', tr.near === 2 && tr.border.a > 800 && tr.border.b > 800 && tr.border.other === 0 && tr.bothSectors && tr.onlyTwo, [tr.near, tr.border, tr.bothSectors, tr.onlyTwo]);
  T('4 metres from the border the sector is certain', tr.off.x === 0 && tr.off.n === 200, tr.off);
  // a real trap: place it, its catch comes from the sector
  const rt = await pg.evaluate(() => { const p = F0W.play, S = p.traps, sc = p.sectors; Traps.add('tr', 'str', 1); const t = S.place('str'); t.fl = 'lavender'; t.hn = 'meadow'; t.life = 99999; for (let i = 0; i < 6000 && t.items.length < 12; i++) S.update(0.25); const q = sc.rects[sc.at(t.x, t.z)], ids = t.items.map(id => (SPECIES_BY_ID[id].base) || id); return { items: t.items.length, ok: ids.every(id => sc.near(t.x, t.z, Sectors.EDGE).some(i => sc.rects[i].sp.some(s => s.id === id))), sector: q.i }; });
  T('a real trap fills up with butterflies of its own sector', rt.items >= 12 && rt.ok, rt);

  // ---- 4. regeneration alone: kept between visits for the period, then new; the menu button and the vote are gone
  const w1 = await pg.evaluate(() => { Save.data.worlds = {}; const a = Save.world('kenya'), b = Save.world('kenya'); Sectors.PERIOD = 1500; const c = Save.world('kenya'); return { same: a.seed === b.seed, c: c.seed === a.seed }; });
  await pg.waitForTimeout(1700); const w2 = await pg.evaluate(() => { const d = Save.world('kenya'); return { born: Date.now() - d.born < 500 }; });
  T('the same landscape is kept for the period (also between visits), then a new seed is born', w1.same && w1.c && w2.born, [w1, w2]);
  await pg.evaluate(() => { Sectors.PERIOD = 60 * 60 * 1000; delete Save.data.worlds; });
  await pg.evaluate(() => { Sectors.PERIOD = 40000; }); await enter('kenya'); const seed0 = await pg.evaluate(() => F0W.play.seed);
  const tp = await pg.evaluate(() => { const p = F0W.play; Traps.add('tr', 'std', 1); const t = p.traps.place('std'); t.fl = 'lavender'; t.hn = 'meadow'; t.life = 99999; for (let i = 0; i < 4000 && t.items.length < 2; i++) p.traps.update(0.25); window.__spec = Save.data.specimens.length; return { items: t.items.length, left: Math.round(p.regenLeft()) }; });
  T('alone: the timer runs from the birth of the landscape', tp.left <= 40 && tp.left >= 5 && tp.items >= 2, tp);
  let s1 = seed0; for (let i = 0; i < 160 && s1 === seed0; i++) { await pg.waitForTimeout(500); s1 = await pg.evaluate(() => F0W.play && F0W.screen === 'play' ? F0W.play.seed : null) || seed0; }
  await pg.waitForTimeout(2500);
  const af = await pg.evaluate(() => ({ seed: F0W.play && F0W.play.seed, spec: Save.data.specimens.length, traps: F0W.play && F0W.play.traps.list.length, left: F0W.play && Math.round(F0W.play.regenLeft()) }));
  T('when the time is up a new landscape is generated by itself; the traps vanish with their catch', af.seed && af.seed !== seed0 && af.spec === (await pg.evaluate(() => window.__spec)) && af.traps === 0 && af.left > 15, [seed0, af]);
  await pg.evaluate(() => { Sectors.PERIOD = 60 * 60 * 1000; });
  T('no page errors', errs.length === 0, errs.slice(0, 3));
  await br.close(); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})();
