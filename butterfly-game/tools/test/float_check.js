// finds parts of the chalet that are not connected (by touching boxes) to the ground
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 400, height: 300 } }); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const seeds = (process.argv[2] || 'a,b,c').split(','); const tol = +(process.argv[3] || 0.04);
  for (const sd of seeds) {
    const r = await pg.evaluate(([sd, tol]) => {
      Chalet.debugParts = true; const res = Chalet.build(new Rng(sd), { heightAt: () => 0, cx: 0, cy: 0, cz: 0, ry: 0 }); Chalet.debugParts = false; const P = res.parts, n = P.length, par = Array.from({ length: n }, (_, i) => i);
      const f = i => { while (par[i] !== i) { par[i] = par[par[i]]; i = par[i]; } return i; };
      const dot = (a, b) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2], cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
      const hit = (A, B) => { const d = [B.c[0] - A.c[0], B.c[1] - A.c[1], B.c[2] - A.c[2]]; const axes = [...A.ax, ...B.ax]; for (const a of A.ax) for (const b of B.ax) { const x = cross(a, b), l = Math.hypot(...x); if (l > 1e-4) axes.push([x[0] / l, x[1] / l, x[2] / l]); }
        for (const L of axes) { const ra = A.h[0] * Math.abs(dot(A.ax[0], L)) + A.h[1] * Math.abs(dot(A.ax[1], L)) + A.h[2] * Math.abs(dot(A.ax[2], L)), rb = B.h[0] * Math.abs(dot(B.ax[0], L)) + B.h[1] * Math.abs(dot(B.ax[1], L)) + B.h[2] * Math.abs(dot(B.ax[2], L)); if (Math.abs(dot(d, L)) > ra + rb + tol) return false; } return true; };
      const lowY = p => p.c[1] - (p.h[0] * Math.abs(p.ax[0][1]) + p.h[1] * Math.abs(p.ax[1][1]) + p.h[2] * Math.abs(p.ax[2][1]));
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const a = P[i], b = P[j]; if (Math.abs(a.c[0] - b.c[0]) > 4 || Math.abs(a.c[1] - b.c[1]) > 4 || Math.abs(a.c[2] - b.c[2]) > 4) continue; if (f(i) !== f(j) && hit(a, b)) par[f(i)] = f(j); }
      const grounded = new Set(); P.forEach((p, i) => { if (lowY(p) <= 0.12) grounded.add(f(i)); });
      const fl = []; P.forEach((p, i) => { if (!grounded.has(f(i))) fl.push([+p.c[0].toFixed(2), +p.c[1].toFixed(2), +p.c[2].toFixed(2), +(p.h[0] * 2).toFixed(2), +(p.h[1] * 2).toFixed(2), +(p.h[2] * 2).toFixed(2)]); });
      return { total: n, floating: fl.length, list: fl.slice(0, 40) };
    }, [sd, tol]);
    console.log('seed', sd, 'parts', r.total, 'floating', r.floating); r.list.forEach(x => console.log('  pos', x.slice(0, 3).join(','), 'size', x.slice(3).join('x')));
  }
  await br.close();
})();
