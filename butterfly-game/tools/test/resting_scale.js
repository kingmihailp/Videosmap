// the resting (raw) models keep the true size of their species: the birdwing is several times larger than a white, in the raw cards and on the tray
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const R = await pg.evaluate(() => {
    const ids = ['ornithoptera_alexandrae', 'papilio_machaon', 'aporia_crataegi', 'pieris_rapae'].filter(i => SPECIES_BY_ID[i]); const out = { ids, mm: ids.map(i => Art.spanMm(SPECIES_BY_ID[i])), share: ids.map(i => Art.sizeShare(SPECIES_BY_ID[i])), card: [], model: [] };
    // the card: draw every raw specimen on a card and measure the height of what is drawn
    for (const id of ids) { Save.data.specimens = []; Save.add(id, SPECIES_BY_ID[id].biome); const spec = Save.data.specimens[0], cv = document.createElement('canvas'); cv.width = 104; cv.height = 62; const x = cv.getContext('2d'); specCard(x, 0, 0, 104, 62, spec, false, false, 1); const d = x.getImageData(0, 0, 104, 40).data; let y0 = 99, y1 = -1; const bg = [d[(5 * 104 + 5) * 4], d[(5 * 104 + 5) * 4 + 1], d[(5 * 104 + 5) * 4 + 2]]; for (let y = 4; y < 40; y++) for (let xx = 4; xx < 100; xx++) { const k = (y * 104 + xx) * 4; if (Math.abs(d[k] - bg[0]) + Math.abs(d[k + 1] - bg[1]) + Math.abs(d[k + 2] - bg[2]) > 60) { if (y < y0) y0 = y; if (y > y1) y1 = y; } } out.card.push(y1 - y0 + 1); }
    for (const id of ids) { const sp = SPECIES_BY_ID[id], u = Math.max(0.03, Art.spanMm(sp) / 1000 * 5 / 2 / 0.9 * 0.25), g = Art.makeResting(sp, { u }); out.model.push(new THREE.Box3().setFromObject(g).getSize(new THREE.Vector3()).y); }
    return out;
  });
  T('the birdwing\'s card picture is several times higher than a white\'s', R.card[0] / R.card[2] > 2.5, R);
  T('the card heights follow the wingspan (birdwing > swallowtail > whites)', R.card[0] > R.card[1] && R.card[1] >= R.card[2], R.card);
  T('on the tray the models are in proportion to the wingspan', Math.abs(R.model[0] / R.model[2] - R.mm[0] / R.mm[2]) / (R.mm[0] / R.mm[2]) < 0.05, R.model);
  if (errs.length) { bad++; console.log('ERR', errs); }
  console.log(bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
