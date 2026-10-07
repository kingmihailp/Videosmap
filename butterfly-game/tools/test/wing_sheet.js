// contact sheet of every species' wings (both halves): node wing_sheet.js [first] [count] -> /tmp/wings_<first>.png
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1400, height: 900 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const first = +(process.argv[2] || 0), count = +(process.argv[3] || 48), filt = process.argv[4] || '';
  const url = await pg.evaluate(([first, count, filt]) => {
    const list = SPECIES.filter(s => !filt || s.la.startsWith(filt) || s.biome === filt).slice(first, first + count), S = 3, cell = 40 * S * 2 + 6, cols = 8, rows = Math.ceil(list.length / cols);
    const cv = document.createElement('canvas'); cv.width = cols * (cell + 10); cv.height = rows * (40 * S + 26); const x = cv.getContext('2d'); x.fillStyle = '#d8d0b8'; x.fillRect(0, 0, cv.width, cv.height); x.imageSmoothingEnabled = false; x.font = '11px sans-serif';
    list.forEach((s, i) => { const w = Art.wingCanvas(s), cx = (i % cols) * (cell + 10) + cell / 2 + 5, y = Math.floor(i / cols) * (40 * S + 26) + 4;
      x.drawImage(w, cx, y, 40 * S, 40 * S); x.save(); x.translate(cx, 0); x.scale(-1, 1); x.drawImage(w, 0, y, 40 * S, 40 * S); x.restore(); x.fillStyle = '#000'; x.fillText(s.la.slice(0, 24), cx - 60, y + 40 * S + 12); });
    return cv.toDataURL('image/png'); }, [first, count, filt]);
  require('fs').writeFileSync(`/tmp/wings_${first}.png`, Buffer.from(url.split(',')[1], 'base64')); await br.close();
})();
