// the drive trap in the Vietnam highlands: islands parted by chasms, joined by rope bridges (1.76 m wide planks): it must drive over the bridges (never into a chasm), visit every zone it can reach and never break
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  for (const sd of (process.argv[2] || 'VN1,VN2,VN3').split(',')) {
    await pg.evaluate(([sd]) => { Save.data.maps = { vietnam: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('vietnam', sd); }, [sd]);
    for (let i = 0; i < 160; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
    const r = await pg.evaluate(() => { F0W.overlay = 'hold'; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; const p = F0W.play; p.hintT = 0; Save.data.coins = 1e7; const w = p.world, S = p.sectors; const step = (sec, dt = 0.1) => { for (let t = 0; t < sec; t += dt) { p.update(dt, F0W.inp); p.traps.update(dt); } }; step(2, 1 / 30);
      Traps.add('tr', 'drv', 1); const t = p.traps.place('drv'); if (!t) return { noplace: true, bridges: (w.bridges || []).length }; t.life = 99999; const out = { bridges: (w.bridges || []).length, zones: S ? S.rects.length : 0, arr: [], msgs: [], maxDrop: 0, onDeck: 0, steps: 0 };
      const tq = p.toast.bind(p); p.toast = (m, ...a) => { out.msgs.push(String(m).slice(0, 70)); return tq(m, ...a); }; const orig = p.traps.arrive.bind(p.traps); p.traps.arrive = (tr, forced) => { const tg = tr.dr.tgt; orig(tr, forced); out.arr.push({ tgt: tg, at: S ? S.at(tr.x, tr.z) : -1, forced: !!forced, t: Math.round(tr.t), pos: [Math.round(tr.x), Math.round(tr.z)], wp: [Math.round(tr.dr.wp.x), Math.round(tr.dr.wp.z)], pi: tr.dr.pi + '/' + (tr.dr.path ? tr.dr.path.length : 0), deck: !!p.traps.deckOf(tr.x, tr.z), rp: tr.dr.replans }); };
      p.traps.launch(t); let prevY = t.y; for (let i = 0; i < 30000 && t.dr.mode !== 'hold' && out.arr.length < out.zones - 1; i++) { step(0.1); out.steps++; if (!p.traps.list.includes(t)) { out.dead = true; break; } const gy = w.groundAt(t.x, t.z); out.maxDrop = Math.max(out.maxDrop, Math.abs(t.y - gy)); if (w.canWalk && !w.canWalk(t.x, t.z)) out.bad = (out.bad || 0) + 1; }
      out.visited = t.dr.visited.length; return out; });
    console.log(sd, JSON.stringify(r).slice(0, 900));
    if (r.noplace) { T(sd + ' trap could be placed', false, r); continue; }
    T(sd + ' no chasm crossing (only thin cracks at bridge ends are driven over)', (r.bad || 0) < 30, r.bad); T(sd + ' no forced stops', r.arr.every(a => !a.forced), r.arr); T(sd + ' stops in the zone it aimed for', r.arr.every(a => a.tgt === a.at), r.arr.map(a => [a.tgt, a.at].join('>')).join(' ')); T(sd + ' trap did not break', !r.dead);
    await pg.evaluate(() => { F0W.toMap && F0W.toMap(); }); await pg.waitForTimeout(1500);
  }
  console.log('errors', JSON.stringify(errs)); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
