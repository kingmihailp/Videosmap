// finds parts that are not connected (touching boxes) to the ground: the secret market rooms, the strange stall and the code door of the market
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 400, height: 300 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const tol = +(process.argv[2] || 0.04);
  const report = (name, r) => { console.log(name, 'parts', r.total, 'floating', r.floating); r.list.forEach(x => console.log('  pos', x.slice(0, 3).join(','), 'size', x.slice(3).join('x'))); };
  await pg.evaluate(() => { window.FC = (P, tol, extra) => {
    P = P.concat(extra || []); const n = P.length, par = Array.from({ length: n }, (_, i) => i), f = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
    const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
    const hit = (A, B) => { const d = [B.c[0] - A.c[0], B.c[1] - A.c[1], B.c[2] - A.c[2]]; const axes = [...A.ax, ...B.ax]; for (const a of A.ax) for (const b of B.ax) { const x = cross(a, b), l = Math.hypot(...x); if (l > 1e-4) axes.push([x[0] / l, x[1] / l, x[2] / l]); }
      for (const L of axes) { const ra = A.h[0] * Math.abs(dot(A.ax[0], L)) + A.h[1] * Math.abs(dot(A.ax[1], L)) + A.h[2] * Math.abs(dot(A.ax[2], L)), rb = B.h[0] * Math.abs(dot(B.ax[0], L)) + B.h[1] * Math.abs(dot(B.ax[1], L)) + B.h[2] * Math.abs(dot(B.ax[2], L)); if (Math.abs(dot(d, L)) > ra + rb + tol) return false; } return true; };
    const lowY = p => p.c[1] - (p.h[0] * Math.abs(p.ax[0][1]) + p.h[1] * Math.abs(p.ax[1][1]) + p.h[2] * Math.abs(p.ax[2][1]));
    for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const a = P[i], b = P[j]; if (Math.abs(a.c[0] - b.c[0]) > 8 || Math.abs(a.c[1] - b.c[1]) > 8 || Math.abs(a.c[2] - b.c[2]) > 8) continue; const ra = Math.max(...a.h), rb = Math.max(...b.h); if (Math.hypot(a.c[0] - b.c[0], a.c[1] - b.c[1], a.c[2] - b.c[2]) > (ra + rb) * 1.8 + tol) continue; if (hit(a, b)) par[f(i)] = f(j); }
    const grounded = new Set(); P.forEach((p, i) => { if (lowY(p) <= 0.12) grounded.add(f(i)); });
    const fl = []; P.forEach((p, i) => { if (!grounded.has(f(i)) && i < n - (extra ? extra.length : 0)) fl.push([+p.c[0].toFixed(2), +p.c[1].toFixed(2), +p.c[2].toFixed(2), +(p.h[0] * 2).toFixed(2), +(p.h[1] * 2).toFixed(2), +(p.h[2] * 2).toFixed(2)]); });
    return { total: n, floating: fl.length, list: fl.slice(0, 40) };
  }; window.solid = (x0, x1, y0, y1, z0, z1) => ({ c: [(x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2], h: [(x1 - x0) / 2, (y1 - y0) / 2, (z1 - z0) / 2], ax: [[1, 0, 0], [0, 1, 0], [0, 0, 1]] }); });
  // the secret market
  report('secret market', await pg.evaluate(tol => { const B = new Batch(31), G = new Batch(32); B.rec = G.rec = true; SecretMarket.buildGeo(B, G, new Rng(777), { cols: [], windows: [], leaks: [], candles: [] }); return FC(B.parts.concat(G.parts), tol); }, tol));
  // the market: parts near the strange stall and near the code door (house walls added as solids)
  const mk = await pg.evaluate(tol => { Batch.recAll = true; const mkt = new Market({ lock() {}, unlock() {} }); Batch.recAll = false; const P = mkt.B.parts.concat(mkt.G.parts);
    const inBox = (p, x0, x1, z0, z1) => p.c[0] > x0 && p.c[0] < x1 && p.c[2] > z0 && p.c[2] < z1;
    const stall = P.filter(p => inBox(p, -17.2, -13.8, -28.8, -23.8)), door = P.filter(p => inBox(p, 15.5, 21.0, -32.2, -29.5));
    const doorWall = [solid(16, 20, 0, 6.4, -36, -32), solid(20, 24, 0, 6.4, -32, -28)], stallWalls = [];
    return { stall: FC(stall, tol, stallWalls), door: FC(door, tol, doorWall), s: stall.length, d: door.length }; }, tol);
  report('strange stall', mk.stall); report('code door', mk.door);
  // the whole market (stalls, lamps, decor ...) against the ground and the house blocks
  const all = await pg.evaluate(tol => { Batch.recAll = true; const mkt = new Market({ lock() {}, unlock() {} }); Batch.recAll = false; const P = mkt.B.parts.concat(mkt.G.parts);
    const houses = []; mkt.cells.forEach((ht, k) => { const [gx, gz] = k.split(',').map(Number); houses.push(solid(gx, gx + 4, 0, ht + 3, gz, gz + 4)); });
    houses.push(solid(-36, 40, 0, 16, -36, -35), solid(-36, 40, 0, 16, 35, 36), solid(-36, -35, 0, 16, -36, 36), solid(39, 40, 0, 16, -36, 36));
    return FC(P, tol, houses); }, tol);
  report('whole market', all);
  await br.close();
})();
