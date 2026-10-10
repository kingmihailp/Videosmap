// the museum: the door in the cabinet, the placement window (4 tabs, rules), walking up to furniture, the way back
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const waitCab = async name => { for (let i = 0; i < 80; i++) { if (await pg.evaluate(n => F0W.screen === 'cabinet' && F0W.cab && F0W.cab.constructor.name === n, name).catch(() => false)) return true; await pg.waitForTimeout(400); } return false; };
  await pg.evaluate(() => { Save.data.seenCab = true; Save.data.seenMuseum = true; Save.data.boxes.length = 0; for (const s of ['L', 'S', 'M', 'M', 'S', 'L']) Save.addBox(s, 0); F0W.fade = 0; F0W.fadeTarget = 0; F0W.toCabinet(); });
  T('the cabinet opens', await waitCab('Cab'));
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; const c = F0W.cab; c.player.pos.set(3.3, 0, 0.1); c.player.yaw = Math.PI / 2; c.prompt = c.nearest(); });
  const pr = await pg.evaluate(() => F0W.cab.prompt && F0W.cab.prompt.id); T('at the east door the prompt is «enter the museum»', pr === 'museum', pr);
  await pg.evaluate(() => F0W.cab.key({ code: 'KeyE' })); T('E opens the museum', await waitCab('Mus'));
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; });
  // tabs and places
  const counts = await pg.evaluate(() => { const o = {}; for (const t of ['mt', 'ml', 'mr', 'mw']) { Boxes.place.open(t); Boxes.place.layout(); o[t] = Boxes.place.slots.length; } return o; });
  T('the placement window has 24 / 4 / 36 / 24 places on its four tabs', counts.mt === 24 && counts.ml === 4 && counts.mr === 36 && counts.mw === 24, counts);
  const click = (tab, i, uid) => pg.evaluate(([tab, i, uid]) => { Boxes.place.open(tab); Boxes.place.layout(); Boxes.place.selUid = uid; const s = Boxes.place.slots.find(q => q.i === i); return Boxes.place.click(s.x + 2, s.y + 2); }, [tab, i, uid]);
  const boxes = await pg.evaluate(() => Save.data.boxes.map(b => [b.uid, b.size]));
  const L1 = boxes.find(b => b[1] === 'L')[0], S1 = boxes.find(b => b[1] === 'S')[0], M1 = boxes.find(b => b[1] === 'M')[0];
  const loc = u => pg.evaluate(u => { const b = Save.box(u); return b.loc && b.loc.t + ':' + b.loc.i; }, u);
  await click('mt', 0, L1); T('a large box does not go on a small table', (await loc(L1)) === null, await loc(L1));
  await click('ml', 1, L1); T('...but it goes on a large table', (await loc(L1)) === 'ml:1', await loc(L1));
  await click('mw', 0, S1); T('a small box goes on any wall place (here: an L place)', (await loc(S1)) === 'mw:0', await loc(S1));
  await click('mr', 7, M1); T('a medium box stands on a rack', (await loc(M1)) === 'mr:7', await loc(M1));
  const Lb = boxes.filter(b => b[1] === 'L')[1][0]; await click('mw', 2, Lb); T('a large box does not fit a small wall place', (await loc(Lb)) === null, await loc(Lb));
  await click('mw', 5, Lb); T('...but fits the large one', (await loc(Lb)) === 'mw:5', await loc(Lb));
  await click('mw', 0, 0); T('a click on a taken place takes the box back', (await loc(S1)) === null, await loc(S1));
  // walking up to furniture
  const lookAt = (t, i, dz, pitch) => pg.evaluate(([t, i, dz, pitch]) => { const c = F0W.cab, p = c.slotPts.find(q => q.t === t && q.i === i), side = p.z < 0 ? 1 : -1; c.ov = null; c.player.pos.set(p.x, 0, p.z + side * dz); c.player.yaw = side > 0 ? 0 : Math.PI; c.player.pitch = pitch; c.prompt = c.nearest(); return c.prompt && { id: c.prompt.id, t: c.prompt.t, i: c.prompt.i }; }, [t, i, dz, pitch]);
  const st = await lookAt('mt', 6, 1.6, -0.45); T('looking at a table place E offers exactly that place', st && st.id === 'slot' && st.t === 'mt' && st.i === 6, st);
  const st2 = await lookAt('mr', 13, 1.7, -0.47); T('looking at a rack place E offers that place', st2 && st2.id === 'slot' && st2.t === 'mr' && st2.i === 13, st2);
  const st3 = await lookAt('mw', 3, 2.2, 0.08); T('looking at a wall place E offers that place', st3 && st3.id === 'slot' && st3.t === 'mw' && st3.i === 3, st3);
  await pg.evaluate(() => F0W.cab.key({ code: 'KeyE' }));
  const ov = await pg.evaluate(() => [F0W.cab.ov, Boxes.slot.t, Boxes.slot.i]); T('E opens the window of that one place', ov[0] === 'slot' && ov[1] === 'mw' && ov[2] === 3, ov);
  await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/m_place.png' });
  await pg.evaluate(() => F0W.cab.key({ code: 'Escape' })); T('Esc closes it', await pg.evaluate(() => F0W.cab.ov === null));
  // the antique clock
  const ck = await pg.evaluate(() => { const c = F0W.cab; c.player.pos.set(0, 0, -6.5); c.player.yaw = 0; c.prompt = c.nearest(); const id = c.prompt && c.prompt.id, lab = c.prompt && c.prompt.label(); c.key({ code: 'KeyE' }); return { id, lab, toast: c.toastText, hands: !!c.clockHands, pend: !!c.pendulum }; });
  T('at the north wall there is the clock: E shows the time and the strokes', ck.id === 'clock' && /\d\d:\d\d/.test(ck.lab) && /Часы бьют/.test(ck.toast) && ck.hands && ck.pend, ck);
  const hands = await pg.evaluate(() => { const c = F0W.cab, d = new Date(); c.animate(0.016); const H = c.clockHands; return { min: H.m.rotation.z, want: -(d.getMinutes() + d.getSeconds() / 60) / 60 * 6.2832 }; });
  T('the minute hand shows the real minutes', Math.abs(hands.min - hands.want) < 0.12, hands);
  // back to the cabinet
  await pg.evaluate(() => { const c = F0W.cab; c.player.pos.set(-11.0, 0, 0); c.player.yaw = Math.PI / 2; c.prompt = c.nearest(); });
  const ex = await pg.evaluate(() => F0W.cab.prompt && F0W.cab.prompt.id); T('at the door of the museum the prompt is «exit»', ex === 'exit', ex);
  await pg.evaluate(() => F0W.cab.key({ code: 'KeyE' })); T('E brings you back to the cabinet', await waitCab('Cab'));
  const back = await pg.evaluate(() => { const p = F0W.cab.player.pos; return [Math.round(p.x * 10) / 10, Math.round(p.z * 10) / 10]; }); T('...right at the museum door', Math.abs(back[0] - 3.3) < 0.2 && Math.abs(back[1] - 0.1) < 0.2, back);
  T('the box left in the museum is still there (shown in the museum count)', (await loc(L1)) === 'ml:1');
  T('no page errors', errs.length === 0, errs.slice(0, 3));
  console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
