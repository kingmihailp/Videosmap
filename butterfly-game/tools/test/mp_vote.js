// multiplayer: a new landscape in a location with several players needs everybody's consent (a vote card with Yes / No)
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
  ok(await go(A) && await go(B), 'both are in the same place');
  const seedOf = pg => pg.evaluate(() => F0W.play && F0W.play.seed), vote = pg => pg.evaluate(() => Net.vote && { by: Net.vote.by, yes: Net.vote.yes, need: Net.vote.need, mine: Net.vote.mine });
  const s0 = await seedOf(A); ok(s0 && s0 === await seedOf(B), 'same landscape', s0);
  // 1. Alice proposes, Bob refuses
  await A.evaluate(() => Net.send('regen')); await B.waitForTimeout(1500);
  const vb = await vote(B); ok(vb && vb.by === 'Alice' && vb.need === 2 && vb.yes === 1, 'Bob sees the vote card', vb);
  ok((await vote(A)).mine === 'yes', 'the proposer has already voted yes');
  await B.keyboard.press('KeyN'); await B.waitForTimeout(1500);
  ok(!(await vote(A)) && !(await vote(B)) && await seedOf(A) === s0, 'a refusal ends the vote, the landscape stays');
  // 2. again, Bob agrees (the click path: the card's button)
  await A.waitForTimeout(15500); await A.evaluate(() => Net.send('regen')); await B.waitForTimeout(1500);
  await B.evaluate(() => { const b = Chat.vbtns.find(q => q.id === 'yes'); window.__hit = Chat.voteClick(b.x + 2, b.y + 2); });
  ok(await B.evaluate(() => window.__hit === true), 'the Yes button of the card is clickable');
  let sa = s0, sb = s0; for (let i = 0; i < 80 && (sa === s0 || sb === s0 || sa !== sb); i++) { await A.waitForTimeout(500); sa = await seedOf(A).catch(() => s0); sb = await seedOf(B).catch(() => s0); }
  ok(sa !== s0 && sa === sb, 'everybody agreed: both get the same new landscape', [s0, sa, sb]);
  // 3. a vote nobody answers runs out
  await A.waitForTimeout(15500); await A.evaluate(() => Net.send('regen')); await A.waitForTimeout(31500);
  ok(!(await vote(A)) && !(await vote(B)) && await seedOf(A) === sa, 'an unanswered vote times out');
  await browser.close(); srv.kill(); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})();
