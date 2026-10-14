// raw pieces for the Steam capsules: the panoramas (480x270, no UI) and the logo on a transparent background -> steam/_src
const { chromium } = require(process.env.PW_CORE || 'playwright-core'); const fs = require('fs');
const OUT = '/home/user/Videosmap/butterfly-game/steam/_src/';
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const r = await pg.evaluate(() => {
    const out = {}, c = document.createElement('canvas'); c.width = 480; c.height = 270; const ctx = c.getContext('2d');
    for (const id of ['alps', 'japan', 'chihuahua', 'amazon', 'kenya', 'med']) { ctx.clearRect(0, 0, 480, 270); Panorama.set(id); Panorama.draw(ctx, 5.3, 0); out['pano_' + id] = c.toDataURL(); }
    const l = document.createElement('canvas'); l.width = 480; l.height = 100; const g = l.getContext('2d'); g.save(); g.scale(2, 2); T.draw(g, 'Flora0world', 120, 6, { size: 22, align: 'c', color: '#b8f090', outline: '#0c2a1a', shadow: '#061810' }); g.restore();
    T.draw(g, 'BUTTERFLIES', 240, 66, { size: 14, align: 'c', color: c0(), outline: '#2a1a08', shadow: '#000' }); out.logo = l.toDataURL(); ['papilio_machaon', 'ornithoptera_alexandrae', 'aglais_io', 'euchloe_guaymasensis', 'gonepteryx_rhamni'].forEach(id => { const sp = SPECIES.find(x => x.id === id); if (!sp) return; const im = Art.specimen(sp), q = document.createElement('canvas'); q.width = 80; q.height = 40; q.getContext('2d').drawImage(im, 0, 0, 80, 40); out['bf_' + id] = q.toDataURL(); }); return out;
    function c0() { return '#f0c850'; }
  });
  for (const [k, u] of Object.entries(r)) fs.writeFileSync(OUT + k + '.png', Buffer.from(u.split(',')[1], 'base64'));
  console.log('errors', JSON.stringify(errs.slice(0, 3))); await br.close();
})();
