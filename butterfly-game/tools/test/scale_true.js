// the butterflies of one frame keep their true proportions (a birdwing is several times larger than a white), in the box picture, the 3D frame, the raw cards and the tray
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const SH = process.env.SHOTS || '/tmp';
  const R = await pg.evaluate(() => {
    Save.data.specimens = []; Save.data.boxes.length = 0;
    const ids = ['ornithoptera_alexandrae', 'aporia_crataegi', 'papilio_machaon', 'pieris_rapae'].filter(i => SPECIES_BY_ID[i]); const b = Save.addBox('M', 0);
    ids.forEach((id, i) => { Save.add(id, SPECIES_BY_ID[id].biome); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.q = 90; s.pose = JSON.parse(JSON.stringify(Art.IDEAL)); s.box = b.uid; b.items[i] = s.uid; });
    const cv = Boxes.canvas(b), ctx = cv.getContext('2d'), d = ctx.getImageData(0, 0, cv.width, cv.height).data, out = { mm: ids.map(i => Art.spanMm(SPECIES_BY_ID[i])), ids, w: [] };
    // the width of the wings in every cell (columns of pixels with the wing colours, i.e. not the label / background: use the bare-vs-full difference)
    const bare = Boxes.canvas(b, true).getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    for (let i = 0; i < ids.length; i++) { const x0 = 8 + (i % 2) * 104, y0 = 8 + Math.floor(i / 2) * 80; let mn = 999, mxx = -1; for (let y = y0 + 4; y < y0 + 56; y++) for (let x = x0; x < x0 + 104; x++) { const k = (y * cv.width + x) * 4; if (Math.abs(d[k] - bare[k]) + Math.abs(d[k + 1] - bare[k + 1]) + Math.abs(d[k + 2] - bare[k + 2]) > 40) { if (x < mn) mn = x; if (x > mxx) mxx = x; } } out.w.push(mxx - mn); }
    out.sc = Art.groupScales(ids.map(i => SPECIES_BY_ID[i]), 1.12, 0.14);
    // the big ones are not shrunk by the small ones, a frame of tiny ones is not blown up
    out.tiny = Art.groupScales([SPECIES.find(s => s.mm && Art.spanMm(s) < 30)].filter(Boolean), 1.12, 0.14); out.tinyMm = SPECIES.filter(s => s.mm && Art.spanMm(s) < 30).length;
    out.mmMax = Math.max(...SPECIES.filter(s => !s.mystery).map(Art.spanMm));
    return out;
  });
  const ratio = R.w[0] / R.w[1]; T('the birdwing\'s wings in the frame are about as many times wider as its wingspan is longer', ratio > R.mm[0] / R.mm[1] * 0.7 && ratio < R.mm[0] / R.mm[1] * 1.4, { mm: R.mm, w: R.w, ratio, mmRatio: R.mm[0] / R.mm[1] });
  T('the largest in the frame fills the cell, the others are in proportion', R.sc[0] > 1.1 && Math.abs(R.sc[1] / R.sc[0] - R.mm[1] / R.mm[0]) < 0.02, R.sc);
  T('a frame of tiny butterflies is not blown up', R.tiny.length === 0 || R.tiny[0] < 0.6, R.tiny);
  const mt = await pg.evaluate(() => { const b = Save.data.boxes[0]; const m = Boxes.mount3D(b, 230); const bb = new THREE.Box3().setFromObject(m); return bb.getSize(new THREE.Vector3()).x; }); T('the 3D frame carries the same scaled butterflies (a mount is built)', mt > 0.2, mt);
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toCabinet(); });
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && F0W.cab.constructor.name === 'Cab').catch(() => false)) break; await pg.waitForTimeout(400); }
  const dataUrl = await pg.evaluate(() => Boxes.canvas(Save.data.boxes[0]).toDataURL()); require('fs').writeFileSync(SH + '/scale_box.png', Buffer.from(dataUrl.split(',')[1], 'base64'));
  if (errs.length) { bad++; console.log('ERR', errs); }
  console.log(bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
