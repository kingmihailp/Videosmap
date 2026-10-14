// the Steam/desktop bridge: with a fake window.F0WNative the save goes through it and achievements are unlocked; without it nothing changes
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.addInitScript(() => { window.__file = ''; window.__ach = []; window.F0WNative = { readSave: () => window.__file, writeSave: s => { window.__file = s; }, steam: { unlock: id => window.__ach.push(id) } }; });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { const b = BIOMES[0]; b.species.slice(0, 3).forEach(s => Save.data.caught[s.id] = (Save.data.caught[s.id] || 0) + 1); Save.data.coins = 200000; Save.write(); });
  await pg.waitForTimeout(3500);
  const r = await pg.evaluate(() => ({ file: window.__file.length, ach: window.__ach, ok: (() => { try { return JSON.parse(window.__file).coins === 200000; } catch (e) { return false; } })() }));
  T('the save is written through the native bridge', r.file > 10 && r.ok, r.file);
  T('achievements unlock (first catch, rich), each once', r.ach.includes('ACH_FIRST_CATCH') && r.ach.includes('ACH_RICH') && new Set(r.ach).size === r.ach.length, r.ach);
  await pg.evaluate(() => { Save.data = { caught: {}, aberr: {}, coins: 0, settings: Save.data.settings, specimens: [], boxes: [], uid: 1 }; Save.load(); });
  T('and it is read back from there', await pg.evaluate(() => Save.data.coins === 200000));
  T('no errors', errs.length === 0, errs.slice(0, 3));
  const p2 = await br.newPage(); const e2 = []; p2.on('pageerror', e => e2.push(e.message)); await p2.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await p2.waitForTimeout(3500);
  T('works without the bridge (browser)', e2.length === 0, e2.slice(0, 3));
  console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
