// pictures of the interface: the HUD with the module switch off / on, pause menu, world map, journal, trap window
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  const OUT = '/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/ui_';
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&lite&biome=russia&seed=UI1&hour=12');
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; const p = F0W.play; window.p = p; Save.data.coins = 123456; const L = Save.netList(); let n = L.find(q => q.tag === 'T'); if (n) L.splice(L.indexOf(n), 1); n = { uid: (Save.data.netUid = (Save.data.netUid || 1) + 1), tag: 'T', h: 'h_basic', r: 'r_basic', m: 'm_basic', g: ['g_ir', 'g_map', 'g_auto'] }; L.push(n); Save.data.netEq = n.uid; p.buildNet(); p.toasts = []; p.hintT = 4; });
  const shot = async n => { await pg.waitForTimeout(900); await pg.screenshot({ path: OUT + n + '.png' }); };
  await pg.evaluate(() => { p.gear.auto = false; }); await pg.waitForTimeout(600); await shot('hud_off');
  await pg.evaluate(() => { p.gear.auto = true; }); await pg.waitForTimeout(900); await shot('hud_on');
  await pg.evaluate(() => { F0W.overlay = 'pause'; }); await shot('pause');
  await pg.evaluate(() => { F0W.overlay = null; F0W.toMap(); }); await pg.waitForTimeout(1200); await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; }); await shot('map');
  await pg.evaluate(() => { Screens.journal.tab = 0; Screens.journal.sel = 0; F0W.screen = 'journal'; }); await shot('journal');
  await pg.evaluate(() => { F0W.screen = 'journal'; Screens.journal.tab = 0; Screens.journal.sel = 1; }); await shot('journal2');
  await pg.evaluate(() => { F0W.toTitle && F0W.toTitle(); }); await pg.waitForTimeout(1500); await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; }); await shot('title');
  await pg.evaluate(() => { F0W.toCabinet && F0W.toCabinet(); }); await pg.waitForTimeout(3000); await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab && (F0W.cab.ov = null); }); await shot('cabinet');
  await pg.evaluate(() => { F0W.cab && F0W.cab.open && F0W.cab.open('journal'); }); await shot('cab_journal');
  await pg.evaluate(() => { F0W.toTitle && F0W.toTitle(); }); await pg.waitForTimeout(1200); await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.screen = 'settings'; }); await shot('settings');
  console.log('errors', JSON.stringify(errs)); await br.close();
})();
