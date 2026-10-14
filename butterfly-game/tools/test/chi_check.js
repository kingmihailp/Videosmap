// the Chihuahuan Desert: the 15000-coin map in the secret market, the Sonoran marble (raw price 2600, rare like the other reds, not in "sell all"), the sound of the storm
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const ev = (f, a) => pg.evaluate(f, a); let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const r = await ev(() => {
    const sp = SPECIES.find(s => s.la === 'Euchloe guaymasensis'), mk = (id, q) => ({ uid: 1, sp: id, q, box: null, pose: null }), b = BIOME_BY_ID.chihuahua;
    const raw = Econ.price(mk(sp.id, null)), spread0 = Econ.price(mk(sp.id, 10)), spread = Econ.price(mk(sp.id, 100)), ab = Aberr.make(sp, 'ABCDE'), abp = Econ.price(mk(ab.id, null));
    const bulk = Econ.bulkOk(mk(sp.id, null)), bulkOther = Econ.bulkOk(mk(b.species.find(s => s.rar === 1).id, null));
    let inc = {}; const N = 4000; for (let i = 0; i < N; i++) { const pool = Play.pickPool(b, new Rng('seed' + i), b.poolSize, false); for (const s of pool) inc[s.id] = (inc[s.id] || 0) + 1; }
    const red = b.species.filter(s => s.rar === 3), others = red.filter(s => s.id !== sp.id), avgOther = others.reduce((a, s) => a + (inc[s.id] || 0), 0) / others.length / N, mine = (inc[sp.id] || 0) / N;
    const commons = b.species.filter(s => s.rar === 1); const avg1 = commons.reduce((a, s) => a + (inc[s.id] || 0), 0) / commons.length / N;
    return { raw, spread0, spread, abp, bulk, bulkOther, red: red.length, name: sp.ru, rar: sp.rar, scarce: sp.scarce, mine: +mine.toFixed(3), avgOther: +avgOther.toFixed(3), avg1: +avg1.toFixed(3), n: b.species.length, poolSize: b.poolSize, price: Maps.LIST.find(m => m.id === 'chihuahua').price, rare: Rare.is(sp), rareIds: Rare.ids.size, id: sp.id, trapMarble: (() => { let n = 0; const N = 40000; for (let i = 0; i < N; i++) if (Traps.pick(b.species, 'heather', 'drv', 'synth').id === sp.id) n++; return n / N; })(), trapOther: (() => { let n = 0; const N = 40000, o = BIOME_BY_ID.vietnam; for (let i = 0; i < N; i++) if (Traps.pick(o.species, 'heather', 'drv', 'synth').id === 'teinopalpus_aureus') n++; return n / N; })() };
  });
  console.log(JSON.stringify(r));
  T('Sonoran marble: raw exactly 2600', r.raw === 2600, r.raw); T('spread: 3 x raw at quality 100', r.spread === 7800, r.spread); T('aberration multiplies (~x6)', r.abp >= 2600 * 5.3 && r.abp <= 2600 * 6.7, r.abp);
  T('not taken by "sell all"', r.bulk === false && r.bulkOther === true); T('four red butterflies in the biome', r.red === 4, r.red); T('the marble is a rare one (red frame)', r.rare === true && r.rar === 3 && r.rareIds === 4, [r.name, r.id]);
  T('as scarce as the other reds (scarce 0.05: seldom in a visit, no respawn)', r.scarce === 0.05 && r.mine < 0.03 && r.mine < r.avg1 / 8, [r.scarce, r.mine, r.avg1]);
  T('in traps as rare as the other reds (a drive trap with honey and synthetic flowers: well under 0.1% of the visitors)', r.trapMarble < 0.001 && r.trapMarble < r.trapOther * 5 + 0.0005, [r.trapMarble, r.trapOther]);
  T('the map costs 15000', r.price === 15000, r.price);
  // buy + enter
  await ev(() => { Save.data.coins = 15200; F0W.toSecret(); }); for (let i = 0; i < 60; i++) { if (await ev(() => !!(F0W.cab && F0W.cab.seller))) break; await pg.waitForTimeout(300); }
  const idx = await ev(() => Maps.LIST.findIndex(m => m.id === 'chihuahua'));
  await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; F0W.cab.openShop(); }); await ev(() => { Save.data.coins = 14999; }); await ev(([i]) => F0W.cab.buy(i), [idx]);
  T('14999 is not enough', await ev(() => !Maps.has('chihuahua') && Save.data.coins === 14999));
  T('only three maps show at once, the 4th is reached by scrolling', await ev(() => { const c = F0W.cab; const a = c.shopRows().map(r => r.i); c.shopScroll(1); const b = c.shopRows().map(r => r.i); return a.join() === '0,1,2' && b.join() === '1,2,3' && c.shopArrows().length === 2; }));
  await pg.waitForTimeout(300); await pg.screenshot({ path: '/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/chi_shop.png' });
  T('wheel and the arrow keys scroll too', await ev(() => { const c = F0W.cab; c.wheel(-100); const a = c.shop.scroll; c.wheel(100); c.key({ code: 'ArrowUp' }); c.key({ code: 'ArrowUp' }); c.key({ code: 'ArrowUp' }); return a === 0 && c.shop.sel === 0 && c.shop.scroll === 0; }));
  await ev(() => { F0W.cab.shopScroll(1); F0W.cab.shop.sel = 3; });
  await ev(() => { Save.data.coins = 15200; }); await ev(([i]) => F0W.cab.buy(i), [idx]); T('bought for 15000', await ev(() => Maps.has('chihuahua') && Save.data.coins === 200), await ev(() => Save.data.coins));
  await pg.waitForTimeout(300); await pg.screenshot({ path: '/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/chi_shop.png' });
  await ev(() => { F0W.toMap(); }); await pg.waitForTimeout(800); await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; });
  T('pin on the map', await ev(() => visibleBiomes().some(b => b.id === 'chihuahua')));
  await ev(() => { Screens.wmap.sel = visibleBiomes().findIndex(b => b.id === 'chihuahua'); }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/chi_map.png' });
  await ev(() => { Screens.journal.tab = visibleBiomes().findIndex(b => b.id === 'chihuahua'); Screens.journal.sel = 0; F0W.screen = 'journal'; }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/chi_journal.png' }); await ev(() => { F0W.screen = 'map'; });
  // sound: the storm layers start and fade without errors, the insects go quiet
  await pg.keyboard.press('KeyA'); await ev(() => { Snd.startAmbient('chihuahua'); }); await pg.waitForTimeout(400);
  const a = await ev(async () => { const out = []; for (const v of [0, 0.4, 1, 1, 0.5, 0]) { Snd.setStorm(v); await new Promise(r => setTimeout(r, 450)); out.push(Snd.ready); } Snd.sfx.sandsink(0.5); Snd.sfx.step('quick'); return out; });
  T('storm sound runs', a.every(Boolean), a);
  T('no errors', errs.length === 0, errs.slice(0, 3));
  console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
