const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3700 + Math.floor(Math.random() * 300), SRV = path.resolve(__dirname, '../../server');
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); await new Promise(r => setTimeout(r, 1500));
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const open = async (n) => { const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', n, e.message)); await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${n}&biome=russia`); for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(500); } await pg.evaluate(() => { F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; }); return pg; };
  const A = await open('Alice'), B = await open('Bob'); await B.waitForTimeout(2500);
  const snap = pg => pg.evaluate(() => Object.fromEntries(F0W.play.flies.map(f => [f.id, [+f.pos.x.toFixed(1), +f.pos.y.toFixed(1), +f.pos.z.toFixed(1), f.sp.id, f.state, f.hid ? 1 : 0, f.mesh.visible ? 1 : 0]])));
  const a = await snap(A), b = await snap(B); let bad = 0, n = 0, maxd = 0;
  for (const id in b) { if (!a[id]) { bad++; continue; } n++; const d = Math.hypot(a[id][0] - b[id][0], a[id][2] - b[id][2]); maxd = Math.max(maxd, d); if (a[id][3] !== b[id][3]) bad++; }
  console.log('compared', n, 'missing/mismatch', bad, 'max pos diff', maxd.toFixed(1));
  // what would the guide pick on Bob vs the truly nearest visible butterfly
  const pick = await B.evaluate(() => { const p = F0W.play; p.guideT = 60; const out = []; for (const f of p.flies) out.push([f.id, f.pos.distanceTo(p.player.pos), f.state, f.hid, f.mesh.visible, f.puppet, f.kind, f.sp.id, Save.has(f.sp.id)]); out.sort((x, y) => x[1] - y[1]); return out.slice(0, 5); });
  console.log(JSON.stringify(pick));
  await br.close(); srv.kill();
})();
