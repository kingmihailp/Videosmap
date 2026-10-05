const path = require('path'); const fs = require('fs'); const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } }); page.on('pageerror', e => console.log('[pageerror]', e.message, (e.stack || '').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, '../../Flora0world_Butterflies.html') + '#debug&nolock&cabinet&hour=16.5'); await page.waitForTimeout(1500);
  await page.keyboard.press('KeyA'); await page.waitForTimeout(400);
  const look = async (n, x, z, yaw, pitch) => { await page.evaluate(([x, z, yaw, pitch]) => { const P = F0W.cab.player; P.pos.x = x; P.pos.z = z; P.yaw = yaw; P.pitch = pitch; F0W.cab.toastT = 0; }, [x, z, yaw, pitch]); await page.waitForTimeout(900); await page.screenshot({ path: '/tmp/c5_' + n + '.png' }); };
  await look('desk', -2.4, 0.4, Math.PI / 2, -0.55);
  await look('room16', 3.2, 0.9, Math.PI / 2 + 0.2, -0.1);
  await look('lectern', 2.3, -0.5, 0, -0.35);
  for (const h of [8, 19.5, 20.7]) { await page.evaluate(h => F0W.cab.setHour(h), h); await look('h' + h, 3.2, 0.9, Math.PI / 2 + 0.2, -0.1); }
  // lectern -> journal overlay
  await page.evaluate(() => { const P = F0W.cab.player; P.pos.set(2.3, 0, -1.5); P.yaw = 0; }); await page.waitForTimeout(400);
  console.log('prompt', await page.evaluate(() => F0W.cab.prompt && F0W.cab.prompt.id)); await page.keyboard.press('KeyE'); await page.waitForTimeout(500);
  console.log('ov', await page.evaluate(() => F0W.cab.ov)); await page.screenshot({ path: '/tmp/c5_journal.png' }); await page.keyboard.press('Escape'); await page.waitForTimeout(300); console.log('ov after', await page.evaluate(() => F0W.cab.ov));
  await browser.close();
})();
