// English pictures of the busy screens (cabinet workbench, market windows): node i18n_shots2.js [ru]
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const lang = process.argv[2] || 'en';
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&lang=' + lang); await pg.waitForTimeout(2500);
  const SH = '/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/' + lang + '2_';
  await pg.evaluate(() => { Save.data.coins = 50000; SPECIES.forEach((s, i) => { if (i % 2 === 0 && !s.mystery) Save.data.caught[s.id] = { count: 1 + (i % 4), first: Date.now(), place: BIOMES[i % 12].id }; }); Save.data.maps = Object.fromEntries(BIOMES.map(b => [b.id, true])); F0W.fade = 0; F0W.fadeTarget = 0; });
  const go = async (js, wait = 3500) => { await pg.evaluate(js => { eval(js); F0W.fade = 0; F0W.fadeTarget = 0; }, js); await pg.waitForTimeout(wait); };
  const shot = async n => { await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; }); await pg.waitForTimeout(500); await pg.screenshot({ path: SH + n + '.png' }); };
  await go('F0W.toCabinet()'); for (const ov of ['bench', 'journal', 'wings']) { await go(`F0W.cab.open('${ov}')`, 900); await shot('cab_' + ov); await go("F0W.cab.close && F0W.cab.close()", 300); }
  await go('F0W.toMarket()'); for (const ov of ['talk', 'sell', 'shop', 'gear', 'goods', 'collect', 'code']) { await go(`try { F0W.cab.open('${ov}'); } catch (e) {}`, 900); await shot('market_' + ov); await go("F0W.cab.close && F0W.cab.close()", 300); }
  console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close();
})();
