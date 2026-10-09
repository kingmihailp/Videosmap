// traps: no floating pieces. Every TRIANGLE of every trap (empty, with every flower and every honey, full of butterflies, broken) must be connected (touching bounding boxes of triangles)
// to something that stands on the ground. Checked twice: with everything, and with the transparent nets and resting butterflies left out (then the frame, the dish and the bait must hold together by themselves)
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] });
  const pg = await br.newPage(); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000);
  const r = await pg.evaluate(() => {
    const out = [], E = 0.012;
    const tris = (g, skipTransparent, skipWings) => {
      g.updateMatrixWorld(true); const T = [], v = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()];
      g.traverse(o => { if (!o.isMesh) return; if (skipTransparent && o.material.transparent) return; if (skipWings && o.parent && o.parent.parent && o.parent.parent.parent && o.parent.parent.type === 'Group' && o.geometry.type === 'PlaneGeometry' && o.geometry.parameters.width === 0.07) return;
        const ge = o.geometry, pa = ge.attributes.position, ix = ge.index, n = ix ? ix.count / 3 : pa.count / 3;
        for (let i = 0; i < n; i++) { const b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let k = 0; k < 3; k++) { const j = ix ? ix.getX(i * 3 + k) : i * 3 + k; v[k].set(pa.getX(j), pa.getY(j), pa.getZ(j)).applyMatrix4(o.matrixWorld); b[0] = Math.min(b[0], v[k].x); b[1] = Math.min(b[1], v[k].y); b[2] = Math.min(b[2], v[k].z); b[3] = Math.max(b[3], v[k].x); b[4] = Math.max(b[4], v[k].y); b[5] = Math.max(b[5], v[k].z); } T.push(b); } });
      return T;
    };
    const check = (label, g, solid) => {
      const B = tris(g, solid, solid), n = B.length, par = new Int32Array(n).map((_, i) => i), find = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; };
      const ord = B.map((b, i) => i).sort((a, b) => B[a][0] - B[b][0]);
      for (let a = 0; a < n; a++) { const A = B[ord[a]]; for (let c = a + 1; c < n; c++) { const C = B[ord[c]]; if (C[0] > A[3] + E) break; if (C[1] <= A[4] + E && A[1] <= C[4] + E && C[2] <= A[5] + E && A[2] <= C[5] + E) { const x = find(ord[a]), y = find(ord[c]); if (x !== y) par[x] = y; } } }
      let minY = 1e9; const grounded = new Set(); B.forEach((b, i) => { minY = Math.min(minY, b[1]); if (b[1] <= 0.06) grounded.add(find(i)); });
      const roots = new Set(B.map((b, i) => find(i))), floating = [...roots].filter(q => !grounded.has(q)).length, lost = [...roots].filter(q => !grounded.has(q)).slice(0, 2).map(q => { const m = B.filter((b, i) => find(i) === q); return [m.length, +Math.min(...m.map(b => b[1])).toFixed(2), +Math.max(...m.map(b => b[4])).toFixed(2), +m[0][0].toFixed(2), +m[0][2].toFixed(2)]; });
      out.push({ label, tris: n, floating, minY: +minY.toFixed(2), lost });
    };
    for (const type of Object.keys(Traps.TYPES)) {
      for (const [lab, o] of [['empty', {}], ['broken', { n: 5, broken: true, fl: 'lavender', hn: 'heather' }], ['full', { n: 9, fl: 'buddleia', hn: 'manuka', cols: ['#e8a030', '#6a9ae0'] }]]) { check(type + ' ' + lab, Traps.model(type, o), false); check(type + ' ' + lab + ' (frame+bait only)', Traps.model(type, Object.assign({}, o, { n: 0 })), true); }
      for (const f of Traps.FLOWERS) { check(type + ' ' + f.id, Traps.model(type, { fl: f.id }), false); check(type + ' ' + f.id + ' (solid)', Traps.model(type, { fl: f.id }), true); }
      for (const h of Traps.HONEYS) { check(type + ' ' + h.id, Traps.model(type, { hn: h.id, fl: 'chamomile' }), false); check(type + ' ' + h.id + ' (solid)', Traps.model(type, { hn: h.id, fl: 'chamomile' }), true); }
    }
    // the checker itself must see a floating piece: a flower petal hanging in the air next to a trap
    const g = Traps.model('std', { fl: 'daisy' }); const bad1 = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.05, 0.05), new THREE.MeshLambertMaterial()); bad1.position.set(0.9, 1.2, 0.1); g.add(bad1); check('MUTANT floating cube', g, false);
    const g2 = Traps.model('imp', { hn: 'linden' }); g2.userData.baitG.children[0].position.y += 0.1; check('MUTANT lifted honey', g2, false);
    return out;
  });
  const mut = r.filter(o => o.label.startsWith('MUTANT')); r.length -= mut.length; const caught = mut.every(o => o.floating > 0); if (!caught) console.log('FAIL the checker did not see a floating piece', JSON.stringify(mut));
  let bad = caught ? 0 : 1; for (const o of r) { const ok = o.floating === 0 && o.minY >= -0.1; if (!ok) { bad++; if (bad < 12) console.log('FAIL', JSON.stringify(o)); } }
  console.log(bad ? 'FAILED ' + bad + ' of ' + r.length : 'PASS ' + r.length + ' trap variants (triangle level): nothing floats, nothing sinks'); console.log(errs.length ? 'ERRORS ' + errs : bad ? 'FAILED' : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
