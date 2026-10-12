// multiplayer: one landscape (seed, sectors, species per sector) for everybody; nobody can ask for a new one (the old «regen» request does nothing, no vote);
// the server generates every place anew by itself every hour (here: REGEN_MS=30 s): everybody gets the same new seed, the own traps vanish with their catch
const path = require('path'); const fs = require('fs'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3700 + Math.floor(Math.random() * 400), SRV = path.resolve(__dirname, '../../server');
try { fs.rmSync(path.join(SRV, 'data'), { recursive: true, force: true }); } catch (e) {}
let bad = 0; const ok = (c, m, x) => { if (!c) bad++; console.log((c ? 'PASS ' : 'FAIL ') + m, x === undefined ? '' : JSON.stringify(x)); };
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe', env: Object.assign({}, process.env, { REGEN_MS: '200000' }) }); let log = ''; srv.stdout.on('data', d => { log += d; }); srv.stderr.on('data', d => process.stdout.write('[srv-err] ' + d)); await new Promise(r => setTimeout(r, 1200));
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const open = async name => { const ctx = await browser.newContext({ viewport: { width: 320, height: 180 } }); const pg = await ctx.newPage(); pg.on('pageerror', e => console.log('[pageerror ' + name + ']', e.message));
    await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${name}`, { timeout: 240000 }); for (let i = 0; i < 40; i++) { if (await pg.evaluate(() => Net.on).catch(() => false)) break; await pg.waitForTimeout(400); } return pg; };
  const openOnline = async name => { for (let k = 0; k < 4; k++) { const pg = await open(name); if (await pg.evaluate(() => Net.on).catch(() => false)) return pg; await pg.close().catch(() => {}); } throw new Error(name + ' never got online'); };
  const go = async pg => { await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.start('alps'); }); for (let i = 0; i < 1000; i++) { if (await pg.evaluate(() => F0W.screen === 'play' && !!F0W.play).catch(() => false)) break; await pg.waitForTimeout(400); } await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; }); return pg.evaluate(() => F0W.screen === 'play' && !!F0W.play).catch(() => false); };
  const info = pg => pg.evaluate(() => { const p = F0W.play; return p && p.sectors ? { seed: p.seed, host: p.isHost, left: Math.round(p.regenLeft()), lay: JSON.stringify(p.sectors.rects.map(r => [r.x0, r.z0, r.x1, r.z1, r.sp.map(s => s.id)])), flies: p.flies.length, home: p.flies.filter(f => p.sectors.at(f.pos.x, f.pos.z) === f.home).length, species: new Set(p.flies.map(f => f.sp.base || f.sp.id)).size, traps: p.traps.list.length, screen: F0W.screen } : null; });
  const A = await openOnline('Alice'), B = await openOnline('Bob');
  const gg = await Promise.all([go(A), go(B)]); ok(gg[0] && gg[1], 'both are in the same place');
  const a0 = await info(A), b0 = await info(B);
  ok(a0.seed === b0.seed && a0.lay === b0.lay, 'one landscape for both: the same seed, the same sectors and the same species per sector', [a0.seed, b0.seed]);
  ok(a0.host !== b0.host && a0.left > 0 && a0.left <= 200 && b0.left > 0 && b0.left <= 200, 'both know the time to the next regeneration (set by the server); exactly one leads the butterflies', [a0.left, b0.left, a0.host, b0.host]);
  ok(a0.species >= 28 && b0.flies === a0.flies && a0.home >= a0.flies * 0.9, 'the whole fauna (31 species) lives there; the host leads it, the other sees the same butterflies', [a0.flies, b0.flies, a0.species, a0.home]);
  // a trap with a catch (Alice)
  await A.evaluate(() => { Traps.add('tr', 'std', 1); const p = F0W.play, t = p.traps.place('std'); t.fl = 'lavender'; t.hn = 'heather'; t.life = 99999; for (let i = 0; i < 4000 && t.items.length < 2; i++) p.traps.update(0.25); window.__spec = Save.data.specimens.length; window.__seed = F0W.play.seed; window.__items = t.items.length; });
  await B.evaluate(() => { window.__seedB = F0W.play.seed; });
  // nobody can ask for a new landscape any more
  await A.evaluate(() => Net.send('regen')); await A.evaluate(() => Net.send('voteReply', { vid: 1, ok: true })); await A.waitForTimeout(2500);
  const a1 = await info(A), b1 = await info(B); ok(a1 && b1 && a1.seed === a0.seed && b1.seed === a0.seed, 'the old «regen» request does nothing: no vote, the landscape stays', [a1 && a1.seed, b1 && b1.seed]);
  ok(await A.evaluate(() => Net.vote === undefined) && !(await A.evaluate(() => typeof Chat.drawVote === 'function')), 'the vote is gone from the client');
  // Bob leaves and comes back inside the period: the same landscape (a lone player no longer gets a new one)
  await B.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('cabinet'); }); await B.waitForTimeout(1500); await B.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMap && F0W.toMap(); });
  // the server renews by itself
  let sa = a0.seed, sb = a0.seed; for (let i = 0; i < 700 && (sa === a0.seed || !sb || sb === a0.seed); i++) { await A.waitForTimeout(500); sa = await A.evaluate(() => (F0W.play && F0W.screen === 'play') ? F0W.play.seed : null).catch(() => null) || a0.seed; sb = await B.evaluate(() => (F0W.play && F0W.screen === 'play') ? F0W.play.seed : null).catch(() => null); if (!sb && i === 30) { await go(B); } }
  for (let i = 0; i < 900; i++) { const x = await info(A).catch(() => null), y = await info(B).catch(() => null); if (x && y && x.seed === y.seed && x.seed !== a0.seed) break; await A.waitForTimeout(500); }       // both worlds are built (slow here: software GL)
  const a2 = await info(A); const spec2 = await A.evaluate(() => Save.data.specimens.length), cred = spec2 - await A.evaluate(() => window.__spec);
  ok(a2 && a2.seed !== a0.seed, 'after the period the server generated a new landscape by itself: Alice is in it', [a0.seed, a2 && a2.seed]);
  ok(a2 && a2.traps === 0 && cred === 0, 'her trap is gone with its catch: nothing is credited', [a2 && a2.traps, cred]);
  const b2 = await info(B); ok(b2 && a2 && b2.seed === a2.seed && b2.lay === a2.lay && a2.lay !== a0.lay, 'Bob gets the same new landscape and sectors; the layout changed', [b2 && b2.seed]);
  ok(a2.left > 25 && b2.left > 20, 'the new landscape has its own full period', [a2.left, b2.left]);
  ok(/new landscape: alps .*\(1 hour\)/.test(log) && !/vote/.test(log), 'the server log: regenerated by the timer', log.split('\n').filter(l => /landscape/.test(l)).slice(-2));
  await browser.close(); srv.kill(); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})();
