const path = require('path'); const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('file://' + path.resolve(__dirname, '../../Flora0world_Butterflies.html') + '#debug&nolock'); await page.waitForTimeout(1200);
  console.log(JSON.stringify(await page.evaluate(() => { const ids = new Set(); const dup = []; SPECIES.forEach(s => { if (ids.has(s.id)) dup.push(s.id); ids.add(s.id); }); return { n: SPECIES.length, dup, per: BIOMES.map(b => b.species.length), bad: SPECIES.filter(s => !s.fam || !s.mm || !BEH[s.beh] || !s.art || !s.hab).map(s => s.id) }; })));
  for (const biome of ['russia', 'alps', 'med', 'amazon', 'borneo', 'kenya', 'prairie', 'japan']) {
    await page.evaluate(b => { document.body.innerHTML = ''; const cv = document.createElement('canvas'); cv.id = 'sheet'; document.body.appendChild(cv); const sp = BIOME_BY_ID[b].species; cv.width = 8 * 200; cv.height = Math.ceil(sp.length / 8) * 110; const x = cv.getContext('2d'); x.fillStyle = '#d8c8a0'; x.fillRect(0, 0, cv.width, cv.height); x.imageSmoothingEnabled = false; sp.forEach((s, i) => { x.drawImage(Art.specimen(s), (i % 8) * 200 + 20, Math.floor(i / 8) * 110 + 4, 160, 80); x.fillStyle = '#000'; x.font = '12px sans-serif'; x.fillText(s.la, (i % 8) * 200 + 6, Math.floor(i / 8) * 110 + 98); }); }, biome);
    await (await page.$('#sheet')).screenshot({ path: '/tmp/sheet_' + biome + '.png' });
    await page.goto('file://' + path.resolve(__dirname, '../../Flora0world_Butterflies.html') + '#debug&nolock'); await page.waitForTimeout(800);
  }
  await browser.close();
})();
