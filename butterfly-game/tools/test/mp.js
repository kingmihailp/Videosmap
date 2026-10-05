// multiplayer integration test: starts the server, opens two game clients and checks shared world, catches, cabinet sync, host migration
const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3200 + Math.floor(Math.random() * 500), SRV = path.resolve(__dirname, '../../server');
try { fs.rmSync(path.join(SRV, 'data'), { recursive: true, force: true }); } catch (e) {}
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); srv.stdout.on('data', d => process.stdout.write('[srv] ' + d)); srv.stderr.on('data', d => process.stdout.write('[srv-err] ' + d)); await new Promise(r => setTimeout(r, 1500));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const open = async (name, biome) => { const pg = await browser.newPage({ viewport: { width: 960, height: 540 } }); pg.on('console', m => { if (m.type() === 'error') console.log('[console ' + name + ']', m.text().slice(0, 150)); }); pg.on('pageerror', e => console.log('[pageerror ' + name + ']', e.message, (e.stack || '').split('\n')[1])); await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${name}${biome ? '&biome=' + biome : ''}`); return pg; };
  const waitPlay = async pg => { for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play)).catch(() => false)) return; await pg.waitForTimeout(500); } };
  const A = await open('Alice', 'russia'); await waitPlay(A); const B = await open('Bob', 'russia'); await waitPlay(B);
  const unlockPlay = pg => pg.evaluate(() => { F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; });
  await unlockPlay(A); await unlockPlay(B);
  const info = pg => pg.evaluate(() => ({ seed: F0W.play.seed, host: F0W.play.isHost, flies: F0W.play.flies.length, pup: F0W.play.flies.filter(f => f.puppet).length, remotes: Object.keys(Net.remote).length, names: Net.names(), screen: F0W.screen }));
  await A.waitForTimeout(1500); for (const [n, pg] of [['A', A], ['B', B]]) console.log(n, await pg.evaluate(() => JSON.stringify({ screen: F0W.screen, play: !!F0W.play, on: Net.on, msg: Screens.mp.msg, load: F0W.loadText }))); const ia = await info(A), ib = await info(B); console.log(JSON.stringify(ia), JSON.stringify(ib));
  ok(ia.seed === ib.seed, 'same seed'); ok(ia.host && !ib.host, 'Alice hosts, Bob does not'); ok(ib.pup > 5 && Math.abs(ia.flies - ib.flies) <= 2, 'Bob sees the same butterflies as puppets'); ok(ia.remotes === 1 && ib.remotes === 1, 'players see each other');
  // positions: move Alice and look at Bob's view
  await A.evaluate(() => { const P = F0W.play.player; P.pos.x += 3; }); await B.waitForTimeout(800);
  await B.evaluate(() => { const P = F0W.play.player, r = Object.values(Net.remote)[0]; P.pos.set(r.pos.x, P.pos.y, r.pos.z + 4); P.yaw = 0; P.pitch = -0.1; }); await B.waitForTimeout(900); await B.screenshot({ path: '/tmp/mp_bob_sees_alice.png' });
  // simultaneous catch of the same butterfly: exactly one winner
  const target = await B.evaluate(() => F0W.play.flies.find(f => f.state !== 3 && f.kind !== 'rush' && f.kind !== 'ambush').id);
  const res = await Promise.all([A, B].map(pg => pg.evaluate(async fid => { const p = F0W.play; const f = p.flies.find(x => x.id === fid); window.__won = null; if (f) p.netCatch(f); return !!f; }, target)));
  await A.waitForTimeout(1200);
  const won = await Promise.all([A, B].map(pg => pg.evaluate(() => ({ journal: Save.total(), spec: Save.data.specimens.length, by: Save.data.specimens.map(s => s.by) }))));
  console.log(JSON.stringify(won)); ok(won[0].journal + won[1].journal === 1, 'exactly one player got the butterfly'); ok(won[0].spec === 1 && won[1].spec === 1, 'the specimen appears in the shared cabinet for both');
  const gone = await Promise.all([A, B].map(pg => pg.evaluate(fid => !F0W.play.flies.some(f => f.id === fid && f.state !== 3), target))); ok(gone[0] && gone[1], 'caught butterfly removed on both');
  // cabinet: Alice spreads, Bob boxes it, Alice places it
  await A.evaluate(() => { const s = Save.rawList()[0]; s.q = 88; s.pose = JSON.parse(JSON.stringify(Art.IDEAL)); Save.syncSpread(s); });
  await B.waitForTimeout(500); ok(await B.evaluate(() => Save.data.specimens[0].q === 88), 'spread result reaches Bob');
  await B.evaluate(() => { const b = Save.addBox('M', 1); Save.putIn(b, 0, Save.data.specimens[0].uid); });
  await A.waitForTimeout(500); ok(await A.evaluate(() => Save.data.boxes.length === 1 && Save.data.boxes[0].items[0] === Save.data.specimens[0].uid), 'Bob\'s box with the specimen reaches Alice');
  await A.evaluate(() => { const b = Save.data.boxes[0]; b.loc = { t: 'wall', i: 1 }; Save.syncBoxLoc(b); }); await B.waitForTimeout(500); ok(await B.evaluate(() => Save.data.boxes[0].loc && Save.data.boxes[0].loc.i === 1), 'wall placement reaches Bob');
  // bad op is rejected and resynced: Bob tries to fill an occupied slot
  await B.evaluate(() => { const b = Save.data.boxes[0]; b.items[0] = 0; Save.data.specimens[0].box = null; Save.putIn(b, 0, Save.data.specimens[0].uid); }); // legal re-put after local reset -> server rejects (slot already occupied)
  await B.waitForTimeout(700); ok(await B.evaluate(() => Save.data.boxes[0].items.filter(Boolean).length === 1), 'state stays consistent after a rejected op');
  // modifier shared
  await A.evaluate(() => Net.send('mod', { id: 'fast' })); // ocean only in game, but the relay works anywhere
  // host migration
  await A.close(); await B.waitForTimeout(2500); const ib2 = await info(B); console.log(JSON.stringify(ib2)); ok(ib2.host && ib2.flies > 5 && ib2.pup === 0, 'Bob became host and keeps the butterflies');
  // reconnect Alice: she joins as a puppet viewer, sees the same population
  const A2 = await open('Alice', 'russia'); await waitPlay(A2); await unlockPlay(A2); const ia2 = await info(A2); console.log(JSON.stringify(ia2)); ok(!ia2.host && ia2.pup > 5 && ia2.seed === ib.seed, 'rejoined player sees the same world');
  ok(await A2.evaluate(() => Save.data.specimens.length === 1 && Save.data.boxes.length === 1), 'cabinet persisted across Alice reconnect');
  // cabinet visit together
  await A2.evaluate(() => F0W.toCabinet()); await B.evaluate(() => F0W.toCabinet()); await A2.waitForTimeout(4000); await B.waitForTimeout(1500);
  await B.evaluate(() => { F0W.cab.player.pos.set(0, 0, 1.5); F0W.cab.player.yaw = 0; }); await A2.evaluate(() => { F0W.cab.player.pos.set(1, 0, 2.2); F0W.cab.player.yaw = Math.PI; }); await B.waitForTimeout(1500);
  await B.evaluate(() => { F0W.cab.player.yaw = 0.4 + 0; F0W.cab.player.pitch = -0.1; }); await B.evaluate(() => { const P = F0W.cab.player; P.pos.set(-0.5, 0, 3.0); P.yaw = 2.9; }); await B.waitForTimeout(900); await B.screenshot({ path: '/tmp/mp_cabinet.png' });
  console.log('cab remotes', await B.evaluate(() => Object.values(Net.remote).map(r => r.name)));
  fetchHealth: { const h = await new Promise(r => require('http').get(`http://localhost:${PORT}/health`, res => { let d = ''; res.on('data', c => d += c); res.on('end', () => r(d)); })); console.log('health', h); }
  await browser.close(); srv.kill(); setTimeout(() => process.exit(0), 300);
})().catch(e => { console.error(e); process.exit(1); });
