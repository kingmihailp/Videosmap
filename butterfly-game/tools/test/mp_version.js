// multiplayer: a client of another build (it would generate other landscapes from the same seed) is not let into places; a landscape whose ground differs from another player's is reported
const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3700 + Math.floor(Math.random() * 400), SRV = path.resolve(__dirname, '../../server');
try { fs.rmSync(path.join(SRV, 'data'), { recursive: true, force: true }); } catch (e) {}
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); };
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); srv.stderr.on('data', d => process.stdout.write('[srv-err] ' + d)); await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const open = async (name, stale) => { const ctx = await browser.newContext({ viewport: { width: 640, height: 360 } }); if (stale) await ctx.route(`http://localhost:${PORT}/`, async r => { const res = await r.fetch(); const body = (await res.text()).replace(/const BUILD_ID = '[0-9a-f]+'/, "const BUILD_ID = 'deadbeef00'"); await r.fulfill({ response: res, body }); }); const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('[pageerror ' + name + ']', e.message));
    await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${name}`); for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => Net.on).catch(() => false)) break; await pg.waitForTimeout(400); } return pg; };
  const openOnline = async (name, stale) => { for (let k = 0; k < 4; k++) { const pg = await open(name, stale); if (await pg.evaluate(() => Net.on).catch(() => false)) return pg; await pg.close().catch(() => {}); } throw new Error(name + ' never got online'); };
  const A = await openOnline('Alice'), S = await openOnline('Stale', true);
  const bid = pg => pg.evaluate(() => BUILD_ID); const ba = await bid(A), bs = await bid(S); ok(ba !== bs && bs === 'deadbeef00', 'the second client really has another build', [ba, bs]);
  const go = async pg => { await pg.evaluate(() => { Save.data.maps = Object.assign({}, Save.data.maps, { vietnam: true }); F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('vietnam'); }); for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => F0W.screen === 'play' || (F0W.screen === 'title' && !!Screens.mp.msg)).catch(() => false)) break; await pg.waitForTimeout(400); } return pg.evaluate(() => ({ screen: F0W.screen, msg: Screens.mp.msg })); };
  const rs = await go(S); ok(rs.screen === 'title' && /версия/.test(rs.msg), 'a client of another build is turned away with an explanation', rs);
  const ra = await go(A); ok(ra.screen === 'play', 'the current client enters normally', ra);
  // a landscape whose ground differs from another player\'s is reported to both
  await A.evaluate(() => { window.__des = []; Net.hooks.desync = m => window.__des.push(m.with); });
  const B = await openOnline('Bob'); const rb = await go(B); ok(rb.screen === 'play', 'Bob (current build) enters', rb); await B.waitForTimeout(2500);
  await B.evaluate(() => { window.__des = []; Net.hooks.desync = m => window.__des.push(m.with); const p = F0W.play; Net.send('sig', { seed: String(p.seed), h: 12345 }); });
  let da = [], db = []; for (let i = 0; i < 20 && !(da.length && db.length); i++) { await A.waitForTimeout(300); da = await A.evaluate(() => window.__des); db = await B.evaluate(() => window.__des); }
  ok(da.includes('Bob') && db.includes('Alice') && !db.includes('Bob'), 'two clients with different ground for the same seed are both told', [da, db]);
  await browser.close(); srv.kill(); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})();
