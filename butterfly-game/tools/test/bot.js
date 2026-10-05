(() => new Promise(res => setTimeout(() => {
  F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0;
  const p = F0W.play; const inp = { keys: new Set(), dx: 0, dy: 0, fire: false };
  const dt = 1 / 30; const T = 100; const caught = {}, fleeEv = { n: 0 }; let swings = 0, nan = false; const stateTime = [0, 0, 0, 0];
  let lastCatches = 0, ts = [];
  for (let t = 0; t < T; t += dt) {
    inp.keys.clear(); let best = null, bd = 1e9;
    for (const f of p.flies) { if (f.state === 3) continue; const d = f.pos.distanceTo(p.player.pos); if (d < bd) { bd = d; best = f; } }
    if (best) {
      const dx = best.pos.x - p.player.pos.x, dz = best.pos.z - p.player.pos.z; const want = Math.atan2(-dx, -dz); let dy = want - p.player.yaw; dy = Math.atan2(Math.sin(dy), Math.cos(dy));
      inp.dx = -dy / 0.0022 * Math.min(1, dt * 7); const hd = Math.hypot(dx, dz); const wp = Math.atan2(best.pos.y - p.player.pos.y, hd); inp.dy = -(wp - p.player.pitch) / 0.0022 * Math.min(1, dt * 7);
      if (hd > 3.0) { inp.keys.add('KeyW'); if (hd < 10) inp.keys.add('ControlLeft'); else inp.keys.add('ShiftLeft'); }
      else if (hd > 1.6) { inp.keys.add('KeyW'); inp.keys.add('ControlLeft'); }
      const aimed = Math.abs(dy) < 0.22;
      if (hd < 2.3 && hd > 0.8 && aimed && p.net.phase < 0 && p.net.cd <= 0) { inp.fire = true; swings++; }
    }
    p.update(dt, inp); p.flies.forEach(f => { stateTime[f.state]++; if (isNaN(f.pos.x + f.pos.y + f.pos.z)) nan = true; });
    if (p.stats.catches !== lastCatches) { lastCatches = p.stats.catches; ts.push(Math.round(t)); }
  }
  res({ catches: p.stats.catches, swings: p.stats.swings, at: ts.join(','), nan, flies: p.flies.length, states: stateTime.map(v => Math.round(v / (T / dt) * 100) / 100), saved: Save.total(), pos: p.player.pos.toArray().map(v => +v.toFixed(1)) });
}, 1400)))()
