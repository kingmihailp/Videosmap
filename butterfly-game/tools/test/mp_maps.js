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
    await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${name}`); for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => Net.on).catch(() => false)) break; await pg.waitForTimeout(400); } return pg; };
  const A = await open('Alice', true), C = await open('Carol', true), B = await open('Bob', false);
  const go = async (pg, id) => { await pg.evaluate(id => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.start(id); }, id); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => F0W.screen === 'play').catch(() => false)) return true; await pg.waitForTimeout(400); } return false; };
  ok(await A.evaluate(() => Maps.has('bog')) && await C.evaluate(() => Maps.has('bog')) && !(await B.evaluate(() => Maps.has('bog'))), 'Alice and Carol own the map, Bob does not');
  ok(await go(A, 'bog'), 'Alice enters the bog'); ok(await go(C, 'bog'), 'Carol enters the bog');
  const ia = await A.evaluate(() => ({ seed: F0W.play.seed, host: F0W.play.isHost, rem: Object.keys(Net.remote).length })), ic = await C.evaluate(() => ({ seed: F0W.play.seed, host: F0W.play.isHost, rem: Object.keys(Net.remote).length, pup: F0W.play.flies.filter(f => f.puppet).length }));
  ok(ia.seed === ic.seed && ia.host && !ic.host, 'same landscape, Alice hosts', [ia, ic]); ok(ic.rem === 1 && ic.pup > 3, 'they see each other and the same butterflies', ic);
  // Bob: the client refuses, and the server refuses a forged join as well
  ok(!(await go(B, 'bog')), 'Bob cannot start the bog (client)');
  const r = await B.evaluate(() => Net.join('bog').then(() => 'joined', e => 'refused: ' + e.message)); ok(String(r).startsWith('refused'), 'the server denies Bob a forged join', r);
  const where = await B.evaluate(() => Net.list.map(p => p.name + ':' + p.loc)); ok(true, 'what Bob sees on the server list', where);
  ok(await B.evaluate(() => !visibleBiomes().some(b => b.id === 'bog')), 'the bog is not on Bob\'s map');
  console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await browser.close(); srv.kill(); process.exit(bad ? 1 : 0);
})();
