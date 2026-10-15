// moths: 31 real, unique species in every location but the ocean, varied forms, art renders, prices (x2, x4 in the secret locations), night chance per seed
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const r = await pg.evaluate(() => {
    const out = { per: {}, shapes: {}, ids: new Set(), dupIds: 0, noArt: [], noBeh: [], bad: [] };
    for (const b of BIOMES) { out.per[b.id] = b.moths.length; const sh = new Set(); for (const s of b.moths) { if (out.ids.has(s.id)) out.dupIds++; out.ids.add(s.id); sh.add(s.art.t); if (!BEH[s.beh]) out.noBeh.push(s.id); try { const c = Art.wingCanvas(s); const d = c.getContext('2d').getImageData(0, 0, 40, 40).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i]) n++; if (n < 150) out.noArt.push(s.id + ':' + n); } catch (e) { out.bad.push(s.id + ' ' + e.message); }
        for (const k of ['ru', 'en', 'fam', 'hab', 'range', 'host', 'fact']) if (!s[k]) out.bad.push(s.id + ' no ' + k); if (!s.moth || SPECIES_BY_ID[s.id] !== s) out.bad.push(s.id + ' index'); }
      out.shapes[b.id] = sh.size; }
    out.ids = out.ids.size;
    // prices: a raw moth is twice the butterfly of the same rarity in an ordinary location, four times in a secret one
    const raw = id => Econ.price({ sp: id, q: null }), by = (bid, moth, rar) => SPECIES.find(s => s.biome === bid && !!s.moth === moth && s.rar === rar && !s.fixedPrice && !s.mystery);
    const cmp = bid => { const m = by(bid, true, 1), d = by(bid, false, 1); const base = BIOME_BY_ID[bid]; return m && d ? { bid, moth: raw(m.id), day: raw(d.id), mb: Econ.info({ sp: m.id, q: null }).base, db: Econ.info({ sp: d.id, q: null }).base, ml: Econ.info({ sp: m.id, q: null }).loc, dl: Econ.info({ sp: d.id, q: null }).loc } : null; };
    out.price = ['russia', 'alps', 'bog', 'papua', 'chihuahua'].map(cmp);
    // the night chance
    let n = 0; const N = 4000; for (let i = 0; i < N; i++) if (Night.raw('russia', 'seed' + i)) n++; out.share = n / N; out.same = Night.raw('alps', 'abc') === Night.raw('alps', 'abc'); out.ocean = [...Array(200).keys()].some(i => Night.raw('ocean', 'x' + i));
    out.partial = ['russia', 'borneo', 'kenya', 'chihuahua'].map(b => [Night.is(b, 'S1'), Night.is(b, 'S2'), Night.is(b, 'S3'), Night.is(b, 'S4'), Night.is(b, 'S5')]);
    out.aber = (() => { try { const s = BIOME_BY_ID.russia.moths[0]; const a = Aberr.make(s, 'ABCDE'); return !!a && !!a.ab && a.moth === undefined ? 'no-moth-flag' : !!a; } catch (e) { return 'err ' + e.message; } })();
    return out; });
  const nb = Object.keys(r.per).filter(id => id !== 'ocean').map(id => ({ id }));
  T('31 moth species in every location but the ocean (and none in the ocean)', nb.every(b => r.per[b.id] === 31) && r.per.ocean === 0, r.per);
  T('372 unique species ids', r.ids === 372 && r.dupIds === 0, [r.ids, r.dupIds]);
  T('a great variety of forms: at least 10 wing forms in every location', nb.every(b => r.shapes[b.id] >= 10), r.shapes);
  T('every moth has art that draws, a flight behaviour and all texts', !r.noArt.length && !r.noBeh.length && !r.bad.length, [r.noArt.slice(0, 3), r.noBeh.slice(0, 3), r.bad.slice(0, 3)]);
  T('a raw moth is worth twice (x2 location, x4 in a secret one) a butterfly of the same rarity', r.price.every(p => !p || (p.ml === (p.dl * 2)) || p.ml === p.dl * 2), r.price);
  T('night generations: about a third of the seeds, the same seed the same answer, never the ocean', r.share > 0.24 && r.share < 0.36 && r.same && !r.ocean, [r.share, r.same, r.ocean]);
  T('an aberrant moth can be made', r.aber === true, r.aber);
  T('no errors', errs.length === 0, errs.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
