// every frame has its own labels: detailed (the whole label), usual (one line, as before) or none; chosen when the frame is made and changeable at the workbench; synced online
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T0 = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const SH = process.env.SHOTS || '/tmp';
  const R = await pg.evaluate(() => {
    Save.data.specimens = []; Save.data.boxes.length = 0; Save.data.boxStock = { S: 9, M: 9, L: 9 }; const out = {};
    const fill = (b) => { const pool = SPECIES.filter(s => !s.mystery && s.biome !== 'ocean'), ids = [pool[5], SPECIES_BY_ID.ornithoptera_alexandrae, SPECIES_BY_ID.papilio_machaon, pool[20]]; ids.forEach((sp, i) => { Save.add(sp.id, sp.biome); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.q = 90; s.pose = JSON.parse(JSON.stringify(Art.IDEAL)); s.box = b.uid; b.items[i] = s.uid; }); };
    const mk = lab => { const b = Save.addBox('M', 0, lab); fill(b); return b; };
    const old = { uid: 9999, size: 'M', style: 0, items: [], loc: null }; Save.data.boxes.push(old); out.oldLab = Boxes.labOf(old);          // a frame made before the labels were chosen: usual
    const F = mk('full'), B = mk('basic'), N = mk('none'); out.labs = [F.lab, B.lab, N.lab];
    const px = b => { const c = Boxes.canvas(b), x = c.getContext('2d'), d = x.getImageData(0, 0, c.width, c.height).data; return d; };
    const diff = (a, b) => { let n = 0; for (let i = 0; i < a.length; i += 4) if (Math.abs(a[i] - b[i]) + Math.abs(a[i + 1] - b[i + 1]) + Math.abs(a[i + 2] - b[i + 2]) > 60) n++; return n; };
    const dF = px(F), dB = px(B), dN = px(N); out.fb = diff(dF, dB); out.fn = diff(dF, dN); out.bn = diff(dB, dN);
    // 'none': no label rectangle in the bottom part of every cell (the light label colour is absent there); 'full' has it
    const labelLight = (b, mode) => { const c = Boxes.canvas(b), x = c.getContext('2d'); let cnt = 0; const st = Boxes.STYLES[b.style].lab, h = parseInt(st.slice(1), 16), R0 = h >> 16, G0 = h >> 8 & 255, B0 = h & 255; for (let cy = 0; cy < 2; cy++) for (let cx = 0; cx < 2; cx++) { const d = x.getImageData(8 + cx * 104 + 8, 8 + cy * 80 + 66, 20, 4).data; for (let i = 0; i < d.length; i += 4) if (Math.abs(d[i] - R0) + Math.abs(d[i + 1] - G0) + Math.abs(d[i + 2] - B0) < 12) cnt++; } return cnt; };
    out.lightFull = labelLight(F), out.lightBasic = labelLight(B), out.lightNone = labelLight(N);
    // the 3D mount follows the mode (the butterflies sit lower without a label)
    const mF = Boxes.mount3D(F, 230), mN = Boxes.mount3D(N, 230); const bF = new THREE.Box3().setFromObject(mF), bN = new THREE.Box3().setFromObject(mN); out.mount = [bF.min.y.toFixed(3), bN.min.y.toFixed(3)];
    return out;
  });
  T0('a frame made before has the usual labels; new frames carry the chosen kind', R.oldLab === 'basic' && R.labs.join() === 'full,basic,none', R);
  T0('the three kinds look different (detailed ≠ usual ≠ none)', R.fb > 100 && R.fn > 100 && R.bn > 50, [R.fb, R.fn, R.bn]);
  T0('«Нет»: no label plates at all; the other two have them in every cell', R.lightNone === 0 && R.lightBasic > 0 && R.lightFull > 0, [R.lightNone, R.lightBasic, R.lightFull]);
  // the workbench: the button cycles and applies to the chosen frame, new frames use it
  await pg.evaluate(() => { Save.data.seenCab = true; F0W.fade = 0; F0W.fadeTarget = 0; F0W.toCabinet(); });
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && F0W.cab.constructor.name === 'Cab').catch(() => false)) break; await pg.waitForTimeout(400); }
  const W = await pg.evaluate(() => {
    const out = {}; F0W.cab.open('bench'); const B = Boxes.bench; B.tab = 'boxes'; B.sel = Save.data.boxes.length - 1; B.lab = Save.data.boxes[B.sel].lab || 'basic'; B.layout();
    const click = id => { B.layout(); const b = B.btns.find(b => b.id === id); F0W.cab.click(b.x + 2, b.y + 2); B.layout(); return b; };
    const cur = B.cur(); out.before = cur.lab; click('lab'); out.after = cur.lab; out.btn = B.btns.find(b => b.id === 'lab').label;
    click('lab'); click('lab'); out.cycle = cur.lab;
    B.lab = 'none'; Save.data.boxStock.M = 3; const n0 = Save.data.boxes.length; click('M'); const nb = Save.data.boxes[Save.data.boxes.length - 1]; out.created = [Save.data.boxes.length - n0, nb.lab];
    return out;
  });
  T0('the workbench button cycles Детальные → Обычные → Нет and changes the selected frame', W.before === 'none' && W.after === 'full' && /Детальные/.test(W.btn) && W.cycle === 'none', W);
  T0('a new frame gets the kind chosen on the workbench', W.created[0] === 1 && W.created[1] === 'none', W.created);
  await pg.evaluate(() => { F0W.cab.close(); }); await pg.waitForTimeout(300);
  if (errs.length) { bad++; console.log('ERR', errs); }
  console.log(bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
