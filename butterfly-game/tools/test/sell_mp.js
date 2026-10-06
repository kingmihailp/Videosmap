const path = require('path'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3700 + Math.floor(Math.random() * 300), SRV = path.resolve(__dirname, '../../server');
try { require('fs').rmSync(path.join(SRV, 'data'), { recursive: true, force: true }); } catch (e) {}
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); await new Promise(r => setTimeout(r, 1500));
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const open = async n => { const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', n, e.message)); await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${n}&biome=russia`); for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(500); } await pg.evaluate(() => { F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; }); return pg; };
  const A = await open('Alice'), B = await open('Bob');
  // both catch something so the shared cabinet has specimens
  const ids = []; for (const pg of [A, B]) await pg.evaluate(() => { Save.add(F0W.play.pool[0].id, 'russia'); Save.add(F0W.play.pool[1].id, 'russia'); }); await A.waitForTimeout(1200);
  const n = await Promise.all([A, B].map(pg => pg.evaluate(() => Save.data.specimens.length))); console.log('specimens', n); ok(n[0] === 4 && n[1] === 4, 'four specimens shared');
  for (const pg of [A, B]) await pg.evaluate(() => F0W.toMarket()); await A.waitForTimeout(3500);
  const near = await Promise.all([A, B].map(pg => pg.evaluate(() => Object.keys(Net.remote).length))); ok(near[0] === 1 && near[1] === 1, 'players see each other in the market');
  // Alice sells one specimen
  const uid = await A.evaluate(() => Save.data.specimens[0].uid); const pa = await A.evaluate(uid => Save.sell(uid), uid); await B.waitForTimeout(900);
  const after = await Promise.all([A, B].map(pg => pg.evaluate(() => ({ n: Save.data.specimens.length, coins: Save.data.coins || 0 })))); console.log(JSON.stringify(after), pa);
  ok(after[0].n === 3 && after[1].n === 3, 'the sold specimen disappears from the shared cabinet for both'); ok(after[0].coins === pa && pa > 0 && after[1].coins === 0, 'only the seller gets coins');
  // Bob tries to sell the same (already sold) specimen: rejected -> his coins refunded
  await B.evaluate(uid => { Save.data.specimens.push({ uid, sp: Save.data.specimens[0].sp, biome: 'russia', date: 1, q: null, pose: null, box: null }); }, uid); // stale local copy
  const pb = await B.evaluate(uid => Save.sell(uid), uid); await B.waitForTimeout(900); const bc = await B.evaluate(() => Save.data.coins || 0); console.log('bob coins', pb, bc);
  ok(pb > 0 && bc === 0, 'a double sale is rejected by the server and the coins are taken back');
  await br.close(); srv.kill();
})();
