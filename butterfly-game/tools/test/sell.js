const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message)); pg.on('console', m => { if (m.type() === 'error') console.log('console', m.text().slice(0, 200)); });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&hour=14'); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { Save.data.specimens = []; Save.data.coins = 0; let u = 1; const add = (sp, q) => Save.data.specimens.push({ uid: u++, sp, biome: 'russia', date: Date.now() - u * 1000, q, pose: q === null ? null : {}, box: null }); const real = SPECIES.filter(s => s.biome !== 'ocean'); [0, 5, 20, 40, 60, 90, 120].forEach((i, k) => add(real[i].id, k % 2 ? 80 : null)); add(real[3].id + '~AB123', null); add(real[30].id + '~CD456', 92); add(SPECIES.find(s => s.biome === 'ocean').id, null); add(real[7].id, 55); add(real[8].id, 100); add(real[9].id, 1); });
  const prices = await pg.evaluate(() => Save.data.specimens.map(s => { const i = Econ.info(s); return [i.sp.ru, i.base, +i.ab.toFixed(1), +i.cond.toFixed(2), i.price]; })); console.log(JSON.stringify(prices));
  const stats = await pg.evaluate(() => { const by = {}; SPECIES.forEach(s => { const k = s.biome === 'ocean' ? 'ocean' : s.rar; (by[k] = by[k] || []).push(Econ.baseValue(s)); }); return Object.fromEntries(Object.entries(by).map(([k, v]) => [k, [v.length, Math.min(...v), Math.max(...v)]])); }); console.log('base by rarity', JSON.stringify(stats));
  await pg.evaluate(() => F0W.toMarket()); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(F0W.cab && F0W.cab.walkers)).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.overlay = null; F0W.cab.ov = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; const P = F0W.cab.player; P.pos.set(-6, 1.65, 0.2); P.yaw = 0; P.pitch = -0.05; });
  await pg.waitForTimeout(800); console.log('prompt', await pg.evaluate(() => F0W.cab.prompt && F0W.cab.prompt.id));
  await pg.keyboard.press('KeyE'); await pg.waitForTimeout(700); console.log('ov', await pg.evaluate(() => F0W.cab.ov)); await pg.screenshot({ path: '/tmp/sell0.png' });
  await pg.mouse.click(2 * 120, 2 * 72); await pg.waitForTimeout(400); await pg.screenshot({ path: '/tmp/sell1.png' }); console.log('coins after 1 click', await pg.evaluate(() => Save.data.coins));
  await pg.mouse.click(2 * 120, 2 * 72); await pg.waitForTimeout(400); console.log('after sell', await pg.evaluate(() => ({ coins: Save.data.coins, n: Save.data.specimens.length })));
  await pg.mouse.click(2 * 350, 2 * 234); await pg.waitForTimeout(500); console.log('after sell all', await pg.evaluate(() => ({ coins: Save.data.coins, n: Save.data.specimens.length, left: Save.data.specimens.map(s => s.sp) }))); await pg.screenshot({ path: '/tmp/sell2.png' });
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300); console.log('closed', await pg.evaluate(() => F0W.cab.ov));
  await br.close();
})();
