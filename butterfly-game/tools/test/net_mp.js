const path = require('path'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3700 + Math.floor(Math.random() * 300), SRV = path.resolve(__dirname, '../../server');
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); await new Promise(r => setTimeout(r, 1500));
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const open = async (n) => { const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', n, e.message)); await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${n}&biome=russia`); for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(500); } await pg.evaluate(() => { F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; }); return pg; };
  const A = await open('Alice'), B = await open('Bob'); await B.waitForTimeout(1500);
  await A.evaluate(() => { const P = F0W.play.player; P.pos.set(0, P.pos.y, 0); P.yaw = 0; });
  // Bob stands to Alice's right-front, looking at her
  await B.evaluate(() => { const P = F0W.play.player; P.pos.set(2.6, P.pos.y, -1.8); P.yaw = 2.18; P.pitch = -0.05; F0W.play.hintT = 0; F0W.play.netGroup.visible = false; });
  await B.waitForTimeout(3500); console.log(await B.evaluate(() => JSON.stringify(Object.values(Net.remote).map(r => [Math.round(performance.now() - r.t), r.pos.x.toFixed(1), r.pos.z.toFixed(1)])))); await B.screenshot({ path: "/tmp/net_idle.png" });
  await B.evaluate(() => { const P = F0W.play.player; P.pos.set(-1.6, P.pos.y, -2.6); P.yaw = -0.55 + 0; }); await B.waitForTimeout(2500); await B.screenshot({ path: "/tmp/net_side.png" }); await B.evaluate(() => { const P = F0W.play.player; P.pos.set(2.6, P.pos.y, -1.8); P.yaw = 2.18; }); await A.evaluate(() => { F0W.play.swing(); }); await B.waitForTimeout(150); await B.screenshot({ path: '/tmp/net_swing.png' });
  await br.close(); srv.kill();
})();
