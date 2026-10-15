// night: traps lure and keep moths of the location (not daytime butterflies), moths have aberrations (trap, net, journal, price)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&night'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  // pure picking
  const g = await pg.evaluate(() => { const b = BIOME_BY_ID.russia.nightB; let ab = 0, dayish = 0, n = 5000; for (let i = 0; i < n; i++) { const sp = Traps.pick(b, 'meadow', 'imp'); if (!sp.moth) dayish++; if (sp.ab) { ab++; if (!sp.moth) dayish++; } } return { ab: ab / n, dayish }; });
  T('pick on a night location: only moths; the imported trap gives ~1% aberrant moths', g.dayish === 0 && g.ab > 0.004 && g.ab < 0.02, g);
  await pg.evaluate(() => { Save.data.coins = 10000; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('russia', 'NTRAP1'); });
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; });
  const st = await pg.evaluate(() => ({ night: F0W.play.world.night, moths: F0W.play.biome.species.every(s => s.moth) }));
  T('the location is a night one with moths', st.night && st.moths, st);
  await pg.evaluate(() => { for (const [k, id] of [['tr', 'imp'], ['tr', 'imp'], ['fl', 'lavender'], ['fl', 'lavender'], ['hn', 'heather'], ['hn', 'heather']]) Traps.add(k, id, 1); });
  const r = await pg.evaluate(async () => {
    const p = F0W.play; p.traps.place('imp'); const t = p.traps.list[0]; if (!t) return { err: 'not placed' };
    p.traps.bait(t, 'lavender', 'heather'); t.life = 1e6;
    let guard = 0; while (t.items.length < 14 && guard++ < 20000) p.traps.update(0.25);
    const ids = t.items.slice(), bio = BIOME_BY_ID[p.biome.id].moths, mothIds = new Set(bio.map(s => s.id));
    const okAll = ids.every(id => { const sp = SPECIES_BY_ID[id]; return sp && sp.moth && mothIds.has(sp.base || id) });
    const abIds = ids.filter(id => /~/.test(id));
    return { n: ids.length, okAll, ab: abIds.length, fliersVisible: p.traps.fliers.length, sample: ids.slice(0, 3) };
  });
  T('the trap fills with moths of this location', r.n === 14 && r.okAll, r);
  const tk = await pg.evaluate(() => { const p = F0W.play, t = p.traps.list[0], ids = t.items.slice(); const n0 = Save.data.specimens.length; p.traps.take ? p.traps.take(t) : Traps.UI.take && Traps.UI.take(p, t); return { got: Save.data.specimens.length - n0, want: ids.length, has: ids.every(id => Save.has(SPECIES_BY_ID[id].base || id)), journal: Save.data.specimens.slice(-ids.length).every(s => s.biome === 'russia' || s.loc === 'russia' || true) }; });
  T('taking the catch records the moths in the collection', tk.want > 0 && tk.got === tk.want && tk.has, tk);
  const dv = await pg.evaluate(() => { const b = BIOME_BY_ID.russia.nightB; let ab = 0, mo = 0, n = 3000; for (let i = 0; i < n; i++) { const sp = Traps.pick(b, 'meadow', 'drv'); if (sp.ab) ab++; if (sp.moth) mo++; } return { ab: ab / n, mo: mo / n }; });
  T('the drive trap: ~40% aberrant moths, all of them moths', dv.ab > 0.3 && dv.ab < 0.5 && dv.mo === 1, dv);
  // aberrant moth everywhere
  const ab = await pg.evaluate(() => {
    const base = BIOME_BY_ID.russia.moths[3], a = Aberr.make(base, 'ABCDE'); const id = a.id;
    Save.add(id, 'russia'); const sp = SPECIES_BY_ID[id]; const spec = Save.data.specimens[Save.data.specimens.length - 1];
    const i = Econ.info(spec), j = Econ.info({ sp: base.id, w: spec.w, ts: spec.ts, q: spec.q, st: spec.st, sz: spec.sz });
    const out = { moth: !!(sp && sp.moth), listed: Save.aberrants(base.id).length > 0, price: i && i.price, basePrice: j && j.price, canvas: !!(a.art || a.look || true) };
    try { const c = document.createElement('canvas'); c.width = c.height = 64; const x = c.getContext('2d'); out.draw = typeof Art !== 'undefined' && !!Art.wingCanvas ? 'ok' : 'na'; } catch (e) { out.err = String(e); }
    return out;
  });
  T('an aberrant moth keeps the moth flag, is listed in the journal, and costs more than the normal one', ab.moth && ab.listed && ab.price > ab.basePrice, ab);
  const jr = await pg.evaluate(() => { const S = Screens.journal; S.moth = true; const b = S.list()[0]; const sp = BIOME_BY_ID.russia.moths[3]; const bi = S.list().findIndex(q => q.id === 'russia'); S.tab = bi; S.sel = b.species.findIndex(s => s.id === sp.id); S.ab = { base: sp.id, page: 0, tab: bi }; F0W.overlay = null; F0W.screen = 'journal'; return { sel: S.sel, n: Save.aberrants(sp.id).length }; });
  await pg.waitForTimeout(600); T('journal moth page with aberrant list draws without errors', jr.sel >= 0 && jr.n > 0 && errs.length === 0, [jr, errs]);
  await pg.screenshot({ path: '/tmp/night_ab.png' });
  console.log(bad ? 'FAILED ' + bad : 'ALL OK', errs.slice(0, 3)); await br.close(); process.exit(bad ? 1 : 0);
})();
