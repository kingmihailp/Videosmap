// lamps: 3D models (torch, headlamp), the torch in the hand, the HUD widget, the shop pictures
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&night'); await pg.waitForTimeout(2500);
  const m = await pg.evaluate(() => { const o = {}; for (const id of ['torch', 'head']) { const g = Lamps.model(id); let n = 0; g.traverse(q => { if (q.isMesh) n++; }); const bb = new THREE.Box3().setFromObject(g), sz = bb.getSize(new THREE.Vector3()); o[id] = { meshes: n, size: [sz.x, sz.y, sz.z].map(v => +v.toFixed(3)), lit: !!g.userData.lens }; } return o; });
  T('the torch and the headlamp are detailed 3D models of a real size', m.torch.meshes >= 14 && m.head.meshes >= 14 && m.torch.size.every(v => v < 0.35) && m.head.size.every(v => v < 0.3) && m.torch.lit && m.head.lit, m);
  const start = async (id, lp) => { await pg.evaluate(([id, lp]) => { Save.data.trap = { tr: {}, fl: {}, hn: {}, lp: lp || {} }; Save.data.headOff = false; delete Save.data.lamp; F0W.fade = 0; F0W.fadeTarget = 0; F0W.screen = 'title'; F0W.start(id, 'LM1'); }, [id, lp]);
    for (let i = 0; i < 200; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
    await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; }); await pg.waitForTimeout(1500); };
  await start('russia', { torch: 1 });
  let r = await pg.evaluate(() => { const p = F0W.play; return { held: !!p.lampModel, inCam: !!(p.lampModel && p.lampModel.parent === p.camera), on: p.flashOn }; });
  T('the torch is seen in the hand', r.held && r.inCam && r.on, r); await pg.screenshot({ path: '/tmp/lm_torch_on.png' });
  await pg.evaluate(() => { F0W.play.toggleFlash(); }); await pg.evaluate(async () => { const p = F0W.play, t0 = p.t; await new Promise(r => { const iv = setInterval(() => { if (p.t - t0 > 0.4) { clearInterval(iv); r(); } }, 40); }); }); r = await pg.evaluate(() => ({ lens: F0W.play.lampModel.userData.torch.userData.lens.material.opacity })); T('switched off: the lens goes dark', r.lens < 0.7, r); await pg.screenshot({ path: '/tmp/lm_torch_off.png' });
  await start('russia', { head: 1 }); r = await pg.evaluate(() => ({ held: !!F0W.play.lampModel, lamp: F0W.play.lamp })); T('the headlamp is not shown in the hand', !r.held && r.lamp === 'head', r); await pg.screenshot({ path: '/tmp/lm_head_on.png' });
  await start('russia', { head: 1, torch: 1 }); await pg.evaluate(() => Lamps.cycle(F0W.play)); await pg.waitForTimeout(800); await pg.screenshot({ path: '/tmp/lm_two.png' });
  await start('russia', {}); await pg.screenshot({ path: '/tmp/lm_none.png' });
  // the shop
  await pg.evaluate(() => { Save.data.coins = 100000; F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMarket(); }); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = null; F0W.cab.open('goods'); F0W.cab.goodsOpen('tr'); });
  const L = await pg.evaluate(() => F0W.cab.goodsList().map(x => x.id)); const iT = L.indexOf('torch'), iH = L.indexOf('head');
  T('the trapper sells both lamps', iT >= 0 && iH >= 0, L);
  for (const [n, i] of [['torch', iT], ['head', iH]]) { await pg.evaluate(i => { const G = F0W.cab.gd; G.sel = i; G.scroll = Math.max(0, i - 5); }, i); await pg.waitForTimeout(1500); await pg.screenshot({ path: `/tmp/lm_shop_${n}.png` }); }
  T('no errors', errs.length === 0, errs.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
