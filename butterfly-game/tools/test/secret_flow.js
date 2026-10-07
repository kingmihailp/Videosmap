// the whole secret chain: hooded trader (27) -> lighthouse (88) -> chalet corner (37) -> journal (01) -> code door -> secret market -> back
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message)); pg.on('console', m => { if (m.type() === 'error') console.log('console.error', m.text().slice(0, 200)); });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1&hour=12');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  const ev = (f, a) => pg.evaluate(f, a), unfade = () => ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; });
  const waitFor = async (f, ms) => { const t0 = Date.now(); while (Date.now() - t0 < ms) { if (await pg.evaluate(f).catch(() => false)) return true; await pg.waitForTimeout(300); } return false; };
  const frags = () => ev(() => Secret.FRAGS.map(f => Secret.has(f.n) ? 1 : 0).join(''));
  await ev(() => { delete Save.data.secret; F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMarket(); }); await pg.waitForTimeout(3500); await unfade(); await ev(() => { F0W.cab.ov = null; });
  ok(await ev(() => F0W.screen === 'cabinet' && F0W.cab.stations.some(s => s.id === 'strange') && F0W.cab.stations.some(s => s.id === 'codedoor')), 'market has the strange stall and the code door');
  // --- 1: the hooded trader
  const st = await ev(() => { const s = F0W.cab.stations.find(s => s.id === 'strange'); const P = F0W.cab.player; P.pos.set(s.x, 0, s.z); P.yaw = Math.PI / 2; P.pitch = -0.05; return [s.x, s.z]; });
  await pg.waitForTimeout(800); await pg.screenshot({ path: '/tmp/sf_stall.png' });
  await pg.keyboard.press('KeyE'); await pg.waitForTimeout(400); ok(await ev(() => F0W.cab.ov === 'talk'), 'E opens the talk with the hooded trader');
  for (let i = 0; i < 12 && (await ev(() => F0W.cab.ov === 'talk')); i++) { await ev(() => { const t = F0W.cab.talk; t.chars = 999; }); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(120); if (i === 3) await pg.screenshot({ path: '/tmp/sf_talk.png' }); }
  ok((await frags()) === '1000', 'fragment 27 received (' + await frags() + ')');
  // --- door: wrong code, then keep for later
  await ev(() => { const s = F0W.cab.stations.find(s => s.id === 'codedoor'); const P = F0W.cab.player; P.pos.set(s.x, 0, s.z + 0.3); P.yaw = 0; P.pitch = -0.1; }); await pg.waitForTimeout(800); await pg.screenshot({ path: '/tmp/sf_door.png' });
  await pg.keyboard.press('KeyE'); await pg.waitForTimeout(300); ok(await ev(() => F0W.cab.ov === 'code'), 'E at the door opens the code lock');
  await pg.keyboard.type('12345678'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(300); ok(!(await ev(() => Secret.unlocked())), 'a wrong code does not open the door'); await pg.screenshot({ path: '/tmp/sf_lock_wrong.png' });
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
  // --- 2: the lighthouse
  await ev(() => { F0W.toMap(); }); await pg.waitForTimeout(300); await ev(() => F0W.start('ocean', 'T9')); await pg.waitForTimeout(5000); await unfade(); await ev(() => { F0W.overlay = null; F0W.locked = true; });
  const lh = await ev(() => { const w = F0W.play.world, pk = w.pickups && w.pickups[0]; if (!pk) return null; const u = [pk.x - w.lhPos.x, pk.z - w.lhPos.z], L = Math.hypot(...u); const P = F0W.play.player; P.pos.x = pk.x + u[0] / L * 1.5; P.pos.z = pk.z + u[1] / L * 1.5; P.yaw = Math.atan2(u[0] / L, u[1] / L); P.pitch = -0.1; return pk.id; });
  ok(lh === 3, 'the ocean lighthouse carries a pickup (fragment 3)'); await pg.waitForTimeout(1200); await pg.screenshot({ path: '/tmp/sf_lighthouse.png' });
  ok(await ev(() => !!F0W.play.pickNear), 'the prompt appears next to the note'); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(500); ok((await frags()) === '1010', 'fragment 88 taken (' + await frags() + ')');
  // --- 3: the chalet room
  await ev(() => { F0W.toMap(); }); await pg.waitForTimeout(300); await ev(() => F0W.enterRoom('chalet', { biome: 'alps', seed: 'T1', at: { x: 0, z: 0, yaw: 0 } })); await pg.waitForTimeout(3000); await unfade();
  await ev(() => { F0W.cab.ov = null; const s = F0W.cab.stations.find(s => s.id === 'frag'); const P = F0W.cab.player; P.pos.set(s.x - 0.2, 0, s.z + 0.5); P.yaw = -0.5; P.pitch = -0.25; }); await pg.waitForTimeout(1000); await pg.screenshot({ path: '/tmp/sf_chalet.png' });
  await pg.keyboard.press('KeyE'); await pg.waitForTimeout(400); ok((await frags()) === '1110', 'fragment 37 taken in the chalet (' + await frags() + ')');
  // --- 4: the journal
  await ev(() => { F0W.toMap(); }); await pg.waitForTimeout(300); await ev(() => { F0W.screen = 'journal'; Screens.journal.tab = BIOMES.length - 1; Screens.journal.sel = BIOMES[BIOMES.length - 1].species.length - 1; }); await pg.waitForTimeout(500);
  await pg.screenshot({ path: '/tmp/sf_journal.png' });
  const fr = await ev(() => { const r = Screens.journal.fragRect, u = document.getElementById('ui').getBoundingClientRect(); return r && [u.left + (r.x + r.w / 2) / SW * u.width, u.top + (r.y + r.h / 2) / SH * u.height]; });
  ok(!!fr, 'the last journal page shows the scrap'); await pg.mouse.click(fr[0], fr[1]); await pg.waitForTimeout(300); ok((await frags()) === '1111', 'fragment 01 taken from the journal (' + await frags() + ')');
  // --- stash
  await ev(() => { F0W.toMarket(); }); await pg.waitForTimeout(3500); await unfade(); await ev(() => { F0W.cab.ov = null; }); await pg.keyboard.press('KeyI'); await pg.waitForTimeout(400); ok(await ev(() => F0W.modal === 'stash'), 'I opens the stash'); await pg.screenshot({ path: '/tmp/sf_stash.png' }); await pg.keyboard.press('Escape'); await pg.waitForTimeout(300);
  // --- the right code
  await ev(() => { const s = F0W.cab.stations.find(s => s.id === 'codedoor'); const P = F0W.cab.player; P.pos.set(s.x, 0, s.z + 0.3); P.yaw = 0; P.pitch = -0.1; }); await pg.waitForTimeout(500);
  await pg.keyboard.press('KeyE'); await pg.waitForTimeout(300); await pg.keyboard.type('27378801'); await pg.waitForTimeout(200); await pg.screenshot({ path: '/tmp/sf_lock_right.png' }); await pg.keyboard.press('Enter'); await waitFor(() => Secret.unlocked() && F0W.cab.ov === null, 30000);
  ok(await ev(() => Secret.unlocked() && F0W.cab.ov === null), 'the right code unlocks the door and the lock closes');
  await waitFor(() => Math.abs(F0W.cab.secretDoor.pivot.rotation.y + 1.75) < 0.05, 40000); await pg.screenshot({ path: '/tmp/sf_door_open.png' });
  await pg.keyboard.press('KeyE'); await waitFor(() => F0W.cab && F0W.cab.constructor.name === 'SecretMarket', 15000); await unfade(); ok(await ev(() => F0W.cab && F0W.cab.constructor.name === 'SecretMarket'), 'E enters the secret market');
  await ev(() => { F0W.cab.ov = null; }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/sf_inside.png' });
  await ev(() => { const P = F0W.cab.player; P.pos.set(0, 0, 4.6); }); await pg.waitForTimeout(400); await pg.keyboard.press('KeyE'); await pg.waitForTimeout(3500); await unfade();
  const back = await ev(() => ({ cls: F0W.cab.constructor.name, x: F0W.cab.player.pos.x, z: F0W.cab.player.pos.z })); ok(back.cls === 'Mkt' && Math.abs(back.x - 18) < 1 && back.z < -29, 'leaving brings you back to the market door ' + JSON.stringify(back));
  await br.close();
})();
