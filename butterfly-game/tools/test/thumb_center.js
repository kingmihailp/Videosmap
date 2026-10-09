// the trap pictures in the shop windows are centred (the opaque pixels' bounding box is centred in the frame)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0;
  const res = await pg.evaluate(() => {
    const out = [];
    for (const id of Object.keys(Traps.TYPES)) for (const t of [0, 0.7, 1.6, 2.5, 4]) {
      const g = Traps.model(id, {}), cv = document.createElement('canvas'); cv.width = 100; cv.height = 150; const c = cv.getContext('2d');
      Traps.UI.preview(c, { group: g }, t, 0, 0, 100, 150);
      const d = c.getImageData(0, 0, 100, 150).data; let x0 = 999, x1 = -1, y0 = 999, y1 = -1;
      for (let y = 0; y < 150; y++) for (let x = 0; x < 100; x++) if (d[(y * 100 + x) * 4 + 3] > 20) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
      out.push({ id, t, cx: (x0 + x1) / 2 - 50, cy: (y0 + y1) / 2 - 75, w: x1 - x0, h: y1 - y0 });
    }
    return out;
  });
  for (const r of res) { const ok = Math.abs(r.cx) <= 16 && Math.abs(r.cy) <= 6 && r.h > 20; if (!ok) bad++; console.log(ok ? 'PASS' : 'FAIL', JSON.stringify(r)); }
  if (errs.length) { bad++; console.log('ERR', errs); }
  console.log(bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
