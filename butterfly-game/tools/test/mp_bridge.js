// multiplayer, Vietnam highlands: a bridge that snaps for one player snaps for the other too (and for one who arrives later)
const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3700 + Math.floor(Math.random() * 400), SRV = path.resolve(__dirname, '../../server');
try { fs.rmSync(path.join(SRV, 'data'), { recursive: true, force: true }); } catch (e) {}
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); };
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); srv.stderr.on('data', d => process.stdout.write('[srv-err] ' + d)); await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const open = async name => { const ctx = await browser.newContext({ viewport: { width: 640, height: 360 } }); const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('[pageerror ' + name + ']', e.message));
    await pg.addInitScript(() => { try { const k = 'flora0world_butterflies_v1', d = JSON.parse(localStorage.getItem(k) || '{}'); d.maps = { vietnam: true }; localStorage.setItem(k, JSON.stringify(d)); } catch (e) {} });
    await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${name}`); for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => Net.on).catch(() => false)) break; await pg.waitForTimeout(400); } return pg; };
  const go = async pg => { await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('vietnam'); }); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => F0W.screen === 'play' && !!F0W.play).catch(() => false)) return true; await pg.waitForTimeout(400); } return false; };
  const A = await open('Alice'), B = await open('Bob');
  ok(await go(A) && await go(B), 'both are in the highlands');
  const st = pg => pg.evaluate(() => F0W.play.world.bridges.map(b => b.state));
  const worn = await A.evaluate(() => F0W.play.world.bridges.findIndex(b => b.weak));
  // Alice walks to the middle of a worn bridge; Bob stands elsewhere
  await A.evaluate(i => { const p = F0W.play, w = p.world, b = w.bridges[i], P = p.player; F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; P.pos.set(b.cx, w.groundAt(b.cx, b.cz) + 1.65, b.cz); P.y = P.pos.y; P.vel.set(0, 0); }, worn);
  let sa = null, sb = null; for (let i = 0; i < 50; i++) { await A.waitForTimeout(400); sb = await st(B); if (sb[worn] === 'shake' || sb[worn] === 'fall' || sb[worn] === 'gone') break; }
  ok(['shake', 'fall', 'gone'].includes(sb[worn]), 'Bob sees the bridge shaking / falling', sb);
  for (let i = 0; i < 50; i++) { await A.waitForTimeout(400); sb = await st(B); if (sb[worn] === 'gone' || sb[worn] === 'fall') break; }
  ok(['fall', 'gone'].includes(sb[worn]), 'Bob sees it snap', sb);
  // a newcomer finds it already broken
  const C = await open('Carol'); ok(await go(C), 'Carol arrives later'); const sc = await st(C);
  ok(['fall', 'gone'].includes(sc[worn]), 'Carol finds the bridge broken', sc);
  console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await browser.close(); srv.kill(); process.exit(bad ? 1 : 0);
})();
