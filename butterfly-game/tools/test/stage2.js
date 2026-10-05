// stage butterflies in front of the camera, then screenshot. F0W.__stage(opts)
(() => new Promise(r => setTimeout(() => {
  F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0;
  setTimeout(() => {
    const p = F0W.play; p.hintT = 0; p.toasts = []; const cam = p.camera; p.player.pitch = 0.0;
    const fw = new THREE.Vector3(-Math.sin(p.player.yaw), 0, -Math.cos(p.player.yaw)), rt = new THREE.Vector3(Math.cos(p.player.yaw), 0, -Math.sin(p.player.yaw));
    p.flies.forEach((f, i) => { const d = 2.6 + (i % 3) * 1.0, o = ((i % 6) - 2.5) * 0.75; f.pos.copy(cam.position).addScaledVector(fw, d).addScaledVector(rt, o); f.pos.y = cam.position.y - 0.1 + (i % 2) * 0.55; f.tgt.copy(f.pos); f.state = 0; f.perchTarget = false; f.beh = Object.assign({}, f.beh, { speed: 0.0, wary: 0.1 }); f.yaw = p.player.yaw + Math.PI; });
    setTimeout(() => r(p.flies.length), 120);
  }, 400);
}, 1500)))()
