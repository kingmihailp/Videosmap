const path = require('path'); const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
  page.on('pageerror', e => console.log('[pageerror]', e.message, (e.stack || '').split('\n').slice(0, 4).join('|')));
  page.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') console.log('[console]', m.text().slice(0, 200)); });
  await page.goto('file://' + path.resolve(__dirname, '../../Flora0world_Butterflies.html') + '#debug&nolock'); await page.waitForTimeout(1200);
  await page.evaluate(() => { F0W.start('ocean', 'NIGHT1'); }); await page.waitForTimeout(2500);
  await page.evaluate(() => { F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; });
  // headless sim: 90 s of play with a wandering player
  const r = await page.evaluate(() => { const p = F0W.play, inp = { keys: new Set(), dx: 0, dy: 0, fire: false }; let nan = false; const kinds = {}; for (let i = 0; i < 90 * 20; i++) { inp.keys.clear(); inp.keys.add('KeyW'); inp.dx = Math.sin(i * 0.02) * 8; if (i % 40 === 0) inp.fire = true; p.update(1 / 20, inp); for (const f of p.flies) { if (!isFinite(f.pos.x + f.pos.y + f.pos.z)) nan = true; kinds[f.kind] = (kinds[f.kind] || 0) + 1; } } return { nan, flies: p.flies.length, caught: p.stats.catches, kinds, mod: p.mod && p.mod.id, pos: [p.player.pos.x, p.player.pos.z] }; });
  console.log(JSON.stringify(r));
  const shot = async n => { await page.waitForTimeout(700); await page.screenshot({ path: '/tmp/oc_' + n + '.png' }); };
  // stage: put a few specials in front of the camera
  await page.evaluate(() => { const p = F0W.play; p.player.pos.set(0, p.world.heightAt(0, 0) + 1.65, 0); p.player.yaw = 0; p.player.pitch = -0.1; const ks = ['screech', 'dread', 'seek', 'grumble', 'timothy', 'guiding', 'curious', 'modifier']; let i = 0; for (const f of p.flies) { const k = ks[i % ks.length]; if (f.kind !== ks[Math.min(i, ks.length - 1)]) {} } const want = {}; p.flies.forEach(f => { if (f.kind && !want[f.kind] && ks.includes(f.kind)) { want[f.kind] = f; } }); let x = -4; Object.values(want).forEach(f => { f.state = 0; f.rs = { ph: 'hide', t: 99 }; f.pos.set(x, p.world.heightAt(x, -5) + 1.4, -5 - (x % 3)); f.tgt.copy(f.pos); f.vel.set(0, 0, 0); x += 1.3; }); });
  await shot('flash_on');
  await page.evaluate(() => { F0W.play.toggleFlash(); }); await shot('flash_off');
  await browser.close();
})();
