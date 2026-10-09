// traps: no floating pieces. Every mesh of every trap (empty, with every flower and honey, full of butterflies, broken) must be connected through touching bounding boxes to a part that stands on the ground
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000);
  const r = await pg.evaluate(() => {
    const out = [], E = 0.012;
    const check = (label, g) => {
      g.updateMatrixWorld(true); const B = []; g.traverse(o => { if (o.isMesh) { const b = new THREE.Box3().setFromObject(o); B.push({ b, name: o.geometry.type }); } });
      const n = B.length, par = Array.from({ length: n }, (_, i) => i), find = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const a = B[i].b, c = B[j].b; if (a.min.x <= c.max.x + E && c.min.x <= a.max.x + E && a.min.y <= c.max.y + E && c.min.y <= a.max.y + E && a.min.z <= c.max.z + E && c.min.z <= a.max.z + E) par[find(i)] = find(j); }
      let minY = 1e9; const grounded = new Set(); B.forEach((o, i) => { minY = Math.min(minY, o.b.min.y); if (o.b.min.y <= 0.06) grounded.add(find(i)); });
      const roots = new Set(B.map((o, i) => find(i))), floating = [...roots].filter(r => !grounded.has(r)).length;
      const lost = B.filter((o, i) => !grounded.has(find(i))).slice(0, 3).map(o => [o.name, +o.b.min.y.toFixed(2), +o.b.max.y.toFixed(2)]);
      out.push({ label, meshes: n, floating, minY: +minY.toFixed(2), lost });
    };
    for (const type of Object.keys(Traps.TYPES)) {
      check(type + ' empty', Traps.model(type, {}));
      check(type + ' broken', Traps.model(type, { n: 5, broken: true, fl: 'lavender', hn: 'heather' }));
      check(type + ' full', Traps.model(type, { n: 9, fl: 'buddleia', hn: 'manuka', cols: ['#e8a030', '#6a9ae0'] }));
      for (const f of Traps.FLOWERS) check(type + ' ' + f.id, Traps.model(type, { fl: f.id }));
      for (const h of Traps.HONEYS) check(type + ' ' + h.id, Traps.model(type, { hn: h.id, fl: 'chamomile' }));
    }
    return out;
  });
  let bad = 0; const worst = {}; for (const o of r) { const ok = o.floating === 0 && o.minY >= -0.1; if (!ok) { bad++; console.log('FAIL', JSON.stringify(o)); } }
  console.log(bad ? 'FAILED ' + bad + ' of ' + r.length : 'PASS ' + r.length + ' trap variants: nothing floats, nothing sinks'); console.log(errs.length ? 'ERRORS ' + errs : bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
