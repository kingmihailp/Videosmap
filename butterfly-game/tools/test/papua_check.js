// New Guinea: Queen Alexandra's birdwing is paid exactly 1500 (aberration multiplies it), is much rarer than the rest, and the whole location can be bought and entered
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const ev = f => pg.evaluate(f); let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const r = await ev(() => {
    const sp = SPECIES_BY_ID.ornithoptera_alexandrae, mk = (id, q) => ({ uid: 1, sp: id, q, box: null, pose: null });
    const raw = Econ.price(mk(sp.id, null)), spread = Econ.price(mk(sp.id, 100)), spread0 = Econ.price(mk(sp.id, 10));
    const ab = Aberr.make(sp, 'ABCDE'), abp = Econ.price(mk(ab.id, null)), bulk = Econ.bulkOk(mk(sp.id, null)), bulkOther = Econ.bulkOk(mk('papilio_aegeus', null));
    // how often is it in the population of a visit, compared with an average species
    const pap = BIOME_BY_ID.papua; let inc = {}; const N = 4000; for (let i = 0; i < N; i++) { const pool = Play.pickPool(pap, new Rng('seed' + i), pap.poolSize, false); for (const s of pool) inc[s.id] = (inc[s.id] || 0) + 1; }
    const others = pap.species.filter(s => s.id !== sp.id), avg = others.reduce((a, s) => a + (inc[s.id] || 0), 0) / others.length / N, mine = (inc[sp.id] || 0) / N;
    const rar3 = others.filter(s => s.rar === 3), avg3 = rar3.reduce((a, s) => a + (inc[s.id] || 0), 0) / rar3.length / N;
    return { raw, spread, spread0, abp, bulk, bulkOther, mine: +mine.toFixed(3), avg: +avg.toFixed(3), avg3: +avg3.toFixed(3), n: pap.species.length, scarce: sp.scarce, mm: sp.mm };
  });
  T('raw specimen: exactly 1500 (not doubled like the others of the location)', r.raw === 1500, r.raw); T('spread specimen: 3 x raw at quality 100, less at 10', r.spread === 4500 && r.spread0 > 2300 && r.spread0 < 2500, [r.spread, r.spread0]);
  T('aberration: multiplier applies (about x6)', r.abp >= 1500 * 5.3 && r.abp <= 1500 * 6.7, r.abp); T('not taken by "sell all"', r.bulk === false && r.bulkOther === true);
  T('in a visit population far more rarely than the others', r.mine * 3 < r.avg3, r);
  // buy + enter
  await ev(() => { Save.data.coins = 6000; F0W.toSecret(); }); for (let i = 0; i < 60; i++) { if (await ev(() => !!(F0W.cab && F0W.cab.seller))) break; await pg.waitForTimeout(300); }
  await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; F0W.cab.openShop(); F0W.cab.buy(1); });
  T('bought the New Guinea map for 5000', await ev(() => Maps.has('papua') && !Maps.has('bog') && Save.data.coins === 1000), await ev(() => Save.data.coins));
  await ev(() => { F0W.cab.buy(1); }); T('no second purchase', await ev(() => Save.data.coins === 1000));
  await ev(() => { F0W.toMap(); }); await pg.waitForTimeout(800); await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; });
  T('pin on the map', await ev(() => visibleBiomes().some(b => b.id === 'papua')));
  await ev(() => { Screens.wmap.sel = visibleBiomes().findIndex(b => b.id === 'papua'); }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/papua_map.png' });
  await ev(() => { Screens.journal.tab = visibleBiomes().findIndex(b => b.id === 'papua'); Screens.journal.sel = 0; F0W.screen = 'journal'; }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/papua_journal.png' }); await ev(() => { F0W.screen = 'map'; });
  await ev(() => { F0W.start('papua', 'Q1'); }); for (let i = 0; i < 100; i++) { if (await ev(() => F0W.screen === 'play')) break; await pg.waitForTimeout(400); }
  T('enters New Guinea', await ev(() => F0W.screen === 'play' && F0W.play.biome.id === 'papua'));
  T('butterflies of the location', await ev(() => F0W.play.flies.length > 5 && F0W.play.flies.every(f => f.sp.biome === 'papua')), await ev(() => F0W.play.flies.length));
  console.log('errors', errs); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
