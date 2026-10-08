// the pause menu of every room (museum, secret market, the chalet room) opens the settings and the stash without errors
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const wait = async name => { for (let i = 0; i < 80; i++) { if (await pg.evaluate(n => F0W.screen === 'cabinet' && F0W.cab && F0W.cab.constructor.name === n, name).catch(() => false)) return true; await pg.waitForTimeout(400); } return false; };
  await pg.evaluate(() => { Save.data.seenMuseum = true; Save.data.seenCab = true; Save.data.seenMarket = true; });
  for (const [name, go, cls] of [['museum', () => F0W.toMuseum(), 'Mus'], ['secret market', () => F0W.toSecret(), 'SecretMarket'], ['chalet room', () => F0W.enterRoom('chalet', null), 'Room']]) {
    await pg.evaluate(() => { F0W.modal = null; F0W.fade = 0; F0W.fadeTarget = 0; }); await pg.evaluate(go); const ok = await wait(cls); T(name + ' opens', ok);
    if (!ok) continue; await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; });
    const r = await pg.evaluate(() => { const c = F0W.cab; c.ov = 'pause'; let e1 = null, e2 = null; try { c.pauseAct ? c.pauseAct('settings') : c.hooks.settings(); } catch (e) { e1 = String(e); } const m1 = F0W.modal; F0W.modal = null; try { c.hooks.stash(); } catch (e) { e2 = String(e); } const m2 = F0W.modal; F0W.modal = null; return { e1, e2, m1, m2, hasSettings: typeof c.hooks.settings, hasStash: typeof c.hooks.stash }; });
    T(name + ': the pause menu opens the settings and the stash', !r.e1 && !r.e2 && r.m1 === 'settings' && r.m2 === 'stash', r);
  }
  T('no page errors', errs.length === 0, errs.slice(0, 3));
  console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
