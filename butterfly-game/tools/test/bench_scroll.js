// workbench: the list of boxes scrolls (wheel over the list, arrow buttons) when there are more than 7
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000);
  const r = await pg.evaluate(() => {
    const B = Boxes.bench, o = {}; for (let i = 0; i < 14; i++) Save.addBox('S', 0); B.tab = 'boxes'; B.scroll = 0; B.sscroll = 0; B.layout(); o.rows0 = B.rows.map(r => r.idx);
    B.mx = 60; B.wheel(100); B.wheel(100); B.layout(); o.afterWheel = B.scroll; B.mx = 400; B.wheel(100); B.layout(); o.right = [B.scroll, B.sscroll];
    const dn = B.btns.find(b => b.id === 'ldown'); B.click(dn.x + 2, dn.y + 2); B.layout(); o.afterBtn = B.scroll; for (let i = 0; i < 20; i++) { B.mx = 60; B.wheel(100); B.layout(); } o.max = [B.scroll, B.rows.map(r => r.idx)];
    const up = B.btns.find(b => b.id === 'lup'); B.click(up.x + 2, up.y + 2); B.layout(); o.afterUp = B.scroll; return o;
  });
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, JSON.stringify(x)); };
  T('7 rows shown first', r.rows0.length === 7 && r.rows0[0] === 0, r.rows0); T('wheel over the list scrolls it', r.afterWheel === 2, r.afterWheel); T('wheel over the right column leaves the box list alone', r.right[0] === 2, r.right);
  T('arrow button scrolls', r.afterBtn === 3, r.afterBtn); T('stops at the end (last box visible)', r.max[0] === 7 && r.max[1][6] === 13, r.max); T('up button', r.afterUp === 6, r.afterUp);
  console.log(errs.length ? 'ERRORS ' + errs : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
