// Steam store screenshots (1920x1080) -> steam/screenshots (node steam_shots.js ru) or steam/screenshots_en (node steam_shots.js en)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const LANG = process.argv[2] || 'ru', OUT = '/home/user/Videosmap/butterfly-game/steam/' + (LANG === 'en' ? 'screenshots_en' : 'screenshots') + '/';
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1920, height: 1080 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&lang=' + LANG); await pg.waitForTimeout(3000);
  const shot = async n => { await pg.waitForTimeout(1200); await pg.screenshot({ path: OUT + n + '.png' }); };
  // menu: three locations
  for (const [i, id] of ['alps', 'japan', 'chihuahua'].entries()) { await pg.evaluate(id => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.screen = 'title'; Panorama.set(id); }, id); await shot('0' + (i + 1) + '_menu_' + id); }
  await pg.evaluate(() => { Save.data.maps = Object.fromEntries(BIOMES.map(b => [b.id, true])); SPECIES.forEach((s, i) => { if (i % 3 === 0 && !s.mystery) Save.data.caught[s.id] = { count: 1 + (i % 4), first: Date.now(), place: s.biome || 'russia' }; }); F0W.screen = 'map'; }); await shot('04_world_map');
  await pg.evaluate(() => { F0W.screen = 'journal'; }); await shot('05_journal');
  const views = [['06_meadow', 'russia', 0.1], ['07_borneo', 'borneo', 0.05], ['08_japan', 'japan', 0.12], ['09_desert', 'chihuahua', 0.08], ['10_amazon', 'amazon', 0.1]];
  for (const [n, id, pitch] of views) {
    const ok = await pg.evaluate(id => !!BIOME_BY_ID[id], id); if (!ok) { console.log('no biome', id); continue; }
    await pg.evaluate(id => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.screen = 'title'; F0W.start(id, 'STEAM'); }, id);
    for (let i = 0; i < 200; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
    await pg.evaluate(pitch => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; const p = F0W.play; p.player.pitch = pitch; p.player.yaw = 0.6; p.toasts = []; }, pitch); await pg.waitForTimeout(1500); await shot(n);
  }
  console.log('errors', JSON.stringify(errs.slice(0, 4))); await br.close();
})();
