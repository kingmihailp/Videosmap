// flood-fill walkability of the market: are all street cells (alleys, plazas) reachable from the gate?
// usage: node mk_walk.js [playerRadius] [x0 x1 z0 z1]  (with a region: prints it at 0.25 m per char instead of the whole map at 1 m)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&hour=14'); await pg.waitForTimeout(2500);
  await pg.evaluate(() => F0W.toMarket()); for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(F0W.cab && F0W.cab.walkers)).catch(() => false)) break; await pg.waitForTimeout(500); }
  const R = +(process.argv[2] || 0.3), ZOOM = process.argv[3] ? process.argv.slice(3, 7).map(Number) : null;
  const r = await pg.evaluate(([pr, ZOOM]) => {
    const c = F0W.cab, st = 0.1, x0 = -30, x1 = 40, z0 = -34, z1 = 30, nx = Math.round((x1 - x0) / st), nz = Math.round((z1 - z0) / st);
    const blocked = (x, z) => { for (const k of c.colliders) if (x > k.x0 - pr && x < k.x1 + pr && z > k.z0 - pr && z < k.z1 + pr) return true; for (const k of c.circles) if (Math.hypot(x - k.x, z - k.z) < k.r + pr) return true; return false; };
    const g = new Uint8Array(nx * nz); for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) g[i * nz + j] = blocked(x0 + i * st, z0 + j * st) ? 1 : 0;
    const vis = new Uint8Array(nx * nz), s0 = [Math.round((-24 - x0) / st), Math.round((0 - z0) / st)], q = [s0]; vis[s0[0] * nz + s0[1]] = 1;
    while (q.length) { const [i, j] = q.pop(); for (const [a, b] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const ii = i + a, jj = j + b; if (ii < 0 || jj < 0 || ii >= nx || jj >= nz) continue; const k = ii * nz + jj; if (g[k] || vis[k]) continue; vis[k] = 1; q.push([ii, jj]); } }
    const cell = ZOOM ? 0.25 : 1, n = Math.round(cell / st), lines = [], ax0 = ZOOM ? ZOOM[0] : x0, ax1 = ZOOM ? ZOOM[1] : x1, az0 = ZOOM ? ZOOM[2] : z0, az1 = ZOOM ? ZOOM[3] : z1;
    for (let z = az0; z < az1; z += cell) { let s = ''; for (let x = ax0; x < ax1; x += cell) { const i0 = Math.round((x - x0) / st), j0 = Math.round((z - z0) / st); let any = 0, free = 0; for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) { const k = (i0 + a) * nz + j0 + b; if (vis[k]) any = 1; if (!g[k]) free = 1; } s += any ? '.' : free ? '?' : '#'; } lines.push(z.toFixed(1).padStart(6) + ' ' + s); }
    const unreach = c.stations.filter(s => { const i = Math.round((s.x - x0) / st), j = Math.round((s.z - z0) / st), R = Math.ceil(s.r / st); for (let a = -R; a <= R; a++) for (let b = -R; b <= R; b++) { const ii = i + a, jj = j + b; if (ii >= 0 && jj >= 0 && ii < nx && jj < nz && vis[ii * nz + jj] && Math.hypot(a, b) * st < s.r) return false; } return true; }).map(s => s.id + '@' + s.x.toFixed(1) + ',' + s.z.toFixed(1));
    return { lines, unreach };
  }, [R, ZOOM]);
  console.log('"." reachable, "?" free but cut off, "#" solid'); console.log(r.lines.join('\n')); console.log('unreachable stations:', r.unreach);
  await br.close();
})();
