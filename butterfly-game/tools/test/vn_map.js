// a flat plan of the Vietnam archipelago (land by height, bridges in red, worn ones in orange): node vn_map.js [seed] -> /tmp/vn_plan.png
const { chromium } = require(process.env.PW_CORE || 'playwright-core'); const fs = require('fs');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 400, height: 300 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000);
  const url = await pg.evaluate((sd) => { const w = World.build(BIOME_BY_ID.vietnam, sd), R = w.R, S = 3, N = Math.round(2 * R * S), c = document.createElement('canvas'); c.width = c.height = N; const x = c.getContext('2d'), im = x.createImageData(N, N);
    for (let j = 0; j < N; j++) for (let i = 0; i < N; i++) { const wx = i / S - R, wz = j / S - R, g = w.inGorge(wx, wz), h = w.heightAt(wx, wz), k = (j * N + i) * 4; if (Math.hypot(wx, wz) > R) { im.data[k] = 40; im.data[k + 1] = 50; im.data[k + 2] = 70; } else if (g) { im.data[k] = 190; im.data[k + 1] = 205; im.data[k + 2] = 215; } else { const t = Math.min(1, Math.max(0, (h - 6) / 22)); im.data[k] = 70 + t * 150; im.data[k + 1] = 150 + t * 60; im.data[k + 2] = 70 + t * 100; } im.data[k + 3] = 255; }
    x.putImageData(im, 0, 0); for (const b of w.bridges) { x.strokeStyle = b.weak ? '#ff8a00' : '#d02020'; x.lineWidth = 3; x.beginPath(); x.moveTo((b.A.x + R) * S, (b.A.z + R) * S); x.lineTo((b.B.x + R) * S, (b.B.z + R) * S); x.stroke(); }
    x.fillStyle = '#000'; x.font = '12px sans-serif'; w.islands.forEach((o, k) => x.fillText(String(k), (o.x + R) * S - 3, (o.z + R) * S + 4)); const r = c.toDataURL(); w.dispose(); return r; }, process.argv[2] || 'VN2');
  fs.writeFileSync('/tmp/vn_plan.png', Buffer.from(url.split(',')[1], 'base64')); console.log('errors', errs); await br.close();
})();
