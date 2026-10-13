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
    halo(f) {
      if (f.irHalo) return; const mat = new THREE.MeshBasicMaterial({ color: '#ff3a1e', side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: 3, polygonOffsetUnits: 3, depthWrite: false, transparent: true, opacity: 0.95 }), list = [];
      f.mesh.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'PlaneGeometry') list.push(o); });
      f.irHalo = list.map(o => { const h = new THREE.Mesh(o.geometry, mat); h.position.copy(o.position); h.scale.copy(o.scale).multiplyScalar(1.3); h.rotation.copy(o.rotation); h.renderOrder = -5; o.parent.add(h); return h; }); f.irMat = mat;
      const glow = new THREE.Sprite(new THREE.SpriteMaterial({ color: '#ff5a30', transparent: true, opacity: 0.5, depthTest: false, depthWrite: false, blending: THREE.AdditiveBlending })); glow.scale.set(f.span * 1.5, f.span * 1.5, 1); f.mesh.add(glow); f.irHalo.push(glow);
    }
    unhalo(f) { if (!f.irHalo) return; for (const h of f.irHalo) { if (h.parent) h.parent.remove(h); if (h.material && h.material.map === undefined && h.material.dispose) { /* shared */ } } if (f.irMat) f.irMat.dispose(); f.irHalo = null; f.irMat = null; }
    tick(dt) { for (const f of this.play.flies) if (f.irT > 0) { f.irT -= dt; if (f.irHalo && f.irMat) f.irMat.opacity = 0.55 + 0.4 * Math.sin(this.play.t * 9); if (f.irT <= 0) { this.unhalo(f); f.irT = 0; } } }
    dispose() { for (const f of this.play.flies) this.unhalo(f); this.play.scene.remove(this.g, this.ring, this.ring2); }
  }

  // ================================================================== the net cannon: a huge net flies out, catches butterflies and is winched back with its catch
  const CANNON_CD = 2.2, CANNON_RANGE = 30;
  class Shot {
    constructor(play) {
      this.play = play; this.phase = 'out'; this.t = 0; this.R = 0.4; this.caught = []; play.hoop.updateWorldMatrix(true, false); this.pos = new THREE.Vector3().setFromMatrixPosition(play.hoop.matrixWorld); this.origin = this.pos.clone();
      this.dir = fwdOf(play.camera).clone().normalize(); this.g = new THREE.Group(); const H = 2.6;
      this.ring = new THREE.Mesh(new THREE.TorusGeometry(1, 0.03, 6, 28), new THREE.MeshBasicMaterial({ color: '#e8eef2' })); this.g.add(this.ring);
      const cone = new THREE.ConeGeometry(1, H, 24, 8, true); cone.rotateX(-Math.PI / 2); cone.translate(0, 0, -H / 2); this.bag = new THREE.Mesh(cone, new THREE.MeshBasicMaterial({ color: '#d4e8e0', transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })); this.g.add(this.bag);
      this.wire = new THREE.Mesh(cone, new THREE.MeshBasicMaterial({ color: '#6f9088', wireframe: true, transparent: true, opacity: 0.85 })); this.g.add(this.wire);
      for (let i = 0; i < 4; i++) { const w = new THREE.Mesh(new THREE.SphereGeometry(0.06, 6, 5), new THREE.MeshBasicMaterial({ color: '#c8a040' })); const a = i * 1.5708; w.position.set(Math.cos(a), Math.sin(a), 0); this.g.add(w); }       // weights on the rim
      this.rope = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1, 5), new THREE.MeshBasicMaterial({ color: '#c8b078' })); this.ropeG = new THREE.Group(); this.ropeG.add(this.rope);
      this.g.frustumCulled = false; this.g.traverse(o => { o.frustumCulled = false; }); play.scene.add(this.g, this.ropeG); this.place();
    }
    anchor(out) { const cam = this.play.camera; return out.copy(cam.position).addScaledVector(fwdOf(cam), 0.6).addScaledVector(UP, -0.25); }
    place() { this.g.position.copy(this.pos); this.g.scale.set(this.R, this.R, 1); this.g.lookAt(_b.copy(this.pos).add(this.phase === 'out' ? this.dir : _c.copy(this.anchor(_c)).sub(this.pos).normalize().multiplyScalar(-1))); this.g.scale.set(this.R, this.R, 1);
      this.anchor(_b); const d = _c.copy(this.pos).sub(_b); const L = d.length(); this.ropeG.position.copy(_b).addScaledVector(d, 0.5); this.rope.scale.set(1, L, 1); this.ropeG.quaternion.setFromUnitVectors(UP, d.normalize()); }
    update(dt) {
      const p = this.play, w = p.world; this.t += dt;
      if (this.phase === 'out') {
        this.pos.addScaledVector(this.dir, 38 * dt); this.R = Math.min(3.6, this.R + dt * 7.5); const gy = w.groundAt(this.pos.x, this.pos.z), far = this.pos.distanceTo(this.origin) > CANNON_RANGE;
        if (this.pos.y < gy + 0.35) this.pos.y = gy + 0.35; if (far || this.t > 1.1 || Math.hypot(this.pos.x, this.pos.z) > w.R) { this.phase = 'pause'; this.t = 0; }
      } else if (this.phase === 'pause') { this.R = Math.min(3.6, this.R + dt); if (this.t > 0.18) { this.phase = 'back'; this.t = 0; try { Snd.sfx.winch(); } catch (e) {} } }
      else { this.anchor(_b); const d = _c.copy(_b).sub(this.pos); const L = d.length(), sp = Math.max(20, L * 1.4) * dt; if (L <= sp + 0.4) { this.finish(); return false; } this.pos.addScaledVector(d.normalize(), sp); this.R = Math.max(1.3, this.R - dt * 3.2); }
      // the butterflies in the net mouth are caught
      for (const f of p.flies) {
        if (f.state === CAUGHT || !f.mesh.visible || f.cannon) continue; if (f.pos.distanceTo(this.pos) < this.R + f.span * 0.4) { if (f.kind === 'screech' && p.flashOn) continue; if (p.mp) { if (f.pendingCatch) continue; p.netCatch(f); } else p.onCatch(f); f.cannon = true; f.t = 9; this.caught.push(f); p.net.caughtThisSwing = true; }
      }
      this.place(); return true;
    }
    finish() { for (const f of this.caught) { f.cannon = false; f.t = Math.min(f.t, 0.25); } this.play.scene.remove(this.g, this.ropeG); this.g.traverse(o => { if (o.geometry) o.geometry.dispose(); }); this.dead = true; }
  }

  // ================================================================== the shocker: blue arcs jump from the hoop to the butterflies nearby, who are caught as well
  class Arc {
    constructor(play, a, b) { this.play = play; this.a = a.clone(); this.b = b.clone(); this.t = 0.32; const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(14 * 3), 3)); this.line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: '#c8f4ff', blending: THREE.AdditiveBlending, transparent: true, depthTest: false })); this.line.frustumCulled = false; this.line.renderOrder = 999; this.line2 = this.line.clone(); this.line2.material = new THREE.LineBasicMaterial({ color: '#4a9aff', blending: THREE.AdditiveBlending, transparent: true, depthTest: false }); this.line2.geometry = geo.clone(); this.line2.renderOrder = 998; play.scene.add(this.line, this.line2); this.jit(); }
    jit() { for (const [ln, amp] of [[this.line, 0.18], [this.line2, 0.34]]) { const pos = ln.geometry.attributes.position, n = pos.count; for (let i = 0; i < n; i++) { const u = i / (n - 1), k = Math.sin(u * Math.PI) * amp * (0.4 + Math.random()); pos.setXYZ(i, lerp(this.a.x, this.b.x, u) + (Math.random() - 0.5) * 2 * k, lerp(this.a.y, this.b.y, u) + (Math.random() - 0.5) * 2 * k, lerp(this.a.z, this.b.z, u) + (Math.random() - 0.5) * 2 * k); } pos.needsUpdate = true; } }
    update(dt) { this.t -= dt; this.jitT = (this.jitT || 0) - dt; if (this.jitT <= 0) { this.jitT = 0.04; this.jit(); } this.line.material.opacity = this.line2.material.opacity = clamp(this.t / 0.2); return this.t > 0; }
    dispose() { this.play.scene.remove(this.line, this.line2); this.line.geometry.dispose(); this.line2.geometry.dispose(); }
  }
  function shock(play, f) {            // called after a butterfly was caught with a shocker hoop: the nearest ones (<= 7, within 6 m of it) are shocked and caught as well
    const rt = play.gear, from = new THREE.Vector3(); play.hoop.updateWorldMatrix(true, false); from.setFromMatrixPosition(play.hoop.matrixWorld);
    const list = play.flies.filter(v => v !== f && v.state !== CAUGHT && v.mesh.visible && !(v.kind === 'screech' && play.flashOn) && v.pos.distanceTo(f.pos) < 6).sort((a, b) => a.pos.distanceTo(f.pos) - b.pos.distanceTo(f.pos)).slice(0, 7);
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
        rt.autoT = 0.12; const reach = S.cannon ? 22 : S.mech ? 6.5 : 2.9 * Math.min(1.5, S.radius), fw = fwdOf(play.camera);
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
    // the infrared marks: red brackets round every butterfly lit by the beam, with the distance (they are seen through trees)
    if (S.ir) { let n = 0; for (const f of play.flies) { if (!(f.irT > 0) || f.state === CAUGHT) continue; _a.copy(f.pos).project(play.camera); if (_a.z > 1 || Math.abs(_a.x) > 1 || Math.abs(_a.y) > 1) continue; const x = Math.round((_a.x * 0.5 + 0.5) * SW), y = Math.round((-_a.y * 0.5 + 0.5) * SH), d = f.pos.distanceTo(play.camera.position), s = clamp(34 / (d * 0.5 + 3), 3, 9) + 3; ctx.fillStyle = f.irT < 1 && Math.floor(t * 10) % 2 ? 'rgba(255,90,60,0.4)' : '#ff4a2a';
      for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { ctx.fillRect(x + sx * s - (sx > 0 ? 3 : 0), y + sy * s, 4, 1); ctx.fillRect(x + sx * s, y + sy * s - (sy > 0 ? 3 : 0), 1, 4); } if (n++ < 14) T.draw(ctx, Math.round(d) + ' м', x, y + s + 3, { size: 8, align: 'c', color: '#ff9a80', shadow: '#000' }); } }
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
