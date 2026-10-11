// the label under a butterfly in a frame: the full name is never cut (wrapped), the quality and date are always there, the Latin name and the place when there is room
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000);
  let bad = 0; const T0 = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const r = await pg.evaluate(() => {
    const out = { n: 0, cut: [], over: [], noStats: [], widest: 0, lines: {}, withLatin: 0, withPlace: 0 };
    const all = SPECIES.filter(s => !s.mystery); for (const sp of all) { const s = { q: 87, date: Date.now(), biome: sp.biome }; const L = Boxes.labelLines(sp, s, 92); out.n++; const joined = L.slice(0, L.length).map(l => l.t); const nameLines = T.wrap(sp.ru, 92, 8).length; const got = joined.slice(0, nameLines).join(' ').replace(/\s+/g, ' '); if (got !== sp.ru.replace(/\s+/g, ' ')) out.cut.push(sp.ru); if (L.length > 4) out.over.push([sp.ru, L.length]); if (!L.some(l => /^\d+% · \d\d\.\d\d\.\d{4}$/.test(l.t))) out.noStats.push(sp.ru); for (const l of L) out.widest = Math.max(out.widest, T.width(l.t, 8)); out.lines[L.length] = (out.lines[L.length] || 0) + 1; if (L.some(l => l.t === sp.la)) out.withLatin++; }
    return out;
  });
  T0(`the whole name is shown for all ${r.n} species (wrapped, not cut)`, r.n > 100 && r.cut.length === 0, r.cut.slice(0, 3));
  T0('the quality and the date are on every label, at most 4 lines, nothing wider than the label', r.noStats.length === 0 && r.over.length === 0 && r.widest <= 92, { widest: r.widest, over: r.over.slice(0, 2) });
  T0('most labels also have the Latin name', r.withLatin > r.n * 0.5, { withLatin: r.withLatin, of: r.n, lines: r.lines });
  if (errs.length) { bad++; console.log('ERR', errs); }
  console.log(bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
