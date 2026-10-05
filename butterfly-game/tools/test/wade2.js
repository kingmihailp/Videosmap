const path = require('path'); const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 960, height: 540 } }); page.on('pageerror', e => console.log('[pageerror]', e.message));
  await page.goto('file://' + path.resolve(__dirname, '../../Flora0world_Butterflies.html') + '#debug&nolock'); await page.waitForTimeout(1000);
  await page.evaluate(() => F0W.start('russia', 'WADE1')); await page.waitForTimeout(2500);
  const r = await page.evaluate(() => { F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; const p = F0W.play, w = p.world, P = p.player;
    // find a river/pond cell and a dry cell nearby
    let wp = null, dp = null; for (let x = -40; x < 40 && !wp; x += 1) for (let z = -40; z < 40; z += 1) if (w.inWater(x, z, 0) && w.inWater(x + 3, z, 0) && w.inWater(x + 6, z, 0) && w.inWater(x - 3, z, 0)) { wp = { x, z }; break; }
    for (let x = -30; x < 30 && !dp; x += 1) for (let z = -30; z < 30; z += 1) if (!w.inWater(x, z, 4) && !w.inWater(x + 6, z, 4) && Math.abs(x) < 25) { dp = { x, z }; break; }
    const walk = (pt) => { P.pos.set(pt.x, P.pos.y, pt.z); P.yaw = -Math.PI / 2; P.vel.set(0, 0); const inp = { keys: new Set(['KeyW']), dx: 0, dy: 0, fire: false }; for (let i = 0; i < 20; i++) p.update(1 / 20, inp); const a = [P.pos.x, P.pos.z]; for (let i = 0; i < 20; i++) p.update(1 / 20, inp); return Math.hypot(P.pos.x - a[0], P.pos.z - a[1]); };
    return { wp, dp, waterSpeed: wp ? +walk(wp).toFixed(2) : null, landSpeed: dp ? +walk(dp).toFixed(2) : null }; });
  console.log(JSON.stringify(r)); await browser.close();
})();
