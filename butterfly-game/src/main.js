// ---------------------------------------------------------------- main: renderer, pixel post-process, input, state machine
(() => {
  const gl = document.getElementById('gl'), ui = document.getElementById('ui'), stage = document.getElementById('stage');
  gl.width = SW; gl.height = SH; let uiK = 2; ui.width = SW * uiK; ui.height = SH * uiK;
  const ctx = ui.getContext('2d');
  const params = new URLSearchParams(location.hash.replace('#', '?'));
  Save.load(); Keys.rebuild(); revealOcean();

  // ---------------- renderer + post (palette quantisation + ordered dither + depth outlines)
  const renderer = new THREE.WebGLRenderer({ canvas: gl, antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: params.has('debug') });
  renderer.setPixelRatio(1); renderer.setSize(SW, SH, false); renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFShadowMap;
  const rt = new THREE.WebGLRenderTarget(SW, SH, { minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter, depthTexture: new THREE.DepthTexture(SW, SH, THREE.UnsignedIntType) });
  const postScene = new THREE.Scene(), postCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
  const postMat = new THREE.ShaderMaterial({
    depthTest: false, depthWrite: false,
    uniforms: { tColor: { value: rt.texture }, tDepth: { value: rt.depthTexture }, res: { value: new THREE.Vector2(SW, SH) }, near: { value: 0.07 }, far: { value: 700 }, levels: { value: 20 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }',
    fragmentShader: `uniform sampler2D tColor; uniform sampler2D tDepth; uniform vec2 res; uniform float near; uniform float far; uniform float levels; varying vec2 vUv;
      float lin(float d){ float z = d * 2.0 - 1.0; return 2.0 * near * far / (far + near - z * (far - near)); }
      float b2(vec2 a){ a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
      float b4(vec2 a){ return b2(0.5 * a) * 0.25 + b2(a); }
      void main(){
        vec3 c = texture2D(tColor, vUv).rgb;
        float d0 = lin(texture2D(tDepth, vUv).x); vec2 px = 1.0 / res; float edge = 0.0;
        if (d0 < 380.0) {
          vec2 o[4]; o[0] = vec2(px.x, 0.0); o[1] = vec2(-px.x, 0.0); o[2] = vec2(0.0, px.y); o[3] = vec2(0.0, -px.y);
          for (int i = 0; i < 4; i++) { float dn = lin(texture2D(tDepth, vUv + o[i]).x); if (dn > d0 * 1.07 + 0.12) edge = 1.0; }
        }
        c *= 1.0 - edge * 0.42;
        float l = dot(c, vec3(0.3, 0.59, 0.11)); c = mix(vec3(l), c, 1.1); c = pow(max(c, vec3(0.0)), vec3(0.96));
        c = floor(c * levels + b4(gl_FragCoord.xy)) / levels;
        gl_FragColor = vec4(c, 1.0);
      }`,
  });
  postScene.add(new THREE.Mesh(new THREE.PlaneGeometry(2, 2), postMat));

  // ---------------- app state
  const App = window.F0W = { screen: 'loading', overlay: null, play: null, time: 0, fade: 1, fadeTarget: 0, fadeCb: null, locked: false, noLock: params.has('nolock'), journalFrom: 'title', loadText: 'Загрузка…', ready: false };
  const inp = { keys: new Set(), dx: 0, dy: 0, fire: false }; App.inp = inp;
  const mouse = { x: -100, y: -100 };
  const S = Screens;
  function toNative(e) { const r = ui.getBoundingClientRect(); mouse.x = (e.clientX - r.left) / r.width * SW; mouse.y = (e.clientY - r.top) / r.height * SH; }
  function fit() { const iw = innerWidth, ih = innerHeight; let s = Math.min(iw / SW, ih / SH); const si = Math.floor(s); if (si >= 2 && si / s > 0.8) s = si; stage.style.width = Math.floor(SW * s) + 'px'; stage.style.height = Math.floor(SH * s) + 'px'; const k = clamp(Math.ceil(s * (window.devicePixelRatio || 1) - 0.01), 2, 5); if (k !== uiK) { uiK = k; ui.width = SW * k; ui.height = SH * k; } }
  addEventListener('resize', fit); fit();
  function go(fn) { App.fadeTarget = 1; App.fadeCb = fn; }
  // Esc releases the pointer lock and the browser refuses an immediate re-lock; so closing the menu with Esc keeps retrying for a couple of seconds
  // (the game runs meanwhile) and never falls back into the pause menu by itself
  function lock() { if (App.noLock) { App.locked = true; return; } App.lockWant = performance.now(); tryLock(0); }
  function tryLock(n) {
    if (App.locked) { App.lockWant = 0; return; }
    try { const p = ui.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) {}
    clearTimeout(App.lockTimer); App.lockTimer = setTimeout(() => { if (App.lockWant && !App.locked) { if (n < 10) tryLock(n + 1); else { App.lockWant = 0; App.needClick = true; App.noReopen = performance.now() + 1500; } } }, 300);
  }
  function unlock() { App.lockWant = 0; if (App.noLock) { App.locked = false; return; } try { document.exitPointerLock(); } catch (e) {} }

  function leave() { if (App.play) { App.play.dispose(); App.play = null; } if (App.cab) { App.cab.dispose(); App.cab = null; } App.overlay = null; Snd.stopAmbient(); if (Net.on) Net.leave(); }
  App.toTitle = () => { leave(); App.screen = 'title'; };
  App.toMap = () => { leave(); App.screen = 'map'; };
  const cabHooks = { lock, unlock, toggle: k => toggleSetting(k), cabinet: () => go(() => App.toCabinet()), market: () => go(() => App.toMarket()), exit: () => go(() => App.toMap()), map: () => go(() => App.toMap()), title: () => go(() => App.toTitle()) };
  // multiplayer: ask the server for the shared location first, then build it with the server's seed and role (host simulates the butterflies)
  const netFail = e => { leave(); App.screen = 'title'; App.fade = 0; App.fadeTarget = 0; Screens.mp.msg = 'Сервер: ' + (e && e.message || 'ошибка'); };
  const enterCabinet = () => {
    App.cab = new Cabinet(cabHooks); App.screen = 'cabinet'; App.fade = 1; App.fadeTarget = 0;
    if (!Save.data.seenCab) { App.cab.ov = 'help'; Save.data.seenCab = true; Save.write(); } else lock();
  };
  App.toCabinet = () => {
    leave(); App.screen = 'loading'; App.loadText = 'Входим в кабинет энтомолога…';
    if (Net.on) Net.join('cabinet').then(() => setTimeout(enterCabinet, 40)).catch(netFail); else setTimeout(enterCabinet, 60);
  };
  const enterMarket = () => { App.cab = new Market(cabHooks); App.screen = 'cabinet'; App.fade = 1; App.fadeTarget = 0; if (!Save.data.seenMarket) { App.cab.ov = 'help'; Save.data.seenMarket = true; Save.write(); } else lock(); };
  App.toMarket = () => {
    leave(); App.screen = 'loading'; App.loadText = 'Идём на рынок насекомых…';
    if (Net.on) Net.join('market').then(() => setTimeout(enterMarket, 40)).catch(netFail); else setTimeout(enterMarket, 60);
  };
  // a room behind a door in the world (currently an empty placeholder room); leaving brings you back to the same door
  const roomHooks = Object.assign({}, cabHooks, { exitRoom: () => go(() => { const r = App.roomReturn; if (r) App.start(r.biome, r.seed, r.at); else App.toMap(); }) });
  App.enterRoom = (id, ret) => { App.roomReturn = ret; go(() => { leave(); App.screen = 'loading'; App.loadText = '…'; setTimeout(() => { App.cab = new StubRoom(roomHooks, id); App.screen = 'cabinet'; App.fade = 1; App.fadeTarget = 0; lock(); }, 60); }); };
  App.start = (biomeId, seed, at) => {
    leave(); App.screen = 'loading'; App.loadText = 'Отправляемся: ' + (BIOME_BY_ID[biomeId].secret ? '???' : BIOME_BY_ID[biomeId].place); App.overlay = null;
    const make = (sd, mp) => {
      App.play = new Play(BIOME_BY_ID[biomeId], sd, mp, at); App.screen = 'play'; App.fade = 1; App.fadeTarget = 0;
      if (!Save.data.seenHelp) { App.overlay = 'help'; Save.data.seenHelp = true; Save.write(); } else { App.overlay = null; lock(); }
      journalIndex();
    };
    if (Net.on) Net.join(biomeId).then(info => setTimeout(() => make(info.seed, { host: info.host === Net.id, flies: info.flies, mod: info.mod }), 40)).catch(netFail);
    else setTimeout(() => make(seed || params.get('seed') || undefined), 60);
  };
  Net.hooks.reseed = m => go(() => App.start(m.loc));
  Net.hooks.closed = () => { if (App.screen === 'play' || App.screen === 'cabinet' || App.screen === 'loading') { if (App.play) { App.play.dispose(); App.play = null; } if (App.cab) { App.cab.dispose(); App.cab = null; } Snd.stopAmbient(); App.overlay = null; App.screen = 'title'; } Screens.mp.msg = 'Соединение с сервером потеряно'; };
  function mpConnect() {
    const M = Screens.mp, addr = M.fields[0].val.trim(), name = M.fields[1].val.trim() || 'Гость'; if (!addr) { M.msg = 'Введите адрес сервера'; return; }
    M.busy = true; M.msg = 'Подключение…';
    Net.connect(addr, name).then(() => { M.busy = false; M.msg = ''; try { localStorage.setItem('f0w_mp', JSON.stringify({ addr, name })); } catch (e) {} Snd.sfx.complete(); }).catch(e => { M.busy = false; M.msg = e.message; });
  }
  function mpAct(id) { if (id === 'connect') mpConnect(); else if (id === 'disc') { Net.disconnect(); Screens.mp.msg = ''; } else if (id === 'info') { Snd.sfx.click(); Screens.mp.info = !Screens.mp.info; } else if (id === 'back') { Snd.sfx.click(); App.screen = 'title'; } }
  function journalIndex() { if (App.play) { S.journal.tab = BIOMES.indexOf(App.play.biome); S.journal.sel = 0; } }
  function openJournal(from) { App.journalFrom = from; if (from === 'play') { unlock(); App.overlay = 'journal'; journalIndex(); } else { App.screen = 'journal'; } Snd.sfx.page(); }
  function closeJournal() { if (App.journalFrom === 'play') { App.overlay = 'pause'; } else App.screen = App.journalFrom; Snd.sfx.page(); }
  function resume() { App.overlay = null; lock(); }
  function toggleSetting(k) { Save.data.settings[k] = !Save.data.settings[k]; Save.write(); Snd.applySettings(); Snd.sfx.click(); }

  // ---------------- settings modal (opened from the pause menus) and key bindings
  App.modal = null;
  function openSettings() { App.modal = 'settings'; }
  cabHooks.settings = openSettings;
  function modalKey(e) {
    e.preventDefault();
    if (App.modal === 'keys') { if (S.keys.key(e)) { App.modal = 'settings'; Save.write(); } return; }
    if (e.code === 'Escape' && !e.repeat) { App.modal = null; Snd.sfx.click(); }
  }
  function modalClick(x, y) {
    if (App.modal === 'keys') { if (S.keys.click(x, y)) App.modal = 'settings'; return; }
    const id = S.settings.click(x, y); if (!id) return; Snd.sfx.click();
    if (id === 'sound') toggleSetting('sound'); else if (id === 'music') toggleSetting('music');
    else if (id === 'quality' && App.play) { Save.data.settings.quality = Save.data.settings.quality === 'low' ? 'high' : 'low'; Save.write(); App.play.applyQuality(); }
    else if (id === 'keys') { S.keys.wait = -1; S.keys.msg = ''; App.modal = 'keys'; }
    else if (id === 'card' && App.play) { App.modal = null; App.overlay = 'cardpos'; }
    else if (id === 'back') App.modal = null;
  }
  // ---------------- input
  document.addEventListener('mousemove', e => { if (App.locked && !App.noLock) { inp.dx += e.movementX; inp.dy += e.movementY; } toNative(e); if (App.noLock && App.screen === 'play' && !App.overlay) { /* no-lock mode: mouse-look disabled */ } });
  // The Esc that closes the pause menu is also the key that makes the browser drop a pointer lock it has just granted again: that lost lock must
  // not reopen the menu. App.escT marks such an Esc; App.pauseT marks a menu opened by a lost lock (the same Esc may still arrive as a key event).
  const escGuard = () => performance.now() - (App.escT || 0) < 1000;
  function lockLost() {
    if (App.screen === 'play' && !App.overlay) { App.overlay = 'pause'; App.pauseT = performance.now(); }
    if (App.screen === 'cabinet' && App.cab && !App.cab.ov) { App.cab.ov = 'pause'; App.pauseT = performance.now(); }
  }
  document.addEventListener('pointerlockchange', () => {
    App.locked = document.pointerLockElement === ui; if (App.locked) { App.lockWant = 0; App.needClick = false; }
    if (!App.locked && !App.lockWant) { if (escGuard()) { lock(); return; } lockLost(); }
  });
  document.addEventListener('pointerlockerror', () => { if (App.lockWant || escGuard() || performance.now() < (App.noReopen || 0)) return; lockLost(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden && App.screen === 'play' && !App.overlay) { unlock(); App.overlay = 'pause'; } if (document.hidden && App.screen === 'cabinet' && App.cab && !App.cab.ov) { App.cab.ov = 'pause'; unlock(); } });
  addEventListener('blur', () => inp.keys.clear());
  addEventListener('keyup', e => { inp.keys.delete(e.code); const c = Keys.tr(e.code); if (c) inp.keys.delete(c); });
  addEventListener('keydown', e => {
    Snd.init(); Snd.resume(); if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    inp.keys.add(e.code);
    if (e.code === 'Escape' && !App.modal && ((App.screen === 'play' && App.overlay === 'pause') || (App.screen === 'cabinet' && App.cab && App.cab.ov === 'pause'))) { if (e.repeat || performance.now() - (App.pauseT || 0) < 350) return; App.escT = performance.now(); }
    if (App.modal) { modalKey(e); return; }
    if (e.code === 'KeyF' && !e.repeat && App.screen === 'play' && App.play && App.play.flash && !App.overlay) { App.play.toggleFlash(); } else if (e.code === 'KeyF' && !e.repeat) { try { if (document.fullscreenElement) document.exitFullscreen(); else document.documentElement.requestFullscreen(); } catch (er) {} }
    const sc = App.screen;
    if (sc === 'keys') { e.preventDefault(); if (S.keys.key(e)) { App.screen = 'title'; Save.write(); } return; }
    if (sc === 'mp') { if (['Backspace', 'Tab', 'Space', 'ArrowDown', 'ArrowUp'].includes(e.code)) e.preventDefault(); mpAct(S.mp.key(e)); return; }
    if (sc === 'cabinet' && App.cab) { if (!e.repeat) App.cab.key(e); return; }
    if (sc === 'play') {
      if (App.overlay === 'help') { App.overlay = 'pause'; resume(); return; }
      if (App.overlay === 'journal') {
        if (e.code === 'Escape' && S.journal.escape()) { /* back from the aberrants list */ } else if (e.code === 'Escape' || e.code === 'Tab') closeJournal(); else if (e.code === 'ArrowLeft' && !e.repeat) { S.journal.tab = (S.journal.tab + BIOMES.length - 1) % BIOMES.length; S.journal.sel = 0; } else if (e.code === 'ArrowRight' && !e.repeat) { S.journal.tab = (S.journal.tab + 1) % BIOMES.length; S.journal.sel = 0; } else if (e.code === 'ArrowUp') S.journal.turn(-1); else if (e.code === 'ArrowDown') S.journal.turn(1); return;
      }
      if (App.overlay === 'cardpos') { if (e.code === 'Escape') { S.cardpos.release(); App.overlay = 'pause'; } return; }
      if (App.overlay === 'pause') { if (e.code === 'Escape') resume(); return; }
      if (e.repeat) return;
      if (e.code === 'Tab') openJournal('play'); else if (e.code === 'Space') inp.fire = true; else if (e.code === 'KeyE' && App.play.doorNear) App.play.enterDoor(); else if (e.code === 'KeyH') { App.play.sense = !App.play.sense; Snd.sfx.click(); } else if (e.code === 'KeyP') { unlock(); App.overlay = 'pause'; }
    } else if (sc === 'title') { if (e.code === 'Enter') { Snd.sfx.click(); go(() => { App.screen = 'map'; }); } else if (e.code === 'KeyK') go(() => App.toCabinet()); }
    else if (sc === 'map') {
      if (e.code === 'Escape') go(() => { App.screen = 'title'; });
      else if (e.code >= 'Digit1' && e.code <= 'Digit9') { S.wmap.sel = +e.code.slice(5) - 1; Snd.sfx.pin(); }
      else if ((e.code === 'Enter' || e.code === 'Space') && S.wmap.sel >= 0) { Snd.sfx.click(); const id = BIOMES[S.wmap.sel].id; go(() => App.start(id)); }
      else if (e.code === 'KeyJ' || e.code === 'Tab') openJournal('map'); else if (e.code === 'KeyK') go(() => App.toCabinet());
    } else if (sc === 'journal') {
      if (e.code === 'Escape' && S.journal.escape()) { /* back from the aberrants list */ } else if (e.code === 'Escape' || e.code === 'Tab') closeJournal(); else if (e.code === 'ArrowLeft') { S.journal.tab = (S.journal.tab + BIOMES.length - 1) % BIOMES.length; S.journal.sel = 0; } else if (e.code === 'ArrowRight') { S.journal.tab = (S.journal.tab + 1) % BIOMES.length; S.journal.sel = 0; } else if (e.code === 'ArrowUp') S.journal.turn(-1); else if (e.code === 'ArrowDown') S.journal.turn(1);
    }
  });
  ui.addEventListener('mousedown', e => {
    Snd.init(); Snd.resume(); toNative(e); if (e.button !== 0) return; const { x, y } = mouse; const sc = App.screen;
    if (App.modal) { modalClick(x, y); return; }
    if (sc === 'cabinet' && App.cab) { if (App.cab.ov) App.cab.click(x, y); else if (!App.locked) lock(); return; }
    if (sc === 'play') {
      if (App.overlay === 'help') { App.overlay = 'pause'; resume(); return; }
      if (App.overlay === 'cardpos') { const id = S.cardpos.press(x, y, App.play); if (id) Snd.sfx.click(); if (id === 'done') { S.cardpos.release(); App.overlay = 'pause'; } return; }
      if (App.overlay === 'pause') {
        const id = S.pause.click(x, y); if (!id) return; Snd.sfx.click();
        if (id === 'resume') resume(); else if (id === 'journal') openJournal('play'); else if (id === 'cabinet') go(() => App.toCabinet()); else if (id === 'help') App.overlay = 'help'; else if (id === 'settings') openSettings(); else if (id === 'title') go(() => App.toTitle()); else if (id === 'sound') toggleSetting('sound'); else if (id === 'music') toggleSetting('music'); else if (id === 'quality') { Save.data.settings.quality = Save.data.settings.quality === 'low' ? 'high' : 'low'; Save.write(); App.play.applyQuality(); Snd.sfx.click(); } else if (id === 'regen') { if (Net.on) Net.send('regen'); else { const bid = App.play.biome.id; go(() => App.start(bid)); } } else if (id === 'map') go(() => App.toMap());
        return;
      }
      if (App.overlay === 'journal') { const id = S.journal.click(x, y); if (id === 'close') closeJournal(); return; }
      if (App.locked) inp.fire = true; else lock();
    } else if (sc === 'title') {
      const id = S.title.click(x, y); if (!id) return; Snd.sfx.click();
      if (id === 'play') go(() => { App.screen = 'map'; }); else if (id === 'journal') openJournal('title'); else if (id === 'cabinet') go(() => App.toCabinet()); else if (id === 'mp') { S.mp.msg = ''; App.screen = 'mp'; } else if (id === 'keys') { S.keys.wait = -1; S.keys.msg = ''; App.screen = 'keys'; } else if (id === 'sound') toggleSetting('sound'); else if (id === 'help') { App.helpFromTitle = true; }
    } else if (sc === 'keys') { if (S.keys.click(x, y)) App.screen = 'title';
    } else if (sc === 'mp') { mpAct(S.mp.click(x, y));
    } else if (sc === 'map') {
      const id = S.wmap.click(x, y); if (!id) return;
      if (id === 'back') { Snd.sfx.click(); go(() => { App.screen = 'title'; }); } else if (id === 'journal') openJournal('map'); else if (id === 'cabinet') { Snd.sfx.click(); go(() => App.toCabinet()); } else if (id === 'market') { Snd.sfx.click(); go(() => App.toMarket()); } else if (id === 'go' && S.wmap.sel >= 0) { Snd.sfx.click(); const b = BIOMES[S.wmap.sel].id; go(() => App.start(b)); }
    } else if (sc === 'journal') { const id = S.journal.click(x, y); if (id === 'close') closeJournal(); }
  });
  addEventListener('mouseup', () => S.cardpos.release());
  ui.addEventListener('contextmenu', e => e.preventDefault());
  ui.addEventListener('wheel', e => { if (App.screen === 'play' && App.overlay === 'cardpos') { S.cardpos.step(App.play, e.deltaY < 0 ? 1 : -1); return; } if (App.screen === 'cabinet' && App.cab) { App.cab.wheel(e.deltaY); return; } if (App.screen === 'journal' || App.overlay === 'journal') S.journal.turn(e.deltaY > 0 ? 1 : -1); });

  // ---------------- loop
  let last = performance.now();
  function frame(ts) {
    requestAnimationFrame(frame);
    const dt = clamp((ts - last) / 1000, 0, 0.05); last = ts; App.time += dt; const t = App.time;
    ctx.setTransform(uiK, 0, 0, uiK, 0, 0);
    if (!App.ready) { ctx.fillStyle = '#04080a'; ctx.fillRect(0, 0, SW, SH); return; }
    ctx.imageSmoothingEnabled = false;
    // fades
    if (App.fade !== App.fadeTarget) { const sp = dt * 4.5; App.fade = App.fade < App.fadeTarget ? Math.min(App.fadeTarget, App.fade + sp) : Math.max(App.fadeTarget, App.fade - sp); if (App.fade >= 1 && App.fadeTarget === 1 && App.fadeCb) { const cb = App.fadeCb; App.fadeCb = null; cb(); App.fadeTarget = 0; } }
    const sc = App.screen;
    if (sc === 'play' && App.play) {
      const p = App.play;
      const running = !App.overlay && (App.locked || App.noLock || App.lockWant);
      if (running) p.update(dt, inp); else { inp.dx = inp.dy = 0; inp.fire = false; }
      renderer.setRenderTarget(rt); renderer.render(p.scene, p.camera); renderer.setRenderTarget(null); renderer.render(postScene, postCam);
      gl.style.visibility = 'visible'; ctx.clearRect(0, 0, SW, SH);
      if (App.overlay === 'pause') S.pause.draw(ctx, t, mouse, p); else if (App.overlay === 'journal') S.journal.draw(ctx, t, mouse); else if (App.overlay === 'help') { p.draw(ctx); S.help.draw(ctx, t, mouse); } else if (App.overlay === 'cardpos') { p.draw(ctx); S.cardpos.draw(ctx, t, mouse, p); } else p.draw(ctx);
    } else if (sc === 'cabinet' && App.cab) {
      const cb = App.cab; const full = ['pick', 'spread', 'bench', 'place', 'journal', 'sell'].includes(cb.ov);
      if (!cb.ov && (App.locked || App.noLock || App.lockWant)) cb.update(dt, inp); else { inp.dx = inp.dy = 0; cb.animate(dt); }
      ctx.clearRect(0, 0, SW, SH);
      if (!full) { renderer.setRenderTarget(rt); renderer.render(cb.scene, cb.camera); renderer.setRenderTarget(null); renderer.render(postScene, postCam); gl.style.visibility = 'visible'; } else gl.style.visibility = 'hidden';
      cb.draw(ctx, t, mouse, dt);
    } else {
      gl.style.visibility = 'hidden'; ctx.clearRect(0, 0, SW, SH);
      if (sc === 'title') { S.title.draw(ctx, t, mouse); if (App.helpFromTitle) S.help.draw(ctx, t, mouse); }
      else if (sc === 'map') S.wmap.draw(ctx, t, mouse);
      else if (sc === 'mp') S.mp.draw(ctx, t, mouse);
      else if (sc === 'keys') S.keys.draw(ctx, t, mouse);
      else if (sc === 'journal') S.journal.draw(ctx, t, mouse);
      else if (sc === 'loading') S.loading.draw(ctx, t, App.loadText);
    }
    if (App.helpFromTitle && sc === 'title' && (inp.keys.size || false)) { /* dismissed by key handler below */ }
    if (App.modal === 'settings') S.settings.draw(ctx, t, mouse); else if (App.modal === 'keys') S.keys.draw(ctx, t, mouse);
    if (App.needClick && App.screen === 'play' && !App.overlay && !App.locked && !App.lockWant) { const s2 = 'Нажмите, чтобы продолжить', w2 = T.width(s2, 8) + 20; UIK.panel(ctx, SW / 2 - w2 / 2, SH / 2 + 30, w2, 18, { fill: 'rgba(16,28,24,0.92)', border: UIK.col.gold }); T.draw(ctx, s2, SW / 2, SH / 2 + 35, { size: 8, align: 'c', color: '#fff' }); }
    if (App.fade > 0.001) { ctx.fillStyle = `rgba(2,6,6,${App.fade})`; ctx.fillRect(0, 0, SW, SH); }
  }
  // dismiss title help overlay on any key/click
  addEventListener('keydown', () => { if (App.helpFromTitle && App.screen === 'title') App.helpFromTitle = false; });
  ui.addEventListener('mouseup', () => { if (App.helpFromTitle && App.screen === 'title' && App.helpTimer && performance.now() - App.helpTimer > 200) App.helpFromTitle = false; });
  ui.addEventListener('mousedown', () => { if (App.helpFromTitle) App.helpTimer = performance.now(); });

  App.renderer = renderer;
  T.onReady(() => { if (params.has('mp')) { const addr = params.get('server') || Net.defaultUrl(), nm = params.get('mp') || 'Гость'; Net.connect(addr, nm).then(() => { const b0 = params.get('biome'); if (b0 && BIOME_BY_ID[b0]) { App.noLockAuto = true; setTimeout(() => App.start(b0), 200); } else if (params.has('cabinet')) setTimeout(() => App.toCabinet(), 200); }).catch(() => {}); } App.ready = true; App.screen = 'title'; App.fade = 1; App.fadeTarget = 0; const b = params.has('mp') ? null : params.get('biome'); if (b && BIOME_BY_ID[b]) { App.noLockAuto = true; setTimeout(() => App.start(b), 200); } else if (params.has('cabinet') && !params.has('mp')) setTimeout(() => App.toCabinet(), 200); });
  requestAnimationFrame(frame);
})();
