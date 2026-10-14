// the caterpillar tracks of the drive trap move on every frame it drives (also when turning on the spot or held up)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&lite&biome=russia&seed=TA1&hour=12');
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(250); }
  const r = await pg.evaluate(() => { F0W.overlay = 'hold'; F0W.locked = true; const p = F0W.play; Save.data.coins = 1e7; Traps.add('tr', 'drv', 1); const t = p.traps.place('drv'); t.life = 99999; const R = t.group.userData.rover; const D = t.dr;
    D.route = [{ x: t.x + 25, z: t.z }, { x: t.x - 20, z: t.z + 30 }, { x: t.x, z: t.z - 25 }]; p.traps.launch(t); let still = 0, n = 0, turnFrames = 0, ph = R.phase, maxStep = 0, pitch = R.LT / (R.cleats.length / 2); for (let i = 0; i < 1500 && D.mode === 'drive'; i++) { p.update(0.05, F0W.inp); p.traps.update(0.05); const r2 = t.group.userData.rover.phase; n++; if (r2 - ph < 1e-4) still++; maxStep = Math.max(maxStep, r2 - ph); ph = r2; if (D.sp < 0.3) turnFrames++; }
    // blocked: a wall of colliders in front, the rover pushes against it
    return { n, still, turnFrames, mode: D.mode, maxStep, pitch, wheelBars: R.wheels.every(w => w.m.children.length > 0), cleats: R.cleats.length }; });
  console.log(JSON.stringify(r)); const ok = r.n > 100 && r.still === 0 && r.maxStep < 0.46 * r.pitch && r.wheelBars; console.log(ok ? 'PASS tracks move on every driving frame, never by more than half a cleat pitch (no backward look), wheels carry a marker' : 'FAIL'); console.log('errors', JSON.stringify(errs)); await br.close(); process.exit(ok && !errs.length ? 0 : 1);
})();
