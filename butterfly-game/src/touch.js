// ---------------------------------------------------------------- touch controls (phones / tablets)
// Active when the primary pointer is coarse (or with #touch in the URL). It only feeds the existing input model:
// a floating stick -> W/A/S/D (+Shift when pushed to the edge), a drag on the right half -> look (inp.dx/dy), a short tap -> swing the net,
// DOM buttons -> the same key events as the keyboard. Menus work through the browser's emulated mouse clicks on the UI canvas.
(() => {
  const App = window.F0W; if (!App) return;
  const on = (window.matchMedia && matchMedia('(pointer:coarse)').matches) || /touch/.test(location.hash);
  if (!on || /notouch/.test(location.hash)) return;
  App.touch = true; App.noLock = true;                         // no pointer lock on touch screens: "locked" is emulated
  const ui = document.getElementById('ui'), inp = App.inp;
  const st = document.createElement('style');
  st.textContent = `#ui{touch-action:none}
  #tc{position:fixed;inset:0;pointer-events:none;z-index:5;font-family:monospace;-webkit-user-select:none;user-select:none;-webkit-touch-callout:none}
  #tc .b{position:absolute;pointer-events:auto;touch-action:none;display:none;align-items:center;justify-content:center;width:var(--s);height:var(--s);border-radius:14px;background:rgba(8,18,16,.55);border:2px solid rgba(232,200,112,.75);color:#f2e8c8;font-size:calc(var(--s)*.34);font-weight:bold;box-shadow:0 2px 0 rgba(0,0,0,.5)}
  #tc .b:active{background:rgba(232,200,112,.45)}
  #tc .big{width:calc(var(--s)*1.35);height:calc(var(--s)*1.35);border-radius:50%}
  #tc .st{position:absolute;display:none;width:calc(var(--s)*1.9);height:calc(var(--s)*1.9);margin:calc(var(--s)*-.95) 0 0 calc(var(--s)*-.95);border-radius:50%;border:2px solid rgba(242,232,200,.5);background:rgba(8,18,16,.25)}
  #tc .kn{position:absolute;left:50%;top:50%;width:calc(var(--s)*.8);height:calc(var(--s)*.8);margin:calc(var(--s)*-.4) 0 0 calc(var(--s)*-.4);border-radius:50%;background:rgba(242,232,200,.55)}
  #rot{position:fixed;inset:0;z-index:9;background:#04080a;color:#f2e8c8;display:none;align-items:center;justify-content:center;text-align:center;font:16px monospace;padding:24px}
  #kb{position:fixed;left:50%;bottom:0;width:60px;height:24px;font-size:16px;opacity:.02;border:0;padding:0;z-index:4;pointer-events:none}`;
  document.head.appendChild(st);
  const root = document.createElement('div'); root.id = 'tc'; document.body.appendChild(root);
  const rot = document.createElement('div'); rot.id = 'rot'; rot.innerHTML = '<div>Поверни телефон горизонтально<br><br>↻ 📱</div>'; document.body.appendChild(rot);
  const kb = document.createElement('input'); kb.id = 'kb'; kb.autocapitalize = 'off'; kb.autocomplete = 'off'; kb.spellcheck = false; kb.value = ' '; kb.setAttribute('inputmode', 'text'); kb.setAttribute('enterkeyhint', 'done'); document.body.appendChild(kb);
  const S = () => Math.max(44, Math.min(70, Math.round(Math.min(innerWidth, innerHeight) * 0.15)));

  const key = (code, k) => { const o = { code, key: k || code, bubbles: true }; window.dispatchEvent(new KeyboardEvent('keydown', o)); window.dispatchEvent(new KeyboardEvent('keyup', o)); };
  const btns = [];
  function mk(label, place, show, act, cls) {
    const b = document.createElement('div'); b.className = 'b' + (cls ? ' ' + cls : ''); b.textContent = label; Object.assign(b.style, place);
    b.addEventListener('touchstart', e => { e.preventDefault(); e.stopPropagation(); Snd.init(); Snd.resume(); act(); }, { passive: false });
    root.appendChild(b); btns.push({ b, show }); return b;
  }
  const moving = () => (App.screen === 'play' && !!App.play && !App.overlay) || (App.screen === 'cabinet' && !!App.cab && !App.cab.ov);
  const g = 'calc(var(--s)*.35)';
  mk('🦋', { right: g, bottom: g }, () => App.screen === 'play' && moving(), () => { inp.fire = true; }, 'big');
  mk('E', { right: `calc(var(--s)*1.45 + ${g})`, bottom: `calc(var(--s)*1.45 + ${g})` }, moving, () => key('KeyE', 'e'));
  mk('📖', { right: g, top: `calc(var(--s)*1.3 + ${g})` }, moving, () => key('Tab'));
  const crouch = mk('⬇', { right: g, top: `calc(var(--s)*2.6 + ${g})` }, () => moving() && App.screen === 'play', () => { if (inp.keys.has('KeyC')) inp.keys.delete('KeyC'); else inp.keys.add('KeyC'); });
  mk('☰', { right: g, top: g }, moving, () => key('KeyP', 'p'));
  mk('🔦', { left: g, top: `calc(var(--s)*3.3 + ${g})` }, () => moving() && App.screen === 'play' && App.play.flash, () => key('KeyF', 'f'));
  mk('👁', { left: g, top: `calc(var(--s)*2 + ${g})` }, () => moving() && App.screen === 'play', () => key('KeyH', 'h'));
  mk('✕', { right: g, top: g }, () => !moving() && App.screen !== 'title' && App.screen !== 'loading', () => key('Escape'));
  mk('ПРОБЕЛ', { right: g, bottom: g, width: `calc(var(--s)*2.2)` }, () => App.screen === 'cabinet' && !!App.cab && App.cab.ov === 'spread', () => key('Space', ' '));
  const stick = document.createElement('div'); stick.className = 'st'; const knob = document.createElement('div'); knob.className = 'kn'; stick.appendChild(knob); root.appendChild(stick);

  // ---- stick + look
  let mv = null, lk = null; const MOVE_KEYS = ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ShiftLeft'];
  const setKeys = (x, y, run) => { const f = (c, v) => v ? inp.keys.add(c) : inp.keys.delete(c); f('KeyW', y < -0.3); f('KeyS', y > 0.3); f('KeyA', x < -0.3); f('KeyD', x > 0.3); f('ShiftLeft', run); };
  const endMove = () => { mv = null; stick.style.display = 'none'; MOVE_KEYS.forEach(c => inp.keys.delete(c)); };
  ui.addEventListener('touchstart', e => {
    Snd.init(); Snd.resume();
    if (!document.fullscreenElement && document.documentElement.requestFullscreen && App.screen !== 'mp') { try { document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => { try { screen.orientation.lock('landscape').catch(() => {}); } catch (er) {} }).catch(() => {}); } catch (er) {} }
    for (const t of e.changedTouches) {
      const m = moving();
      if (m && t.clientX < innerWidth * 0.45 && !mv) { mv = { id: t.identifier, x: t.clientX, y: t.clientY }; stick.style.left = t.clientX + 'px'; stick.style.top = t.clientY + 'px'; stick.style.display = 'block'; knob.style.transform = ''; }
      else if (!lk) lk = { id: t.identifier, x: t.clientX, y: t.clientY, x0: t.clientX, y0: t.clientY, t0: e.timeStamp, m, acc: 0, moved: false };
    }
  }, { passive: true });
  ui.addEventListener('touchmove', e => {
    for (const t of e.changedTouches) {
      if (mv && t.identifier === mv.id) {
        const R = S() * 0.95; let dx = t.clientX - mv.x, dy = t.clientY - mv.y; const d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / R);
        knob.style.transform = `translate(${dx / d * k * R}px,${dy / d * k * R}px)`; setKeys(dx / d * k, dy / d * k, k > 0.92);
      } else if (lk && t.identifier === lk.id) {
        if (!lk.m) document.dispatchEvent(new MouseEvent('mousemove', { clientX: t.clientX, clientY: t.clientY, bubbles: true }));   // menus / spreading board follow the finger
        const dx = t.clientX - lk.x, dy = t.clientY - lk.y; lk.x = t.clientX; lk.y = t.clientY;
        if (Math.hypot(t.clientX - lk.x0, t.clientY - lk.y0) > 10) lk.moved = true;
        if (lk.m) { inp.dx += dx * 1.7; inp.dy += dy * 1.7; }
        else if (lk.moved && (App.screen === 'cabinet' || App.screen === 'journal' || App.overlay === 'journal')) {   // drag = scroll lists / flip journal pages
          lk.acc -= dy; while (Math.abs(lk.acc) > 28) { const s = Math.sign(lk.acc); lk.acc -= s * 28; ui.dispatchEvent(new WheelEvent('wheel', { deltaY: s * 100, bubbles: true, cancelable: true })); }
        }
      }
    }
  }, { passive: true });
  const end = e => {
    for (const t of e.changedTouches) {
      if (mv && t.identifier === mv.id) endMove();
      if (lk && t.identifier === lk.id) { const L = lk; lk = null; if (L.m) { if (!L.moved && e.timeStamp - L.t0 < 350) inp.fire = true; if (e.cancelable) e.preventDefault(); } }   // a tap swings the net (and blocks the emulated click)
    }
  };
  ui.addEventListener('touchend', end, { passive: false }); ui.addEventListener('touchcancel', end, { passive: false });

  // ---- on-screen text input (multiplayer address / name): a tap on the form focuses a hidden input, typed characters become key events
  ui.addEventListener('click', () => { if (App.screen === 'mp' && !(window.Net && Net.on)) { kb.blur(); kb.value = ' '; kb.focus({ preventScroll: true }); try { kb.setSelectionRange(1, 1); } catch (er) {} } else if (document.activeElement === kb) kb.blur(); });   // focus inside the tap itself (needed to raise the keyboard); blur first so it comes back after being hidden
  kb.addEventListener('input', () => {
    const v = kb.value; kb.value = ' ';
    if (!v.length) { key('Backspace'); return; }
    for (const ch of v.slice(1)) key('', ch);
  });
  kb.addEventListener('keydown', e => { e.stopPropagation(); if (e.key === 'Enter') { e.preventDefault(); key('Enter'); kb.blur(); } });   // characters arrive through 'input' only (no doubling)
  kb.addEventListener('keyup', e => e.stopPropagation());

  // ---- layout / visibility
  function sync() {
    root.style.setProperty('--s', S() + 'px');
    for (const o of btns) o.b.style.display = o.show() ? 'flex' : 'none';
    if (!moving() && mv) endMove();
    if (!(moving() && App.screen === 'play')) inp.keys.delete('KeyC');
    crouch.style.background = inp.keys.has('KeyC') ? 'rgba(232,200,112,.6)' : '';
    rot.style.display = innerHeight > innerWidth * 1.05 ? 'flex' : 'none';
  }
  App.tcState = () => ({ mv, lk });
  setInterval(sync, 120); addEventListener('resize', sync); sync();
})();
