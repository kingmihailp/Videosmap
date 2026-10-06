const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  const ev = (f, a) => pg.evaluate(f, a);
  for (const kind of ['cabinet', 'market']) {
    await ev(k => { F0W.fade = 0; F0W.fadeTarget = 0; k === 'cabinet' ? F0W.toCabinet() : F0W.toMarket(); }, kind); await pg.waitForTimeout(3500);
    await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.ov = 'pause'; }); await pg.waitForTimeout(400);
    const to = (x, y) => ev(([x, y]) => { const r = document.getElementById('ui').getBoundingClientRect(); return [r.left + x / SW * r.width, r.top + y / SH * r.height]; }, [x, y]);
    await pg.screenshot({ path: `/tmp/pc_${kind}.png` });
    const [cx, cy] = await to(240, 132);
    await pg.mouse.click(cx, cy); await pg.waitForTimeout(400); console.log(kind, 'modal', await ev(() => F0W.modal));
    await pg.keyboard.press('Escape'); await pg.waitForTimeout(300); console.log(' after Esc: modal', await ev(() => F0W.modal), 'ov', await ev(() => F0W.cab.ov));
  }
  await br.close();
})();
