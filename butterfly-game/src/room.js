// ---------------------------------------------------------------- a placeholder room behind a door in the world (the abandoned chalet of the Alps): an empty, dim log room.
// Same interface as the Cabinet / Market, so the main loop treats it as App.cab.
const StubRoom = (() => {
  const c = UIK.col, RW = 6.4, RD = 5.2, RH = 3.0, HX = RW / 2, HZ = RD / 2;
  function ctex(w, h, draw, rx, ry) { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; draw(x, w, h); const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } return t; }
  const lam = (col, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: col }, o));
  const logsTex = () => ctex(64, 64, (x, w, h) => { const r = new Rng(31); for (let j = 0; j < 8; j++) { const g = r.int(-10, 10); x.fillStyle = `rgb(${96 + g},${84 + g},${70 + g})`; x.fillRect(0, j * 8, w, 7); x.fillStyle = 'rgba(0,0,0,0.35)'; x.fillRect(0, j * 8 + 7, w, 1); x.fillStyle = 'rgba(255,255,255,0.06)'; x.fillRect(0, j * 8, w, 1); for (let k = 0; k < 6; k++) { x.fillStyle = 'rgba(30,22,16,0.3)'; x.fillRect(r.int(0, 56), j * 8 + r.int(1, 5), r.int(3, 10), 1); } } });
  const planksTex = () => ctex(64, 64, (x, w, h) => { const r = new Rng(77); for (let i = 0; i < 8; i++) { const g = r.int(-12, 12); x.fillStyle = `rgb(${74 + g},${60 + g},${46 + g})`; x.fillRect(i * 8, 0, 7, h); x.fillStyle = 'rgba(0,0,0,0.4)'; x.fillRect(i * 8 + 7, 0, 1, h); for (let k = 0; k < 5; k++) { x.fillStyle = 'rgba(20,14,8,0.35)'; x.fillRect(i * 8 + r.int(1, 5), r.int(0, 56), 1, r.int(4, 14)); } } for (let j = 0; j < 3; j++) { x.fillStyle = 'rgba(0,0,0,0.5)'; x.fillRect(0, r.int(8, 56), w, 1); } });

  class Room {
    constructor(hooks, id) {
      this.hooks = hooks; this.id = id; this.ov = null; this.t = 0; this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#050403'); this.scene.fog = new THREE.Fog('#050403', 6, 18);
      this.camera = new THREE.PerspectiveCamera(70, SW / SH, 0.07, 60); this.scene.add(this.camera);
      this.player = { pos: new THREE.Vector3(0, 0, HZ - 0.9), yaw: 0, pitch: -0.02, bob: 0, vel: new THREE.Vector2(), stepD: 0, moving: false };
      this.toastT = 0; this.toastText = ''; this.prompt = null; this.stations = [{ id: 'exit', x: 0, z: HZ - 0.4, r: 1.7, label: () => 'E — выйти на улицу' }];
      this.build(); Snd.startAmbient('stub'); this.toast('Внутри тихо. Слишком тихо…', 4);
      this.camera.position.set(this.player.pos.x, 1.62, this.player.pos.z);
    }
    toast(s, d = 2.5) { this.toastText = s; this.toastT = d; }
    build() {
      const S = this.scene, logs = logsTex(), planks = planksTex();
      this.hemi = new THREE.HemisphereLight('#7a8a9a', '#3a2c20', 1.25); S.add(this.hemi);
      const fl = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD).rotateX(-Math.PI / 2), lam('#ffffff', { map: planks })); planks.repeat.set(RW / 2, RD / 2); fl.receiveShadow = true; S.add(fl);
      const ce = new THREE.Mesh(new THREE.PlaneGeometry(RW, RD).rotateX(Math.PI / 2), lam('#3a3028')); ce.position.y = RH; S.add(ce);
      const wallMat = (w, h) => { const t = logs.clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(w / 2, h / 2); return lam('#b8b0a8', { map: t }); };
      const wall = (w, x, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, RH), wallMat(w, RH)); m.position.set(x, RH / 2, z); m.rotation.y = ry; S.add(m); return m; };
      wall(RW, 0, -HZ, 0); wall(RW, 0, HZ, Math.PI); wall(RD, -HX, 0, Math.PI / 2); wall(RD, HX, 0, -Math.PI / 2);
      const box = (w, h, d, x, y, z, col) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), lam(col)); m.position.set(x, y, z); S.add(m); return m; };
      for (let x = -HX + 0.6; x < HX; x += 1.4) box(0.2, 0.22, RD, x, RH - 0.11, 0, '#2a2218');                         // ceiling beams
      box(RW, 0.14, 0.14, 0, 0.07, -HZ + 0.07, '#241c14'); box(RW, 0.14, 0.14, 0, 0.07, HZ - 0.07, '#241c14'); box(0.14, 0.14, RD, -HX + 0.07, 0.07, 0, '#241c14'); box(0.14, 0.14, RD, HX - 0.07, 0.07, 0, '#241c14');   // skirting
      // the exit door (south wall), slightly ajar light from outside
      box(1.3, 2.3, 0.1, 0, 1.15, HZ - 0.05, '#2a1e14'); box(1.1, 2.1, 0.08, 0, 1.05, HZ - 0.1, '#4a3a2e'); box(0.12, 0.12, 0.12, 0.42, 1.05, HZ - 0.18, '#8a7a50');
      const spill = new THREE.PointLight('#c8d4e0', 0.7, 5, 1.8); spill.position.set(0, 1.6, HZ - 0.6); S.add(spill); this.spill = spill;
      // a boarded window on the west wall: thin slits of cold light
      const wx = -HX + 0.05; for (const [y, h] of [[1.3, 0.1], [1.55, 0.1], [1.8, 0.1], [2.05, 0.1]]) { const slit = new THREE.Mesh(new THREE.PlaneGeometry(1.0, h), new THREE.MeshBasicMaterial({ color: '#b8c8d8' })); slit.position.set(wx + 0.01, y, -0.6); slit.rotation.y = Math.PI / 2; S.add(slit); }
      for (const [y, h] of [[1.43, 0.16], [1.68, 0.16], [1.93, 0.16]]) box(0.1, h, 1.2, wx, y, -0.6, '#1a140e');
      const wl = new THREE.SpotLight('#9ab0c8', 1.6, 9, 0.7, 0.8, 1.4); wl.position.set(-HX + 0.3, 1.7, -0.6); this.wlTarget = new THREE.Object3D(); this.wlTarget.position.set(2.2, 0.0, -0.4); S.add(wl, this.wlTarget); wl.target = this.wlTarget; this.wl = wl;
      // dust in the light
      const n = 70, pos = new Float32Array(n * 3); this.dust0 = []; for (let i = 0; i < n; i++) { const a = [Math.random() * 4 - 1.8, Math.random() * 2.2 + 0.3, Math.random() * 3 - 2]; this.dust0.push(a); pos.set(a, i * 3); }
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); this.dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#c8d0d8', size: 0.025, transparent: true, opacity: 0.55, depthWrite: false })); S.add(this.dust);
    }
    update(dt, inp) {
      this.t += dt; const P = this.player;
      P.yaw -= inp.dx * 0.0022; P.pitch = clamp(P.pitch - inp.dy * 0.0022, -1.3, 1.3); inp.dx = inp.dy = 0;
      P.yaw += ((inp.keys.has('ArrowLeft') ? 1 : 0) - (inp.keys.has('ArrowRight') ? 1 : 0)) * dt * 1.9; P.pitch = clamp(P.pitch + ((inp.keys.has('ArrowUp') ? 1 : 0) - (inp.keys.has('ArrowDown') ? 1 : 0)) * dt * 1.4, -1.3, 1.3);
      let mx = 0, mz = 0; if (inp.keys.has('KeyW')) mz -= 1; if (inp.keys.has('KeyS')) mz += 1; if (inp.keys.has('KeyA')) mx -= 1; if (inp.keys.has('KeyD')) mx += 1;
      const len = Math.hypot(mx, mz); if (len > 0) { mx /= len; mz /= len; }
      const spd = inp.keys.has('ShiftLeft') ? 3.4 : 1.9; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
      P.vel.x = damp(P.vel.x, (fx * -mz + rx * mx) * spd, 12, dt); P.vel.y = damp(P.vel.y, (fz * -mz + rz * mx) * spd, 12, dt);
      const nx = clamp(P.pos.x + P.vel.x * dt, -HX + 0.45, HX - 0.45), nz = clamp(P.pos.z + P.vel.y * dt, -HZ + 0.45, HZ - 0.45);
      const moved = Math.hypot(nx - P.pos.x, nz - P.pos.z); P.pos.x = nx; P.pos.z = nz; P.moving = moved > 0.002; P.bob += moved * 2.0; P.stepD += moved;
      if (P.stepD > 0.8) { P.stepD = 0; Snd.sfx.step('wood'); }
      this.camera.position.set(P.pos.x, 1.62 + Math.sin(P.bob) * 0.02, P.pos.z); this.camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
      this.prompt = this.nearest(); this.toastT = Math.max(0, this.toastT - dt); this.animate(dt);
    }
    nearest() { const P = this.player; for (const s of this.stations) if (Math.hypot(s.x - P.pos.x, s.z - P.pos.z) < s.r) return s; return null; }
    animate(dt) {
      const t = this.t; if (this.wl) this.wl.intensity = 1.5 + Math.sin(t * 0.7) * 0.15 + (Math.sin(t * 9.1) > 0.97 ? -0.4 : 0); if (this.spill) this.spill.intensity = 0.65 + Math.sin(t * 0.5) * 0.08;
      if (this.dust) { const p = this.dust.geometry.attributes.position; for (let i = 0; i < this.dust0.length; i++) { const a = this.dust0[i]; p.setXYZ(i, a[0] + Math.sin(t * 0.2 + i) * 0.12, a[1] + Math.sin(t * 0.13 + i * 1.7) * 0.1, a[2] + Math.cos(t * 0.17 + i) * 0.12); } p.needsUpdate = true; }
    }
    open(name) { this.ov = name; this.hooks.unlock(); }
    close() { this.ov = null; this.hooks.lock(); }
    interact() { const s = this.prompt; if (!s) return; if (s.id === 'exit') { Snd.sfx.door(); this.hooks.exitRoom(); } }
    key(e) {
      const ov = this.ov;
      if (!ov) { if (e.code === 'KeyE') this.interact(); else if (e.code === 'KeyP' || e.code === 'Escape') { this.ov = 'pause'; this.hooks.unlock(); } return; }
      if (ov === 'pause' && e.code === 'Escape') { this.ov = null; this.hooks.lock(); }
    }
    pauseButtons() { const s = Save.data.settings, x = SW / 2 - 90; return [{ id: 'resume', label: 'Продолжить', x, y: 84, w: 180, h: 20, size: 10 }, { id: 'sound', label: s.sound ? 'Звук: вкл' : 'Звук: выкл', x, y: 112, w: 88, h: 16 }, { id: 'music', label: s.music ? 'Музыка: вкл' : 'Музыка: выкл', x: x + 92, y: 112, w: 88, h: 16 }, { id: 'exit', label: 'Выйти на улицу', x, y: 136, w: 180, h: 16 }, { id: 'title', label: 'Главное меню', x, y: 158, w: 180, h: 16 }]; }
    click(x, y) {
      if (this.ov !== 'pause') return; const b = this.pauseButtons().find(b => UIK.hit(b, x, y)); if (!b) return; Snd.sfx.click();
      if (b.id === 'resume') { this.ov = null; this.hooks.lock(); } else if (b.id === 'sound') this.hooks.toggle('sound'); else if (b.id === 'music') this.hooks.toggle('music'); else if (b.id === 'exit') this.hooks.exitRoom(); else if (b.id === 'title') this.hooks.title();
    }
    wheel() {}
    draw(ctx, t, m) {
      UIK.panel(ctx, 6, 6, 150, 20, { fill: 'rgba(16,28,24,0.82)', border: c.line }); T.draw(ctx, 'Заброшенный дом', 12, 12, { size: 8, color: c.gold });
      ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fillRect(SW / 2 - 1, SH / 2 - 1, 2, 2);
      if (this.prompt && !this.ov) { const s = this.prompt.label(), w = T.width(s, 8) + 20; UIK.panel(ctx, SW / 2 - w / 2, SH - 54, w, 18, { fill: 'rgba(16,28,24,0.9)', border: c.gold }); T.draw(ctx, s, SW / 2, SH - 49, { size: 8, align: 'c', color: '#fff' }); }
      if (this.toastT > 0) { ctx.globalAlpha = Math.min(1, this.toastT); T.draw(ctx, this.toastText, SW / 2, 62, { size: 8, align: 'c', color: '#c8d0d8', shadow: '#000' }); ctx.globalAlpha = 1; }
      T.draw(ctx, 'WASD — ходить · мышь — осмотр · E — действие · Esc — пауза', 8, SH - 12, { size: 8, color: 'rgba(230,240,220,0.5)', shadow: '#000' });
      if (this.ov === 'pause') { ctx.fillStyle = 'rgba(4,8,8,0.7)'; ctx.fillRect(0, 0, SW, SH); UIK.panel(ctx, SW / 2 - 106, 44, 212, 140, { fill: 'rgba(16,32,28,0.96)', border: c.gold }); T.draw(ctx, 'Пауза', SW / 2, 54, { size: 14, align: 'c', color: c.gold }); this.pauseButtons().forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y))); }
    }
    dispose() { Snd.stopAmbient(); this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const mt = o.material; if (mt) (Array.isArray(mt) ? mt : [mt]).forEach(x => { if (x.map) x.map.dispose(); x.dispose(); }); }); }
  }
  return Room;
})();
