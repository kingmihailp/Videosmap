// puts butterflies in view for screenshots: F0W.play.flies placed in front of camera
(() => new Promise(r => setTimeout(() => {
  F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0;
  const p = F0W.play; p.hintT = 0; p.toasts = [];
  const cam = p.camera; const fw = new THREE.Vector3(0, 0, -1).applyEuler(cam.rotation), rt = new THREE.Vector3(1, 0, 0).applyEuler(cam.rotation);
  p.flies.forEach((f, i) => { const d = 2.4 + i * 0.55, o = (i % 2 ? 1 : -1) * (0.4 + (i % 3) * 0.5); f.pos.copy(cam.position).addScaledVector(fw, d).addScaledVector(rt, o); f.pos.y = cam.position.y - 0.3 + (i % 3) * 0.35; f.tgt.copy(f.pos); f.yaw = Math.PI * 1.1; f.state = 0; });
  setTimeout(() => r(p.flies.map(f => f.sp.id)), 150);
}, 1500)))()
