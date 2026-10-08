// multiplayer: the museum is a shared place; a box placed there by one player is seen by the other; the server refuses places that do not fit
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
  const inMus = async pg => { await pg.evaluate(() => { Save.data.seenMuseum = true; F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMuseum(); }); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && F0W.cab.constructor.name === 'Mus').catch(() => false)) { await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; }); return true; } await pg.waitForTimeout(400); } return false; };
  const A = await openOnline('Alice'), B = await openOnline('Bob');
  ok(await inMus(A) && await inMus(B), 'both are in the museum');
  let rem = 0; for (let i = 0; i < 30 && rem < 1; i++) { await B.waitForTimeout(400); rem = await B.evaluate(() => Object.keys(Net.remote).length); } ok(rem === 1, 'Bob sees Alice in the museum (a shared place)', rem);
  const mk = async size => { const uid = await A.evaluate(s => { Save.addBox(s, 0); return Save.data.boxes[Save.data.boxes.length - 1].uid; }, size); for (let i = 0; i < 30; i++) { if (await B.evaluate(u => !!Save.box(u), uid)) break; await B.waitForTimeout(300); } return uid; };
  const M1 = await mk('M'), L1 = await mk('L');
  ok(await B.evaluate(u => !!Save.box(u), M1), 'Bob has the new box too');
  await A.evaluate(u => { Boxes.place.open('mt'); Boxes.place.layout(); Boxes.place.selUid = u; const s = Boxes.place.slots.find(q => q.i === 3); Boxes.place.click(s.x + 2, s.y + 2); F0W.cab.refresh(); }, M1);
  let locB = null; for (let i = 0; i < 30 && !locB; i++) { await B.waitForTimeout(300); locB = await B.evaluate(u => { const b = Save.box(u); return b && b.loc ? b.loc.t + ':' + b.loc.i : null; }, M1); }
  ok(locB === 'mt:3', 'Alice places a box on a museum table: Bob sees it there', locB);
  // the server refuses a large box on a table and a place that does not exist
  await A.evaluate(u => { Net.send('op', { op: { k: 'boxLoc', uid: u, loc: { t: 'mt', i: 0 } } }); Net.send('op', { op: { k: 'boxLoc', uid: u, loc: { t: 'mw', i: 99 } } }); Net.send('op', { op: { k: 'boxLoc', uid: u, loc: { t: 'mt', i: 3 } } }); }, L1);
  await B.waitForTimeout(2500);
  const locL = await B.evaluate(u => { const b = Save.box(u); return b && b.loc ? b.loc.t + ':' + b.loc.i : null; }, L1); ok(locL === null, 'the server refuses: a large box on a table, a place that does not exist, an occupied place', locL);
  await A.evaluate(u => { Net.send('op', { op: { k: 'boxLoc', uid: u, loc: { t: 'ml', i: 2 } } }); }, L1);
  let locL2 = null; for (let i = 0; i < 30 && !locL2; i++) { await B.waitForTimeout(300); locL2 = await B.evaluate(u => { const b = Save.box(u); return b && b.loc ? b.loc.t + ':' + b.loc.i : null; }, L1); } ok(locL2 === 'ml:2', 'a large box on a large table is accepted', locL2);
  await browser.close(); srv.kill(); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})();
