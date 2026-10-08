// every tree / plant model of the world generator (World.TREES): every piece (touching triangles) must reach the ground -- nothing hovers (a model may stand on several pieces, like a bamboo grove)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000);
  const only = process.argv[2] ? process.argv[2].split(',') : null;
  const r = await pg.evaluate((only) => {
    const out = [], envs = Object.keys(World.ENV);
    for (const k of Object.keys(World.TREES)) { if (only && !only.includes(k)) continue;
      for (let sd = 1; sd <= 8; sd++) {
        const env = World.ENV[envs[sd % envs.length]] || World.ENV.russia; env._bush = env._bush || ['#5a9a38']; let t; try { t = World.TREES[k](new Rng(sd * 13 + 1), env); } catch (e) { out.push({ k, sd, err: String(e).slice(0, 80) }); continue; }
        const p = t.g.attributes.position, n = Math.floor(p.count / 3); if (n > 30000) { out.push({ k, sd, skip: n }); continue; }
        const B = []; let minY = 1e9;
        for (let i = 0; i < n; i++) { const b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let v = 0; v < 3; v++) { const x = p.getX(i * 3 + v), y = p.getY(i * 3 + v), z = p.getZ(i * 3 + v); b[0] = Math.min(b[0], x); b[1] = Math.min(b[1], y); b[2] = Math.min(b[2], z); b[3] = Math.max(b[3], x); b[4] = Math.max(b[4], y); b[5] = Math.max(b[5], z); minY = Math.min(minY, y); } B.push(b); }
        const par = Array.from({ length: n }, (_, i) => i), f = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }, e = 0.02, ord = B.map((b, i) => i).sort((a, b) => B[a][0] - B[b][0]);
        for (let a = 0; a < n; a++) for (let c = a + 1; c < n; c++) { const A = B[ord[a]], C = B[ord[c]]; if (C[0] > A[3] + e) break; if (C[1] <= A[4] + e && A[1] <= C[4] + e && C[2] <= A[5] + e && A[2] <= C[5] + e) par[f(ord[a])] = f(ord[c]); }
        const comp = {}; for (let i = 0; i < n; i++) { const q = f(i); (comp[q] || (comp[q] = { n: 0, y: 1e9 })); comp[q].n++; comp[q].y = Math.min(comp[q].y, B[i][1]); }
        const cs = Object.values(comp); out.push({ k, sd, tris: n, comps: cs.length, minY: +minY.toFixed(2), loose: cs.filter(c => c.y > 0.4).length });
      } }
    return out;
  }, only);
  const byKey = {}; for (const o of r) { const b = byKey[o.k] || (byKey[o.k] = { runs: 0, bad: 0, ex: null, skip: 0, err: null }); if (o.err) { b.err = o.err; continue; } if (o.skip) { b.skip++; continue; } b.runs++; if (o.loose > 0) { b.bad++; b.ex = b.ex || o; } }
  let bad = 0; for (const k in byKey) { const b = byKey[k]; const ok = !b.bad && !b.err; if (!ok) bad++; console.log(ok ? 'PASS' : 'FAIL', k, b.skip ? '(skipped ' + b.skip + ' huge)' : '', b.bad ? JSON.stringify(b.ex) : '', b.err || ''); }
  console.log(errs.length ? 'ERRORS ' + errs : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
