// end-to-end through real mouse/keyboard: title -> cabinet -> station prompts -> overlays; old-save migration
const path = require('path'); const fs = require('fs');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const OUT = process.env.OUT || '/tmp/cab'; fs.mkdirSync(OUT, { recursive: true });
const HTML = path.resolve(__dirname, '../../Flora0world_Butterflies.html');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
  page.on('console', m => console.log('[console]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message, (e.stack || '').split('\n').slice(0, 5).join(' | ')));
  // an OLD save (no specimens/boxes keys)
  await page.addInitScript(() => { if (!localStorage.getItem('flora0world_butterflies_v1')) localStorage.setItem('flora0world_butterflies_v1', JSON.stringify({ caught: { papilio_machaon: { count: 5, first: Date.now() - 86400000, place: 'russia' }, aglais_io: { count: 1, first: Date.now(), place: 'russia' } }, settings: { sound: true, music: true, quality: 'high' }, seenHelp: true })); });
  await page.goto('file://' + HTML + '#debug&nolock');
  await page.waitForTimeout(1500);
  const shot = async n => { await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  const ev = f => page.evaluate(f);
  console.log('migrated', JSON.stringify(await ev(() => ({ n: Save.data.specimens.length, boxes: Save.data.boxes.length, ids: Save.data.specimens.map(s => s.sp) }))));
  await shot('30_title');
  const btn = await ev(() => Screens.title.btns.find(b => b.id === 'cabinet'));
  await page.mouse.click((btn.x + btn.w / 2) * 3, (btn.y + btn.h / 2) * 3);
  await page.waitForTimeout(3500); await shot('31_cabinet_help');
  console.log('screen', await ev(() => F0W.screen + '/' + F0W.cab.ov));
  await page.keyboard.press('KeyA'); await page.waitForTimeout(300); // dismiss help
  console.log('ov after key', await ev(() => F0W.cab.ov));
  // walk toward the spreading desk with real keys
  await ev(() => { const P = F0W.cab.player; P.pos.x = -1.6; P.pos.z = 0.1; P.yaw = Math.PI / 2; P.pitch = -0.2; });
  await page.keyboard.down('KeyW'); await page.waitForTimeout(700); await page.keyboard.up('KeyW');
  console.log('prompt', await ev(() => F0W.cab.prompt && F0W.cab.prompt.id));
  await page.keyboard.press('KeyE'); await page.waitForTimeout(500); await shot('32_pick_via_E'); console.log('ov', await ev(() => F0W.cab.ov));
  await page.keyboard.press('Escape'); await page.waitForTimeout(300); console.log('ov after esc', await ev(() => F0W.cab.ov));
  await ev(() => { const P = F0W.cab.player; P.pos.x = 3.0; P.pos.z = 1.6; P.yaw = -Math.PI / 2; });
  await page.waitForTimeout(300); await page.keyboard.press('KeyE'); await page.waitForTimeout(400); console.log('ov', await ev(() => F0W.cab.ov)); await shot('33_bench_empty');
  await page.mouse.click(30 * 3, 40 * 3); await page.waitForTimeout(200); // 'Малая'
  await page.keyboard.press('Escape'); await page.waitForTimeout(300);
  await ev(() => { const P = F0W.cab.player; P.pos.x = 0; P.pos.z = 1.9; P.yaw = 0; P.pitch = -0.9; });
  await page.waitForTimeout(600); await shot('34_desk_from_south');
  await ev(() => { const P = F0W.cab.player; P.pos.x = 3.9; P.pos.z = -1.6; P.yaw = -Math.PI / 2; P.pitch = 0; });
  await page.waitForTimeout(400); console.log('exit prompt', await ev(() => F0W.cab.prompt && F0W.cab.prompt.id)); await shot('35_door');
  await page.keyboard.press('KeyE'); await page.waitForTimeout(2500); console.log('after exit screen', await ev(() => F0W.screen)); await shot('36_map_after_exit');
  // pause menu in play has the cabinet button
  await ev(() => F0W.start('russia')); await page.waitForTimeout(4000); await ev(() => { F0W.overlay = 'pause'; }); await page.waitForTimeout(400); await shot('37_play_pause');
  await browser.close();
})();
