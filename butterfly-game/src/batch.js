// ---------------------------------------------------------------- Batch: many coloured primitives -> one vertex-coloured mesh (a transform `base` lets whole objects be built in local coordinates)
const Batch = (() => {
  const BOXG = new THREE.BoxGeometry(1, 1, 1);
  const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V3 = new THREE.Vector3(), ONE = new THREE.Vector3(1, 1, 1), N3 = new THREE.Matrix3();
  const jit = (col, k) => { const a = hex2rgb(col); return [a[0] / 255 * k, a[1] / 255 * k, a[2] / 255 * k]; };
  class Batch {
    constructor(seed) { this.P = []; this.N = []; this.C = []; this.base = new THREE.Matrix4(); this.rng = new Rng(seed || 1); }
    geo(g, m, col, jitter = 0.07) {
      if (this.rec) {      // record oriented boxes (exact for boxes, the bounding box for other shapes) so the test can check that every part touches another
        const M = new THREE.Matrix4().multiplyMatrices(this.base, m), e = M.elements; let c, ax, h;
        if (g === BOXG) { const cx = new THREE.Vector3(e[0], e[1], e[2]), cy = new THREE.Vector3(e[4], e[5], e[6]), cz = new THREE.Vector3(e[8], e[9], e[10]); h = [cx.length() / 2, cy.length() / 2, cz.length() / 2]; ax = [cx.normalize().toArray(), cy.normalize().toArray(), cz.normalize().toArray()]; c = [e[12], e[13], e[14]]; }
        else { g.computeBoundingBox(); const bb = g.boundingBox, mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9]; for (let i = 0; i < 8; i++) { V3.set(i & 1 ? bb.max.x : bb.min.x, i & 2 ? bb.max.y : bb.min.y, i & 4 ? bb.max.z : bb.min.z).applyMatrix4(M); for (let k = 0; k < 3; k++) { const v = k === 0 ? V3.x : k === 1 ? V3.y : V3.z; mn[k] = Math.min(mn[k], v); mx[k] = Math.max(mx[k], v); } } c = mn.map((v, k) => (v + mx[k]) / 2); h = mn.map((v, k) => (mx[k] - v) / 2); ax = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]; }
        (this.parts || (this.parts = [])).push({ c, h, ax });
      }
      const ng = g.index ? g.toNonIndexed() : g; const M = new THREE.Matrix4().multiplyMatrices(this.base, m); N3.getNormalMatrix(M); const p = ng.attributes.position, n = ng.attributes.normal; const k = 1 + (this.rng.next() - 0.5) * 2 * jitter, cc = Array.isArray(col) ? col : jit(col, k);
      for (let i = 0; i < p.count; i++) { V3.set(p.getX(i), p.getY(i), p.getZ(i)).applyMatrix4(M); this.P.push(V3.x, V3.y, V3.z); V3.set(n.getX(i), n.getY(i), n.getZ(i)).applyMatrix3(N3).normalize(); this.N.push(V3.x, V3.y, V3.z); this.C.push(cc[0], cc[1], cc[2]); }
    }
    mat(x, y, z, rx = 0, ry = 0, rz = 0) { E.set(rx, ry, rz, 'YXZ'); Q.setFromEuler(E); return M4.clone().compose(V3.set(x, y, z), Q, ONE); }
    box(w, h, d, x, y, z, col, rx, ry, rz, j) { this.geo(BOXG, this.mat(x, y, z, rx, ry, rz).scale(V3.set(w, h, d)), col, j); }
    cyl(rt, rb, h, x, y, z, col, seg = 8, rx, ry, rz) { this.geo(new THREE.CylinderGeometry(rt, rb, h, seg), this.mat(x, y, z, rx, ry, rz), col); }
    sph(r, x, y, z, col, sx = 1, sy = 1, sz = 1, ws = 8, hs = 6) { this.geo(new THREE.SphereGeometry(r, ws, hs), this.mat(x, y, z).scale(V3.set(sx, sy, sz)), col); }
    tri(a, b, cc, col) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute([...a, ...b, ...cc], 3)); g.computeVertexNormals(); this.geo(g, new THREE.Matrix4(), col, 0.03); }
    rope(a, b, sag, col = '#3a2a1c', th = 0.025, n = 8) { let prev = a; for (let i = 1; i <= n; i++) { const t = i / n, p = [lerp(a[0], b[0], t), lerp(a[1], b[1], t) - sag * Math.sin(t * Math.PI), lerp(a[2], b[2], t)]; this.seg(prev, p, th, col); prev = p; } }
    seg(a, b, th, col) { const dx = b[0] - a[0], dy = b[1] - a[1], dz = b[2] - a[2], L = Math.hypot(dx, dy, dz) || 0.001; const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx / L, dy / L, dz / L)); this.geo(BOXG, new THREE.Matrix4().compose(new THREE.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), q, new THREE.Vector3(th, L, th)), col, 0.02); }
    build(material, shadows = true) { const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.P, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.N, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.C, 3)); g.computeBoundingSphere(); const m = new THREE.Mesh(g, material); m.castShadow = shadows; m.receiveShadow = shadows; m.frustumCulled = false; return m; }
  }
  return Batch;
})();
