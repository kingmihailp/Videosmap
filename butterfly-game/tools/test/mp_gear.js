// multiplayer: others see your gear (cannon, attachments, parts) and your drive trap rolling about (its position, run state, only the owner may move it), a late joiner sees where it stands
const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3700 + Math.floor(Math.random() * 400), SRV = path.resolve(__dirname, '../../server');
try { fs.rmSync(path.join(SRV, 'data'), { recursive: true, force: true }); } catch (e) {}
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); };
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); srv.stderr.on('data', d => process.stdout.write('[srv-err] ' + d)); await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const open = async name => { const ctx = await browser.newContext({ viewport: { width: 640, height: 360 } }); const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('[pageerror ' + name + ']', e.message));
    await pg.goto(`http://localhost:${PORT}/#debug&nolock&lite&mp=${name}`, { timeout: 240000 }); for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => Net.on).catch(() => false)) break; await pg.waitForTimeout(400); } return pg; };
  const openOnline = async name => { for (let k = 0; k < 4; k++) { const pg = await open(name); if (await pg.evaluate(() => Net.on).catch(() => false)) return pg; await pg.close().catch(() => {}); } throw new Error(name + ' never got online'); };
  const go = async pg => { await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('alps'); }); for (let i = 0; i < 900; i++) { if (await pg.evaluate(() => F0W.screen === 'play' && !!F0W.play).catch(() => false)) return true; await pg.waitForTimeout(400); } return false; };
  const [A, B] = await Promise.all([openOnline('Alice'), openOnline('Bob')]);
  ok(await go(A) && await go(B), 'both are in the same expedition location');
  // ---- gear on the avatar
  await A.evaluate(() => { F0W.overlay = null; Save.data.coins = 1e7; const n = Save.buyCannon(); for (const g of ['g_ir', 'g_map']) { Save.buyGadget(g); Save.attachGadget(n.uid, g); } F0W.play.buildNet(); });
  const seeNt = async (pg, want) => { let r = null; for (let i = 0; i < 40; i++) { await pg.waitForTimeout(300); r = await pg.evaluate(() => { const o = Object.values(Net.remote).find(q => q.name === 'Alice'); const a = o && F0W.play.remotes && Object.values(F0W.play.remotes.av).find(q => q.nt === o.nt); return o ? { nt: o.nt, built: !!(a && a.net), kids: a && a.net ? a.net.children.length : 0 } : null; }); if (r && r.nt === want) break; } return r; };
  const r1 = await seeNt(B, 'cannon+g_ir,g_map'); ok(r1 && r1.nt === 'cannon+g_ir,g_map' && r1.built && r1.kids > 3, 'Bob sees Alice\'s cannon with two attachments', r1);
  await A.evaluate(() => { for (const id of ['h_mech', 'r_shock', 'm_pher']) Save.buyPart(id); Save.buyGadget('g_auto'); const n = Save.assembleNet({ h: 'h_mech', r: 'r_shock', m: 'm_pher' }); Save.attachGadget(n.uid, 'g_auto'); Save.equipNet(n.uid); F0W.play.buildNet(); });
  const r2 = await seeNt(B, 'h_mech.r_shock.m_pher+g_auto'); ok(r2 && r2.nt === 'h_mech.r_shock.m_pher+g_auto' && r2.built, 'Bob sees the gear parts on Alice\'s net', r2);
  await B.evaluate(() => { Net.send('pos', { x: 0, y: 1.65, z: 0, yaw: 0, pitch: 0, nz: 0, fl: 0, sw: 0, sp: 0, nt: 'cannon+' + 'g_map,'.repeat(30) }); }); await B.waitForTimeout(1500);
  const bad1 = await A.evaluate(() => { const o = Object.values(Net.remote).find(q => q.name === 'Bob'); return o ? o.nt : null; }); ok(!bad1 || bad1.length <= 90, 'a too long net code from a client is not passed on', bad1 && bad1.length);
  // ---- the drive trap
  await A.evaluate(() => { F0W.overlay = null; for (const [k, id] of [['tr', 'drv'], ['fl', 'synth'], ['hn', 'heather']]) Traps.add(k, id, 1); const p = F0W.play; p.player.yaw = 0.2; const t = p.traps.place('drv'); p.traps.bait(t, 'synth', 'heather'); window.__tid = t.tid; });
  const tid = await A.evaluate(() => window.__tid); ok(!!tid, 'Alice puts a drive trap', tid);
  let seen = null; for (let i = 0; i < 30 && !seen; i++) { await B.waitForTimeout(300); seen = await B.evaluate(t => { const q = F0W.play.traps.list.find(x => x.tid === t); return q ? { type: q.type, run: q.run, x: q.x, z: q.z } : null; }, tid); }
  ok(seen && seen.type === 'drv' && !seen.run, 'Bob sees the standing drive trap', seen);
  await A.evaluate(() => { const p = F0W.play, t = p.traps.list.find(q => q.tid === window.__tid); p.traps.launch(t); for (let i = 0; i < 20; i++) { p.traps.update(0.1); } });
  const posA = await A.evaluate(t => { const q = F0W.play.traps.list.find(x => x.tid === t); return { x: q.x, z: q.z, run: q.run, mode: q.dr.mode }; }, tid);
  ok(posA.mode === 'drive' && posA.run === 1, 'Alice\'s trap drives', posA);
  let pb = null; for (let i = 0; i < 40; i++) { await B.waitForTimeout(250); pb = await B.evaluate(t => { const q = F0W.play.traps.list.find(x => x.tid === t); return { x: q.x, z: q.z, run: q.run, sp: q.sp }; }, tid); if (pb.run === 1 && Math.hypot(pb.x - posA.x, pb.z - posA.z) < 2) break; }
  ok(pb.run === 1 && Math.hypot(pb.x - posA.x, pb.z - posA.z) < 3, 'Bob sees it at the same place, running', { pb, posA });
  const moved = await B.evaluate(async t => { const q = F0W.play.traps.list.find(x => x.tid === t); const a = [q.x, q.z]; await new Promise(r => setTimeout(r, 1200)); return Math.hypot(q.x - a[0], q.z - a[1]); }, tid); await A.evaluate(() => { const p = F0W.play, t = p.traps.list.find(q => q.tid === window.__tid); for (let i = 0; i < 40; i++) p.traps.update(0.1); });
  await B.waitForTimeout(800);
  const hijack = await B.evaluate(t => { Net.send('trap', { k: 'mv', tid: t, x: 5, y: 0, z: 5, yaw: 0, run: 0 }); return true; }, tid); await B.waitForTimeout(1000);
  const afterH = await A.evaluate(t => { const q = F0W.play.traps.list.find(x => x.tid === t); return { x: q.x, z: q.z, run: q.run }; }, tid); ok(Math.hypot(afterH.x - 5, afterH.z - 5) > 3, 'Bob cannot move Alice\'s trap', afterH);
  await A.evaluate(() => { const p = F0W.play, t = p.traps.list.find(q => q.tid === window.__tid); p.traps.halt(t, true); });
  let stopped = null; for (let i = 0; i < 30; i++) { await B.waitForTimeout(250); stopped = await B.evaluate(t => { const q = F0W.play.traps.list.find(x => x.tid === t); return { run: q.run }; }, tid); if (stopped.run === 0) break; } ok(stopped.run === 0, 'Bob sees it stop', stopped);
  // a late joiner
  await B.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMap(); }); await B.waitForTimeout(1500); ok(await go(B), 'Bob comes back later');
  let late = null; for (let i = 0; i < 30 && !late; i++) { await B.waitForTimeout(300); late = await B.evaluate(t => { const q = F0W.play.traps.list.find(x => x.tid === t); return q ? { x: q.x, z: q.z, run: q.run } : null; }, tid); }
  const fin = await A.evaluate(t => { const q = F0W.play.traps.list.find(x => x.tid === t); return { x: q.x, z: q.z }; }, tid);
  ok(late && late.run === 0 && Math.hypot(late.x - fin.x, late.z - fin.z) < 2, 'a late joiner sees it where it stands now', { late, fin });
  await browser.close(); srv.kill(); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})();
