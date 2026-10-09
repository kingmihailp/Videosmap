// the noise meter: plain walking = 3 bars; walking right after a run = 4 bars (for a few seconds), then back to 3; running = 7-8 bars; creeping = 1
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('prairie', 'NOISE1'); });
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  const r = await pg.evaluate(() => {
    F0W.overlay = null; const p = F0W.play, P = p.player, w = p.world; const bars = () => { const l = Math.min(1, Math.max(0, P.noise / 1.6)); let n = 0; for (let i = 0; i < 8; i++) if ((i + 0.5) / 8 <= l) n++; return n; };
    const run = (keys, secs) => { const inp = { dx: 0, dy: 0, fire: false, keys: new Set(keys) }; for (let i = 0; i < secs * 30; i++) { P.pos.set(Math.cos(i / 40) * 6, w.groundAt(0, 0) + 1.65, Math.sin(i / 40) * 6 + 0); p.update(1 / 30, inp); } return bars(); };
    const o = {}; o.stand = run([], 3); o.walk = run(['KeyW'], 3); o.sprint = run(['KeyW', 'ShiftLeft'], 3); o.afterRun1 = run(['KeyW'], 1); o.afterRun3 = run(['KeyW'], 2); o.later = run(['KeyW'], 8); o.creep = run(['KeyW', 'ControlLeft'], 3); return o; });
  T('standing still is quiet (1 bar at most)', r.stand <= 1, r.stand);
  T('plain walking: 3 bars', r.walk === 3, r.walk);
  T('running: 7-8 bars', r.sprint >= 7, r.sprint);
  T('walking right after a run: 4 bars', r.afterRun1 === 4 && r.afterRun3 === 4, [r.afterRun1, r.afterRun3]);
  T('a few seconds later walking is back to 3 bars', r.later === 3, r.later);
  T('creeping: 1 bar', r.creep === 1, r.creep);
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5) : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
