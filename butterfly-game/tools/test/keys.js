const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  const ev = (f, a) => pg.evaluate(f, a); await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; });
  const to = (x, y) => ev(([x, y]) => { const r = document.getElementById('ui').getBoundingClientRect(); return [r.left + x / SW * r.width, r.top + y / SH * r.height]; }, [x, y]);
  const click = async (x, y) => { const [cx, cy] = await to(x, y); await pg.mouse.click(cx, cy); await pg.waitForTimeout(250); };
  // open pause -> keys via real clicks
  await pg.keyboard.press('KeyP'); await pg.waitForTimeout(300);
  await ev(() => { Screens.keys.wait = -1; F0W.modal = 'keys'; }); await pg.waitForTimeout(300);
  console.log('modal', await ev(() => F0W.modal));
  // click the "forward" row, then press ArrowUp
  const rows = await ev(() => { Screens.keys.layout(); return Screens.keys.rows.map(r => [r.x + 20, r.y + 6]); });
  await click(...rows[0]); console.log('waiting', await ev(() => Screens.keys.wait)); await pg.keyboard.press('ArrowUp'); await pg.waitForTimeout(200);
  await click(...rows[7]); await pg.keyboard.press('KeyG'); await pg.waitForTimeout(200);
  console.log('bound', await ev(() => JSON.stringify(Save.data.settings.keys))); await pg.screenshot({ path: '/tmp/k_screen.png' });
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(200); console.log('back to', await ev(() => F0W.modal));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(400); await pg.keyboard.press('Escape'); await pg.waitForTimeout(800); console.log('resumed', await ev(() => F0W.overlay));
  // gameplay: ArrowUp should walk forward (logical W), W must do nothing
  const pos = () => ev(() => { const p = F0W.play.player.pos; return [+p.x.toFixed(2), +p.z.toFixed(2)]; });
  const p0 = await pos(); await pg.keyboard.down('KeyW'); await pg.waitForTimeout(900); await pg.keyboard.up('KeyW'); const p1 = await pos();
  await pg.keyboard.down('ArrowUp'); await pg.waitForTimeout(900); const held = await ev(() => [...F0W.inp.keys]); await pg.keyboard.up('ArrowUp'); await pg.waitForTimeout(300); const p2 = await pos();
  console.log('W moved?', JSON.stringify(p0), '->', JSON.stringify(p1), '| ArrowUp keys', held, 'moved', JSON.stringify(p1), '->', JSON.stringify(p2), 'after release', await ev(() => [...F0W.inp.keys]));
  console.log('text fix', await ev(() => Keys.fix('E — войти в заброшенный дом') + ' | ' + Keys.fix('Tab — журнал') + ' | ' + Keys.fix('WASD')));
  await ev(() => Keys.reset()); console.log('after reset', await ev(() => Keys.fix('E — войти') + ' ' + JSON.stringify(Save.data.settings.keys)));
  await br.close();
})();
