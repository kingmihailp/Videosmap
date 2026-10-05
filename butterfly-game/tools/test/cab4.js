// cabinet audio + plants smoke test
const path = require('path'); const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
  page.on('pageerror', e => console.log('[pageerror]', e.message, (e.stack || '').split('\n').slice(0, 3).join('|')));
  await page.goto('file://' + path.resolve(__dirname, '../../Flora0world_Butterflies.html') + '#debug&nolock&cabinet'); await page.waitForTimeout(1500);
  await page.keyboard.press('KeyA'); await page.waitForTimeout(500);
  console.log('audio', await page.evaluate(() => Snd.ready));
  await page.waitForTimeout(3000);
  const look = async (x, z, yaw, pitch, n) => { await page.evaluate(([x, z, yaw, pitch]) => { const P = F0W.cab.player; P.pos.x = x; P.pos.z = z; P.yaw = yaw; P.pitch = pitch; }, [x, z, yaw, pitch]); await page.waitForTimeout(900); await page.screenshot({ path: '/tmp/plant_' + n + '.png' }); };
  await look(-1.9, -0.8, 0.8, -0.25, 'ficus'); await look(1.9, -0.8, -0.8, -0.25, 'drac'); await look(-2.0, 0.8, 2.3, -0.25, 'ficus2');
  await browser.close();
})();
