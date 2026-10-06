// A real butterfly net: the pole lies IN the plane of the hoop and ends at its rim; the bag hangs off the rim. Origin = the grip, pole along -z.
function makeNetModel() {
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
    return { g, root, roll };
}

// ---------------------------------------------------------------- other players: simple pixel-style avatars with a name tag, net and flashlight
class Remotes {
  constructor(scene, opts = {}) { this.scene = scene; this.flash = !!opts.flash; this.av = {}; this.t = 0; }
  make(r) {
    const g = new THREE.Group(); let h = 0; for (const ch of r.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const jacket = new THREE.Color().setHSL((h % 360) / 360, 0.55, 0.42), skin = '#e8c8a0';
    const lm = new THREE.MeshLambertMaterial({ color: '#2a2a34' }), jm = new THREE.MeshLambertMaterial({ color: jacket });
    const up = new THREE.Group(); g.add(up);   // everything above the hips (lowers when sitting down)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.66, 8), jm); body.position.y = 1.03; up.add(body);
    const hips = new THREE.Group(); hips.position.y = 0.72; g.add(hips); const legs = [];
    for (const sx of [-0.1, 0.1]) { const th = new THREE.Group(); th.position.x = sx; hips.add(th); const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.38, 6), lm); t1.position.y = -0.19; th.add(t1); const sh = new THREE.Group(); sh.position.y = -0.38; th.add(sh); const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.36, 6), lm); t2.position.y = -0.18; sh.add(t2); const ft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.2), new THREE.MeshLambertMaterial({ color: '#1c1c22' })); ft.position.set(0, -0.37, -0.04); sh.add(ft); legs.push({ th, sh }); }
    const head = new THREE.Group(); head.position.y = 1.52; up.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshLambertMaterial({ color: skin })));
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 10), new THREE.MeshLambertMaterial({ color: '#c8b070' })); hat.position.y = 0.12; head.add(hat);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.1, 10), new THREE.MeshLambertMaterial({ color: '#b09858' })); crown.position.y = 0.18; head.add(crown);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.06), new THREE.MeshLambertMaterial({ color: '#d8a888' })); nose.position.set(0, -0.01, -0.17); head.add(nose);
    // the same net model as in the first-person view, held in the right hand (pole forward and up, bag hanging), with arms
    const nm = makeNetModel(), net = nm.g; net.scale.setScalar(0.9); net.position.set(0.33, 1.02, -0.12); up.add(net); nm.roll.rotation.z = -Math.PI / 2;
    const limb2 = (A, B, rad) => { const d = B.clone().sub(A), m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 0.85, d.length(), 6), jm); m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); up.add(m); return m; };
    limb2(new THREE.Vector3(-0.25, 1.27, 0), new THREE.Vector3(-0.3, 0.8, -0.04), 0.06); limb2(new THREE.Vector3(0.25, 1.27, 0), new THREE.Vector3(0.33, 1.02, -0.12), 0.06);
    for (const [hx, hy, hz] of [[-0.3, 0.78, -0.04], [0.33, 1.02, -0.12]]) { const hd = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), new THREE.MeshLambertMaterial({ color: skin })); hd.position.set(hx, hy, hz); up.add(hd); }
    let lens = null;                                  // the torch (only where the biome allows one) is held in the left hand; its lens glows while it is on
    if (this.flash) {
      const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.2, 6), new THREE.MeshLambertMaterial({ color: '#2a2a30' })); tb.rotation.x = Math.PI / 2; tb.position.set(-0.3, 0.78, -0.12); up.add(tb);
      lens = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.02, 6), new THREE.MeshBasicMaterial({ color: '#ffe9a0' })); lens.rotation.x = Math.PI / 2; lens.position.set(-0.3, 0.78, -0.225); lens.visible = false; up.add(lens);
    }
    const cv = document.createElement('canvas'); const w = Math.max(24, T.width(r.name, 8) + 8); cv.width = w; cv.height = 12; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = 'rgba(8,16,14,0.7)'; x.fillRect(0, 0, w, 12); T.draw(x, r.name, w / 2, 2, { size: 8, align: 'c', color: '#f0f0dc' });
    const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, fog: false, depthWrite: false })); sp.scale.set(w / 40, 12 / 40, 1); sp.position.y = 2.1; up.add(sp);
    let light = null; if (this.flash) { light = new THREE.SpotLight('#fff2d4', 2.2, 36, 0.46, 0.5, 1.05); light.position.set(-0.3, 0.8, -0.24); const tg = new THREE.Object3D(); tg.position.set(-0.3, 0.8, -6); up.add(light, tg); light.target = tg; }
    this.scene.add(g); return { g, up, hips, legs, head, net, light, lens, sitK: 0, lastPos: new THREE.Vector3() };
  }
  update(dt) {
    this.t += dt; const now = performance.now(), R = Net.remote;
    for (const id in R) {
      const r = R[id]; let a = this.av[id]; if (!a) a = this.av[id] = this.make(r);
      const alive = now - r.t < 4000 && r.t > 0; a.g.visible = alive;
      if (!alive) continue;
      const k = Math.min(1, dt * 12); a.g.position.x += (r.pos.x - a.g.position.x) * k; a.g.position.z += (r.pos.z - a.g.position.z) * k; a.g.position.y += (r.pos.y - 1.65 - a.g.position.y) * k;
      let dy = r.yaw - a.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.g.rotation.y += dy * k; a.head.rotation.x = clamp(r.pitch, -1, 1) * 0.8;
      const sw = r.swinging ? 1 : 0; a.swv = (a.swv || 0) + (sw - (a.swv || 0)) * Math.min(1, dt * 14); const v = a.swv;
      a.net.rotation.set(0.5 - v * 0.7 + Math.sin(this.t * 2 + id) * 0.015, -0.12 + v * 0.8, v * 0.3, 'YXZ');
      // legs: walking swing, or sitting down on the chair (r.sit = 0..1, sent by the player)
      const stT = clamp(r.sit || 0, 0, 1); a.sitK += (stT - a.sitK) * Math.min(1, dt * 10); const sk = a.sitK, e = sk * sk * (3 - 2 * sk);
      const walk = Math.min(1, (r.speedNow || 0) / 2.5) * (1 - e); a.ph = (a.ph || 0) + dt * (2 + (r.speedNow || 0) * 1.6) * walk;
      a.up.position.y = -0.17 * e; a.hips.position.y = 0.72 - 0.17 * e;
      a.legs.forEach((L, i) => { const sw = Math.sin(a.ph * 2 + i * Math.PI) * 0.6 * walk; L.th.rotation.x = sw + e * (Math.PI / 2 - sw); L.sh.rotation.x = -e * Math.PI / 2 + Math.max(0, -sw) * 0.7 * (1 - e); });
      a.up.rotation.x = e * 0.12;
      if (a.lens) a.lens.visible = !!r.flashOn;
      if (a.light) { a.light.visible = r.flashOn; a.light.intensity = r.flashOn ? 2.2 : 0; }
    }
    for (const id in this.av) if (!R[id]) { this.scene.remove(this.av[id].g); delete this.av[id]; }
  }
  dispose() { for (const id in this.av) this.scene.remove(this.av[id].g); this.av = {}; }
}
