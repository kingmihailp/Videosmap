// the cabinet: E works on the one place the player looks at (wall, desk top, drawer)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const SH = process.env.SHOTS || '/tmp';
  await pg.evaluate(() => { Save.data.seenCab = true; Save.data.boxes.length = 0; Save.data.specimens = [];
    const pool = SPECIES.filter(s => !s.mystery && !s.ab && s.biome !== 'ocean'); let k = 0; for (const z of ['S', 'M', 'L', 'S', 'S', 'M']) { const b = Save.addBox(z, k % 3); for (let j = 0; j < Save.CAP[z]; j++) { const sp = pool[(k * 5 + j * 3) % pool.length]; Save.add(sp.id, sp.biome); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.q = 80; s.pose = JSON.parse(JSON.stringify(Art.IDEAL)); s.box = b.uid; b.items[j] = s.uid; } k++; }
    F0W.fade = 0; F0W.fadeTarget = 0; F0W.toCabinet(); });
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && F0W.cab.constructor.name === 'Cab').catch(() => false)) break; await pg.waitForTimeout(400); }
  await pg.waitForTimeout(600);
  // stand `d` metres from a place on the line through it and look at it
  const look = (t, i, d, side) => pg.evaluate(([t, i, d, side]) => { F0W.fade = 0; F0W.fadeTarget = 0; const c = F0W.cab, p = c.slotPts.find(q => q.t === t && q.i === i && (side === undefined || q.side === side)); c.ov = null; const sd = t === 'drawer' ? p.side : 1; c.player.pos.set(p.x, 0, p.z + sd * d); c.player.yaw = sd > 0 ? 0 : Math.PI; const dy = p.y - 1.62; c.player.pitch = Math.atan2(dy, d); c.prompt = c.nearest(); c.markSlot(); return c.prompt && { id: c.prompt.id, t: c.prompt.t, i: c.prompt.i, label: c.prompt.label && c.prompt.label() }; }, [t, i, d, side]);
  const a = await look('wall', 2, 1.6); T('looking at wall place 3 → that place', a && a.id === 'slot' && a.t === 'wall' && a.i === 2, a);
  const b = await look('wall', 4, 1.6); T('turning to wall place 5 → place 5', b && b.t === 'wall' && b.i === 4, b);
  const tp = await look('top', 1, 1.0); T('the desk top: the second case', tp && tp.t === 'top' && tp.i === 1, tp);
  const dr = await look('drawer', 2, 1.0, 1); T('a drawer of the desk', dr && dr.t === 'drawer' && dr.i === 2, dr);
  await pg.screenshot({ path: SH + '/cab_target.png' });
  // wall: window, place, take
  await look('wall', 2, 1.6); await pg.evaluate(() => F0W.cab.key({ code: 'KeyE' })); await pg.waitForTimeout(300);
  const ov = await pg.evaluate(() => { Boxes.slot.layout(); return { ov: F0W.cab.ov, t: Boxes.slot.t, i: Boxes.slot.i, rows: Boxes.slot.rows.length, fit: Boxes.slot.fit.map(b => b.size).join('') }; });
  T('E opens that place; wall place 3 is class S: only small boxes are offered', ov.ov === 'slot' && ov.t === 'wall' && ov.i === 2 && /^S+$/.test(ov.fit) && ov.rows === 3, ov); await pg.screenshot({ path: SH + '/cab_slot_ui.png' });
  const put = await pg.evaluate(() => { const B = Boxes.slot; B.layout(); const r = B.rows[0]; const uid = r.b.uid; F0W.cab.click(r.x + 5, r.y + 5); const bx = Save.box(uid); return { ov: F0W.cab.ov, loc: bx.loc, placed: Save.data.boxes.filter(b => b.loc).length }; });
  T('a click puts the box exactly there', put.ov === null && put.loc && put.loc.t === 'wall' && put.loc.i === 2 && put.placed === 1, put);
  const again = await look('wall', 2, 1.6); T('the prompt now says «снять»', again && /снять/.test(again.label), again);
  await pg.evaluate(() => F0W.cab.key({ code: 'KeyE' })); const take = await pg.evaluate(() => { const B = Boxes.slot; B.layout(); const b = B.btns.find(b => b.id === 'take'); F0W.cab.click(b.x + 3, b.y + 3); return { ov: F0W.cab.ov, placed: Save.data.boxes.filter(b => b.loc).length }; }); T('«Снять коробку» takes it back', take.ov === null && take.placed === 0, take);
  // the desk top: a large box is not offered
  await look('top', 0, 1.0); await pg.evaluate(() => F0W.cab.key({ code: 'KeyE' })); const tf = await pg.evaluate(() => { Boxes.slot.layout(); return Boxes.slot.fit.map(b => b.size).join(''); }); T('desk top: small and medium boxes only', tf.indexOf('L') < 0 && tf.length === 5, tf);
  await pg.evaluate(() => F0W.cab.key({ code: 'Escape' }));
  // a drawer holds four units: several boxes stay open in the window
  await look('drawer', 1, 1.0, 1); await pg.evaluate(() => F0W.cab.key({ code: 'KeyE' })); await pg.waitForTimeout(200);
  const dd = await pg.evaluate(() => { const B = Boxes.slot, out = []; for (let k = 0; k < 6; k++) { B.layout(); const r = B.rows[0]; if (!r) break; F0W.cab.click(r.x + 5, r.y + 5); B.layout(); out.push([F0W.cab.ov, B.inside.length, Boxes.boxesAt('drawer', 1).reduce((a, b) => a + ({ S: 1, M: 2, L: 4 })[b.size], 0)]); } return out; });
  T('a drawer takes boxes up to 4 units and the window stays open', dd.length >= 2 && dd.every(r => r[0] === 'slot') && dd[dd.length - 1][2] <= 4, dd);
  await pg.screenshot({ path: SH + '/cab_drawer_ui.png' });
  const tk = await pg.evaluate(() => { const B = Boxes.slot; B.layout(); const n0 = B.inside.length, r = B.inside[0]; F0W.cab.click(r.x + 5, r.y + 5); B.layout(); return [n0, B.inside.length, F0W.cab.ov]; }); T('a box inside is taken out with a click', tk[1] === tk[0] - 1 && tk[2] === 'slot', tk);
  await pg.evaluate(() => F0W.cab.key({ code: 'Escape' }));
  if (errs.length) { bad++; console.log('ERR', errs); }
  console.log(bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
