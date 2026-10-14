// main menu: butterflies scatter away from the cursor and drift back afterwards
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.screen = 'title'; }); await pg.waitForTimeout(800);
  const res = await pg.evaluate(async () => {
    const c = document.createElement('canvas'); c.width = 480; c.height = 270; const ctx = c.getContext('2d'), F = Screens.flyers(), f = F[0]; let t = 10; const pos = () => ({ x: (f.x + t * f.v) % (480 + 120) - 60 + (f.ox || 0), y: f.y + Math.sin(t * 0.9 + f.ph) * f.a + (f.oy || 0) });
    const m = { x: 0, y: 0 }; let max = 0, start = pos();
    for (let i = 0; i < 60; i++) { t += 0.03; const p = pos(); m.x = p.x - 12; m.y = p.y; Screens.title.draw(ctx, t, m); max = Math.max(max, Math.hypot(f.ox, f.oy)); }
    m.x = -999; m.y = -999; for (let i = 0; i < 400; i++) { t += 0.03; Screens.title.draw(ctx, t, m); }
    return { max, back: Math.hypot(f.ox, f.oy) };
  });
  const maxOff = res.max, back = res.back;
  T('butterflies get pushed away from the cursor', maxOff > 15, maxOff); T('and drift back when it leaves', back < maxOff * 0.3, back);
  T('no errors', errs.length === 0, errs.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
