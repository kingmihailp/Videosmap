// touch controls: stick moves, right-side drag looks, tap swings, buttons work, menus clickable by tap
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(); pg.on('console', m => /TC/.test(m.text()) && console.log(m.text())); pg.on('pageerror', e => console.log('ERR', e.message));
  const cdp = await ctx.newCDPSession(pg);
  const touch = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: p[2] === undefined ? i : p[2] })) });
  const ev = f => pg.evaluate(f);
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#touch&debug&biome=russia&seed=T1');
  for (let i = 0; i < 80; i++) { if (await ev(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; });
  await pg.waitForTimeout(500);
  console.log('touch mode', await ev(() => ({ touch: F0W.touch, noLock: F0W.noLock, screen: F0W.screen, locked: F0W.locked })));
  const pos = () => ev(() => { const p = F0W.play.P || F0W.play.player || {}; return { x: +(p.pos ? p.pos.x : p.x).toFixed(2), z: +(p.pos ? p.pos.z : p.z).toFixed(2), yaw: +p.yaw.toFixed(2) }; });
  const p0 = await pos();
  await touch('touchStart', [[120, 280, 1]]); await touch('touchMove', [[120, 230, 1]]); await pg.waitForTimeout(700);
  console.log('keys while stick up', await ev(() => [...F0W.inp.keys]));
  await pg.screenshot({ path: '/tmp/t_play.png' });
  await touch('touchEnd', []); await pg.waitForTimeout(200);
  const p1 = await pos(); console.log('moved', p0, '->', p1, 'keys after', await ev(() => [...F0W.inp.keys]));
  await touch('touchStart', [[600, 200, 2]]); for (let i = 1; i <= 6; i++) await touch('touchMove', [[600 + i * 25, 200, 2]]); await touch('touchEnd', [[750, 200, 2]]); await pg.waitForTimeout(200);
  console.log('look', p1.yaw, '->', (await pos()).yaw);
  await ev(() => { window.__sw = 0; const o = F0W.play.swing; F0W.play.swing = function () { window.__sw++; return o.apply(this, arguments); }; });
  await ev(() => { window.__f = 0; const d = Object.getOwnPropertyDescriptor(F0W.inp, 'fire'); let v = false; Object.defineProperty(F0W.inp, 'fire', { get() { return v; }, set(x) { if (x) window.__f++; v = x; } }); }); await ev(() => { window.__l = []; ['touchstart','touchend','touchcancel','click','mousedown'].forEach(n => document.getElementById('ui').addEventListener(n, e => window.__l.push(n + ':' + (e.changedTouches ? e.changedTouches.length : 0)), true)); }); await pg.touchscreen.tap(600, 200); await pg.waitForTimeout(300); await pg.waitForTimeout(1500); console.log('fire sets', await ev(() => window.__f));
  console.log('tap swings', await ev(() => window.__sw));
  await pg.touchscreen.tap(790, 40); await pg.waitForTimeout(300);   // pause button
  console.log('pause button ->', await ev(() => F0W.overlay)); await pg.screenshot({ path: '/tmp/t_pause.png' });
  await pg.touchscreen.tap(422, 150); await pg.waitForTimeout(400);
  console.log('tap on menu ->', await ev(() => ({ ov: F0W.overlay, screen: F0W.screen })));
  await br.close();
})();
