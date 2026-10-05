// ---------------------------------------------------------------- gameplay: player, net, butterflies, HUD
const SW = 480, SH = 270;

// shared pixel-UI helpers ------------------------------------------------------
const UIK = {
  col: { bg: '#10201c', bg2: '#183028', line: '#4a7a62', gold: '#f0c85a', text: '#e8f0dc', dim: '#9ab8a4', green: '#7ee08a', red: '#e8604a', ink: '#2a1a0c', parch: '#e4d2a0', parch2: '#c8b27a' },
  panel(ctx, x, y, w, h, o = {}) {
    ctx.fillStyle = o.shadow === false ? 'rgba(0,0,0,0)' : 'rgba(0,0,0,0.35)'; ctx.fillRect(x + 2, y + 2, w, h);
    ctx.fillStyle = o.fill || this.col.bg; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = o.border || this.col.line; ctx.fillRect(x, y, w, 1); ctx.fillRect(x, y + h - 1, w, 1); ctx.fillRect(x, y, 1, h); ctx.fillRect(x + w - 1, y, 1, h);
    if (o.inner !== false) { ctx.fillStyle = o.inner || 'rgba(255,255,255,0.05)'; ctx.fillRect(x + 1, y + 1, w - 2, 1); ctx.fillRect(x + 1, y + 1, 1, h - 2); }
  },
  btn(ctx, b, hover) {
    const c = this.col; const fill = b.disabled ? '#1a2a24' : hover ? '#2a5a46' : '#1e4034';
    this.panel(ctx, b.x, b.y, b.w, b.h, { fill, border: hover ? c.gold : c.line });
    T.draw(ctx, b.label, b.x + b.w / 2, b.y + (b.h - 8) / 2 - (b.size > 8 ? 1 : 0), { size: b.size || 8, align: 'c', color: b.disabled ? '#5a7a68' : hover ? '#fff' : c.text });
  },
  hit(b, x, y) { return x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h; },
};

// ---------------------------------------------------------------- butterfly agent
const FLY = 0, PERCH = 1, FLEE = 2, CAUGHT = 3;
const _v = new THREE.Vector3();
const SHADOW_GEO = new THREE.CircleGeometry(0.5, 10);
const SHADOW_MAT = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 });

