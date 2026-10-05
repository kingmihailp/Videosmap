// usage: node shot.js <html> <out.png> [js-to-run-before-shot] [waitMs] [w] [h]
const path = require('path');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const [html, out, js, wait, w, h] = process.argv.slice(2);
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: +(w || 1440), height: +(h || 810) } });
  page.on('console', m => console.log('[console]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message, (e.stack||'').split('\n').slice(0,4).join(' | ')));
  await page.goto('file://' + path.resolve(html));
  await page.waitForTimeout(+(wait || 800));
  if (js) { const r = await page.evaluate(js); if (r !== undefined) console.log('[result]', JSON.stringify(r)); await page.waitForTimeout(+(wait || 800)); }
  await page.screenshot({ path: out });
  await browser.close();
})();
