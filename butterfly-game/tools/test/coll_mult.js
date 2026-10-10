// the patterns of a collection multiply its price: only aberrations x1.7, only rare x1.9, one species x1.2, one family x1.5, one location x1.4, one colour x1.2, only different butterflies x1.5; the bench has the spread table's filters
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const SH = process.env.SHOTS || '/tmp';
  const R = await pg.evaluate(() => {
    Save.data.specimens = []; Save.data.boxes = []; Save.data.boxStock = { S: 0, M: 9, L: 9 };
    const mk = (size, sps) => { const b = Save.addBox(size, 0); sps.forEach((sp, i) => { Save.add(sp.id, sp.biome); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.q = 80; s.box = b.uid; b.items[i] = s.uid; }); return Collection.info(b); };
    const out = {}, pool = SPECIES.filter(s => !s.mystery && !s.ab && s.biome !== 'ocean' && !(s.id || '').includes('#'));
    const brief = i => ({ ids: i.themes.map(t => t.id), coefs: Object.fromEntries(i.themes.map(t => [t.id, t.coef])), mult: i.mult, base: i.baseSum, total: i.total, minQ: i.minQ, exp: Math.round(i.baseSum * i.mult * i.minQ / 100) });
    // only aberrations (different species)
    const el = pool.filter(s => Aberr.eligible(s)), abs = []; const seen = new Set(); for (const s of el) { if (abs.length >= 4) break; if (seen.has(s.fam)) continue; seen.add(s.fam); try { abs.push(Aberr.make(s, 'ABCDE')); } catch (e) {} }
    out.ab = brief(mk('M', abs));
    // only rare
    const rares = SPECIES.filter(s => !s.mystery && Rare.is(s)); out.nRare = rares.length; out.rare = brief(mk('M', rares.slice(0, 4)));
    // one species, one family (different species of different locations), one location, one colour
    const s0 = pool[0]; out.species = brief(mk('M', [s0, s0, s0, s0]));
    const fams = {}; pool.forEach(s => { const k = s.fam; (fams[k] = fams[k] || []).push(s); }); const famL = Object.values(fams).map(l => { const m = {}; l.forEach(s => { if (!m[s.biome]) m[s.biome] = s; }); return Object.values(m); }).sort((a, b) => b.length - a.length)[0].slice(0, 4);
    out.family = brief(mk('M', famL)); out.famN = famL.length;
    const bio = Wings.START[0].species.filter(s => !s.ab).slice(0, 4); out.biome = brief(mk('M', bio));
    const cols = {}; pool.forEach(s => { const c = Collection.colourOf(s); if (!c) return; const m = (cols[c] = cols[c] || {}); const k = s.fam + s.biome; if (!m[k]) m[k] = s; }); const colL = Object.values(cols).map(m => Object.values(m)).sort((a, b) => b.length - a.length)[0].slice(0, 4); out.colour = brief(mk('M', colL));
    // different species from different families/locations/colours: only «different»
    const dif = []; const ff = new Set(), bb = new Set(), cc = new Set(); for (const s of pool) { const c = Collection.colourOf(s); if (ff.has(s.fam) || bb.has(s.biome) || cc.has(c)) continue; ff.add(s.fam); bb.add(s.biome); cc.add(c); dif.push(s); if (dif.length === 4) break; } out.diff = brief(mk('M', dif)); out.difN = dif.length;
    // two kinds alternating: nothing; an incomplete frame (2 of 4): nothing
    out.alt = brief(mk('M', [dif[0], dif[1], dif[0], dif[1]])); out.two = brief(mk('M', [dif[0], dif[1]]));
    // a large one: aberrants of one species-set paid all at once
    return out;
  });
  T('only aberrations ×1.7 (+ different ×1.5)', R.ab.coefs.aberr === 1.7 && R.ab.coefs.distinct === 1.5 && R.ab.total === R.ab.exp, R.ab);
  T('only rare ×1.9', R.nRare >= 3 && R.rare.coefs.rarity === 1.9 && R.rare.total === R.rare.exp, [R.nRare, R.rare]);
  T('one species ×1.2 (and not «different»)', R.species.coefs.species === 1.2 && !R.species.ids.includes('distinct') && R.species.total === R.species.exp, R.species);
  T('one family ×1.5', R.famN >= 3 && R.family.coefs.family === 1.5 && R.family.total === R.family.exp, [R.famN, R.family]);
  T('one location ×1.4', R.biome.coefs.biome === 1.4 && R.biome.total === R.biome.exp, R.biome);
  T('one colour ×1.2', R.colour.coefs.colour === 1.2 && R.colour.total === R.colour.exp, R.colour);
  T('only different butterflies ×1.5 and nothing else', R.difN === 4 && R.diff.ids.join() === 'distinct' && R.diff.coefs.distinct === 1.5 && R.diff.total === R.diff.exp && R.diff.total > R.diff.base * 1.1 && R.diff.minQ === 80, R.diff);
  T('the same two kinds alternating, or a half-empty frame: no patterns, price = (frame + butterflies) × accuracy', R.alt.ids.length === 0 && R.alt.mult === 1 && R.two.ids.length === 0 && R.two.total === Math.round(R.two.base * 0.8), [R.alt, R.two]);
  // the coefficients multiply together
  const M = await pg.evaluate(() => { const el = SPECIES.filter(s => !s.mystery && !s.ab && s.biome !== 'ocean' && Aberr.eligible(s)); const sp = el[0], b = Save.addBox('M', 0); for (let i = 0; i < 4; i++) { const ab = Aberr.make(sp, 'ABCDE'); Save.add(ab.id, sp.biome); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.q = 80; s.box = b.uid; b.items[i] = s.uid; } const r = Collection.info(b); return { ids: r.themes.map(t => t.id), mult: r.mult, prod: r.themes.reduce((a, t) => a * t.coef, 1), total: r.total, exp: Math.round(r.baseSum * r.mult * r.minQ / 100) }; });
  T('four aberrations of one species: aberration × species × family × location × colour multiply', ['aberr', 'species', 'family', 'biome', 'colour'].every(x => M.ids.includes(x)) && Math.abs(M.mult - 1.7 * 1.2 * 1.5 * 1.4 * 1.2) < 1e-9 && M.total === M.exp, M);
  // the minimum accuracy: the worst butterfly (in %) multiplies the whole price at the very end
  const Q = await pg.evaluate(() => {
    const pool = SPECIES.filter(s => !s.mystery && !s.ab && s.biome !== 'ocean'), b = Save.addBox('M', 0), qs = [100, 100, 40, 100];
    qs.forEach((q, i) => { const sp = pool[i * 5]; Save.add(sp.id, sp.biome); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.q = q; s.box = b.uid; b.items[i] = s.uid; });
    const i1 = Collection.info(b); const before = { minQ: i1.minQ, total: i1.total, mult: i1.mult, baseSum: i1.baseSum, pre: i1.pre };
    const s0 = Save.spec(b.items[2]); s0.q = 100; const i2 = Collection.info(b); const s3 = Save.spec(b.items[0]); s3.q = 0; const i3 = Collection.info(b);
    return { before, hundred: { minQ: i2.minQ, total: i2.total, pre: i2.pre }, zero: { minQ: i3.minQ, total: i3.total } };
  });
  T('the worst butterfly (40%) multiplies the final price: total = round(base × patterns × 0.40)', Q.before.minQ === 40 && Q.before.total === Math.round(Q.before.baseSum * Q.before.mult * 0.4) && Q.before.total < Q.before.pre, Q.before);
  T('all at 100% → the price is not reduced; a 0% butterfly → nothing', Q.hundred.minQ === 100 && Q.hundred.total === Q.hundred.pre && Q.zero.minQ === 0 && Q.zero.total === 0, Q);
  // the workbench filters
  await pg.evaluate(() => { Save.data.specimens = []; Save.data.boxes = []; Save.data.boxStock = { S: 3, M: 3, L: 3 };
    const picks = SPECIES.filter(s => !s.mystery && !s.ab && s.biome !== 'ocean').slice(0, 40); picks.forEach((sp, i) => { Save.add(sp.id, sp.biome); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.q = 60 + (i % 40); s.pose = {}; s.date = Date.now() - (i % 4) * 4 * 864e5; });
    F0W.fade = 0; F0W.fadeTarget = 0; F0W.toCabinet(); });
  for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && !!F0W.cab.open).catch(() => false)) break; await pg.waitForTimeout(400); }
  await pg.evaluate(() => { const r = F0W.cab; r.ov = null; r.open('bench'); Boxes.bench.tab = 'boxes'; Boxes.bench.click(10, 33); }); await pg.waitForTimeout(400);
  const F = await pg.evaluate(() => { const B = Boxes.bench; B.layout(); return { n: B.fbtns.length, labels: B.fbtns.map(b => b.label), all: B.nfree, ids: B.fbtns.map(b => b.fid) }; });
  T('five filters like at the spreading table (rarity, location, aberration, date, family)', F.n === 5 && ['rar', 'loc', 'ab', 'date', 'fam'].join() === F.ids.join(), F);
  const cyc = async fid => pg.evaluate(fid => { const B = Boxes.bench; B.layout(); const b = B.fbtns.find(b => b.fid === fid); F0W.cab.click(b.x + 2, b.y + 2); B.layout(); return { n: B.nfree, all: B.allFree.length, label: B.fbtns.find(b => b.fid === fid).label }; }, fid);
  const a1 = await cyc('date'); const a2 = await cyc('date'); T('the date filter narrows the list and cycles', a1.n < a1.all && a1.n > 0, [a1, a2]);
  await pg.screenshot({ path: SH + '/bench_filters.png' });
  await pg.evaluate(() => { const B = Boxes.bench; B.f = { rar: 0, loc: 0, ab: 0, date: 0, fam: 0 }; });
  const loc = await cyc('loc'); const fam = await cyc('fam'); T('location + family filters combine', loc.n < loc.all && fam.n <= loc.n, [loc, fam]);
  const au = await pg.evaluate(() => { const B = Boxes.bench; B.layout(); const cb = B.cur(); const before = cb.items.filter(Boolean).length; const free = B.free.map(s => s.uid); const b = B.btns.find(b => b.id === 'auto'); F0W.cab.click(b.x + 2, b.y + 2); const put = cb.items.filter(Boolean); return { before, put: put.length, onlyFiltered: put.every(u => free.includes(u)), cap: cb.items.length, nfree: free.length }; });
  T('«Авто» puts only the butterflies that pass the filters', au.put === Math.min(au.cap, au.nfree) && au.onlyFiltered, au);
  const sr = await pg.evaluate(() => { const B = Boxes.bench; B.f = { rar: 0, loc: 0, ab: 0, date: 0, fam: 0 }; B.layout(); const r = B.srows[0]; const n0 = B.cur().items.filter(Boolean).length; F0W.cab.click(r.x + 3, r.y + 3); return B.cur().items.filter(Boolean).length - n0; });
  T('clicking a row puts that butterfly into the box', sr === 1 || sr === 0, sr);
  if (errs.length) { bad++; console.log('ERR', errs); }
  console.log(bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
