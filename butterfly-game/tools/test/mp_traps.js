// multiplayer: traps of other players are seen (their baits and counts, not their contents), only the owner takes the catch, a trap disappears with its owner, a late joiner sees the traps already standing
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
  const go = async pg => { await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('alps'); }); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => F0W.screen === 'play' && !!F0W.play).catch(() => false)) return true; await pg.waitForTimeout(400); } return false; };
  const A = await openOnline('Alice'), B = await openOnline('Bob');
  ok(await go(A) && await go(B), 'both are in the same expedition location');
  await A.evaluate(() => { F0W.overlay = null; Save.data.trap = null; for (const [k, id] of [['tr', 'std'], ['tr', 'str'], ['fl', 'lavender'], ['hn', 'heather']]) Traps.add(k, id, 1); const p = F0W.play; p.player.yaw = 0.2; const t = p.traps.place('std'); window.__tid = t && t.tid; });
  const tid = await A.evaluate(() => window.__tid); ok(!!tid, 'Alice puts a trap', tid);
  let seen = null; for (let i = 0; i < 30 && !seen; i++) { await B.waitForTimeout(300); seen = await B.evaluate(t => { const q = F0W.play.traps.list.find(x => x.tid === t); return q ? { mine: q.mine, type: q.type, owner: q.name, col: F0W.play.world.colliders.some(c => c.trap === t) } : null; }, tid); }
  ok(seen && !seen.mine && seen.type === 'std' && seen.owner === 'Alice' && seen.col, 'Bob sees Alice\'s trap (with her name)', seen);
  await A.evaluate(t => { const p = F0W.play, q = p.traps.list.find(x => x.tid === t); p.traps.bait(q, 'lavender', 'heather'); for (let i = 0; i < 80; i++) p.traps.update(0.5); }, tid);
  let cb = null; for (let i = 0; i < 30; i++) { await B.waitForTimeout(300); cb = await B.evaluate(t => { const q = F0W.play.traps.list.find(x => x.tid === t); return q && { fl: q.fl, hn: q.hn, n: q.n }; }, tid); if (cb && cb.n > 0) break; }
  const cntA = await A.evaluate(t => F0W.play.traps.list.find(x => x.tid === t).items.length, tid);
  ok(cb && cb.fl === 'lavender' && cb.hn === 'heather' && cb.n === cntA && cntA > 0, 'Bob sees the baits and the number of butterflies inside', [cb, cntA]);
  const steal = await B.evaluate(t => { const p = F0W.play, q = p.traps.list.find(x => x.tid === t), before = Save.data.specimens.length; const r = p.traps.take(q); return { r, d: Save.data.specimens.length - before }; }, tid);
  ok(steal.r === 0 && steal.d === 0, 'Bob cannot take the butterflies of Alice\'s trap', steal);
  await B.evaluate(t => { Net.send('trap', { k: 'del', tid: t }); Net.send('trap', { k: 'cnt', tid: t, n: 0 }); }, tid); await B.waitForTimeout(1200);
  const still = await A.evaluate(t => !!F0W.play.traps.list.find(x => x.tid === t), tid); ok(still, 'the server ignores Bob\'s attempts to remove or change it');
  await B.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMap(); }); await B.waitForTimeout(1500); const C = B; ok(await go(C), 'Bob leaves and joins again later (a late joiner)');
  let lateSeen = null; for (let i = 0; i < 30 && !lateSeen; i++) { await C.waitForTimeout(300); lateSeen = await C.evaluate(t => { const q = F0W.play.traps.list.find(x => x.tid === t); return q ? { n: q.n, age: Math.round(q.t) } : null; }, tid); } ok(lateSeen && lateSeen.n === cntA, 'a late joiner sees the standing trap with its count and without its owner having to do anything', lateSeen);
  const got = await A.evaluate(t => { const p = F0W.play, q = p.traps.list.find(x => x.tid === t), b = Save.data.specimens.length; const n = p.traps.take(q, true); return { n, d: Save.data.specimens.length - b }; }, tid);
  ok(got.n === cntA && got.d === cntA, 'Alice takes her catch', got);
  await A.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMap(); }); let gone = false; for (let i = 0; i < 30 && !gone; i++) { await B.waitForTimeout(300); gone = await B.evaluate(t => !F0W.play.traps.list.some(x => x.tid === t), tid); }
  ok(gone, 'the trap goes away when its owner leaves');
  // a vote for a new landscape: everybody agrees; the traps are gone with their catch, nothing is credited
  ok(await go(A), 'Alice comes back'); await A.waitForTimeout(500);
  await A.evaluate(() => { F0W.overlay = null; Traps.add('tr', 'std', 1); const p = F0W.play, t = p.traps.place('std'); t.fl = 'lavender'; t.hn = 'heather'; t.life = 99999; for (let i = 0; i < 4000 && t.items.length < 2; i++) p.traps.update(0.25); window.__spec = Save.data.specimens.length; window.__seed = p.seed; window.__tid2 = t.tid; });
  let seen2 = false; for (let i = 0; i < 30 && !seen2; i++) { await B.waitForTimeout(300); seen2 = await B.evaluate(t => F0W.play.traps.list.some(x => x.tid === t), await A.evaluate(() => window.__tid2)); } ok(seen2, 'Bob sees the new trap');
  await B.evaluate(() => { window.__seedB = F0W.play.seed; }); await A.waitForTimeout(15500); await A.evaluate(() => Net.send('regen')); for (let i = 0; i < 40 && !(await B.evaluate(() => Chat.vbtns.length > 0)); i++) await B.waitForTimeout(500);
  await B.evaluate(() => { const b = Chat.vbtns.find(q => q.id === 'yes'); Chat.voteClick(b.x + 2, b.y + 2); });
  let sa = null; for (let i = 0; i < 90; i++) { await A.waitForTimeout(500); sa = await A.evaluate(() => (F0W.play && F0W.screen === 'play') ? F0W.play.seed : null).catch(() => null); const sb = await B.evaluate(() => (F0W.play && F0W.screen === 'play') ? F0W.play.seed : null).catch(() => null); if (sa && sb && sa !== (await A.evaluate(() => window.__seed).catch(() => sa)) && sa === sb) break; }
  const ra = await A.evaluate(() => ({ traps: F0W.play.traps.list.length, credited: Save.data.specimens.length - window.__spec, newSeed: F0W.play.seed !== window.__seed })), rb = await B.evaluate(() => ({ traps: F0W.play.traps.list.length, newSeed: F0W.play.seed !== window.__seedB }));
  ok(ra.newSeed && rb.newSeed && ra.traps === 0 && rb.traps === 0 && ra.credited === 0, 'after the vote the trap is gone for both and its catch is not credited', [ra, rb]);
  await browser.close(); srv.kill(); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})();
