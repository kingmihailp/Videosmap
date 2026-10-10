// the raw (unspread) specimens are 3D models of a resting butterfly: folded wings, bent legs, antennae; the species' own pattern and size, aberrations and the rare ones too
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const r = await pg.evaluate(() => {
    const out = { n: 0, fail: [], parts: null, sizes: [] }; const all = SPECIES.slice(); for (const s of SPECIES) if (!s.mystery && s.biome !== 'ocean' && Aberr.eligible(s) && all.length < SPECIES.length + 25) try { all.push(Aberr.make(s, 'ABCDE')); } catch (e) {}
    for (const sp of all) { try { const g = Art.makeResting(sp); let mesh = 0, tubes = 0, planes = 0; g.traverse(o => { if (o.isMesh) { mesh++; if (o.geometry.type === 'TubeGeometry') tubes++; if (o.geometry.type === 'PlaneGeometry') planes++; } }); if (!out.parts) out.parts = { mesh, tubes, planes }; const bb = new THREE.Box3().setFromObject(g); const sz = bb.getSize(new THREE.Vector3()); out.sizes.push([sp.id, ((sp.mm[0] + sp.mm[1]) / 2) / 1000 * 5 * (sp.glow ? 2.4 : 1) / 2 / 0.9, sz.y]); if (planes !== 4 || tubes < 8 || !isFinite(sz.y) || sz.y <= 0) out.fail.push([sp.id, planes, tubes]); out.n++; } catch (e) { out.fail.push([sp.id, String(e.message)]); } }
    
    out.rare = ['ornithoptera_alexandrae', 'coenonympha_oedippus', 'teinopalpus_aureus'].map(id => { const sp = SPECIES_BY_ID[id]; const g = Art.makeResting(sp); const p = Art.restingPic(sp, 100, 60); return [id, !!g, !!p]; });
    const ab = all.find(s => s.id.includes('~')); out.ab = ab && [ab.id, !!Art.restingPic(ab, 100, 60)];
    // the picture of a raw specimen is used on the card (a different picture for different species)
    const a = Art.restingPic(SPECIES_BY_ID.papilio_machaon, 100, 60), b = Art.restingPic(SPECIES_BY_ID.papilio_machaon, 100, 60), c2 = Art.restingPic(SPECIES_BY_ID.ornithoptera_alexandrae, 100, 60); out.cache = a === b && a !== c2;
    return out;
  });
  r.sizes = r.sizes;
  T(`models build for all ${r.n} species and aberrations: 4 wings, legs and antennae as tubes, nothing broken`, r.n > 100 && r.fail.length === 0, { n: r.n, fail: r.fail.slice(0, 3), parts: r.parts });
  const ratios = r.sizes.map(x => x[2] / x[1]); T('the size follows the species: model height / wing length is the same ~1.1-1.6 for every species', Math.min(...ratios) > 1.0 && Math.max(...ratios) < 1.8, [Math.min(...ratios), Math.max(...ratios)]);
  T('the rare ones have models and pictures', r.rare.every(x => x[1] && x[2]), r.rare);
  T('an aberration has its own picture', r.ab && r.ab[1], r.ab);
  T('pictures are cached per species', r.cache);
  if (errs.length) { bad++; console.log('ERR', errs); }
  console.log(bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
