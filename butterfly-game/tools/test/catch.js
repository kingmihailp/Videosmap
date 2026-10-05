(() => new Promise(r => setTimeout(() => {
  F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0;
  setTimeout(() => {
    const p = F0W.play; const cam = p.camera; p.hintT = 0; const log = {};
    const fw = new THREE.Vector3(-Math.sin(p.player.yaw), 0, -Math.cos(p.player.yaw));
    // pick the first fly, park it where the hoop will sweep (≈1.5 m ahead, slightly left of centre, chest height)
    const f = p.flies[0]; f.beh = Object.assign({}, f.beh, { speed: 0, wary: 0.1 }); f.state = 1; f.t = 99; f.flower = null;
    f.pos.copy(cam.position).addScaledVector(fw, 1.7); f.pos.y -= 0.35; const rt = new THREE.Vector3(Math.cos(p.player.yaw), 0, -Math.sin(p.player.yaw)); f.pos.addScaledVector(rt, -0.1); f.tgt.copy(f.pos);
    log.before = Save.total(); log.sp = f.sp.id; F0W.inp.fire = true;
    const poll = [];
    const iv = setInterval(() => poll.push([+p.net.phase.toFixed(2), f.state, p.cards.length]), 100);
    setTimeout(() => { clearInterval(iv); log.after = Save.total(); log.cards = p.cards.length; log.catches = p.stats.catches; log.swings = p.stats.swings; log.poll = poll.join(' | '); r(log); }, 4200);
  }, 400);
}, 1500)))()
