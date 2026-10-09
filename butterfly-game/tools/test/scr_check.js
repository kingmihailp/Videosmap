// the «скритчушка»: only in the ocean (and nothing else there), takes only one flask of pheromones, the mouth opens for a butterfly and closes, breaks after 6 min 66 s with a scream, sold by the strange trader for 2288
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const enter = async (b, sd) => { await pg.evaluate(([b, sd]) => { Save.data.maps = Object.assign({}, Save.data.maps, { ocean: true }); F0W.fade = 0; F0W.fadeTarget = 0; F0W.start(b, sd); }, [b, sd]); for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); } await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; }); };
  // the numbers and the shop
  const d = await pg.evaluate(() => ({ t: Traps.TYPES.scr, hid: Traps.TYPES.scr.secret, inShop: false, rules: [Traps.allowed('scr', 'ocean'), Traps.allowed('scr', 'russia'), Traps.allowed('std', 'ocean'), Traps.allowed('imp', 'russia')], acc: [Traps.accepts('scr', 'hn', 'pheromone'), Traps.accepts('scr', 'hn', 'heather'), Traps.accepts('scr', 'fl', 'lavender'), Traps.accepts('std', 'fl', 'lavender')] }));
  T('2288 coins, lives 6 minutes 66 seconds (426 s)', d.t.price === 2288 && d.t.life === 426, [d.t.price, d.t.life]);
  T('the rules: skrichushka only in the ocean, the others never there; it takes only the pheromones', d.rules[0] === '' && d.rules[1] !== '' && d.rules[2] !== '' && d.rules[3] === '' && d.acc[0] && !d.acc[1] && !d.acc[2] && d.acc[3], d);
  await pg.evaluate(() => { Save.data.coins = 2287; F0W.fade = 0; F0W.fadeTarget = 0; F0W.toSecret(); });
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && !!F0W.cab.openShop).catch(() => false)) break; await pg.waitForTimeout(400); }
  await pg.evaluate(() => { const r = F0W.cab; r.ov = null; r.openShop(); r.setTab(1); }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/scr_shop.png' });
  const s1 = await pg.evaluate(() => { const r = F0W.cab, b = r.shopRows()[1]; r.click(b.x + 3, b.y + 3); return { n: Traps.count('tr', 'scr'), coins: Save.data.coins }; }); T('2287 coins: not sold', s1.n === 0 && s1.coins === 2287, s1);
  const s2 = await pg.evaluate(() => { Save.data.coins = 2300; const r = F0W.cab, b = r.shopRows()[1]; r.click(b.x + 3, b.y + 3); return { n: Traps.count('tr', 'scr'), coins: Save.data.coins, tr: F0W.cab.shopItems().map(i => i.id) }; }); T('the strange trader sells it for 2288', s2.n === 1 && s2.coins === 12 && s2.tr.includes('scr'), s2);
  const s3 = await pg.evaluate(() => { const hid = !Traps.KINDS.tr.list.filter(x => !x.secret).some(x => x.id === 'scr'); return hid; }); T('the ordinary trapper does not sell it', s3);
  // the recorded shriek (the user's own mp3) is embedded, decoded and played when the trap breaks
  const snd = await pg.evaluate(async () => { Snd.init(); for (let i = 0; i < 60 && Snd.scrInfo().state < 2; i++) await new Promise(r => setTimeout(r, 100)); const info = Snd.scrInfo(); let played = 0; const ac0 = Snd; return { info, embedded: typeof SOUND_SKRICHUSHKA_BREAK === 'string' && SOUND_SKRICHUSHKA_BREAK.startsWith('data:audio/mpeg;base64,'), kb: Math.round(SOUND_SKRICHUSHKA_BREAK.length / 1024) }; });
  T('the mp3 is embedded and decodes (2.4 s)', snd.embedded && snd.info.state === 2 && Math.abs(snd.info.dur - 2.424) < 0.1, snd);
  const sp = await pg.evaluate(() => { const AC = window.AudioContext || window.webkitAudioContext, orig = AC.prototype.createBufferSource; let n = 0, dur = 0; AC.prototype.createBufferSource = function () { const s = orig.call(this); n++; const d = Object.getOwnPropertyDescriptor(AudioBufferSourceNode.prototype, 'buffer'); const st = s.start.bind(s); s.start = (...a) => { dur = s.buffer ? s.buffer.duration : 0; return st(...a); }; return s; }; Snd.sfx.scream(); AC.prototype.createBufferSource = orig; return { n, dur }; });
  T('breaking plays the recorded sound (one buffer source of 2.4 s, no synthetic oscillators)', sp.n === 1 && Math.abs(sp.dur - 2.424) < 0.1, sp);
  // in a normal location it cannot be put, in the ocean only it can
  await enter('russia', 'SCR-R'); const r1 = await pg.evaluate(() => { Traps.add('tr', 'scr', 1); const p = F0W.play; const t = p.traps.place('scr'); return { placed: !!t, stock: Traps.count('tr', 'scr') }; }); T('in an ordinary location the skrichushka cannot be put', !r1.placed && r1.stock === 2, r1);
  await enter('ocean', 'SCR-O1');
  const r2 = await pg.evaluate(() => { Traps.add('tr', 'std', 1); const p = F0W.play; const a = p.traps.place('std'); const b = p.traps.place('scr'); return { std: !!a, scr: !!b && b.type === 'scr', list: p.traps.list.map(t => t.type), ground: b ? Math.abs(b.y - p.world.groundAt(b.x, b.z)) < 0.01 : null }; });
  T('in the ocean only the skrichushka can be put (not the standard trap)', !r2.std && r2.scr && r2.ground, r2);
  // bait: only the flask
  const r3 = await pg.evaluate(() => { const p = F0W.play, t = p.traps.list[0]; Traps.add('fl', 'lavender', 1); Traps.add('hn', 'heather', 1); const a = p.traps.bait(t, 'lavender', 'heather'); const o = { refused: !a && !t.fl && !t.hn, stock: [Traps.count('fl', 'lavender'), Traps.count('hn', 'heather')] };
    Traps.UI.openTrap(p, t); o.flowerButtons = Traps.UI.layout().filter(q => /^fl/.test(q.id)).length; Traps.add('hn', 'pheromone', 1); const b = p.traps.bait(t, undefined, 'pheromone'); o.pheromone = b && t.hn === 'pheromone'; o.afterRefuse = p.traps.bait(t, 'lavender', undefined); return o; });
  T('it refuses flowers and honey, and accepts the flask of pheromones; the window has no flower buttons', r3.refused && r3.stock[0] === 1 && r3.stock[1] === 1 && r3.flowerButtons === 0 && r3.pheromone && !r3.afterRefuse, r3);
  // the mouth
  const r4 = await pg.evaluate(() => { const p = F0W.play, S = p.traps, t = S.list[0]; t.life = 99999; const jaws = []; S.spawn(t, p.pool[0]); const f = S.fliers[0].f; let maxOpen = 0, openedBefore = null, closedAfter = null, steps = 0; while (!f.done && steps < 3000) { S.update(0.05); steps++; maxOpen = Math.max(maxOpen, t.open || 0); if (f.s < f.sOut * 0.3) jaws.push(t.open || 0); } const atLand = t.open; for (let i = 0; i < 40; i++) S.update(0.05); return { early: Math.max(0, ...jaws), maxOpen, atLand, later: t.open, items: t.items.length, rot: t.group.userData.jaw.rotation.x }; });
  T('the mouth is shut while the butterfly is far, opens wide when it comes in and shuts again after', r4.early < 0.1 && r4.maxOpen > 0.9 && r4.later < 0.05 && r4.items === 1, r4);
  // wear out with a scream
  const r5 = await pg.evaluate(() => { const p = F0W.play, S = p.traps, t = S.list[0]; window.__sc = 0; const old = Snd.sfx.scream; Snd.sfx.scream = () => { window.__sc++; }; t.life = 426; t.t = 425.9; for (let i = 0; i < 5; i++) S.update(0.1); Snd.sfx.scream = old; return { screams: window.__sc, left: S.list.length }; });
  T('it breaks with a scream and vanishes', r5.screams === 1 && r5.left === 0, r5);
  // the catch is a creature of the ocean's pool, and what was caught can be taken
  const r6 = await pg.evaluate(() => { const p = F0W.play, S = p.traps; Traps.add('tr', 'scr', 1); Traps.add('hn', 'pheromone', 1); p.player.yaw = 2.0; const t = S.place('scr'); S.bait(t, undefined, 'pheromone'); t.life = 99999; for (let i = 0; i < 6000 && t.items.length < 6; i++) S.update(0.25); const ids = new Set(p.pool.map(s => s.id)); const b = Save.data.specimens.length; const n = t.items.length; const out = S.take(t); return { n, outside: t.items.length, got: Save.data.specimens.length - b, taken: out, fromPool: true }; });
  T('it catches the ocean\'s butterflies and the catch can be taken into the cabinet', r6.n >= 6 && r6.got === r6.n && r6.taken === r6.n, r6);
  await pg.screenshot({ path: '/tmp/scr_world.png' });
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5) : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
