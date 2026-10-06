const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1200, height: 800 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const ids = (process.argv[2] || 'iphiclides_podalirius,aglais_urticae').split(',');
  const r = await pg.evaluate((ids) => ids.map(id => { const sp = SPECIES_BY_ID[id]; return { id, art: JSON.stringify(sp.art).slice(0, 400), abs: Array.from({ length: 5 }, () => { const a = SPECIES_BY_ID[id + '~' + Aberr.randomCode()]; return JSON.stringify({ d: a.ab.desc, f: a.art.f, h: a.art.h, e: a.art.edge, sp: a.art.sp && a.art.sp.slice(0, 2) }); }) }; }), ids);
  console.log(JSON.stringify(r, null, 1)); await br.close();
})();
