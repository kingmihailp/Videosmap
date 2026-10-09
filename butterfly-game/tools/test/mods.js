const path = require('path'); const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } }); page.on('pageerror', e => console.log('[pageerror]', e.message, (e.stack||'').split('\n')[1]));
  await page.goto('file://' + path.resolve(__dirname, '../../Flora0world_Butterflies.html') + '#debug&nolock'); await page.waitForTimeout(1000);
  await page.evaluate(() => (Save.data.maps = Save.data.maps || {}, BIOMES.forEach(b => { if (b.map) Save.data.maps[b.map] = true; }), F0W.start)('ocean', 'MODS')); await page.waitForTimeout(2500);
  await page.evaluate(() => { F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; });
  const r = await page.evaluate(() => { const p = F0W.play, ids = Object.keys(PLAY_MODS); let good = 0, N = 2000; for (let i = 0; i < N; i++) if (PLAY_MODS[p.rollMod()].good) good++;
    const inp = { keys: new Set(['KeyW']), dx: 3, dy: 0, fire: false }; const errs = [];
    for (const id of ids) { p.applyMod(id); try { for (let i = 0; i < 20 * 12; i++) { inp.fire = i % 30 === 0; p.update(1 / 20, inp); } p.draw(document.createElement('canvas').getContext('2d')); } catch (e) { errs.push(id + ': ' + e.message); } for (const f of p.flies) if (!isFinite(f.pos.x + f.pos.z)) errs.push(id + ' NaN'); }
    return { mods: ids.length, goodShare: good / N, bad: ids.filter(k => !PLAY_MODS[k].good).length, goodN: ids.filter(k => PLAY_MODS[k].good).length, errs, helpers: p.flies.filter(f => f.beh.light).length }; });
  console.log(JSON.stringify(r)); await page.screenshot({ path: '/tmp/mods.png' }); await browser.close();
})();
