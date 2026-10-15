// night location: moths replace the butterflies, are visible only in the beam of a lamp, can be caught only when lit; shots -> scratchpad
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const SH = '/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/np_';
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&night'); await pg.waitForTimeout(2500);
  const start = async (id, lamp) => { await pg.evaluate(([id, lamp]) => { Save.data.trap = { tr: {}, fl: {}, hn: {}, lp: lamp ? { [lamp]: 1 } : {} }; Save.data.maps = Object.fromEntries(BIOMES.map(b => [b.id, true])); F0W.fade = 0; F0W.fadeTarget = 0; F0W.screen = 'title'; F0W.start(id, 'NP1'); }, [id, lamp]);
    for (let i = 0; i < 200; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
    await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; }); await pg.waitForTimeout(1200); };
  await start('russia', null);
  const a = await pg.evaluate(() => { const p = F0W.play; return { night: p.world.night, moths: p.flies.length && p.flies.every(f => f.sp.moth), n: p.flies.length, species: p.pool.length, allMoth: p.pool.every(s => s.moth), name: p.biome.name, lamp: p.lamp, vis: p.flies.filter(f => f.mesh.visible).length }; });
  T('a night location: the moths of the location replace the butterflies (31 species)', a.night && a.allMoth && a.species === 31 && a.moths, a);
  T('without a lamp no moth is visible', a.vis <= 1, a.vis);
  await pg.screenshot({ path: SH + 'nolamp.png' });
  for (const lamp of ['torch', 'head']) {
    await start('russia', lamp);
    const r = await pg.evaluate(async lamp => { const p = F0W.play, P = p.player; const frames = (n = 4) => new Promise(r => { const t0 = p.t; const iv = setInterval(() => { if (p.t - t0 > n * 0.017) { clearInterval(iv); r(); } }, 40); }); const f = p.flies.find(f => f.state !== 3); const out = { lamp: p.lamp, flash: !!p.flash, hands: p.lampHands };
      // put a moth in front of the player, in the beam, and freeze it; then look away
      f.speedK = 0; f.state = 0; f.perchTarget = false; const fw = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw)); f.pos.copy(p.camera.position).addScaledVector(fw, 5); f.pos.y = p.camera.position.y - 0.2; f.tgt.copy(f.pos); f.vel.set(0, 0, 0);
      await frames(); out.litSeen = f.mesh.visible && p.lit(f.pos);
      P.yaw += Math.PI * 0.6; await frames(); out.hiddenAway = !f.mesh.visible; P.yaw -= Math.PI * 0.6; await frames();
      f.pos.copy(p.camera.position).addScaledVector(fw, 5); f.pos.y = p.camera.position.y - 0.2; f.tgt.copy(f.pos); f.vel.set(0, 0, 0); await frames(); out.visibleAgain = f.mesh.visible;
      window.__f = f; return out; }, lamp);
    const nf = await pg.evaluate(async () => { const p = F0W.play, P = p.player; const frames = (n = 4) => new Promise(r => { const t0 = p.t; const iv = setInterval(() => { if (p.t - t0 > n * 0.017) { clearInterval(iv); r(); } }, 40); });
      const f = new Fly(p, p.pool[3], false); p.flies.push(f); f.speedK = 0; const fw = new THREE.Vector3(-Math.sin(P.yaw), 0, -Math.cos(P.yaw)); const place = () => { f.pos.copy(p.camera.position).addScaledVector(fw, 4); f.pos.y = p.camera.position.y; f.tgt.copy(f.pos); f.vel.set(0, 0, 0); };
      place(); const born = f.mesh.visible; await frames(); place(); await frames(); return { born, seen: f.mesh.visible }; });
    T(lamp + ': a freshly born moth is hidden, and shows up when the beam falls on it', nf.born === false && nf.seen === true, nf);
    T(lamp + ': a moth is seen in the beam and gone out of it', r.flash && r.litSeen && r.hiddenAway && r.visibleAgain, r);
    await pg.screenshot({ path: SH + lamp + '.png' });
    const sw = await pg.evaluate(async () => { const p = F0W.play; p.net.cd = 0; const before = p.net.phase; p.swing(); await new Promise(r => setTimeout(r, 120)); return { phase: p.net.phase, hands: p.lampHands, on: p.flashOn }; });
    T(lamp + ': the net ' + (lamp === 'torch' ? 'cannot be swung while the torch burns (hands busy)' : 'can be swung with the lamp on'), lamp === 'torch' ? sw.phase < 0 : sw.phase >= 0, sw);
  }
  // the net gadget "Flashlight": a net with it gives the lamp 'net' (hands free, no other lamp needed)
  await pg.evaluate(() => { Save.data.nets = []; Save.data.coins = 900000; Save.buyGadget('g_torch'); Save.buyPart('h_mech'); const n = Save.assembleNet({ h: 'h_mech', r: 'r_basic', m: 'm_basic' }); Save.attachGadget(n.uid, 'g_torch'); Save.data.netEq = n.uid; });
  await start('russia', null); await pg.evaluate(() => { Save.data.netEq = Save.data.netEq; });
  const ng = await pg.evaluate(() => { const p = F0W.play; return { lamp: p.lamp, hands: p.lampHands, torchStat: !!p.netStats.torch, flash: !!p.flash }; });
  T('the net gadget Flashlight lights the night location (hands free)', ng.lamp === 'net' && !ng.hands && ng.flash, ng);
  await pg.evaluate(() => { Save.data.netEq = 0; });
  // catching: only a moth the beam shows can be netted (checkCatch needs a visible fly); a lit moth in the hoop is caught and goes to the journal
  await start('russia', 'head');
  const cg = await pg.evaluate(async () => { const p = F0W.play, P = p.player, v = new THREE.Vector3(); const frames = n => new Promise(r => { const t0 = p.t; const iv = setInterval(() => { if (p.t - t0 > n * 0.017) { clearInterval(iv); r(); } }, 40); });
    const f = p.flies.find(f => f.state !== 3); f.beh = Object.assign({}, f.beh, { speed: 0, wary: 0.1 }); const sp = f.sp.id, yaw0 = P.yaw;
    const inHoop = () => { p.hoopWorld(v); f.state = 1; f.t = 99; f.flower = null; f.vel.set(0, 0, 0); f.pos.copy(v); f.tgt.copy(v); };
    p.flashOn = false; await frames(4); inHoop(); await frames(3); inHoop(); const hidden = !f.mesh.visible; p._hpOn = false; p.checkCatch(); const dark = Save.has(sp);      // the lamp is off: the moth is in the hoop but unseen
    p.flashOn = true; await frames(4); inHoop(); await frames(3); inHoop(); const seen = f.mesh.visible; p._hpOn = false; p.checkCatch(); await frames(4);
    return { hidden, dark, seen, has: Save.has(sp), moth: SPECIES_BY_ID[sp].moth, place: Save.data.caught[sp] && Save.data.caught[sp].place, countHere: Save.biomeCount(p.biome) }; });
  T('an unseen moth is not caught; a lit one in the hoop is caught and recorded in the journal', cg.hidden && !cg.dark && cg.seen && cg.has && cg.moth && cg.place === 'russia' && cg.countHere >= 1, cg);
  T('no errors', errs.length === 0, errs.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
