// every ambience kind must start (with a real AudioContext) without throwing; cabinet must not create wind
const path = require('path'); const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const page = await browser.newPage(); const errs = []; page.on('pageerror', e => errs.push(e.message));
  await page.goto('file://' + path.resolve(__dirname, '../../Flora0world_Butterflies.html') + '#debug&nolock'); await page.waitForTimeout(1000);
  await page.keyboard.press('KeyA');
  for (const k of ['meadow', 'alpine', 'med', 'rainforest', 'rainforest2', 'savanna', 'prairie', 'forest', 'cabinet', 'ocean']) { await page.evaluate(k => Snd.startAmbient(k), k); await page.waitForTimeout(700); }
  for (const s of ['flash', 'thunder', 'glitch', 'reward', 'modifier', 'eyes']) await page.evaluate(s => Snd.sfx[s](), s);
  await page.evaluate(() => { Snd.sfx.grumble(3); Snd.sfx.rushWarn(true); });
  await page.waitForTimeout(500); console.log('errors', JSON.stringify(errs)); await browser.close();
})();
