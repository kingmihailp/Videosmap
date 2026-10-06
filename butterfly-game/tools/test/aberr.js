// aberrations: every real species gets visibly (but boundedly) different aberrants
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 1200, height: 800 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const res = await pg.evaluate(() => {
    const px = sp => { const c = Art.specimen(sp); return c.getContext('2d').getImageData(0, 0, c.width, c.height).data; };
    const out = { n: 0, noAb: [], weak: [], strong: [], hue: 0, errs: [], parseBad: 0, ocean: Aberr.get('x~ABCDE') };
    const hue = (r, g, b) => { const mx = Math.max(r, g, b), mn = Math.min(r, g, b); if (mx - mn < 70) return null; const d = mx - mn; let h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return (h * 60 + 360) % 360; };
    const stats = [];
    for (const sp of SPECIES.filter(s => Aberr.eligible(s))) {
      const base = px(sp); let minD = 1, maxHue = 0;
      for (let k = 0; k < 6; k++) {
        const id = sp.id + '~' + Aberr.randomCode(); let ab; try { ab = SPECIES_BY_ID[id]; } catch (e) { out.errs.push(id + ' ' + e.message); continue; }
        if (!ab) { out.noAb.push(id); continue; } out.n++;
        const q = px(ab); let diff = 0, tot = 0, hs = 0, hn = 0;
        for (let i = 0; i < base.length; i += 4) { if (base[i + 3] < 128 && q[i + 3] < 128) continue; tot++; const d = Math.abs(base[i] - q[i]) + Math.abs(base[i + 1] - q[i + 1]) + Math.abs(base[i + 2] - q[i + 2]) + (base[i + 3] !== q[i + 3] ? 200 : 0); if (d > 30) diff++; const h1 = hue(base[i], base[i + 1], base[i + 2]), h2 = hue(q[i], q[i + 1], q[i + 2]); if (h1 !== null && h2 !== null) { let dh = Math.abs(h1 - h2); if (dh > 180) dh = 360 - dh; hs += dh; hn++; } }
        const f = diff / tot; minD = Math.min(minD, f); if (hn > 40) maxHue = Math.max(maxHue, hs / hn);
      }
      stats.push([sp.id, minD, maxHue]);
    }
    out.species = stats.length; out.minDiffAll = Math.min(...stats.map(s => s[1])); out.avgMin = stats.reduce((a, s) => a + s[1], 0) / stats.length; out.maxMeanHue = Math.max(...stats.map(s => s[2]));
    out.weak = stats.filter(s => s[1] < 0.05).map(s => s[0] + ':' + s[1].toFixed(3)); out.hueBig = stats.filter(s => s[2] > 30).map(s => s[0] + ':' + s[2].toFixed(0));
    return out;
  });
  console.log(JSON.stringify(res, null, 1));
  await br.close();
})();
