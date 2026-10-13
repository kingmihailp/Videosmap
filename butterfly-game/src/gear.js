// ---------------------------------------------------------------- the gear of the «Энтомолог-энтузиаст» (a young entomologist with a huge backpack, insect market)
// Items (13): the net cannon; attachments (map, infrared scanner, autonomy); net parts (shocker hoop, motorised handle, pheromone rope bag, piston handle,
// tungsten bag / hoop / handle); the drive trap and synthetic flowers. This file: the catalogue, what the attachments and the cannon do in a location
// (map screen, infrared sweep, auto-swing, shock arcs, the cannon's net) and the shop window.
const Gear = (() => {
  const P = id => NetParts.PARTS[id], G = id => NetParts.GADGETS[id];
  const ITEMS = [
    { n: 1, kind: 'cannon', id: 'cannon', ru: NetParts.CANNON.ru, price: NetParts.CANNON.price, desc: NetParts.CANNON.desc },
    { n: 2, kind: 'gad', id: 'g_map' }, { n: 3, kind: 'gad', id: 'g_ir' },
    { n: 4, kind: 'part', id: 'r_shock' }, { n: 5, kind: 'part', id: 'h_mech' }, { n: 6, kind: 'part', id: 'm_pher' }, { n: 7, kind: 'part', id: 'h_piston' },
    { n: 8, kind: 'gad', id: 'g_auto' }, { n: 9, kind: 'part', id: 'm_tung' }, { n: 10, kind: 'part', id: 'r_tung' }, { n: 11, kind: 'part', id: 'h_tung' },
    { n: 12, kind: 'tr', id: 'drv' }, { n: 13, kind: 'fl', id: 'synth' },
  ];
  const item = it => it.kind === 'part' ? P(it.id) : it.kind === 'gad' ? G(it.id) : it.kind === 'tr' ? Traps.TYPES[it.id] : it.kind === 'fl' ? Traps.FL[it.id] : NetParts.CANNON;
  const price = it => item(it).price, name = it => item(it).ru;
  const tag = it => it.kind === 'part' ? { h: 'ручка', r: 'обруч', m: 'сетка' }[P(it.id).slot] : it.kind === 'gad' ? 'приспособление' : it.kind === 'cannon' ? 'особый сачок' : it.kind === 'tr' ? 'ловушка' : 'приманка';
  function owned(it) { return it.kind === 'part' ? Save.partCount(it.id) : it.kind === 'gad' ? Save.gadCount(it.id) : it.kind === 'cannon' ? (Save.hasCannon() ? 1 : 0) : Traps.count(it.kind, it.id); }
  function buy(it) {
    if ((Save.data.coins || 0) < price(it)) return 0; if (it.kind === 'cannon' && Save.hasCannon()) return -1;
    if (it.kind === 'part') return Save.buyPart(it.id) ? price(it) : 0; if (it.kind === 'gad') return Save.buyGadget(it.id) ? price(it) : 0;
    if (it.kind === 'cannon') return Save.buyCannon() ? price(it) : 0; return Traps.buy(it.kind, it.id);
  }

  // ================================================================== sounds-free helpers
  const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), UP = new THREE.Vector3(0, 1, 0);
  const fwdOf = cam => _a.set(0, 0, -1).applyQuaternion(cam.quaternion);

  // ================================================================== the infrared scanner: a radar-like beam sweeps all the way round once in 10 seconds
  const IR_CD = 10, IR_SWEEP = 1.3, IR_R = 62;
  // the beam: flat wedges (two low above the ground, two high overhead — a plane through the eye is invisible, so none at eye height) whose brightness grows towards the leading edge; a radar-like sweep
  const beamMat = () => new THREE.ShaderMaterial({ transparent: true, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uA: { value: 1 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform float uT; uniform float uA; varying vec2 vUv;
      void main(){ float lead = pow(clamp(vUv.x, 0.0, 1.0), 2.4), along = vUv.y; float scan = 0.55 + 0.45 * sin(along * 80.0 - uT * 34.0); float grid = step(0.8, fract(vUv.x * 16.0)) * 0.35;
        float edge = pow(smoothstep(0.93, 1.0, vUv.x), 1.0) * 0.9; float a = (lead * (0.3 + 0.7 * scan) + grid * lead + edge) * (1.0 - along * 0.5) * uA * 0.3; gl_FragColor = vec4(1.0, 0.1 + 0.15 * lead, 0.05, a); }` });
  class Ir {
    constructor(play) { this.play = play; this.cd = 3; this.t = -1; this.th = 0; this.marks = new Set(); this.g = new THREE.Group(); this.g.visible = false; play.scene.add(this.g);
      const L = IR_R; this.mat = beamMat(); this.fan = new THREE.Group();
      for (const y of [0.3, 0.9, 2.6, 3.4]) { const wedge = new THREE.BufferGeometry(), w = 0.5; wedge.setAttribute('position', new THREE.Float32BufferAttribute([0, y, 0, Math.cos(-w) * L, y, Math.sin(-w) * L, Math.cos(w) * L, y, Math.sin(w) * L], 3)); wedge.setAttribute('uv', new THREE.Float32BufferAttribute([0.5, 0, 0, 1, 1, 1], 2)); wedge.setIndex([0, 1, 2]); const m = new THREE.Mesh(wedge, this.mat); m.frustumCulled = false; this.fan.add(m); }
      this.g.add(this.fan);
      const ringG = new THREE.RingGeometry(0.96, 1, 64).rotateX(-Math.PI / 2); this.ring = new THREE.Mesh(ringG, new THREE.MeshBasicMaterial({ color: '#ff4a28', transparent: true, opacity: 0.8, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide })); this.ring.frustumCulled = false; play.scene.add(this.ring); this.ring.visible = false;
      this.ring2 = this.ring.clone(); this.ring2.material = this.ring.material.clone(); play.scene.add(this.ring2); this.ring2.visible = false;
    }
    fire() { const p = this.play; this.t = 0; this.th = Math.atan2(-fwdOf(p.camera).z, fwdOf(p.camera).x) + 0.0; this.marks.clear(); this.g.visible = true; this.ring.visible = this.ring2.visible = true; try { Snd.sfx.scan(); } catch (e) {} }
    update(dt) {
      const p = this.play, S = p.netStats;
      if (!S.ir) { this.g.visible = this.ring.visible = this.ring2.visible = false; this.t = -1; return; }
      if (this.t < 0) { this.cd -= dt; if (this.cd <= 0) { this.cd = IR_CD; this.fire(); } return; }
      const prev = this.t; this.t += dt; const u = this.t / IR_SWEEP, ang = this.th + u * 6.2832, pos = p.player.pos;
      this.g.position.set(pos.x, p.world.groundAt(pos.x, pos.z) + 0.25, pos.z); this.g.rotation.y = ang; this.mat.uniforms.uT.value = p.t; this.mat.uniforms.uA.value = clamp(1 - Math.max(0, u - 0.9) * 10);
      const r = clamp(this.t / 1.1) * IR_R; for (const [m, k] of [[this.ring, 1], [this.ring2, 0.62]]) { const rr = Math.max(0.01, r * k); m.position.set(pos.x, this.g.position.y, pos.z); m.scale.set(rr, 1, rr); m.material.opacity = 0.75 * (1 - this.t / 1.4) * (k < 1 ? 0.6 : 1); }
      // every butterfly the beam passes: mark it for a few seconds (the sweep is 360 degrees, so it is the azimuth that decides)
      const step = (dt / IR_SWEEP) * 6.2832 + 0.16;
      for (const f of p.flies) {
        if (f.state === CAUGHT || this.marks.has(f)) continue; const dx = f.pos.x - pos.x, dz = f.pos.z - pos.z, d = Math.hypot(dx, dz); if (d > IR_R) continue;
        let da = Math.atan2(-dz, dx) - ((this.th + u * 6.2832) % 6.2832); da = Math.atan2(Math.sin(da), Math.cos(da)); if (Math.abs(da) < step) { this.marks.add(f); f.irT = 7; this.halo(f); }
      }
      if (this.t > IR_SWEEP + 0.25) { this.t = -1; this.g.visible = this.ring.visible = this.ring2.visible = false; }
    }
    // an outline: red copies of the wings, a little bigger and pushed back, so that a glowing rim shows round the butterfly
    // the contour: for every wing a slightly larger copy whose shader looks at the wing's own alpha and lights only the outline — a bright red rim just inside the edge and a soft glow outside it;
    // drawn over everything (depth test off), so the butterfly shows through leaves; the body gets a red glow too
    halo(f) {
      if (f.irHalo) return; const list = [], mats = [], bodies = [];
      f.mesh.traverse(o => { if (!o.isMesh || !o.geometry) return; if (o.geometry.type === 'PlaneGeometry' && o.material && o.material.map) list.push(o); else if (o.geometry.type === 'BoxGeometry') bodies.push(o); });
      const K = 1.9; f.irHalo = [];
      for (const o of list) { const map = o.material.map, img = map.image || {}, mat = new THREE.ShaderMaterial({ transparent: true, depthTest: false, depthWrite: false, side: THREE.DoubleSide, uniforms: { map: { value: map }, uK: { value: K }, uPx: { value: new THREE.Vector2(1 / (img.width || 32), 1 / (img.height || 32)) }, uP: { value: 1 } },
          vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
          fragmentShader: `uniform sampler2D map; uniform float uK; uniform vec2 uPx; uniform float uP; varying vec2 vUv;
            float A(vec2 u){ if (u.x < 0.0 || u.x > 1.0 || u.y < 0.0 || u.y > 1.0) return 0.0; return texture2D(map, u).a > 0.5 ? 1.0 : 0.0; }
            void main(){ vec2 u = (vUv - 0.5) * uK + 0.5; float a0 = A(u), m1 = 0.0, m2 = 0.0, m3 = 0.0, n1 = 1.0;
              for (int i = 0; i < 12; i++) { float an = float(i) * 0.5236; vec2 d = vec2(cos(an), sin(an)) * uPx; m1 = max(m1, A(u + d * 2.0)); m2 = max(m2, A(u + d * 3.8)); m3 = max(m3, A(u + d * 6.5)); n1 = min(n1, A(u - d * 1.6)); }
              float rim = a0 * (1.0 - n1), outer = (1.0 - a0) * m1, glow = (1.0 - a0) * (1.0 - m1) * (m2 * 0.7 + m3 * 0.35);
              float a = clamp(rim + outer + glow * 0.9, 0.0, 1.0) * uP; float hot = clamp(rim + outer * 0.6, 0.0, 1.0); gl_FragColor = vec4(1.0, 0.03 + 0.28 * hot, 0.02 + 0.12 * hot, a); }` });
        const h = new THREE.Mesh(o.geometry, mat), cx = (o.geometry.boundingBox || (o.geometry.computeBoundingBox(), o.geometry.boundingBox)).getCenter(new THREE.Vector3());
        h.scale.set(o.scale.x * K, o.scale.y * K, o.scale.z * K); h.position.set(o.position.x + cx.x * o.scale.x * (1 - K), o.position.y, o.position.z + cx.z * o.scale.z * (1 - K)); h.rotation.copy(o.rotation); h.renderOrder = 999; h.frustumCulled = false; o.parent.add(h); f.irHalo.push(h); mats.push(mat); }
      for (const o of bodies) { const mat = new THREE.MeshBasicMaterial({ color: '#ff2210', transparent: true, opacity: 0.9, depthTest: false, depthWrite: false }); const h = new THREE.Mesh(o.geometry, mat); h.position.copy(o.position); h.scale.copy(o.scale).multiplyScalar(1.5); h.rotation.copy(o.rotation); h.renderOrder = 998; o.parent.add(h); f.irHalo.push(h); mats.push(mat); }
      f.irMats = mats;
    }
    unhalo(f) { if (!f.irHalo) return; for (const h of f.irHalo) { if (h.parent) h.parent.remove(h); if (h.material) h.material.dispose(); } f.irHalo = null; f.irMats = null; }
    tick(dt) { for (const f of this.play.flies) if (f.irT > 0) { f.irT -= dt; if (f.irMats) { const k = f.irT < 1 ? Math.max(0, f.irT) : 0.75 + 0.25 * Math.sin(this.play.t * 9); for (const m of f.irMats) { if (m.uniforms) m.uniforms.uP.value = k; else m.opacity = 0.9 * k; } } if (f.irT <= 0) { this.unhalo(f); f.irT = 0; } } }
    dispose() { for (const f of this.play.flies) this.unhalo(f); this.play.scene.remove(this.g, this.ring, this.ring2); }
  }

  // ================================================================== the net cannon: a huge net flies out, catches butterflies and is winched back with its catch
  const CANNON_CD = 2.2, CANNON_RANGE = 30;
  // The net is a real piece of cloth: a 9 x 9 grid of nodes joined by strands that cannot stretch beyond their length (but crumple freely), integrated with Verlet steps
  // under gravity and air drag. It leaves the muzzle folded in a tight bundle at 38 m/s; the heavy rim weights fly outwards and pull it open, then it falls on a parabola,
  // lands, drags over the ground and trees; after the flight a winch pulls its centre back to the muzzle and the rest follows. Butterflies touching the cloth are caught.
  const NG = 9, NN = NG * NG, SEG = 0.5, G_ = 9.8, V0 = 38, SUB = 1 / 120, CORNERS = [0, NG - 1, NN - NG, NN - 1];
  const _p = new THREE.Vector3(), _q = new THREE.Vector3(), _r = new THREE.Vector3(), _o = new THREE.Vector3(), _e1 = new THREE.Vector3(), _e2 = new THREE.Vector3(), _t1 = new THREE.Vector3(), _t2 = new THREE.Vector3(), _t3 = new THREE.Vector3();
  function distTri(p, a, b, c) {       // the distance from p to a triangle (Ericson, Real-Time Collision Detection)
    _e1.subVectors(b, a); _e2.subVectors(c, a); const ap = _t1.subVectors(p, a), d1 = _e1.dot(ap), d2 = _e2.dot(ap); if (d1 <= 0 && d2 <= 0) return a.distanceTo(p);
    const bp = _t2.subVectors(p, b), d3 = _e1.dot(bp), d4 = _e2.dot(bp); if (d3 >= 0 && d4 <= d3) return b.distanceTo(p);
    const vc = d1 * d4 - d3 * d2; if (vc <= 0 && d1 >= 0 && d3 <= 0) return _o.copy(a).addScaledVector(_e1, d1 / (d1 - d3)).distanceTo(p);
    const cp = _t3.subVectors(p, c), d5 = _e1.dot(cp), d6 = _e2.dot(cp); if (d6 >= 0 && d5 <= d6) return c.distanceTo(p);
    const vb = d5 * d2 - d1 * d6; if (vb <= 0 && d2 >= 0 && d6 <= 0) return _o.copy(a).addScaledVector(_e2, d2 / (d2 - d6)).distanceTo(p);
    const va = d3 * d6 - d5 * d4; if (va <= 0 && d4 - d3 >= 0 && d5 - d6 >= 0) { const w = (d4 - d3) / ((d4 - d3) + (d5 - d6)); return _o.copy(b).addScaledVector(_t1.subVectors(c, b), w).distanceTo(p); }
    const den = 1 / (va + vb + vc); return _o.copy(a).addScaledVector(_e1, vb * den).addScaledVector(_e2, vc * den).distanceTo(p);
  }
  class Shot {
    constructor(play) {
      this.play = play; this.phase = 'fly'; this.t = 0; this.caught = []; play.hoop.updateWorldMatrix(true, false); const o = new THREE.Vector3().setFromMatrixPosition(play.hoop.matrixWorld); this.origin = o.clone(); this.pos = o.clone(); this.dead = false;
      const dir = fwdOf(play.camera).clone().normalize(); this.dir = dir; const u = new THREE.Vector3().crossVectors(dir, UP).normalize(), w = new THREE.Vector3().crossVectors(u, dir).normalize();
      this.P = new Float32Array(NN * 3); this.Q = new Float32Array(NN * 3); this.iw = new Float32Array(NN); this.pairs = [];
      for (let i = 0; i < NG; i++) for (let j = 0; j < NG; j++) { const k = i * NG + j, a = i - 4, b = j - 4;
        const x = o.x + (u.x * a + w.x * b) * 0.045 + dir.x * 0.1, y = o.y + (u.y * a + w.y * b) * 0.045 + dir.y * 0.1, z = o.z + (u.z * a + w.z * b) * 0.045 + dir.z * 0.1;       // folded: a bundle the size of the muzzle
        const vx = dir.x * V0 + (u.x * a + w.x * b) * 1.9, vy = dir.y * V0 + (u.y * a + w.y * b) * 1.9 + 1.2, vz = dir.z * V0 + (u.z * a + w.z * b) * 1.9;       // the weights on the rim fly outwards
        this.P[k * 3] = x; this.P[k * 3 + 1] = y; this.P[k * 3 + 2] = z; this.Q[k * 3] = x - vx * SUB; this.Q[k * 3 + 1] = y - vy * SUB; this.Q[k * 3 + 2] = z - vz * SUB;
        this.iw[k] = (i === 0 || j === 0 || i === NG - 1 || j === NG - 1) ? ((i % (NG - 1) === 0 && j % (NG - 1) === 0) ? 0.22 : 0.7) : 1;      // the corners carry heavy weights
        if (i + 1 < NG) this.pairs.push([k, k + NG]); if (j + 1 < NG) this.pairs.push([k, k + 1]); }
      this.cen = (NG >> 1) * NG + (NG >> 1); this.near = []; this.reelT = 0;
      // the picture: a translucent sheet, net strands (lines), brass weights on the corners, the rope to the muzzle
      this.g = new THREE.Group(); this.g.frustumCulled = false;
      const idx = []; for (let i = 0; i < NG - 1; i++) for (let j = 0; j < NG - 1; j++) { const a = i * NG + j; idx.push(a, a + NG, a + 1, a + 1, a + NG, a + NG + 1); }
      this.geo = new THREE.BufferGeometry(); this.geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(NN * 3), 3)); this.geo.setIndex(idx);
      this.sheet = new THREE.Mesh(this.geo, new THREE.MeshBasicMaterial({ color: '#d4e8e0', transparent: true, opacity: 0.28, side: THREE.DoubleSide, depthWrite: false })); this.sheet.frustumCulled = false; this.g.add(this.sheet);
      const lp = []; for (const [a, b] of this.pairs) lp.push(a, b); this.lgeo = new THREE.BufferGeometry(); this.lgeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.pairs.length * 6), 3)); this.lines = new THREE.LineSegments(this.lgeo, new THREE.LineBasicMaterial({ color: '#f2f6ee' })); this.lines.frustumCulled = false; this.g.add(this.lines);
      this.wts = CORNERS.map(() => { const m = new THREE.Mesh(new THREE.SphereGeometry(0.1, 8, 6), new THREE.MeshBasicMaterial({ color: '#c8a040' })); m.frustumCulled = false; this.g.add(m); return m; });
      this.rope = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1, 6), new THREE.MeshBasicMaterial({ color: '#8a6a3a' })); this.ropeG = new THREE.Group(); this.ropeG.add(this.rope); this.rope.frustumCulled = false;
      play.scene.add(this.g, this.ropeG); this.sync();
    }
    anchor(out) { const h = this.play.hoop; h.updateWorldMatrix(true, false); return out.setFromMatrixPosition(h.matrixWorld); }
    node(k, out) { return out.set(this.P[k * 3], this.P[k * 3 + 1], this.P[k * 3 + 2]); }
    nodePos(k) { return this.node(k, this._np || (this._np = new THREE.Vector3())); }
    sync() {
      const pa = this.geo.attributes.position, la = this.lgeo.attributes.position; pa.array.set(this.P); pa.needsUpdate = true; this.geo.computeBoundingSphere();
      let q = 0; for (const [a, b] of this.pairs) { for (let c = 0; c < 3; c++) la.array[q++] = this.P[a * 3 + c]; for (let c = 0; c < 3; c++) la.array[q++] = this.P[b * 3 + c]; } la.needsUpdate = true;
      CORNERS.forEach((k, i) => this.wts[i].position.set(this.P[k * 3], this.P[k * 3 + 1], this.P[k * 3 + 2]));
      this.node(this.cen, this.pos); this.anchor(_p); const d = _q.copy(this.pos).sub(_p), L = d.length(); this.ropeG.position.copy(_p).addScaledVector(d, 0.5); this.rope.scale.set(1, Math.max(0.01, L), 1); this.ropeG.quaternion.setFromUnitVectors(UP, d.normalize());
    }
    // one physics step of h seconds
    step(h) {
      const P = this.P, Q = this.Q, w = this.play.world, drag = Math.exp(-0.35 * h);
      for (let k = 0; k < NN; k++) { const o = k * 3; if (this.phase === 'reel' && k === this.cen) continue;
        for (let c = 0; c < 3; c++) { const v = (P[o + c] - Q[o + c]) * drag; Q[o + c] = P[o + c]; P[o + c] += v; } P[o + 1] -= G_ * h * h; }
      if (this.phase === 'reel') { this.anchor(_p); const o = this.cen * 3; _q.set(P[o] - _p.x, P[o + 1] - _p.y, P[o + 2] - _p.z); const L = _q.length(), sp = Math.min(L, (8 + 14 * clamp(this.reelT / 1.5)) * h); if (L > 0.01) { P[o] -= _q.x / L * sp; P[o + 1] -= _q.y / L * sp; P[o + 2] -= _q.z / L * sp; Q[o] = P[o]; Q[o + 1] = P[o + 1]; Q[o + 2] = P[o + 2]; } }
      for (let it = 0; it < 5; it++) for (const [a, b] of this.pairs) {
        const ia = this.iw[a] * (this.phase === 'reel' && a === this.cen ? 0 : 1), ib = this.iw[b] * (this.phase === 'reel' && b === this.cen ? 0 : 1), s = ia + ib; if (!s) continue; const A = a * 3, B = b * 3;
        const dx = P[B] - P[A], dy = P[B + 1] - P[A + 1], dz = P[B + 2] - P[A + 2], d = Math.hypot(dx, dy, dz); if (d <= SEG) continue; const f = (d - SEG) / d;
        P[A] += dx * f * ia / s; P[A + 1] += dy * f * ia / s; P[A + 2] += dz * f * ia / s; P[B] -= dx * f * ib / s; P[B + 1] -= dy * f * ib / s; P[B + 2] -= dz * f * ib / s; }
      for (let k = 0; k < NN; k++) { const o = k * 3, gy = w.groundAt(P[o], P[o + 2]) + 0.05;
        if (P[o + 1] < gy) { P[o + 1] = gy; Q[o] += (P[o] - Q[o]) * 0.3; Q[o + 2] += (P[o + 2] - Q[o + 2]) * 0.3; Q[o + 1] = P[o + 1]; this.landed = true; }       // the ground: it drags and loses speed
        for (const c of this.near) { const dx = P[o] - c.x, dz = P[o + 2] - c.z, d = Math.hypot(dx, dz), r = c.r + 0.06; if (d < r && P[o + 1] < gy + 7) { const f = d > 1e-4 ? r / d : 0; P[o] = c.x + (d > 1e-4 ? dx * f : r); P[o + 2] = c.z + (d > 1e-4 ? dz * f : 0); Q[o] = P[o]; Q[o + 2] = P[o + 2]; } } }       // trunks and rocks stop it
    }
    catchFlies() {
      const p = this.play, cx = this.P[this.cen * 3], cy = this.P[this.cen * 3 + 1], cz = this.P[this.cen * 3 + 2];
      for (const f of p.flies) {
        if (f.state === CAUGHT || !f.mesh.visible || f.cannon) continue; if (Math.hypot(f.pos.x - cx, f.pos.y - cy, f.pos.z - cz) > 4.2) continue; if (f.kind === 'screech' && p.flashOn) continue; const rr = 0.2 + f.span * 0.4; let hit = -1;
        for (let i = 0; i < NG - 1 && hit < 0; i++) for (let j = 0; j < NG - 1; j++) { const a = i * NG + j, b = a + NG, c = a + 1, d = a + NG + 1;
          if (distTri(f.pos, this.node(a, _p), this.node(b, _q), this.node(c, _r)) < rr) { hit = a; break; }
          if (distTri(f.pos, this.node(c, _p), this.node(b, _q), this.node(d, _r)) < rr) { hit = d; break; } }
        if (hit >= 0) { if (p.mp) { if (f.pendingCatch) continue; p.netCatch(f); } else p.onCatch(f); f.cannon = true; f.t = 9; const k = hit; f.glueTo = () => this.nodePos(k); this.caught.push(f); p.net.caughtThisSwing = true; }
      }
    }
    update(dt) {
      const p = this.play, w = p.world; this.t += dt; if (this.phase === 'reel') this.reelT = (this.reelT || 0) + dt;
      if (this.t - (this.nt || -1) > 0.25) { this.nt = this.t; this.node(this.cen, _p); this.near = w.colliders.filter(c => Math.hypot(c.x - _p.x, c.z - _p.z) < c.r + 7 && !c.trap); }
      let left = Math.min(dt, 0.05); while (left > 1e-6) { const h = Math.min(SUB, left); this.step(h); left -= h; if (this.phase !== 'reel' || true) this.catchFlies(); }
      this.node(this.cen, _p); const trav = _p.distanceTo(this.origin), vel = _q.set(this.P[this.cen * 3] - this.Q[this.cen * 3], this.P[this.cen * 3 + 1] - this.Q[this.cen * 3 + 1], this.P[this.cen * 3 + 2] - this.Q[this.cen * 3 + 2]).length() / SUB;
      if (this.phase === 'fly' && (trav > CANNON_RANGE || this.t > 2.2 || (this.landed && this.t > 0.5 && vel < 5))) { this.phase = 'reel'; this.reelT = 0; try { Snd.sfx.winch(); } catch (e) {} }
      if (this.phase === 'reel') { this.anchor(_r); if (_p.distanceTo(_r) < 1.1 || this.reelT > 14) { this.sync(); this.finish(); return false; } }
      this.sync(); return true;
    }
    finish() { for (const f of this.caught) { f.cannon = false; f.glueTo = null; f.t = Math.min(f.t, 0.25); } this.play.scene.remove(this.g, this.ropeG); this.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); this.dead = true; }
  }

  // ================================================================== the shocker: blue arcs jump from the hoop to the butterflies nearby, who are caught as well
  class Arc {
    constructor(play, a, b) { this.play = play; this.a = a.clone(); this.b = b.clone(); this.t = 0.32; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3)); this.line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#c8f4ff', blending: THREE.AdditiveBlending, transparent: true, depthTest: false })); this.line.frustumCulled = false; this.line.renderOrder = 999; this.line2 = this.line.clone(); this.line2.material = new THREE.LineBasicMaterial({ color: '#4a9aff', blending: THREE.AdditiveBlending, transparent: true, depthTest: false }); this.line2.geometry = geo.clone(); this.line2.renderOrder = 998; play.scene.add(this.line, this.line2); this.jit(); }
    jit() { for (const [ln, amp] of [[this.line, 0.18], [this.line2, 0.34]]) { const pos = ln.geometry.attributes.position, n = pos.count; for (let i = 0; i < n; i++) { const u = i / (n - 1), k = Math.sin(u * Math.PI) * amp * (0.4 + Math.random()); pos.setXYZ(i, lerp(this.a.x, this.b.x, u) + (Math.random() - 0.5) * 2 * k, lerp(this.a.y, this.b.y, u) + (Math.random() - 0.5) * 2 * k, lerp(this.a.z, this.b.z, u) + (Math.random() - 0.5) * 2 * k); } pos.needsUpdate = true; } }
    update(dt) { this.t -= dt; this.jitT = (this.jitT || 0) - dt; if (this.jitT <= 0) { this.jitT = 0.04; this.jit(); } this.line.material.opacity = this.line2.material.opacity = clamp(this.t / 0.2); return this.t > 0; }
    dispose() { this.play.scene.remove(this.line, this.line2); this.line.geometry.dispose(); this.line2.geometry.dispose(); }
  }
  const SHOCK_R = 15;
  function shock(play, f) {            // called after a butterfly was caught with a shocker hoop: the nearest ones (<= 24, within 15 m of it) are shocked and caught as well
    const rt = play.gear, from = new THREE.Vector3(); play.hoop.updateWorldMatrix(true, false); from.setFromMatrixPosition(play.hoop.matrixWorld);
    const list = play.flies.filter(v => v !== f && v.state !== CAUGHT && v.mesh.visible && !(v.kind === 'screech' && play.flashOn) && v.pos.distanceTo(f.pos) < SHOCK_R).sort((a, b) => a.pos.distanceTo(f.pos) - b.pos.distanceTo(f.pos)).slice(0, 24);
    let prev = from; for (const v of list) { rt.arcs.push(new Arc(play, prev, v.pos)); prev = v.pos; if (play.mp) { if (v.pendingCatch) continue; play.netCatch(v); } else play.onCatch(v); v.shocked = true; }
    if (list.length) { try { Snd.sfx.zap(); } catch (e) {} play.toast(`Разряд! Пойманы ещё бабочки: ${list.length}`, 2.2); }
  }

  // ================================================================== per-frame work for a location
  function init(play) { play.gear = { ir: new Ir(play), auto: false, autoT: 0, arcs: [], shot: null, cd: 0, cdMax: CANNON_CD, noise: 0 }; }
  function update(play, dt) {
    const rt = play.gear, S = play.netStats; if (!rt) return; rt.ir.update(dt); rt.ir.tick(dt);
    rt.cd = Math.max(0, rt.cd - dt);
    if (rt.shot && !rt.shot.update(dt)) rt.shot = null;
    for (let i = rt.arcs.length - 1; i >= 0; i--) if (!rt.arcs[i].update(dt)) { rt.arcs[i].dispose(); rt.arcs.splice(i, 1); }
    // the autonomy servo: with the switch on, the net swings by itself at butterflies within reach
    if (S.auto && rt.auto && !play.overlay) {
      rt.autoT -= dt; if (rt.autoT <= 0 && play.net.phase < 0 && play.net.cd <= 0 && rt.cd <= 0) {
        rt.autoT = 0.12; const reach = S.cannon ? 22 : S.mech ? 11 : 2.9 * Math.min(1.5, S.radius), fw = fwdOf(play.camera);
        for (const f of play.flies) { if (f.state === CAUGHT || !f.mesh.visible || (f.kind === 'screech' && play.flashOn)) continue; _c.copy(f.pos).sub(play.camera.position); const d = _c.length(); if (d < reach && d > 0.4 && _c.normalize().dot(fw) > (S.cannon ? 0.93 : 0.62)) { play.swing(); break; } }
      }
    }
    // the model's lights: the auto LED (green when on), the infrared lens (bright while it sweeps), map screen flicker
    const M = play.netModel && play.netModel.mats; if (M) {
      if (M.autoLed) M.autoLed.color.set(rt.auto ? '#4aff6a' : '#c83a2a'); if (M.irLens) M.irLens.color.set(rt.ir.t >= 0 ? '#ffffff' : '#ff3a20'); if (M.mapScreen && M.mapScreen.color) M.mapScreen.color.setScalar(0.8 + Math.sin(play.t * 31) * 0.1);
      if (M.stud) M.stud.forEach((m, i) => m.color.set((Math.sin(play.t * 18 + i * 1.7) > 0.2) ? '#d8f8ff' : '#4a8ac8')); if (M.beads) M.beads.color.set(Math.sin(play.t * 3) > 0 ? '#d0a0ff' : '#a070e8');
      if (M.cells) { const k = 1 - clamp(rt.cd / rt.cdMax); M.cells.forEach((m, i) => m.color.set(k > (i + 1) / 4 - 0.01 ? '#58d8ff' : '#1a3a48')); } if (M.needle && play.netStats.cannon) M.needle.rotation.z = -0.9 + (1 - clamp(rt.cd / rt.cdMax)) * 1.8;
    }
  }
  function dispose(play) { const rt = play.gear; if (!rt) return; rt.ir.dispose(); for (const a of rt.arcs) a.dispose(); if (rt.shot) rt.shot.finish(); play.gear = null; }
  function fire(play) {            // the cannon: one shot per CANNON_CD
    const rt = play.gear; if (rt.cd > 0 || rt.shot) return false; rt.cd = rt.cdMax; rt.shot = new Shot(play); try { Snd.sfx.cannon(); } catch (e) {} play.player.swingNoise = 1.2 * (1 - play.netStats.quiet); return true;
  }

  // ================================================================== the HUD of the attachments: a map screen with interference, the infrared meter, the autonomy switch, the cannon charge
  const crt = document.createElement('canvas'); crt.width = crt.height = 78; const cx = crt.getContext('2d');
  function drawMap(play, ctx, t) {
    const S = play.sectors; if (!S) return; const X = SW - 98, Y = SH - 116, W = 92, H = 92;
    UIK.panel(ctx, X - 3, Y - 3, W + 6, H + 14, { fill: '#1a1c20', border: '#5a6068', shadow: true });
    ctx.fillStyle = '#0a120c'; ctx.fillRect(X, Y, W, H);
    const base = Sectors.mapImage(S, 78, -1, play.world); cx.globalCompositeOperation = 'source-over'; cx.clearRect(0, 0, 78, 78);
    // the picture, torn into bands that slip sideways now and then (interference), tinted phosphor green
    const glitch = (Math.sin(t * 2.3) > 0.82) || (Math.sin(t * 7.1) > 0.97); let y = 0;
    while (y < 78) { const h = 2 + ((y * 7 + Math.floor(t * 6)) % 3), off = glitch && ((y * 13 + Math.floor(t * 20)) % 5 === 0) ? Math.round((Math.sin(y * 3 + t * 40) * 6)) : (Math.sin(y * 0.7 + t * 5) > 0.93 ? 1 : 0); cx.drawImage(base, 0, y, 78, h, off, y, 78, h); y += h; }
    cx.globalCompositeOperation = 'multiply'; cx.fillStyle = '#b8ffc8'; cx.fillRect(0, 0, 78, 78); cx.globalCompositeOperation = 'source-over';
    // the locators: you (white arrow) and the others
    const mp = (px, pz) => [Math.round((px / S.R + 1) / 2 * 78), Math.round((pz / S.R + 1) / 2 * 78)];
    const arrow = (c2, x, y2, yaw, col) => { const fx = -Math.sin(yaw), fz = -Math.cos(yaw); for (const [pad, fill] of [[0.9, '#08140a'], [0, col]]) { c2.fillStyle = fill; for (let dy = -5; dy <= 5; dy++) for (let dx = -5; dx <= 5; dx++) { const u = dx * fx + dy * fz, v = -dx * fz + dy * fx; if ((u >= -0.5 - pad && u <= 4.5 + pad && Math.abs(v) <= (4.5 - u) * 0.65 + pad) || (u >= -3 - pad && u < 0.5 && Math.abs(v) <= 0.6 + pad)) c2.fillRect(x + dx, y2 + dy, 1, 1); } } };
    if (play.mp) for (const r of play.others()) { const [x, yy] = mp(r.pos.x, r.pos.z); arrow(cx, x, yy, r.yaw || 0, '#7affd0'); }
    { const [x, yy] = mp(play.player.pos.x, play.player.pos.z); arrow(cx, x, yy, play.player.yaw, Math.floor(t * 3) % 2 ? '#ffffff' : '#ffe070'); }
    // scanlines, a roll bar, grain, the vignette
    cx.fillStyle = 'rgba(0,0,0,0.28)'; for (let yy = 0; yy < 78; yy += 2) cx.fillRect(0, yy, 78, 1);
    const bar = (t * 26) % 120 - 20; cx.fillStyle = 'rgba(160,255,190,0.11)'; cx.fillRect(0, bar, 78, 9); cx.fillStyle = 'rgba(160,255,190,0.07)'; cx.fillRect(0, bar + 9, 78, 4);
    for (let i = 0; i < 70; i++) { cx.fillStyle = Math.random() < 0.5 ? 'rgba(200,255,210,0.55)' : 'rgba(0,0,0,0.5)'; cx.fillRect((Math.random() * 78) | 0, (Math.random() * 78) | 0, 1, 1); }
    if (glitch) { cx.fillStyle = 'rgba(180,255,200,0.35)'; cx.fillRect(0, ((t * 97) % 78) | 0, 78, 1); }
    ctx.imageSmoothingEnabled = false; ctx.drawImage(crt, X + 7, Y + 7, 78, 78);
    // the bezel: rounded glass corners, a dim glare, the zone caption
    ctx.fillStyle = '#1a1c20'; for (const [ax, ay] of [[0, 0], [W - 5, 0], [0, H - 5], [W - 5, H - 5]]) { ctx.fillRect(X + ax, Y + ay, 5, 5); }
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fillRect(X + 9, Y + 9, 22, 3); ctx.fillRect(X + 9, Y + 12, 3, 8);
    const here = S.at(play.player.pos.x, play.player.pos.z); T.draw(ctx, `ЗОНА ${here + 1} · ${S.rects[here].name}`, X + W / 2, Y + H + 2, { size: 8, align: 'c', color: '#7affa0' });
    ctx.fillStyle = Math.floor(t * 1.2) % 2 ? '#3aff6a' : '#1a6a30'; ctx.fillRect(X + W - 4, Y + H + 4, 2, 2);
  }
  function drawHud(play, ctx, t) {
    const rt = play.gear, S = play.netStats; if (!rt) return; const c = UIK.col;
    if (S.map) drawMap(play, ctx, t);
    let by = S.map ? SH - 128 : SH - 28;
    const bar = (label, k, col, hot) => { UIK.panel(ctx, SW - 98, by - 16, 92, 15, { fill: 'rgba(16,28,24,0.88)', shadow: false }); T.draw(ctx, label, SW - 94, by - 13, { size: 8, color: hot ? '#fff' : c.dim }); ctx.fillStyle = '#233a30'; ctx.fillRect(SW - 50, by - 12, 40, 6); ctx.fillStyle = col; ctx.fillRect(SW - 50, by - 12, Math.round(40 * k), 6); by -= 17; };
    if (S.ir) bar('ИК-скан', rt.ir.t >= 0 ? 1 : clamp(1 - rt.ir.cd / IR_CD), '#ff5a38', rt.ir.t >= 0);
    if (S.cannon) bar('Заряд', 1 - clamp(rt.cd / rt.cdMax), '#58d8ff', rt.cd <= 0);
    if (S.auto) { UIK.panel(ctx, SW - 98, by - 16, 92, 15, { fill: 'rgba(16,28,24,0.88)', shadow: false, border: rt.auto ? '#4aff6a' : c.line }); T.draw(ctx, 'Авто [X]', SW - 94, by - 13, { size: 8, color: c.text }); ctx.fillStyle = rt.auto ? '#1a5a2a' : '#3a2220'; ctx.fillRect(SW - 36, by - 12, 24, 7); ctx.fillStyle = rt.auto ? '#4aff6a' : '#c83a2a'; ctx.fillRect(rt.auto ? SW - 24 : SW - 36, by - 12, 12, 7); by -= 17; }
    // the infrared marks: the distance under every butterfly lit by the beam (the outline itself glows in the 3D scene, see Ir.halo)
    if (S.ir) { let n = 0; for (const f of play.flies) { if (!(f.irT > 0) || f.state === CAUGHT) continue; _a.copy(f.pos).project(play.camera); if (_a.z > 1 || Math.abs(_a.x) > 1 || Math.abs(_a.y) > 1) continue; const x = Math.round((_a.x * 0.5 + 0.5) * SW), y = Math.round((-_a.y * 0.5 + 0.5) * SH), d = f.pos.distanceTo(play.camera.position), s = clamp(34 / (d * 0.5 + 3), 3, 9) + 3; ctx.fillStyle = f.irT < 1 && Math.floor(t * 10) % 2 ? 'rgba(255,90,60,0.4)' : '#ff4a2a';
      if (n++ < 14) T.draw(ctx, Math.round(d) + ' м', x, y + Math.min(s, 8) + 2, { size: 8, align: 'c', color: '#ff9a80', shadow: '#000' }); } }
  }
  const toggleAuto = play => { const rt = play.gear; if (!rt || !play.netStats.auto) return false; rt.auto = !rt.auto; try { Snd.sfx.click(); } catch (e) {} play.toast(rt.auto ? 'Автономность включена: сачок сам замахивается' : 'Автономность выключена', 2.2); return true; };


  // ================================================================== the shop window of the market (overlay 'gear'); state lives in mk.gr
  const ROWS = 7, fit = (str, maxW) => { if (T.width(str, 8) <= maxW) return str; while (str.length > 1 && T.width(str + '…', 8) > maxW) str = str.slice(0, -1); return str + '…'; };
  const BASE = () => ({ uid: 0, h: 'h_basic', r: 'r_basic', m: 'm_basic' });
  function modelOf(it) {
    if (it.kind === 'cannon') return makeNetModel(Object.assign(BASE(), { uid: -1, cannon: true, g: [] })).g;
    if (it.kind === 'gad') return makeNetModel(Object.assign(BASE(), { g: [it.id], pv: true })).g;
    if (it.kind === 'part') return makeNetModel(Object.assign(BASE(), { [P(it.id).slot]: it.id, g: [], pv: true })).g;
    if (it.kind === 'tr') return Traps.model(it.id, {});
    return null;
  }
  const picCache = {};
  function pic(it, w, h) {
    const k = it.id + w + 'x' + h; if (picCache[k] !== undefined) return picCache[k]; let cv = null;
    try { if (it.kind === 'fl') cv = Traps.closeup('fl', it.id); else { const m = modelOf(it); if (m) { const holder = new THREE.Group(); holder.add(m); if (it.kind !== 'tr') holder.rotation.set(0.0, 0.0, 0.0); cv = Art.snapshot(holder, w, h, it.kind === 'tr' ? 0.8 : it.kind === 'cannon' ? 2.0 : Math.PI + 0.6, it.kind === 'tr' ? 0.35 : it.kind === 'cannon' ? 0.22 : 0.3); } } } catch (e) { cv = null; }
    return (picCache[k] = cv);
  }
  function lines(it) {
    if (it.kind === 'part') return NetParts.fxLines(P(it.id).fx);
    if (it.kind === 'cannon') return ['Дальность выстрела: 30 м', 'Перезарядка: 2 с', 'Сеть втягивается обратно'];
    if (it.kind === 'tr') return [`Служит ${Traps.mmss(item(it).life)}, вмещает ${item(it).cap}`, '40% аберрантов', '40% редких видов'];
    if (it.kind === 'fl') return ['Запах: пьянящий (5 из 5)', '+25% к шансу редких видов'];
    return [];
  }
  function shopOpen(mk) { mk.gr = { sel: 0, scroll: 0, msg: 'Привет! Я энтомолог-энтузиаст. Всё это — мои собственные разработки. Дорого? Наука требует жертв!', msgT: 7, flash: 0, last: 0 }; }
  const shopLayout = mk => {
    const G = mk.gr, rows = []; for (let k = 0; k < ROWS; k++) { const i = G.scroll + k; if (i >= ITEMS.length) break; rows.push({ id: 'row', i, x: 8, y: 44 + k * 29, w: 226, h: 27 }); }
    return { rows, buy: { id: 'buy', label: 'Купить', x: 244, y: 232, w: 110, h: 18 }, closeBtn: { id: 'close', label: 'Уйти ✕', x: SW - 82, y: 4, w: 74, h: 15 }, up: { id: 'up', label: '^', x: 176, y: 252, w: 26, h: 12 }, dn: { id: 'dn', label: 'v', x: 206, y: 252, w: 26, h: 12 } };
  };
  function shopMove(mk, d) { const G = mk.gr; if (!G) return; G.sel = clamp(G.sel + d, 0, ITEMS.length - 1); if (G.sel < G.scroll) G.scroll = G.sel; if (G.sel >= G.scroll + ROWS) G.scroll = G.sel - ROWS + 1; Snd.sfx.page(); }
  function shopBuy(mk) {
    const G = mk.gr, it = ITEMS[G.sel]; if (!it) return; const got = buy(it);
    if (got > 0) { G.msg = it.kind === 'cannon' ? 'Лучшая модель сезона! Она уже у вас в руках.' : it.kind === 'gad' ? 'Надеть можно на верстаке в кабинете.' : it.kind === 'part' ? 'Соберёте на верстаке в кабинете — и вперёд!' : it.kind === 'tr' ? 'Поставьте её на локации (G) и не забудьте приманку.' : 'Ложите в ловушку — бабочки сойдут с ума!'; G.last = -got; G.flash = 0.8; Snd.sfx.coin(); }
    else if (got < 0) { G.msg = 'Пушка у вас уже есть: такая одна на всех сачках.'; Snd.sfx.deny(); }
    else { G.msg = 'Не хватает монет. Моё оборудование стоит дорого — продавайте бабочек и рамки с коллекциями.'; Snd.sfx.deny(); } G.msgT = 6;
  }
  function shopKey(mk, e) {
    if (e.code === 'Escape' || e.code === 'KeyE') mk.close(); else if (e.code === 'ArrowUp') shopMove(mk, -1); else if (e.code === 'ArrowDown') shopMove(mk, 1); else if (e.code === 'Enter' || e.code === 'Space') shopBuy(mk);
  }
  function shopClick(mk, x, y) {
    const G = mk.gr, L = shopLayout(mk); if (UIK.hit(L.closeBtn, x, y)) { Snd.sfx.page(); mk.close(); return; }
    const r = L.rows.find(r => UIK.hit(r, x, y)); if (r) { if (G.sel !== r.i) { G.sel = r.i; Snd.sfx.click(); } else shopBuy(mk); return; }
    if (UIK.hit(L.buy, x, y)) shopBuy(mk); else if (UIK.hit(L.up, x, y)) shopMove(mk, -1); else if (UIK.hit(L.dn, x, y)) shopMove(mk, 1);
  }
  function shopDraw(mk, ctx, t, m, dt) {
    const G = mk.gr, L = shopLayout(mk), it = ITEMS[G.sel], c = UIK.col; G.msgT = Math.max(0, G.msgT - dt); G.flash = Math.max(0, G.flash - dt);
    ctx.fillStyle = '#10181c'; ctx.fillRect(0, 0, SW, SH); for (let i = 0; i < SW; i += 3) { ctx.fillStyle = (i % 9 === 0) ? '#16222a' : '#131e24'; ctx.fillRect(i, 0, 3, SH); }
    T.draw(ctx, 'Энтомолог-энтузиаст: оборудование', 8, 6, { size: 10, color: c.gold }); T.draw(ctx, 'Выберите товар и нажмите «Купить» (или щёлкните дважды)', 8, 20, { size: 8, color: c.dim }); T.draw(ctx, 'Тринадцать необычных вещей', 8, 32, { size: 8, color: c.dim });
    mk.drawCoins(ctx, SW - 92, 24, true); UIK.btn(ctx, L.closeBtn, UIK.hit(L.closeBtn, m.x, m.y));
    UIK.panel(ctx, 6, 42, 230, 212, { fill: '#1c2a30', border: '#3a5460', shadow: false });
    L.rows.forEach(r => { const q = ITEMS[r.i], on = r.i === G.sel, hv = UIK.hit(r, m.x, m.y), own = owned(q); ctx.fillStyle = on ? 'rgba(120,220,255,0.26)' : hv ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.2)'; ctx.fillRect(r.x, r.y, r.w, r.h); if (on) { ctx.strokeStyle = '#7ad8ff'; ctx.strokeRect(r.x + 0.5, r.y + 0.5, r.w - 1, r.h - 1); }
      ctx.fillStyle = '#0c1418'; ctx.fillRect(r.x + 2, r.y + 2, 17, 23); T.draw(ctx, String(q.n), r.x + 10, r.y + 9, { size: 8, align: 'c', color: '#7ad8ff' });
      T.draw(ctx, fit(name(q), 156), r.x + 23, r.y + 4, { size: 8, color: '#f0f4f4' }); T.draw(ctx, fit(tag(q) + (own ? ` · есть: ${own}` : ''), 150), r.x + 23, r.y + 15, { size: 8, color: own ? '#9af0a0' : '#8ab0c0' });
      mk.drawCoin(ctx, r.x + r.w - 16 - T.width(String(price(q)), 8), r.y + 4); T.draw(ctx, String(price(q)), r.x + r.w - 6, r.y + 4, { size: 8, align: 'r', color: c.gold }); });
    T.draw(ctx, `${G.sel + 1}/${ITEMS.length}`, 12, 255, { size: 8, color: c.dim }); UIK.btn(ctx, L.up, UIK.hit(L.up, m.x, m.y)); UIK.btn(ctx, L.dn, UIK.hit(L.dn, m.x, m.y));
    UIK.panel(ctx, 240, 40, 234, 54, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false }); Portrait.draw(ctx, 'enthusiast', 247, 43, t, G.msgT > 0); T.para(ctx, G.msg, 294, 44, 176, { size: 8, color: '#2a1a0c', lh: 9 });
    UIK.panel(ctx, 240, 98, 234, 130, { fill: '#e8dcb4', border: '#5a3a1c', shadow: false });
    if (it) {
      ctx.fillStyle = '#17262c'; ctx.fillRect(244, 102, 62, 62); const cv = pic(it, it.kind === 'fl' ? 100 : 124, it.kind === 'fl' ? 150 : 124); ctx.imageSmoothingEnabled = false;
      if (cv) { const w = it.kind === 'fl' ? 41 : 60, h = it.kind === 'fl' ? 60 : 60; ctx.drawImage(cv, 245 + (60 - w) / 2, 103, w, h); } else T.draw(ctx, '?', 275, 128, { size: 10, align: 'c', color: '#7ad8ff' });
      T.draw(ctx, fit(name(it), 160), 312, 103, { size: 8, color: '#2a1a0c' }); T.draw(ctx, tag(it), 312, 114, { size: 8, color: '#8a2a1a' });
      lines(it).slice(0, 4).forEach((q, k) => T.draw(ctx, fit(q, 160), 312, 126 + k * 10, { size: 8, color: '#2a6a1a' }));
      T.para(ctx, item(it).desc, 248, 168, 222, { size: 8, color: '#4a3a20', lh: 9 });
      ctx.fillStyle = '#a8946a'; ctx.fillRect(246, 212, 222, 1); T.draw(ctx, 'Цена', 248, 215, { size: 8, color: '#2a1a0c' }); mk.drawCoin(ctx, 424 - Math.max(0, T.width(String(price(it)), 8) - 24), 216); T.draw(ctx, String(price(it)), 466, 215, { size: 8, align: 'r', color: '#8a5a10' });
    }
    UIK.btn(ctx, L.buy, !!it && (Save.data.coins || 0) >= price(it) && UIK.hit(L.buy, m.x, m.y)); T.draw(ctx, it ? `у вас: ${owned(it)}` : '', 372, 237, { size: 8, color: c.dim });
    if (G.flash > 0) { ctx.globalAlpha = Math.min(1, G.flash * 2); T.draw(ctx, String(G.last), SW - 8, 40 - (0.8 - G.flash) * 8, { size: 10, align: 'r', color: '#ff9070', shadow: '#000' }); ctx.globalAlpha = 1; }
  }

  return { ITEMS, item, price, name, tag, owned, buy, init, update, dispose, fire, shock, drawHud, drawMap, toggleAuto, IR_CD, CANNON_CD, CANNON_RANGE, shopOpen, shopKey, shopClick, shopDraw, shopMove, pic };
})();
