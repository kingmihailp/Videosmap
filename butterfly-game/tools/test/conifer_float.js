// conifers: no floating pieces. Every triangle must be connected (through overlapping bounding boxes) to the trunk, and the foot must stand on the ground
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000);
  const r = await pg.evaluate(() => {
    const out = [];
    for (const k of ['spruce', 'larch', 'crypto']) for (let sd = 1; sd <= 12; sd++) {
      const t = World.TREES[k](new Rng(sd * 7), World.ENV.russia), p = t.g.attributes.position, n = p.count / 3, B = [];
      let minY = 1e9;
      for (let i = 0; i < n; i++) { const b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let v = 0; v < 3; v++) { const x = p.getX(i * 3 + v), y = p.getY(i * 3 + v), z = p.getZ(i * 3 + v); b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.min(b[2], z); b[3] = Math.max(b[3], x); b[4] = Math.max(b[4], y); b[5] = Math.max(b[5], z); minY = Math.min(minY, y); } B.push(b); }
      const par = Array.from({ length: n }, (_, i) => i), find = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }, e = 0.01;
      const ord = B.map((b, i) => i).sort((a, b) => B[a][0] - B[b][0]);
      for (let a = 0; a < n; a++) for (let c = a + 1; c < n; c++) { const A = B[ord[a]], C = B[ord[c]]; if (C[0] > A[3] + e) break; if (C[1] <= A[4] + e && A[1] <= C[4] + e && C[2] <= A[5] + e && A[2] <= C[5] + e) par[find(ord[a])] = find(ord[c]); }
      const comp = new Set(); for (let i = 0; i < n; i++) comp.add(find(i));
      const cnt = {}; for (let i = 0; i < n; i++) { const f = find(i); (cnt[f] = cnt[f] || { n: 0, y0: 1e9, y1: -1e9 }).n++; cnt[f].y0 = Math.min(cnt[f].y0, B[i][1]); cnt[f].y1 = Math.max(cnt[f].y1, B[i][4]); } const small = Object.values(cnt).sort((a, b) => a.n - b.n).slice(0, -1).map(q => [q.n, +q.y0.toFixed(1), +q.y1.toFixed(1)]);
      out.push({ k, sd, tris: n, comps: comp.size, minY: +minY.toFixed(2), small, h: +t.h.toFixed(1) });
    }
    return out;
  });
  let bad = 0; for (const o of r) { const ok = o.comps === 1 && o.minY <= 0.05 && o.minY > -0.4; if (!ok) bad++; console.log(ok ? 'PASS' : 'FAIL', JSON.stringify(o)); }
  console.log(errs.length ? 'ERRORS ' + errs : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
