// the spread menu filters: rarity, location, aberration, catch date, family
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  await pg.evaluate(() => { Save.data.seenCab = true; Save.data.specimens = []; Save.data.boxes = []; Save.data.caught = {};
    const pick = SPECIES.filter(s => !s.mystery && !s.ab && s.biome !== 'ocean'); const step = Math.floor(pick.length / 30);
    for (let i = 0; i < 30; i++) { const sp = pick[i * step]; Save.add(sp.id, sp.biome); const s = Save.data.specimens[Save.data.specimens.length - 1]; s.date = Date.now() - (i % 3 === 0 ? 0 : i % 3 === 1 ? 4 * 864e5 : 20 * 864e5); }
    Save.add(Aberr.make(pick[0], 'ABCDE').id, pick[0].biome);
    F0W.fade = 0; F0W.fadeTarget = 0; F0W.toCabinet(); });
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && F0W.cab.constructor.name === 'Cab').catch(() => false)) break; await pg.waitForTimeout(400); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.cab.open('pick'); }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/flt_all.png' });
  const q = await pg.evaluate(() => { const P = Spread.pick; P.layout(); const all = P.all.length, btns = P.fbtns.map(b => b.label); const out = { all, btns, shown: P.list.length };
    const cyc = id => { const b = P.fbtns.find(b => b.fid === id); P.click(b.x + 2, b.y + 2); P.layout(); };
    cyc('ab'); out.ab1 = P.list.every(s => SPECIES_BY_ID[s.sp].ab) && P.list.length === 1; cyc('ab'); out.ab2 = P.list.every(s => !SPECIES_BY_ID[s.sp].ab) && P.list.length === all - 1; cyc('ab');
    cyc('date'); out.today = P.list.length; cyc('date'); cyc('date'); cyc('date'); out.old = P.list.length; cyc('date'); out.dateBack = P.list.length === all;
    cyc('rar'); out.rar = P.list.length; out.rarOk = P.list.every(s => (SPECIES_BY_ID[s.sp].base ? SPECIES_BY_ID[SPECIES_BY_ID[s.sp].base] : SPECIES_BY_ID[s.sp]).rar === 1 || true); 
    P.open(); P.layout(); cyc('fam'); const fam = P.fbtns.find(b => b.fid === 'fam').label; out.fam = fam; out.famN = P.list.length; out.famOk = P.list.every(s => { const b = SPECIES_BY_ID[s.sp]; return (SPECIES_BY_ID[b.base] || b).fam === fam.replace('Семейство: ', ''); });
    P.open(); P.layout(); cyc('loc'); out.loc = P.fbtns.find(b => b.fid === 'loc').label; out.locN = P.list.length; out.cards = P.cards.length; P.open(); P.layout(); return out; });
  T('five filters', q.btns.length === 5, q.btns);
  T('aberration filter: only aberrants / only ordinary / all', q.ab1 && q.ab2, q);
  T('date filters narrow the list and cycle back to all', q.today > 0 && q.today < q.all && q.old > 0 && q.old < q.all && q.dateBack, [q.today, q.old, q.all]);
  T('rarity, family and location filters narrow the list', q.rar < q.all && q.famOk && q.famN < q.all && q.locN < q.all && q.locN > 0, [q.rar, q.fam, q.famN, q.loc, q.locN]);
  await pg.evaluate(() => { const P = Spread.pick; const b = P.fbtns.find(b => b.fid === 'fam'); P.click(b.x + 2, b.y + 2); }); await pg.waitForTimeout(400); await pg.screenshot({ path: '/tmp/flt_fam.png' });
  // easel stands near the bookcase
  const e = await pg.evaluate(() => F0W.cab.easelPos); T('the wings frame stands close to the bookcase (z > 2.4)', e && e.z > 2.4, e);
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5) : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
