// usage: node cab.js  -> screenshots of the cabinet flow into $OUT (default /tmp/cab)
const path = require('path'); const fs = require('fs');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const OUT = process.env.OUT || '/tmp/cab'; fs.mkdirSync(OUT, { recursive: true });
const HTML = path.resolve(__dirname, '../../Flora0world_Butterflies.html');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
  page.on('console', m => console.log('[console]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message, (e.stack || '').split('\n').slice(0, 5).join(' | ')));
  await page.addInitScript(() => {
    if (localStorage.getItem('flora0world_butterflies_v1')) return;
    const ids = ['machaon', 'vanessa_atalanta', 'morpho_menelaus', 'ornithoptera_brookiana', 'aglais_io', 'pieris_brassicae'];
    const caught = {}, specimens = []; let uid = 1;
    (window.__ids || []).forEach(() => {});
    localStorage.setItem('f0w_seed_pending', '1');
  });
  await page.goto('file://' + HTML + '#debug&nolock&cabinet');
  await page.waitForTimeout(1200);
  // seed save through the game's own API
  await page.evaluate(() => { const ids = SPECIES.slice(0, 14).map(s => s.id); ids.forEach((id, i) => { Save.add(id, SPECIES_BY_ID[id].biome); if (i % 3 === 0) Save.add(id, SPECIES_BY_ID[id].biome); }); });
  await page.evaluate(() => { F0W.toCabinet(); });
  await page.waitForTimeout(2500);
  const shot = async n => { await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  await shot('01_room_start');
  // look around
  const look = async (x, z, yaw, pitch, n) => { await page.evaluate(([x, z, yaw, pitch]) => { const P = F0W.cab.player; P.pos.x = x; P.pos.z = z; P.yaw = yaw; P.pitch = pitch; }, [x, z, yaw, pitch]); await page.waitForTimeout(900); await shot(n); };
  await look(-1.2, 0.2, Math.PI / 2, -0.15, '02_spread_desk');
  await look(0.2, 2.0, Math.PI, -0.1, '03_north_wall');
  await look(0.0, -2.0, 0, -0.6, '04_display_desk');
  await look(2.4, 1.6, -Math.PI / 2, -0.1, '05_workbench');
  await look(0.5, -0.5, Math.PI, 0.0, '06_south');
  await look(3.4, 0.2, 0.9, 0.0, '07_door');
  await browser.close();
})();
