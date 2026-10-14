// the Chihuahuan Desert: the world builds, has quicksand pits, nothing grows or floats in them, screenshots
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message)); pg.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push('C:' + m.text().slice(0, 200)); });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const sd = process.argv[2] || 'CH1';
  await pg.evaluate(([sd]) => { Save.data.maps = { chihuahua: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('chihuahua', sd); }, [sd]);
  for (let i = 0; i < 200; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  const r = await pg.evaluate(() => { F0W.overlay = 'hold'; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; const p = F0W.play, w = p.world;
    const pits = w.quickPits || []; const colHit = w.colliders.filter(c => pits.some(q => Math.hypot(c.x - q.x, c.z - q.z) < q.r * 0.9)).length;
    return { pits: pits.length, colHit, spawnDepth: w.quicksand(0, 0), centre: pits.length ? w.quicksand(pits[0].x, pits[0].z) : -1, species: p.pool.length, rare: p.pool.filter(s => s.rar === 3).map(s => s.latin + '/' + s.price), landmarks: w.landmarks, col: w.colliders.length, flowers: w.flowers.length, R: w.R }; });
  console.log(JSON.stringify(r));
  T('built with quicksand pits', r.pits >= 5, r.pits); T('no plant collider inside a pit', r.colHit === 0, r.colHit); T('spawn is firm', r.spawnDepth === 0); T('pit centre is deep', r.centre > 0.9, r.centre);
  T('has species', r.species >= 9, r.species);
  const shots = async (name, js) => { await pg.evaluate(js); await pg.evaluate(() => { const p = F0W.play; for (let i = 0; i < 40; i++) p.update(0.03, F0W.inp); }); await pg.waitForTimeout(900); await pg.screenshot({ path: '/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/chi_' + name + '.png' }); };
  await shots('spawn', () => { const p = F0W.play; p.player.pos.set(0, 5, 0); });
  await shots('pit', () => { const p = F0W.play, q = p.world.quickPits[0]; p.player.pos.set(q.x + q.r * 2.4, 5, q.z); p.player.yaw = Math.atan2(q.x - (q.x + q.r * 2.4), q.z - q.z) + Math.PI; p.player.pitch = -0.25; });
  await shots('storm', () => { const p = F0W.play; p.world.stormForce = { start: Date.now() - 20000, end: Date.now() + 40000 }; });
  console.log('errors', JSON.stringify(errs.slice(0, 8))); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
