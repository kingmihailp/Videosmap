// the volume sliders of the settings: click and drag, the values are saved and reach the audio graph
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  await pg.evaluate(() => { Snd.init(); Snd.startAmbient('russia'); F0W.modal = 'settings'; F0W.fade = 0; F0W.fadeTarget = 0; }); await pg.waitForTimeout(4000);
  const L0 = await pg.evaluate(() => Snd.levels()); T('default: master 0.8, sounds 0.9, music 0.5', L0 && Math.abs(L0.master - 0.8) < 0.02 && Math.abs(L0.sfx - 0.9) < 0.02 && Math.abs(L0.music - 0.5) < 0.05, L0);
  const sl = await pg.evaluate(() => { Screens.settings.layout(); return Screens.settings.sliders.map(s => ({ id: s.id, tx: s.tx, tw: s.tw, y: s.y })); }); T('three sliders', sl.length === 3 && sl.map(s => s.id).join() === 'volume,volSfx,volMusic', sl);
  const S = 2;                                                                 // the logical 480x270 screen is shown at twice the size
  const drag = async (s, a, b) => { await pg.mouse.move((s.tx + s.tw * a) * S, (s.y + 7) * S); await pg.mouse.down(); await pg.mouse.move((s.tx + s.tw * b) * S, (s.y + 7) * S, { steps: 6 }); await pg.mouse.up(); await pg.waitForTimeout(500); };
  await drag(sl[0], 0.5, 0.5); const v1 = await pg.evaluate(() => [Save.data.settings.volume, Snd.levels()]); T('a click in the middle of the master slider sets 50% and the master gain follows', Math.abs(v1[0] - 0.5) < 0.06 && Math.abs(v1[1].master - 0.4) < 0.05, v1);
  await drag(sl[0], 0.3, 1.0); const v2 = await pg.evaluate(() => [Save.data.settings.volume, Snd.levels()]); T('dragging to the right end gives 100%', v2[0] === 1 && Math.abs(v2[1].master - 0.8) < 0.03, v2);
  await drag(sl[1], 0.9, 0.0); const v3 = await pg.evaluate(() => [Save.data.settings.volSfx, Snd.levels()]); T('the sounds slider dragged to zero mutes sounds and surroundings', v3[0] === 0 && v3[1].sfx < 0.02 && v3[1].amb < 0.02, v3);
  await drag(sl[2], 0.5, 0.25); const v4 = await pg.evaluate(() => [Save.data.settings.volMusic, Snd.levels()]); T('the music slider scales the music (25%)', Math.abs(v4[0] - 0.25) < 0.06 && Math.abs(v4[1].music - 0.5 * v4[0]) < 0.06, v4);
  const saved = await pg.evaluate(() => { const d = JSON.parse(localStorage.getItem(SAVE_KEY)); return [d.settings.volume, d.settings.volSfx, d.settings.volMusic]; }).catch(() => null); T('the values are saved', saved && saved[1] === 0 && saved[0] === 1, saved);
  await pg.screenshot({ path: '/tmp/settings_vol.png' });
  T('no page errors', errs.length === 0, errs.slice(0, 3));
  console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
