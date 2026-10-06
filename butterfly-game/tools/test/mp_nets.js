const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 4100 + Math.floor(Math.random() * 40), SRV = path.resolve(__dirname, '../../server');
try { fs.rmSync(path.join(SRV, 'data'), { recursive: true, force: true }); } catch (e) {}
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const open = async name => { const pg = await browser.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('[pageerror ' + name + ']', e.message)); await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${name}&biome=russia&hour=12`); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(400); } await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; }); return pg; };
  const A = await open('Alice'), B = await open('Bob'); await A.waitForTimeout(800);
  await A.evaluate(() => { F0W.play.netCfg = { uid: 5, h: 'h_chrome', r: 'r_big', m: 'm_silk' }; }); await B.waitForTimeout(3500);
  const nt = await B.evaluate(() => Object.values(Net.remote).map(r => r.nt)); ok(nt[0] === 'h_chrome.r_big.m_silk', 'Bob receives Alice\'s net: ' + nt[0]);
  await B.evaluate(() => { const P = F0W.play.player, r = Object.values(Net.remote)[0]; P.pos.set(r.pos.x + 0.2, P.pos.y, r.pos.z + 2.6); P.yaw = 0; P.pitch = -0.05; F0W.play.netGroup.visible = false; });
  await B.waitForTimeout(1500); await B.screenshot({ path: '/tmp/mp_net_alice.png' });
  const built = await B.evaluate(() => { const a = F0W.play.remotes.av; return Object.values(a).map(v => v.nt); }); ok(built[0] === 'h_chrome.r_big.m_silk', 'the avatar was rebuilt with the new net');
  await A.evaluate(() => { F0W.play.netCfg = NetParts.BASIC; }); await B.waitForTimeout(1200);
  ok((await B.evaluate(() => Object.values(F0W.play.remotes.av).map(v => v.nt)))[0] === '', 'and again when she changes it back');
  await browser.close(); srv.kill();
})();
