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
  }

  // ---- plants: each draws itself standing at (x, y) with height h and width w
  const R_ = (ctx, x, y, w, h) => ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  const blob = (ctx, cx, cy, rx, ry) => { for (let j = -ry; j <= ry; j++) { const hw = Math.round(rx * Math.sqrt(1 - (j * j) / (ry * ry + 0.01))); ctx.fillRect(Math.round(cx - hw), Math.round(cy + j), hw * 2 + 1, 1); } };
  const line = (ctx, x0, y0, x1, y1, w = 1) => { const n = Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0)) | 0; for (let i = 0; i <= n; i++) ctx.fillRect(Math.round(x0 + (x1 - x0) * i / (n || 1)), Math.round(y0 + (y1 - y0) * i / (n || 1)), w, w); };
  const shade = (c, k) => rgb(hex(c).map(v => Math.max(0, Math.min(255, v * k))));
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
    agave(ctx, x, y, h, w, c1, c2) { ctx.fillStyle = c1; for (let k = 0; k < 9; k++) { const a = -Math.PI + k * (Math.PI / 8); line(ctx, x, y - 1, x + Math.cos(a) * w * 0.6, y - 1 + Math.sin(a) * h); } ctx.fillStyle = c2 || c1; ctx.fillRect(x, y - 2, 1, 1); },
    bush(ctx, x, y, h, w, c1, c2) { ctx.fillStyle = c1; blob(ctx, x, y - h * 0.4, w * 0.5, h * 0.4); if (c2) { ctx.fillStyle = c2; blob(ctx, x - w * 0.15, y - h * 0.55, w * 0.25, h * 0.2); } },
    bamboo(ctx, x, y, h, w, c1, c2, t, i) { for (let k = 0; k < 3; k++) { const bx = x + k * 3 - 3, bh = h * (0.8 + k * 0.1), sw = Math.sin(t * 1.3 + i + k) * 1.5; ctx.fillStyle = c1; for (let j = 0; j < bh; j++) ctx.fillRect(Math.round(bx + sw * (j / bh) ** 2), y - j, 2, 1); ctx.fillStyle = '#1a3a22'; for (let j = 6; j < bh; j += 7) ctx.fillRect(Math.round(bx + sw * (j / bh) ** 2), y - j, 2, 1); ctx.fillStyle = c2; for (let s = 0; s < 4; s++) line(ctx, bx + sw, y - bh, bx + sw + (s - 1.5) * 4, y - bh + 4 + s % 2 * 2); } },
    jungle(ctx, x, y, h, w, c1, c2, t, i) { const sw = Math.sin(t * 0.8 + i) * 1; ctx.fillStyle = '#3a2c20'; R_(ctx, x - 2, y - h, 4, h); ctx.fillStyle = '#2a2018'; R_(ctx, x + 1, y - h, 1, h); for (const s2 of [-1, 1]) for (let j = 0; j < 12; j++) ctx.fillRect(x + s2 * (2 + j * 0.5) - (s2 < 0 ? 1 : 0), y - 12 + j + (j > 9 ? 0 : 0), 2, 1);       // buttress roots
      crown(ctx, x - w * 0.34 + sw, y - h + 1, w * 0.4, h * 0.075, c1, c2, i * 3 + 1, 0, 0.7); crown(ctx, x + w * 0.34 + sw, y - h + 3, w * 0.4, h * 0.075, c1, c2, i * 3 + 2, 0, 0.7); crown(ctx, x + sw, y - h - 3, w * 0.5, h * 0.09, c1, c2, i * 3 + 3, 0, 0.7);
      ctx.fillStyle = '#1e4a28'; for (let k = 0; k < 6; k++) { const lx = x - w * 0.5 + k * w * 0.2 + sw, ln = 8 + (k * 11 + i * 3) % 22; for (let j = 0; j < ln; j++) ctx.fillRect(Math.round(lx + Math.sin(t * 1.3 + k + j * 0.2) * 0.6), y - h + 3 + j, 1, 1); } },
    treefern(ctx, x, y, h, w, c1, c2, t, i) { ctx.fillStyle = '#3a2c20'; R_(ctx, x - 1, y - h, 2, h); ctx.fillStyle = c1; for (let k = 0; k < 9; k++) { const a = -Math.PI + k * (Math.PI / 8), sw = Math.sin(t * 1.2 + i + k) * 0.8; for (let s = 0; s <= 9; s++) { const u = s / 9; ctx.fillRect(Math.round(x + Math.cos(a) * w * u * 0.9 + sw * u), Math.round(y - h + Math.sin(a) * w * 0.4 * u + u * u * w * 0.5), 1, 1); } } },
    windmill(ctx, x, y, h, w, c1, c2, t) { ctx.fillStyle = c1; for (let j = 0; j < h; j++) { const hw = Math.round(w * 0.5 * (1 - j / h * 0.55)); ctx.fillRect(x - hw, y - j, hw * 2 + 1, 1); } ctx.fillStyle = c2; const a = t * 0.9; for (let k = 0; k < 4; k++) line(ctx, x, y - h, x + Math.cos(a + k * 1.5708) * w * 1.3, y - h + Math.sin(a + k * 1.5708) * w * 1.3); },
    torii(ctx, x, y, h, w, c1) { ctx.fillStyle = c1; R_(ctx, x - w / 2, y - h, 2, h); R_(ctx, x + w / 2 - 2, y - h, 2, h); R_(ctx, x - w / 2 - 3, y - h - 2, w + 6, 2); R_(ctx, x - w / 2, y - h + 5, w, 2); },
    chalet(ctx, x, y, h, w, c1, c2) { ctx.fillStyle = c1; R_(ctx, x - w / 2, y - h * 0.6, w, h * 0.6); ctx.fillStyle = c2; for (let j = 0; j < h * 0.4; j++) { const hw = Math.round(w * 0.62 * (1 - j / (h * 0.4))); ctx.fillRect(x - hw, y - h * 0.6 - j, hw * 2 + 1, 1); } ctx.fillStyle = '#f4d878'; R_(ctx, x - 2, y - h * 0.4, 3, 3); },
    ruin(ctx, x, y, h, w, c1) { ctx.fillStyle = c1; for (let k = 0; k < 4; k++) { const hh = h * (k === 2 ? 0.5 : 1) * (0.85 + (k % 2) * 0.15); R_(ctx, x + k * 6 - 9, y - hh, 3, hh); R_(ctx, x + k * 6 - 10, y - hh - 1, 5, 1); } R_(ctx, x - 10, y - h - 3, 12, 2); },
    reed(ctx, x, y, h, w, c1, c2, t, i) { ctx.fillStyle = c1; const sw = Math.sin(t * 1.5 + i); for (let j = 0; j < h; j++) ctx.fillRect(Math.round(x + sw * (j / h) ** 2 * 2), y - j, 1, 1); ctx.fillStyle = c2; ctx.fillRect(Math.round(x + sw * 2) - 1, y - h - 1, 3, 3); },
    rock(ctx, x, y, h, w, c1, c2) { ctx.fillStyle = c1; blob(ctx, x, y - h * 0.4, w * 0.5, h * 0.4); ctx.fillStyle = c2 || c1; blob(ctx, x - w * 0.12, y - h * 0.55, w * 0.25, h * 0.18); },
    patch(ctx, x, y, h, w, c1, c2, t, i) { for (let k = 0; k < 7; k++) { const px = x + (k - 3) * 3 + (k % 2), py = y - (k * 5) % 4, s = Math.round(Math.sin(t * 1.4 + i + k)); ctx.fillStyle = '#2e5a24'; ctx.fillRect(px, py - 3, 1, 3); ctx.fillStyle = k % 3 ? c1 : c2; ctx.fillRect(px - 1 + s, py - 5, 3, 2); } },
    fence(ctx, x, y, h, w, c1) { ctx.fillStyle = c1; for (let k = 0; k < 6; k++) R_(ctx, x + k * 6, y - h, 1, h); R_(ctx, x, y - h + 2, 31, 1); R_(ctx, x, y - h * 0.4, 31, 1); },
    hut(ctx, x, y, h, w, c1, c2) { ctx.fillStyle = c1; R_(ctx, x - w / 2, y - h * 0.55, w, h * 0.55); ctx.fillStyle = c2; for (let j = 0; j < h * 0.45; j++) { const hw = Math.round(w * 0.65 * (1 - j / (h * 0.45))); ctx.fillRect(x - hw, y - h * 0.55 - j, hw * 2 + 1, 1); } ctx.fillStyle = '#f4d878'; R_(ctx, x - 1, y - h * 0.35, 2, 2); },
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
      layers: [{ col: '#9ab88a', base: 160, amp: 5, par: 0.06 }, { col: '#88a858', base: 176, amp: 4, par: 0.2, items: [['windmill', 1, 40, 40, 11, '#6a5a48', '#d8d0c0'], ['oak', 3, 28, 38, 30, '#5a8a3a', '#7aaa4a']] }, { col: '#7a9a48', base: 194, amp: 3, par: 0.5 }],
      ground: { y: 212, col: '#6a9040' }, grass: ['#4a7a2a', '#8aa84a', '#c8c860'], flowers: ['#c060b0', '#ffcc20', '#e87aa0', '#a05ae0'], parts: 'pollen', pcol: '#fff8d0', sway: 2 },
    japan: { sky: [[0, '#5a6ac0'], [0.6, '#e8a8b8'], [1, '#f8dcc8']], sun: { x: 120, y: 112, r: 12, c: '#fff4e0', glow: [255, 196, 190] }, clouds: { n: 3, col: '#f8d8dc', shade: '#d8a8b8', sp: 2, y0: 40, y1: 90 },
      layers: [{ col: '#6a78a8', base: 124, amp: 58, par: 0.0, shape: 'cone', cx: 320, w: 120, snow: '#f4f4fc', snowY: 98 }, { col: '#587a68', base: 166, amp: 8, par: 0.15, items: [['bamboo', 8, 40, 60, 12, '#4a8a4a', '#6aa858']] }, { col: '#486a54', base: 192, amp: 5, par: 0.4, items: [['broad', 5, 36, 54, 30, '#c8402a', '#e88a2a'], ['sakura', 4, 34, 48, 30, '#e88aa8', '#ffc0d4'], ['torii', 1, 34, 34, 26, '#c82a1c']] }],
      ground: { y: 214, col: '#3c5a42' }, grass: ['#2a4a30', '#4a7a4a', '#6a9a58'], flowers: ['#f06aa0', '#ffffff', '#c06ae0'], parts: 'petals', pcol: '#ffc0d4' },
    bog: { custom: true },
    papua: { sky: [[0, '#2a5a78'], [0.6, '#d89a68'], [1, '#f8d098']], sun: { x: 90, y: 128, r: 13, c: '#ffe8b0', glow: [255, 190, 120] }, clouds: { n: 3, col: '#e8b890', shade: '#b88868', sp: 2, y0: 34, y1: 90 },
      layers: [{ col: '#4a3a44', base: 118, amp: 66, par: 0.0, shape: 'cone', cx: 340, w: 100, volcano: true }, { col: '#2e5a4a', base: 160, amp: 8, par: 0.1 }, { col: '#245a3a', base: 176, amp: 6, par: 0.22, items: [['jungle', 12, 70, 100, 40, '#1e5a30', '#3a8a40'], ['treefern', 8, 22, 30, 24, '#2a7a3a']] }, { col: '#1a4a2a', base: 196, amp: 5, par: 0.45, items: [['treefern', 7, 28, 40, 32, '#2e8a40'], ['jungle', 4, 100, 130, 50, '#164a28', '#2a7a38']] }],
      ground: { y: 214, col: '#18382a' }, grass: ['#0e2e1c', '#256a36', '#3a8a48'], flowers: ['#e0302a', '#f08a22', '#b058d0'], parts: 'mist', pcol: '#e0d8c8' },
    vietnam: { sky: [[0, '#6aa0c8'], [1, '#eaf0f0']], sun: { x: 380, y: 66, r: 10, c: '#fffbe8', glow: [255, 250, 230] }, clouds: { n: 5, col: '#f4f8fa', shade: '#d0dce2', sp: 2, y0: 26, y1: 100 },
      layers: [{ col: '#b4c6c8', base: 168, amp: 74, par: 0.05, shape: 'karst', a: [4, 9] }, { col: '#8aa6a2', base: 176, amp: 60, par: 0.12, shape: 'karst', a: [5, 7], ph: 2 }, { col: '#6a9a58', base: 186, amp: 6, par: 0.28, items: [['bamboo', 8, 40, 60, 12, '#4a8a4a', '#6aa858'], ['pine', 4, 26, 40, 11, '#2a5a38']] }, { col: '#5a8a3c', terrace: '#d4bc58', base: 200, amp: 5, par: 0.5 }],
      ground: { y: 232, col: '#4a7a32' }, grass: ['#2e5a24', '#5a9a3e', '#8ab04a'], flowers: ['#e0284a', '#ffffff', '#ffcc2a'], parts: 'mist', pcol: '#f4f8f4' },
    chihuahua: { sky: [[0, '#3a7ee0'], [1, '#f2dcb4']], sun: { x: 360, y: 56, r: 13, c: '#fff4d0', glow: [255, 232, 170] }, clouds: { n: 3, col: '#fbf4e4', shade: '#e0d0b0', sp: 2, y0: 30, y1: 80 },
      layers: [{ col: '#9a7a6a', base: 148, amp: 36, par: 0.05, shape: 'peak', a: [3, 8] }, { col: '#b08a64', base: 168, amp: 10, par: 0.12, shape: 'mesa', a: [2, 5] }, { col: '#c4a070', base: 184, amp: 5, par: 0.3, items: [['ocotillo', 6, 26, 40, 2, '#6a7a52', '#e8341c'], ['yucca', 6, 22, 34, 22, '#6a8a4a', '#f4eed6'], ['cactus', 4, 20, 34, 12, '#4a7a4a', '#6a9a5a'], ['bush', 12, 8, 12, 16, '#7a8450', '#9a9a60']] }, { col: '#c8a870', base: 200, amp: 3, par: 0.5, items: [['agave', 8, 8, 12, 18, '#5a8a74', '#7aaa96'], ['bush', 8, 10, 14, 20, '#78824e']] }],
      ground: { y: 218, col: '#c0a068' }, grass: ['#8a7240', '#c8a860', '#e0c880'], flowers: ['#ffc81e', '#f06a22', '#b45ad8'], parts: 'dust', pcol: '#f0d8a8', gravel: true },
  };
  for (const id in SCENES) SCENES[id].id = id;
  // extras per scene: more things on the layers, a lake / river, birds, light shafts and a plant frame in the corners (fcol = dark, mid, light)
  const EX = {
    russia: { add: { 1: [['hut', 1, 14, 16, 18, '#8a5a3a', '#6a3a2a'], ['rock', 3, 6, 9, 12, '#8a9098', '#a8b0b6']], 2: [['patch', 8, 6, 6, 10, '#ffd23c', '#c060b0'], ['rock', 3, 6, 9, 12, '#8a9098', '#a8b0b6']] }, lake: { after: 1, y: 176, h: 9, x0: 20, x1: 260, col: '#5a98c8' }, birds: 5, frame: 'branch', fcol: ['#2a5a24', '#4a8a38', '#7ac04a'], shafts: 2 },
    alps: { add: { 2: [['hut', 2, 12, 14, 14, '#9a6a44', '#5a3a2a'], ['rock', 4, 7, 10, 12, '#7a8088', '#a0a8b0']], 3: [['patch', 9, 6, 6, 10, '#ffcc2a', '#8a5ae0']] }, lake: { after: 1, y: 170, h: 8, x0: 130, x1: 390, col: '#4a88c8' }, birds: 4, frame: 'rocks', fcol: ['#4a5058', '#6a727a', '#8a9a6a'] },
    med: { add: { 2: [['patch', 6, 6, 6, 10, '#a050c8', '#ffffff'], ['rock', 5, 6, 9, 12, '#b8a888', '#d8c8a8'], ['hut', 3, 16, 18, 18, '#f4f0e8', '#4a8ac8']] }, birds: 6, frame: 'branch', fcol: ['#5a6a48', '#8a9a68', '#aab888'] },
    amazon: { add: { 2: [['reed', 10, 14, 22, 3, '#3a7a3a', '#8a6a3a']] }, lake: { after: 1, y: 178, h: 7, x0: 0, x1: 480, col: '#4a8a88' }, frame: 'fern', fcol: ['#0e3a1a', '#1e6a2e', '#3a9a44'], shafts: 4 },
    borneo: { add: { 2: [['reed', 10, 14, 22, 3, '#3a7a3a', '#8a6a3a']] }, lake: { after: 1, y: 182, h: 6, x0: 0, x1: 480, col: '#4a8a98' }, frame: 'fern', fcol: ['#0e3a1a', '#1e6a2e', '#3a9a44'], shafts: 4 },
    kenya: { add: { 1: [['rock', 5, 6, 10, 14, '#5a3a28', '#7a5438']], 2: [['patch', 5, 6, 6, 10, '#e84a1a', '#ffffff']] }, lake: { after: 1, y: 180, h: 5, x0: 100, x1: 250, col: '#e09060' }, birds: 5, frame: 'grass', fcol: ['#1e1410', '#3a2418', '#6a4a28'] },
    prairie: { add: { 1: [['fence', 2, 10, 10, 0, '#6a4a30'], ['hut', 1, 18, 20, 24, '#a83a2a', '#6a2a1a']], 2: [['patch', 10, 6, 6, 10, '#c060b0', '#ffcc20']] }, lake: { after: 1, y: 184, h: 5, x0: 300, x1: 430, col: '#6aa0d0' }, birds: 5, frame: 'grass', fcol: ['#3a5a20', '#6a8a38', '#a8b858'] },
    japan: { add: { 1: [['hut', 2, 14, 16, 18, '#c8b898', '#4a3a3a']], 2: [['patch', 8, 6, 6, 10, '#f06aa0', '#ffffff']] }, lake: { after: 1, y: 172, h: 10, x0: 0, x1: 480, col: '#7a88c0' }, birds: 3, frame: 'branch', fcol: ['#5a3a30', '#e88aa8', '#ffc0d4'] },
    papua: { add: { 2: [['rock', 4, 7, 10, 12, '#2a2a30', '#4a4a50'], ['reed', 8, 14, 22, 3, '#2a6a3a', '#6a4a3a']] }, lake: { after: 2, y: 192, h: 5, x0: 0, x1: 480, col: '#2e6a6a' }, frame: 'fern', fcol: ['#0a2a14', '#1a5a28', '#38884a'], shafts: 3 },
    vietnam: { add: { 2: [['hut', 3, 12, 14, 14, '#9a7a4a', '#5a4a2a']], 3: [['patch', 6, 6, 6, 10, '#e0284a', '#ffffff']] }, birds: 4, frame: 'bamboo', fcol: ['#1a4a22', '#3a7a3a', '#6aa858'], shafts: 2 },
    chihuahua: { add: { 2: [['rock', 8, 6, 10, 14, '#8a6a50', '#a8886a'], ['patch', 6, 6, 6, 10, '#ffc81e', '#f06a22']], 3: [['rock', 5, 5, 8, 12, '#8a6a50', '#a8886a']] }, birds: 3, frame: 'cactus', fcol: ['#3a6a44', '#5a9a5a', '#d84a60'] },
  };
  for (const id in EX) { const S = SCENES[id], E = EX[id]; Object.assign(S, E, { add: undefined }); for (const li in E.add || {}) S.layers[li].items = (S.layers[li].items || []).concat(E.add[li]); }
  // the items of every layer are planted once (world x on the periodic layer)
  for (const id in SCENES) { const S = SCENES[id]; (S.layers || []).forEach((L, li) => { L.planted = []; for (const [kind, n, h0, h1, w, c1, c2] of L.items || []) for (let i = 0; i < Math.ceil(n * 1.5); i++) L.planted.push({ kind, x: hash(li * 31 + i * 7.3 + kind.length) * PER, h: h0 + hash(li * 5 + i * 3.1 + 1) * (h1 - h0), w: w * (0.8 + hash(i + li) * 0.4), c1, c2, i }); L.planted.sort((a, b) => a.x - b.x); }); }

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

  function lake(ctx, Lk, t) {
    const c = hex(Lk.col), lt = rgb(mixc(c, [255, 255, 255], 0.35)), dk = rgb(mixc(c, [0, 10, 30], 0.3));
    for (let x = Lk.x0; x < Lk.x1; x++) { const u = (x - Lk.x0) / (Lk.x1 - Lk.x0), hh = Math.max(1, Math.round(Lk.h * Math.pow(Math.sin(Math.PI * u), 0.5))); ctx.fillStyle = rgb(c); ctx.fillRect(x, Lk.y, 1, hh); ctx.fillStyle = dk; ctx.fillRect(x, Lk.y + hh - 1, 1, 1);
      if (hash(x * 0.7 + Math.floor(t * 1.5 + x * 0.1)) < 0.06) { ctx.fillStyle = lt; ctx.fillRect(x, Lk.y + 1 + ((hash(x) * (hh - 1)) | 0), 2, 1); } }
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
    else if (f === 'bamboo') for (const side of [-1, 1]) for (let k = 0; k < 3; k++) { const x = side < 0 ? 8 + k * 14 : SW - 10 - k * 14, sw = Math.sin(t * 1.1 + k + side) * 2; ctx.fillStyle = k % 2 ? m : d; for (let y = 0; y < SH; y++) ctx.fillRect(Math.round(x + sw * (y / SH) ** 2), SH - y, 4, 1); ctx.fillStyle = l; for (let y = 8; y < SH; y += 34) ctx.fillRect(Math.round(x + sw * (y / SH) ** 2), SH - y, 4, 1); ctx.fillStyle = m; for (let q = 0; q < 4; q++) line(ctx, x + sw, 6 + k * 3, x + sw + (q - 1.5) * 12, 18 + q * 3 + k * 4); }
    else if (f === 'cactus') { ctx.fillStyle = d; for (const [px, py, rx, ry] of [[444, SH - 14, 16, 12], [430, SH - 36, 12, 10], [458, SH - 38, 10, 9], [446, SH - 56, 9, 8]]) { blob(ctx, px, py, rx, ry); } ctx.fillStyle = m; for (const [px, py, rx, ry] of [[444, SH - 15, 12, 8], [430, SH - 37, 8, 6], [458, SH - 39, 6, 5], [446, SH - 57, 5, 4]]) blob(ctx, px, py, rx, ry); ctx.fillStyle = '#e8e0b8'; for (let k = 0; k < 22; k++) ctx.fillRect(418 + (k * 13) % 48, SH - 62 + (k * 7) % 56, 1, 1); ctx.fillStyle = l; for (const [px, py] of [[432, SH - 48], [458, SH - 46], [446, SH - 64]]) blob(ctx, px, py, 3, 2);
      for (let k = 0; k < 6; k++) { const bx = 6 + k * 5; ctx.fillStyle = '#5a5a40'; for (let y = 0; y < 90 + k * 8; y++) ctx.fillRect(Math.round(bx + Math.sin(k - 2.5) * y * 0.18 + Math.sin(t * 1.2 + k) * (y / 90) * 1.5), SH - y, 1, 1); ctx.fillStyle = '#e8341c'; ctx.fillRect(Math.round(bx + Math.sin(k - 2.5) * (90 + k * 8) * 0.18), SH - 92 - k * 8, 2, 3); } }
  }
  let vigC = null; const vig = () => { if (vigC) return vigC; vigC = document.createElement('canvas'); vigC.width = SW; vigC.height = SH; const g = vigC.getContext('2d'), gr = g.createRadialGradient(SW / 2, SH / 2, SH * 0.5, SW / 2, SH / 2, SW * 0.68); gr.addColorStop(0, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,10,20,0.32)'); g.fillStyle = gr; g.fillRect(0, 0, SW, SH); return vigC; };
  // draws the scene; false = this scene is the night forest (the caller draws it)
  function draw(ctx, t, dim = 0) {
    const sc = cur; if (sc.custom) return false;
    ctx.imageSmoothingEnabled = false; ctx.drawImage(sky(sc), 0, 0); clouds(ctx, sc, t);
    sc.layers.forEach((L, li) => {
      drawLayer(ctx, L, sc, t);
      if (L.volcano) { const cx = (L.cx - t * 3 * L.par), sx = Math.round(((cx % PER) + PER) % PER); ctx.fillStyle = '#d8582a'; ctx.fillRect(sx - 3, Math.round(L.base - L.amp * 1.6) + 1, 7, 2); volcanoSmoke(ctx, Object.assign({}, L, { cx: sx + t * 3 * L.par }), t); }
      const off = t * 3 * L.par; for (const it of L.planted || []) { const sx = Math.round((((it.x - off) % PER) + PER) % PER) - 60; if (sx < -50 || sx > SW + 50) continue; const wy = Math.round(ridgeY(L, sx + off)) + 2; if (it.kind !== 'patch' && it.kind !== 'fence') { ctx.fillStyle = 'rgba(0,0,20,0.16)'; ctx.fillRect(sx - Math.round(it.w * 0.35), wy - 1, Math.round(it.w * 0.7), 2); } KINDS[it.kind](ctx, sx, wy, Math.round(it.h), Math.round(it.w), it.c1, it.c2, t, it.i); }
      if (sc.lake && sc.lake.after === li) lake(ctx, sc.lake, t);
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
  return { draw, next, set, ids, get id() { return cur.id; } };
})();
