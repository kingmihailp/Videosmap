// the enthusiast's gear in a location: every part, attachment and the cannon, plus the effects (shock, reach, lure, lunge, slow, loud, aberrations, IR, auto, map)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error') errs.push('console: ' + m.text()); });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&lite&biome=russia&seed=T1&hour=12');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  const ev = (f, a) => pg.evaluate(f, a); let fails = 0; const ok = (name, cond, extra = '') => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!cond) fails++; };
  await ev(() => { F0W.overlay = 'hold'; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; window.p = F0W.play; p.hintT = 0; Save.data.coins = 5000000; });
  // helpers inside the page
  await ev(() => {
    window.equip = cfg => { const L = Save.netList(); let n = L.find(q => q.tag === 'T'); if (n) L.splice(L.indexOf(n), 1); n = Object.assign({ uid: (Save.data.netUid = (Save.data.netUid || 1) + 1), tag: 'T', g: [] }, cfg); L.push(n); Save.data.netEq = n.uid; p.buildNet(); step(0.25); return n; };
    window.park = (f, dist, side = 0, dy = -0.35) => { const cam = p.camera, fw = new THREE.Vector3(-Math.sin(p.player.yaw), 0, -Math.cos(p.player.yaw)), rt = new THREE.Vector3(Math.cos(p.player.yaw), 0, -Math.sin(p.player.yaw)); f.beh = Object.assign({}, f.beh, { speed: 0, wary: 0.1 }); f.state = 1; f.t = 99; f.flower = null; f.pos.copy(cam.position).addScaledVector(fw, dist).addScaledVector(rt, side); f.pos.y += dy; f.tgt.copy(f.pos); f.mesh.visible = true; };
    window.reset = () => { window.catchBase = p.stats.catches; for (const f of p.flies) { if (f.state === CAUGHT) { f.state = 1; f.t = 99; } f.irT = 0; } p.net.phase = -1; p.net.cd = 0; if (p.gear) { p.gear.cd = 0; } };
    window.step = (sec, dt = 1 / 30) => { for (let t = 0; t < sec; t += dt) { p.update(dt, F0W.inp); if (p.traps) p.traps.update(dt); } };
    window.fwd = () => new THREE.Vector3(-Math.sin(p.player.yaw), 0, -Math.cos(p.player.yaw));
  });
  const gw = ms => ev(ms => { if (window.wantFire) { F0W.inp.fire = true; window.wantFire = false; } step(ms / 1000); }, ms);      // the simulation is stepped by hand (the software GL renders a frame in seconds)
  const caught = () => ev(() => p.stats.catches - window.catchBase > 0), nCaught = () => ev(() => p.stats.catches - window.catchBase);      // a caught butterfly is consumed and respawns far away, so count the catches
  await ev(() => step(2.5));
  // ---------- 0. the basic net still catches
  await ev(() => { equip({ h: 'h_basic', r: 'r_basic', m: 'm_basic' }); reset(); park(p.flies[0], 1.7, -0.1); window.wantFire = true;  }); await gw(1800);
  ok('basic net catches', await caught(0));
  // ---------- 1. the shocker hoop: a catch shocks the neighbours
  await ev(() => { reset(); equip({ h: 'h_basic', r: 'r_shock', m: 'm_basic' }); park(p.flies[0], 1.7, -0.1); for (let i = 1; i <= 4; i++) { park(p.flies[i], 3 + i, (i % 2 ? 1 : -1) * 1.5, 0); } window.wantFire = true;  }); await gw(1800);
  const sh = await nCaught(); ok('shocker catches the neighbours', sh >= 4, sh + ' of 5');
  await ev(() => { reset(); equip({ h: 'h_basic', r: 'r_basic', m: 'm_basic' }); park(p.flies[0], 1.7, -0.1); park(p.flies[1], 3.4, 1, 0); window.wantFire = true;  }); await gw(1800);
  { const n = await nCaught(); ok('plain hoop does not shock', n === 1, n + ' caught'); }
  // ---------- 2. the mechanised handle reaches further
  const reach = async (cfg, d) => { await ev(([cfg, d]) => { reset(); equip(cfg); for (let i = 1; i < 8; i++) { p.flies[i].pos.set(9999, 50, 9999); p.flies[i].mesh.visible = false; } park(p.flies[0], d, 0, 0); window.wantFire = true;  }, [cfg, d]); await gw(1900); const c = await caught(0); await ev(() => { for (let i = 1; i < 8; i++) p.flies[i].mesh.visible = true; }); return c; };
  ok('basic net does not reach 3.6 m', !(await reach({ h: 'h_basic', r: 'r_basic', m: 'm_basic' }, 3.6)));
  ok('mech handle reaches 3.6 m', await reach({ h: 'h_mech', r: 'r_basic', m: 'm_basic' }, 3.6));
  ok('mech handle reaches 4.2 m (≈280% of the usual)', await reach({ h: 'h_mech', r: 'r_basic', m: 'm_basic' }, 4.2));
  ok('mech handle does not reach 6.5 m', !(await reach({ h: 'h_mech', r: 'r_basic', m: 'm_basic' }, 6.5)));
  // ---------- 3. the piston handle lunges
  const lg = await ev(() => { reset(); equip({ h: 'h_piston', r: 'r_basic', m: 'm_basic' }); const P = p.player, x0 = P.pos.x, z0 = P.pos.z; for (let i = 0; i < 8; i++) p.flies[i].mesh.visible = false; F0W.inp.fire = true; step(0.9); return Math.hypot(P.pos.x - x0, P.pos.z - z0); }); ok('piston handle lunges forward', lg > 1.2, lg.toFixed(2) + ' m');
  const nolg = await ev(() => { reset(); equip({ h: 'h_basic', r: 'r_basic', m: 'm_basic' }); const P = p.player, x0 = P.pos.x, z0 = P.pos.z; F0W.inp.fire = true; step(0.9); return Math.hypot(P.pos.x - x0, P.pos.z - z0); }); ok('basic handle does not lunge', nolg < 0.3, nolg.toFixed(2) + ' m');
  await ev(() => { for (let i = 0; i < 8; i++) p.flies[i].mesh.visible = true; });
  // ---------- 4. the tungsten parts: speed, slow, noise, aberrations
  const st = await ev(() => ({ m: NetParts.stats({ h: 'h_basic', r: 'r_basic', m: 'm_tung' }), r: NetParts.stats({ h: 'h_basic', r: 'r_tung', m: 'm_basic' }), h: NetParts.stats({ h: 'h_tung', r: 'r_basic', m: 'm_basic' }), all: NetParts.stats({ h: 'h_tung', r: 'r_tung', m: 'm_tung' }) }));
  ok('tungsten mesh: 25% aberrant, slower swing', Math.abs(st.m.ab - 0.25) < 1e-9 && st.m.speed < 1, JSON.stringify([st.m.ab, st.m.speed]));
  ok('tungsten hoop: 25% aberrant, louder', Math.abs(st.r.ab - 0.25) < 1e-9 && st.r.loud > 0, JSON.stringify([st.r.ab, st.r.loud]));
  ok('tungsten handle: 50% aberrant, slows the owner', Math.abs(st.h.ab - 0.5) < 1e-9 && st.h.slow > 0, JSON.stringify([st.h.ab, st.h.slow]));
  ok('all tungsten adds up (100% capped at 95%)', st.all.ab <= 0.95 && st.all.ab > 0.9, String(st.all.ab));
  const spd = await ev(() => { equip({ h: 'h_basic', r: 'r_basic', m: 'm_basic' }); const a = p.netStats.slow; equip({ h: 'h_tung', r: 'r_basic', m: 'm_basic' }); return [a, p.netStats.slow]; }); ok('slow applies only with the tungsten handle', spd[0] === 0 && spd[1] > 0, JSON.stringify(spd));
  const rate = async cfg => ev(cfg => { equip(cfg); let n = 0, tot = 0; const sp = SPECIES.find(s => Aberr.eligible(s)); for (let i = 0; i < 600; i++) { const r = Aberr.roll(sp, p.netStats.ab); tot++; if (r.ab || r.id !== sp.id) n++; } return n / tot; }, cfg);
  const r0 = await rate({ h: 'h_basic', r: 'r_basic', m: 'm_basic' }), r1 = await rate({ h: 'h_tung', r: 'r_basic', m: 'm_basic' }), r2 = await rate({ h: 'h_basic', r: 'r_basic', m: 'm_tung' });
  ok('aberrant rate: basic ~0, handle ~50%, mesh ~25%', r0 < 0.02 && Math.abs(r1 - 0.5) < 0.09 && Math.abs(r2 - 0.25) < 0.08, [r0, r1, r2].map(x => x.toFixed(2)).join(' / '));
  const noise = await ev(() => { const k = cfg => { equip(cfg); p.player.swingNoise = 0; return p.netStats.loud; }; return [k({ h: 'h_basic', r: 'r_basic', m: 'm_basic' }), k({ h: 'h_basic', r: 'r_tung', m: 'm_basic' })]; }); ok('noise multiplier from the tungsten hoop', noise[0] === 0 && noise[1] > 0, JSON.stringify(noise));
  // ---------- 5. the pheromone rope bag lures butterflies close
  const lure = cfg => ev(cfg => { reset(); equip(cfg); const P = p.player, f = p.flies[0]; f.state = 0; f.kind = f.kind; f.pos.set(P.pos.x + 9, P.pos.y + 1.2, P.pos.z); f.mesh.visible = true; let sum = 0, n = 0; for (let i = 0; i < 60; i++) { f.state = 0; f.pos.set(P.pos.x + 9, P.pos.y + 1.2, P.pos.z); f.pickTarget(); sum += Math.hypot(f.tgt.x - P.pos.x, f.tgt.z - P.pos.z); n++; } return sum / n; }, cfg);
  const dBase = await lure({ h: 'h_basic', r: 'r_basic', m: 'm_basic' }), dPher = await lure({ h: 'h_basic', r: 'r_basic', m: 'm_pher' });
  ok('pheromone net: butterflies choose targets near the net', dPher < dBase - 2, `${dBase.toFixed(1)} m vs ${dPher.toFixed(1)} m`);
  // ---------- 6. attachments: the infrared scanner marks butterflies, auto swings by itself, the map draws
  await ev(() => { reset(); equip({ h: 'h_basic', r: 'r_basic', m: 'm_basic', g: ['g_ir', 'g_map', 'g_auto'] }); const P = p.player; p.flies.slice(0, 6).forEach((f, i) => { f.state = 1; f.t = 99; f.beh = Object.assign({}, f.beh, { speed: 0 }); const a = i * 1.047; f.pos.set(P.pos.x + Math.cos(a) * (14 + i * 4), P.pos.y + 1.5, P.pos.z + Math.sin(a) * (14 + i * 4)); f.tgt.copy(f.pos); f.mesh.visible = true; }); p.gear.ir.cd = 0.05; });
  await gw(900); await ev(() => { F0W.overlay = null; }); await pg.waitForTimeout(1500); await pg.screenshot({ path: '/tmp/gp_ir_mid.png' }); await ev(() => { F0W.overlay = 'hold'; }); await gw(1500);
  const irm = await ev(() => p.flies.slice(0, 6).filter(f => f.irT > 0).length); ok('IR scanner lights the butterflies it passes', irm >= 4, irm + ' of 6'); await ev(() => { F0W.overlay = null; }); await pg.waitForTimeout(1500); await pg.screenshot({ path: '/tmp/gp_ir_marks.png' }); await ev(() => { F0W.overlay = 'hold'; });
  const cd = await ev(() => [p.gear.ir.cd, p.gear.ir.t]); await gw(11000); const again = await ev(() => p.gear.ir.t >= 0 || p.gear.ir.cd < 9.9); ok('IR scanner fires again after ~10 s', again);
  await ev(() => { for (const f of p.flies) f.irT = 0; });
  await ev(() => { reset(); for (const f of p.flies) { f.pos.set(9999, 50, 9999); f.tgt.copy(f.pos); } p.gear.auto = false; });
  await ev(() => { reset(); park(p.flies[0], 1.6, 0, -0.3); }); await gw(1500); ok('auto off: nothing swings', !(await caught(0)));
  await ev(() => { reset(); Gear.toggleAuto(p); park(p.flies[0], 1.6, 0, -0.3); }); await gw(2600); const autoOn = await ev(() => p.gear.auto); ok('auto on: swings by itself', autoOn && await caught(0));
  await ev(() => { Gear.toggleAuto(p); }); ok('auto toggles back off', !(await ev(() => p.gear.auto)));
  await ev(() => { F0W.overlay = null; }); await pg.waitForTimeout(1500); await pg.screenshot({ path: '/tmp/gp_hud.png' }); await ev(() => { F0W.overlay = 'hold'; });
  // ---------- 7. the cannon
  await ev(() => { reset(); const n = Save.buyCannon(); window.cn = n; equip.call(null, {}); });
  await ev(() => { Save.data.netEq = Save.netList().find(n => n.cannon).uid; p.buildNet(); reset(); for (const f of p.flies) { f.mesh.visible = true; } });
  ok('cannon net equipped', await ev(() => p.netStats.cannon));
  await ev(() => { for (let i = 1; i < 8; i++) { p.flies[i].pos.set(9999, 50, 9999); p.flies[i].tgt.copy(p.flies[i].pos); } park(p.flies[0], 14, 0.3, -0.2); park(p.flies[1], 20, -0.5, 0.2); window.wantFire = true;  });
  await gw(350); await ev(() => { F0W.overlay = null; }); await pg.waitForTimeout(1500); await pg.screenshot({ path: '/tmp/gp_cannon_out.png' }); await ev(() => { F0W.overlay = 'hold'; });
  await gw(1700); const cn1 = await nCaught(); ok('cannon net catches far butterflies', cn1 >= 2, cn1 + ' of 2');
  await gw(2500); const cn2 = await ev(() => [!!p.gear.shot, p.gear.cd]); ok('cannon net is pulled back and gone', !cn2[0], JSON.stringify(cn2));
  await ev(() => { reset(); window.wantFire = true;  }); await gw(200); await ev(() => { window.wantFire = true; }); await gw(50); const cdn = await ev(() => p.gear.cd); ok('cannon has a recharge', cdn > 1.2, cdn.toFixed(2));
  console.log('errors', JSON.stringify(errs)); await br.close(); process.exit(fails || errs.length ? 1 : 0);
})();
