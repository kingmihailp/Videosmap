// ---------------------------------------------------------------- lamps for the night locations
// The moths cannot be seen in the dark: a lamp's beam shows them (play.js hides every moth that is outside the beam). Three lamps: the handheld torch and the headlamp
// (sold by the trapper, see Traps.LAMPS) and the torch gadget on the net (g_torch, sold by the enthusiast). The torch is held in the hand: the net cannot be swung while it burns.
const Lamps = (() => {
  const NET = { id: 'net', ru: 'Фонарик на сачке', I: 2.6, dist: 38, ang: 0.33, hands: false, col: '#fff2c0' };
  const def = id => id === 'net' ? NET : Traps.LP[id];

  // ---------------------------------------------------------------- 3D models (real size in metres; display() scales them up for the shop windows)
  const mat = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o || {}));
  const glow = c => new THREE.MeshBasicMaterial({ color: c });
  const cyl = (rt, rb, h, m, x = 0, y = 0, z = 0, seg = 14) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m); o.position.set(x, y, z); return o; };
  const bx = (w, h, d, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); return o; };
  const ring = (R, r, m, x = 0, y = 0, z = 0) => { const o = new THREE.Mesh(new THREE.TorusGeometry(R, r, 6, 20), m); o.position.set(x, y, z); return o; };
  // the handheld torch: a rubber-gripped barrel with a chrome head, a reflector, a lens, a side switch and a lanyard; the beam goes along -Z (the model lies along Z, lens forward)
  function torch(d) {
    const g = new THREE.Group(), body = new THREE.Group(); g.add(body);
    const rub = mat('#26302c'), ribm = mat('#161c1a'), chrome = mat('#aab2b8'), dark = mat('#2c3036'), brass = mat('#b89a44');
    body.add(cyl(0.027, 0.03, 0.13, rub, 0, 0, 0)); for (let i = 0; i < 6; i++) body.add(cyl(0.0305, 0.0305, 0.006, ribm, 0, -0.05 + i * 0.02, 0));     // grip rings
    body.add(cyl(0.032, 0.032, 0.012, chrome, 0, -0.072, 0)); body.add(cyl(0.03, 0.03, 0.008, dark, 0, -0.082, 0)); body.add(ring(0.016, 0.004, mat('#d8501c'), 0, -0.09, 0).rotateX(Math.PI / 2));   // tail cap and lanyard loop
    body.add(cyl(0.034, 0.028, 0.014, chrome, 0, 0.07, 0)); body.add(cyl(0.05, 0.034, 0.05, chrome, 0, 0.102, 0)); body.add(cyl(0.052, 0.052, 0.008, dark, 0, 0.13, 0));   // neck, flared head, bezel
    const refl = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.016, 0.038, 16, 1, true), new THREE.MeshLambertMaterial({ color: '#d8c070', side: THREE.BackSide })); refl.position.y = 0.112; body.add(refl);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.011, 8, 6), glow('#fffbe0')); bulb.position.y = 0.098; body.add(bulb);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.05, 18), glow(d && d.col || '#ffe9a0')); lens.rotation.x = -Math.PI / 2; lens.position.y = 0.1345; lens.material.transparent = true; lens.material.opacity = 0.78; body.add(lens);
    const sw = bx(0.016, 0.022, 0.008, mat('#d8501c'), 0, 0.03, 0.03); body.add(sw), body.add(bx(0.022, 0.03, 0.004, dark, 0, 0.03, 0.027));      // the side switch
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.004, 6, 4), glow('#3aff6a')); led.position.set(0, 0.052, 0.029); body.add(led);
    body.add(bx(0.012, 0.03, 0.006, brass, 0.0, 0.11, 0.0)); body.children[body.children.length - 1].visible = false;
    body.rotation.x = -Math.PI / 2;                       // lens towards -Z
    g.userData = { lens, bulb, led, sw, body, kind: 'torch', len: 0.28 }; return g;
  }
  // the headlamp: an elastic headband (a ring with a top strap), a lamp with a ribbed housing and a lens in front, a battery pack at the back and a cable
  function head(d) {
    const g = new THREE.Group(), band = mat('#23272e'), stripe = mat(d && d.col === '#d8f0ff' ? '#3a8ad0' : '#d8501c'), housing = mat('#3a3f48'), chrome = mat('#9aa2ac'), rub = mat('#1a1d22');
    const hb = ring(0.095, 0.012, band, 0, 0, 0); hb.rotation.x = Math.PI / 2; hb.scale.set(1, 1.18, 1); g.add(hb);                         // the band round the head (ellipse)
    const st = ring(0.095, 0.0035, stripe, 0, 0.004, 0); st.rotation.x = Math.PI / 2; st.scale.set(1.0, 1.18, 1.0); g.add(st);
    const top = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.006, 5, 18, Math.PI), band); top.rotation.set(0, Math.PI / 2, 0); top.scale.set(1, 0.9, 1); g.add(top);    // the strap over the crown
    const lamp = new THREE.Group(); lamp.position.set(0, 0.012, -0.112); g.add(lamp);
    lamp.add(bx(0.062, 0.042, 0.034, housing, 0, 0, 0.004)); for (let i = 0; i < 3; i++) lamp.add(bx(0.056, 0.003, 0.03, rub, 0, 0.012 - i * 0.012, 0.006));      // housing and fins
    lamp.add(bx(0.07, 0.008, 0.028, chrome, 0, 0.02, 0.004));
    const bez = cyl(0.021, 0.021, 0.008, chrome, 0, 0, -0.016, 14); bez.rotation.x = Math.PI / 2; lamp.add(bez);
    const lens = new THREE.Mesh(new THREE.CircleGeometry(0.0175, 14), glow(d && d.col || '#d8f0ff')); lens.position.set(0, 0, -0.0205); lens.rotation.y = Math.PI; lamp.add(lens);
    const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.007, 8, 6), glow('#ffffff')); bulb.position.set(0, 0, -0.012); lamp.add(bulb);
    const btn = bx(0.014, 0.006, 0.01, mat('#d8501c'), 0, 0.024, 0.004); lamp.add(btn);
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.0032, 6, 4), glow('#3aff6a')); led.position.set(0.024, 0.014, -0.0125); lamp.add(led);
    lamp.rotation.x = -0.12;                              // a little upwards, like a worn lamp
    const pack = new THREE.Group(); pack.position.set(0, 0.0, 0.112); g.add(pack); pack.add(bx(0.07, 0.04, 0.026, housing, 0, 0, 0.004)); pack.add(bx(0.05, 0.004, 0.02, chrome, 0, 0.02, 0.004)); pack.add(bx(0.012, 0.012, 0.004, mat('#3aa860'), 0.018, 0, 0.018));
    const cab = new THREE.Mesh(new THREE.TorusGeometry(0.098, 0.0022, 4, 20, Math.PI * 0.9), rub); cab.rotation.set(Math.PI / 2, 0, Math.PI * 0.55); cab.position.y = -0.01; g.add(cab);    // the cable along the band
    g.userData = { lens, bulb, led, kind: 'head', len: 0.22 }; return g;
  }
  function model(id, d) { const m = id === 'head' ? head(d || Traps.LP.head) : torch(d || Traps.LP.torch); m.traverse(o => { o.frustumCulled = false; }); return m; }
  // a model for a shop window: upright and larger (the thumbnail camera wants something about 0.5 m tall), lit up
  function display(id) {
    const m = model(id), w = new THREE.Group(); w.add(m);
    if (id === 'head') { m.rotation.set(0.12, Math.PI - 0.5, 0); m.scale.setScalar(7); const hf = new THREE.Mesh(new THREE.SphereGeometry(0.086, 14, 10), mat('#d9ccb0')); hf.scale.set(0.92, 1.18, 1.08); hf.position.set(0, -0.03, 0.0); hf.rotation.y = 0.6; m.add(hf); const nk = cyl(0.04, 0.05, 0.07, mat('#c8bba0'), 0, -0.12, 0.01, 10); m.add(nk); w.userData.lit = m.userData; w.userData.h = 0.5; }
    else { m.rotation.x = Math.PI / 2 - 0.35; m.scale.setScalar(2.6); w.userData.lit = m.userData; }       // standing, tilted a bit towards the viewer
    w.userData.thumbK = null; return w;
  }
  // lights the lens (on) or dims it (off): the lens, the bulb, the status LED
  function setLit(m, on) { const u = m.userData.lit || m.userData; if (!u || !u.lens) return; u.lens.material.color.set(on ? (u.kind === 'head' ? '#e6f6ff' : '#fff0b0') : '#3a4048'); u.lens.material.opacity = on ? 0.9 : 0.55; if (u.bulb) u.bulb.visible = on; if (u.led) u.led.material.color.set(on ? '#3aff6a' : '#7a1a1a'); }
  // the torch in the left hand of the first-person view (and a fist round the grip)
  function hold(play) {
    if (play.lampModel) { play.camera.remove(play.lampModel); play.lampModel = null; }
    if (play.lamp !== 'torch') return;
    const g = new THREE.Group(), m = model('torch'), skin = mat('#e0bc98'), sleeve = mat('#3a5a4a');
    m.scale.setScalar(0.95); g.add(m);
    const fist = new THREE.Mesh(new THREE.SphereGeometry(0.036, 8, 6), skin); fist.scale.set(1, 0.8, 1.25); fist.position.set(0, -0.012, 0.0); g.add(fist);
    const arm = cyl(0.03, 0.036, 0.4, sleeve, 0, -0.02, 0.24, 8); arm.rotation.x = Math.PI / 2 - 0.15; arm.position.set(0, -0.06, 0.22); g.add(arm);
    g.position.set(-0.34, -0.1, -0.5); g.rotation.set(0.1, -0.7, 0.1); g.userData.torch = m; g.traverse(o => { o.frustumCulled = false; if (o.isMesh && o.material.isMeshLambertMaterial) o.material.emissive = o.material.color.clone().multiplyScalar(0.5); });       // a viewmodel stays readable in the dark
    play.camera.add(g); play.lampModel = g;
  }

  // ---------------------------------------------------------------- the lamp widget of the HUD (bottom left): a picture of the lamp with its beam, the name, ON / OFF, and the keys that work with it
  const cap = (ctx, x, y, label, c) => { const w = Math.max(9, T.width(label, 8) + 5); ctx.fillStyle = '#5a5240'; ctx.fillRect(x, y + 1, w, 10); ctx.fillStyle = '#e8e0c4'; ctx.fillRect(x, y, w, 9); ctx.fillStyle = '#fffaf0'; ctx.fillRect(x + 1, y, w - 2, 1); T.draw(ctx, label, x + w / 2, y + 1, { size: 8, align: 'c', color: '#2a2418' }); return w; };
  function icon(ctx, id, on, x, y) {
    const R = (a, b, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(x + a, y + b, w, h); };
    R(0, 0, 28, 22, '#0e1614'); R(0, 0, 28, 1, '#24342e');
    if (on) { ctx.fillStyle = 'rgba(255,240,170,0.16)'; ctx.beginPath(); ctx.moveTo(x + 16, y + 11); ctx.lineTo(x + 28, y + 1); ctx.lineTo(x + 28, y + 21); ctx.closePath(); ctx.fill(); ctx.fillStyle = 'rgba(255,240,170,0.2)'; ctx.beginPath(); ctx.moveTo(x + 16, y + 11); ctx.lineTo(x + 28, y + 6); ctx.lineTo(x + 28, y + 16); ctx.closePath(); ctx.fill(); }
    const lens = on ? '#fff4c0' : '#3a4048';
    if (id === 'head') {                                             // a band round the head and the lamp on the forehead
      R(2, 5, 3, 12, '#23272e'); R(4, 4, 2, 2, '#23272e'); R(4, 16, 2, 2, '#23272e'); R(3, 6, 1, 10, '#3a8ad0');
      R(6, 7, 7, 8, '#3a3f48'); R(6, 7, 7, 1, '#9aa2ac'); R(8, 9, 1, 4, '#1a1d22'); R(10, 9, 1, 4, '#1a1d22'); R(13, 8, 2, 6, '#9aa2ac'); R(14, 9, 1, 4, lens); R(7, 15, 3, 1, '#d8501c');
    } else if (id === 'net') {                                       // a pole with a clamped lamp
      R(1, 17, 20, 1, '#8a6a3a'); R(1, 18, 20, 1, '#5a4222'); R(8, 11, 8, 6, '#2a2e36'); R(8, 11, 8, 1, '#7a7a86'); R(16, 12, 2, 4, lens); R(10, 17, 1, 1, '#c8c8d0');
    } else {                                                          // the torch: grip, ribbed barrel, flared head, lens
      R(2, 11, 11, 5, '#26302c'); R(4, 11, 1, 5, '#161c1a'); R(6, 11, 1, 5, '#161c1a'); R(8, 11, 1, 5, '#161c1a'); R(1, 12, 1, 3, '#d8501c'); R(13, 9, 3, 9, '#aab2b8'); R(13, 9, 3, 1, '#d8dde2'); R(16, 8, 2, 11, '#3a3e46'); R(17, 9, 1, 9, lens); R(7, 9, 2, 2, '#d8501c');
    }
  }
  function hud(ctx, play, c) {
    const n = owned(play).length, id = play.lamp, d = id && def(id), y = SH - 66, W = 150, H = 34;
    if (!d || !play.flash) { UIK.panel(ctx, 6, y, W, H, { fill: 'rgba(16,32,28,0.82)' }); icon(ctx, 'torch', false, 10, y + 6); ctx.fillStyle = '#c0392b'; for (let i = 0; i < 18; i++) { ctx.fillRect(12 + i, y + 8 + Math.round(i * 0.7), 2, 2); ctx.fillRect(12 + i, y + 20 - Math.round(i * 0.7), 2, 2); } T.draw(ctx, 'ФОНАРЬ: НЕТ', 44, y + 5, { size: 8, color: '#c88a7a' }); T.draw(ctx, 'продаёт торговец ловушками', 44, y + 18, { size: 8, color: c.dim }); return; }
    const on = play.flashOn && play.flash.intensity > 0.01, name = d.ru;
    UIK.panel(ctx, 6, y, W, H, { fill: 'rgba(16,32,28,0.84)', border: on ? '#8a7a3a' : undefined }); icon(ctx, id, on, 10, y + 6);
    T.draw(ctx, name, 44, y + 4, { size: 8, color: on ? '#fff2c0' : c.dim });
    const pill = on ? 'ВКЛ' : 'ВЫКЛ', pw = T.width(pill, 8) + 8, px = 6 + W - pw - 4; ctx.fillStyle = on ? '#2f7a3a' : '#5a2a2a'; ctx.fillRect(px, y + 3, pw, 10); ctx.fillStyle = on ? '#7aff8a' : '#e08a8a'; ctx.fillRect(px, y + 3, 1, 10); T.draw(ctx, pill, px + pw / 2, y + 4, { size: 8, align: 'c', color: '#fff' });
    let x = 44, ky = y + 19; x += cap(ctx, x, ky, 'F', c) + 3; T.draw(ctx, 'свет', x, ky + 1, { size: 8, color: c.text }); x += T.width('свет', 8) + 6;
    if (n > 1) { x += cap(ctx, x, ky, 'Shift+F', c) + 3; T.draw(ctx, 'смена', x, ky + 1, { size: 8, color: c.text }); }
    else if (id === 'head') { x += cap(ctx, x, ky, 'L', c) + 3; T.draw(ctx, 'снять', x, ky + 1, { size: 8, color: c.text }); }
    else if (id === 'torch' && play.lampHands) T.draw(ctx, 'в руке', x, ky + 1, { size: 8, color: '#c8a870' });
    else T.draw(ctx, `луч ${d.dist} м`, x, ky + 1, { size: 8, color: c.dim });
  }
  // the headlamp must be worn to count (L puts it on / takes it off)
  const owned = play => { const o = []; if (play && play.netStats && play.netStats.torch) o.push('net'); if (Traps.count('lp', 'head') && !Save.data.headOff) o.push('head'); if (Traps.count('lp', 'torch')) o.push('torch'); return o; };
  const choose = play => { const o = owned(play), want = Save.data.lamp; return o.includes(want) ? want : o[0] || null; };
  function build(play, id) {
    if (play.flash) { play.camera.remove(play.flash, play.flashTarget); play.flash.dispose && play.flash.dispose(); play.flash = null; }
    const d = def(id); if (!d) { play.lamp = null; play.lampHands = false; hold(play); return null; }
    play.lamp = id; play.lampI = d.I; play.lampDist = d.dist; play.lampCos = Math.cos(d.ang * 0.82); play.lampHands = d.hands && !play.world.hasFlash; play.flashOn = true;       // the ocean: the torch does not busy the hands
    play.flash = new THREE.SpotLight(d.col, d.I, d.dist + 10, d.ang, 0.5, 1.05); play.flash.position.set(d.id === 'net' ? 0.5 : 0.14, -0.1, 0); play.flashTarget = new THREE.Object3D(); play.flashTarget.position.set(0, 0, -6); play.camera.add(play.flash, play.flashTarget); play.flash.target = play.flashTarget;
    if (id === 'torch') play.flash.position.set(-0.22, -0.05, -0.62);       // from the lens of the torch in the hand
    hold(play); return d;
  }
  // at the start of a night location: the best lamp the player owns is on
  function attach(play) { const id = choose(play); play.lampInit = true; build(play, id); }
  // Shift+F: the next lamp the player owns
  function cycle(play) { const o = owned(play); if (o.length < 2) { play.toast(o.length ? 'У вас один фонарь' : 'Нет фонаря: их продаёт торговец ловушками (рынок), а приспособление «Фонарик» — энтузиаст', 3.5); return; } const i = (o.indexOf(play.lamp) + 1) % o.length; Save.data.lamp = o[i]; Save.write(); const d = build(play, o[i]); play.toast(`Фонарь: ${d.ru}${d.hands ? ' (руки заняты)' : ''}`, 2.5); Snd.sfx.flash(); }
  // L: put the headlamp on or take it off
  function toggleHead(play) {
    if (!Traps.count('lp', 'head')) { play.toast('У вас нет налобного фонаря: его продаёт торговец ловушками', 3.2); return; }
    Save.data.headOff = !Save.data.headOff; Save.write(); Snd.sfx.flash();
    play.toast(Save.data.headOff ? 'Налобный фонарь снят (L — надеть)' : 'Налобный фонарь надет (L — снять)', 2.6);
    if (play.world.night || play.world.hasFlash) { if (Save.data.headOff && Save.data.lamp === 'head') delete Save.data.lamp; else if (!Save.data.headOff) Save.data.lamp = 'head'; attach(play); }       // the lamps of the player are re-chosen at once
  }
  return { NET, def, owned, attach, cycle, build, toggleHead, hud, model, display, setLit, hold };
})();
