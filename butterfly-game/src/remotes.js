// ---------------------------------------------------------------- other players: simple pixel-style avatars with a name tag, net and flashlight
class Remotes {
  constructor(scene, opts = {}) { this.scene = scene; this.flash = !!opts.flash; this.av = {}; this.t = 0; }
  make(r) {
    const g = new THREE.Group(); let h = 0; for (const ch of r.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const jacket = new THREE.Color().setHSL((h % 360) / 360, 0.55, 0.42), skin = '#e8c8a0';
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.25, 0.95, 8), new THREE.MeshLambertMaterial({ color: jacket })); body.position.y = 0.62; g.add(body);
    const legs = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.17, 0.2, 8), new THREE.MeshLambertMaterial({ color: '#2a2a34' })); legs.position.y = 0.1; g.add(legs);
    const head = new THREE.Group(); head.position.y = 1.52; g.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshLambertMaterial({ color: skin })));
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 10), new THREE.MeshLambertMaterial({ color: '#c8b070' })); hat.position.y = 0.12; head.add(hat);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.1, 10), new THREE.MeshLambertMaterial({ color: '#b09858' })); crown.position.y = 0.18; head.add(crown);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.06), new THREE.MeshLambertMaterial({ color: '#d8a888' })); nose.position.set(0, -0.01, -0.17); head.add(nose);
    // butterfly net on a pole, held in the right hand; swings when the player swings
    const net = new THREE.Group(); net.position.set(0.3, 1.05, -0.1); g.add(net);
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 1.3, 5), new THREE.MeshBasicMaterial({ color: '#c8843a' })); pole.rotation.x = Math.PI / 2; pole.position.z = -0.5; net.add(pole);
    const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.012, 5, 14), new THREE.MeshBasicMaterial({ color: '#f0f0f0' })); hoop.position.z = -1.2; net.add(hoop);
    const bag = new THREE.Mesh(new THREE.ConeGeometry(0.2, 0.45, 8, 1, true), new THREE.MeshBasicMaterial({ color: '#a8b8b8', side: THREE.DoubleSide, transparent: true, opacity: 0.6 })); bag.rotation.x = -Math.PI / 2; bag.position.z = -1.42; net.add(bag);
    const lamp = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.14), new THREE.MeshBasicMaterial({ color: '#ffe9a0' })); lamp.position.set(-0.28, 1.05, -0.2); g.add(lamp);
    const cv = document.createElement('canvas'); const w = Math.max(24, T.width(r.name, 8) + 8); cv.width = w; cv.height = 12; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = 'rgba(8,16,14,0.7)'; x.fillRect(0, 0, w, 12); T.draw(x, r.name, w / 2, 2, { size: 8, align: 'c', color: '#f0f0dc' });
    const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, fog: false, depthWrite: false })); sp.scale.set(w / 40, 12 / 40, 1); sp.position.y = 2.1; g.add(sp);
    let light = null; if (this.flash) { light = new THREE.SpotLight('#fff2d4', 2.2, 36, 0.46, 0.5, 1.05); light.position.set(-0.28, 1.05, -0.25); const tg = new THREE.Object3D(); tg.position.set(-0.28, 1.0, -6); g.add(light, tg); light.target = tg; }
    this.scene.add(g); return { g, head, net, light, lastPos: new THREE.Vector3() };
  }
  update(dt) {
    this.t += dt; const now = performance.now(), R = Net.remote;
    for (const id in R) {
      const r = R[id]; let a = this.av[id]; if (!a) a = this.av[id] = this.make(r);
      const alive = now - r.t < 4000 && r.t > 0; a.g.visible = alive;
      if (!alive) continue;
      const k = Math.min(1, dt * 12); a.g.position.x += (r.pos.x - a.g.position.x) * k; a.g.position.z += (r.pos.z - a.g.position.z) * k; a.g.position.y += (r.pos.y - 1.65 - a.g.position.y) * k;
      let dy = r.yaw - a.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.g.rotation.y += dy * k; a.head.rotation.x = clamp(r.pitch, -1, 1) * 0.8;
      const sw = r.swinging ? 1 : 0; a.swv = (a.swv || 0) + (sw - (a.swv || 0)) * Math.min(1, dt * 14); a.net.rotation.x = -0.55 + a.swv * 0.9 + Math.sin(this.t * 2 + id) * 0.02; a.net.rotation.z = -a.swv * 0.35;
      if (a.light) { a.light.visible = r.flashOn; a.light.intensity = r.flashOn ? 2.2 : 0; }
    }
    for (const id in this.av) if (!R[id]) { this.scene.remove(this.av[id].g); delete this.av[id]; }
  }
  dispose() { for (const id in this.av) this.scene.remove(this.av[id].g); this.av = {}; }
}
