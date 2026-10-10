// cabinet flow: spread (perfect + sloppy), build boxes, place on wall/desk, screenshots
const path = require('path'); const fs = require('fs');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const OUT = process.env.OUT || '/tmp/cab'; fs.mkdirSync(OUT, { recursive: true });
const HTML = path.resolve(__dirname, '../../Flora0world_Butterflies.html');
(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME || undefined, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--no-sandbox'] });
  const page = await browser.newPage({ viewport: { width: 1440, height: 810 } });
  page.on('console', m => console.log('[console]', m.text()));
  page.on('pageerror', e => console.log('[pageerror]', e.message, (e.stack || '').split('\n').slice(0, 5).join(' | ')));
  await page.goto('file://' + HTML + '#debug&nolock&cabinet');
  await page.waitForTimeout(1200);
  await page.evaluate(() => { localStorage.clear(); Save.data.specimens = []; Save.data.boxes = []; Save.data.caught = {}; const ids = SPECIES.slice(0, 18).map(s => s.id); ids.forEach((id, i) => { Save.add(id, SPECIES_BY_ID[id].biome); }); F0W.toCabinet(); });
  await page.waitForTimeout(2500);
  const shot = async n => { await page.screenshot({ path: path.join(OUT, n + '.png') }); };
  const mv = async (x, y) => { await page.mouse.move(x * 3, y * 3); };
  const ev = f => page.evaluate(f);
  await page.evaluate(() => { F0W.cab.open('pick'); }); await page.waitForTimeout(500); await shot('10_pick');
  async function spreadOne(mode) {
    await page.evaluate(() => { const c = Spread.pick.cards[0]; F0W.cab.click(c.x + 5, c.y + 5); }); await page.waitForTimeout(400);
    if (mode === 'peek') { await shot('11_spread_start'); }
    for (let w = 0; w < 4; w++) {
      const info = await ev(() => { const G = Spread.G, k = G.key(); return { cur: G.tipScreen(k, G.pose[k]), ideal: G.tipScreen(k, Art.IDEAL[k]) }; });
      await mv(info.cur.x, info.cur.y); await page.waitForTimeout(250);
      if (mode === 'sloppy') { await mv(info.ideal.x + 25, info.ideal.y + 20); await page.waitForTimeout(60); await page.keyboard.press('Space'); await page.waitForTimeout(120); continue; }
      const N = 14; for (let i = 1; i <= N; i++) { await mv(info.cur.x + (info.ideal.x - info.cur.x) * i / N, info.cur.y + (info.ideal.y - info.cur.y) * i / N); await page.waitForTimeout(45); }
      if (w === 1 && mode === 'peek') await shot('12_spread_mid');
      for (let i = 0; i < 200; i++) { const r = await ev(() => Spread.G.ring); if (r > 0.9 && r < 0.95) break; await page.waitForTimeout(8); }
      await page.keyboard.press('Space'); await page.waitForTimeout(150);
    }
    await page.waitForTimeout(1800); const res = await ev(() => Spread.G.res); console.log(mode, JSON.stringify(res));
    return res;
  }
  await spreadOne('peek'); await shot('13_result_perfect');
  await page.evaluate(() => F0W.cab.click(Spread.G.btn.x + 5, Spread.G.btn.y + 5)); await page.waitForTimeout(300);
  await spreadOne('sloppy'); await shot('14_result_sloppy');
  await page.evaluate(() => F0W.cab.click(Spread.G.btn.x + 5, Spread.G.btn.y + 5)); await page.waitForTimeout(300);
  // rest: auto-spread the others quickly by writing results (fast), then boxes
  await page.evaluate(() => { Save.rawList().slice(0, 14).forEach((s, i) => { s.q = 60 + (i * 7) % 40; s.pose = JSON.parse(JSON.stringify(Art.IDEAL)); }); Save.write(); });
  await page.evaluate(() => { F0W.cab.close(); }); await page.waitForTimeout(300);
  await page.evaluate(() => { Save.data.boxStock = { S: 5, M: 5, L: 5 }; F0W.cab.open('bench'); }); await page.waitForTimeout(300);
  const clickBtn = async id => { await page.evaluate(id => { const b = Boxes.bench.btns.find(b => b.id === id); F0W.cab.click(b.x + 3, b.y + 3); }, id); await page.waitForTimeout(200); };
  await clickBtn('L'); await clickBtn('auto'); await shot('15_bench_L');
  await clickBtn('style'); await clickBtn('M'); await clickBtn('auto'); await clickBtn('style'); await clickBtn('M'); await clickBtn('auto'); await clickBtn('style'); await clickBtn('S'); await clickBtn('auto'); await shot('16_bench_more');
  await page.evaluate(() => { Save.rawList().forEach((s, i) => { s.q = 90 + i * 4; s.pose = JSON.parse(JSON.stringify(Art.IDEAL)); }); for (const [sz, st] of [['M', 1], ['S', 2], ['M', 0]]) { const b = Save.addBox(sz, st); } const fr = Save.freeSpread(); const bs = Save.data.boxes; if (fr[0]) Save.putIn(bs[4], 0, fr[0].uid); if (fr[1]) Save.putIn(bs[5], 0, fr[1].uid); for (let i = 0; i < 4; i++) { Save.add(SPECIES[20 + i].id, SPECIES[20 + i].biome); const sp = Save.data.specimens[Save.data.specimens.length - 1]; sp.q = 70 + i * 8; sp.pose = JSON.parse(JSON.stringify(Art.IDEAL)); Save.putIn(bs[6], i, sp.uid); } });
  await page.evaluate(() => { F0W.cab.close(); }); await page.waitForTimeout(200);
  await page.evaluate(() => { Boxes.place.open('wall'); F0W.cab.open('place'); }); await page.waitForTimeout(300); await shot('17_place_wall_empty');
  // place all boxes by clicking: select row, click first fitting slot
  for (let n = 0; n < 6; n++) {
    const done = await page.evaluate(() => {
      const P = Boxes.place; P.layout(); const r = P.rows[0]; if (!r) return true; F0W.cab.click(r.x + 3, r.y + 3); P.layout();
      const cb = P.cur(); for (const s of P.slots) { const t = s.t; const ok = (t === 'wall' && !Boxes.boxesAt('wall', s.i).length && ({ S: 1, M: 2, L: 3 }[cb.size] <= { S: 1, M: 2, L: 3 }[s.cls])) || (t === 'top' && cb.size !== 'L' && !Boxes.boxesAt('top', s.i).length); if (ok) { F0W.cab.click(s.x + 2, s.y + 2); return false; } }
      return false;
    }); await page.waitForTimeout(150); if (done) break;
  }
  await shot('18_place_wall');
  await page.evaluate(() => { Boxes.place.tab = 'desk'; });
  for (let n = 0; n < 6; n++) {
    const done = await page.evaluate(() => { const P = Boxes.place; P.layout(); const r = P.rows[0]; if (!r) return true; F0W.cab.click(r.x + 3, r.y + 3); P.layout(); const cb = P.cur(); for (const s of P.slots) { if (Boxes.boxesAt(s.t, s.i).length && s.t !== 'drawer') continue; F0W.cab.click(s.x + 2, s.y + 2); if (cb.loc) return false; } return false; }); await page.waitForTimeout(150); if (done) break;
  }
  await page.evaluate(() => { Boxes.place.tab = 'desk'; }); await page.waitForTimeout(200); await shot('19_place_desk');
  await page.evaluate(() => { F0W.cab.close(); }); await page.waitForTimeout(400);
  const look = async (x, z, yaw, pitch, n) => { await page.evaluate(([x, z, yaw, pitch]) => { const P = F0W.cab.player; P.pos.x = x; P.pos.z = z; P.yaw = yaw; P.pitch = pitch; }, [x, z, yaw, pitch]); await page.waitForTimeout(1000); await shot(n); };
  await look(0, -0.4, 0, 0.0, '20_wall_exhibit'); await look(0, 2.0, Math.PI, -0.55, '21_desk_top'); await look(-1.5, 1.4, -0.9, -0.5, '22_desk_angle'); await look(0.1, 1.9, 0, -0.95, '24_desk_south');
  await page.evaluate(() => { F0W.cab.ov = 'pause'; }); await page.waitForTimeout(300); await shot('23_pause');
  console.log(JSON.stringify(await ev(() => ({ spec: Save.data.specimens.length, spread: Save.spreadList().length, boxes: Save.data.boxes.map(b => [b.size, b.items.filter(Boolean).length, b.loc]) }))));
  await browser.close();
})();
