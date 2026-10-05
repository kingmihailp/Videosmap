const path = require('path'); const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1000, height: 340 } }); page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('file://' + path.resolve(__dirname, '../../Flora0world_Butterflies.html') + '#debug&nolock'); await page.waitForTimeout(1000);
  await page.evaluate(() => { document.body.innerHTML = ''; const cv = document.createElement('canvas'); cv.id = 'c'; cv.width = 960; cv.height = 300; document.body.appendChild(cv); const x = cv.getContext('2d'); x.fillStyle = '#10141c'; x.fillRect(0, 0, 960, 300); x.imageSmoothingEnabled = false; ['lux_ductrix', 'lux_curiosa', 'mutator_chromatis'].forEach((id, i) => x.drawImage(Art.specimen(SPECIES_BY_ID[id]), i * 320, 20, 320, 160)); ['lux_ductrix', 'lux_curiosa', 'mutator_chromatis'].forEach((id, i) => Art.drawPose(x, SPECIES_BY_ID[id], Art.IDEAL, i * 320 + 160, 250, 1)); });
  await (await page.$('#c')).screenshot({ path: '/tmp/glyph.png' }); await browser.close();
})();
