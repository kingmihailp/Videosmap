// multiplayer: two players entering the Vietnam highlands (together, one after another, again after leaving) get the very same landscape: same seed and the same ground, byte for byte
const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3700 + Math.floor(Math.random() * 400), SRV = path.resolve(__dirname, '../../server');
try { fs.rmSync(path.join(SRV, 'data'), { recursive: true, force: true }); } catch (e) {}
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); };
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); srv.stderr.on('data', d => process.stdout.write('[srv-err] ' + d)); await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const open = async name => { const ctx = await browser.newContext({ viewport: { width: 640, height: 360 } }); const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('[pageerror ' + name + ']', e.message));
    await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${name}`); for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => Net.on).catch(() => false)) break; await pg.waitForTimeout(400); } return pg; };
  const openOnline = async name => { for (let k = 0; k < 4; k++) { const pg = await open(name); if (await pg.evaluate(() => Net.on).catch(() => false)) return pg; await pg.close().catch(() => {}); } throw new Error(name + ' never got online'); };
  const sig = pg => pg.evaluate(() => { const p = F0W.play, w = p.world; let h = 0; for (let x = -110; x <= 110; x += 2) for (let z = -110; z <= 110; z += 2) h = (h * 31 + Math.round(w.groundAt(x, z) * 100)) | 0; return { seed: p.seed, h, col: w.colliders.filter(c => !c.trap).length, br: w.bridges ? w.bridges.length : 0, bx: w.bridges ? w.bridges.map(b => +b.cx.toFixed(1)).join(',') : '', isl: w.islands ? w.islands.length : 0 }; });
  const enter = async pg => { await pg.evaluate(() => { Save.data.maps = Object.assign({}, Save.data.maps, { vietnam: true }); F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('vietnam'); }); for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => F0W.screen === 'play' && !!F0W.play).catch(() => false)) return true; await pg.waitForTimeout(400); } return false; };
  const leave = async pg => { await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMap(); }); await pg.waitForTimeout(1200); };
  const A = await openOnline('Alice'), B = await openOnline('Bob');
  for (let round = 1; round <= 3; round++) {
    const mode = ['at the same moment', 'one after the other', 'again after both left'][round - 1];
    if (round === 1 || round === 3) { const r = await Promise.all([enter(A), enter(B)]); ok(r[0] && r[1], `round ${round}: both are in (${mode})`); }
    else { ok(await enter(A), 'Alice is in'); await A.waitForTimeout(4000); ok(await enter(B), 'Bob is in later'); }
    const sa = await sig(A), sb = await sig(B); ok(sa.seed && sa.seed === sb.seed && sa.h === sb.h && sa.col === sb.col && sa.bx === sb.bx, `round ${round}: the same landscape (${mode})`, [sa, sb]);
    await leave(A); if (round !== 2) await leave(B); else { await B.waitForTimeout(500); await leave(B); }
  }
  await browser.close(); srv.kill(); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})();