class Fly {
  constructor(play, sp, nearPlayer) {
    this.play = play; this.sp = sp; this.beh = BEH[sp.beh]; this.mesh = Art.makeButterfly(sp); this.mesh.rotation.order = 'YXZ';
    this.span = this.mesh.userData.span; this.pos = new THREE.Vector3(); this.vel = new THREE.Vector3(); this.tgt = new THREE.Vector3();
    this.state = FLY; this.t = 0; this.ph = Math.random() * 6.28; this.yaw = Math.random() * 6.28; this.bank = 0; this.pitch = 0; this.flower = null; this.glideT = 0; this.alive = true;
    this.speedK = 0.85 + Math.random() * 0.3; this.sway = Math.random() * 6.28;
    this.place(nearPlayer);
    this.play.world.scene.add(this.mesh);
    this.shadow = new THREE.Mesh(SHADOW_GEO, SHADOW_MAT); this.shadow.rotation.x = -Math.PI / 2; this.play.world.scene.add(this.shadow);
    this.pickTarget();
  }
  place(near) {
    const p = this.play, R = p.world.R * 0.85;
    for (let i = 0; i < 40; i++) {
      let x, z;
      if (near) { const a = p.player.yaw + (Math.random() - 0.5) * 1.6; const d = 7 + Math.random() * 9; x = p.player.pos.x - Math.sin(a) * d; z = p.player.pos.z - Math.cos(a) * d; }
      else { const a = Math.random() * 6.28, d = 10 + Math.sqrt(Math.random()) * (R - 10); x = Math.cos(a) * d; z = Math.sin(a) * d; }
      if (Math.hypot(x, z) > R || p.world.inWater(x, z)) continue;
      if (!near && Math.hypot(x - p.player.pos.x, z - p.player.pos.z) < 16) continue;
      this.pos.set(x, p.world.heightAt(x, z) + lerp(this.beh.h[0], this.beh.h[1], Math.random()), z); return;
    }
    this.pos.set(5, p.world.heightAt(5, 5) + 1.2, 5);
  }
  releaseFlower() { if (this.flower) { this.flower.taken = false; this.flower = null; } }
  pickTarget(awayFrom) {
    const w = this.play.world, b = this.beh; this.releaseFlower(); this.perchTarget = false;
    const wantsBait = (this.sp.beh === 'owl' || this.sp.beh === 'bird' || this.sp.beh === 'emperor' || this.sp.beh === 'morph') && w.baits.length && Math.random() < 0.55;
    if (wantsBait) { const bt = w.baits[(Math.random() * w.baits.length) | 0]; this.tgt.set(bt.x + (Math.random() - 0.5) * 0.7, bt.y + 0.05, bt.z + (Math.random() - 0.5) * 0.7); this.perchTarget = true; return; }
    if (Math.random() < b.perch && w.flowers.length) {
      for (let i = 0; i < 30; i++) {
        const f = w.flowers[(Math.random() * w.flowers.length) | 0];
        if (f.taken) continue; const d = Math.hypot(f.x - this.pos.x, f.z - this.pos.z); if (d > 26 || d < 2) continue;
        if (awayFrom && Math.hypot(f.x - awayFrom.x, f.z - awayFrom.z) < 12) continue;
        f.taken = true; this.flower = f; this.tgt.set(f.x, f.y + 0.03, f.z); this.perchTarget = true; return;
      }
    }
    for (let i = 0; i < 20; i++) {
      const a = Math.random() * 6.28, d = 6 + Math.random() * 14; const x = this.pos.x + Math.cos(a) * d, z = this.pos.z + Math.sin(a) * d;
      if (Math.hypot(x, z) > w.R * 0.9 || w.inWater(x, z)) continue;
      if (awayFrom && Math.hypot(x - awayFrom.x, z - awayFrom.z) < 10) continue;
      this.tgt.set(x, w.heightAt(x, z) + lerp(b.h[0], b.h[1], Math.random()), z); return;
    }
    this.tgt.set(0, w.heightAt(0, 0) + 1.5, 0);
  }
  startFlee(dir) {
    this.releaseFlower(); this.state = FLEE; this.t = 2.0 + Math.random() * 1.6; this.perchTarget = false;
    const away = dir ? dir.clone() : new THREE.Vector3(Math.random() - 0.5, 0, Math.random() - 0.5); away.y = 0; if (away.lengthSq() < 0.001) away.set(1, 0, 0); away.normalize();
    away.applyAxisAngle(new THREE.Vector3(0, 1, 0), (Math.random() - 0.5) * 1.2); this.fleeDir = away; this.vel.copy(away).multiplyScalar(this.beh.speed * 1.6); this.vel.y = 0.8 + Math.random();
    if (this.play.dist(this.pos) < 14) Snd.sfx.flutter();
  }
  update(dt, t) {
    const p = this.play, b = this.beh, w = p.world, pl = p.player;
    if (this.state === CAUGHT) { // glued to the net hoop
      this.t -= dt; p.hoopWorld(_v); this.pos.lerp(_v, Math.min(1, dt * 14)); this.ph += dt * b.flap * 9; Art.setFlap(this.mesh, Math.sin(this.ph) * 0.9 + 0.35); this.mesh.position.copy(this.pos); this.updateShadow(w.heightAt(this.pos.x, this.pos.z));
      if (this.t <= 0) this.alive = false; return;
    }
    this.ph += dt * b.flap * 6.283 * (this.state === FLEE ? 1.35 : 1);
    const dx = this.pos.x - pl.pos.x, dz = this.pos.z - pl.pos.z, dist = Math.hypot(dx, dz, this.pos.y - pl.pos.y);
    // ---- senses
    const scareBase = b.wary * (0.3 + 0.7 * pl.noise);
    if (this.state === PERCH) {
      this.t -= dt;
      if (dist < scareBase * 0.62 || (p.netBusy() && dist < 2.8 && Math.random() < dt * 5)) { this.startFlee(_v.set(dx, 0, dz)); }
      else if (this.t <= 0) { this.state = FLY; this.pickTarget(); }
    } else if (this.state === FLY) {
      if (dist < 1.4 * (0.5 + pl.noise * 0.5) && pl.noise > 1) { this.startFlee(_v.set(dx, 0, dz)); }
    }
    // ---- movement
    const desired = new THREE.Vector3();
    if (this.state === PERCH) {
      this.pos.lerp(this.tgt, Math.min(1, dt * 6)); this.vel.multiplyScalar(0.8);
      const open = b.flutterPerch ? 0.35 + 0.35 * Math.abs(Math.sin(this.ph * 1.2)) : 0.75 + 0.5 * Math.sin(this.ph * 0.18 + this.sway);
      Art.setFlap(this.mesh, open); this.bank = damp(this.bank, 0, 6, dt); this.pitch = damp(this.pitch, -0.12, 5, dt);
    } else {
      let speed = b.speed * this.speedK;
      if (this.state === FLEE) {
        this.t -= dt; speed *= 1.7; desired.copy(this.fleeDir).multiplyScalar(speed); desired.y = 0.5 + Math.sin(t * 5 + this.sway) * 0.7;
        if (this.t <= 0) { this.state = FLY; this.pickTarget(pl.pos); }
      } else {
        desired.set(this.tgt.x - this.pos.x, 0, this.tgt.z - this.pos.z); const dh = desired.length(); const dy = this.tgt.y - this.pos.y;
        if (dh < 0.0001) desired.set(0, 0, 0); else desired.multiplyScalar(speed / dh * Math.min(1, 0.35 + dh * 0.5));
        // erratic wander perpendicular to path
        const wob = Math.sin(t * (2.2 + b.erratic * 3) + this.sway) * b.erratic * speed * 0.9; desired.x += -desired.z * wob / (speed + 0.001) * 0.5; desired.z += desired.x * wob / (speed + 0.001) * 0.5;
        desired.y = clamp(dy * 1.4, -1.3, 1.3) + Math.sin(this.ph * 0.5) * 0.35 * (this.glideT > 0 ? 0 : 1);
        if (dh < 0.35 && Math.abs(dy) < 0.4) {
          if (this.perchTarget) { this.state = PERCH; this.t = 3 + Math.random() * 7; this.pos.copy(this.tgt); this.vel.set(0, 0, 0); }
          else this.pickTarget();
        }
      }
      this.vel.lerp(desired, Math.min(1, dt * (this.state === FLEE ? 5 : 2.6)));
      this.pos.addScaledVector(this.vel, dt);
      // flap / glide
      if (this.glideT > 0) this.glideT -= dt; else if (Math.random() < dt * b.glide * 1.4 && this.state === FLY) this.glideT = 0.35 + Math.random() * 0.7;
      const gl = this.glideT > 0;
      const amp = gl ? 0.1 : 0.85; const off = gl ? 0.35 : 0.3;
      Art.setFlap(this.mesh, Math.sin(this.ph) * amp + off);
      if (gl) this.vel.y -= dt * 0.9;
      const sp2 = Math.hypot(this.vel.x, this.vel.z); if (sp2 > 0.15) { const ty = Math.atan2(-this.vel.x, -this.vel.z); let d = ty - this.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); this.bank = damp(this.bank, clamp(-d * 0.9, -0.7, 0.7), 5, dt); this.yaw += d * Math.min(1, dt * 6); }
      this.pitch = damp(this.pitch, clamp(this.vel.y * -0.25, -0.4, 0.4), 6, dt);
    }
    // ---- world constraints
    const gy = w.heightAt(this.pos.x, this.pos.z); if (this.state !== PERCH && this.pos.y < gy + 0.16) { this.pos.y = gy + 0.16; if (this.vel.y < 0) this.vel.y = 0.4; }
    const rr = Math.hypot(this.pos.x, this.pos.z); if (rr > w.R * 0.98) { this.pos.x *= (w.R * 0.98) / rr; this.pos.z *= (w.R * 0.98) / rr; if (this.state === FLEE) this.fleeDir.set(-this.pos.x, 0, -this.pos.z).normalize(); }
    if (this.state !== PERCH) for (const c of w.colliders) { const cx = this.pos.x - c.x, cz = this.pos.z - c.z; const d2 = cx * cx + cz * cz, mr = c.r + 0.25; if (d2 < mr * mr && this.pos.y < gy + 4 + c.r * 5) { const d = Math.sqrt(d2) || 0.01; this.pos.x += cx / d * (mr - d); this.pos.z += cz / d * (mr - d); } }
    this.mesh.position.copy(this.pos); this.mesh.rotation.set(this.pitch, this.yaw, this.bank);
    if (this.state === PERCH) this.mesh.rotation.set(-0.1, this.yaw, 0);
    this.updateShadow(gy);
  }
  updateShadow(gy) { const h = Math.max(0, this.pos.y - gy); const s = this.span * (0.75 - Math.min(0.4, h * 0.06)); this.shadow.position.set(this.pos.x, gy + 0.03, this.pos.z); this.shadow.scale.set(s, s, 1); this.shadow.material = SHADOW_MAT; this.shadow.visible = h < 7; }
  catchIt() { this.releaseFlower(); this.state = CAUGHT; this.t = 0.7; }
}

