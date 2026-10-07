// pause menu: Settings submenu, exit button, Esc closes the menu for good (even when the browser drops the fresh lock with the same Esc)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&biome=russia&seed=T1');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  const ev = (f, a) => pg.evaluate(f, a); await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; });
  const to = (x, y) => ev(([x, y]) => { const r = document.getElementById('ui').getBoundingClientRect(); return [r.left + x / SW * r.width, r.top + y / SH * r.height]; }, [x, y]);
  const click = async (x, y) => { const [cx, cy] = await to(x, y); await pg.mouse.click(cx, cy); await pg.waitForTimeout(300); };
  const st = () => ev(() => ({ ov: F0W.overlay, modal: F0W.modal, locked: F0W.locked, want: !!F0W.lockWant }));
  // fake pointer lock that the browser takes away again together with the Esc that closed the menu
  await ev(() => { window.__lockOn = false; HTMLCanvasElement.prototype.requestPointerLock = function () { setTimeout(() => { Object.defineProperty(document, 'pointerLockElement', { get: () => window.__lockOn ? document.getElementById('ui') : null, configurable: true }); window.__lockOn = true; document.dispatchEvent(new Event('pointerlockchange')); }, 20); }; document.exitPointerLock = () => { window.__lockOn = false; document.dispatchEvent(new Event('pointerlockchange')); }; });
  await ev(() => { document.getElementById('ui').requestPointerLock(); }); await pg.waitForTimeout(300);
  console.log('playing', await st());
  await ev(() => { window.__lockOn = false; document.dispatchEvent(new Event('pointerlockchange')); }); await pg.waitForTimeout(200);   // Esc while playing: browser drops the lock
  console.log('Esc #1 (lock dropped) ->', await st()); await pg.screenshot({ path: '/tmp/p_menu.png' });
  await pg.waitForTimeout(500);
  // Esc #2: closes the menu; the browser then drops the new lock a moment later
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(60); await ev(() => { window.__lockOn = false; document.dispatchEvent(new Event('pointerlockchange')); });
  await pg.waitForTimeout(1500); console.log('Esc #2 ->', await st());
  // settings submenu
  await ev(() => { F0W.unlock && 0; F0W.overlay = 'pause'; }); await pg.waitForTimeout(300);
  let b = await ev(() => { Screens.pause.layout(F0W.play); const x = Screens.pause.btns.find(b => b.id === 'settings'); return [x.x + 20, x.y + 8]; }); await click(...b);
  console.log('settings ->', await st()); await pg.screenshot({ path: '/tmp/p_settings.png' });
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300); console.log('Esc in settings ->', await st());
  b = await ev(() => { const x = Screens.pause.btns.find(b => b.id === 'title'); return [x.x + 20, x.y + 8]; }); await click(...b); for (let i=0;i<40 && (await ev(()=>F0W.screen))!=='title';i++) await pg.waitForTimeout(500);
  console.log('exit ->', await ev(() => ({ screen: F0W.screen, play: !!F0W.play })));
  await br.close();
})();
