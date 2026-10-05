// teleport the player to the shore nearest the spawn and look at the water
(() => new Promise(r => setTimeout(() => {
  F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0;
  setTimeout(() => {
    const p = F0W.play, w = p.world; p.hintT = 0; p.toasts = [];
    let best = null, bd = 1e9; for (let x = -52; x <= 52; x += 1.5) for (let z = -52; z <= 52; z += 1.5) { const s = w.sdf(x, z); if (s > 2.2 && s < 3.4) { const d = Math.hypot(x, z); if (d < bd) { bd = d; best = { x, z }; } } }
    if (!best) { r({ none: true, kinds: w.waters.map(q => q.kind) }); return; }
    let tgt = null, td = 1e9; for (let x = best.x - 12; x <= best.x + 12; x += 1) for (let z = best.z - 12; z <= best.z + 12; z += 1) { if (w.sdf(x, z) < -0.5) { const d = Math.hypot(x - best.x, z - best.z); if (d < td) { td = d; tgt = { x, z }; } } }
    p.player.pos.x = best.x; p.player.pos.z = best.z; p.player.yaw = Math.atan2(-(tgt.x - best.x), -(tgt.z - best.z)); p.player.pitch = -0.28; p.player.pos.y += 0.5;
    setTimeout(() => r({ kinds: w.waters.map(q => q.kind), at: [best.x.toFixed(1), best.z.toFixed(1)], seed: p.seed, lm: w.landmarks }), 300);
  }, 600);
}, 1500)))()
