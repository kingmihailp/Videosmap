// the world map with every secret place unlocked: pins are numbered 1..N without repeats, two-digit numbers fit; digit keys (1 then 1 = the 11th)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  await pg.evaluate(() => { Save.data.maps = { bog: true, papua: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.screen = 'map'; });
  await pg.waitForTimeout(800);
  const n = await pg.evaluate(() => visibleBiomes().length); T('pin count', n >= 11, n);
  const key = async c => { await pg.keyboard.press(c); await pg.waitForTimeout(60); };
  const sel = () => pg.evaluate(() => Screens.wmap.sel);
  await key('Digit1'); T('1 -> pin 1', await sel() === 0); await pg.waitForTimeout(900);
  await key('Digit9'); T('9 -> pin 9', await sel() === 8); await key('Digit0'); T('0 -> pin 10', await sel() === 9);
  await pg.waitForTimeout(900); await key('Digit1'); await key('Digit1'); T('1,1 quickly -> pin 11', await sel() === 10, await sel());
  await pg.waitForTimeout(900); await key('Digit1'); T('1 alone afterwards -> pin 1', await sel() === 0, await sel());
  await pg.waitForTimeout(300); await pg.screenshot({ path: '/tmp/map_pins.png' });
  console.log(errs.length ? 'ERRORS ' + errs : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
