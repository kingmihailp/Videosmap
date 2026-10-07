// ---------------------------------------------------------------- re-bindable controls
// The game logic keeps reading the default key codes (KeyW, Space, KeyE ...). A capture-phase listener translates the physical key the player chose
// into the default ("logical") one before the game sees it, while playing; the default key of a re-bound action stops working.
// On-screen texts that mention keys ("E — ...", "Tab — журнал") are rewritten through T.draw / T.width (Keys.fix).
const Keys = (() => {
  const ACTIONS = [
    { id: 'fwd', ru: 'Вперёд', def: ['KeyW'] }, { id: 'back', ru: 'Назад', def: ['KeyS'] }, { id: 'left', ru: 'Влево', def: ['KeyA'] }, { id: 'right', ru: 'Вправо', def: ['KeyD'] },
    { id: 'sprint', ru: 'Бег', def: ['ShiftLeft', 'ShiftRight'] }, { id: 'crouch', ru: 'Красться', def: ['ControlLeft', 'KeyC', 'ControlRight'] },
    { id: 'swing', ru: 'Взмах сачка (и ЛКМ)', def: ['Space'] }, { id: 'use', ru: 'Действие / войти', def: ['KeyE'] }, { id: 'journal', ru: 'Журнал', def: ['Tab'] },
    { id: 'sense', ru: 'Нюх', def: ['KeyH'] }, { id: 'torch', ru: 'Фонарь', def: ['KeyF'] }, { id: 'pause', ru: 'Пауза', def: ['KeyP'] }, { id: 'chat', ru: 'Чат (мультиплеер)', def: ['KeyT'] }, { id: 'stash', ru: 'Склад', def: ['KeyI'] },
  ];
  const SYM = { Comma: ',', Period: '.', Slash: '/', Semicolon: ';', Quote: "'", BracketLeft: '[', BracketRight: ']', Backslash: '\\', Minus: '-', Equal: '=', Backquote: '`', Space: 'Пробел', Enter: 'Enter', Backspace: 'Backspace', Tab: 'Tab', CapsLock: 'Caps',
    ShiftLeft: 'Shift (лев.)', ShiftRight: 'Shift (прав.)', ControlLeft: 'Ctrl (лев.)', ControlRight: 'Ctrl (прав.)', AltLeft: 'Alt (лев.)', AltRight: 'Alt (прав.)',
    ArrowUp: 'Стрелка вверх', ArrowDown: 'Стрелка вниз', ArrowLeft: 'Стрелка влево', ArrowRight: 'Стрелка вправо', Delete: 'Delete', Insert: 'Insert', Home: 'Home', End: 'End', PageUp: 'PageUp', PageDown: 'PageDown' };
  const name = code => SYM[code] || (/^Key(.)$/.test(code) ? code[3] : /^Digit(\d)$/.test(code) ? code[5] : /^Numpad/.test(code) ? 'Num ' + code.slice(6) : code);
  const FORBID = new Set(['Escape', 'Enter', 'MetaLeft', 'MetaRight', 'ContextMenu']);
  let map = {}, dead = {}, custom = false;
  const cfg = () => (Save.data.settings.keys && typeof Save.data.settings.keys === 'object') ? Save.data.settings.keys : {};
  const bound = id => { const a = ACTIONS.find(a => a.id === id); return cfg()[id] || a.def[0]; };
  function rebuild() {
    map = {}; dead = {}; custom = false; const c = cfg();
    for (const a of ACTIONS) if (c[a.id] && c[a.id] !== a.def[0]) { map[c[a.id]] = a.def[0]; custom = true; }
    for (const a of ACTIONS) if (c[a.id] && c[a.id] !== a.def[0]) for (const d of a.def) if (!(d in map)) dead[d] = true;
    // default keys that something else now uses are not "dead" (they map); keys of untouched actions stay as they are
  }
  const tr = code => (code in map) ? map[code] : dead[code] ? null : code;
  function set(id, code) {                                   // swaps when the key is already used by another action
    if (FORBID.has(code)) return false; const c = Save.data.settings.keys = Object.assign({}, cfg()); const old = bound(id);
    const other = ACTIONS.find(a => a.id !== id && bound(a.id) === code); if (other) c[other.id] = old;
    c[id] = code; for (const a of ACTIONS) if (c[a.id] === a.def[0]) delete c[a.id]; rebuild(); Save.write(); return true;
  }
  function reset() { delete Save.data.settings.keys; rebuild(); Save.write(); }
  // translate texts: the default key names in prompts become the player's keys
  const EXACT = () => ({ 'WASD': ['fwd', 'left', 'back', 'right'].map(i => name(bound(i))).join(' '), 'Ctrl / C': name(bound('crouch')), 'Shift': name(bound('sprint')), 'H': name(bound('sense')), 'Tab': name(bound('journal')), 'F': name(bound('torch')), 'ЛКМ / Пробел': 'ЛКМ / ' + name(bound('swing')) });
  function fix(s) {
    if (!custom || typeof s !== 'string') return s; let o = s;
    if (/E — /.test(o)) o = o.replace(/(^|[^A-Za-zА-Яа-я])E — /g, (m, p) => p + name(bound('use')) + ' — ');
    if (/Tab — /.test(o)) o = o.replace(/(^|[^A-Za-z])Tab — /g, (m, p) => p + name(bound('journal')) + ' — ');
    if (/T — /.test(o)) o = o.replace(/(^|[^A-Za-z])T — /g, (m, p) => p + name(bound('chat')) + ' — ');
    if (/H — /.test(o)) o = o.replace(/(^|[^A-Za-z])H — /g, (m, p) => p + name(bound('sense')) + ' — ');
    if (/Shift — /.test(o)) o = o.replace(/Shift — /g, name(bound('sprint')) + ' — ');
    if (/Ctrl — /.test(o)) o = o.replace(/Ctrl — /g, name(bound('crouch')) + ' — ');
    if (/F — фонарь/.test(o)) o = o.replace(/F — фонарь/g, name(bound('torch')) + ' — фонарь');
    if (/\[F\]/.test(o)) o = o.replace('[F]', '[' + name(bound('torch')) + ']');
    if (/Журнал \(Tab\)/.test(o)) o = o.replace('(Tab)', '(' + name(bound('journal')) + ')');
    const ex = EXACT(); if (o in ex) o = ex[o];
    return o;
  }
  const origDraw = T.draw, origWidth = T.width; T.draw = (ctx, str, ...r) => origDraw(ctx, fix(str), ...r); T.width = (str, size) => origWidth(fix(str), size);
  // gameplay contexts only: menus, journal pages and text fields keep the raw keys
  const active = () => { const A = window.F0W; if (!A || !custom || A.chatOpen) return false; return (A.screen === 'play' && !A.overlay) || (A.screen === 'cabinet' && !!A.cab && !A.cab.ov); };
  addEventListener('keydown', e => {
    if (e.__tr || !active()) return; const c = tr(e.code); if (c === e.code) return;
    e.stopImmediatePropagation(); if (['Tab', 'Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault(); if (c === null) return;
    const ev = new KeyboardEvent('keydown', { code: c, key: /^Key(.)$/.test(c) ? c[3].toLowerCase() : c === 'Space' ? ' ' : c, repeat: e.repeat, bubbles: true, cancelable: true, shiftKey: e.shiftKey, ctrlKey: e.ctrlKey }); ev.__tr = true; window.dispatchEvent(ev);
  }, true);
  rebuild();
  return { ACTIONS, name, bound, set, reset, rebuild, tr, fix, FORBID };
})();
