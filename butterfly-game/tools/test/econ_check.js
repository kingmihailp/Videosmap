// prices: spread = 2.5 x raw; Bog and New Guinea butterflies cost double (Queen Alexandra's birdwing excepted: 1500 raw)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000);
  const r = await pg.evaluate(() => {
    const mk = (id, q) => ({ uid: 1, sp: id, q, box: null, pose: null }), out = { bad: [], n: 0 };
    for (const sp of SPECIES) { if (sp.mystery || sp.biome === 'ocean') continue; const raw = Econ.price(mk(sp.id, null)), s1 = Econ.price(mk(sp.id, 100)), s2 = Econ.price(mk(sp.id, 5)); out.n++;
      const lo = Econ.price(mk(sp.id, 0)); if (!(s1 >= s2 && s2 >= lo && s1 > lo) || Math.abs(s1 - raw * 3) > 2.1 || Math.abs(lo - raw * 1.45) > 1.4) out.bad.push(['spread', sp.id, raw, lo, s2, s1]); }
    const ref = (id, base) => { const sp = SPECIES_BY_ID[id]; return [Econ.price(mk(id, null)), Math.round(base * 0.55)]; };
    const eg = (id) => { const sp = SPECIES_BY_ID[id], b = { 1: 6, 2: 16, 3: 42 }[sp.rar || 1]; return { id, raw: Econ.price(mk(id, null)), spread: Econ.price(mk(id, 80)), base: Econ.baseValue(sp) }; };
    out.bog = eg('colias_palaeno'); out.papua = eg('papilio_ulysses'); out.plain = eg('papilio_machaon'); out.queenRaw = Econ.price(mk('ornithoptera_alexandrae', null)); out.queenSpread = Econ.price(mk('ornithoptera_alexandrae', 100)); out.queenSpread50 = Econ.price(mk('ornithoptera_alexandrae', 50));
    out.queenAb = Econ.price(mk(Aberr.make(SPECIES_BY_ID.ornithoptera_alexandrae, 'ABCDE').id, null)); out.queenAbSpread = Econ.price(mk(Aberr.make(SPECIES_BY_ID.ornithoptera_alexandrae, 'ABCDE').id, 100));
    const a = Econ.info(mk('colias_palaeno', null)), b2 = Econ.info(mk('papilio_machaon', null)); out.ratio = a.base / b2.base; out.locs = [a.loc, b2.loc]; out.rarDemo = [a.species.rar, b2.species.rar];
    return out;
  });
  let bad = r.bad.length; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  T('every species: spread 1.45x (q0) .. 3x (q100) of raw, growing with the quality', r.bad.length === 0, r.bad.slice(0, 3)); T('Bog and New Guinea species: x2', r.locs[0] === 2 && r.locs[1] === 1 && r.papua.raw >= 2 * 8, r.locs);
  T('Queen Alexandra: raw 1500, perfectly spread 4500, aberration x ~6 of that', r.queenRaw === 1500 && r.queenSpread === 4500 && r.queenSpread50 > 3300 && r.queenSpread50 < 3400 && r.queenAb > 8100 && r.queenAb < 9900 && Math.abs(r.queenAbSpread / r.queenAb - 3) < 0.01, [r.queenRaw, r.queenSpread, r.queenSpread50, r.queenAb, r.queenAbSpread]);
  { const q = await pg.evaluate(() => { const mk = (id, q) => ({ uid: 1, sp: id, q, box: null, pose: null }); const id = 'coenonympha_oedippus', sp = SPECIES_BY_ID[id]; if (!sp) return null; const ab = Aberr.make(sp, 'ABCDE').id; return { raw: Econ.price(mk(id, null)), s100: Econ.price(mk(id, 100)), s0: Econ.price(mk(id, 0)), ab: Econ.price(mk(ab, null)), abS: Econ.price(mk(ab, 100)), bulk: Econ.bulkOk ? Econ.bulkOk(sp) : false, scarce: sp.scarce }; });
    T('False ringlet: raw 1200, spread 1.45x-3x, aberration x~6, not in sell-all', !!q && q.raw === 1200 && q.s100 === 3600 && q.s0 > 1700 && q.s0 < 1780 && q.ab > 6400 && q.ab < 7900 && Math.abs(q.abS / q.ab - 3) < 0.01 && !q.bulk && q.scarce === 0.18, q); }
  { const o = await pg.evaluate(() => BIOME_BY_ID.ocean.species.filter(sp => !sp.fixedPrice).map(sp => { const mk = q => ({ uid: 1, sp: sp.id, q, box: null, pose: null }); return { raw: Econ.price(mk(null)), loc: Econ.info(mk(null)).loc, base: Econ.info(mk(null)).base }; }));
    T('Ocean butterflies: raw 30-40 x2 location = 60-80', o.length > 0 && o.every(x => x.loc === 2 && x.raw >= 58 && x.raw <= 82), o.slice(0, 3)); }
  { const o = await pg.evaluate(() => { const mk = (id, q) => ({ uid: 1, sp: id, q, box: null, pose: null }), res = {}; for (const id of ['lux_ductrix', 'lux_curiosa', 'mutator_chromatis']) res[id] = [Econ.price(mk(id, null)), Econ.price(mk(id, 0)), Econ.price(mk(id, 100)), Econ.info(mk(id, null)).loc, SPECIES_BY_ID[id].thin]; const B = BIOME_BY_ID.ocean, cnt = {}; for (let i = 0; i < 600; i++) for (const sp of Play.pickPool(B, new Rng('o' + i), B.poolSize, false)) cnt[sp.id] = (cnt[sp.id] || 0) + 1; res.cnt = cnt; return res; });
    const thin = ['lux_ductrix', 'lux_curiosa', 'mutator_chromatis'], others = Object.keys(o.cnt).filter(k => !thin.includes(k)), avg = others.reduce((a, k) => a + o.cnt[k], 0) / others.length;
    T('Guiding, curious and modifier moths: 400, no x2, spread x1.45..3', thin.every(id => o[id][0] === 400 && o[id][3] === 1 && o[id][1] === Math.round(400 * 1.45) && o[id][2] === 1200), thin.map(id => o[id]));
    T('...and clearly rarer in the pool (and on top of that they spawn 12x less often, respawn 12x slower)', thin.every(id => (o.cnt[id] || 0) < avg * 0.45), { avgOthers: Math.round(avg), thin: thin.map(id => o.cnt[id] || 0) }); }
  { const q = await pg.evaluate(() => { const mk = (id, q) => ({ uid: 1, sp: id, q, box: null, pose: null }), id = 'teinopalpus_aureus', sp = SPECIES_BY_ID[id]; if (!sp) return null; const ab = Aberr.make(sp, 'ABCDE').id; return { raw: Econ.price(mk(id, null)), s100: Econ.price(mk(id, 100)), s0: Econ.price(mk(id, 0)), ab: Econ.price(mk(ab, null)), loc: Econ.info(mk(id, null)).loc, bulk: Econ.bulkOk ? Econ.bulkOk(sp) : false, rar: sp.rar, scarce: sp.scarce || 0, biome: sp.biome }; });
    T('Golden Kaiser-i-Hind: raw 1400, spread 1.45x-3x, aberration x~6, no x2, normal rarity', !!q && q.raw === 1400 && q.s100 === 4200 && q.s0 > 2000 && q.s0 < 2060 && q.ab > 7500 && q.ab < 9300 && q.loc === 1 && !q.bulk && q.rar === 3 && !q.scarce && q.biome === 'vietnam', q); }
  { const o = await pg.evaluate(() => BIOME_BY_ID.vietnam.species.filter(sp => !sp.fixedPrice).map(sp => { const mk = q => ({ uid: 1, sp: sp.id, q, box: null, pose: null }); const i = Econ.info(mk(null)); return { loc: i.loc, raw: Econ.price(mk(null)), base: i.base, rar: sp.rar }; }));
    T('Vietnam highlands: ordinary species cost double like the other secret places', o.length === 27 && o.every(x => x.loc === 2 && x.raw >= Math.round(x.base * 2 * 0.55) - 1), o.slice(0, 3)); }
  console.log(errs.length ? 'ERRORS ' + errs : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
