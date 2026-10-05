// walk forward for a while, then report net position (it must stay bounded) 
(() => new Promise(r => setTimeout(() => {
  F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0;
  const p = F0W.play; p.hintT = 0; p.toasts = [];
  setTimeout(() => {
    const out = []; F0W.inp.keys.add('KeyW');
    const iv = setInterval(() => { out.push(p.netGroup.position.toArray().map(v => +v.toFixed(2)).join(',')); }, 400);
    setTimeout(() => { clearInterval(iv); out.push('steps:' + p.player.bob.toFixed(0)); r(out); }, 5000);
  }, 400);
}, 1500)))()
