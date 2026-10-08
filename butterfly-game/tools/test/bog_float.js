// the bog (or any biome: node bog_float.js [seed] [biome]): finds objects that hover above the ground
//   1. single meshes whose lowest point is clearly above the highest ground under them,
//   2. instanced objects (trees, hummocks, tussocks ...) standing above the ground,
//   3. parts of merged meshes (boardwalk, models) that are not connected, through touching triangles, to a piece that reaches the ground
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 400, height: 300 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  const seed = process.argv[2] || 'BOGF', bid = process.argv[3] || 'bog';
  await pg.evaluate(([sd, b]) => { Save.data.maps = { bog: true, papua: true, vietnam: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start(b, sd); }, [seed, bid]);
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  const r = await pg.evaluate(() => {
    const w = F0W.play.world, H = w.heightAt, out = { single: [], inst: [], parts: [], checked: { mesh: 0, inst: 0, merged: 0 } }, scene = w.scene, singles = [];
    scene.updateMatrixWorld(true);
    const groundMax = (b) => { let m = -1e9; for (let i = 0; i <= 2; i++) for (let k = 0; k <= 2; k++) m = Math.max(m, H(b.min.x + (b.max.x - b.min.x) * i / 2, b.min.z + (b.max.z - b.min.z) * k / 2)); return m; };
    const wp = (mesh, i, v) => { v.fromBufferAttribute(mesh.geometry.attributes.position, i).applyMatrix4(mesh.matrixWorld); return v; };
    scene.traverse(o => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position || o.userData.noFloat) return;
      if (o.isInstancedMesh) {
        out.checked.inst++; o.geometry.computeBoundingBox(); const bb = o.geometry.boundingBox, M = new THREE.Matrix4(), p = new THREE.Vector3(), sc = new THREE.Vector3(), q = new THREE.Quaternion(); let worst = 0, cnt = 0, ex = null;
        for (let i = 0; i < o.count; i++) { o.getMatrixAt(i, M); M.decompose(p, q, sc); const bottom = p.y + bb.min.y * sc.y, gap = bottom - H(p.x, p.z); if (gap > 0.45) { cnt++; if (gap > worst) { worst = gap; ex = [+p.x.toFixed(1), +p.z.toFixed(1)]; } } }
        if (cnt) out.inst.push({ n: cnt, of: o.count, worst: +worst.toFixed(2), at: ex, size: o.geometry.attributes.position.count });
        return;
      }
      const box = /* a mesh in a group (a flower: stem + head) stands as long as the group does */ new THREE.Box3().setFromObject(o.parent && o.parent !== scene && o.parent.type === 'Group' ? o.parent : o); if (!isFinite(box.min.x)) return; const sx = box.max.x - box.min.x, sz = box.max.z - box.min.z; if (sx > 120 || sz > 120) return;
      out.checked.mesh++; const gm = groundMax(box), gap = box.min.y - gm; singles.push({ box, gap, o });
      const tris = o.geometry.attributes.position.count / 3; singles[singles.length - 1].info = { at: [+((box.min.x + box.max.x) / 2).toFixed(1), +box.min.y.toFixed(2), +((box.min.z + box.max.z) / 2).toFixed(1)], gap: +gap.toFixed(2), size: [+sx.toFixed(1), +(box.max.y - box.min.y).toFixed(1), +sz.toFixed(1)], tris, transparentBig: !!(o.material && o.material.transparent && sx > 20), skip: !!(o.userData && o.userData.noFloat) };
      if (tris > 60 && tris < 25000 && sx < 60 && sz < 60) {      // merged model: components of touching triangles
        out.checked.merged++; const P = o.geometry.attributes.position, n = Math.floor(P.count / 3), v = new THREE.Vector3(), B = [];
        for (let i = 0; i < n; i++) { const b = [1e9, 1e9, 1e9, -1e9, -1e9, -1e9]; for (let k = 0; k < 3; k++) { wp(o, i * 3 + k, v); b[0] = Math.min(b[0], v.x); b[1] = Math.min(b[1], v.y); b[2] = Math.min(b[2], v.z); b[3] = Math.max(b[3], v.x); b[4] = Math.max(b[4], v.y); b[5] = Math.max(b[5], v.z); } B.push(b); }
        const par = Array.from({ length: n }, (_, i) => i), f = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }, e = 0.03, ord = B.map((b, i) => i).sort((a, b) => B[a][0] - B[b][0]);
        for (let a = 0; a < n; a++) for (let c = a + 1; c < n; c++) { const A = B[ord[a]], C = B[ord[c]]; if (C[0] > A[3] + e) break; if (C[1] <= A[4] + e && A[1] <= C[4] + e && C[2] <= A[5] + e && A[2] <= C[5] + e) par[f(ord[a])] = f(ord[c]); }
        const comp = {}; for (let i = 0; i < n; i++) { const k = f(i), c = comp[k] || (comp[k] = { n: 0, low: 1e9, cx: 0, cz: 0, gx: -1e9 }); c.n++; c.low = Math.min(c.low, B[i][1] - H((B[i][0] + B[i][3]) / 2, (B[i][2] + B[i][5]) / 2)); c.cx = (B[i][0] + B[i][3]) / 2; c.cz = (B[i][2] + B[i][5]) / 2; }
        for (const k in comp) { const c = comp[k]; if (c.low > 0.35 && c.n >= 2) out.parts.push({ tris: c.n, lift: +c.low.toFixed(2), at: [+c.cx.toFixed(1), +c.cz.toFixed(1)], mesh: tris }); }
      }
    });
    {       // single meshes: a mesh is held up when it touches (box to box) a chain of meshes that reaches the ground (a cairn, a sap cup on its stump)
      const n = singles.length, par = Array.from({ length: n }, (_, i) => i), f = a => { while (par[a] !== a) { par[a] = par[par[a]]; a = par[a]; } return a; }, e = 0.06;
      for (let i = 0; i < n; i++) for (let j = i + 1; j < n; j++) { const A = singles[i].box, B = singles[j].box; if (A.min.x <= B.max.x + e && B.min.x <= A.max.x + e && A.min.y <= B.max.y + e && B.min.y <= A.max.y + e && A.min.z <= B.max.z + e && B.min.z <= A.max.z + e) par[f(i)] = f(j); }
      const comp = {}; singles.forEach((q, i) => { const k = f(i); (comp[k] = comp[k] || []).push(q); });
      for (const k in comp) { const L = comp[k]; if (L.every(q => q.gap > 0.35) && !L.every(q => q.info.skip || q.info.transparentBig)) out.single.push(L.map(q => q.info).sort((a, b) => a.gap - b.gap)[0]); }
    }
    return { out, lm: w.landmarks, pos: w.lmPos };
  });
  const o = r.out; console.log('checked', JSON.stringify(o.checked), 'landmarks', JSON.stringify(r.lm));
  o.single.slice(0, 12).forEach(x => console.log('FLOATING mesh', JSON.stringify(x))); o.inst.slice(0, 12).forEach(x => console.log('FLOATING instances', JSON.stringify(x))); o.parts.slice(0, 12).forEach(x => console.log('FLOATING part', JSON.stringify(x)));
  const bad = o.single.length + o.inst.length + o.parts.length; console.log(errs.length ? 'ERRORS ' + errs : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
