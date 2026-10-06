const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1000, height: 760 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  await pg.evaluate((ids) => { document.body.innerHTML = ''; document.body.style.background = '#2a2018'; const cv = document.createElement('canvas'); cv.width = 1000; cv.height = 760; document.body.appendChild(cv); const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
    ids.forEach((id, r) => { x.drawImage(Art.specimen(SPECIES_BY_ID[id]), 4, r * 62 + 4, 120, 60); for (let k = 0; k < 6; k++) x.drawImage(Art.specimen(SPECIES_BY_ID[id + '~' + Aberr.randomCode()]), 140 + k * 140, r * 62 + 4, 120, 60); }); }, (process.argv[2] || 'aglais_io,papilio_machaon,pieris_brassicae,polyommatus_icarus,vanessa_atalanta,pararge_aegeria,lycaena_hippothoe,parnassius_apollo,gonepteryx_rhamni,aglais_urticae,erebia_aethiops,iphiclides_podalirius').split(','));
  await pg.screenshot({ path: '/tmp/aberr_gal.png' }); await br.close();
})();
