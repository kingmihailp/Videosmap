// secret maps: the pool does not show up at once; the scarcest species never at the start and only now and then in the pool
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 400, height: 300 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const rate = await pg.evaluate(() => { const o = {}; for (const b of ['bog', 'papua']) { const B = BIOME_BY_ID[b], sc = B.species.find(s => s.scarce); let n = 0; for (let i = 0; i < 400; i++) if (Play.pickPool(B, new Rng('x' + i), B.poolSize, false).includes(sc)) n++; o[b] = [sc.id, n / 400]; } return o; });
  T('rarest species in the pool in about 3-9% of visits', Object.values(rate).every(v => v[1] > 0.02 && v[1] < 0.1), rate);
  for (const b of ['bog', 'papua']) for (const sd of ['S1', 'S2', 'S3']) {
    await pg.evaluate(([b, sd]) => { Save.data.maps = { bog: true, papua: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start(b, sd); }, [b, sd]);
    for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
    const r = await pg.evaluate(() => { const p = F0W.play, ids = new Set(p.flies.map(f => (SPECIES_BY_ID[f.sp.base] || f.sp).id)); return { pool: p.pool.length, now: ids.size, scarceNow: p.flies.some(f => (SPECIES_BY_ID[f.sp.base] || f.sp).scarce), queued: p.respawns.length }; });
    T(`${b} ${sd}: pool ${r.pool}, at the start only ${r.now} species in sight, the rest queued`, r.pool <= 10 && r.now <= 5 && !r.scarceNow && r.queued > 0, r);
  }
  console.log(errs.length ? 'ERRORS ' + errs : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
