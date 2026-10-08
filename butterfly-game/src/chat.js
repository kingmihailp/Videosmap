// ---------------------------------------------------------------- multiplayer chat: T opens a line, Enter sends, Esc closes; recent messages fade out
const Chat = (() => {
  const MAX = 120, W = 270; let text = '', last = 0;
  const A = () => window.F0W;
  const wrap = (s, w) => { const out = []; let cur = ''; for (const word of s.split(' ')) { const t = cur ? cur + ' ' + word : word; if (T.width(t, 8) <= w || !cur) cur = t; else { out.push(cur); cur = word; } } if (cur) out.push(cur); return out.flatMap(l => { const r = []; while (T.width(l, 8) > w && l.length > 1) { let k = l.length - 1; while (k > 1 && T.width(l.slice(0, k), 8) > w) k--; r.push(l.slice(0, k)); l = l.slice(k); } r.push(l); return r; }); };
  const o = {
    open: false,
    canOpen() { const a = A(); return !!(a && Net.on && !a.modal && ((a.screen === 'play' && a.play && !a.overlay) || (a.screen === 'cabinet' && a.cab && !a.cab.ov))); },
    show() { text = ''; o.open = true; A().chatOpen = true; A().inp.keys.clear(); if (A().kbFocus) A().kbFocus(true); },
    close() { o.open = false; A().chatOpen = false; text = ''; if (A().kbFocus) A().kbFocus(false); },
    send() { const t = text.trim(); const now = performance.now(); if (t && now - last > 600) { Net.say(t); last = now; } o.close(); },
    key(e) {                                           // returns nothing; always consumes the key while the line is open
      if (e.code === 'Escape') { o.close(); return; } if (e.code === 'Enter') { o.send(); return; }
      if (e.code === 'Backspace') { text = text.slice(0, -1); return; }
      if (e.key && e.key.length === 1 && !e.ctrlKey && !e.metaKey && text.length < MAX) text += e.key;
    },
    draw(ctx, t) {
      if (!Net.on) { if (o.open) o.close(); return; }
      const now = performance.now(), c = UIK.col, msgs = Net.chat.filter(m => o.open || now - m.at < 12000).slice(o.open ? -8 : -5); if (!msgs.length && !o.open) return;
      const lines = []; for (const m of msgs) { const mine = m.name === Net.name, ls = wrap(`${m.name}: ${m.text}`, W - 8); ls.forEach((l, i) => lines.push({ l, mine, a: o.open ? 1 : clamp((12000 - (now - m.at)) / 2500), head: i === 0 ? m.name.length + 1 : 0 })); }
      const L = lines.slice(-9), baseY = SH - 68 - (o.open ? 18 : 0); const h = L.length * 10 + 6;
      if (L.length) { ctx.fillStyle = 'rgba(8,16,14,0.55)'; ctx.fillRect(6, baseY - h, W, h); }
      L.forEach((ln, i) => { ctx.globalAlpha = ln.a; const y = baseY - h + 3 + i * 10; if (ln.head) { const nm = ln.l.slice(0, ln.head); T.draw(ctx, nm, 10, y, { size: 8, color: ln.mine ? c.gold : '#9ae0b0' }); T.draw(ctx, ln.l.slice(ln.head), 10 + T.width(nm, 8), y, { size: 8, color: '#fff' }); } else T.draw(ctx, ln.l, 10, y, { size: 8, color: '#fff' }); ctx.globalAlpha = 1; });
      if (o.open) {
        const y = baseY + 4; UIK.panel(ctx, 6, y, W, 14, { fill: 'rgba(16,32,28,0.96)', border: c.gold, shadow: false });
        const shown = text.length > 0 ? text : ''; let vis = shown; while (T.width(vis, 8) > W - 18 && vis.length > 1) vis = vis.slice(1);
        T.draw(ctx, vis, 10, y + 3, { size: 8, color: '#fff' }); if (Math.floor(t * 2) % 2 === 0) { ctx.fillStyle = c.gold; ctx.fillRect(10 + T.width(vis, 8), y + 3, 1, 8); }
        if (!text) T.draw(ctx, 'Введите сообщение… (Enter — отправить, Esc — отмена)', 10, y + 3, { size: 8, color: c.dim });
      }
    },
  };
  // the vote card (a new landscape needs everybody's consent): buttons work whenever the cursor is free, Y / N always
  o.vbtns = [];
  o.drawVote = (ctx, t, m) => {
    const v = Net.vote; o.vbtns = []; if (!v) return; const c = UIK.col, x = 6, y = 52, w = 214, left = Math.max(0, (v.end - performance.now()) / v.ms);
    UIK.panel(ctx, x, y, w, 46, { fill: 'rgba(16,32,28,0.96)', border: c.gold });
    T.draw(ctx, `${v.by} предлагает создать новую местность`, x + 6, y + 5, { size: 8, color: '#fff' });
    T.draw(ctx, `Согласны: ${v.yes} из ${v.need}`, x + 6, y + 16, { size: 8, color: '#9ae0b0' });
    if (!v.mine) { o.vbtns = [{ id: 'yes', label: 'Да (Y)', x: x + 6, y: y + 27, w: 60, h: 13 }, { id: 'no', label: 'Нет (N)', x: x + 72, y: y + 27, w: 60, h: 13 }]; o.vbtns.forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y))); T.draw(ctx, 'Esc — курсор', x + 138, y + 30, { size: 7, color: c.dim }); }
    else T.draw(ctx, v.mine === 'yes' ? 'Вы за — ждём остальных…' : 'Вы против', x + 6, y + 29, { size: 8, color: c.dim });
    ctx.fillStyle = 'rgba(255,255,255,0.15)'; ctx.fillRect(x + 4, y + 42, w - 8, 2); ctx.fillStyle = c.gold; ctx.fillRect(x + 4, y + 42, (w - 8) * left, 2);
  };
  o.voteClick = (mx, my) => { for (const b of o.vbtns) if (UIK.hit(b, mx, my)) { Net.voteReply(b.id === 'yes'); Snd.sfx.click(); return true; } return false; };
  return o;
})();
