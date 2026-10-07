// ---------------------------------------------------------------- the hidden console: the backslash key opens a line, Enter runs it, Esc or the backslash closes it
// commands:  give gold <amount>   - gives that much gold to the player who typed it (an optional leading ":" is accepted)
const Con = (() => {
  const MAX = 80, W = 300, HIST_MAX = 30; let text = '', log = [], hist = [], hi = -1, shownAt = 0;
  const A = () => window.F0W;
  const say = (s, bad) => { log.push({ s, bad: !!bad }); if (log.length > 8) log.shift(); shownAt = performance.now(); };
  const run = line => {
    const raw = line.trim(); if (!raw) return;
    say('> ' + raw); const parts = raw.replace(/^[:\s]+/, '').split(/\s+/).filter(Boolean).map(w => w.toLowerCase());
    if (parts[0] === 'give' && parts[1] === 'gold') {
      if (parts.length !== 3) { say('Использование: give gold <количество>', true); return; }
      const n = Number(parts[2]); if (!/^\d+$/.test(parts[2]) || !Number.isSafeInteger(n) || n < 1) { say('Количество должно быть целым числом от 1', true); return; }
      const give = Math.min(n, 1e9); Save.data.coins = Math.min(1e12, (Save.data.coins || 0) + give); Save.write(); Snd.sfx.coin();
      say(`Выдано золота: ${give}. Теперь у вас: ${Save.data.coins}`); return;
    }
    say('Неизвестная команда: ' + (parts[0] || raw), true);
  };
  const o = {
    open: false,
    canOpen() { const a = A(); return !!(a && !Chat.open && !a.modal && a.screen !== 'loading'); },
    show() { text = ''; hi = -1; o.open = true; A().chatOpen = true; A().inp.keys.clear(); if (A().kbFocus) A().kbFocus(true); },
    close() { o.open = false; A().chatOpen = false; text = ''; if (A().kbFocus) A().kbFocus(false); },
    key(e) {
      if (e.code === 'Escape' || e.code === 'Backslash') { o.close(); return; }
      if (e.code === 'Enter' || e.code === 'NumpadEnter') { const l = text; if (l.trim()) { hist.unshift(l); if (hist.length > HIST_MAX) hist.pop(); } run(l); text = ''; hi = -1; return; }
      if (e.code === 'Backspace') { text = text.slice(0, -1); return; }
      if (e.code === 'ArrowUp') { if (hi + 1 < hist.length) { hi++; text = hist[hi]; } return; }
      if (e.code === 'ArrowDown') { if (hi > 0) { hi--; text = hist[hi]; } else { hi = -1; text = ''; } return; }
      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && text.length < MAX) text += e.key;
    },
    draw(ctx, t) {
      if (A().screen === 'loading') { if (o.open) o.close(); return; }
      const c = UIK.col, now = performance.now(), recent = now - shownAt < 4500; if (!o.open && !recent) return;
      const L = (o.open ? log : log.slice(-2)).slice(-6), baseY = 78, h = L.length * 10 + 6;
      ctx.globalAlpha = o.open ? 1 : clamp((4500 - (now - shownAt)) / 900);
      if (L.length) { ctx.fillStyle = 'rgba(8,16,14,0.78)'; ctx.fillRect(6, baseY, W, h); L.forEach((ln, i) => T.draw(ctx, fitStr(ln.s, W - 8), 10, baseY + 3 + i * 10, { size: 8, color: ln.bad ? '#e88a80' : '#b8e0c0' })); }
      if (o.open) {
        const y = baseY + (L.length ? h + 2 : 0); UIK.panel(ctx, 6, y, W, 14, { fill: 'rgba(16,32,28,0.97)', border: c.green, shadow: false });
        let vis = '> ' + text; while (T.width(vis, 8) > W - 18 && vis.length > 1) vis = vis.slice(1);
        T.draw(ctx, vis, 10, y + 3, { size: 8, color: '#fff' }); if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = c.green; ctx.fillRect(10 + T.width(vis, 8), y + 3, 1, 8); }
        if (!text && !L.length) T.draw(ctx, 'Консоль. Enter — выполнить, Esc или \\ — закрыть', 10, y + 17, { size: 8, color: c.dim });
      }
      ctx.globalAlpha = 1;
    },
  };
  return o;
})();