// ---------------------------------------------------------------- the play session
class Play {
  constructor(biome, seed) {
    this.biome = biome; this.world = World.build(biome, seed); this.seed = this.world.seedStr; this.scene = this.world.scene;
    this.camera = new THREE.PerspectiveCamera(70, SW / SH, 0.07, 700); this.scene.add(this.camera);
    this.t = 0; this.flies = []; this.cards = []; this.sparks = []; this.toasts = []; this.respawns = []; this.sense = false; this.caughtHere = new Set(); this.completeShown = false;
    this.player = { pos: new THREE.Vector3(0, 0, 0), yaw: this.world.spawnYaw, speedNow: 0, pitch: 0, vel: new THREE.Vector2(), noise: 0.1, bob: 0, stepD: 0, y: 0, moving: false, swingNoise: 0 };
    const sx = 0, sz = 0; this.player.pos.set(sx, this.world.heightAt(sx, sz) + 1.65, sz); this.player.y = this.player.pos.y;
    this.buildNet(); this.net = { phase: -1, cd: 0, caughtThisSwing: false, started: false };
    this.hintT = 12; this.msgT = 0; this.reticle = 0;
    this.stats = { swings: 0, catches: 0 };
    // spawn the herd
    this.pool = Play.pickPool(biome, new Rng(this.seed + '-fauna'));
    this.pool.forEach(sp => { const n = sp.rar === 1 ? 3 : sp.rar === 2 ? 2 : 1; for (let i = 0; i < n; i++) this.flies.push(new Fly(this, sp, i === 0)); });
    this.applyQuality(); this.frameAcc = 0; this.frameN = 0; this.autoChecked = false;
    Snd.startAmbient(this.world.env.amb);
    this.toast(`${biome.name} — ${biome.place}`, 4.2, true);
  }
  applyQuality() { const low = Save.data.settings.quality === 'low'; const g = this.world.grassMesh; if (!this.grassFull) this.grassFull = g.count; g.count = Math.floor(this.grassFull * (low ? 0.55 : 1)); this.world.sun.castShadow = !low; }
  dist(v) { return v.distanceTo(this.player.pos); }
  toast(text, dur = 3, big = false) { this.toasts.push({ text, t: dur, d: dur, big }); }

