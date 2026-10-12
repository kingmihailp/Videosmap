// world generation checks over many landscapes: no water on top of water, no hill ring round the spawn, nothing floats in the air (trees, rocks, landmarks, mini-structures), no flowers on the Alpine slopes, riverbank plants
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 400, height: 300 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const SEEDS = +(process.env.SEEDS || 4), ids = ['russia', 'alps', 'med', 'amazon', 'borneo', 'kenya', 'prairie', 'japan', 'bog', 'papua', 'vietnam'];
  const tot = { builds: 0, waterBad: [], ring: [], floatTrees: [], floatStruct: [], alpsFlowers: 0, shore: [] };
  for (const id of ids) for (let k = 0; k < SEEDS; k++) {
    const r = await pg.evaluate(([id, k, MUT]) => {
      const b = BIOME_BY_ID[id], w = World.build(b, 'WC' + k), R = w.R, out = { id, k, R, water: 0, ring: 0, trees: [], struct: [], flowersSteep: 0, reeds: 0 };
      // 1. water: rivers never cross rivers or lie over ponds; ponds never overlap
      const W = w.waters, rv = W.filter(q => q.pts), pd = W.filter(q => q.kind === 'pond');
      for (let i = 0; i < rv.length; i++) for (let j = i + 1; j < rv.length; j++) { let m = 1e9; for (const p of rv[i].pts) for (const q of rv[j].pts) m = Math.min(m, Math.hypot(p.x - q.x, p.z - q.z)); if (m < rv[i].w + rv[j].w + 8) out.water++; }
      for (const p of pd) { for (const rr of rv) for (const q of rr.pts) if (Math.hypot(q.x - p.x, q.z - p.z) < p.r + q.w + 4) { out.water++; break; } for (const o of pd) if (o !== p && Math.hypot(o.x - p.x, o.z - p.z) < o.r + p.r + 1) { out.water++; break; } }
      // 2. no ring: the mean height at radius r changes smoothly (no bowl / mound inside the play field)
      if (id !== 'vietnam') { const mean = r => { let s = 0; for (let a = 0; a < 48; a++) s += w.heightAt(Math.cos(a / 48 * 6.283) * r, Math.sin(a / 48 * 6.283) * r); return s / 48; }; let mx = 0; for (let r = 20; r < R - 12; r += 4) mx = Math.max(mx, Math.abs(mean(r + 4) - mean(r)) / 4); out.ring = +mx.toFixed(3); }
      if (MUT) { const m = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial()); m.position.set(20, w.heightAt(20, 20) + 6, 20); w.scene.add(m); w.scene.traverse(o => { if (o.isInstancedMesh && !o.geometry.attributes.aKind && o.count) { o.setMatrixAt(0, new THREE.Matrix4().makeTranslation(-20, w.heightAt(-20, -20) + 5, 20)); } }); }       // mutant self-check: a floating box and a floating tree
      // 3. floating: every instanced tree / rock / bush stands on the ground; landmarks and mini structures are connected to it
      const sc = w.scene; const M4 = new THREE.Matrix4();
      sc.traverse(o => { if (!o.isInstancedMesh || o.userData.noFloat || !o.visible && false) return; const g = o.geometry; if (g.attributes.aKind) return;
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M4); const x = M4.elements[12], y = M4.elements[13], z = M4.elements[14]; const gy = w.heightAt(x, z); if (y - gy > 1.3 || gy - y > 2.5) out.trees.push([Math.round(x), Math.round(z), +(y - gy).toFixed(2)]); } });
      const boxes = []; sc.children.forEach(o => { if (o.isInstancedMesh || o.isLight || o.isSprite || o.isPoints || o.isLine) return; o.updateMatrixWorld(true); const bb = new THREE.Box3().setFromObject(o); if (!isFinite(bb.min.x)) return; const sz = bb.getSize(new THREE.Vector3()); if (sz.x > 40 || sz.z > 40 || sz.y > 60) return; const c = bb.getCenter(new THREE.Vector3()); if (Math.hypot(c.x, c.z) > R + 2) return; if (o.material && (o.material.transparent || o.material.isShaderMaterial)) return; boxes.push(bb); });
      const par = boxes.map((_, i) => i), find = i => par[i] === i ? i : (par[i] = find(par[i]));
      for (let i = 0; i < boxes.length; i++) for (let j = i + 1; j < boxes.length; j++) if (boxes[i].clone().expandByScalar(0.35).intersectsBox(boxes[j])) par[find(i)] = find(j);
      const cl = {}; boxes.forEach((bb, i) => { const f = find(i); (cl[f] = cl[f] || new THREE.Box3()).union(bb); });
      for (const f in id === 'vietnam' ? {} : cl) { const bb = cl[f]; let gmin = 1e9; for (const [fx, fz] of [[0.1, 0.1], [0.9, 0.1], [0.1, 0.9], [0.9, 0.9], [0.5, 0.5]]) gmin = Math.min(gmin, w.heightAt(bb.min.x + (bb.max.x - bb.min.x) * fx, bb.min.z + (bb.max.z - bb.min.z) * fz)); if (bb.min.y - gmin > 0.9) out.struct.push([Math.round((bb.min.x + bb.max.x) / 2), Math.round((bb.min.z + bb.max.z) / 2), +(bb.min.y - gmin).toFixed(2)]); }
      // 4. Alps: flowers of the atlas mesh (aKind) never on a steep slope
      if (id === 'alps') sc.traverse(o => { if (o.isInstancedMesh && o.geometry.attributes.aKind && o.geometry.attributes.aKind.array.some(v => v > 0.5)) for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M4); if (w.slopeAt(M4.elements[12], M4.elements[14]) > 0.42) out.flowersSteep++; } });
      // 5. riverbank plants: count the instances that stand within 4 m of water
      let near = 0; sc.traverse(o => { if (o.isInstancedMesh && o.geometry.attributes.aKind && !o.geometry.attributes.aKind.array.some(v => v > 0.5)) for (let i = 0; i < o.count; i += 3) { o.getMatrixAt(i, M4); const d = w.sdf(M4.elements[12], M4.elements[14]); if (d > -0.5 && d < 4.2) near++; } }); out.reeds = near;
      out.hasWater = W.length; w.dispose && w.dispose(); return out; }, [id, k, !!process.env.MUTANT]);
    tot.builds++; if (r.water) tot.waterBad.push([id, k, r.water]); if (r.ring > 0.35) tot.ring.push([id, k, r.ring]); if (r.trees.length) tot.floatTrees.push([id, k, r.trees.slice(0, 3), r.trees.length]); if (r.struct.length) tot.floatStruct.push([id, k, r.struct.slice(0, 3)]); tot.alpsFlowers += r.flowersSteep; if (r.hasWater && r.reeds < 150) tot.shore.push([id, k, r.reeds]);
  }
  T(`water: no river crosses a river or lies over a pond, no ponds on each other (${tot.builds} landscapes)`, !tot.waterBad.length, tot.waterBad.slice(0, 5));
  T('no ring of hills round the spawn: the relief inside the play field has no bowl', !tot.ring.length, tot.ring.slice(0, 5));
  T('every tree, bush and rock stands on the ground', !tot.floatTrees.length, tot.floatTrees.slice(0, 4));
  T('every landmark and mini-structure touches the ground (no cluster of meshes hangs in the air; the archipelago of Vietnam is floating islands by design)', !tot.floatStruct.length, tot.floatStruct.slice(0, 5));
  T('Alps: no flowers on the steep slopes', tot.alpsFlowers === 0, tot.alpsFlowers);
  T('landscapes with water have plenty of reeds and sedge on the banks', !tot.shore.length, tot.shore.slice(0, 5));
  T('no page errors', !errs.length, errs.slice(0, 3));
  await br.close(); console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); process.exit(bad ? 1 : 0);
})();
