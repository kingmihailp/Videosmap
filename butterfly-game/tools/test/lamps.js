// lamps: no free flashlight in the ocean, the headlamp is worn / taken off (L), the torch busies the hands only at night locations
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&night'); await pg.waitForTimeout(2500);
  const start = async (id, lp) => { await pg.evaluate(([id, lp]) => { Save.data.trap = { tr: {}, fl: {}, hn: {}, lp: lp || {} }; Save.data.headOff = false; delete Save.data.lamp; Save.data.maps = Object.fromEntries(BIOMES.map(b => [b.id, true])); F0W.fade = 0; F0W.fadeTarget = 0; F0W.screen = 'title'; F0W.start(id, 'LP1'); }, [id, lp]);
    for (let i = 0; i < 200; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
    await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; }); await pg.waitForTimeout(800); };
  const st = () => pg.evaluate(() => { const p = F0W.play; return { flash: !!p.flash, lamp: p.lamp, hands: p.lampHands, on: p.flashOn, head: Save.data.headOff ? 'off' : 'worn' }; });
  await start('ocean', {});
  let r = await st(); T('the ocean: no flashlight by default', !r.flash && !r.lamp, r);
  await start('ocean', { torch: 1 }); r = await st(); T('the ocean with a torch: a flashlight, the hands stay free (the net can be swung)', r.flash && r.lamp === 'torch' && !r.hands, r);
  await start('ocean', { head: 1 }); r = await st(); T('the ocean with the headlamp: worn at once', r.flash && r.lamp === 'head', r);
  await pg.evaluate(() => Lamps.toggleHead(F0W.play)); await pg.waitForTimeout(300); r = await st(); T('L takes the headlamp off: the light is gone', !r.flash && r.head === 'off', r);
  await pg.evaluate(() => Lamps.toggleHead(F0W.play)); await pg.waitForTimeout(300); r = await st(); T('L puts it on again: the light is back', r.flash && r.lamp === 'head' && r.head === 'worn', r);
  await start('russia', { head: 1, torch: 1 }); r = await st(); T('a night location with both: the headlamp is used (hands free)', r.lamp === 'head' && !r.hands, r);
  await pg.evaluate(() => Lamps.toggleHead(F0W.play)); await pg.waitForTimeout(300); r = await st(); T('the headlamp taken off: the torch takes over (and busies the hands at night)', r.lamp === 'torch' && r.hands, r);
  await start('russia', { head: 1 }); await pg.evaluate(() => Lamps.toggleHead(F0W.play)); await pg.waitForTimeout(300); r = await st(); T('headlamp taken off and nothing else: no light', !r.flash, r);
  const none = await pg.evaluate(async () => { const p = F0W.play; const t0 = p.t; await new Promise(r => { const iv = setInterval(() => { if (p.t - t0 > 0.15) { clearInterval(iv); r(); } }, 40); }); return p.flies.filter(f => f.mesh.visible).length; }); T('and then no moth is seen', none === 0, none);
  await pg.evaluate(() => { Save.data.headOff = false; Save.data.trap = { tr: {}, fl: {}, hn: {}, lp: {} }; Lamps.toggleHead(F0W.play); }); const toast = await pg.evaluate(() => F0W.play.toasts.map(t => t.s || t.text || t).join('|')); T('without a headlamp L only says so', !(await st()).flash, toast);
  T('no errors', errs.length === 0, errs.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
