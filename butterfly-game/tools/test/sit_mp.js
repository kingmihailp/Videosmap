const path = require('path'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3700 + Math.floor(Math.random() * 300), SRV = path.resolve(__dirname, '../../server');
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); await new Promise(r => setTimeout(r, 1500));
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const open = async (n) => { const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', n, e.message)); await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${n}`); await pg.waitForTimeout(1500); await pg.evaluate(() => F0W.toCabinet()); for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => !!F0W.cab).catch(() => false)) break; await pg.waitForTimeout(500); } await pg.evaluate(() => { F0W.overlay = null; if (F0W.cab) F0W.cab.ov = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; }); return pg; };
  const A = await open('Alice'), B = await open('Bob'); await B.waitForTimeout(1500);
  // Alice gets a raw specimen, walks near the desk and presses E
  await A.evaluate(() => { Save.addSpecimen ? 0 : 0; const sp = SPECIES_BY_ID['vanessa_atalanta']; Save.data.specimens.push({ uid: 99, sp: sp.id, biome: 'russia', date: 1, q: null, pose: null, box: null }); const c = F0W.cab; c.player.pos.set(-2.2, 1.65, 0.8); c.refresh && c.refresh(); });
  await A.waitForTimeout(300);
  await A.evaluate(() => { const c = F0W.cab; c.prompt = c.stations.find(s => s.id === 'spread'); c.interact(); });
  for (const t of [300, 600, 1200]) { await A.waitForTimeout(t === 300 ? 300 : t === 600 ? 300 : 600); console.log('t', t, await A.evaluate(() => JSON.stringify({ sit: F0W.cab.sit.toFixed(2), ov: F0W.cab.ov, x: F0W.cab.player.pos.x.toFixed(2) }))); }
  await B.evaluate(() => { const c = F0W.cab, r = Object.values(Net.remote)[0]; c.player.pos.set(-1.6, 1.65, 1.6); c.player.yaw = 0.6; c.player.pitch = -0.1; });
  await B.waitForTimeout(6000); console.log('lists', await B.evaluate(() => JSON.stringify({ list: Net.list, loc: Net.loc, scr: F0W.screen, cab: !!F0W.cab })), await A.evaluate(() => JSON.stringify({ list: Net.list, scr: F0W.screen, sit: F0W.cab.sit })));
  console.log('Bob sees', await B.evaluate(() => JSON.stringify(Object.values(Net.remote).map(r => ({ n: r.name, sit: r.sit, age: Math.round(performance.now() - r.t), x: r.pos.x })))));
  await B.screenshot({ path: '/tmp/sit_bob.png' });
  await A.evaluate(() => F0W.cab.close()); await A.waitForTimeout(1500);
  console.log('after close', await A.evaluate(() => JSON.stringify({ sit: F0W.cab.sit, ov: F0W.cab.ov })));
  await br.close(); srv.kill();
})();
