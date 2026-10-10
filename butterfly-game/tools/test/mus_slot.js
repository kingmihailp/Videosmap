// the museum: E works on the one place the player looks at (not on a whole zone); no globes on the bookcases
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const SH = process.env.SHOTS || '/tmp';
  await pg.evaluate(() => { Save.data.seenCab = true; Save.data.seenMuseum = true; Save.data.boxes.length = 0; Save.data.specimens = [];
    const pool = SPECIES.filter(s => !s.mystery && !s.ab && s.biome !== 'ocean'); let k = 0; for (const z of ['S', 'M', 'L', 'M']) { const b = Save.addBox(z, k % 3); for (let j = 0; j < Save.CAP[z]; j++) { const sp = pool[(k * 5 + j * 3) % pool.length]; Save.add(sp.id, sp.biome); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.q = 80; s.pose = JSON.parse(JSON.stringify(Art.IDEAL)); s.box = b.uid; b.items[j] = s.uid; } k++; }
    F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMuseum(); });
  for (let i = 0; i < 100; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && F0W.cab.constructor.name === 'Mus').catch(() => false)) break; await pg.waitForTimeout(400); }
  await pg.waitForTimeout(800);
  const look = (x, z, yaw, pitch) => pg.evaluate(([x, z, yaw, pitch]) => { F0W.fade = 0; F0W.fadeTarget = 0; const c = F0W.cab; c.ov = null; c.player.pos.set(x, 0, z); c.player.yaw = yaw; c.player.pitch = pitch; const p = c.nearest(); c.prompt = p; c.markSlot(); return p && { id: p.id, t: p.t, i: p.i, label: p.label && p.label() }; }, [x, z, yaw, pitch]);
  // the north wall: frames at x = -10.5 + 3i, z = -HZ(8); standing at z = -5.5 looking at the wall (yaw 0 looks to -z)
  const wl = await pg.evaluate(() => F0W.cab.slotPts.filter(p => p.t === 'mw').slice(0, 4).map(p => [p.i, p.x, p.z, p.y]));
  const a = await look(wl[1][1], wl[1][2] + 2.2, 0, 0.08); T('looking at wall place 2 → that place', a && a.id === 'slot' && a.t === 'mw' && a.i === 1, a);
  const b = await look(wl[2][1], wl[2][2] + 2.2, 0, 0.08); T('turning to place 3 → place 3', b && b.t === 'mw' && b.i === 2, b);
  const e = await look(wl[1][1] + 1.5, wl[1][2] + 2.4, 0, 0.0); T('between frames → a neighbour or nothing, never a whole zone', !e || e.id === 'slot', e);
  await pg.screenshot({ path: SH + '/mus_target.png' });
  // racks: three shelves at the same x,z: the look height picks the shelf
  const rk = await pg.evaluate(() => F0W.cab.slotPts.filter(p => p.t === 'mr').slice(0, 6).map(p => [p.i, p.x, p.z, p.y]));
  const lv = []; for (const pitch of [-0.35, 0.0, 0.3]) { const r = await look(rk[0][1], rk[0][2] + 1.7, 0, pitch); lv.push(r && r.i); } T('a rack: looking lower/higher picks a different shelf', new Set(lv).size >= 2, lv);
  // the window for one place
  const w = await look(wl[0][1], wl[0][2] + 2.2, 0, 0.08); await pg.evaluate(() => F0W.cab.key({ code: 'KeyE' })); await pg.waitForTimeout(300);
  const ov = await pg.evaluate(() => ({ ov: F0W.cab.ov, name: Boxes.slotName(Boxes.slot.t, Boxes.slot.i), rows: (Boxes.slot.layout(), Boxes.slot.rows.length), fit: Boxes.slot.fit && Boxes.slot.fit.length }));
  T('E opens the window of that one place with the boxes that fit (wall 1 is class L: all 4)', ov.ov === 'slot' && ov.rows === 4, ov); await pg.waitForTimeout(300); await pg.screenshot({ path: SH + '/mus_slot_ui.png' });
  const put = await pg.evaluate(() => { const B = Boxes.slot; B.layout(); const r = B.rows[2]; const uid = r.b.uid; F0W.cab.click(r.x + 5, r.y + 5); const bx = Save.box(uid); return { ov: F0W.cab.ov, loc: bx.loc, other: Save.data.boxes.filter(b => b.loc).length }; });
  T('clicking a box puts it into exactly this place and closes the window', put.ov === null && put.loc && put.loc.t === 'mw' && put.loc.i === 0 && put.other === 1, put);
  const again = await look(wl[0][1], wl[0][2] + 2.2, 0, 0.08); T('the prompt now offers to take the box away', again && /снять/.test(again.label), again);
  await pg.evaluate(() => F0W.cab.key({ code: 'KeyE' })); await pg.waitForTimeout(300); await pg.screenshot({ path: SH + '/mus_slot_take.png' });
  const take = await pg.evaluate(() => { const B = Boxes.slot; B.layout(); const b = B.btns.find(b => b.id === 'take'); F0W.cab.click(b.x + 3, b.y + 3); return { ov: F0W.cab.ov, placed: Save.data.boxes.filter(b => b.loc).length }; });
  T('«Снять коробку» takes only that box', take.ov === null && take.placed === 0, take);
  // a place where the box does not fit (wall class S, only small boxes)
  const s3 = wl[3]; const sm = await pg.evaluate(() => { const i = 3; return MWCLS_TEST(i); }).catch(() => null);
  const gl = await pg.evaluate(() => { const g = []; F0W.cab.scene.traverse(o => { if (o.geometry && o.geometry.type === 'SphereGeometry' && Math.abs(o.geometry.parameters.radius - 0.2) < 1e-6) g.push(1); }); return g.length; });
  T('no big blue globes on top of the bookcases', gl === 0, gl);
  if (errs.length) { bad++; console.log('ERR', errs); }
  console.log(bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
