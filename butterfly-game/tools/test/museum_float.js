// the museum: nothing floats and nothing sticks out of the room. Every box of the furniture batch and every other mesh must be connected (touching) to the floor, a wall or the ceiling.
// All 88 places are filled with boxes first, so the frames on tables, racks and walls are checked too.
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { Save.data.seenMuseum = true; Save.data.boxes.length = 0; const M = Boxes.MUS;
    for (const t of ['mt', 'ml', 'mr', 'mw']) for (let i = 0; i < M[t]; i++) { const size = t === 'ml' ? 'L' : t === 'mw' ? Boxes.MWCLS(i) : (i % 2 ? 'S' : 'M'); Save.addBox(size, i % 3); const b = Save.data.boxes[Save.data.boxes.length - 1]; b.loc = { t, i }; }
    F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMuseum(); });
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && F0W.cab.constructor.name === 'Mus').catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.waitForTimeout(500);
  const r = await pg.evaluate(() => {
    const cab = F0W.cab, RW = 24, RD = 16, RH = 4.8, HX = 12, HZ = 8, objs = [];
    cab.scene.updateMatrixWorld(true);
    cab.scene.traverse(o => {
      if (o.userData && o.userData.items) { o.userData.items.forEach((it, k) => { const [x, y, z, w, h, d, ry] = it, c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)), ex = (w * c + d * s) / 2, ez = (w * s + d * c) / 2; objs.push({ n: 'batch#' + k, a: [x - ex, y - h / 2, z - ez], b: [x + ex, y + h / 2, z + ez] }); }); return; }
      if (!o.isMesh || (o.userData && o.userData.noFloat) || !o.visible) return;
      const bb = new THREE.Box3().setFromObject(o); if (bb.isEmpty() && !(bb.max.x >= bb.min.x)) return; objs.push({ n: o.geometry.type + '@' + o.position.toArray().map(v => Math.round(v * 100) / 100).join(','), a: [bb.min.x, bb.min.y, bb.min.z], b: [bb.max.x, bb.max.y, bb.max.z] });
    });
    const G = 0.035, touch = (p, q) => [0, 1, 2].every(k => p.a[k] - G <= q.b[k] && q.a[k] - G <= p.b[k]);
    const grounded = o => o.a[1] <= 0.04 || o.b[1] >= RH - 0.06 || o.a[0] <= -HX + 0.06 || o.b[0] >= HX - 0.06 || o.a[2] <= -HZ + 0.06 || o.b[2] >= HZ - 0.06;
    const seen = new Array(objs.length).fill(false), stack = []; objs.forEach((o, i) => { if (grounded(o)) { seen[i] = true; stack.push(i); } });
    // spatial hashing is not needed: a few thousand boxes
    while (stack.length) { const i = stack.pop(); for (let j = 0; j < objs.length; j++) if (!seen[j] && touch(objs[i], objs[j])) { seen[j] = true; stack.push(j); } }
    const floating = objs.filter((o, i) => !seen[i]).slice(0, 12).map(o => o.n + ' y=' + o.a[1].toFixed(2) + '..' + o.b[1].toFixed(2));
    const out = objs.filter(o => o.a[1] < -0.03 || o.a[0] < -HX - 0.03 || o.b[0] > HX + 0.03 || o.a[2] < -HZ - 0.03 || o.b[2] > HZ + 0.03 || o.b[1] > RH + 0.03).slice(0, 12).map(o => o.n + ' [' + o.a.map(v => v.toFixed(2)) + ']-[' + o.b.map(v => v.toFixed(2)) + ']');
    const frames = cab.dynamic.children.length;
    return { n: objs.length, floating, out, frames, boxes: Save.data.boxes.length, slots: Object.values(Boxes.MUS).reduce((a, b) => a + b, 0) };
  });
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  console.log('checked', r.n, 'objects; frames in the room:', r.frames);
  T('88 places, all filled with a framed box', r.slots === 88 && r.boxes === 88 && r.frames === 88, [r.slots, r.boxes, r.frames]);
  T('nothing floats (everything touches the floor, a wall or the ceiling through its neighbours)', r.floating.length === 0, r.floating);
  T('nothing sticks out of the room', r.out.length === 0, r.out);
  T('no page errors', errs.length === 0, errs.slice(0, 3));
  console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
