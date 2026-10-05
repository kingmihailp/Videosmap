const path = require('path');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const SP = process.env.OUT || '.';
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
  const errs = []; page.on('pageerror', e => errs.push(e.message)); page.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await page.goto('file://' + path.resolve('Flora0world_Butterflies.html#nolock'));
  const st = async (label) => { const s = await page.evaluate(() => ({ screen: F0W.screen, overlay: F0W.overlay, sel: Screens ? 0 : 0 })); console.log(label, JSON.stringify(s)); };
  const click = async (nx, ny) => { await page.mouse.move(nx * 3, ny * 3); await page.waitForTimeout(80); await page.mouse.down(); await page.mouse.up(); await page.waitForTimeout(700); };
  await page.waitForTimeout(1200); await st('start');
  await click(240, 160); await st('after Play');            // title: Играть
  await page.screenshot({ path: SP + '/e2e_map.png' });
  // pin 4 (Amazon)
  const pin = await page.evaluate(() => { const b = BIOMES[3]; const x = 40 + (b.lon + 180) / 360 * MAP_W * 2, y = 30 + (MAP_LAT_TOP - b.lat) / (MAP_LAT_TOP - MAP_LAT_BOT) * MAP_H * 2; return [x, y - 6]; });
  await click(pin[0], pin[1]); await page.screenshot({ path: SP + '/e2e_map_sel.png' });
  await st('pin selected');
  await click(435, 209); await page.waitForTimeout(2200); await st('after go');
  await page.screenshot({ path: SP + '/e2e_help.png' });
  await page.keyboard.press('KeyE'); await page.waitForTimeout(500); await st('after key (help closes -> pause/resume)');
  await page.evaluate(() => { F0W.overlay = null; F0W.locked = true; }); await page.waitForTimeout(500);
  await page.keyboard.press('Tab'); await page.waitForTimeout(300); await st('tab -> journal');
  await page.screenshot({ path: SP + '/e2e_journal_play.png' });
  await page.keyboard.press('Escape'); await page.waitForTimeout(300); await st('esc');
  await page.screenshot({ path: SP + '/e2e_pause.png' });
  console.log('errors:', JSON.stringify(errs));
  await browser.close();
})();
