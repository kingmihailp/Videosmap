// Esc must close the pause menu (a real pointer-lock re-request may be refused for a moment); simulate: lock error right after Esc
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&biome=russia'); for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; });
  // make every pointer-lock request fail with pointerlockerror for the first 1.2 s (like Chrome after Esc)
  await pg.evaluate(() => { window.__t0 = performance.now(); HTMLCanvasElement.prototype.requestPointerLock = function () { if (performance.now() - window.__t0 < 1200) setTimeout(() => document.dispatchEvent(new Event('pointerlockerror')), 5); else { Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: () => this }); setTimeout(() => document.dispatchEvent(new Event('pointerlockchange')), 5); } }; document.exitPointerLock = () => { Object.defineProperty(document, 'pointerLockElement', { configurable: true, get: () => null }); document.dispatchEvent(new Event('pointerlockchange')); }; F0W.overlay = 'pause'; });
  await pg.waitForTimeout(300); console.log('before', await pg.evaluate(() => F0W.overlay));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(500); console.log('0.5 s after Esc (lock refused)', await pg.evaluate(() => ({ ov: F0W.overlay, want: !!F0W.lockWant, locked: F0W.locked })));
  await pg.waitForTimeout(1800); console.log('2.3 s after Esc', await pg.evaluate(() => ({ ov: F0W.overlay, want: !!F0W.lockWant, locked: F0W.locked })));
  await br.close();
})();
