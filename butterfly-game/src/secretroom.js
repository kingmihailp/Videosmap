// ---------------------------------------------------------------- the secret market: five dusty rooms of an old house with curtained windows; a hooded trader sits behind a table (nothing to buy yet).
// Same interface as the Cabinet / Market (App.cab). The geometry comes from SecretMarket.buildGeo(B, G, rng, X), which a test can run with a recording Batch.
const SecretMarket = (() => {
  const c = UIK.col, H = 3.0, TW = 0.2, IX = TW / 2 + 0.02;
  const lam = (col, o = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: col }, o));
  const ctex = (w, h, draw, rx, ry) => { const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; draw(x, w, h); const t = new THREE.CanvasTexture(cv); t.magFilter = t.minFilter = THREE.NearestFilter; t.generateMipmaps = false; if (rx) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry || rx); } return t; };
  const floorTex = (rx, ry, seed) => ctex(64, 64, (x, w, h) => {
    const r = new Rng(seed); for (let i = 0; i < 8; i++) { const g = r.int(-10, 10); x.fillStyle = `rgb(${70 + g},${54 + g},${40 + g})`; x.fillRect(i * 8, 0, 7, h); x.fillStyle = 'rgba(0,0,0,0.45)'; x.fillRect(i * 8 + 7, 0, 1, h); for (let k = 0; k < 4; k++) { x.fillStyle = 'rgba(20,12,6,0.3)'; x.fillRect(i * 8 + r.int(1, 5), r.int(0, 56), 1, r.int(4, 14)); } }
    for (let i = 0; i < 90; i++) { x.fillStyle = r.chance(0.5) ? 'rgba(170,162,148,0.28)' : 'rgba(110,104,94,0.3)'; x.fillRect(r.int(0, 62), r.int(0, 62), r.int(1, 4), r.int(1, 2)); }     // dust and dirt
    for (let i = 0; i < 4; i++) { x.fillStyle = 'rgba(20,14,10,0.35)'; x.fillRect(r.int(0, 56), r.int(0, 60), r.int(4, 9), 2); }
  }, rx, ry);
  const stainTex = seed => ctex(32, 32, (x, w, h) => { const r = new Rng(seed); x.clearRect(0, 0, w, h); for (let i = 0; i < 140; i++) { const a = r.next(); x.fillStyle = `rgba(${150 + (a * 30) | 0},${146 + (a * 30) | 0},${136 + (a * 28) | 0},${0.1 + r.next() * 0.22})`; const px = r.int(2, 28), py = r.int(2, 28); if (Math.hypot(px - 16, py - 16) < 14) x.fillRect(px, py, r.int(1, 4), r.int(1, 3)); } });
  const sigilTex = () => ctex(64, 64, (x, w, h) => { x.clearRect(0, 0, w, h); x.strokeStyle = 'rgba(200,190,170,0.55)'; x.lineWidth = 1; x.beginPath(); x.arc(32, 32, 28, 0, 6.3); x.stroke(); x.beginPath(); x.arc(32, 32, 24, 0, 6.3); x.stroke(); for (let i = 0; i < 5; i++) { const a = i * 4 * Math.PI / 5 - Math.PI / 2, b = (i + 1) * 4 * Math.PI / 5 - Math.PI / 2; x.beginPath(); x.moveTo(32 + Math.cos(a) * 24, 32 + Math.sin(a) * 24); x.lineTo(32 + Math.cos(b) * 24, 32 + Math.sin(b) * 24); x.stroke(); } x.fillStyle = 'rgba(200,190,170,0.55)'; for (let i = 0; i < 12; i++) x.fillRect(32 + Math.cos(i * 0.5236) * 26 - 1, 32 + Math.sin(i * 0.5236) * 26 - 1, 2, 2); });

  const ROOMS = { hall: [-2, 2, 2.5, 5.5], main: [-5.5, 5.5, -3, 2.5], west: [-9.5, -5.5, -3, 2.5], east: [5.5, 9.5, -3, 2.5], study: [-3.5, 3.5, -6.5, -3] };
  const PAPER = { hall: '#4a3a44', main: '#5a3c34', west: '#4a4438', east: '#3c4650', study: '#34443c' };
  const darker = (hex, k) => { const a = hex2rgb(hex); return '#' + a.map(v => Math.max(0, Math.round(v * k)).toString(16).padStart(2, '0')).join(''); };

  function buildGeo(B, G, rng, X) {
    const WOOD = '#4a3626', DW = '#2e2118', LW = '#6a4c34', IRON = '#2a2a30', BR = '#a88840', DUST = '#8c867a', SHEET = '#9a968c';
    const box = (w, h, d, x, y, z, col, rx, ry, rz, j) => B.box(w, h, d, x, y, z, col, rx, ry, rz, j === undefined ? 0.04 : j);
    const col = (x0, x1, z0, z1) => X.cols.push({ x0, x1, z0, z1 });
    const dust = (x, y, z, w, d) => box(w, 0.012, d, x, y + 0.006, z, DUST, 0, 0, 0, 0.1);
    // ---------------------------------------------------------- walls with doors and windows
    const wall = (axis, cc, a0, a1, opens, cA, cB) => {
      if (axis === 'x') { a0 -= TW / 2; a1 += TW / 2; }
      const put = (u0, u1, y0, y1) => {
        const L = u1 - u0, hy = y1 - y0, u = (u0 + u1) / 2, y = (y0 + y1) / 2, full = y0 === 0 && y1 >= H;
        const sk = (side, colr) => { if (!colr) return; const off = side * (TW / 2 + 0.01); if (axis === 'x') box(L, hy, 0.02, u, y, cc + off, colr, 0, 0, 0, 0.05); else box(0.02, hy, L, cc + off, y, u, colr, 0, 0, 0, 0.05); if (full) { const o2 = side * (TW / 2 + 0.0225); if (axis === 'x') { box(L, 0.95, 0.045, u, 0.475, cc + o2, darker(colr, 0.62), 0, 0, 0, 0.04); box(L, 0.05, 0.075, u, 0.97, cc + side * (TW / 2 + 0.0375), darker(colr, 0.45), 0, 0, 0, 0.04); } else { box(0.045, 0.95, L, cc + o2, 0.475, u, darker(colr, 0.62), 0, 0, 0, 0.04); box(0.075, 0.05, L, cc + side * (TW / 2 + 0.0375), 0.97, u, darker(colr, 0.45), 0, 0, 0, 0.04); } } };
        if (axis === 'x') box(L, hy, TW, u, y, cc, '#3a2e26', 0, 0, 0, 0.03); else box(TW, hy, L, cc, y, u, '#3a2e26', 0, 0, 0, 0.03); sk(-1, cA); sk(1, cB);
      };
      const solid = (u0, u1) => { put(u0, u1, 0, H); if (axis === 'x') col(u0, u1, cc - TW / 2, cc + TW / 2); else col(cc - TW / 2, cc + TW / 2, u0, u1); };
      let cur = a0; opens.sort((p, q) => p.c - q.c);
      for (const o of opens) {
        const l = o.c - o.w / 2, r = o.c + o.w / 2; if (l > cur + 0.01) solid(cur, l);
        if (o.y0 > 0) put(l, r, 0, o.y0); put(l, r, o.y1, H);
        const post = (u, hh, y) => { if (axis === 'x') box(0.08, hh, TW + 0.08, u, y, cc, DW, 0, 0, 0, 0.03); else box(TW + 0.08, hh, 0.08, cc, y, u, DW, 0, 0, 0, 0.03); };
        const beam = (u0, u1, y, th) => { if (axis === 'x') box(u1 - u0, th, TW + 0.08, (u0 + u1) / 2, y, cc, DW, 0, 0, 0, 0.03); else box(TW + 0.08, th, u1 - u0, cc, y, (u0 + u1) / 2, DW, 0, 0, 0, 0.03); };
        if (o.win) {
          const hh = o.y1 - o.y0; post(l + 0.04, hh, (o.y0 + o.y1) / 2); post(r - 0.04, hh, (o.y0 + o.y1) / 2); beam(l, r, o.y0 + 0.03, 0.06); beam(l, r, o.y1 - 0.03, 0.06);
          if (axis === 'x') { box(o.w - 0.1, hh - 0.1, 0.03, o.c, (o.y0 + o.y1) / 2, cc, '#0c0e14', 0, 0, 0, 0); box(o.w - 0.08, 0.03, 0.06, o.c, (o.y0 + o.y1) / 2, cc, DW, 0, 0, 0, 0); box(0.03, hh - 0.08, 0.06, o.c, (o.y0 + o.y1) / 2, cc, DW, 0, 0, 0, 0); box(o.w + 0.2, 0.05, TW + 0.16, o.c, o.y0 - 0.025, cc + o.side * 0.04, '#3a2c22'); }
          else { box(0.03, hh - 0.1, o.w - 0.1, cc, (o.y0 + o.y1) / 2, o.c, '#0c0e14', 0, 0, 0, 0); box(0.06, 0.03, o.w - 0.08, cc, (o.y0 + o.y1) / 2, o.c, DW, 0, 0, 0, 0); box(0.06, hh - 0.08, 0.03, cc, (o.y0 + o.y1) / 2, o.c, DW, 0, 0, 0, 0); box(TW + 0.16, 0.05, o.w + 0.2, cc + o.side * 0.04, o.y0 - 0.025, o.c, '#3a2c22'); }
          if (axis === 'x') col(l, r, cc - TW / 2, cc + TW / 2); else col(cc - TW / 2, cc + TW / 2, l, r);
          X.windows.push({ axis, cc, u: o.c, w: o.w, side: o.side });
        } else { post(l - 0.04 + 0.0, o.y1, o.y1 / 2); post(r + 0.04, o.y1, o.y1 / 2); beam(l - 0.08, r + 0.08, o.y1 + 0.04, 0.08); }
        cur = r;
      }
      if (a1 > cur + 0.01) solid(cur, a1);
    };
    const d1 = (cc, w = 1.4) => ({ c: cc, w, y0: 0, y1: 2.2 }), win = (cc, side, w = 1.1) => ({ c: cc, w, y0: 0.9, y1: 2.3, win: true, side });
    wall('x', 2.5, -9.5, 9.5, [d1(0)], PAPER.main, null);                                               // south wall of the rooms; the door of the hall at x = 0
    wall('x', -3, -9.5, 9.5, [d1(0), win(-4.6, 1), win(4.6, 1), win(-7.5, 1), win(7.5, 1)], PAPER.main, PAPER.study);
    wall('z', -5.5, -3, 2.5, [d1(-0.2)], PAPER.west, PAPER.main); wall('z', 5.5, -3, 2.5, [d1(-0.2)], PAPER.main, PAPER.east);
    wall('z', -9.5, -3, 2.5, [win(-0.2, 1)], null, PAPER.west); wall('z', 9.5, -3, 2.5, [win(-0.2, -1)], PAPER.east, null);
    wall('z', -2, 2.5, 5.5, [], null, PAPER.hall); wall('z', 2, 2.5, 5.5, [], PAPER.hall, null); wall('x', 5.5, -2, 2, [d1(0, 1.2)], PAPER.hall, null);
    wall('z', -3.5, -6.5, -3, [], null, PAPER.study); wall('z', 3.5, -6.5, -3, [], PAPER.study, null); wall('x', -6.5, -3.5, 3.5, [win(-1.7, 1), win(1.7, 1)], null, PAPER.study);
    // the exit door in the south wall of the hall (closed)
    box(1.1, 2.15, 0.08, 0, 1.075, 5.46, '#3a281a'); for (const y of [0.4, 1.1, 1.8]) box(1.04, 0.1, 0.02, 0, y, 5.4, IRON); box(0.1, 0.1, 0.06, 0.4, 1.05, 5.4, BR); box(0.05, 0.12, 0.03, 0.4, 1.05, 5.37, IRON);
    // ceilings with beams
    for (const k in ROOMS) { const [x0, x1, z0, z1] = ROOMS[k]; box(x1 - x0 + TW, 0.12, z1 - z0 + TW, (x0 + x1) / 2, H + 0.06, (z0 + z1) / 2, '#2a2018', 0, 0, 0, 0.03); for (let x = x0 + 0.9; x < x1 - 0.4; x += 1.6) box(0.16, 0.2, z1 - z0, x, H - 0.1, (z0 + z1) / 2, '#201710'); }
    // ---------------------------------------------------------- curtains over every window (drawn shut), with rods fixed to the wall
    for (const wn of X.windows) {
      const Lc = wn.w + 0.5, n = Math.round(Lc / 0.14), sw = Lc / n, off = TW / 2 + 0.07, cl = ['#5a1a24', '#3a2a5a', '#2a4a3a', '#5a4a1a'][Math.abs(Math.round(wn.u * 3 + wn.cc)) % 4];
      for (let i = 0; i < n; i++) { const u = wn.u - Lc / 2 + sw * (i + 0.5), dz = (i % 2 ? 0.025 : -0.01); if (wn.axis === 'x') box(sw * 0.96, 1.98, 0.06, u, 1.51, wn.cc + wn.side * (off + dz), i % 3 === 0 ? darker(cl, 0.8) : cl, 0, 0, 0, 0.08); else box(0.06, 1.98, sw * 0.96, wn.cc + wn.side * (off + dz), 1.51, u, i % 3 === 0 ? darker(cl, 0.8) : cl, 0, 0, 0, 0.08); }
      if (wn.axis === 'x') { B.cyl(0.022, 0.022, Lc + 0.2, wn.u, 2.52, wn.cc + wn.side * off, BR, 6, 0, 0, Math.PI / 2); for (const sx of [-1, 1]) box(0.04, 0.04, off - TW / 2 + 0.02, wn.u + sx * (Lc / 2 + 0.05), 2.52, wn.cc + wn.side * (TW / 2 + (off - TW / 2 + 0.02) / 2), BR); }
      else { B.cyl(0.022, 0.022, Lc + 0.2, wn.cc + wn.side * off, 2.52, wn.u, BR, 6, Math.PI / 2, 0, 0); for (const sx of [-1, 1]) box(off - TW / 2 + 0.02, 0.04, 0.04, wn.cc + wn.side * (TW / 2 + (off - TW / 2 + 0.02) / 2), 2.52, wn.u + sx * (Lc / 2 + 0.05), BR); }
      X.leaks.push({ x: wn.axis === 'x' ? wn.u : wn.cc + wn.side * 0.7, z: wn.axis === 'x' ? wn.cc + wn.side * 0.7 : wn.u });
    }
    // ---------------------------------------------------------- helpers for furniture
    const table = (x, z, w, d, h, colr, legs = 0.07) => { box(w, 0.06, d, x, h - 0.03, z, colr); for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(legs, h - 0.06, legs, x + sx * (w / 2 - legs / 2 - 0.02), (h - 0.06) / 2, z + sz * (d / 2 - legs / 2 - 0.02), DW); box(w - 0.2, 0.06, 0.04, x, h - 0.12, z - d / 2 + 0.06, DW); box(w - 0.2, 0.06, 0.04, x, h - 0.12, z + d / 2 - 0.06, DW); col(x - w / 2 - 0.05, x + w / 2 + 0.05, z - d / 2 - 0.05, z + d / 2 + 0.05); dust(x, h, z, w - 0.1, d - 0.1); };
    const chair = (x, z, ry, colr = LW) => { const m = (lx, y, lz, w, h, d, cc) => { const s = Math.sin(ry), c0 = Math.cos(ry); box(w, h, d, x + lx * c0 + lz * s, y, z - lx * s + lz * c0, cc, 0, ry, 0); }; m(0, 0.45, 0, 0.42, 0.05, 0.42, colr); for (const sx of [-1, 1]) for (const sz of [-1, 1]) m(sx * 0.18, 0.21, sz * 0.18, 0.05, 0.42, 0.05, DW); m(0, 0.78, -0.2, 0.42, 0.55, 0.04, colr); for (const sx of [-1, 1]) m(sx * 0.18, 0.78, -0.2, 0.04, 0.6, 0.04, DW); col(x - 0.28, x + 0.28, z - 0.28, z + 0.28); };
    const crate = (x, y, z, s, ry = 0) => { box(s, s, s, x, y + s / 2, z, '#6a4c2c', 0, ry, 0, 0.08); box(s + 0.02, 0.05, s + 0.02, x, y + 0.04, z, '#4a341c', 0, ry, 0); box(s + 0.02, 0.05, s + 0.02, x, y + s - 0.04, z, '#4a341c', 0, ry, 0); };
    const barrel = (x, z, h = 0.9) => { B.cyl(0.32, 0.32, h, x, h / 2, z, '#6a4a2a', 10); for (const y of [0.15, h / 2, h - 0.15]) B.cyl(0.335, 0.335, 0.05, x, y, z, IRON, 10); B.cyl(0.3, 0.3, 0.02, x, h + 0.01, z, '#5a3c20', 10); col(x - 0.36, x + 0.36, z - 0.36, z + 0.36); };
    const sheet = (x, z, w, h, d) => { box(w + 0.08, h + 0.05, d + 0.08, x, (h + 0.05) / 2, z, SHEET, 0, 0, 0, 0.08); box(w + 0.26, 0.3, d + 0.26, x, 0.15, z, '#8e8a80', 0, 0, 0, 0.08); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) box(0.12, h * 0.8, 0.12, x + sx * (w / 2 + 0.1), h * 0.4 + 0.15, z + sz * (d / 2 + 0.1), '#a29e94', 0, 0.3, 0, 0.08); dust(x, h + 0.05, z, w, d); col(x - w / 2 - 0.15, x + w / 2 + 0.15, z - d / 2 - 0.15, z + d / 2 + 0.15); };
    const books = (x0, y, z, n, axis = 'x', dir = 1, depth = 0.22) => { for (let i = 0; i < n; i++) { const bh = 0.2 + rng.next() * 0.14, bw = 0.04 + rng.next() * 0.04, cc = ['#4a1a2a', '#1a2a4a', '#2a4a2a', '#5a4a1a', '#3a2a4a', '#5a2a1a', '#2a3a3a'][(i * 3 + (rng.next() * 3 | 0)) % 7]; if (axis === 'x') { box(bw, bh, depth, x0 + dir * i * 0.075, y + bh / 2, z, cc, 0, 0, 0, 0.1); } else box(depth, bh, bw, x0, y + bh / 2, z + dir * i * 0.075, cc, 0, 0, 0, 0.1); } };
    const jar = (x, y, z, h = 0.2, cc = '#3a5a4a') => { B.cyl(0.07, 0.08, h, x, y + h / 2, z, cc, 8); B.cyl(0.075, 0.075, 0.03, x, y + h + 0.015, z, '#5a3a20', 8); };
    const candle = (x, y, z, lit, h = 0.16) => { B.cyl(0.05, 0.06, 0.02, x, y + 0.01, z, BR, 8); B.cyl(0.028, 0.034, h, x, y + 0.02 + h / 2, z, '#d8ceb0', 7); if (lit) { G.sph(0.026, x, y + 0.02 + h + 0.035, z, '#ffb050', 1, 1.7, 1, 6, 5); X.candles.push({ x, y: y + h + 0.1, z }); } else box(0.01, 0.025, 0.01, x, y + 0.02 + h + 0.012, z, '#1a1410', 0, 0, 0, 0); };
    const web = (px, py, pz, A, Bv, Cv, L = 0.55) => {      // a cobweb in a corner: three threads out of the corner and chords between them
      const P = [px, py, pz], at = (d, t) => [px + d[0] * t, py + d[1] * t, pz + d[2] * t]; for (const d of [A, Bv, Cv]) B.seg(P, at(d, L), 0.006, '#bcbcb4');
      for (const t of [0.22, 0.38, 0.54 * L / 0.55]) { B.seg(at(A, t), at(Bv, t), 0.005, '#c4c4bc'); B.seg(at(Bv, t), at(Cv, t), 0.005, '#c4c4bc'); B.seg(at(A, t), at(Cv, t), 0.005, '#c4c4bc'); }
    };
    // ---------------------------------------------------------- cobwebs in the upper corners of every room
    for (const k in ROOMS) { const [x0, x1, z0, z1] = ROOMS[k]; for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { if (rng.next() < 0.25) continue; const px = sx < 0 ? x0 + IX : x1 - IX, pz = sz < 0 ? z0 + IX : z1 - IX; web(px, H, pz, [-sx, 0, 0], [0, 0, -sz], [0, -1, 0], 0.45 + rng.next() * 0.35); } }
    // ================= the hall (x -2..2, z 2.5..5.5)
    box(2.4, 0.02, 1.4, 0, 0.011, 4.3, '#3a1c24', 0, 0, 0, 0.05); box(2.2, 0.025, 1.2, 0, 0.0125, 4.3, '#52262e', 0, 0, 0, 0.05);                          // runner
    B.cyl(0.04, 0.05, 1.95, -1.5, 0.975, 3.1, DW, 6); B.cyl(0.2, 0.22, 0.06, -1.5, 0.03, 3.1, DW, 8); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + 0.4; box(0.2, 0.04, 0.04, -1.5 + Math.cos(a) * 0.1, 1.82, 3.1 + Math.sin(a) * 0.1, DW, 0, -a, 0); }
    for (const [dx, dz, hh] of [[0.19, 0, 1.15], [-0.17, 0.12, 1.0], [0.0, -0.2, 1.1]]) { box(0.3, hh, 0.1, -1.5 + dx, 1.84 - hh / 2 - 0.03, 3.1 + dz, '#1a1622', 0, 0.4, 0, 0.06); }           // hooded cloaks on the hooks
    col(-1.75, -1.25, 2.85, 3.35);
    box(1.4, 0.07, 0.4, 1.65, 0.45, 4.6, LW); for (const sx of [-1, 1]) box(0.07, 0.42, 0.34, 1.65 + sx * 0.6, 0.21, 4.6, DW); box(1.4, 0.4, 0.05, 1.65, 0.7, 4.8, LW); dust(1.65, 0.485, 4.6, 1.3, 0.35); col(0.9, 2.0, 4.35, 4.95);
    B.cyl(0.14, 0.12, 0.5, -1.55, 0.25, 5.1, IRON, 8); for (const [dx, tilt] of [[-0.05, 0.08], [0.05, -0.06], [0, 0.0]]) B.cyl(0.015, 0.015, 0.9, -1.55 + dx, 0.62, 5.1, '#3a2a1c', 5, 0, 0, tilt); col(-1.75, -1.35, 4.9, 5.3);   // umbrella stand
    table(-1.55, 4.1, 0.5, 0.4, 0.7, WOOD, 0.05); candle(-1.55, 0.72, 4.1, true); col(-1.85, -1.25, 3.85, 4.35);
    box(0.7, 1.0, 0.04, 1.96, 1.55, 3.6, '#3a2c22', 0, 0, 0, 0); box(0.62, 0.92, 0.02, 1.93, 1.55, 3.6, '#4a5258', 0, 0, 0, 0.02);                                   // a dusty mirror on the east wall
    box(0.05, 0.05, 0.5, 1.93, 1.5, 3.6, '#8a8478', 0, 0, 0, 0.1);
    box(0.16, 0.16, 0.16, 0, 2.3, 4.2, IRON, 0, 0.78, 0, 0); B.seg([0, 3.0, 4.2], [0, 2.38, 4.2], 0.02, IRON); G.sph(0.11, 0, 2.15, 4.2, '#ffb868', 1, 1.2, 1, 8, 6); box(0.2, 0.04, 0.2, 0, 2.28, 4.2, IRON); B.seg([0, 2.3, 4.2], [0, 2.26, 4.2], 0.03, IRON);   // hanging lantern
    X.candles.push({ x: 0, y: 2.1, z: 4.2 });
    // ================= the main room (x -5.5..5.5, z -3..2.5): the trader's table, shelves, covered furniture
    box(5.6, 0.02, 3.4, 0, 0.011, -0.2, '#2a1620', 0, 0, 0, 0.05); box(5.3, 0.025, 3.1, 0, 0.0125, -0.2, '#4a2430', 0, 0, 0, 0.05); box(4.4, 0.03, 2.2, 0, 0.0155, -0.2, '#3a1c28', 0, 0, 0, 0.05);
    table(0, -0.95, 3.2, 0.8, 0.96, '#3a2418');                                                                                                                  // the trader's table
    box(3.1, 0.7, 0.03, 0, 0.5, -0.54, '#4a1620', 0, 0, 0, 0.05); for (let i = 0; i < 16; i++) box(0.05, 0.1, 0.02, -1.5 + i * 0.2, 0.13, -0.545, '#a8883a', 0, 0, 0, 0.03); for (const sx of [-1, 1]) box(0.03, 0.7, 0.7, sx * 1.56, 0.5, -0.95, '#4a1620', 0, 0, 0, 0.05);   // tablecloth
    for (let i = 0; i < 4; i++) { box(0.52, 0.04, 0.36, -1.2 + i * 0.58, 0.98, -0.78, '#5a3a22'); box(0.46, 0.012, 0.3, -1.2 + i * 0.58, 1.006, -0.78, '#28123a', 0, 0, 0, 0.02); }   // empty velvet trays
    B.cyl(0.14, 0.17, 0.05, 1.2, 0.985, -1.05, BR, 10); B.cyl(0.02, 0.02, 0.5, 1.2, 1.26, -1.05, BR, 6); box(0.7, 0.03, 0.03, 1.2, 1.52, -1.05, BR); for (const sx of [-1, 1]) { B.seg([1.2 + sx * 0.33, 1.52, -1.05], [1.2 + sx * 0.33, 1.2, -1.05 - 0.05], 0.008, BR); B.cyl(0.11, 0.09, 0.015, 1.2 + sx * 0.33, 1.2, -1.05 - 0.05, BR, 10); }   // balance
    candle(-1.4, 0.96, -1.2, true, 0.2); candle(-1.15, 0.96, -1.05, true, 0.12); box(0.2, 0.05, 0.14, -0.5, 0.985, -1.1, '#4a1a1a'); B.cyl(0.04, 0.045, 0.07, -0.2, 0.995, -1.15, '#1a1a22', 8); B.seg([-0.2, 1.03, -1.15], [-0.12, 1.28, -1.2], 0.008, '#c8c0a8');
    box(0.32, 0.06, 0.24, 0.5, 0.99, -1.15, '#2a1a22'); box(0.3, 0.02, 0.22, 0.5, 1.03, -1.15, '#d8ccb0', 0, 0.1, 0, 0.03); B.cyl(0.035, 0.04, 0.05, -0.8, 0.985, -0.75, BR, 8);
    chair(0, -1.95, Math.PI, '#4a3022');                                                                                                                       // the trader's seat
    for (const sx of [-1, 1]) { const x0 = sx * 2.2; for (let k = 0; k < 4; k++) box(2.0, 0.05, 0.34, x0, 0.4 + k * 0.6, -2.7, WOOD); for (const dx of [-1, 1]) box(0.06, 2.4, 0.34, x0 + dx * 1.0, 1.2, -2.7, DW); box(2.0, 2.4, 0.03, x0, 1.2, -2.86, DW);     // shelves along the north wall
      col(x0 - 1.05, x0 + 1.05, -2.9, -2.5); for (let k = 0; k < 4; k++) { const y = 0.425 + k * 0.6; if (k === 3) { for (let j = 0; j < 5; j++) jar(x0 - 0.8 + j * 0.4, y, -2.7, 0.18, ['#3a5a4a', '#5a3a5a', '#4a4a2a', '#2a3a5a', '#5a4a3a'][j]); } else if (k === 2) books(x0 - 0.9, y, -2.7, 22); else if (k === 1) { for (let j = 0; j < 4; j++) crate(x0 - 0.7 + j * 0.45, y, -2.7, 0.32 + (j % 2) * 0.05); } else for (let j = 0; j < 6; j++) jar(x0 - 0.85 + j * 0.34, y, -2.7, 0.14 + (j % 3) * 0.04); dust(x0, y, -2.7, 1.9, 0.3); } }
    // the chandelier: an octagon ring on three chains
    { const R = 0.55, cy = 2.1, cx = 0, cz = 0.5, pts = []; for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; pts.push([cx + Math.cos(a) * R, cz + Math.sin(a) * R]); } for (let i = 0; i < 8; i++) { const a = pts[i], b = pts[(i + 1) % 8]; B.seg([a[0], cy, a[1]], [b[0], cy, b[1]], 0.04, IRON); }
      for (const i of [0, 3, 6]) B.seg([pts[i][0], cy, pts[i][1]], [cx, H, cz], 0.02, IRON); for (let i = 0; i < 8; i += 1) { B.cyl(0.025, 0.03, 0.14, pts[i][0], cy + 0.09, pts[i][1], '#cfc6aa', 6); } X.candles.push({ x: 0, y: cy - 0.2, z: 0.5 }); }
    sheet(-4.2, 1.7, 1.2, 0.9, 0.7); sheet(4.2, 1.7, 1.2, 0.9, 0.7); sheet(-4.7, -0.6, 0.8, 1.4, 0.8);                                                              // covered furniture
    box(0.6, 2.1, 0.38, 4.8, 1.05, 2.15, '#3a2a1c'); box(0.5, 0.5, 0.32, 4.8, 1.55, 2.2, '#c8c0a8'); B.cyl(0.2, 0.2, 0.02, 4.8, 1.55, 2.0, '#d8d0b8', 14, Math.PI / 2, 0, 0); box(0.012, 0.16, 0.012, 4.8, 1.6, 1.99, '#1a1410'); box(0.1, 0.012, 0.012, 4.83, 1.6, 1.99, '#1a1410'); col(4.45, 5.15, 1.95, 2.4);   // a stopped grandfather clock
    B.cyl(0.18, 0.2, 0.05, -4.9, 0.025, 2.0, DW, 8); B.cyl(0.04, 0.06, 0.9, -4.9, 0.5, 2.0, DW, 6); B.sph(0.33, -4.9, 1.3, 2.0, '#4a6a5a', 1, 1, 1, 12, 9); B.cyl(0.36, 0.36, 0.03, -4.9, 1.3, 2.0, BR, 14, Math.PI / 2, 0, 0.0); col(-5.2, -4.6, 1.7, 2.3);   // a globe on a stand
    crate(4.9, 0, -2.45, 0.55, 0.3); crate(4.35, 0, -2.5, 0.45, -0.2); crate(4.7, 0.55, -2.45, 0.4, 0.1); col(4.0, 5.2, -2.8, -2.1); barrel(-5.0, -2.45); col(-5.4, -4.6, -2.8, -2.0);
    // ================= the west storeroom (x -9.5..-5.5)
    box(3.0, 0.02, 3.4, -7.5, 0.011, -0.2, '#2e2a22', 0, 0, 0, 0.05);
    for (const z of [-2.35, 1.75]) { for (let k = 0; k < 3; k++) box(0.34, 0.05, 1.5, -9.18, 0.4 + k * 0.7, z, WOOD); for (const dz of [-0.72, 0.72]) box(0.34, 2.1, 0.06, -9.18, 1.05, z + dz, DW); box(0.03, 2.1, 1.5, -9.33, 1.05, z, DW); col(-9.4, -8.98, z - 0.78, z + 0.78);
      for (let k = 0; k < 3; k++) { const y = 0.425 + k * 0.7; for (let j = 0; j < 4; j++) { if ((j + k + (z > 0 ? 1 : 0)) % 3 === 0) crate(-9.18, y, z - 0.55 + j * 0.37, 0.3, 0); else jar(-9.18, y, z - 0.55 + j * 0.37, 0.16, ['#3a4a3a', '#4a3a3a', '#3a3a4a'][j % 3]); } dust(-9.18, y - 0.025 + 0.025, z, 0.3, 1.4); } }
    crate(-7.0, 0, -2.3, 0.7, 0.2); crate(-7.0, 0.7, -2.3, 0.55, -0.1); crate(-6.3, 0, -2.4, 0.6, 0.0); crate(-7.8, 0, -2.4, 0.5, 0.4); col(-8.2, -5.9, -2.8, -1.9); barrel(-6.1, 1.9); barrel(-6.1, 1.2, 0.8); barrel(-6.7, 2.0, 0.95); col(-7.1, -5.7, 0.8, 2.3);
    sheet(-7.4, 0.5, 1.0, 1.1, 0.9);
    B.seg([-5.72, 2.0, 2.3], [-5.6, 0.04, 2.1], 0.04, '#6a4a2a'); B.cyl(0.05, 0.1, 0.22, -5.6, 0.11, 2.1, '#8a7a4a', 7);                // a broom leaning on the wall
    B.cyl(0.2, 0.17, 0.28, -6.6, 0.14, -2.5, '#4a4a54', 10); B.seg([-6.78, 0.28, -2.5], [-6.6, 0.55, -2.5], 0.02, IRON); B.seg([-6.42, 0.28, -2.5], [-6.6, 0.55, -2.5], 0.02, IRON);   // a bucket
    for (const [lx, lz] of [[-7.5, -2.0], [-7.5, 1.5]]) { B.seg([lx, H, lz], [lx, 2.4, lz], 0.02, IRON); box(0.2, 0.04, 0.2, lx, 2.38, lz, IRON); G.sph(0.09, lx, 2.28, lz, '#ffa858', 1, 1.2, 1, 8, 6); X.candles.push({ x: lx, y: 2.2, z: lz }); }
    // ================= the east bedroom (x 5.5..9.5)
    box(3.2, 0.02, 3.2, 7.5, 0.011, -0.2, '#26323a', 0, 0, 0, 0.05); box(2.6, 0.025, 2.6, 7.5, 0.0125, -0.2, '#3a2e44', 0, 0, 0, 0.05);
    { const bx = 8.4, bz = -1.25; for (const sx of [-1, 1]) for (const sz of [-1, 1]) box(0.09, 0.5, 0.09, bx + sx * 0.97, 0.25, bz + sz * 0.97, DW); box(1.94, 0.12, 2.06, bx, 0.52, bz, WOOD); box(1.8, 0.2, 1.92, bx, 0.68, bz, '#8a8070', 0, 0, 0, 0.08); box(1.82, 0.04, 1.2, bx, 0.8, bz + 0.35, '#5a3a3a', 0, 0, 0, 0.08); box(0.9, 0.12, 0.4, bx, 0.84, bz - 0.7, '#a89c88', 0, 0, 0, 0.08);
      box(2.0, 0.9, 0.08, bx, 0.7, bz - 1.05, DW); box(0.08, 0.32, 0.08, bx - 0.97, 0.98, bz - 1.05, DW); box(0.08, 0.32, 0.08, bx + 0.97, 0.98, bz - 1.05, DW); dust(bx, 0.9, bz, 1.7, 1.8); col(bx - 1.1, bx + 1.1, bz - 1.15, bz + 1.1); }
    box(0.8, 0.5, 0.45, 8.4, 0.25, 0.35, '#4a3222'); box(0.84, 0.08, 0.5, 8.4, 0.54, 0.35, '#3a2618'); for (const y of [0.2, 0.35]) box(0.82, 0.04, 0.02, 8.4, y, 0.585, IRON); box(0.1, 0.1, 0.03, 8.4, 0.32, 0.6, BR); dust(8.4, 0.58, 0.35, 0.8, 0.45); col(7.95, 8.85, 0.1, 0.62);   // chest at the foot of the bed
    table(6.15, -2.4, 0.5, 0.45, 0.62, WOOD, 0.05); candle(6.15, 0.62, -2.4, false); box(0.2, 0.04, 0.15, 6.2, 0.64, -2.3, '#3a2a4a');
    box(1.1, 2.3, 0.55, 9.1, 1.15, 1.9, '#3a2a1e'); box(0.52, 2.2, 0.02, 8.84, 1.15, 1.61, '#2a1c12'); box(0.52, 2.2, 0.02, 9.38, 1.15, 1.61, '#2a1c12'); box(0.03, 0.2, 0.03, 9.08, 1.15, 1.6, BR); col(8.5, 9.65, 1.6, 2.2);   // wardrobe
    table(6.3, 1.7, 1.2, 0.6, 0.78, WOOD); chair(6.3, 1.0, 0, '#4a3022'); for (let i = 0; i < 3; i++) box(0.3, 0.012, 0.22, 6.05 + i * 0.12, 0.806 + i * 0.012, 1.7, '#d8ccb0', 0, 0.2 * i, 0, 0.02); candle(6.75, 0.78, 1.75, true, 0.12); B.cyl(0.03, 0.035, 0.07, 6.55, 0.815, 1.55, '#1a1a22', 8);
    box(0.7, 1.6, 0.04, 6.8, 0.9, 2.2, DW); box(0.6, 1.45, 0.02, 6.8, 0.9, 2.17, '#4a5258'); for (const sx of [-1, 1]) box(0.05, 0.12, 0.3, 6.8 + sx * 0.28, 0.06, 2.05, DW); col(6.4, 7.2, 1.9, 2.3);   // a standing mirror
    // ================= the study (x -3.5..3.5, z -6.5..-3)
    box(6.4, 0.02, 3.2, 0, 0.011, -4.8, '#262e2a', 0, 0, 0, 0.05);
    for (let k = 0; k < 5; k++) box(0.34, 0.05, 3.0, -3.2, 0.3 + k * 0.52, -4.85, WOOD); for (const dz of [-1, 1]) box(0.34, 2.7, 0.06, -3.2, 1.35, -4.85 + dz * 1.5, DW); box(0.03, 2.7, 3.0, -3.33, 1.35, -4.85, DW); col(-3.38, -3.02, -6.4, -3.3);
    for (let k = 0; k < 5; k++) { books(-3.2, 0.325 + k * 0.52, -6.2, 18, 'z', 1, 0.28); dust(-3.2, 0.325 + k * 0.52 - 0.025 + 0.025, -4.85, 0.3, 2.9); }
    for (let k = 0; k < 4; k++) box(1.2, 0.05, 0.3, 2.45, 0.4 + k * 0.6, -6.3, WOOD); for (const dx of [-1, 1]) box(0.06, 2.4, 0.3, 2.45 + dx * 0.6, 1.2, -6.3, DW); box(1.2, 2.4, 0.03, 2.45, 1.2, -6.4, DW); col(1.82, 3.08, -6.45, -6.1); for (let k = 0; k < 4; k++) books(1.9, 0.425 + k * 0.6, -6.3, 14, 'x', 1, 0.22);
    table(-0.6, -5.2, 1.8, 0.9, 0.78, '#3a2a1c'); chair(-0.6, -4.3, 0, '#4a3022'); for (let i = 0; i < 4; i++) box(0.34, 0.012, 0.24, -1.2 + i * 0.16, 0.806 + i * 0.012, -5.1, '#d8ccb0', 0, 0.35 * i - 0.5, 0, 0.02); candle(0.1, 0.78, -5.4, true, 0.2); B.cyl(0.03, 0.035, 0.07, -0.1, 0.815, -4.95, '#1a1a22', 8);
    // an armillary sphere on the desk: a stand, an axis and three rings made of short segments
    { const ax = -0.05, ay = 0.84, az = -5.35; B.cyl(0.08, 0.1, 0.06, ax, 0.81, az, BR, 10); B.cyl(0.015, 0.015, 0.22, ax, 0.94, az, BR, 6); B.sph(0.05, ax, 1.08, az, '#4a6a8a', 1, 1, 1, 8, 6); for (const tilt of [0, 1.1, 2.2]) { const pts = []; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6; pts.push([ax + Math.cos(a) * 0.17, 1.08 + Math.sin(a) * 0.17 * Math.cos(tilt), az + Math.sin(a) * 0.17 * Math.sin(tilt)]); } for (let i = 0; i < 12; i++) B.seg(pts[i], pts[(i + 1) % 12], 0.012, BR); } }
    // a telescope on a tripod under the north window
    { const tx = 1.2, tz = -5.7; for (const a of [0.3, 2.4, 4.5]) B.seg([tx, 1.0, tz], [tx + Math.cos(a) * 0.4, 0.0, tz + Math.sin(a) * 0.4], 0.03, DW); B.cyl(0.05, 0.05, 0.12, tx, 1.03, tz, BR, 8); B.cyl(0.06, 0.05, 0.9, tx - 0.15, 1.25, tz - 0.2, '#6a5a3a', 8, -0.7, 0, 0); B.cyl(0.075, 0.075, 0.06, tx - 0.15 - 0.0, 1.58, tz - 0.55, BR, 8, -0.7, 0, 0.0); col(tx - 0.45, tx + 0.45, tz - 0.45, tz + 0.45); }
    sheet(2.0, -3.9, 0.8, 0.7, 0.8);
    X.chalk = { x: 0, z: -4.9 };                                  // a sigil on the floor (a textured plane, added by the class)
    for (const [lx, lz] of [[-1.6, -4.3], [1.6, -4.3]]) { B.seg([lx, H, lz], [lx, 2.5, lz], 0.02, IRON); box(0.2, 0.04, 0.2, lx, 2.48, lz, IRON); G.sph(0.09, lx, 2.38, lz, '#c8a8ff', 1, 1.2, 1, 8, 6); X.candles.push({ x: lx, y: 2.3, z: lz, violet: true }); }
  }

  // ------------------------------------------------------------ the room
  class SecretMarket {
    constructor(hooks) {
      this.hooks = hooks; this.ov = null; this.t = 0; this.scene = new THREE.Scene(); this.scene.background = new THREE.Color('#07050a'); this.scene.fog = new THREE.Fog('#07050a', 7, 24);
      this.camera = new THREE.PerspectiveCamera(70, SW / SH, 0.07, 80); this.scene.add(this.camera);
      this.player = { pos: new THREE.Vector3(0, 0, 4.8), yaw: 0, pitch: -0.02, bob: 0, vel: new THREE.Vector2(), stepD: 0, moving: false };
      this.toastT = 0; this.toastText = ''; this.prompt = null; this.stations = [{ id: 'exit', x: 0, z: 4.75, r: 1.6, label: () => 'E — выйти на рынок' }, { id: 'seller', x: 0, z: 0.1, r: 1.8, label: () => 'E — поговорить с торговцем' }];
      this.cols = []; this.build(); Snd.startAmbient('stub'); this.toast('Тайный рынок. Здесь давно никого не было… почти.', 4);
      this.camera.position.set(this.player.pos.x, 1.62, this.player.pos.z);
    }
    toast(s, d = 2.5) { this.toastText = s; this.toastT = d; }
    build() {
      const S = this.scene, rng = new Rng(777), B = new Batch(31), G = new Batch(32), X = { cols: this.cols, windows: [], leaks: [], candles: [] }; this.X = X;
      this.hemi = new THREE.HemisphereLight('#6a5c78', '#2a2028', 1.0); S.add(this.hemi);
      buildGeo(B, G, rng, X); S.add(B.build(lam('#ffffff', { vertexColors: true, side: THREE.DoubleSide }), false)); S.add(G.build(new THREE.MeshBasicMaterial({ vertexColors: true }), false));
      for (const k in ROOMS) { const [x0, x1, z0, z1] = ROOMS[k]; const fl = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0).rotateX(-Math.PI / 2), lam('#ffffff', { map: floorTex((x1 - x0) / 2, (z1 - z0) / 2, 90 + x0 * 3 + z0) })); fl.position.set((x0 + x1) / 2, 0, (z0 + z1) / 2); S.add(fl);
        const ds = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0 - 0.2, z1 - z0 - 0.2).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: stainTex(5 + (x0 | 0)), transparent: true, depthWrite: false, opacity: 0.55 })); ds.position.set((x0 + x1) / 2, 0.035, (z0 + z1) / 2); S.add(ds); }
      const sg = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: sigilTex(), transparent: true, depthWrite: false })); sg.position.set(X.chalk.x, 0.04, X.chalk.z); sg.rotation.y = 0.4; S.add(sg);
      // lights: candles (flicker), the cold strips of light leaking round the curtains
      this.lights = []; const warm = new Set(); X.candles.forEach((cd, i) => { if (i % 2 && !cd.violet) return; const L = new THREE.PointLight(cd.violet ? '#a880ff' : '#ffb068', 1.25, 7, 1.6); L.position.set(cd.x, cd.y, cd.z); S.add(L); this.lights.push({ L, base: 1.25, ph: i * 1.7 }); });
      X.leaks.forEach(lk => { const L = new THREE.PointLight('#6a7a98', 0.5, 4.5, 1.8); L.position.set(lk.x, 1.7, lk.z); S.add(L); this.lights.push({ L, base: 0.5, ph: 0, leak: true }); });
      // the hooded trader sits behind the table
      const p = Market.person({ hood: true, sit: true, body: '#2a2238', skin: '#b8a898', pants: '#14101c' }); p.position.set(0, -0.28, -1.95); p.rotation.y = Math.PI; p.userData.L.forEach(l => { l.scale.y = 0.6; }); p.userData.arms.forEach(a => { a.rotation.x = 1.35; }); S.add(p); this.seller = p;
      // dust floating in the candle light
      const n = 220, pos = new Float32Array(n * 3); this.dust0 = []; for (let i = 0; i < n; i++) { const a = [Math.random() * 18 - 9, Math.random() * 2.6 + 0.2, Math.random() * 11 - 6]; this.dust0.push(a); pos.set(a, i * 3); }
      const dg = new THREE.BufferGeometry(); dg.setAttribute('position', new THREE.BufferAttribute(pos, 3)); this.dust = new THREE.Points(dg, new THREE.PointsMaterial({ color: '#c8c0b0', size: 0.012, transparent: true, opacity: 0.45, depthWrite: false })); S.add(this.dust);
    }
    update(dt, inp) {
      this.t += dt; const P = this.player;
      P.yaw -= inp.dx * 0.0022; P.pitch = clamp(P.pitch - inp.dy * 0.0022, -1.3, 1.3); inp.dx = inp.dy = 0;
      P.yaw += ((inp.keys.has('ArrowLeft') ? 1 : 0) - (inp.keys.has('ArrowRight') ? 1 : 0)) * dt * 1.9; P.pitch = clamp(P.pitch + ((inp.keys.has('ArrowUp') ? 1 : 0) - (inp.keys.has('ArrowDown') ? 1 : 0)) * dt * 1.4, -1.3, 1.3);
      let mx = 0, mz = 0; if (inp.keys.has('KeyW')) mz -= 1; if (inp.keys.has('KeyS')) mz += 1; if (inp.keys.has('KeyA')) mx -= 1; if (inp.keys.has('KeyD')) mx += 1;
      const len = Math.hypot(mx, mz); if (len > 0) { mx /= len; mz /= len; }
      const spd = inp.keys.has('ShiftLeft') ? 3.6 : 2.0; const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw);
      P.vel.x = damp(P.vel.x, (fx * -mz + rx * mx) * spd, 12, dt); P.vel.y = damp(P.vel.y, (fz * -mz + rz * mx) * spd, 12, dt);
      let nx = P.pos.x + P.vel.x * dt, nz = P.pos.z + P.vel.y * dt; const pr = 0.28;
      for (let it = 0; it < 2; it++) for (const k of this.cols) { if (nx > k.x0 - pr && nx < k.x1 + pr && nz > k.z0 - pr && nz < k.z1 + pr) { const l = nx - (k.x0 - pr), r = (k.x1 + pr) - nx, tp = nz - (k.z0 - pr), bt = (k.z1 + pr) - nz; const m = Math.min(l, r, tp, bt); if (m === l) nx = k.x0 - pr; else if (m === r) nx = k.x1 + pr; else if (m === tp) nz = k.z0 - pr; else nz = k.z1 + pr; } }
      const moved = Math.hypot(nx - P.pos.x, nz - P.pos.z); P.pos.x = nx; P.pos.z = nz; P.moving = moved > 0.002; P.bob += moved * 2.1; P.stepD += moved; if (P.stepD > 0.75) { P.stepD = 0; Snd.sfx.step('wood'); }
      this.camera.position.set(P.pos.x, 1.62 + Math.sin(P.bob) * 0.022, P.pos.z); this.camera.rotation.set(P.pitch, P.yaw, 0, 'YXZ');
      this.prompt = this.nearest(); this.toastT = Math.max(0, this.toastT - dt); this.animate(dt);
    }
    nearest() { const P = this.player; let best = null, bd = 1e9; for (const s of this.stations) { const d = Math.hypot(s.x - P.pos.x, s.z - P.pos.z); if (d < s.r && d < bd) { bd = d; best = s; } } return best; }
    animate(dt) {
      const t = this.t; for (const l of this.lights) l.L.intensity = l.base * (l.leak ? 0.9 + Math.sin(t * 0.4) * 0.1 : 0.9 + Math.sin(t * 7.3 + l.ph) * 0.08 + Math.sin(t * 3.1 + l.ph * 2) * 0.06);
      if (this.seller) { const p = this.seller; p.position.y = -0.28 + Math.sin(t * 1.1) * 0.006; p.userData.head.rotation.y = Math.sin(t * 0.35) * 0.22; p.userData.head.rotation.x = 0.1 + Math.sin(t * 0.5) * 0.03; p.userData.arms[0].rotation.x = 1.35 + Math.sin(t * 0.8) * 0.03; p.userData.arms[1].rotation.x = 1.35 + Math.sin(t * 0.8 + 1) * 0.03; }
      if (this.dust) { const p = this.dust.geometry.attributes.position; for (let i = 0; i < this.dust0.length; i++) { const a = this.dust0[i]; p.setXYZ(i, a[0] + Math.sin(t * 0.2 + i) * 0.15, a[1] + Math.sin(t * 0.13 + i * 1.7) * 0.1, a[2] + Math.cos(t * 0.17 + i) * 0.15); } p.needsUpdate = true; }
    }
    open(name) { this.ov = name; this.hooks.unlock(); }
    close() { this.ov = null; this.hooks.lock(); }
    openTalk() { const sp = Secret.speech('inside'); this.talk = { who: 'inside', lines: sp.lines, i: 0, chars: 0 }; this.open('talk'); }
    talkNext() { const T0 = this.talk; if (!T0) return; const len = T0.lines[T0.i].length; if (T0.chars < len) { T0.chars = len; return; } if (T0.i < T0.lines.length - 1) { T0.i++; T0.chars = 0; } else this.close(); }
    interact() { const s = this.prompt; if (!s) return; if (s.id === 'exit') { Snd.sfx.door(); this.hooks.exitSecret(); } else if (s.id === 'seller') { Snd.sfx.page(); this.openTalk(); } }
    key(e) {
      const ov = this.ov;
      if (!ov) { if (e.code === 'KeyE') this.interact(); else if (e.code === 'KeyP' || e.code === 'Escape') { this.ov = 'pause'; this.hooks.unlock(); } return; }
      if (ov === 'talk') { if (e.code === 'Escape') this.close(); else if (e.code === 'KeyE' || e.code === 'Enter' || e.code === 'Space') this.talkNext(); return; }
      if (ov === 'pause' && e.code === 'Escape') { this.ov = null; this.hooks.lock(); }
    }
    pauseButtons() { const x = SW / 2 - 90; return [{ id: 'resume', label: 'Продолжить', x, y: 76, w: 180, h: 20, size: 10 }, { id: 'settings', label: 'Настройки', x, y: 102, w: 88, h: 16 }, { id: 'stash', label: 'Склад (I)', x: x + 92, y: 102, w: 88, h: 16 }, { id: 'exit', label: 'Выйти на рынок', x, y: 126, w: 180, h: 16 }, { id: 'title', label: 'Выход в главное меню', x, y: 148, w: 180, h: 16 }]; }
    click(x, y) {
      if (this.ov === 'talk') { this.talkNext(); return; } if (this.ov !== 'pause') return; const b = this.pauseButtons().find(b => UIK.hit(b, x, y)); if (!b) return; Snd.sfx.click();
      if (b.id === 'resume') { this.ov = null; this.hooks.lock(); } else if (b.id === 'settings') this.hooks.settings(); else if (b.id === 'stash') this.hooks.stash(); else if (b.id === 'exit') this.hooks.exitSecret(); else if (b.id === 'title') this.hooks.title();
    }
    wheel() {}
    draw(ctx, t, m, dt) {
      UIK.panel(ctx, 6, 6, 150, 20, { fill: 'rgba(16,28,24,0.82)', border: c.line }); T.draw(ctx, 'Тайный рынок', 12, 12, { size: 8, color: '#c8a8f0' });
      ctx.fillStyle = 'rgba(255,255,255,0.7)'; ctx.fillRect(SW / 2 - 1, SH / 2 - 1, 2, 2);
      if (this.prompt && !this.ov) { const s = this.prompt.label(), w = T.width(s, 8) + 20; UIK.panel(ctx, SW / 2 - w / 2, SH - 54, w, 18, { fill: 'rgba(16,28,24,0.9)', border: c.gold }); T.draw(ctx, s, SW / 2, SH - 49, { size: 8, align: 'c', color: '#fff' }); }
      if (this.toastT > 0) { ctx.globalAlpha = Math.min(1, this.toastT); T.draw(ctx, this.toastText, SW / 2, 62, { size: 8, align: 'c', color: '#d8c8f0', shadow: '#000' }); ctx.globalAlpha = 1; }
      T.draw(ctx, 'WASD — ходить · мышь — осмотр · E — действие · I — склад · Esc — пауза', 8, SH - 12, { size: 8, color: 'rgba(230,240,220,0.5)', shadow: '#000' });
      if (this.ov === 'talk') { const T0 = this.talk, line = T0.lines[T0.i]; T0.chars = Math.min(line.length, T0.chars + dt * 34); UIK.panel(ctx, 14, 178, 452, 76, { fill: 'rgba(20,14,30,0.95)', border: '#a070e0' }); Portrait.draw(ctx, 'hooded', 24, 189, t, T0.chars < line.length); T.draw(ctx, 'Торговец в капюшоне', 78, 184, { size: 8, color: '#c8a8f0' }); T.para(ctx, line.slice(0, Math.floor(T0.chars)), 78, 198, 376, { size: 10, color: '#f0e8ff', lh: 13 }); T.draw(ctx, T0.chars < line.length ? 'E — пропустить' : 'E — закрыть', 458, 242, { size: 8, align: 'r', color: '#8a78a8' }); }
      if (this.ov === 'pause') { ctx.fillStyle = 'rgba(4,8,8,0.7)'; ctx.fillRect(0, 0, SW, SH); UIK.panel(ctx, SW / 2 - 106, 44, 212, 140, { fill: 'rgba(16,32,28,0.96)', border: c.gold }); T.draw(ctx, 'Пауза', SW / 2, 54, { size: 14, align: 'c', color: c.gold }); this.pauseButtons().forEach(b => UIK.btn(ctx, b, UIK.hit(b, m.x, m.y))); }
    }
    dispose() { Snd.stopAmbient(); this.scene.traverse(o => { if (o.geometry) o.geometry.dispose(); const mt = o.material; if (mt) (Array.isArray(mt) ? mt : [mt]).forEach(x => { if (x.map) x.map.dispose(); x.dispose(); }); }); }
  }
  SecretMarket.buildGeo = buildGeo;
  return SecretMarket;
})();