  // ---------------------------------------------------------------- net model
  // A real butterfly net: the pole lies IN the plane of the hoop and ends at its rim; the bag hangs off the rim.
  buildNet() {
    const g = new THREE.Group(); const wood = new THREE.MeshLambertMaterial({ color: '#9a6a38' }), dark = new THREE.MeshLambertMaterial({ color: '#2a2018' }), metal = new THREE.MeshBasicMaterial({ color: '#eef2f4' });
    const POLE = 1.2, R = 0.3, BAG = 0.9;
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.021, POLE, 6), wood); pole.rotation.x = Math.PI / 2; pole.position.z = -POLE / 2; g.add(pole);
    const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.34, 6), dark); grip.rotation.x = Math.PI / 2; grip.position.z = -0.12; g.add(grip);
    const cap = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 5), dark); cap.position.z = 0.05; g.add(cap);
    const root = new THREE.Group(); root.position.set(0, 0, -POLE - R); g.add(root);            // hoop centre: on the pole axis, one radius beyond its tip
    const roll = new THREE.Group(); root.add(roll);                                               // roll about the pole axis
    const torus = new THREE.TorusGeometry(R, 0.015, 5, 26); torus.rotateY(Math.PI / 2); roll.add(new THREE.Mesh(torus, metal));   // ring normal = +x
    const cone = new THREE.ConeGeometry(R, BAG, 16, 5, true); cone.rotateZ(-Math.PI / 2); cone.translate(BAG / 2, 0, 0);      // base on the ring, apex along +x
    const pos = cone.attributes.position; for (let i = 0; i < pos.count; i++) { const t = pos.getX(i) / BAG; pos.setY(i, pos.getY(i) - 0.16 * t * t * R * 2); }   // the bag sags a little
    cone.computeVertexNormals();
    roll.add(new THREE.Mesh(cone, new THREE.MeshBasicMaterial({ color: '#d4e8e0', transparent: true, opacity: 0.4, side: THREE.DoubleSide, depthWrite: false })));
    roll.add(new THREE.Mesh(cone, new THREE.MeshBasicMaterial({ color: '#6f9088', wireframe: true, transparent: true, opacity: 0.85 })));
    g.traverse(o => { o.frustumCulled = false; });
    this.netGroup = g; this.hoop = root; this.netRoll = roll; g.scale.setScalar(0.9);
    // idle pose: pole points up-left across the view; roll the hoop so its mouth faces the player and the bag trails away
    this.NET_IDLE = { px: 0.5, py: -0.5, pz: -0.34, rx: 0.34, ry: 0.55, rz: 0 };
    g.rotation.order = 'YXZ'; g.rotation.set(this.NET_IDLE.rx, this.NET_IDLE.ry, 0);
    g.updateMatrix(); const Rm = new THREE.Matrix4().extractRotation(g.matrix); let bestPhi = 0, bestV = -9;
    for (let k = 0; k < 72; k++) { const phi = k / 72 * 6.2832; const n = new THREE.Vector3(Math.cos(phi), Math.sin(phi), 0).applyMatrix4(Rm); const v = -n.z * 1.0 + n.x * -0.15 + n.y * -0.1; if (v > bestV) { bestV = v; bestPhi = phi; } }
    roll.rotation.z = bestPhi;
    this.camera.add(g); g.position.set(this.NET_IDLE.px, this.NET_IDLE.py, this.NET_IDLE.pz);
  }
  hoopWorld(out) { this.hoop.updateWorldMatrix(true, false); return out.setFromMatrixPosition(this.hoop.matrixWorld); }
  netBusy() { return this.net.phase >= 0 && this.net.phase < 0.6; }
  swing() {
    if (this.net.phase >= 0 || this.net.cd > 0) return; this.net.phase = 0; this.net.caughtThisSwing = false; this.stats.swings++; this.player.swingNoise = 0.7; Snd.sfx.swing();
    this.hoopWorld(_v); // butterflies near the target may bolt
    for (const f of this.flies) { if (f.state === CAUGHT) continue; const d = f.pos.distanceTo(_v); if (d < 3.6) { const p = f.state === PERCH ? 0.3 + (f.beh.wary - 3) * 0.04 : 0.18; if (Math.random() < p) f.startFlee(new THREE.Vector3(f.pos.x - this.player.pos.x, 0, f.pos.z - this.player.pos.z)); } }
  }
  updateNet(dt) {
    const n = this.net, g = this.netGroup, I = this.NET_IDLE; n.cd = Math.max(0, n.cd - dt);
    let c = { px: I.px, py: I.py, pz: I.pz, rx: I.rx, ry: I.ry, rz: I.rz };
    const mv = clamp(this.player.speedNow / 3.3, 0, 1.6);
    if (n.phase >= 0) {
      n.phase += dt / 0.62; const ph = n.phase;
      const W = { px: 0.66, py: -0.3, pz: -0.3, rx: 0.6, ry: -0.75, rz: -0.35 }, S = { px: 0.0, py: -0.52, pz: -0.34, rx: 0.02, ry: 1.0, rz: 0.35 };
      const mix = (A, B, k) => { const o = {}; for (const key in A) o[key] = lerp(A[key], B[key], k); return o; };
      if (ph < 0.2) c = mix(c, W, smooth(0, 0.2, ph)); else if (ph < 0.55) c = mix(W, S, smooth(0.2, 0.55, ph)); else c = mix(S, c, smooth(0.55, 1, ph));
      if (ph > 0.24 && ph < 0.58) this.checkCatch();
      if (ph >= 1) { n.phase = -1; n.cd = 0.18; if (!n.caughtThisSwing) Snd.sfx.miss(); }
    } else {
      // gentle idle sway + walking bob (bounded: sin of the step phase, never the raw accumulator)
      const b = Math.sin(this.player.bob) * 0.014 * mv, b2 = Math.cos(this.player.bob * 0.5) * 0.01 * mv;
      c.py += Math.sin(this.t * 1.9) * 0.004 + b; c.px += b2; c.ry += Math.sin(this.t * 0.9) * 0.01 + b2 * 0.6; c.rx += b * 0.4;
    }
    g.position.set(c.px, c.py, c.pz); g.rotation.set(c.rx, c.ry, c.rz);
  }
  checkCatch() {
    this.hoopWorld(_v);
    for (const f of this.flies) {
      if (f.state === CAUGHT) continue; const d = f.pos.distanceTo(_v); const r = 0.66 + f.span * 0.3;
      if (d < r) { this.onCatch(f); this.net.caughtThisSwing = true; }
    }
  }
  onCatch(f) {
    f.catchIt(); const sp = f.sp; const first = Save.add(sp.id, this.biome.id); this.stats.catches++; this.caughtHere.add(sp.id);
    Snd.sfx.catchSp(first, sp.rar); this.cards.push({ sp, first, t: 5.2, d: 5.2, count: Save.count(sp.id) });
    // sparkles at the hoop
    this.hoopWorld(_v); const q = _v.clone().project(this.camera); const sx = (q.x * 0.5 + 0.5) * SW, sy = (-q.y * 0.5 + 0.5) * SH;
    for (let i = 0; i < 26; i++) { const a = Math.random() * 6.28, s = 30 + Math.random() * 90; this.sparks.push({ x: sx, y: sy, vx: Math.cos(a) * s, vy: Math.sin(a) * s - 20, t: 0.6 + Math.random() * 0.5, c: first ? ['#f0c85a', '#fff4b0', '#ffffff'][i % 3] : ['#9ae0ff', '#fff', '#b8f0c0'][i % 3] }); }
    // respawn a fresh one later
    this.respawns.push({ sp, t: sp.rar === 1 ? 14 : sp.rar === 2 ? 22 : 34 });
    if (this.biome.species.every(s => this.caughtHere.has(s.id) || Save.has(s.id)) && !this.completeShown && this.biome.species.every(s => Save.has(s.id))) { this.completeShown = true; setTimeout(() => { Snd.sfx.complete(); this.toast('Все виды этого биома собраны!', 5, true); }, 1100); }
  }

  // ---------------------------------------------------------------- per-frame
  update(dt, inp) {
    this.t += dt; const P = this.player, w = this.world;
    // look
    P.yaw -= inp.dx * 0.0022; P.pitch = clamp(P.pitch - inp.dy * 0.0022, -1.45, 1.45); inp.dx = inp.dy = 0;
    const lk = (inp.keys.has('ArrowLeft') ? 1 : 0) - (inp.keys.has('ArrowRight') ? 1 : 0); P.yaw += lk * dt * 1.9;
    const lu = (inp.keys.has('ArrowUp') ? 1 : 0) - (inp.keys.has('ArrowDown') ? 1 : 0); P.pitch = clamp(P.pitch + lu * dt * 1.4, -1.45, 1.45);
    // move
    let mx = 0, mz = 0; if (inp.keys.has('KeyW')) mz -= 1; if (inp.keys.has('KeyS')) mz += 1; if (inp.keys.has('KeyA')) mx -= 1; if (inp.keys.has('KeyD')) mx += 1;
    const len = Math.hypot(mx, mz); if (len > 0) { mx /= len; mz /= len; }
    const sprint = inp.keys.has('ShiftLeft') || inp.keys.has('ShiftRight'), slow = inp.keys.has('ControlLeft') || inp.keys.has('KeyC') || inp.keys.has('ControlRight');
    const spd = sprint ? 6.2 : slow ? 1.35 : 3.3;
    const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
    const tx = (fx * -mz + rx * mx) * spd, tz = (fz * -mz + rz * mx) * spd;
    P.vel.x = damp(P.vel.x, tx, 11, dt); P.vel.y = damp(P.vel.y, tz, 11, dt);
    let nx = P.pos.x + P.vel.x * dt, nz = P.pos.z + P.vel.y * dt;
    if (w.inWater(nx, P.pos.z, 0.2)) nx = P.pos.x; if (w.inWater(P.pos.x, nz, 0.2)) nz = P.pos.z;
    for (const c of w.colliders) { const cx = nx - c.x, cz = nz - c.z, mr = c.r + 0.38, d2 = cx * cx + cz * cz; if (d2 < mr * mr) { const d = Math.sqrt(d2) || 0.01; nx += cx / d * (mr - d); nz += cz / d * (mr - d); } }
    const rr = Math.hypot(nx, nz); if (rr > w.R) { nx *= w.R / rr; nz *= w.R / rr; if (!this.edgeT || this.t - this.edgeT > 6) { this.toast('Дальше — только горы. Вернитесь к цветам!', 3); this.edgeT = this.t; } }
    const moved = Math.hypot(nx - P.pos.x, nz - P.pos.z); P.pos.x = nx; P.pos.z = nz; P.moving = moved > 0.002;
    const gy = w.heightAt(nx, nz) + 1.65; P.y = damp(P.y, gy, 14, dt);
    const speedNow = moved / Math.max(dt, 1e-4);
    P.bob += speedNow * dt * 2.2; P.stepD += moved;
    const stride = slow ? 1.1 : sprint ? 2.2 : 1.7; if (P.stepD > stride) { P.stepD = 0; Snd.sfx.step(w.inWater(nx, nz, 3) ? 'sand' : w.slopeAt(nx, nz) > 0.8 ? 'rock' : 'grass'); }
    const targetNoise = speedNow < 0.2 ? 0.1 : sprint ? 1.55 : slow ? 0.25 : 0.7;
    P.swingNoise = Math.max(0, P.swingNoise - dt * 1.2); P.noise = damp(P.noise, targetNoise + P.swingNoise, 5, dt);
    P.pos.y = P.y + Math.sin(P.bob) * 0.035 * Math.min(1, speedNow / 3);
    this.camera.position.copy(P.pos); this.camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
    this.camera.fov = damp(this.camera.fov, sprint && speedNow > 3 ? 74 : 70, 6, dt); this.camera.updateProjectionMatrix();
    // swing
    if (inp.fire) { this.swing(); inp.fire = false; }
    this.updateNet(dt);
    // butterflies
    for (const f of this.flies) f.update(dt, this.t);
    for (let i = this.flies.length - 1; i >= 0; i--) if (!this.flies[i].alive) { this.scene.remove(this.flies[i].mesh); this.scene.remove(this.flies[i].shadow); this.flies.splice(i, 1); }
    for (let i = this.respawns.length - 1; i >= 0; i--) { const r = this.respawns[i]; r.t -= dt; if (r.t <= 0) { this.flies.push(new Fly(this, r.sp, false)); this.respawns.splice(i, 1); } }
    // reticle: is something in the sweep zone?
    this.reticle = 0; const fwd = new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation);
    for (const f of this.flies) { if (f.state === CAUGHT) continue; _v.copy(f.pos).sub(this.camera.position); const d = _v.length(); if (d < 2.9 && d > 0.5 && _v.normalize().dot(fwd) > 0.93) this.reticle = Math.max(this.reticle, 1 - d / 3); }
    // world
    w.update(dt, this.t, P.pos);
    // HUD timers
    this.hintT = Math.max(0, this.hintT - dt);
    for (const c of this.cards) c.t -= dt; this.cards = this.cards.filter(c => c.t > 0);
    for (const s of this.sparks) { s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 160 * dt; s.t -= dt; } this.sparks = this.sparks.filter(s => s.t > 0);
    for (const s of this.toasts) s.t -= dt; this.toasts = this.toasts.filter(s => s.t > 0);
    this.player.speedNow = speedNow;
    // auto-detect slow machines: after 5 s of play, if average fps is poor, drop to low quality once
    if (!this.autoChecked) { this.frameAcc += dt; this.frameN++; if (this.t > 6) { this.autoChecked = true; const fps = this.frameN / this.frameAcc; if (fps < 26 && Save.data.settings.quality !== 'low') { Save.data.settings.quality = 'low'; Save.write(); this.applyQuality(); this.toast('Включено низкое качество (быстрее). Вернуть — в паузе.', 5); } } }
  }

  // ---------------------------------------------------------------- HUD (2D layer)
  draw(ctx) {
    const c = UIK.col, P = this.player, b = this.biome;
    // vignette
    const g = ctx.createRadialGradient(SW / 2, SH / 2, SH * 0.45, SW / 2, SH / 2, SW * 0.62); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(0,0,0,0.28)'); ctx.fillStyle = g; ctx.fillRect(0, 0, SW, SH);
    // biome plate
    UIK.panel(ctx, 6, 6, 158, 24, { fill: 'rgba(16,32,28,0.82)' });
    T.draw(ctx, b.name, 12, 9, { size: 8, color: c.gold }); T.draw(ctx, `${b.place} · ${b.lat.toFixed(1)}° ${b.lat >= 0 ? 'с.ш.' : 'ю.ш.'}`, 12, 19, { size: 8, color: c.dim });
    // species checklist
    const n = this.pool.length; const px = SW - 6 - n * 32; UIK.panel(ctx, px - 4, 6, n * 32 + 2, 44, { fill: 'rgba(16,32,28,0.82)' });
    ctx.imageSmoothingEnabled = false;
    this.pool.forEach((sp, i) => {
      const has = Save.has(sp.id); const here = this.caughtHere.has(sp.id); const x = px + i * 32;
      ctx.drawImage(Art.specimen(sp, !has, '#587868'), x, 9, 30, 15);
      T.draw(ctx, has ? '✓' : '?', x + 15, 25, { size: 8, align: 'c', color: has ? c.green : c.dim });
      if (here) { ctx.fillStyle = c.gold; ctx.fillRect(x + 1, 8, 28, 1); }
    });
    T.draw(ctx, `Здесь ${n} видов · в биоме: ${Save.biomeCount(b)} из ${b.species.length}`, SW - 10, 40, { size: 8, align: 'r', color: c.text });
    // noise meter
    UIK.panel(ctx, 6, SH - 26, 92, 20, { fill: 'rgba(16,32,28,0.82)' });
    T.draw(ctx, 'ШУМ', 11, SH - 22, { size: 8, color: c.dim });
    const lvl = clamp(P.noise / 1.6); for (let i = 0; i < 8; i++) { const on = (i + 0.5) / 8 <= lvl; ctx.fillStyle = on ? (i < 3 ? c.green : i < 6 ? c.gold : c.red) : '#233a30'; ctx.fillRect(40 + i * 7, SH - 21, 5, 10); }
    // controls hint
    const hint = 'ЛКМ — взмах   Ctrl — красться   Shift — бег   Tab — журнал   H — нюх   Esc — пауза';
    if (this.hintT > 0) { const a = clamp(this.hintT / 2); ctx.globalAlpha = a; UIK.panel(ctx, SW / 2 - 200, SH - 44, 400, 15, { fill: 'rgba(16,32,28,0.78)' }); T.draw(ctx, hint, SW / 2, SH - 41, { size: 8, align: 'c', color: c.text }); ctx.globalAlpha = 1; }
    // crosshair
    const cx = SW / 2, cy = SH / 2; const hot = this.reticle > 0; ctx.fillStyle = hot ? c.green : 'rgba(255,255,255,0.85)';
    if (hot) { const r = 6 - this.reticle * 2 + Math.sin(this.t * 14) * 0.5; ctx.fillRect(cx - r - 3, cy, 3, 1); ctx.fillRect(cx + r + 1, cy, 3, 1); ctx.fillRect(cx, cy - r - 3, 1, 3); ctx.fillRect(cx, cy + r + 1, 1, 3); }
    ctx.fillRect(cx, cy, 1, 1); ctx.fillRect(cx - 1, cy, 3, 1); ctx.fillRect(cx, cy - 1, 1, 3);
    // sense arrows
    if (this.sense) this.drawSense(ctx);
    // sparkles
    for (const s of this.sparks) { ctx.fillStyle = s.c; ctx.fillRect(Math.round(s.x), Math.round(s.y), 2, 2); }
    // toasts
    this.toasts.forEach((s, i) => { const a = clamp(s.t / 0.5) * clamp((s.d - s.t) / 0.3); ctx.globalAlpha = a; const w2 = T.width(s.text, s.big ? 10 : 8) + 16; const y = 52 + i * 22; UIK.panel(ctx, SW / 2 - w2 / 2, y, w2, s.big ? 20 : 16, { fill: 'rgba(16,32,28,0.9)', border: s.big ? c.gold : c.line }); T.draw(ctx, s.text, SW / 2, y + (s.big ? 5 : 4), { size: s.big ? 10 : 8, align: 'c', color: s.big ? c.gold : c.text }); ctx.globalAlpha = 1; });
    // catch cards
    this.cards.slice(-2).forEach((cd, i) => this.drawCard(ctx, cd, i));
  }
  drawSense(ctx) {
    let best = null, bd = 1e9; for (const f of this.flies) { if (f.state === CAUGHT) continue; const d = f.pos.distanceTo(this.player.pos); if (d < bd) { bd = d; best = f; } }
    if (!best) return; const q = best.pos.clone().project(this.camera); const behind = q.z > 1; let sx = (q.x * 0.5 + 0.5) * SW, sy = (-q.y * 0.5 + 0.5) * SH; if (behind) { sx = SW - sx; sy = SH - 30; }
    const m = 14; const inside = sx > m && sx < SW - m && sy > m && sy < SH - m && !behind; sx = clamp(sx, m, SW - m); sy = clamp(sy, m + 30, SH - m - 22);
    const a = Math.atan2(sy - SH / 2, sx - SW / 2); const pulse = 0.6 + 0.4 * Math.sin(this.t * 5);
    ctx.globalAlpha = pulse; ctx.fillStyle = UIK.col.gold;
    if (inside) { ctx.fillRect(sx - 7, sy - 9, 3, 1); ctx.fillRect(sx + 4, sy - 9, 3, 1); ctx.fillRect(sx - 7, sy + 9, 3, 1); ctx.fillRect(sx + 4, sy + 9, 3, 1); ctx.fillRect(sx - 8, sy - 8, 1, 3); ctx.fillRect(sx + 7, sy - 8, 1, 3); ctx.fillRect(sx - 8, sy + 6, 1, 3); ctx.fillRect(sx + 7, sy + 6, 1, 3); }
    else { ctx.save(); ctx.translate(sx, sy); ctx.rotate(a); ctx.beginPath(); ctx.moveTo(6, 0); ctx.lineTo(-4, -5); ctx.lineTo(-2, 0); ctx.lineTo(-4, 5); ctx.closePath(); ctx.fill(); ctx.restore(); }
    ctx.globalAlpha = 1; T.draw(ctx, `${Math.round(bd)} м`, sx, sy + 11, { size: 8, align: 'c', color: UIK.col.gold, shadow: '#000' });
  }
  drawCard(ctx, cd, i) {
    const c = UIK.col, w = 214, h = 62; const k = ease(clamp((cd.d - cd.t) / 0.35)) * clamp(cd.t / 0.4); const x = SW / 2 - w / 2, y = 6 + i * 66 - (1 - k) * 70 + 72;
    ctx.globalAlpha = Math.min(1, k * 1.4); UIK.panel(ctx, x, y, w, h, { fill: 'rgba(14,30,26,0.95)', border: cd.first ? c.gold : c.line });
    ctx.fillStyle = cd.first ? 'rgba(240,200,90,0.12)' : 'rgba(255,255,255,0.03)'; ctx.fillRect(x + 2, y + 2, w - 4, h - 4);
    ctx.imageSmoothingEnabled = false; ctx.drawImage(Art.specimen(cd.sp), x + 4, y + 8, 80, 40);
    T.draw(ctx, cd.first ? 'НОВЫЙ ВИД!' : `Поймано · ×${cd.count}`, x + 90, y + 5, { size: 8, color: cd.first ? c.gold : c.green });
    T.draw(ctx, cd.sp.ru, x + 90, y + 16, { size: 10, color: '#fff' });
    T.draw(ctx, cd.sp.la, x + 90, y + 29, { size: 8, color: c.dim });
    T.draw(ctx, `${cd.sp.mm[0]}–${cd.sp.mm[1]} мм · ${cd.sp.fam}`, x + 90, y + 40, { size: 8, color: c.text });
    T.draw(ctx, this.biome.place, x + 4, y + 51, { size: 8, color: c.dim });
    ctx.globalAlpha = 1;
  }
  dispose() { Snd.stopAmbient(); this.world.dispose(); }
}
// each visit meets a different local fauna: 9 of the biome's species, favouring ones you have not caught yet
Play.pickPool = (biome, rng, size = 9) => {
  const left = biome.species.map(sp => ({ sp, w: (sp.rar === 1 ? 3 : sp.rar === 2 ? 2 : 1) * (Save.has(sp.id) ? 1 : 1.8) })); const out = [];
  while (out.length < size && left.length) { let tot = left.reduce((a, b) => a + b.w, 0), r = rng.next() * tot, i = 0; for (; i < left.length - 1; i++) { r -= left[i].w; if (r <= 0) break; } out.push(left[i].sp); left.splice(i, 1); }
  return out;
};
const ease = t => 1 - Math.pow(1 - clamp(t), 3);
