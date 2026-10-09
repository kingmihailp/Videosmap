const path = require('path'); const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
  page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('file://' + path.resolve(__dirname, '../../Flora0world_Butterflies.html') + '#debug&nolock'); await page.waitForTimeout(1200);
  await page.evaluate(() => { (Save.data.maps = Save.data.maps || {}, BIOMES.forEach(b => { if (b.map) Save.data.maps[b.map] = true; }), F0W.start)('ocean', 'NIGHT2'); }); await page.waitForTimeout(2500);
  await page.evaluate(() => { F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; });
  const shot = async n => { await page.waitForTimeout(800); await page.screenshot({ path: '/tmp/oc2_' + n + '.png' }); };
  const stage = (names) => page.evaluate((names) => { const p = F0W.play; p.toasts = []; p.cards = []; p.hintT = 0; p.player.pos.set(0, p.world.heightAt(0, 0) + 1.65, 0); p.player.yaw = 0; p.player.pitch = -0.05; p.flickT = 0;
    names.forEach((k, i) => { const f = p.flies.find(f => f.kind === k); if (!f) return; f.state = 1; f.rs = { ph: 'rest', t: 99, rt: new THREE.Vector3(0, 0, -4) }; f.cool = 5; const x = (i - (names.length - 1) / 2) * 1.5; f.pos.set(x, p.world.heightAt(x, -4) + 1.5 + (i % 2) * 0.3, -4); f.tgt.copy(f.pos); f.vel.set(0, 0, 0); f.t = 99; f.mesh.visible = true; }); }, names);
  await stage(['screech', 'seek', 'grumble', 'glitch', 'halt']); await shot('a');
  await stage(['guiding', 'curious', 'modifier', 'jeff', 'figure']); await shot('b');
  await stage(['dread', 'eyes', 'timothy', 'ambush', 'rush']); await shot('c');
  await page.evaluate(() => { F0W.screen = 'map'; Screens.wmap.sel = 8; }); await shot('map');
  await page.evaluate(() => { F0W.screen = 'journal'; Screens.journal.tab = 8; Screens.journal.sel = 0; }); await shot('journal');
  await browser.close();
})();
