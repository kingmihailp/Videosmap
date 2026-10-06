const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1&hour=12');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  const ev = (f, a) => pg.evaluate(f, a);
  const to = (x, y) => ev(([x, y]) => { const r = document.getElementById('ui').getBoundingClientRect(); return [r.left + x / SW * r.width, r.top + y / SH * r.height]; }, [x, y]);
  const click = async (x, y) => { const [cx, cy] = await to(x, y); await pg.mouse.click(cx, cy); await pg.waitForTimeout(250); };
  await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; Save.data.coins = 1000; });
  // --- the market shop
  await ev(() => { F0W.toMarket(); }); await pg.waitForTimeout(3500);
  await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; const m = F0W.cab; m.ov = null; m.open('shop'); }); await pg.waitForTimeout(500);
  const L = await ev(() => F0W.cab.shopLayout().rows.map(r => [r.x + 20, r.y + 8, r.id]));
  console.log('shop rows', L.map(r => r[2]).join(','));
  for (const id of ['m_silk', 'r_plastic', 'h_long']) { const r = L.find(r => r[2] === id); await click(r[0], r[1]); await click(364 - 60, 232); }   // select + Buy button
  console.log('coins after buying silk+plastic hoop+long handle:', await ev(() => Save.data.coins), 'parts', await ev(() => JSON.stringify(Save.data.parts)));
  await click(...L.find(r => r[2] === 'h_chrome').slice(0, 2)); await pg.screenshot({ path: '/tmp/net_shop.png' });
  // --- the workbench
  await ev(() => { F0W.toCabinet(); }); await pg.waitForTimeout(3500);
  await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; const c = F0W.cab; c.ov = null; c.open('bench'); }); await pg.waitForTimeout(400);
  await click(80, 12); console.log('tab', await ev(() => Boxes.bench.tab));
  const rowsY = await ev(() => { Boxes.bench.layout && 0; return 0; });
  // select "+ Собрать новый" (last row) then cycle every slot to its non-basic part
  await click(60, 54 + 1 * 21 + 8); await pg.screenshot({ path: '/tmp/net_bench0.png' });
  for (const [slot, id] of [['h', 'h_long'], ['r', 'r_plastic'], ['m', 'm_silk']]) { const bt = await ev(s => { const b = [...document.querySelectorAll('x')]; return null; }, slot); }
  for (let k = 0; k < 3; k++) await click(464, 64 + k * 48 + 19);   // '>' of each slot
  await click(400, 219); console.log('assembled', await ev(() => JSON.stringify(Save.data.nets)), 'parts', await ev(() => JSON.stringify(Save.data.parts)));
  await click(150, 214 + 0);                                              // (button 'equip' is at x 94..206, y 248)
  await click(150, 256); console.log('equipped uid', await ev(() => Save.data.netEq), 'cur', await ev(() => JSON.stringify(Save.curNet()))); await pg.screenshot({ path: '/tmp/net_bench2.png' });
  // --- play with the equipped net
  await ev(() => { F0W.cab.ov = null; F0W.toMap(); }); await pg.waitForTimeout(500);
  await ev(() => { F0W.start('russia', 'T1'); }); await pg.waitForTimeout(4500);
  await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; });
  console.log('play stats', await ev(() => JSON.stringify(F0W.play.netStats)), 'cfg', await ev(() => JSON.stringify(F0W.play.netCfg)));
  await pg.waitForTimeout(800); await pg.screenshot({ path: '/tmp/net_fp.png' });
  // aberration roll: with chance 1 every catchable butterfly becomes an aberration
  console.log('Aberr.roll with p=1 ->', await ev(() => { const sp = F0W.play.pool[0]; return Aberr.roll(sp, 1).id; }));
  await br.close();
})();
