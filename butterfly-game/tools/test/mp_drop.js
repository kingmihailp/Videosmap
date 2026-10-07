// the connection drops by itself mid-run: butterflies caught online must survive in the personal cabinet; a voluntary disconnect must not copy them
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(1500);
  const r = await pg.evaluate(() => {
    const out = {}, base = Save.data.specimens.length;
    const run = (salvage) => { const cab = { specimens: [], boxes: [] }; Save.enterMP(cab, 3); Net.name = 'Tester'; Save.add('papilio_machaon', 'meadow'); Save.add('papilio_machaon', 'meadow'); const n = Save.data.specimens.length; Save.leaveMP(salvage); return [n, Save.data.specimens.length]; };
    out.drop = run(true); out.bye = run(false); out.base = base; out.uids = new Set(Save.data.specimens.map(s => s.uid)).size === Save.data.specimens.length; out.by = Save.data.specimens.some(s => s.by);
    return out;
  });
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, JSON.stringify(x)); };
  T('dropped link: two online catches kept locally', r.drop[1] === r.base + 2, r);
  T('voluntary disconnect: nothing copied', r.bye[1] === r.base + 2, r);
  T('unique uids, no "by" leftovers', r.uids && !r.by, r);
  console.log(errs.length ? 'ERRORS ' + errs : bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
