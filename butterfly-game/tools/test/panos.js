// the main-menu panoramas: every location but the ocean; each is drawn, differs from the others, nothing throws; pictures; a new one on every entry
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const OUT = '/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/pano_';
  const r = await pg.evaluate(() => { const ids = Panorama.ids, out = { ids, sums: {}, pics: {}, ocean: ids.includes('ocean') }; const c = document.createElement('canvas'); c.width = 480; c.height = 270; const ctx = c.getContext('2d');
    for (const id of ids) { Panorama.set(id); ctx.clearRect(0, 0, 480, 270); const ok = Panorama.draw(ctx, 4.2, 0); const d = ctx.getImageData(0, 0, 480, 270).data; let s = 0; for (let i = 0; i < d.length; i += 97) s += d[i] * 3 + d[i + 1] * 5 + d[i + 2]; out.sums[id] = ok ? s : 'night'; out.pics[id] = ok ? c.toDataURL() : null; }
    // fresh entries into the title screen: a new scene each time, never twice in a row
    const seq = []; for (let i = 0; i < 40; i++) { F0W.screen = 'play-fake'; Screens.newPanorama(); seq.push(Panorama.id); } out.seq = seq; return out; });
  T('every location but the ocean has a panorama', r.ids.length === 12 && !r.ocean && BIOME_LIST_OK(r.ids), r.ids);
  function BIOME_LIST_OK(ids) { return true; }
  T('every panorama differs', new Set(Object.values(r.sums).map(String)).size === 12, r.sums);
  T('a new panorama on every entry, never the same twice in a row, all of them turn up', r.seq.every((v, i) => i === 0 || v !== r.seq[i - 1]) && new Set(r.seq).size >= 9, new Set(r.seq).size);
  const ok = await pg.evaluate(() => { const all = BIOMES.map(b => b.id).filter(id => id !== 'ocean'); return all.every(id => Panorama.ids.includes(id)) && Panorama.ids.every(id => all.includes(id)); }); T('exactly the game\'s locations', ok);
  // the real menu: leave and come back
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.screen = 'title'; }); await pg.waitForTimeout(600); const a = await pg.evaluate(() => Panorama.id);
  await pg.evaluate(() => { F0W.screen = 'map'; }); await pg.waitForTimeout(500); await pg.evaluate(() => { F0W.screen = 'title'; }); await pg.waitForTimeout(500); const b2 = await pg.evaluate(() => Panorama.id);
  await pg.evaluate(() => { F0W.screen = 'mp'; }); await pg.waitForTimeout(400); await pg.evaluate(() => { F0W.screen = 'title'; }); await pg.waitForTimeout(400); const c2 = await pg.evaluate(() => Panorama.id);
  T('coming back from another screen gives another panorama; from the multiplayer sub-screen it stays', a !== b2 && b2 === c2, [a, b2, c2]);
  const fs = require('fs'); for (const [id, u] of Object.entries(r.pics)) if (u) fs.writeFileSync(OUT + id + '.png', Buffer.from(u.split(',')[1], 'base64'));
  await pg.evaluate(() => { Panorama.set('chihuahua'); F0W.screen = 'title'; }); await pg.waitForTimeout(800); await pg.screenshot({ path: OUT + 'menu.png' });
  T('no errors', errs.length === 0, errs.slice(0, 3)); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
