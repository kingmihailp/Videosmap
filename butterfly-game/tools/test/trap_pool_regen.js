// traps lure only the butterflies of this very landscape (the 9-10 species of the current pool, all of this location); a regenerated landscape takes the traps away with their catch
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const enter = async (b, sd) => { await pg.evaluate(([b, sd]) => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.start(b, sd); }, [b, sd]); for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); } await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; }); };
  for (const biome of ['russia', 'japan']) {
    await enter(biome, 'POOL-' + biome);
    const r = await pg.evaluate(() => {
      const p = F0W.play, S = p.traps, w = p.world, ids = new Set(p.pool.map(s => s.id)), inBiome = new Set(p.biome.species.map(s => s.id)), o = { pool: p.pool.length, outside: p.biome.species.length - p.pool.length };
      o.poolOk = p.pool.every(s => inBiome.has(s.id));
      const seen = new Set(); let bad1 = 0, bad2 = 0; for (const hn of ['', 'meadow', 'heather', 'pheromone']) for (let i = 0; i < 8000; i++) { const sp = Traps.pick(p.pool, hn, 'imp'); const base = SPECIES_BY_ID[sp.base] || sp; seen.add(base.id); if (!ids.has(base.id)) bad1++; if (!inBiome.has(base.id)) bad2++; }
      o.seen = seen.size; o.notInPool = bad1; o.notInBiome = bad2;
      // a real trap with a real catch: every butterfly in it belongs to the pool
      Traps.add('tr', 'str', 1); p.player.yaw = 0.4; const t = S.place('str'); t.fl = 'lavender'; t.hn = 'meadow'; t.life = 99999; for (let i = 0; i < 4000 && t.items.length < 16; i++) S.update(0.25);
      o.caught = t.items.length; o.caughtOutside = t.items.filter(id => !ids.has((SPECIES_BY_ID[id].base) || id)).length; o.caughtSpecies = new Set(t.items.map(id => SPECIES_BY_ID[id].base || id)).size;
      window.__ids = [...ids]; return o;
    });
    T(`${biome}: the landscape has a pool of 9 or 10 species, all of this location`, (r.pool === 9 || r.pool === 10) && r.poolOk && r.outside > 0, [r.pool, r.outside]);
    T(`${biome}: 32000 rolls never give a butterfly outside the pool or the location; every pool species can come`, r.notInPool === 0 && r.notInBiome === 0 && r.seen >= r.pool - 1, [r.seen, r.notInPool, r.notInBiome]);
    T(`${biome}: the butterflies that really fly into a trap are all from the pool`, r.caught >= 12 && r.caughtOutside === 0 && r.caughtSpecies >= 2 && r.caughtSpecies <= r.pool, [r.caught, r.caughtOutside, r.caughtSpecies]);
  }
  // regeneration: the same place again (the pause menu's «new landscape»): the traps and their catch are gone, nothing credited
  await enter('russia', 'REG-A');
  const before = await pg.evaluate(() => { const p = F0W.play, S = p.traps; Traps.add('tr', 'std', 1); const t = S.place('std'); t.fl = 'lavender'; t.hn = 'heather'; t.life = 99999; for (let i = 0; i < 4000 && t.items.length < 3; i++) S.update(0.25); window.__spec = Save.data.specimens.length; window.__seed = p.seed; return { items: t.items.length, traps: S.list.length, seed: p.seed }; });
  T('before: a trap with a catch stands', before.items >= 3 && before.traps === 1, before);
  await pg.evaluate(() => { const bid = F0W.play.biome.id; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start(bid); });
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play' && F0W.play.seed !== window.__seed)).catch(() => false)) break; await pg.waitForTimeout(500); }
  const after = await pg.evaluate(() => { const p = F0W.play; return { newSeed: p.seed !== window.__seed, traps: p.traps.list.length, credited: Save.data.specimens.length - window.__spec, colliders: p.world.colliders.filter(c => c.trap).length, toast: (p.toasts || []).map(x => x.text || x.s || x).join('|') }; });
  T('after regeneration: new landscape, no traps, no butterflies credited', after.newSeed && after.traps === 0 && after.credited === 0 && after.colliders === 0, after);
  T('the player is told', /пропали вместе с уловом/.test(after.toast), after.toast);
  // leaving the location without taking the catch does not keep it
  const lv = await pg.evaluate(() => { const p = F0W.play, S = p.traps; Traps.add('tr', 'std', 1); const t = S.place('std'); t.fl = 'lavender'; t.life = 99999; for (let i = 0; i < 4000 && t.items.length < 2; i++) S.update(0.25); window.__spec2 = Save.data.specimens.length; window.__n2 = t.items.length; const n = t.items.length; F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMap(); return n; });
  await pg.waitForTimeout(800); const lv2 = await pg.evaluate(() => Save.data.specimens.length - window.__spec2); T('leaving the location without taking the butterflies out loses them (nothing credited)', lv > 0 && lv2 === 0, [lv, lv2]);
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5) : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
