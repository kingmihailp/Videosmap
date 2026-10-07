// secret market shop -> map -> the bog on the world map, in the journal, and entering it; a player without the map neither sees nor enters it
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const ev = f => pg.evaluate(f); let ok = 0, bad = 0; const T = (n, c, x) => { if (c) ok++; else bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  T('no map: bog hidden', await ev(() => !Maps.has('bog') && !visibleBiomes().some(b => b.id === 'bog') && !Maps.allowed('bog')));
  T('journal/collection hides bog species', await ev(() => { const mine = SPECIES.filter(s => !s.mystery && Maps.allowed(s.biome)); return mine.length === SPECIES.filter(s => !s.mystery).length - BIOME_BY_ID.bog.species.length; }));
  await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('bog', 'X'); }); await pg.waitForTimeout(1500);
  T('start(bog) without the map is refused (back to the map)', await ev(() => F0W.screen !== 'play'), await ev(() => F0W.screen));
  // the shop
  await ev(() => { Save.data.coins = 100; F0W.toSecret(); }); for (let i = 0; i < 60; i++) { if (await ev(() => !!(F0W.cab && F0W.cab.seller))) break; await pg.waitForTimeout(300); }
  await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; F0W.cab.openShop(); });
  await ev(() => F0W.cab.buy(0)); T('too poor: refused', await ev(() => !Maps.has('bog') && Save.data.coins === 100));
  await ev(() => { Save.data.coins = 2000; F0W.cab.buy(0); }); T('bought for 1500', await ev(() => Maps.has('bog') && Save.data.coins === 500), await ev(() => Save.data.coins));
  await ev(() => F0W.cab.buy(0)); T('second purchase does nothing', await ev(() => Save.data.coins === 500));
  await pg.screenshot({ path: '/tmp/maps_shop.png' });
  T('bog visible now', await ev(() => visibleBiomes().some(b => b.id === 'bog') && Maps.allowed('bog')));
  T('saved', await ev(() => JSON.parse(localStorage.getItem(SAVE_KEY)).maps.bog === true));
  // world map
  await ev(() => { F0W.toMap(); }); await pg.waitForTimeout(1200); await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; });
  await pg.waitForTimeout(600); await pg.screenshot({ path: '/tmp/maps_map.png' });
  T('map pin selectable', await ev(() => { Screens.wmap.sel = visibleBiomes().findIndex(b => b.id === 'bog'); return Screens.wmap.sel >= 0; }));
  await pg.waitForTimeout(400); await pg.screenshot({ path: '/tmp/maps_map2.png' });
  // journal tab
  await ev(() => { Screens.journal.tab = visibleBiomes().findIndex(b => b.id === 'bog'); Screens.journal.sel = 0; F0W.screen = 'journal'; }); await pg.waitForTimeout(600); await pg.screenshot({ path: '/tmp/maps_journal.png' });
  await ev(() => { F0W.screen = 'map'; });
  await ev(() => { F0W.start('bog', 'X'); }); for (let i = 0; i < 80; i++) { if (await ev(() => F0W.screen === 'play')) break; await pg.waitForTimeout(400); }
  T('enters the bog with the map', await ev(() => F0W.screen === 'play' && F0W.play.biome.id === 'bog'));
  T('species of the bog spawn', await ev(() => F0W.play.flies.length > 5 && F0W.play.flies.every(f => f.sp.biome === 'bog')), await ev(() => F0W.play.flies.length));
  console.log('errors', errs); console.log(bad ? 'FAIL ' + bad : 'ALL PASS ' + ok); await br.close(); process.exit(bad ? 1 : 0);
})();
