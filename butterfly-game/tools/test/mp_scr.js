// multiplayer: the skrichushka stands only in the ocean, the other player sees it (its mouth opens for the flying butterflies there too), and the server refuses it elsewhere
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
  const A = await openOnline('Alice'), B = await openOnline('Bob');
  const go = async (pg, loc) => { await pg.evaluate(loc => { Save.data.maps = Object.assign({}, Save.data.maps, { ocean: true }); F0W.fade = 0; F0W.fadeTarget = 0; F0W.start(loc); }, loc); for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => F0W.screen === 'play' && !!F0W.play).catch(() => false)) return true; await pg.waitForTimeout(400); } return false; };
  ok(await go(A, 'ocean') && await go(B, 'ocean'), 'both are in the ocean');
  const tid = await A.evaluate(() => { F0W.overlay = null; Traps.add('tr', 'scr', 1); Traps.add('hn', 'pheromone', 1); const p = F0W.play; p.player.yaw = 1.2; const t = p.traps.place('scr'); p.traps.bait(t, undefined, 'pheromone'); window.__t = t; return t.tid; });
  let seen = null; for (let i = 0; i < 30 && !seen; i++) { await B.waitForTimeout(300); seen = await B.evaluate(t => { const q = F0W.play.traps.list.find(x => x.tid === t); return q ? { type: q.type, hn: q.hn, owner: q.name, jaw: !!(q.group && q.group.userData.jaw) } : null; }, tid); }
  ok(seen && seen.type === 'scr' && seen.hn === 'pheromone' && seen.owner === 'Alice' && seen.jaw, 'Bob sees the skrichushka with its pheromones', seen);
  // a butterfly flies in: Bob's copy opens its mouth too, and the count follows
  await A.evaluate(() => { const p = F0W.play, t = window.__t; t.life = 99999; p.traps.spawn(t, p.pool[0]); p.traps.send({ k: 'arr', tid: t.tid }); });
  let maxOpen = 0, n = 0; for (let i = 0; i < 250; i++) { await B.waitForTimeout(200); const r = await B.evaluate(t => { const q = F0W.play.traps.list.find(x => x.tid === t); return q ? { o: q.open || 0, n: q.n } : { o: 0, n: 0 }; }, tid); maxOpen = Math.max(maxOpen, r.o); n = r.n; if (n >= 1 && maxOpen > 0.8) break; }
  ok(maxOpen > 0.8 && n === 1, 'Bob sees the mouth open and the count rise to 1', [maxOpen, n]);
  // the server refuses it in an ordinary location (a forged message) and the standard trap in the ocean
  await A.evaluate(() => { Net.send('trap', { k: 'put', tid: 'FORGED1', type: 'std', x: 5, y: 0, z: 5, yaw: 0 }); }); await B.waitForTimeout(1200);
  const forged = await B.evaluate(() => F0W.play.traps.list.some(q => q.tid === 'FORGED1')); ok(!forged, 'the server refuses a standard trap in the ocean');
  await B.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMap(); }); await B.waitForTimeout(800); ok(await go(B, 'russia'), 'Bob walks into an ordinary location');
  await B.evaluate(() => { Net.send('trap', { k: 'put', tid: 'FORGED2', type: 'scr', x: 5, y: 0, z: 5, yaw: 0 }); }); await B.waitForTimeout(1200);
  const info = await B.evaluate(() => F0W.play.traps.list.length); ok(info === 0, 'and the server does not keep a skrichushka there', info);
  await browser.close(); srv.kill(); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})();
