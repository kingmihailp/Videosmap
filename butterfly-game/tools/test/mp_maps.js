// multiplayer: secret location "bog": only owners of the map can enter it; two owners meet there; a player without the map is refused by the server
const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3200 + Math.floor(Math.random() * 500), SRV = path.resolve(__dirname, '../../server');
try { fs.rmSync(path.join(SRV, 'data'), { recursive: true, force: true }); } catch (e) {}
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); };
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); srv.stderr.on('data', d => process.stdout.write('[srv-err] ' + d)); await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const open = async (name, maps) => { const ctx = await browser.newContext({ viewport: { width: 960, height: 540 } }); const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('[pageerror ' + name + ']', e.message));
    if (maps) await pg.addInitScript(() => { try { const k = 'flora0world_butterflies_v1', d = JSON.parse(localStorage.getItem(k) || '{}'); d.maps = { bog: true }; localStorage.setItem(k, JSON.stringify(d)); } catch (e) {} });
    await pg.goto(`http://localhost:${PORT}/#debug&nolock&lite&mp=${name}`, { timeout: 240000 }); for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => Net.on).catch(() => false)) break; await pg.waitForTimeout(400); } return pg; };
  const A = await open('Alice', true), C = await open('Carol', true), B = await open('Bob', false);
  const go = async (pg, id) => { await pg.evaluate(id => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.start(id); }, id); for (let i = 0; i < 900; i++) { if (await pg.evaluate(() => F0W.screen === 'play').catch(() => false)) return true; await pg.waitForTimeout(400); } return false; };
  ok(await A.evaluate(() => Maps.has('bog')) && await C.evaluate(() => Maps.has('bog')) && !(await B.evaluate(() => Maps.has('bog'))), 'Alice and Carol own the map, Bob does not');
  { const g = await Promise.all([go(A, 'bog'), go(C, 'bog')]); ok(g[0], 'Alice enters the bog'); ok(g[1], 'Carol enters the bog'); }       // together: a lone world build on a slow machine would let the server hand the lead over
  for (let k = 0; k < 120; k++) { const st = await Promise.all([A, C].map(P => P.evaluate(() => ({ host: F0W.play.isHost, nh: Net.host })).catch(() => null))); if (st.every(Boolean) && st[0].host !== st[1].host && st.every(x => x.host === x.nh)) break; await A.waitForTimeout(500); }
  const ia = await A.evaluate(() => ({ seed: F0W.play.seed, host: F0W.play.isHost, rem: Object.keys(Net.remote).length, pup: F0W.play.flies.filter(f => f.puppet).length })), ic = await C.evaluate(() => ({ seed: F0W.play.seed, host: F0W.play.isHost, rem: Object.keys(Net.remote).length, pup: F0W.play.flies.filter(f => f.puppet).length }));
  ok(ia.seed === ic.seed && ia.host !== ic.host, 'same landscape, exactly one of them leads the butterflies', [ia, ic]); ok(ia.rem === 1 && ic.rem === 1 && (ia.host ? ic : ia).pup > 3, 'they see each other and the same butterflies', [ia, ic]);
  // Bob: the client refuses, and the server refuses a forged join as well
  ok(!(await go(B, 'bog')), 'Bob cannot start the bog (client)');
  const r = await B.evaluate(() => Net.join('bog').then(() => 'joined', e => 'refused: ' + e.message)); ok(String(r).startsWith('refused'), 'the server denies Bob a forged join', r);
  const where = await B.evaluate(() => Net.list.map(p => p.name + ':' + p.loc)); ok(true, 'what Bob sees on the server list', where);
  ok(await B.evaluate(() => !visibleBiomes().some(b => b.id === 'bog')), 'the bog is not on Bob\'s map');
  console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await browser.close(); srv.kill(); process.exit(bad ? 1 : 0);
})();
