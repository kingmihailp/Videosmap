// ---------------------------------------------------------------- the panoramas behind the main menu: one pixel-art scene per location (the ocean excepted),
// a new one every time the title screen is entered. Whole pixels only; layers scroll with a parallax, plants sway, particles drift.
const Panorama = (() => {
  const PER = 640, TAU = Math.PI * 2, BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  const mixc = (a, b, t) => a.map((v, i) => v + (b[i] - v) * t);
  const rgb = a => `rgb(${a[0] | 0},${a[1] | 0},${a[2] | 0})`;
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  // ---- the sky: a dithered vertical gradient with a sun (or a moon) and its glow, pre-rendered once per scene
  const skyCache = {};
  function sky(sc) {
    if (skyCache[sc.id]) return skyCache[sc.id]; const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH; const x = cv.getContext('2d'), im = x.createImageData(SW, SH), d = im.data, N = 14;
    const stops = sc.sky.map(([p, c]) => [p, hex(c)]);
    const col = t => { for (let i = 0; i < stops.length - 1; i++) if (t <= stops[i + 1][0]) { const A = stops[i], B = stops[i + 1]; return mixc(A[1], B[1], (t - A[0]) / (B[0] - A[0] || 1)); } return stops[stops.length - 1][1]; };
    const sun = sc.sun;
    for (let y = 0; y < SH; y++) for (let xx = 0; xx < SW; xx++) {
      const bay = (BAYER[(y & 3) * 4 + (xx & 3)] + 0.5) / 16; let c = col(Math.min(1, Math.floor(y / 190 * N + bay) / N));
      if (sun) { const dist = Math.hypot(xx - sun.x, y - sun.y); if (dist > sun.r && dist < sun.r * 5) { const g = 0.45 * (1 - (dist - sun.r) / (sun.r * 4)); if (g * 0.7 > bay * 0.25) c = mixc(c, sun.glow, 0.3); } if (dist <= sun.r) c = hex(sun.c); }
      const o = (y * SW + xx) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255;
    }
    x.putImageData(im, 0, 0); return skyCache[sc.id] = cv;
  }
  const clouds = (ctx, sc, t) => {
    const C = sc.clouds; if (!C) return; ctx.fillStyle = C.col;
    for (let i = 0; i < C.n; i++) { const w = 26 + hash(i + 3) * 40, cx = ((hash(i) * 600 + t * C.sp * (0.6 + hash(i + 9))) % (SW + 140)) - 70, cy = C.y0 + hash(i + 5) * (C.y1 - C.y0);
      [[0.5, 0], [0.85, 2], [1, 4], [0.9, 6]].forEach(([k, dy], j) => { const ww = Math.round(w * k); ctx.fillRect(Math.round(cx - ww / 2), Math.round(cy + dy), ww, 2); });
      ctx.fillStyle = C.shade; ctx.fillRect(Math.round(cx - w * 0.45), Math.round(cy + 8), Math.round(w * 0.9), 1); ctx.fillStyle = C.col; }
  };

  // ---- ridges: a periodic height function per layer, filled column by column
  const ridgeY = (L, wx) => {
    const u = (wx % PER + PER) % PER / PER * TAU, a = L.a || [2, 5]; let h = Math.sin(u * a[0] + (L.ph || 0)) + 0.5 * Math.sin(u * a[1] + 1.7 + (L.ph || 0));
    if (L.shape === 'peak') h = -(1 - Math.pow(Math.abs(Math.sin(u * a[0] * 0.5 + (L.ph || 0))), 0.75)) * 1.6 + 0.4 * Math.sin(u * a[1] * 2) * 0.5 + 0.8;
    else if (L.shape === 'karst') { const s = Math.sin(u * a[0] * 0.5 + (L.ph || 0)); h = -Math.pow(Math.max(0, s), 0.5) * 2 + 0.3 * Math.sin(u * a[1]) + 1; }
    else if (L.shape === 'mesa') { h = Math.round((Math.sin(u * a[0] + (L.ph || 0)) + 0.5 * Math.sin(u * a[1] + 2)) * 1.4) / 1.4; }
    else if (L.shape === 'cone') { const d = Math.abs(((wx - L.cx) % PER + PER + PER / 2) % PER - PER / 2); h = Math.min(1.2, d / (L.w || 110)) * 2 - 1.6; }
    return L.base + L.amp * h;
  };
  // a big cone (Fuji, a volcano): lit and shaded slopes, ravines, a jagged snowline with gullies (or scoria, glowing lava and a crater), a forest at the foot and drifting mist
  function mountainDetail(ctx, L, t, off) {
    const cxs = Math.round((((L.cx - off) % PER) + PER) % PER), fuji = L.detail === 'fuji', top = Math.round(L.base - L.amp * 1.6);
    for (let x = 0; x < SW; x++) { const wx = x + off, hy = Math.round(ridgeY(L, wx)), left = ((((wx - L.cx) % PER) + PER * 1.5) % PER) - PER / 2 < 0, g = Math.floor(wx / 3), g5 = Math.floor(wx / 5); if (hy > 176) continue;
      let se = hy;
      if (fuji) { se = Math.min(176, hy + Math.max(0, L.snowY - hy + 6 * Math.sin(wx * 0.23) + 3 * Math.sin(wx * 0.61) + (hash(g) < 0.3 ? 8 + hash(g + 9) * 16 : 0))); ctx.fillStyle = left ? '#f8f8ff' : '#c4cce6'; ctx.fillRect(x, hy, 1, se - hy); if (hy < se) { ctx.fillStyle = left ? '#ffffff' : '#a8b4d4'; ctx.fillRect(x, hy, 1, 1); } }
      ctx.fillStyle = left ? 'rgba(255,255,255,0.13)' : 'rgba(10,10,50,0.22)'; ctx.fillRect(x, se, 1, 178 - se);
      if (hash(g5 * 0.7 + 2) < (fuji ? 0.34 : 0.5)) { ctx.fillStyle = 'rgba(20,20,70,0.3)'; ctx.fillRect(x, se, 1, 14 + Math.round(hash(g5 + 4) * (fuji ? 34 : 60))); }
      if (!fuji) { if (hash(x * 0.31 + Math.floor(wx) * 0.7) < 0.12) { ctx.fillStyle = left ? '#8a6058' : '#3a2428'; ctx.fillRect(x, hy + 3 + Math.round(hash(wx) * 60), 1, 1); } if (hash(g5 * 1.3) < 0.18) { ctx.fillStyle = 'rgba(190,176,170,0.28)'; ctx.fillRect(x, hy + 2, 1, 22 + Math.round(hash(g5) * 30)); } }
      for (let y = 150; y < 178; y++) { if (y <= se + 2) continue; const k = (y - 150) / 28; if (BAYER[(y & 3) * 4 + (x & 3)] / 16 < k * 0.95) { ctx.fillStyle = fuji ? '#35504c' : '#1e3a2a'; ctx.fillRect(x, y, 1, 1); } } }
    if (!fuji) { const pulse = 0.65 + 0.35 * Math.sin(t * 2.2);
      for (const side of [-1, 1]) { ctx.fillStyle = `rgba(255,${(120 + 60 * pulse) | 0},40,${0.9})`; for (let u = 0; u < 1; u += 0.012) { const px = cxs + side * (u * (26 + side * 6) + Math.sin(u * 9 + side) * 3), py = top + 3 + u * 74; if (Math.abs(px - cxs) < (py - top) * 0.62 + 2) ctx.fillRect(Math.round(px), Math.round(py), 1 + (u < 0.3 ? 1 : 0), 2); } }
      ctx.fillStyle = '#ff6a22'; ctx.fillRect(cxs - 4, top, 9, 2); ctx.fillStyle = `rgba(255,${(150 + 80 * pulse) | 0},60,1)`; ctx.fillRect(cxs - 2, top, 5, 1); ctx.globalAlpha = 0.18 * pulse; ctx.fillStyle = '#ff7a2a'; blob(ctx, cxs, top - 6, 18, 10); ctx.globalAlpha = 1; }
    ctx.globalAlpha = 0.24; ctx.fillStyle = '#ffffff'; for (let k = 0; k < 3; k++) { const mx = ((k * 190 + t * (2 + k)) % 700) - 100, my = 146 + k * 8; ctx.fillRect(Math.round(mx), my, 190, 2); ctx.fillRect(Math.round(mx) + 30, my + 2, 120, 1); } ctx.globalAlpha = 1;
  }
  function drawLayer(ctx, L, sc, t) {
    const off = t * 3 * L.par, base = hex(L.col);
    for (let x = 0; x < SW; x++) {
      const wx = x + off, hy = Math.round(ridgeY(L, wx)); if (hy >= SH) continue;
      if (L.snow && L.snowY !== undefined) { const se = Math.min(SH, Math.max(hy, L.snowY)); ctx.fillStyle = L.snow; if (hy < se) ctx.fillRect(x, hy, 1, se - hy); ctx.fillStyle = L.col; ctx.fillRect(x, se, 1, SH - se); continue; }
      if (L.terrace) { for (let y = hy; y < SH; y += 1) { ctx.fillStyle = ((y - hy) >> 2) % 2 ? L.col : L.terrace; ctx.fillRect(x, y, 1, 1); } continue; }
      ctx.fillStyle = L.col; ctx.fillRect(x, hy, 1, SH - hy);
      { const lt = L.lt || (L.lt = rgb(mixc(base, [255, 255, 230], 0.22))), dk = L.dk || (L.dk = rgb(mixc(base, [0, 10, 30], 0.2))), slope = ridgeY(L, wx + 2) - ridgeY(L, wx - 2);
        ctx.fillStyle = slope < -0.5 ? lt : dk; ctx.fillRect(x, hy, 1, 2);                                  // the lit side of a slope and its shaded side
        const k = Math.floor(wx), h1 = hash(k * 0.37 + L.base), h2 = hash(k * 0.91 + 3 + L.base);
        if (h1 < 0.5) { ctx.fillStyle = h2 < 0.5 ? lt : dk; ctx.fillRect(x, hy + 3 + ((h2 * 40) | 0), 1, 1 + (h1 < 0.1 ? 1 : 0)); }           // texture: tufts and shade flecks
        if (L.par > 0.2 && h2 < 0.08) { ctx.fillStyle = dk; ctx.fillRect(x, hy + 8 + ((h1 * 30) | 0), 2, 1); } }
      if (L.rim) { ctx.fillStyle = L.rim; ctx.fillRect(x, hy, 1, 1); }
    }
    if (L.detail) mountainDetail(ctx, L, t, off);
  }

  // ---- plants: each draws itself standing at (x, y) with height h and width w
  const R_ = (ctx, x, y, w, h) => ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  const blob = (ctx, cx, cy, rx, ry) => { for (let j = -ry; j <= ry; j++) { const hw = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry + 0.01))); ctx.fillRect(Math.round(cx - hw), Math.round(cy + j), hw * 2 + 1, 1); } };
  const line = (ctx, x0, y0, x1, y1, w = 1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / (n || 1)), Math.round(y0 + (y1 - y0) * i / (n || 1)), w, w); };
  const toRgb = c => c[0] === '#' ? hex(c) : c.match(/\d+/g).map(Number), shade = (c, k) => rgb(toRgb(c).map(v => Math.max(0, Math.min(255, v * k))));       // (takes #hex or rgb())
  // a leafy crown: dark body, a cluster of lobes, lit tops on the upper-left, leaf flecks, a shadow underneath: it never reads as a plain circle
  function crown(ctx, cx, cy, rx, ry, c1, c2, seed, sway = 0, spread = 0.62) {
    const n = 6 + ((rx / 4) | 0), lobes = []; if (!c2) c2 = shade(c1, 1.25); const dk = shade(c1, 0.72);
    for (let i = 0; i < n; i++) { const a = hash(seed + i * 3.1) * TAU, d = Math.sqrt(hash(seed + i * 5.7)) * spread, r = 0.3 + hash(seed + i * 1.9) * 0.22; lobes.push([cx + Math.cos(a) * rx * d, cy + Math.sin(a) * ry * d * 0.95, Math.max(2, rx * r), Math.max(2, ry * r * 1.1)]); }
    ctx.fillStyle = dk; blob(ctx, cx + sway * 0.5, cy + 1, rx * 0.88, ry * 0.88);
    ctx.fillStyle = c1; for (const [lx, ly, lrx, lry] of lobes) blob(ctx, lx + sway, ly, lrx, lry);
    ctx.fillStyle = 'rgba(0,0,30,0.2)'; blob(ctx, cx + sway, cy + ry * 0.62, rx * 0.72, Math.max(1, ry * 0.2));
    ctx.fillStyle = c2; for (const [lx, ly, lrx, lry] of lobes) blob(ctx, lx - lrx * 0.28 + sway, ly - lry * 0.32, Math.max(1, lrx * 0.58), Math.max(1, lry * 0.5));
    for (let k = 0; k < rx * 1.4; k++) { const a = hash(seed + k * 2.3) * TAU, d = Math.sqrt(hash(seed + k * 7.1)) * 0.95, px = Math.round(cx + Math.cos(a) * rx * d + sway), py = Math.round(cy + Math.sin(a) * ry * d); ctx.fillStyle = k % 3 ? dk : shade(c2, 1.12); ctx.fillRect(px, py, 1, 1); }
    ctx.fillStyle = c2; for (let k = 0; k < 5; k++) { const a = -0.5 - hash(seed + k) * 2, d = 0.78 + hash(seed + k * 3) * 0.22; ctx.fillRect(Math.round(cx + Math.cos(a) * rx * d + sway), Math.round(cy + Math.sin(a) * ry * d), 2, 1); }       // leaves catching light on the rim
  }
  // bamboo: a slender jointed culm that leans and sways, with nodes and branches carrying sprays of narrow drooping leaves
  function leafSpray(ctx, x, y, dir, size, c1, c2, seed, t) {
    for (let k = 0; k < 6; k++) { const a = dir + (k - 2.5) * 0.42 + Math.sin(t * 1.5 + seed + k) * 0.07, L = size * (0.75 + hash(seed + k * 1.7) * 0.5); let px = x, py = y; ctx.fillStyle = k % 2 ? c1 : c2;
      for (let s2 = 0; s2 <= L; s2++) { const u = s2 / L; px = x + Math.cos(a) * s2; py = y + Math.sin(a) * s2 + u * u * L * 0.55; ctx.fillRect(Math.round(px), Math.round(py), 1, 1); } ctx.fillStyle = shade(c2, 1.25); ctx.fillRect(Math.round(px), Math.round(py), 1, 1); }
  }
  function culm(ctx, bx, base, bh, lean, sway, wd, c1, c2, node, seed, t, sprays = true) {
    const px = j => Math.round(bx + lean * Math.pow(j / bh, 1.5) + sway * (j / bh) ** 2);
    for (let j = 0; j < bh; j++) { ctx.fillStyle = c1; ctx.fillRect(px(j), base - j, wd, 1); ctx.fillStyle = c2; ctx.fillRect(px(j), base - j, 1, 1); if (j > 0 && j % node === 0) { ctx.fillStyle = shade(c1, 0.55); ctx.fillRect(px(j) - 1, base - j, wd + 2, 1); ctx.fillStyle = shade(c2, 1.15); ctx.fillRect(px(j) - 1, base - j - 1, wd + 2, 1); } }
    if (!sprays) return; for (let j = Math.round(bh * 0.5), q = 0; j < bh; j += node + 2, q++) { const side = q % 2 ? 1 : -1, ex = px(j) + side * (3 + (q % 3)), ey = base - j - 2; ctx.fillStyle = shade(c1, 0.7); ctx.fillRect(Math.min(px(j), ex), ey, Math.abs(ex - px(j)) + 1, 1); leafSpray(ctx, ex, ey, side > 0 ? -0.3 : Math.PI + 0.3, 5 + (j > bh * 0.8 ? 1 : 0), shade(c1, 1.05), c2, seed + q, t); }
    leafSpray(ctx, px(bh), base - bh, -Math.PI / 2, 6, shade(c1, 1.05), c2, seed + 9, t);
  }
  const KINDS = {
    pine(ctx, x, y, h, w, c1) { ctx.fillStyle = c1; for (let k = 0; k < 5; k++) { const yy = y - h + k * h / 5.2, ww = w * (0.35 + k * 0.22), y0 = Math.round(yy - h / 5), y1 = Math.round(yy + h / 4.4); for (let j = y0; j <= y1; j++) { const hw = Math.max(0, Math.round(ww * (j - y0) / Math.max(1, y1 - y0) + (hash(j * 1.7 + k + x * 0.3) - 0.5) * 2.2)); ctx.fillRect(x - hw, j, hw * 2 + 1, 1); } } ctx.fillStyle = shade(c1, 1.3); for (let k = 0; k < 5; k++) { const yy = Math.round(y - h + k * h / 5.2 + h / 10), hw = Math.round(w * (0.35 + k * 0.22) * 0.5); ctx.fillRect(x - hw, yy, 2, 1); ctx.fillRect(x - hw - 1, yy + 2, 2, 1); } ctx.fillStyle = '#2a1c14'; ctx.fillRect(x - 1, y - 4, 3, 4); },
    cypress(ctx, x, y, h, w, c1) { ctx.fillStyle = c1; for (let j = 0; j < h; j++) { const t = j / h, hw = Math.round(w * 0.5 * Math.sin(Math.min(1, t * 1.15 + 0.08) * Math.PI) ** 0.7 + 0.5); ctx.fillRect(x - hw, y - h + j, hw * 2 + 1, 1); } },
    broad(ctx, x, y, h, w, c1, c2, t, i) { const sw = Math.sin(t * 0.9 + i) * 0.8; ctx.fillStyle = '#3a2a1c'; R_(ctx, x - 1, y - h * 0.5, 3, h * 0.5); ctx.fillRect(x - 2, y - 2, 5, 2); line(ctx, x, y - h * 0.42, x - w * 0.3, y - h * 0.62); line(ctx, x, y - h * 0.45, x + w * 0.3, y - h * 0.66); crown(ctx, x, y - h * 0.68, w * 0.82, h * 0.34, c1, c2, i * 7 + x * 0.01, sw); },
    oak(ctx, x, y, h, w, c1, c2, t, i) { const sw = Math.sin(t * 0.8 + i) * 0.8; ctx.fillStyle = '#3a2a1c'; R_(ctx, x - 2, y - h * 0.45, 5, h * 0.45); ctx.fillRect(x - 4, y - 3, 9, 3); line(ctx, x, y - h * 0.4, x - w * 0.5, y - h * 0.6, 2); line(ctx, x, y - h * 0.4, x + w * 0.5, y - h * 0.6, 2); crown(ctx, x - w * 0.42, y - h * 0.66, w * 0.5, h * 0.24, c1, c2, i * 3 + 1, sw); crown(ctx, x + w * 0.42, y - h * 0.68, w * 0.5, h * 0.24, c1, c2, i * 3 + 2, sw); crown(ctx, x, y - h * 0.82, w * 0.62, h * 0.24, c1, c2, i * 3 + 3, sw); },
    poplar(ctx, x, y, h, w, c1, c2, t, i) { const sw = Math.sin(t * 1.1 + i) * 0.7; ctx.fillStyle = '#4a3a28'; R_(ctx, x, y - h * 0.3, 1, h * 0.3); for (let k = 0; k < 3; k++) crown(ctx, x, y - h * (0.4 + k * 0.2), w * (0.34 - k * 0.05), h * 0.17, c1, c2, i * 5 + k, sw * (1 + k * 0.4), 0.55); },
    willow(ctx, x, y, h, w, c1, c2, t, i) { ctx.fillStyle = '#3a2a1c'; R_(ctx, x - 1, y - h * 0.45, 3, h * 0.45); crown(ctx, x, y - h * 0.62, w * 0.78, h * 0.26, c1, c2, i * 9, Math.sin(t * 0.8 + i) * 0.6); for (let k = 0; k < w * 0.9; k++) { const sx = x - w * 0.7 + k * 1.6, len = 6 + hash(i + k) * h * 0.3, sw = Math.sin(t * 1.4 + k * 0.7) * 1.5; ctx.fillStyle = k % 2 ? c1 : c2; for (let j = 0; j < len; j++) ctx.fillRect(Math.round(sx + sw * (j / len) ** 2), Math.round(y - h * 0.56 + j), 1, 1); } },
    olive(ctx, x, y, h, w, c1, c2, t, i) { ctx.fillStyle = '#4a3a2a'; for (let j = 0; j < h * 0.5; j++) R_(ctx, x - 1 + Math.round(Math.sin(j * 0.5 + i) * 1.4), y - j, 3, 1); line(ctx, x, y - h * 0.4, x - w * 0.35, y - h * 0.62); line(ctx, x, y - h * 0.4, x + w * 0.4, y - h * 0.6); crown(ctx, x - w * 0.3, y - h * 0.66, w * 0.42, h * 0.2, c1, c2, i + 1); crown(ctx, x + w * 0.32, y - h * 0.64, w * 0.42, h * 0.2, c1, c2, i + 2); crown(ctx, x, y - h * 0.74, w * 0.46, h * 0.2, c1, c2, i + 3); },
    sakura(ctx, x, y, h, w, c1, c2, t, i) { ctx.fillStyle = '#3a2420'; R_(ctx, x - 1, y - h * 0.5, 3, h * 0.5); line(ctx, x, y - h * 0.4, x - w * 0.4, y - h * 0.6); line(ctx, x, y - h * 0.42, x + w * 0.4, y - h * 0.62); crown(ctx, x - w * 0.32, y - h * 0.68, w * 0.5, h * 0.22, c1, c2, i + 4, Math.sin(t + i) * 0.6); crown(ctx, x + w * 0.34, y - h * 0.7, w * 0.5, h * 0.22, c1, c2, i + 5, Math.sin(t + i) * 0.6); crown(ctx, x, y - h * 0.8, w * 0.6, h * 0.22, c1, c2, i + 6, Math.sin(t + i) * 0.6); ctx.fillStyle = c2; for (let k = 0; k < 4; k++) ctx.fillRect(Math.round(x - w * 0.6 + ((t * 6 + k * 17 + i * 5) % (w * 1.2))), Math.round(y - h * 0.5 + ((t * 9 + k * 13) % (h * 0.5))), 1, 1); },
    birch(ctx, x, y, h, w, c1, c2, t, i) { ctx.fillStyle = c2; R_(ctx, x - 1, y - h * 0.62, 2, h * 0.62); ctx.fillStyle = '#2a2a24'; for (let j = 0; j < h * 0.6; j += 5) R_(ctx, x - 1, y - j - 2, 1, 1); line(ctx, x, y - h * 0.45, x - w * 0.3, y - h * 0.6); line(ctx, x, y - h * 0.5, x + w * 0.3, y - h * 0.68); const sw = Math.sin(t * 1.1 + i) * 0.8; crown(ctx, x - w * 0.28, y - h * 0.62, w * 0.38, h * 0.14, c1, null, i + 1, sw); crown(ctx, x + w * 0.3, y - h * 0.7, w * 0.36, h * 0.14, c1, null, i + 2, sw); crown(ctx, x, y - h * 0.8, w * 0.42, h * 0.16, c1, null, i + 3, sw); },
    palm(ctx, x, y, h, w, c1, c2, t, i) { ctx.fillStyle = '#4a3a28'; for (let j = 0; j < h; j++) R_(ctx, x + Math.round(Math.sin(j / h * 1.3) * w * 0.35), y - j, 2, 1); const tx = x + Math.round(Math.sin(1.3) * w * 0.35), ty = y - h; ctx.fillStyle = c1;
      for (let k = 0; k < 7; k++) { const a = -2.6 + k * 0.75, L = w * 0.9, sw = Math.sin(t * 1.3 + i + k) * 1.2; for (let s = 0; s <= 10; s++) { const u = s / 10; ctx.fillRect(Math.round(tx + Math.cos(a) * L * u + sw * u), Math.round(ty + Math.sin(a) * L * u * 0.55 + u * u * L * 0.5), 1, 1); } } },
    acacia(ctx, x, y, h, w, c1, c2, t, i) { ctx.fillStyle = c1; for (let j = 0; j < h * 0.62; j++) R_(ctx, x - 1 + Math.round(Math.sin(j * 0.2 + i) * 1.2), y - j, 2 + (j < 4 ? 1 : 0), 1); line(ctx, x, y - h * 0.5, x - w * 0.32, y - h * 0.76, 2); line(ctx, x, y - h * 0.5, x + w * 0.32, y - h * 0.78, 2); line(ctx, x, y - h * 0.6, x, y - h * 0.84);
      for (const [dx, dy, rx] of [[0, 0.86, 0.6], [-0.36, 0.8, 0.34], [0.36, 0.82, 0.34], [-0.62, 0.74, 0.2], [0.62, 0.76, 0.2]]) { const cx = x + dx * w, cy = y - dy * h, r = Math.max(3, w * rx * 0.5); for (let j = -2; j <= 1; j++) { const hw = Math.round(r * (1 - Math.abs(j + 0.5) / 3.2)); ctx.fillRect(Math.round(cx - hw), Math.round(cy + j), hw * 2 + 1, 1); } for (let k = 0; k < r; k += 2) ctx.fillRect(Math.round(cx - r + k * 2), Math.round(cy + 2 + hash(k + i) * 2), 1, 1 + (hash(k * 3 + i) * 2 | 0)); } },
    baobab(ctx, x, y, h, w, c1, c2) { ctx.fillStyle = c1; for (let j = 0; j < h * 0.7; j++) { const t = j / (h * 0.7), hw = Math.round(w * 0.5 * (1 - t * 0.45) + Math.max(0, 1 - t * 6) * 3); ctx.fillRect(x - hw, y - j, hw * 2 + 1, 1); } for (const a of [-1, -0.4, 0.3, 1]) line(ctx, x + a * 2, y - h * 0.7, x + a * w * 0.55, y - h * 0.95); ctx.fillStyle = c2; for (const a of [-1, -0.4, 0.3, 1]) blob(ctx, x + a * w * 0.55, y - h * 0.97, 3, 2); },
    mound(ctx, x, y, h, w, c1) { ctx.fillStyle = c1; for (let j = 0; j < h; j++) { const hw = Math.round(w * 0.5 * (1 - j / h) ** 0.8); ctx.fillRect(x - hw, y - j, hw * 2 + 1, 1); } },
    cactus(ctx, x, y, h, w, c1, c2) { ctx.fillStyle = c1; R_(ctx, x - 1, y - h, 3, h); ctx.fillRect(x - 1, y - h - 1, 3, 1); const a = Math.round(h * 0.45); R_(ctx, x - 5, y - a, 5, 2); R_(ctx, x - 6, y - a - 8, 2, 9); R_(ctx, x + 2, y - a * 1.4, 5, 2); R_(ctx, x + 6, y - a * 1.4 - 7, 2, 8); ctx.fillStyle = c2; R_(ctx, x, y - h, 1, h); },
    ocotillo(ctx, x, y, h, w, c1, c2, t, i) { for (let k = 0; k < 8; k++) { const a = (k - 3.5) * 0.2, sw = Math.sin(t * 1.4 + i + k) * 0.7; ctx.fillStyle = c1; for (let s = 0; s <= h; s += 1) { const u = s / h; ctx.fillRect(Math.round(x + Math.sin(a) * s * 0.8 + sw * u * u), Math.round(y - s), 1, 1); } ctx.fillStyle = c2; ctx.fillRect(Math.round(x + Math.sin(a) * h * 0.8 + sw), Math.round(y - h - 1), 1, 2); } },
    yucca(ctx, x, y, h, w, c1, c2, t, i) { ctx.fillStyle = '#5a4a34'; R_(ctx, x - 1, y - h * 0.55, 2, h * 0.55); ctx.fillStyle = c1; const hx = x, hy = y - h * 0.58; for (let k = 0; k < 11; k++) { const a = -Math.PI / 2 + (k - 5) * 0.3; line(ctx, hx, hy, hx + Math.cos(a) * w * 0.55, hy + Math.sin(a) * w * 0.55); } if (c2) { ctx.fillStyle = c2; R_(ctx, x, y - h - 4, 1, 8); ctx.fillRect(x - 1, y - h - 4, 3, 3); } },
    agave(ctx, x, y, h, w, c1, c2) { const n = 11; for (const pass of [0, 1]) for (let k = 0; k < n; k++) { const u = k / (n - 1), a = -Math.PI * (0.08 + 0.84 * u), L = w * (0.45 + 0.4 * Math.sin(Math.PI * u)) * (pass ? 0.72 : 1); if (pass === 0 && k % 2 === 0) continue; if (pass === 1 && k % 2 === 1) continue;
        for (let s2 = 0; s2 <= L; s2++) { const f = s2 / L, px = x + Math.cos(a) * s2, py = y - 1 + Math.sin(a) * s2 * (0.9 + 0.35 * Math.abs(Math.cos(a))) + f * f * 2, th = Math.max(1, Math.round(2.6 * (1 - f) + 0.6)); ctx.fillStyle = pass ? shade(c1, 1.12) : c1; ctx.fillRect(Math.round(px), Math.round(py), 1, th); if (f > 0.15 && f < 0.85) { ctx.fillStyle = c2 || shade(c1, 1.4); ctx.fillRect(Math.round(px), Math.round(py), 1, 1); } if (f > 0.93) { ctx.fillStyle = '#4a2a20'; ctx.fillRect(Math.round(px), Math.round(py), 1, 1); } } } ctx.fillStyle = shade(c1, 0.6); ctx.fillRect(x - 1, y - 2, 3, 2); },
    bush(ctx, x, y, h, w, c1, c2) { ctx.fillStyle = c1; blob(ctx, x, y - h * 0.4, w * 0.5, h * 0.4); if (c2) { ctx.fillStyle = c2; blob(ctx, x - w * 0.15, y - h * 0.55, w * 0.25, h * 0.2); } },
    bamboo(ctx, x, y, h, w, c1, c2, t, i) { const n = 5 + ((w / 3) | 0), lit = shade(c2, 1.1); for (let k = 0; k < n; k++) { const o = k - (n - 1) / 2, bh = Math.round(h * (0.62 + hash(i * 3 + k) * 0.38)); culm(ctx, Math.round(x + o * 2.6 + hash(k + i) * 2), y, bh, o * 1.8, Math.sin(t * 1.2 + i + k) * 1.8, 2, k % 2 ? c1 : shade(c1, 0.88), lit, 6 + (k % 3), i * 11 + k, t, bh > h * 0.5); } ctx.fillStyle = shade(c1, 0.6); for (let k = 0; k < 6; k++) ctx.fillRect(Math.round(x - 8 + k * 3), y - 1, 2, 1); },
    jungle(ctx, x, y, h, w, c1, c2, t, i) { const sw = Math.sin(t * 0.8 + i) * 1; ctx.fillStyle = '#3a2c20'; R_(ctx, x - 2, y - h, 4, h); ctx.fillStyle = '#2a2018'; R_(ctx, x + 1, y - h, 1, h); for (const s2 of [-1, 1]) for (let j = 0; j < 12; j++) ctx.fillRect(x + s2 * (2 + j * 0.5) - (s2 < 0 ? 1 : 0), y - 12 + j + (j > 9 ? 0 : 0), 2, 1);       // buttress roots
      crown(ctx, x - w * 0.34 + sw, y - h + 1, w * 0.4, h * 0.075, c1, c2, i * 3 + 1, 0, 0.7); crown(ctx, x + w * 0.34 + sw, y - h + 3, w * 0.4, h * 0.075, c1, c2, i * 3 + 2, 0, 0.7); crown(ctx, x + sw, y - h - 3, w * 0.5, h * 0.09, c1, c2, i * 3 + 3, 0, 0.7);
      ctx.fillStyle = '#1e4a28'; for (let k = 0; k < 6; k++) { const lx = x - w * 0.5 + k * w * 0.2 + sw, ln = 8 + (k * 11 + i * 3) % 22; for (let j = 0; j < ln; j++) ctx.fillRect(Math.round(lx + Math.sin(t * 1.3 + k + j * 0.2) * 0.6), y - h + 3 + j, 1, 1); } },
    treefern(ctx, x, y, h, w, c1, c2, t, i) { ctx.fillStyle = '#3a2c20'; R_(ctx, x - 1, y - h, 2, h); ctx.fillStyle = c1; for (let k = 0; k < 9; k++) { const a = -Math.PI + k * (Math.PI / 8), sw = Math.sin(t * 1.2 + i + k) * 0.8; for (let s = 0; s <= 9; s++) { const u = s / 9; ctx.fillRect(Math.round(x + Math.cos(a) * w * u * 0.9 + sw * u), Math.round(y - h + Math.sin(a) * w * 0.4 * u + u * u * w * 0.5), 1, 1); } } },
    windmill(ctx, x, y, h, w, c1, c2, t) { const top = y - h, bw = w * 0.5; for (let j = 0; j < h; j++) { const hw = Math.round(bw * (1 - j / h * 0.45)); ctx.fillStyle = j < 4 ? '#6a665c' : (((j / 5) | 0) % 2 ? c1 : shade(c1, 0.93)); ctx.fillRect(x - hw, y - j, hw * 2 + 1, 1); ctx.fillStyle = 'rgba(0,0,30,0.22)'; ctx.fillRect(x + Math.round(hw * 0.35), y - j, Math.max(1, Math.round(hw * 0.65)) + 1, 1); ctx.fillStyle = shade(c1, 1.12); ctx.fillRect(x - hw, y - j, 1, 1); }
      ctx.fillStyle = shade(c1, 0.6); R_(ctx, x - Math.round(bw * 0.7), y - h * 0.5, Math.round(bw * 1.4), 1); R_(ctx, x - 2, y - 7, 4, 7); ctx.fillStyle = '#2a1c14'; R_(ctx, x - 1, y - 6, 2, 6); ctx.fillStyle = '#f4d878'; R_(ctx, x - 1, y - h * 0.62, 2, 2);          // gallery ring, door, window
      ctx.fillStyle = shade(c2, 0.55); for (let j = 0; j < 6; j++) { const hw = Math.round(bw * 0.7 * (1 - j / 6) + 1); ctx.fillRect(x - hw, top - j, hw * 2 + 1, 1); }      // the cap
      const a0 = t * 0.5, hx = x, hy = top - 2, L = w * 1.45; for (let k = 0; k < 4; k++) { const a = a0 + k * Math.PI / 2, ca = Math.cos(a), sa = Math.sin(a); ctx.fillStyle = shade(c2, 0.7); line(ctx, hx, hy, hx + ca * L, hy + sa * L);
        for (let s2 = 4; s2 < L; s2 += 2) { const px = hx + ca * s2, py = hy + sa * s2; ctx.fillStyle = (s2 / 2) % 2 ? c2 : shade(c2, 1.25); for (let q = 1; q <= 4; q++) ctx.fillRect(Math.round(px - sa * q), Math.round(py + ca * q), 1, 1); } ctx.fillStyle = shade(c2, 0.5); line(ctx, hx - sa * 5, hy + ca * 5, hx + ca * L - sa * 5, hy + sa * L + ca * 5); }
      ctx.fillStyle = '#3a2a20'; ctx.fillRect(hx - 1, hy - 1, 3, 3); },
    torii(ctx, x, y, h, w, c1) { const dk = shade(c1, 0.62); for (const s2 of [-1, 1]) { const px = x + s2 * w / 2; ctx.fillStyle = c1; for (let j = 0; j < h; j++) { const hw = j < h * 0.15 ? 2 : 1; ctx.fillRect(px - hw, y - j, hw * 2 + 1, 1); } ctx.fillStyle = dk; ctx.fillRect(px + 1, y - h, 1, h); ctx.fillStyle = '#3a3a40'; ctx.fillRect(px - 3, y - 3, 6, 3); ctx.fillRect(px - 2, y - 4, 4, 1); }
      ctx.fillStyle = '#1a1a20'; for (let k = -w / 2 - 6; k <= w / 2 + 6; k++) { const u = Math.abs(k) / (w / 2 + 6); ctx.fillRect(Math.round(x + k), Math.round(y - h - 2 - u * u * 3), 1, 3); }      // the curved black kasagi
      ctx.fillStyle = c1; for (let k = -w / 2 - 4; k <= w / 2 + 4; k++) { const u = Math.abs(k) / (w / 2 + 4); ctx.fillRect(Math.round(x + k), Math.round(y - h - 5 - u * u * 3), 1, 2); }
      ctx.fillStyle = c1; R_(ctx, x - w / 2, y - h + 6, w, 3); ctx.fillStyle = dk; R_(ctx, x - w / 2, y - h + 8, w, 1); ctx.fillStyle = '#e8c860'; R_(ctx, x - 2, y - h + 10, 4, 5); ctx.fillStyle = '#2a1c14'; R_(ctx, x - 1, y - h + 11, 2, 3); },
    chalet(ctx, x, y, h, w, c1, c2, t, i) { const bw = Math.round(w), x0 = Math.round(x - bw / 2), fh = Math.round(h * 0.28); ctx.fillStyle = '#7a766c'; ctx.fillRect(x0 - 1, y - 3, bw + 2, 3); ctx.fillStyle = '#d8c8a8'; ctx.fillRect(x0, y - 3 - fh, bw, fh); ctx.fillStyle = 'rgba(0,0,30,0.15)'; ctx.fillRect(x0 + (bw * 0.75 | 0), y - 3 - fh, (bw * 0.25 | 0) + 1, fh);
      ctx.fillStyle = c1; ctx.fillRect(x0 - 2, y - 3 - fh * 2, bw + 4, fh); ctx.fillStyle = shade(c1, 0.8); for (let k = 1; k < fh; k += 2) ctx.fillRect(x0 - 2, y - 3 - fh * 2 + k, bw + 4, 1); ctx.fillStyle = '#2a1c14'; ctx.fillRect(x0 - 2, y - 3 - fh - 1, bw + 4, 1); for (let k = 0; k < bw + 4; k += 3) ctx.fillRect(x0 - 2 + k, y - 3 - fh - 3, 1, 3);       // the balcony railing
      const rh = Math.round(h * 0.34); for (let j = 0; j < rh; j++) { const hw = Math.round((bw / 2 + 4) * (1 - j / (rh * 1.15))); ctx.fillStyle = j % 3 === 2 ? shade(c2, 0.78) : c2; ctx.fillRect(x - hw, y - 3 - fh * 2 - j - 1, hw * 2 + 1, 1); } ctx.fillStyle = '#e8e8f0'; ctx.fillRect(x - Math.round(bw * 0.4), y - 3 - fh * 2 - rh + 2, Math.round(bw * 0.8), 1);
      ctx.fillStyle = '#f4d878'; for (const q of [-0.28, 0.14]) { ctx.fillRect(Math.round(x + bw * q), y - 3 - fh * 2 + 2, 3, 3); ctx.fillRect(Math.round(x + bw * q), y - 3 - fh + 2, 3, 3); } ctx.fillStyle = '#2a1c14'; ctx.fillRect(Math.round(x - bw * 0.04), y - 3 - fh * 0.8, 3, Math.round(fh * 0.8)); ctx.fillStyle = '#9a9a98'; ctx.fillRect(Math.round(x + bw * 0.28), y - 3 - fh * 2 - rh + 1, 3, 4); },
    ruin(ctx, x, y, h, w, c1) { ctx.fillStyle = c1; for (let k = 0; k < 4; k++) { const hh = h * (k === 2 ? 0.5 : 1) * (0.85 + (k % 2) * 0.15); R_(ctx, x + k * 6 - 9, y - hh, 3, hh); R_(ctx, x + k * 6 - 10, y - hh - 1, 5, 1); } R_(ctx, x - 10, y - h - 3, 12, 2); },
    reed(ctx, x, y, h, w, c1, c2, t, i) { ctx.fillStyle = c1; const sw = Math.sin(t * 1.5 + i); for (let j = 0; j < h; j++) ctx.fillRect(Math.round(x + sw * (j / h) ** 2 * 2), y - j, 1, 1); ctx.fillStyle = c2; ctx.fillRect(Math.round(x + sw * 2) - 1, y - h - 1, 3, 3); },
    rock(ctx, x, y, h, w, c1, c2) { ctx.fillStyle = c1; blob(ctx, x, y - h * 0.4, w * 0.5, h * 0.4); ctx.fillStyle = c2 || c1; blob(ctx, x - w * 0.12, y - h * 0.55, w * 0.25, h * 0.18); },
    patch(ctx, x, y, h, w, c1, c2, t, i) { for (let k = 0; k < 7; k++) { const px = x + (k - 3) * 3 + (k % 2), py = y - (k * 5) % 4, s = Math.round(Math.sin(t * 1.4 + i + k)); ctx.fillStyle = '#2e5a24'; ctx.fillRect(px, py - 3, 1, 3); ctx.fillStyle = k % 3 ? c1 : c2; ctx.fillRect(px - 1 + s, py - 5, 3, 2); } },
    fence(ctx, x, y, h, w, c1) { ctx.fillStyle = c1; for (let k = 0; k < 6; k++) R_(ctx, x + k * 6, y - h, 1, h); R_(ctx, x, y - h + 2, 31, 1); R_(ctx, x, y - h * 0.4, 31, 1); },
    hut(ctx, x, y, h, w, c1, c2, t, i) { const bw = Math.round(w), bh = Math.round(h * 0.55), x0 = Math.round(x - bw / 2), top = y - bh, rh = Math.round(h * 0.45); ctx.fillStyle = '#7a766c'; ctx.fillRect(x0 - 1, y - 2, bw + 2, 2);
      ctx.fillStyle = c1; ctx.fillRect(x0, top, bw, bh - 2); ctx.fillStyle = shade(c1, 0.86); for (let k = 2; k < bw; k += 3) ctx.fillRect(x0 + k, top, 1, bh - 2); ctx.fillStyle = 'rgba(0,0,30,0.2)'; ctx.fillRect(x0 + bw - Math.round(bw * 0.24), top, Math.round(bw * 0.24), bh - 2);
      for (let j = 0; j < rh; j++) { const hw = Math.round((bw / 2 + 2) * (1 - j / (rh * 1.1))); ctx.fillStyle = j % 3 === 2 ? shade(c2, 0.78) : (j % 3 === 0 ? c2 : shade(c2, 0.9)); ctx.fillRect(x - hw, top - j - 1, hw * 2 + 1, 1); ctx.fillStyle = shade(c2, 1.2); ctx.fillRect(x - hw, top - j - 1, 1, 1); } ctx.fillStyle = shade(c2, 0.55); ctx.fillRect(x0 - 2, top - 1, bw + 4, 1);
      const cx = x0 + Math.round(bw * 0.7); ctx.fillStyle = '#8a8478'; ctx.fillRect(cx, top - rh + 1, 3, 6); ctx.fillStyle = '#5a564c'; ctx.fillRect(cx - 1, top - rh, 5, 1); ctx.fillStyle = 'rgba(220,220,230,0.55)'; for (let k = 0; k < 3; k++) { const u = ((t * 0.35 + k / 3 + i * 0.17) % 1); ctx.globalAlpha = (1 - u) * 0.7; blob(ctx, cx + 1 + Math.sin(u * 6 + k) * 2 + u * 3, top - rh - 2 - u * 12, 1 + u * 2, 1 + u * 1.5); } ctx.globalAlpha = 1;
      ctx.fillStyle = '#2a1c14'; ctx.fillRect(x0 + Math.round(bw * 0.18), top + 3, 3, bh - 5); ctx.fillStyle = '#f4d878'; for (const q of [0.5, 0.74]) { ctx.fillStyle = '#e8e0d0'; ctx.fillRect(x0 + Math.round(bw * q) - 1, top + 2, 4, 4); ctx.fillStyle = '#f4d878'; ctx.fillRect(x0 + Math.round(bw * q), top + 3, 2, 2); } },
    cube(ctx, x, y, h, w, c1, c2, t, i) { const bw = Math.round(w * 0.62), bh = Math.round(h * 0.82), x0 = Math.round(x - w / 2) + Math.round(w * 0.38), sw = Math.round(w * 0.5), sh = Math.round(h * 0.56), sx0 = Math.round(x - w / 2);
      // the smaller block with a blue dome
      ctx.fillStyle = c1; ctx.fillRect(sx0, y - sh, sw, sh); ctx.fillStyle = 'rgba(30,40,90,0.14)'; ctx.fillRect(sx0 + (sw * 0.7 | 0), y - sh, (sw * 0.3 | 0), sh); ctx.fillStyle = c2; for (let j = 0; j < sw / 2; j++) { const hw = Math.round(Math.sqrt(Math.max(0, (sw / 2) ** 2 - j * j))); if (j > sw * 0.34) break; ctx.fillRect(Math.round(sx0 + sw / 2 - hw), y - sh - j - 1, hw * 2, 1); } ctx.fillStyle = '#ffffff'; ctx.fillRect(sx0 + (sw / 2 | 0), y - sh - Math.round(sw * 0.34) - 4, 1, 3); ctx.fillRect(sx0 + (sw / 2 | 0) - 1, y - sh - Math.round(sw * 0.34) - 3, 3, 1); ctx.fillStyle = c2; ctx.fillRect(sx0 + 2, y - sh + 3, 2, 4); ctx.fillRect(sx0 + sw - 5, y - sh + 3, 2, 4); ctx.fillStyle = '#1a2a3a'; ctx.fillRect(sx0 + 2, y - sh + 4, 1, 2); ctx.fillRect(sx0 + sw - 5, y - sh + 4, 1, 2);
      // the main block: flat roof with a parapet, blue door, shuttered windows, steps, bougainvillea
      ctx.fillStyle = c1; ctx.fillRect(x0, y - bh, bw, bh); ctx.fillStyle = 'rgba(30,40,90,0.16)'; ctx.fillRect(x0 + (bw * 0.72 | 0), y - bh, (bw * 0.28 | 0), bh); ctx.fillStyle = '#ffffff'; ctx.fillRect(x0 - 1, y - bh - 1, bw + 2, 2); ctx.fillStyle = 'rgba(0,0,40,0.2)'; ctx.fillRect(x0, y - bh + 1, bw, 1);
      ctx.fillStyle = c2; ctx.fillRect(x0 + (bw * 0.18 | 0), y - Math.round(bh * 0.62), 4, Math.round(bh * 0.62)); ctx.fillStyle = '#c8d4e0'; ctx.fillRect(x0 + (bw * 0.18 | 0) + 3, y - Math.round(bh * 0.3), 1, 1); for (const q of [0.5, 0.72]) { ctx.fillStyle = c2; ctx.fillRect(x0 + Math.round(bw * q) - 2, y - Math.round(bh * 0.78), 2, 6); ctx.fillRect(x0 + Math.round(bw * q) + 3, y - Math.round(bh * 0.78), 2, 6); ctx.fillStyle = '#1a2a3a'; ctx.fillRect(x0 + Math.round(bw * q), y - Math.round(bh * 0.78) + 1, 3, 4); }
      ctx.fillStyle = '#e8e4dc'; ctx.fillRect(x0 + (bw * 0.18 | 0) - 1, y - 1, 6, 1); ctx.fillRect(x0 + (bw * 0.18 | 0) - 2, y, 8, 1); ctx.fillStyle = '#e0408a'; for (let k = 0; k < 9; k++) ctx.fillRect(x0 + bw - 1 - (k % 3), y - bh + 2 + k * 3 % 20, 2, 2); ctx.fillStyle = '#3a8a48'; for (let k = 0; k < 6; k++) ctx.fillRect(x0 + bw - 2 - (k % 2), y - bh + 4 + k * 3, 1, 2); },
    stilt(ctx, x, y, h, w, c1, c2, t, i) { const bw = Math.round(w), x0 = Math.round(x - bw / 2), lh = Math.round(h * 0.3), wh = Math.round(h * 0.3); ctx.fillStyle = '#5a4630'; for (const px of [x0, x0 + (bw / 2 | 0), x0 + bw - 1]) ctx.fillRect(px, y - lh, 2, lh); ctx.fillStyle = '#6a5438'; ctx.fillRect(x0 - 1, y - lh - 1, bw + 2, 2);
      ctx.fillStyle = c1; ctx.fillRect(x0, y - lh - wh - 1, bw, wh); ctx.fillStyle = shade(c1, 0.8); for (let k = 0; k < bw; k += 2) ctx.fillRect(x0 + k, y - lh - wh - 1, 1, wh); for (let k = 0; k < wh; k += 3) ctx.fillRect(x0, y - lh - wh - 1 + k, bw, 1);
      const rh = Math.round(h * 0.42); for (let j = 0; j < rh; j++) { const hw = Math.round((bw / 2 + 3) * (1 - j / (rh * 1.05))); ctx.fillStyle = j % 2 ? c2 : shade(c2, 0.82); ctx.fillRect(x - hw, y - lh - wh - 2 - j, hw * 2 + 1, 1); } ctx.fillStyle = '#2a1c14'; ctx.fillRect(x0 + 2, y - lh - wh + 1, 3, wh - 2); ctx.fillStyle = '#7a5a38'; for (let k = 0; k < lh; k += 2) ctx.fillRect(x0 + bw + 1, y - k, 2, 1); },
    barn(ctx, x, y, h, w, c1, c2) { const bw = Math.round(w), bh = Math.round(h * 0.55), x0 = Math.round(x - bw / 2); ctx.fillStyle = c1; ctx.fillRect(x0, y - bh, bw, bh); ctx.fillStyle = shade(c1, 0.84); for (let k = 2; k < bw; k += 3) ctx.fillRect(x0 + k, y - bh, 1, bh); ctx.fillStyle = 'rgba(0,0,30,0.2)'; ctx.fillRect(x0 + (bw * 0.78 | 0), y - bh, (bw * 0.22 | 0) + 1, bh);
      const rh = Math.round(h * 0.42); for (let j = 0; j < rh; j++) { const f = j / rh, hw = Math.round(bw / 2 * (f < 0.5 ? 1 - f * 0.35 : 0.82 * (1 - (f - 0.5) * 1.7)) + 2); ctx.fillStyle = j % 3 === 2 ? shade(c2, 0.75) : c2; ctx.fillRect(x - hw, y - bh - j - 1, hw * 2 + 1, 1); } ctx.fillStyle = '#f0ece0'; const dw = Math.round(bw * 0.34), dh = Math.round(bh * 0.7); ctx.fillRect(Math.round(x - dw / 2) - 1, y - dh - 1, dw + 2, dh + 1); ctx.fillStyle = '#5a1a14'; ctx.fillRect(Math.round(x - dw / 2), y - dh, dw, dh); ctx.fillStyle = '#f0ece0'; line(ctx, x - dw / 2, y - dh, x + dw / 2, y); line(ctx, x + dw / 2, y - dh, x - dw / 2, y); ctx.fillRect(Math.round(x) - 1, y - dh - Math.round(rh * 0.5), 3, 4);
      const sx = x0 + bw + 6; ctx.fillStyle = '#9aa0a8'; ctx.fillRect(sx - 3, y - Math.round(h * 0.9), 7, Math.round(h * 0.9)); ctx.fillStyle = '#c8ced4'; ctx.fillRect(sx - 3, y - Math.round(h * 0.9), 2, Math.round(h * 0.9)); ctx.fillStyle = '#6a7078'; for (let k = 4; k < h * 0.9; k += 6) ctx.fillRect(sx - 3, y - k, 7, 1); ctx.fillStyle = '#7a8088'; blob(ctx, sx, y - Math.round(h * 0.9), 4, 3); },
    stump(ctx, x, y, h, w, c1) { ctx.fillStyle = c1; R_(ctx, x - w / 2, y - h, w, h); },
  };

  // ---- the scenes
  const SCENES = {
    russia: { sky: [[0, '#4a98e0'], [1, '#d4eaf4']], sun: { x: 384, y: 58, r: 11, c: '#fff8d0', glow: [255, 246, 180] }, clouds: { n: 6, col: '#f4f8fc', shade: '#c8d8e8', sp: 3, y0: 30, y1: 100 },
      layers: [{ col: '#86aac0', base: 148, amp: 7, par: 0.08 }, { col: '#68985a', base: 164, amp: 8, par: 0.22, items: [['pine', 10, 30, 50, 11, '#2a5a38'], ['birch', 9, 26, 40, 14, '#8cb04a', '#ecece0']] }, { col: '#54843a', base: 188, amp: 5, par: 0.5, items: [['oak', 4, 34, 50, 30, '#2e6a2a', '#4a8a38'], ['poplar', 4, 40, 56, 14, '#3a7a30', '#6aa848'], ['willow', 2, 34, 42, 30, '#6a9a48', '#92bc62']] }],
      ground: { y: 214, col: '#46762f' }, grass: ['#2e5a24', '#5a9a3e', '#7ac04a'], flowers: ['#ffd23c', '#c060b0', '#ffffff', '#e83a2a'], parts: 'pollen', pcol: '#fff2a0' },
    alps: { sky: [[0, '#2870d0'], [1, '#c4dcf0']], sun: { x: 90, y: 50, r: 9, c: '#fffbe8', glow: [255, 250, 220] }, clouds: { n: 4, col: '#ffffff', shade: '#c8d8ea', sp: 2, y0: 28, y1: 80 },
      layers: [{ col: '#9ab0c8', base: 120, amp: 44, par: 0.05, shape: 'peak', snow: '#f4f8fc', snowY: 100, a: [3, 7] }, { col: '#6c8aa4', base: 146, amp: 34, par: 0.12, shape: 'peak', snow: '#e8f0f8', snowY: 124, a: [4, 9], ph: 1 }, { col: '#5a8a48', base: 176, amp: 8, par: 0.3, items: [['pine', 12, 30, 48, 11, '#1e4a30'], ['chalet', 1, 18, 18, 22, '#8a5a3a', '#b8402a']] }, { col: '#4a7c36', base: 196, amp: 4, par: 0.55 }],
      ground: { y: 218, col: '#3e7030' }, grass: ['#2a5a22', '#58983a', '#78b848'], flowers: ['#ffcc2a', '#8a5ae0', '#ffffff', '#f06aa0'], parts: 'pollen', pcol: '#ffffff' },
    med: { sky: [[0, '#2884dc'], [1, '#f4e8cc']], sun: { x: 360, y: 52, r: 13, c: '#fff4c0', glow: [255, 238, 170] }, clouds: { n: 3, col: '#fbf6ec', shade: '#e0d4bc', sp: 2, y0: 40, y1: 90 },
      layers: [{ col: '#2a78b8', base: 142, amp: 0.8, par: 0.0, a: [1, 2] }, { col: '#c8b078', base: 156, amp: 11, par: 0.14 }, { col: '#a89858', base: 178, amp: 8, par: 0.32, items: [['cypress', 8, 30, 46, 8, '#2a4a2a'], ['olive', 8, 22, 30, 24, '#7a8a5a', '#a8b488'], ['ruin', 1, 22, 22, 10, '#e8dcc0']] }],
      ground: { y: 206, col: '#b8a468' }, grass: ['#a89458', '#c8b468', '#d8c880'], flowers: ['#a050c8', '#ffffff', '#e8d040'], parts: 'pollen', pcol: '#ffe8a0' },
    amazon: { sky: [[0, '#4a98a8'], [1, '#d4ecd8']], sun: null, clouds: { n: 4, col: '#e4f0e8', shade: '#b8d0c0', sp: 2, y0: 26, y1: 70 },
      layers: [{ col: '#5a9a7a', base: 150, amp: 8, par: 0.06 }, { col: '#3e8a58', base: 168, amp: 6, par: 0.18, items: [['jungle', 14, 70, 100, 40, '#2a7a3a', '#4a9a48'], ['palm', 5, 36, 52, 26, '#2e7a3a']] }, { col: '#2a6a40', base: 190, amp: 5, par: 0.45, items: [['jungle', 7, 90, 120, 52, '#1e6a30', '#3a8a40'], ['treefern', 6, 20, 28, 24, '#2a7a38']] }],
      ground: { y: 212, col: '#244a28' }, grass: ['#14401c', '#2a7a34', '#4a9a48'], flowers: ['#e83a2a', '#ff9a1a', '#f06ac8'], parts: 'mist', pcol: '#d8f0dc' },
    borneo: { sky: [[0, '#3a96bc'], [0.7, '#e4eed0'], [1, '#f4e0a8']], sun: { x: 120, y: 120, r: 15, c: '#ffe8a0', glow: [255, 200, 120] }, clouds: { n: 4, col: '#f4f4e4', shade: '#d4d8c0', sp: 2, y0: 24, y1: 80 },
      layers: [{ col: '#7aa0a8', base: 138, amp: 30, par: 0.05, shape: 'peak', a: [3, 7] }, { col: '#4a8a5a', base: 168, amp: 6, par: 0.16, items: [['jungle', 12, 80, 110, 44, '#2a7a3a', '#58a048'], ['palm', 5, 32, 44, 26, '#2e8a3a']] }, { col: '#2e6a3a', base: 192, amp: 5, par: 0.4, items: [['jungle', 5, 96, 130, 56, '#1e6a30', '#3a8a40'], ['treefern', 6, 18, 26, 22, '#2a7a38']] }],
      ground: { y: 212, col: '#2a5a2a' }, grass: ['#1a4a20', '#38883a', '#58a448'], flowers: ['#e8301a', '#ff6a8a', '#ffb02a'], parts: 'mist', pcol: '#e4f4d8' },
    kenya: { sky: [[0, '#3a4a98'], [0.55, '#e0784a'], [1, '#f8d890']], sun: { x: 300, y: 150, r: 19, c: '#fff0b0', glow: [255, 170, 90] }, clouds: { n: 3, col: '#f09860', shade: '#b86a48', sp: 2, y0: 40, y1: 100 },
      layers: [{ col: '#a8683a', base: 158, amp: 5, par: 0.05 }, { col: '#8a5230', base: 172, amp: 4, par: 0.15, items: [['acacia', 7, 40, 58, 46, '#2a1c14'], ['baobab', 2, 40, 54, 30, '#3a2a1c', '#2a1c14'], ['mound', 4, 8, 12, 14, '#6a3a28']] }, { col: '#7a4a2a', base: 192, amp: 3, par: 0.4, items: [['acacia', 3, 56, 76, 62, '#1e1410']] }],
      ground: { y: 208, col: '#6a4224' }, grass: ['#8a6a30', '#c8984a', '#e8c070'], flowers: ['#e84a1a', '#ffffff'], parts: 'dust', pcol: '#f4c890' },
    prairie: { sky: [[0, '#3688e4'], [1, '#e4f0f8']], sun: { x: 400, y: 50, r: 10, c: '#fffbe0', glow: [255, 250, 200] }, clouds: { n: 8, col: '#ffffff', shade: '#cfdcea', sp: 4, y0: 24, y1: 120 },
      layers: [{ col: '#9ab88a', base: 160, amp: 5, par: 0.06 }, { col: '#88a858', base: 176, amp: 4, par: 0.2, items: [['windmill', 1, 58, 66, 26, '#d8d0bc', '#8a6a48'], ['oak', 3, 28, 38, 30, '#5a8a3a', '#7aaa4a']] }, { col: '#7a9a48', base: 194, amp: 3, par: 0.5 }],
      ground: { y: 212, col: '#6a9040' }, grass: ['#4a7a2a', '#8aa84a', '#c8c860'], flowers: ['#c060b0', '#ffcc20', '#e87aa0', '#a05ae0'], parts: 'pollen', pcol: '#fff8d0', sway: 2 },
    japan: { sky: [[0, '#5a6ac0'], [0.6, '#e8a8b8'], [1, '#f8dcc8']], sun: { x: 120, y: 112, r: 12, c: '#fff4e0', glow: [255, 196, 190] }, clouds: { n: 3, col: '#f8d8dc', shade: '#d8a8b8', sp: 2, y0: 40, y1: 90 },
      layers: [{ col: '#6a78a8', base: 124, amp: 58, par: 0.0, shape: 'cone', cx: 320, w: 120, detail: 'fuji', snowY: 100 }, { col: '#587a68', base: 166, amp: 8, par: 0.15, items: [['bamboo', 8, 40, 60, 12, '#4a8a4a', '#6aa858']] }, { col: '#486a54', base: 192, amp: 5, par: 0.4, items: [['broad', 5, 36, 54, 30, '#c8402a', '#e88a2a'], ['sakura', 4, 34, 48, 30, '#e88aa8', '#ffc0d4'], ['torii', 1, 34, 34, 26, '#c82a1c']] }],
      ground: { y: 214, col: '#3c5a42' }, grass: ['#2a4a30', '#4a7a4a', '#6a9a58'], flowers: ['#f06aa0', '#ffffff', '#c06ae0'], parts: 'petals', pcol: '#ffc0d4' },
    bog: { custom: true },
    papua: { sky: [[0, '#2a5a78'], [0.6, '#d89a68'], [1, '#f8d098']], sun: { x: 90, y: 128, r: 13, c: '#ffe8b0', glow: [255, 190, 120] }, clouds: { n: 3, col: '#e8b890', shade: '#b88868', sp: 2, y0: 34, y1: 90 },
      layers: [{ col: '#4a3a44', base: 118, amp: 66, par: 0.0, shape: 'cone', cx: 340, w: 100, volcano: true, detail: 'volcano' }, { col: '#2e5a4a', base: 160, amp: 8, par: 0.1 }, { col: '#245a3a', base: 176, amp: 6, par: 0.22, items: [['jungle', 12, 70, 100, 40, '#1e5a30', '#3a8a40'], ['treefern', 8, 22, 30, 24, '#2a7a3a']] }, { col: '#1a4a2a', base: 196, amp: 5, par: 0.45, items: [['treefern', 7, 28, 40, 32, '#2e8a40'], ['jungle', 4, 100, 130, 50, '#164a28', '#2a7a38']] }],
      ground: { y: 214, col: '#18382a' }, grass: ['#0e2e1c', '#256a36', '#3a8a48'], flowers: ['#e0302a', '#f08a22', '#b058d0'], parts: 'mist', pcol: '#e0d8c8' },
    vietnam: { sky: [[0, '#6aa0c8'], [1, '#eaf0f0']], sun: { x: 380, y: 66, r: 10, c: '#fffbe8', glow: [255, 250, 230] }, clouds: { n: 5, col: '#f4f8fa', shade: '#d0dce2', sp: 2, y0: 26, y1: 100 },
      layers: [{ col: '#b4c6c8', base: 168, amp: 74, par: 0.05, shape: 'karst', a: [4, 9] }, { col: '#8aa6a2', base: 176, amp: 60, par: 0.12, shape: 'karst', a: [5, 7], ph: 2 }, { col: '#6a9a58', base: 186, amp: 6, par: 0.28, items: [['bamboo', 8, 40, 60, 12, '#4a8a4a', '#6aa858'], ['pine', 4, 26, 40, 11, '#2a5a38']] }, { col: '#5a8a3c', terrace: '#d4bc58', base: 200, amp: 5, par: 0.5 }],
      ground: { y: 232, col: '#4a7a32' }, grass: ['#2e5a24', '#5a9a3e', '#8ab04a'], flowers: ['#e0284a', '#ffffff', '#ffcc2a'], parts: 'mist', pcol: '#f4f8f4' },
    chihuahua: { sky: [[0, '#3a7ee0'], [1, '#f2dcb4']], sun: { x: 360, y: 56, r: 13, c: '#fff4d0', glow: [255, 232, 170] }, clouds: { n: 3, col: '#fbf4e4', shade: '#e0d0b0', sp: 2, y0: 30, y1: 80 },
      layers: [{ col: '#9a7a6a', base: 148, amp: 36, par: 0.05, shape: 'peak', a: [3, 8] }, { col: '#b08a64', base: 168, amp: 10, par: 0.12, shape: 'mesa', a: [2, 5] }, { col: '#c4a070', base: 184, amp: 5, par: 0.3, items: [['ocotillo', 6, 26, 40, 2, '#6a7a52', '#e8341c'], ['yucca', 6, 22, 34, 22, '#6a8a4a', '#f4eed6'], ['cactus', 4, 20, 34, 12, '#4a7a4a', '#6a9a5a'], ['bush', 12, 8, 12, 16, '#7a8450', '#9a9a60']] }, { col: '#c8a870', base: 200, amp: 3, par: 0.5, items: [['agave', 8, 14, 20, 30, '#5a8a74', '#7aaa96'], ['bush', 8, 10, 14, 20, '#78824e']] }],
      ground: { y: 218, col: '#c0a068' }, grass: ['#8a7240', '#c8a860', '#e0c880'], flowers: ['#ffc81e', '#f06a22', '#b45ad8'], parts: 'dust', pcol: '#f0d8a8', gravel: true },
  };
  for (const id in SCENES) SCENES[id].id = id;
  // extras per scene: more things on the layers, a lake / river, birds, light shafts and a plant frame in the corners (fcol = dark, mid, light)
  const EX = {
    russia: { add: { 1: [['hut', 2, 30, 38, 28, '#9a6a44', '#7a3a2a'], ['rock', 3, 6, 9, 12, '#8a9098', '#a8b0b6']], 2: [['patch', 8, 6, 6, 10, '#ffd23c', '#c060b0'], ['rock', 3, 6, 9, 12, '#8a9098', '#a8b0b6']] }, lake: { after: 1, h: 9, x0: 20, x1: 300, col: '#5a98c8' }, birds: 5, frame: 'branch', fcol: ['#2a5a24', '#4a8a38', '#7ac04a'], shafts: 2 },
    alps: { add: { 2: [['chalet', 2, 30, 38, 30, '#8a5a3a', '#6a4a3a'], ['rock', 4, 7, 10, 12, '#7a8088', '#a0a8b0']], 3: [['patch', 9, 6, 6, 10, '#ffcc2a', '#8a5ae0']] }, lake: { after: 2, h: 8, x0: 140, x1: 400, col: '#4a88c8' }, birds: 4, frame: 'rocks', fcol: ['#4a5058', '#6a727a', '#8a9a6a'] },
    med: { add: { 2: [['patch', 6, 6, 6, 10, '#a050c8', '#ffffff'], ['rock', 5, 6, 9, 12, '#b8a888', '#d8c8a8'], ['cube', 4, 30, 36, 34, '#f8f4ec', '#3a78c8']] }, birds: 6, frame: 'branch', fcol: ['#5a6a48', '#8a9a68', '#aab888'] },
    amazon: { add: { 2: [['reed', 10, 14, 22, 3, '#3a7a3a', '#8a6a3a']] }, lake: { after: 1, h: 7, x0: 0, x1: 640, col: '#4a8a88' }, frame: 'fern', fcol: ['#0e3a1a', '#1e6a2e', '#3a9a44'], shafts: 4 },
    borneo: { add: { 2: [['reed', 10, 14, 22, 3, '#3a7a3a', '#8a6a3a']] }, lake: { after: 1, h: 6, x0: 0, x1: 640, col: '#4a8a98' }, frame: 'fern', fcol: ['#0e3a1a', '#1e6a2e', '#3a9a44'], shafts: 4 },
    kenya: { add: { 1: [['rock', 5, 6, 10, 14, '#5a3a28', '#7a5438']], 2: [['patch', 5, 6, 6, 10, '#e84a1a', '#ffffff']] }, lake: { after: 1, h: 5, x0: 100, x1: 260, col: '#e09060' }, birds: 5, frame: 'grass', fcol: ['#1e1410', '#3a2418', '#6a4a28'] },
    prairie: { add: { 1: [['fence', 2, 10, 10, 0, '#6a4a30'], ['barn', 1, 38, 44, 48, '#b03a2a', '#4a2a22']], 2: [['patch', 10, 6, 6, 10, '#c060b0', '#ffcc20']] }, lake: { after: 1, h: 6, x0: 300, x1: 440, col: '#6aa0d0' }, birds: 5, frame: 'grass', fcol: ['#3a5a20', '#6a8a38', '#a8b858'] },
    japan: { add: { 1: [['hut', 2, 30, 36, 28, '#d8c8a8', '#4a3a40']], 2: [['patch', 8, 6, 6, 10, '#f06aa0', '#ffffff']] }, lake: { after: 1, h: 8, x0: 60, x1: 560, col: '#7a88c0', dy: 2 }, birds: 3, frame: 'branch', fcol: ['#5a3a30', '#e88aa8', '#ffc0d4'] },
    papua: { add: { 2: [['rock', 4, 7, 10, 12, '#2a2a30', '#4a4a50'], ['reed', 8, 14, 22, 3, '#2a6a3a', '#6a4a3a']] }, lake: { after: 2, h: 5, x0: 0, x1: 640, col: '#2e6a6a' }, frame: 'fern', fcol: ['#0a2a14', '#1a5a28', '#38884a'], shafts: 3 },
    vietnam: { add: { 2: [['stilt', 3, 32, 38, 24, '#a8884e', '#c8a858']], 3: [['patch', 6, 6, 6, 10, '#e0284a', '#ffffff']] }, birds: 4, frame: 'bamboo', fcol: ['#1a4a22', '#3a7a3a', '#6aa858'], shafts: 2 },
    chihuahua: { add: { 2: [['rock', 8, 6, 10, 14, '#8a6a50', '#a8886a'], ['patch', 6, 6, 6, 10, '#ffc81e', '#f06a22']], 3: [['rock', 5, 5, 8, 12, '#8a6a50', '#a8886a']] }, birds: 3, frame: 'cactus', fcol: ['#3a6a44', '#5a9a5a', '#d84a60'] },
  };
  for (const id in EX) { const S = SCENES[id], E = EX[id]; Object.assign(S, E, { add: undefined }); for (const li in E.add || {}) S.layers[li].items = (S.layers[li].items || []).concat(E.add[li]); }
  // the items of every layer are planted once (world x on the periodic layer)
  const FOOT = { pine: 2.2, cypress: 0.9, broad: 1.6, oak: 1.9, poplar: 0.7, willow: 1.6, olive: 1.5, sakura: 1.7, birch: 1.1, jungle: 1.5, acacia: 1.3, palm: 1.2, baobab: 1.2, bamboo: 1.2, treefern: 1.3, windmill: 1.2, torii: 1.3, chalet: 1.3, hut: 1.2, cube: 1.1, stilt: 1.2, barn: 1.9, ruin: 1.4, fence: 1.0, patch: 0.7, rock: 0.8, reed: 0.5, mound: 0.8, bush: 1.0, cactus: 0.8, ocotillo: 0.8, yucca: 1.0, agave: 1.0, mound2: 1 };
  for (const id in SCENES) { const S = SCENES[id]; (S.layers || []).forEach((L, li) => { L.planted = []; const wrapD = (a, b) => { const d = Math.abs(a - b) % PER; return Math.min(d, PER - d); };
    for (const [kind, n, h0, h1, w, c1, c2] of L.items || []) for (let i = 0; i < Math.ceil(n * 1.5); i++) for (let tr = 0; tr < 28; tr++) { const x = hash(li * 31 + i * 7.3 + kind.length + tr * 13.17) * PER, ww = w * (0.8 + hash(i + li) * 0.4), fw = ww * (FOOT[kind] || 1);
      if (L.planted.some(p => wrapD(p.x, x) < (p.fw + fw) * 0.46)) continue; L.planted.push({ kind, x, h: h0 + hash(li * 5 + i * 3.1 + 1) * (h1 - h0), w: ww, fw, c1, c2, i }); break; }
    L.planted.sort((a, b) => a.x - b.x); }); }

  const ids = Object.keys(SCENES); let cur = SCENES[ids[(Math.random() * ids.length) | 0]], last = null;
  function next() { let c; do { c = ids[(Math.random() * ids.length) | 0]; } while (c === last && ids.length > 1); last = c; cur = SCENES[c]; return c; }
  function set(id) { if (SCENES[id]) { last = id; cur = SCENES[id]; } return cur.id; }

  function particles(ctx, sc, t) {
    const k = sc.parts; ctx.fillStyle = sc.pcol;
    if (k === 'petals' || k === 'pollen' || k === 'dust' || k === 'leaves') for (let i = 0; i < (k === 'dust' ? 44 : 30); i++) { const sp = 6 + hash(i) * 14; let x, y;
      if (k === 'petals') { x = (hash(i + 1) * 520 + t * sp * 0.6 + Math.sin(t + i) * 8) % 520 - 20; y = ((hash(i + 2) * 270 + t * sp * 0.8) % 290) - 10; }
      else if (k === 'dust') { x = (hash(i + 1) * 520 + t * (24 + sp)) % 520 - 20; y = 120 + hash(i + 2) * 130 + Math.sin(t * 0.7 + i) * 4; }
      else { x = (hash(i + 1) * 520 + t * sp * 0.4) % 520 - 20; y = 110 + hash(i + 2) * 130 + Math.sin(t * 0.6 + i) * 6; }
      ctx.globalAlpha = k === 'pollen' ? 0.45 + 0.4 * Math.sin(t * 2 + i) : 0.7; ctx.fillRect(Math.round(x), Math.round(y), k === 'petals' ? 2 : 1, 1); }
    if (k === 'mist') for (let i = 0; i < 6; i++) { ctx.globalAlpha = 0.12; const x = ((i * 130 + t * (3 + i)) % 620) - 80, y = 140 + i * 14; ctx.fillRect(Math.round(x), y, 150, 3); ctx.fillRect(Math.round(x + 20), y + 3, 110, 2); }
    ctx.globalAlpha = 1;
  }
  function volcanoSmoke(ctx, L, t) {
    const x = Math.round(L.cx - t * 3 * L.par), top = Math.round(L.base - L.amp * 1.6 * 1.0 + 0);   // above the crater
    ctx.fillStyle = '#a89c98'; for (let i = 0; i < 14; i++) { const u = ((t * 0.18 + i / 14) % 1), y = top - u * 56, xx = x + Math.sin(u * 5 + i) * 6 + u * 28; ctx.globalAlpha = (1 - u) * 0.75; blob(ctx, xx, y, 3 + u * 9, 2 + u * 6); } ctx.globalAlpha = 1;
  }

  function lake(ctx, Lk, t, L, off) {            // the lake lies on the ground of its layer: its top follows the ridge of that layer, so it can never hang in the air
    const c = hex(Lk.col), lt = rgb(mixc(c, [255, 255, 255], 0.35)), dk = rgb(mixc(c, [0, 10, 30], 0.3)), span = Lk.x1 - Lk.x0;
    for (let x = 0; x < SW; x++) { const wx = x + off, u = (((wx - Lk.x0) % PER) + PER) % PER / span; if (u > 1) continue; const hh = Math.max(1, Math.round(Lk.h * Math.pow(Math.sin(Math.PI * u), 0.5))), y0 = Math.round(ridgeY(L, wx)) + 4 + (Lk.dy || 0);
      ctx.fillStyle = rgb(c); ctx.fillRect(x, y0, 1, hh); ctx.fillStyle = dk; ctx.fillRect(x, y0 + hh - 1, 1, 1); ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(x, y0, 1, 1);          // a bright shore line
      if (hash(x * 0.7 + Math.floor(t * 1.5 + x * 0.1)) < 0.06) { ctx.fillStyle = lt; ctx.fillRect(x, y0 + 1 + ((hash(x) * (hh - 1)) | 0), 2, 1); } }
  }
  function birds(ctx, sc, t) {
    if (!sc.birds) return; ctx.fillStyle = sc.id === 'kenya' || sc.id === 'chihuahua' ? '#2a1c14' : '#2a3a48';
    for (let i = 0; i < sc.birds; i++) { const x = ((hash(i + 40) * 560 + t * (10 + hash(i + 41) * 8)) % 560) - 40, y = 36 + hash(i + 42) * 70 + Math.sin(t * 0.8 + i) * 4, f = Math.sin(t * 6 + i * 2) > 0 ? 1 : -1; ctx.fillRect(Math.round(x), Math.round(y), 1, 1); ctx.fillRect(Math.round(x) - 1, Math.round(y) - f, 1, 1); ctx.fillRect(Math.round(x) + 1, Math.round(y) - f, 1, 1); ctx.fillRect(Math.round(x) - 2, Math.round(y) - 2 * f, 1, 1); ctx.fillRect(Math.round(x) + 2, Math.round(y) - 2 * f, 1, 1); }
  }
  function shafts(ctx, sc, t) {
    if (!sc.shafts) return; for (let i = 0; i < sc.shafts; i++) { const x0 = 60 + i * (SW / sc.shafts) + Math.sin(t * 0.3 + i) * 14, w = 18 + (i % 2) * 10; ctx.fillStyle = 'rgba(255,250,200,0.07)'; for (let y = 0; y < 190; y += 2) { const sh = y * 0.35; ctx.fillRect(Math.round(x0 + sh), y, Math.round(w + y * 0.06), 2); } }
  }
  function frame(ctx, sc, t) {
    const f = sc.frame; if (!f) return; const [d, m, l] = sc.fcol;
    if (f === 'fern') for (const side of [-1, 1]) { const bx = side < 0 ? -6 : SW + 6; for (let k = 0; k < 8; k++) { const ang = side < 0 ? -(0.25 + k * 0.17) : -(Math.PI - 0.25 - k * 0.17), Lf = 46 + (k % 3) * 16; for (let s2 = 0; s2 <= Lf; s2 += 1) { const u = s2 / Lf, x = bx + Math.cos(ang) * s2 + Math.sin(t * 1.2 + k + side) * 3 * u * u, y = SH + 4 + Math.sin(ang) * s2 + u * u * Lf * 0.55; ctx.fillStyle = d; ctx.fillRect(Math.round(x), Math.round(y), 2, 1); if (s2 % 4 === 0 && u > 0.1) { ctx.fillStyle = u > 0.6 ? l : m; const ln = Math.round(7 * Math.sin(Math.PI * u)); ctx.fillRect(Math.round(x), Math.round(y) - ln, 1, ln); ctx.fillRect(Math.round(x), Math.round(y) + 1, 1, ln >> 1); } } } }
    else if (f === 'branch') for (const side of [-1, 1]) { const ox = side < 0 ? 0 : SW; for (let s2 = 0; s2 < 130; s2++) { const x = ox + side * s2, y = 4 + s2 * 0.26 + Math.sin(s2 * 0.08) * 4; ctx.fillStyle = sc.id === 'japan' ? '#4a2e28' : '#3a2a1c'; ctx.fillRect(x, Math.round(y), 1, Math.max(1, 4 - (s2 / 40) | 0)); if (s2 % 9 === 0 && s2 > 8) { const sw = Math.sin(t * 1.1 + s2) * 1.5; ctx.fillStyle = m; blob(ctx, x + sw, y + 5, 9, 5); ctx.fillStyle = l; blob(ctx, x - side * 3 + sw, y + 3, 4, 2); ctx.fillStyle = d; blob(ctx, x + side * 4 + sw, y + 9, 4, 2); } } }
    else if (f === 'rocks') for (const side of [-1, 1]) { const bx = side < 0 ? 20 : SW - 20; ctx.fillStyle = d; blob(ctx, bx, SH - 2, 46, 24); ctx.fillStyle = m; blob(ctx, bx - side * 6, SH - 12, 30, 12); ctx.fillStyle = l; blob(ctx, bx - side * 10, SH - 18, 14, 3); ctx.fillStyle = '#3a4a32'; for (let k = 0; k < 7; k++) ctx.fillRect(bx - 30 + k * 9, SH - 22 + (k * 5) % 7, 4, 1); }
    else if (f === 'grass') for (let k = 0; k < 34; k++) { const x = k < 17 ? (k * 5) % 90 : SW - ((k - 17) * 5) % 90, hgt = 44 + (k * 23) % 56, sw = Math.sin(t * 1.4 + k) * 3; ctx.fillStyle = k % 3 ? d : m; for (let y = 0; y < hgt; y++) ctx.fillRect(Math.round(x + sw * (y / hgt) ** 2), SH - y, 1, 1); ctx.fillStyle = l; ctx.fillRect(Math.round(x + sw) - 1, SH - hgt - 2, 3, 4); }
    else if (f === 'bamboo') for (const side of [-1, 1]) for (let k = 0; k < 3; k++) { const bx = side < 0 ? 8 + k * 13 : SW - 12 - k * 13, bh = SH + 10, lean = side * -(6 + k * 4), sw = Math.sin(t * 0.9 + k + side) * 3; culm(ctx, bx, SH + 4, bh, lean, sw, 4, k % 2 ? m : d, l, 22 + k * 3, k * 5 + side, t, false); for (const q of [0.55, 0.75, 0.92]) { const j = bh * q, px = Math.round(bx + lean * Math.pow(q, 1.5) + sw * q * q), s2 = (k + (q > 0.7 ? 1 : 0)) % 2 ? 1 : -1; leafSpray(ctx, px + s2 * 3, SH + 4 - j, s2 > 0 ? -0.25 : Math.PI + 0.25, 16, m, l, k * 7 + q * 5, t); } }
    else if (f === 'cactus') { const pad = (cx, cy, rx, ry, ang, c1, c2, seed) => { const ca = Math.cos(ang), sa = Math.sin(ang); for (let dy = -ry - 2; dy <= ry + 2; dy++) for (let dx = -rx - 2; dx <= rx + 2; dx++) { const u = (dx * ca + dy * sa) / rx, v = (-dx * sa + dy * ca) / ry, d = u * u + v * v + (hash(seed + dx * 3.1 + dy * 1.7) - 0.5) * 0.12; if (d > 1) continue; ctx.fillStyle = d > 0.78 ? c1 : (u + v < -0.2 ? shade(c2, 1.12) : c2); ctx.fillRect(Math.round(cx + dx), Math.round(cy + dy), 1, 1); }
        for (let k = 0; k < 9; k++) { const u = (hash(seed + k) - 0.5) * 1.4, v = (hash(seed + k * 4.1) - 0.5) * 1.4; if (u * u + v * v > 0.8) continue; const px = Math.round(cx + u * rx * ca - v * ry * sa), py = Math.round(cy + u * rx * sa + v * ry * ca); ctx.fillStyle = '#f0e8c0'; ctx.fillRect(px, py, 1, 1); ctx.fillRect(px - 1, py - 1, 1, 1); ctx.fillRect(px + 1, py + 1, 1, 1); ctx.fillStyle = '#6a5a38'; ctx.fillRect(px, py + 1, 1, 1); } };
      // pads grow as a chain: every child is centred on its parent's edge, so they overlap and the base sits on the ground
      const P2 = [[446, SH - 10, 20, 13, 0.1, -1, 0]]; for (const [par, phi, rx, ry, a] of [[0, -2.2, 14, 11, -0.9], [0, -0.9, 13, 10, 0.8], [1, -1.4, 12, 10, -0.3], [2, -1.1, 9, 8, 0.5]]) { const P = P2[par], dd = 0.5 * ((P[2] + P[3]) / 2 + (rx + ry) / 2); P2.push([Math.round(P[0] + Math.cos(phi) * dd), Math.round(P[1] + Math.sin(phi) * dd), rx, ry, a, par, phi]); }
      P2.forEach(([px, py, rx, ry, a], q) => pad(px, py, rx, ry, a, d, m, q * 7.3));
      for (const q of [1, 2, 3, 4]) { const [px, py, , ry] = P2[q], fy = py - ry + 1; ctx.fillStyle = l; blob(ctx, px, fy, 3, 2); ctx.fillStyle = '#ffe070'; ctx.fillRect(px - 1, fy - 1, 3, 1); }
      for (const q of [1, 2]) { const [px, py, rx, , , , phi] = P2[q], fx = Math.round(px + Math.cos(phi) * rx * 0.8), fy = Math.round(py + Math.sin(phi) * rx * 0.5); ctx.fillStyle = '#a82048'; blob(ctx, fx, fy, 2, 3); ctx.fillStyle = '#d84a70'; ctx.fillRect(fx - 1, fy - 2, 1, 2); }
      for (let k = 0; k < 6; k++) { const bx = 6 + k * 5; ctx.fillStyle = '#5a5a40'; for (let y = 0; y < 90 + k * 8; y++) ctx.fillRect(Math.round(bx + Math.sin(k - 2.5) * y * 0.18 + Math.sin(t * 1.2 + k) * (y / 90) * 1.5), SH - y, 1, 1); ctx.fillStyle = '#e8341c'; ctx.fillRect(Math.round(bx + Math.sin(k - 2.5) * (90 + k * 8) * 0.18), SH - 92 - k * 8, 2, 3); } }
  }
  let vigC = null; const vig = () => { if (vigC) return vigC; vigC = document.createElement('canvas'); vigC.width = SW; vigC.height = SH; const g = vigC.getContext('2d'), gr = g.createRadialGradient(SW / 2, SH / 2, SH * 0.5, SW / 2, SH / 2, SW * 0.68); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,10,20,0.32)'); g.fillStyle = gr; g.fillRect(0, 0, SW, SH); return vigC; };
  // draws the scene; false = this scene is the night forest (the caller draws it)
  function draw(ctx, t, dim = 0) {
    const sc = cur; if (sc.custom) return false;
    ctx.imageSmoothingEnabled = false; ctx.drawImage(sky(sc), 0, 0); clouds(ctx, sc, t);
    sc.layers.forEach((L, li) => {
      drawLayer(ctx, L, sc, t);
      if (L.volcano) { const cx = (L.cx - t * 3 * L.par), sx = Math.round(((cx % PER) + PER) % PER); volcanoSmoke(ctx, Object.assign({}, L, { cx: sx + t * 3 * L.par }), t); }
      const off = t * 3 * L.par; for (const it of L.planted || []) { const sx = Math.round((((it.x - off) % PER) + PER) % PER) - 60; if (sx < -50 || sx > SW + 50) continue; const wy = Math.round(ridgeY(L, sx + off)) + 2; if (it.kind !== 'patch' && it.kind !== 'fence') { ctx.fillStyle = 'rgba(0,0,20,0.16)'; ctx.fillRect(sx - Math.round(it.w * 0.35), wy - 1, Math.round(it.w * 0.7), 2); } KINDS[it.kind](ctx, sx, wy, Math.round(it.h), Math.round(it.w), it.c1, it.c2, t, it.i); }
      if (sc.lake && sc.lake.after === li) lake(ctx, sc.lake, t, L, t * 3 * L.par);
    });
    birds(ctx, sc, t);
    // (the lake is painted over the layer it lies after, so the nearer layers cover its shore)
    const G = sc.ground; ctx.fillStyle = G.col; ctx.fillRect(0, G.y, SW, SH - G.y); ctx.fillStyle = rgb(mixc(hex(G.col), [0, 0, 0], 0.18)); ctx.fillRect(0, SH - 28, SW, 28);
    // the foreground: swaying grass, flowers, gravel
    const sw = sc.sway || 1;
    for (let i = 0; i < 150; i++) { const x = (i * 37 + 11) % SW, h = 6 + (i * 13) % 14, s = Math.sin(t * 1.5 + i) * sw; ctx.fillStyle = sc.grass[i % sc.grass.length]; ctx.fillRect(x, SH - h - 4 + (i % 5), 1, h); ctx.fillRect(x + Math.round(s / 2), SH - h - 6 + (i % 5), 1, 3); }
    for (let i = 0; i < 22; i++) { const x = (i * 71 + 23) % SW, h = 14 + (i * 19) % 22, s = Math.round(Math.sin(t * 1.3 + i * 2) * sw * 0.8); ctx.fillStyle = sc.grass[1]; ctx.fillRect(x, SH - h - 4, 1, h); ctx.fillStyle = sc.flowers[i % sc.flowers.length]; ctx.fillRect(x - 1 + s, SH - h - 6, 3, 2); ctx.fillRect(x + s, SH - h - 7, 1, 4); }
    if (sc.gravel) for (let i = 0; i < 70; i++) { ctx.fillStyle = i % 3 ? '#a8885a' : '#e0c890'; ctx.fillRect((i * 53) % SW, 224 + (i * 29) % 40, 2, 1); }
    shafts(ctx, sc, t); frame(ctx, sc, t); particles(ctx, sc, t); ctx.drawImage(vig(), 0, 0);
    if (dim) { ctx.fillStyle = `rgba(0,0,0,${dim})`; ctx.fillRect(0, 0, SW, SH); }
    return true;
  }
  return { draw, next, set, ids, KINDS, get id() { return cur.id; } };
})();
