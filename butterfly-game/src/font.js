// ---------------------------------------------------------------- pixel text engine (atlas generated from DejaVu Sans Bold)
const T = (() => {
  const img = new Image();
  let ready = false;
  const waiting = [];
  // The pixel atlas is kept for small offscreen textures; the main UI canvas uses the real (vector) font so text is smooth at any scale.
  let imgOk = false, fontDone = false, vecOk = false;
  const check = () => { if (imgOk && fontDone && !ready) { ready = true; waiting.splice(0).forEach(f => f()); } };
  img.onload = () => { imgOk = true; check(); };
  img.src = FONT_PNG;
  try { const ff = new FontFace('F0W', 'url(' + FONT_TTF + ')'); ff.load().then(f => { document.fonts.add(f); vecOk = true; fontDone = true; check(); }).catch(() => { fontDone = true; check(); }); } catch (e) { fontDone = true; }
  const mcv = document.createElement('canvas').getContext('2d');
  const tinted = {};
  function atlas(color) {
    let c = tinted[color];
    if (!c) {
      c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
      const x = c.getContext('2d'); x.drawImage(img, 0, 0);
      x.globalCompositeOperation = 'source-in'; x.fillStyle = color; x.fillRect(0, 0, c.width, c.height);
      tinted[color] = c;
    }
    return c;
  }
  function meta(size) { return FONT_META[size] || FONT_META[8]; }
  function width(str, size = 8) {
    if (vecOk) { mcv.font = `bold ${size}px F0W`; return mcv.measureText(str).width; }
    const m = meta(size).g; let w = 0;
    for (const ch of str) { const g = m[ch] || m['?']; w += g[4]; }
    return w;
  }
  function drawRaw(ctx, str, x, y, size, color) {
    const m = meta(size), a = atlas(color); const base = y + m.asc;
    let px = x;
    for (const ch of str) {
      const g = m.g[ch] || m.g['?'];
      if (g[2]) ctx.drawImage(a, g[0], g[1], g[2], g[3], px + g[5], base + g[6], g[2], g[3]);
      px += g[4];
    }
  }
  // opt: size, color, align ('l','c','r'), shadow, outline
  function drawVec(ctx, str, x, y, size, opt) {
    const w = width(str, size); const half = v => Math.round(v * 2) / 2;
    if (opt.align === 'c') x -= w / 2; else if (opt.align === 'r') x -= w;
    x = half(x); const by = half(y) + meta(size).asc;
    ctx.save(); ctx.font = `bold ${size}px F0W`; ctx.textBaseline = 'alphabetic'; ctx.textAlign = 'left'; ctx.lineJoin = 'round';
    if (opt.outline) { ctx.strokeStyle = opt.outline; ctx.lineWidth = 2.2; ctx.strokeText(str, x, by); }
    if (opt.shadow) { ctx.fillStyle = opt.shadow; ctx.fillText(str, x + 1, by + 1); }
    ctx.fillStyle = opt.color || '#fff'; ctx.fillText(str, x, by); ctx.restore(); return w;
  }
  function draw(ctx, str, x, y, opt = {}) {
    const size = opt.size || 8; const color = opt.color || '#fff';
    if (vecOk && ctx.canvas && ctx.canvas.id === 'ui') return drawVec(ctx, str, x, y, size, opt);
    x = Math.round(x); y = Math.round(y);
    const w = width(str, size);
    if (opt.align === 'c') x -= Math.round(w / 2); else if (opt.align === 'r') x -= w;
    if (opt.outline) for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1], [-1, -1], [1, 1], [-1, 1], [1, -1]]) drawRaw(ctx, str, x + dx, y + dy, size, opt.outline);
    if (opt.shadow) drawRaw(ctx, str, x + 1, y + 1, size, opt.shadow);
    drawRaw(ctx, str, x, y, size, color);
    return w;
  }
  function wrap(str, maxW, size = 8) {
    const words = str.split(' '); const lines = []; let cur = '';
    for (const w of words) {
      const t = cur ? cur + ' ' + w : w;
      if (width(t, size) > maxW && cur) { lines.push(cur); cur = w; } else cur = t;
    }
    if (cur) lines.push(cur);
    return lines;
  }
  function para(ctx, str, x, y, maxW, opt = {}) {
    const size = opt.size || 8; const lh = opt.lh || meta(size).lh;
    const lines = wrap(str, maxW, size);
    lines.forEach((l, i) => draw(ctx, l, x, y + i * lh, opt));
    return lines.length * lh;
  }
  return { draw, width, wrap, para, onReady: f => (ready ? f() : waiting.push(f)), lh: s => meta(s).lh };
})();
