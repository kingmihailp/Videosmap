// multiplayer: (1) a biome gets a new seed when a player enters it empty, (2) the host pausing does not freeze the others' butterflies,
// (3) a silent host is replaced by the server watchdog
const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process'); const WebSocket = require(path.resolve(__dirname, '../../server/node_modules/ws'));
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3700 + Math.floor(Math.random() * 200), SRV = path.resolve(__dirname, '../../server');
try { fs.rmSync(path.join(SRV, 'data'), { recursive: true, force: true }); } catch (e) {}
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
const wsClient = name => new Promise(res => { const ws = new WebSocket(`ws://localhost:${PORT}`); const q = []; ws.on('message', d => q.push(JSON.parse(d))); ws.on('open', () => { ws.send(JSON.stringify({ t: 'hello', name })); res({ ws, q, send: o => ws.send(JSON.stringify(o)), wait: async (t, ms = 3000) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { const i = q.findIndex(m => m.t === t); if (i >= 0) return q.splice(i, 1)[0]; await new Promise(r => setTimeout(r, 30)); } return null; } }); }); });
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); srv.stdout.on('data', d => process.stdout.write('[srv] ' + d)); await new Promise(r => setTimeout(r, 1200));
  // (1) seeds
  const a = await wsClient('A'), b = await wsClient('B'), c = await wsClient('C');
  a.send({ t: 'join', loc: 'alps' }); const j1 = await a.wait('joined'); a.send({ t: 'join', loc: null }); await new Promise(r => setTimeout(r, 200));
  b.send({ t: 'join', loc: 'alps' }); const j2 = await b.wait('joined'); c.send({ t: 'join', loc: 'alps' }); const j3 = await c.wait('joined');
  ok(j1.seed && j2.seed && j1.seed !== j2.seed, `empty biome entered again -> new seed (${j1.seed} -> ${j2.seed})`); ok(j3.seed === j2.seed, 'a second player joining gets the same seed');
  b.send({ t: 'join', loc: null }); c.send({ t: 'join', loc: null }); await new Promise(r => setTimeout(r, 200));
  a.send({ t: 'join', loc: 'cabinet' }); const jc1 = await a.wait('joined'); a.send({ t: 'join', loc: null }); await new Promise(r => setTimeout(r, 100)); a.send({ t: 'join', loc: 'cabinet' }); const jc2 = await a.wait('joined'); ok(jc1.seed === jc2.seed, 'the cabinet keeps its seed');
  // (3) watchdog: A hosts, B joins, A stays silent
  a.send({ t: 'join', loc: 'med' }); await a.wait('joined'); b.send({ t: 'join', loc: 'med' }); await b.wait('joined'); a.send({ t: 'flies', list: [[1, 'x', 0, 0, 0, 0, 0, 0]] });
  const t0 = Date.now(); const h = await b.wait('host', 24000); ok(h && h.id !== undefined && Date.now() - t0 > 8000, `silent host replaced after ${(Date.now() - t0) / 1000}s (host msg ${JSON.stringify(h && { id: h.id, n: h.flies.length })})`);
  [a, b, c].forEach(x => x.ws.close());
  // (2) browser: host pauses, the other client's butterflies keep moving
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const open = async name => { const pg = await browser.newPage({ viewport: { width: 640, height: 360 } }); pg.on('pageerror', e => console.log('[pageerror ' + name + ']', e.message)); await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${name}&biome=russia`); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(400); } await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; }); return pg; };
  const A = await open('Alice'), B = await open('Bob'); await A.waitForTimeout(1500);
  const pos = pg => pg.evaluate(() => F0W.play.flies.filter(f => f.state !== 3).slice(0, 6).map(f => [f.pos.x, f.pos.z].map(v => +v.toFixed(2))));
  console.log('Alice host?', await A.evaluate(() => F0W.play.isHost), 'Bob host?', await B.evaluate(() => F0W.play.isHost));
  await A.evaluate(() => { F0W.overlay = 'pause'; F0W.locked = false; }); await B.waitForTimeout(500);
  const p1 = await pos(B); await B.waitForTimeout(2500); const p2 = await pos(B);
  const moved = p1.filter((p, i) => p2[i] && (Math.abs(p[0] - p2[i][0]) + Math.abs(p[1] - p2[i][1])) > 0.05).length;
  ok(moved >= 2, `Alice paused (menu open) but ${moved}/${p1.length} of Bob's butterflies keep moving`);
  await A.evaluate(() => { F0W.overlay = 'journal'; }); await B.waitForTimeout(2500); const p3 = await pos(B); ok(p3.some((p, i) => p2[i] && (Math.abs(p[0] - p2[i][0]) + Math.abs(p[1] - p2[i][1])) > 0.05), 'same with the journal open');
  await browser.close(); srv.kill();
})();
