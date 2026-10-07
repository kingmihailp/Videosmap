// phone mode: the crouch button slows the player down, even with the stick pushed to the edge (which also means "run")
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const ctx = await br.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true, deviceScaleFactor: 2 });
  const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('ERR', e.message)); const cdp = await ctx.newCDPSession(pg);
  const touch = async (type, pts) => cdp.send('Input.dispatchTouchEvent', { type, touchPoints: pts.map((p, i) => ({ x: p[0], y: p[1], id: p[2] === undefined ? i : p[2] })) });
  const ev = f => pg.evaluate(f);
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#touch&debug&biome=russia&seed=T1');
  for (let i = 0; i < 80; i++) { if (await ev(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; }); await pg.waitForTimeout(600);
  const speed = async push => { await touch('touchStart', [[120, 280, 1]]); await touch('touchMove', [[120, 280 - push, 1]]); await pg.waitForTimeout(1500); const v = await ev(() => { const P = F0W.play.player; return +Math.hypot(P.vel.x, P.vel.y).toFixed(2); }); const k = await ev(() => [...F0W.inp.keys].join(',')); await touch('touchEnd', []); await pg.waitForTimeout(500); return { v, k }; };
  const btn = await ev(() => { const b = [...document.querySelectorAll('#tc .b')].find(x => x.textContent === '⬇'); const r = b.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2, shown: getComputedStyle(b).display !== 'none' }; });
  console.log('crouch button', btn);
  const walk = await speed(35), run = await speed(90); console.log('walk', walk, 'run', run);
  await touch('touchStart', [[btn.x, btn.y, 5]]); await touch('touchEnd', []); await pg.waitForTimeout(400); console.log('after tap keys', await ev(() => [...F0W.inp.keys]), 'button lit', await ev(() => [...document.querySelectorAll('#tc .b')].find(x => x.textContent === '⬇').style.background));
  const cw = await speed(35), cr = await speed(90); console.log('crouch walk', cw, 'crouch + stick at the edge', cr);
  console.log(cw.v < walk.v * 0.6 && cr.v < 1.6 && run.v > 4 ? 'PASS crouch works' : 'FAIL');
  await br.close();
})();
