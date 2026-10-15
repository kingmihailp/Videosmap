// ---------------------------------------------------------------- lamps for the night locations
// The moths cannot be seen in the dark: a lamp's beam shows them (play.js hides every moth that is outside the beam). Three lamps: the handheld torch and the headlamp
// (sold by the trapper, see Traps.LAMPS) and the torch gadget on the net (g_torch, sold by the enthusiast). The torch is held in the hand: the net cannot be swung while it burns.
const Lamps = (() => {
  const NET = { id: 'net', ru: 'Фонарик на сачке', I: 2.6, dist: 38, ang: 0.33, hands: false, col: '#fff2c0' };
  const def = id => id === 'net' ? NET : Traps.LP[id];
  // the headlamp must be worn to count (L puts it on / takes it off)
  const owned = play => { const o = []; if (play && play.netStats && play.netStats.torch) o.push('net'); if (Traps.count('lp', 'head') && !Save.data.headOff) o.push('head'); if (Traps.count('lp', 'torch')) o.push('torch'); return o; };
  const choose = play => { const o = owned(play), want = Save.data.lamp; return o.includes(want) ? want : o[0] || null; };
  function build(play, id) {
    if (play.flash) { play.camera.remove(play.flash, play.flashTarget); play.flash.dispose && play.flash.dispose(); play.flash = null; }
    const d = def(id); if (!d) { play.lamp = null; play.lampHands = false; return null; }
    play.lamp = id; play.lampI = d.I; play.lampDist = d.dist; play.lampCos = Math.cos(d.ang * 0.82); play.lampHands = d.hands && !play.world.hasFlash; play.flashOn = true;       // the ocean: the torch does not busy the hands
    play.flash = new THREE.SpotLight(d.col, d.I, d.dist + 10, d.ang, 0.5, 1.05); play.flash.position.set(d.id === 'net' ? 0.5 : 0.14, -0.1, 0); play.flashTarget = new THREE.Object3D(); play.flashTarget.position.set(0, 0, -6); play.camera.add(play.flash, play.flashTarget); play.flash.target = play.flashTarget;
    return d;
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
  return { NET, def, owned, attach, cycle, build, toggleHead };
})();
