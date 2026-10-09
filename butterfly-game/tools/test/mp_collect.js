// multiplayer: selling a frame to the collector removes the box and its butterflies for everybody; a hung frame cannot be sold; the ocean map can be asked for with the join (server SECRET_MAP)
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
  const mk = async () => { const uid = await A.evaluate(() => { const b = Save.addBox('S', 0); for (let i = 0; i < 3; i++) { Save.add('papilio_machaon', 'russia'); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.q = 80; s.box = b.uid; b.items[i] = s.uid; } return b.uid; }); for (let i = 0; i < 30; i++) { if (await B.evaluate(u => !!Save.box(u) && Save.box(u).items.filter(Boolean).length === 3 && Save.box(u).items.every(x => !x || !!Save.spec(x)), uid)) break; await B.waitForTimeout(300); } return uid; };
  const U1 = await mk(); ok(await B.evaluate(u => !!Save.box(u), U1), 'Bob sees Alice\'s new frame with its butterflies');
  const got = await A.evaluate(u => Save.sellBox(u), U1); ok(got > 0, 'Alice sells it to the collector', got);
  let gone = false; for (let i = 0; i < 30 && !gone; i++) { await B.waitForTimeout(300); gone = await B.evaluate(u => !Save.box(u) && !Save.data.specimens.some(s => s.box === u), U1); } ok(gone, 'for Bob the frame and its butterflies are gone too');
  const U2 = await mk(); await A.evaluate(u => { Save.box(u).loc = { t: 'wall', i: 0 }; }, U2);
  const c0 = await A.evaluate(() => Save.data.coins); const hung = await A.evaluate(u => Save.sellBox(u), U2); ok(hung === 0 && (await A.evaluate(() => Save.data.coins)) === c0, 'a frame on the wall is not sold', hung);
  await A.evaluate(u => { Save.box(u).loc = null; Net.send('op', { op: { k: 'sellBox', uid: u } }); }, U2); // the server must refuse nothing here (it is not hung there), so this removes it: checks the op path
  let gone2 = false; for (let i = 0; i < 30 && !gone2; i++) { await B.waitForTimeout(300); gone2 = await B.evaluate(u => !Save.box(u), U2); } ok(gone2, 'the op reaches the other player');
  await browser.close(); srv.kill(); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})();
