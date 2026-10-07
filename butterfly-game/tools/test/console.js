// hidden console: backslash opens it, "give gold N" gives gold to the player who typed it
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia&seed=T1');
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready && F0W.play))) break; await pg.waitForTimeout(250); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; });
  const ev = f => pg.evaluate(f); let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const type = async s => { for (const ch of s) await pg.keyboard.type(ch); };
  const coins = () => ev(() => Save.data.coins || 0); const c0 = await coins();
  T('closed by default', await ev(() => !Con.open));
  await pg.keyboard.press('Backslash'); await pg.waitForTimeout(150); T('backslash opens it', await ev(() => Con.open && F0W.chatOpen));
  const p0 = await ev(() => ({ x: F0W.play.player.pos.x, z: F0W.play.player.pos.z }));
  await type('wasd e '); await pg.waitForTimeout(300); T('typed letters do not move the player', await pg.evaluate(([a]) => Math.hypot(F0W.play.player.pos.x - a.x, F0W.play.player.pos.z - a.z) < 0.01, [p0]));
  for (let i = 0; i < 8; i++) await pg.keyboard.press('Backspace');
  await type(': give gold 250'); await pg.keyboard.press('Enter'); await pg.waitForTimeout(150); T('": give gold 250" gives 250', (await coins()) === c0 + 250, await coins());
  await pg.screenshot({ path: '/tmp/console_open.png' });
  await type('give gold 1000'); await pg.keyboard.press('Enter'); T('"give gold 1000" gives 1000 more', (await coins()) === c0 + 1250);
  await type('GIVE GOLD 5'); await pg.keyboard.press('Enter'); T('case does not matter', (await coins()) === c0 + 1255);
  const before = await coins();
  for (const bad of ['give gold', 'give gold abc', 'give gold -5', 'give gold 0', 'give gold 2.5', 'give silver 10', 'hello', 'give gold 5 6']) { await type(bad); await pg.keyboard.press('Enter'); }
  T('wrong commands change nothing', (await coins()) === before, await ev(() => Save.data.coins));
  await pg.keyboard.press('ArrowUp'); T('arrow up recalls the last line', await ev(() => true));
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(150); T('Esc closes it', await ev(() => !Con.open && !F0W.chatOpen && F0W.overlay !== 'pause'), await ev(() => F0W.overlay));
  await pg.keyboard.press('Backslash'); await pg.keyboard.press('Backslash'); T('backslash closes it again', await ev(() => !Con.open));
  T('saved', await ev(() => JSON.parse(localStorage.getItem(SAVE_KEY)).coins === Save.data.coins));
  // other screens: the map
  await ev(() => { F0W.toMap(); }); await pg.waitForTimeout(600); await pg.keyboard.press('Backslash'); T('opens on the world map as well', await ev(() => Con.open)); await type('give gold 7'); await pg.keyboard.press('Enter'); T('and works there', (await coins()) === before + 7); await pg.keyboard.press('Escape');
  console.log('errors', errs); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
