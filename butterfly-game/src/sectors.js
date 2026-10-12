// ---------------------------------------------------------------- natural zones (sectors) of a location
// A location is one very large map split into five sectors that adjoin tightly (a random guillotine cut of the square, so they never lie inside each other).
// Every species of the location lives in one sector (31 species = 6+6+6+6+7); a butterfly may fly over a border now and then.
// The layout and the species per sector come from the location's seed only, so every player of a shared place sees the same.
// The whole place is generated anew every hour of real time (Sectors.PERIOD).
const Sectors = (() => {
  const N = 5, EDGE = 0.75;      // EDGE: a trap this close (metres) to a border counts as standing on it
  const COLS = ['#ff6a5c', '#4ec9ff', '#ffd23c', '#7be86a', '#d890ff'], COLS_D = ['#8a2a22', '#1c5878', '#8a7014', '#2e7a26', '#6a3a8a'];
  const DIR = ['Восток', 'Юго-восток', 'Юг', 'Юго-запад', 'Запад', 'Северо-запад', 'Север', 'Северо-восток'];

  function cut(r, n, rng, out) {
    if (n === 1) { out.push(r); return; }
    const k = rng.int(1, n - 1), w = r.x1 - r.x0, h = r.z1 - r.z0;
    const vert = w > h * 1.3 ? true : h > w * 1.3 ? false : rng.chance(0.5);           // cut across the longer side
    const t = clamp(k / n + rng.range(-0.09, 0.09), 0.24, 0.76);
    if (vert) { const x = r.x0 + w * t; cut({ x0: r.x0, z0: r.z0, x1: x, z1: r.z1 }, k, rng, out); cut({ x0: x, z0: r.z0, x1: r.x1, z1: r.z1 }, n - k, rng, out); }
    else { const z = r.z0 + h * t; cut({ x0: r.x0, z0: r.z0, x1: r.x1, z1: z }, k, rng, out); cut({ x0: r.x0, z0: z, x1: r.x1, z1: r.z1 }, n - k, rng, out); }
  }
  const inside = (q, x, z) => x >= q.x0 && x < q.x1 && z >= q.z0 && z < q.z1;
  // does every sector keep a fair share of the round playing field?
  function fair(rects, R) {
    const cnt = rects.map(() => 0); let tot = 0;
    for (let i = 0; i < 28; i++) for (let j = 0; j < 28; j++) { const x = -R + (i + 0.5) / 28 * 2 * R, z = -R + (j + 0.5) / 28 * 2 * R; if (Math.hypot(x, z) > R) continue; tot++; const k = rects.findIndex(q => inside(q, x, z)); if (k >= 0) cnt[k]++; }
    return cnt.every(c => c / tot >= 0.11);
  }
  // the species of a location dealt over the sectors: each gets a mix of common and rare ones; 31 -> 6,6,6,6,7 (the odd ones go to random sectors)
  function deal(list, rng) {
    const n = list.length, base = Math.floor(n / N), size = Array(N).fill(base), order = [0, 1, 2, 3, 4];
    for (let i = N - 1; i > 0; i--) { const j = rng.int(0, i); [order[i], order[j]] = [order[j], order[i]]; }
    for (let k = 0; k < n - base * N; k++) size[order[k]]++;
    const groups = {}; for (const sp of list) (groups[sp.scarce ? 9 : sp.rar || 1] = groups[sp.scarce ? 9 : sp.rar || 1] || []).push(sp);
    const sorted = []; for (const g of Object.keys(groups).sort()) { const a = groups[g].slice(); for (let i = a.length - 1; i > 0; i--) { const j = rng.int(0, i); [a[i], a[j]] = [a[j], a[i]]; } sorted.push(...a); }
    const out = Array.from({ length: N }, () => []); let s = rng.int(0, N - 1);
    for (const sp of sorted) { let guard = 0; while (out[s].length >= size[s] && guard++ < N) s = (s + 1) % N; out[s].push(sp); s = (s + 1) % N; }
    return out;
  }
  function make(biome, seed, R) {
    let rects = null;
    for (let a = 0; a < 60 && !rects; a++) { const rng = new Rng(seed + '-sect' + a), out = []; cut({ x0: -R, z0: -R, x1: R, z1: R }, N, rng, out); if (fair(out, R) || a === 59) rects = out; }
    const rng = new Rng(seed + '-secsp'), sp = deal(biome.species, rng);
    // colours and names; the sectors are numbered from the north-west so the numbers read like a page
    rects.sort((a, b) => (a.z0 + a.z1) * 0.5 + (a.x0 + a.x1) * 0.18 - ((b.z0 + b.z1) * 0.5 + (b.x0 + b.x1) * 0.18));
    const ci = [0, 1, 2, 3, 4]; for (let i = 4; i > 0; i--) { const j = rng.int(0, i); [ci[i], ci[j]] = [ci[j], ci[i]]; }
    const home = {}, rs = rects.map((q, i) => {
      const cx = (q.x0 + q.x1) / 2, cz = (q.z0 + q.z1) / 2, mid = Math.hypot(cx, cz) < R * 0.22, dir = DIR[(Math.round(Math.atan2(cz, cx) / (Math.PI / 4)) + 8) % 8];
      const o = Object.assign({ i, col: COLS[ci[i]], dark: COLS_D[ci[i]], name: mid ? 'Центр' : dir, sp: sp[i] }, q); for (const s of sp[i]) home[s.id] = i; return o;
    });
    const S = { N, R, rects: rs, home, biome: biome.id, species: biome.species };
    S.at = (x, z) => { for (const q of rs) if (inside(q, x, z)) return q.i; let b = 0, bd = 1e9; for (const q of rs) { const dx = Math.max(q.x0 - x, 0, x - q.x1), dz = Math.max(q.z0 - z, 0, z - q.z1), d = dx * dx + dz * dz; if (d < bd) { bd = d; b = q.i; } } return b; };
    S.homeOf = sp => { const v = home[sp.base || sp.id]; return v === undefined ? null : v; };
    // the sectors within m metres of a point (one inside a sector, two on a border, up to four in a corner)
    S.near = (x, z, m = 0) => rs.filter(q => x >= q.x0 - m && x <= q.x1 + m && z >= q.z0 - m && z <= q.z1 + m).map(q => q.i);
    S.trapSector = (x, z) => { const c = S.near(x, z, EDGE); return c.length > 1 ? c[Math.floor(Math.random() * c.length)] : S.at(x, z); };
    return S;
  }
  const label = S => i => `${i + 1} · ${S.rects[i].name}`;

  // ------------------------------------------------------------ the picture of the map (pixel by pixel, cached)
  const cache = new Map();
  // the terrain of the map: shaded relief from the real height field of the landscape, water and banks, forests (every tree collider), a graticule and the rim of the play field on parchment
  const hexRGB = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  function terrain(S, size, world) {
    const key = 'T:' + (world ? world.seedStr : '') + ':' + S.biome + ':' + size; let cv = cache.get(key); if (cv) return cv;
    cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d'), im = c.createImageData(size, size), d = im.data, R = S.R, e = (world && world.env) || {};
    const gnd = (e.ground || ['#6a9a40', '#5a8a38', '#7aaa4a']).map(hexRGB), rock = hexRGB(e.rock || '#8a8a80'), water = hexRGB(e.waterCol || '#4a90c0'), sand = hexRGB(e.sand ? '#dcc890' : '#b8a878'), pap = [226, 208, 160], paper2 = [206, 186, 138];
    const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t], step = 2 * R / size;
    const H = new Float32Array(size * size), W = new Float32Array(size * size).fill(99); let lo = 1e9, hi = -1e9;
    for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) { const x = ((px + 0.5) / size * 2 - 1) * R, z = ((py + 0.5) / size * 2 - 1) * R; if (Math.hypot(x, z) > R) continue; const h = world ? world.heightAt(x, z) : 0, k = py * size + px; H[k] = h; if (world && world.sdf) W[k] = world.sdf(x, z); lo = Math.min(lo, h); hi = Math.max(hi, h); }
    const span = Math.max(1, hi - lo), highland = !!e.highland;
    for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
      const k = py * size + px, o = k * 4, x = ((px + 0.5) / size * 2 - 1) * R, z = ((py + 0.5) / size * 2 - 1) * R, r = Math.hypot(x, z);
      const grain = ((px * 7 + py * 13) % 5) / 5 * 0.05;
      if (r > R) { const t = 1 + grain - 0.03 + (((px >> 1) + (py >> 1)) & 1) * 0.02; d[o] = pap[0] * t; d[o + 1] = pap[1] * t; d[o + 2] = pap[2] * t; d[o + 3] = 255; continue; }
      const h = H[k], hx = px + 1 < size ? H[k + 1] : h, hz = py + 1 < size ? H[k + size] : h, hx0 = px > 0 ? H[k - 1] : h, hz0 = py > 0 ? H[k - size] : h;
      const gx = (hx - hx0) / (2 * step), gz = (hz - hz0) / (2 * step), slope = Math.hypot(gx, gz), shade = Math.max(0.62, Math.min(1.38, 1 - (gx + gz) * 2.4 * (highland ? 0.45 : 1)));
      const t = (h - lo) / span; let col = t < 0.5 ? mix(gnd[0], gnd[1], t * 2) : mix(gnd[1], gnd[2], (t - 0.5) * 2);
      col = mix(col, [236, 226, 190], 0.18 * t);                                              // higher ground is paler, like hypsometric tints
      if (slope > 0.5) col = mix(col, rock, Math.min(0.75, (slope - 0.5) * 1.3));
      if (highland && h < -2) col = mix([216, 230, 236], [190, 212, 224], Math.min(1, (-2 - h) / 30));   // the sea of mist between the islands
      const sd = W[k]; if (sd < 0) col = mix(water, [150, 200, 230], 0.25 + 0.15 * Math.sin((px + py) * 0.9)); else if (sd < 1.6) col = mix(col, sand, 0.7 * (1 - sd / 1.6));
      const sh = sd < 0 ? 1 : shade; d[o] = col[0] * sh; d[o + 1] = col[1] * sh; d[o + 2] = col[2] * sh; d[o + 3] = 255;
    }
    const px2 = (x, z) => [Math.round((x / R + 1) / 2 * size), Math.round((z / R + 1) / 2 * size)], put = (x, y, col) => { if (x < 0 || y < 0 || x >= size || y >= size) return; const o = (y * size + x) * 4; d[o] = col[0]; d[o + 1] = col[1]; d[o + 2] = col[2]; };
    // graticule: faint lines every 50 m
    for (let g = -Math.floor(R / 50) * 50; g <= R; g += 50) { const [gx] = px2(g, 0); for (let y = 0; y < size; y++) { const o = (y * size + gx) * 4; if (Math.hypot(g, ((y + 0.5) / size * 2 - 1) * R) <= R && (y & 3) < 2) { d[o] *= 0.82; d[o + 1] *= 0.82; d[o + 2] *= 0.82; } } for (let x = 0; x < size; x++) { const [, gy] = px2(0, g), o = (gy * size + x) * 4; if (Math.hypot(((x + 0.5) / size * 2 - 1) * R, g) <= R && (x & 3) < 2) { d[o] *= 0.82; d[o + 1] *= 0.82; d[o + 2] *= 0.82; } } }
    // forests and groves: a little tree (dark crown, light top) for every tree of the landscape
    if (world) for (const q of world.colliders) { if (q.r < 0.3) continue; const [tx, ty] = px2(q.x, q.z), big = q.r > 0.9; put(tx, ty, [34, 78, 38]); put(tx + 1, ty, [40, 92, 44]); put(tx, ty - 1, [64, 128, 60]); if (big) { put(tx - 1, ty, [30, 70, 34]); put(tx, ty + 1, [28, 62, 32]); put(tx + 1, ty - 1, [64, 128, 60]); } }
    // the rim of the play field: a double ring with ticks every 10 degrees
    for (let a = 0; a < 3600; a++) { const an = a / 3600 * 6.2832, cx = size / 2 + Math.cos(an) * (size / 2 - 0.6), cy = size / 2 + Math.sin(an) * (size / 2 - 0.6); put(Math.floor(cx), Math.floor(cy), [70, 48, 24]); put(Math.floor(size / 2 + Math.cos(an) * (size / 2 - 2.2)), Math.floor(size / 2 + Math.sin(an) * (size / 2 - 2.2)), [120, 88, 48]); }
    for (let t = 0; t < 36; t++) { const an = t / 36 * 6.2832, L = t % 3 === 0 ? 5 : 3; for (let k = 0; k < L; k++) put(Math.floor(size / 2 + Math.cos(an) * (size / 2 + 1 + k)), Math.floor(size / 2 + Math.sin(an) * (size / 2 + 1 + k)), [70, 48, 24]); }
    c.putImageData(im, 0, 0); cache.set(key, cv); return cv;
  }
  // the zones laid over the terrain: a soft colour wash and dashed borders (the two colours of a shared border alternate along it)
  function mapImage(S, size, hover, world) {
    const key = S.biome + ':' + (world ? world.seedStr : '') + ':' + S.rects.map(q => q.x0.toFixed(1) + q.z0.toFixed(1) + q.x1.toFixed(1)).join() + ':' + size + ':' + hover;
    let cv = cache.get(key); if (cv) return cv;
    if (cache.size > 24) cache.clear();
    cv = document.createElement('canvas'); cv.width = cv.height = size; const c = cv.getContext('2d'); c.drawImage(terrain(S, size, world), 0, 0);
    const im = c.getImageData(0, 0, size, size), d = im.data, R = S.R, sec = new Int8Array(size * size).fill(-1), rgb = S.rects.map(q => hexRGB(q.col));
    for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) { const x = ((px + 0.5) / size * 2 - 1) * R, z = ((py + 0.5) / size * 2 - 1) * R; if (Math.hypot(x, z) <= R - 2.5) sec[py * size + px] = S.at(x, z); }
    for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
      const k = py * size + px, s = sec[k], o = k * 4; if (s < 0) continue;
      const a = hover === s ? 0.42 : hover >= 0 ? 0.1 : 0.2; d[o] += (rgb[s][0] - d[o]) * a; d[o + 1] += (rgb[s][1] - d[o + 1]) * a; d[o + 2] += (rgb[s][2] - d[o + 2]) * a;
      let nb = -1; const r = px + 1 < size ? sec[k + 1] : s, b = py + 1 < size ? sec[k + size] : s, l = px > 0 ? sec[k - 1] : s, u = py > 0 ? sec[k - size] : s;
      if (r >= 0 && r !== s) nb = r; else if (b >= 0 && b !== s) nb = b; else if (l >= 0 && l !== s) nb = l; else if (u >= 0 && u !== s) nb = u;
      if (nb >= 0) { const cc = (((px + py) >> 2) & 1) ? rgb[Math.min(s, nb)] : rgb[Math.max(s, nb)]; d[o] = cc[0]; d[o + 1] = cc[1]; d[o + 2] = cc[2]; }
    }
    c.putImageData(im, 0, 0); cache.set(key, cv); return cv;
  }

  // ------------------------------------------------------------ the menu: map + all species of the location
  const UI = {
    S: null, play: null, hover: -1, hs: null, MAP: { x: 16, y: 44, s: 188 }, cells: [],
    open(play) { this.play = play; this.S = play.sectors; this.hover = -1; this.hs = null; },
    mapPos(x, z) { const m = this.MAP, R = this.S.R; return [m.x + (x / R + 1) / 2 * m.s, m.y + (z / R + 1) / 2 * m.s]; },
    layout() {
      const sp = this.S.species, n = sp.length, cols = 6, cw = 38, chh = 28, x0 = 222, y0 = 44; this.cells = sp.map((s, i) => ({ sp: s, x: x0 + (i % cols) * (cw + 1), y: y0 + Math.floor(i / cols) * (chh + 1), w: cw, h: chh, sec: this.S.home[s.id] }));
      this.cw = cw; this.chh = chh;
    },
    update(mouse) {
      const m = this.MAP, S = this.S; this.hover = -1; this.hs = null;
      if (mouse.x >= m.x && mouse.x < m.x + m.s && mouse.y >= m.y && mouse.y < m.y + m.s) { const x = ((mouse.x - m.x) / m.s * 2 - 1) * S.R, z = ((mouse.y - m.y) / m.s * 2 - 1) * S.R; if (Math.hypot(x, z) <= S.R) this.hover = S.at(x, z); }
      if (this.hover < 0) for (const c of this.cells) if (UIK.hit(c, mouse.x, mouse.y)) { this.hs = c; this.hover = c.sec; break; }
    },
    draw(ctx, t, mouse) {
      const p = this.play, S = this.S, b = p.biome, c = UIK.col, G = id => Save.has(id); this.layout(); this.update(mouse);
      ctx.fillStyle = 'rgba(4,10,8,0.82)'; ctx.fillRect(0, 0, SW, SH);
      UIK.panel(ctx, 6, 6, SW - 12, SH - 12, { fill: 'rgba(16,32,28,0.97)' });
      T.draw(ctx, `Карта местности · ${b.secret ? '???' : b.name}`, 16, 12, { size: 10, color: c.gold });
      const left = Math.max(0, p.regenLeft()); T.draw(ctx, `Местность обновится через ${Traps.mmss(left)}`, SW - 16, 14, { size: 8, align: 'r', color: left < 300 ? c.red : c.dim });
      T.draw(ctx, `Природных зон: ${S.N} · границы показаны пунктиром · наведите курсор на зону или вид`, 16, 29, { size: 8, color: c.dim });
      const m = this.MAP; ctx.imageSmoothingEnabled = false; UIK.panel(ctx, m.x - 4, m.y - 4, m.s + 8, m.s + 8, { fill: '#4a3820', border: '#e4cf94', shadow: false, inner: 'rgba(0,0,0,0)' }); ctx.fillStyle = '#7a5a30'; ctx.fillRect(m.x - 2, m.y - 2, m.s + 4, m.s + 4);
      ctx.drawImage(mapImage(S, m.s, this.hover, this.play.world), m.x, m.y);
      for (const q of S.rects) {          // a banner for every zone: its number and name on a dark plaque with the zone's colour
        const [cx, cy] = this.mapPos((q.x0 + q.x1) / 2, (q.z0 + q.z1) / 2), hot0 = this.hover === q.i, w = hot0 ? Math.min(m.s - 4, T.width(q.name, 8) + 22) : 12, bx = Math.round(cx - w / 2), by = Math.round(cy - 6), hot = this.hover === q.i;
        ctx.fillStyle = 'rgba(30,20,10,0.82)'; ctx.fillRect(bx, by, w, 12); ctx.fillStyle = q.col; ctx.fillRect(bx, by, 12, 12); ctx.fillStyle = hot ? '#fff' : '#e8d8b0'; ctx.fillRect(bx + 12, by, w - 12, 1); ctx.fillRect(bx + 12, by + 11, w - 12, 1); ctx.fillRect(bx + w - 1, by, 1, 12);
        T.draw(ctx, String(q.i + 1), bx + 6, by + 2, { size: 8, align: 'c', color: '#1a1008' }); if (hot) T.draw(ctx, q.name, bx + 16, by + 2, { size: 8, color: '#fff' });
      }
      { const cx = m.x + m.s - 15, cy = m.y + 17, ink = '#3a2812'; ctx.fillStyle = ink;          // the compass rose
        ctx.fillRect(cx, cy - 7, 1, 15); ctx.fillRect(cx - 7, cy, 15, 1); ctx.fillRect(cx - 1, cy - 6, 3, 1); ctx.fillRect(cx - 2, cy - 5, 5, 1); ctx.fillRect(cx - 3, cy - 4, 7, 1);
        ctx.fillStyle = '#a02818'; ctx.fillRect(cx - 1, cy - 6, 3, 1); ctx.fillRect(cx - 2, cy - 5, 5, 1); ctx.fillRect(cx, cy - 4, 1, 2); T.draw(ctx, 'С', cx, cy - 16, { size: 8, align: 'c', color: ink }); T.draw(ctx, 'Ю', cx, cy + 9, { size: 8, align: 'c', color: ink }); }
      { const mpp = 2 * S.R / m.s, len = Math.round(50 / mpp), bx = m.x + 8, by = m.y + m.s - 14, ink = '#3a2812';          // the scale bar: 50 m
        ctx.fillStyle = ink; ctx.fillRect(bx, by, len, 3); ctx.fillStyle = '#f0e4c0'; ctx.fillRect(bx + 1, by + 1, len / 2 - 1, 1); ctx.fillRect(bx + len / 2, by + 1, len / 2 - 1, 1); T.draw(ctx, '50 м', bx + len / 2, by + 5, { size: 8, align: 'c', color: ink }); }
      // the players: an arrow made of whole pixels that points where the player looks; every other player has one of his own colour with his nick
      const arrow = (x, y, yaw, col) => { x = Math.round(x); y = Math.round(y); const fx = -Math.sin(yaw), fz = -Math.cos(yaw);
        for (const [pad, fill] of [[1.0, '#120a04'], [0, col]]) { ctx.fillStyle = fill;
          for (let dy = -8; dy <= 8; dy++) for (let dx = -8; dx <= 8; dx++) { const u = dx * fx + dy * fz, v = -dx * fz + dy * fx;
            const head = u >= -0.5 - pad && u <= 6.5 + pad && Math.abs(v) <= (6.5 - u) * 0.62 + pad, tail = u >= -4.5 - pad && u < 0.5 && Math.abs(v) <= 0.9 + pad; if (head || tail) ctx.fillRect(x + dx, y + dy, 1, 1); } } };
      const tag = (x, y, name, col) => { const w = T.width(name, 8) + 6, tx = clamp(Math.round(x - w / 2), m.x + 1, m.x + m.s - w - 1), ty = clamp(Math.round(y - 19), m.y + 1, m.y + m.s - 11); ctx.fillStyle = 'rgba(18,10,4,0.85)'; ctx.fillRect(tx, ty, w, 10); ctx.fillStyle = col; ctx.fillRect(tx, ty, 2, 10); T.draw(ctx, name, tx + 4, ty + 1, { size: 8, color: '#fff' }); };
      const hue = n => { let h = 0; for (const ch of n) h = (h * 31 + ch.charCodeAt(0)) >>> 0; return `hsl(${h % 360},75%,58%)`; };
      if (p.mp) for (const r of p.others()) { const [x, y] = this.mapPos(r.pos.x, r.pos.z), col = hue(r.name); arrow(x, y, r.yaw || 0, col); tag(x, y, r.name, col); }
      { const [x, y] = this.mapPos(p.player.pos.x, p.player.pos.z), blink = Math.floor(t * 2.5) % 2; arrow(x, y, p.player.yaw, blink ? '#ffffff' : c.gold); if (p.mp) tag(x, y, Net.name + ' (вы)', c.gold); }
      // all the species
      let found = 0; for (const cl of this.cells) {
        const sp = cl.sp, has = G(sp.id), dim = this.hover >= 0 && cl.sec !== this.hover, q = S.rects[cl.sec]; if (has) found++;
        ctx.globalAlpha = dim ? 0.35 : 1; ctx.fillStyle = this.hover === cl.sec ? 'rgba(255,255,255,0.1)' : '#10201c'; ctx.fillRect(cl.x, cl.y, cl.w, cl.h);
        if (b.secret && !has) { ctx.fillStyle = '#1a2a2a'; ctx.fillRect(cl.x + 3, cl.y + 3, cl.w - 6, 16); T.draw(ctx, '?', cl.x + cl.w / 2, cl.y + 7, { size: 8, align: 'c', color: c.dim }); }
        else { ctx.imageSmoothingEnabled = false; ctx.drawImage(Art.specimen(sp, !has, '#587868'), cl.x + 3, cl.y + 2, cl.w - 6, 17); }
        T.draw(ctx, has ? '✓' : '?', cl.x + cl.w / 2, cl.y + 19, { size: 8, align: 'c', color: has ? c.green : c.dim });
        ctx.globalAlpha = 1; if (p.caughtHere.has(sp.id)) { ctx.fillStyle = c.gold; ctx.fillRect(cl.x + 1, cl.y, cl.w - 2, 1); }
        if (this.hover === cl.sec) { ctx.fillStyle = q.col; ctx.fillRect(cl.x, cl.y + cl.h - 2, cl.w, 2); }
        if (this.hs === cl) { ctx.strokeStyle = '#fff'; ctx.strokeRect(cl.x + 0.5, cl.y + 0.5, cl.w - 1, cl.h - 1); }
      }
      // the line under the grid: the hovered sector or species
      const ly = this.cells.length ? this.cells[this.cells.length - 1].y + this.chh + 6 : 200;
      if (this.hs) { const sp = this.hs.sp, has = G(sp.id), q = S.rects[this.hs.sec]; T.draw(ctx, has || !b.secret ? (has ? sp.ru : '? ? ?') : '???', 222, ly, { size: 8, color: has ? '#fff' : c.dim }); T.draw(ctx, `Живёт в природной зоне ${q.i + 1} · ${q.name}`, 222, ly + 11, { size: 8, color: q.col }); }
      else if (this.hover >= 0) { const q = S.rects[this.hover], got = q.sp.filter(s => G(s.id)).length; T.draw(ctx, `Природная зона ${q.i + 1} · ${q.name}`, 222, ly, { size: 8, color: q.col }); T.draw(ctx, `Видов: ${q.sp.length} · найдено: ${got}`, 222, ly + 11, { size: 8, color: c.text }); }
      else { T.draw(ctx, 'Бабочка иногда перелетает через границу зоны.', 222, ly, { size: 8, color: c.dim }); T.draw(ctx, 'Ловушка ловит бабочек той зоны, где она стоит.', 222, ly + 11, { size: 8, color: c.dim }); }
      const here = S.at(p.player.pos.x, p.player.pos.z); T.draw(ctx, `Вы в природной зоне ${here + 1} · ${S.rects[here].name}`, 16, m.y + m.s + 8, { size: 8, color: S.rects[here].col });
      T.draw(ctx, b.secret ? `Поймано: ${Save.biomeCount(b)} из ???` : `Поймано в локации: ${Save.biomeCount(b)} из ${b.species.length}`, 16, m.y + m.s + 19, { size: 8, color: c.text });
      const bt = { id: 'close', label: 'Закрыть', x: SW - 82, y: SH - 24, w: 70, h: 15 }; this.btn = bt; UIK.btn(ctx, bt, UIK.hit(bt, mouse.x, mouse.y));
    },
    click(x, y) { return this.btn && UIK.hit(this.btn, x, y) ? 'close' : null; },
  };
  return { N, PERIOD: 60 * 60 * 1000, EDGE, make, mapImage, UI, label };
})();

// the landscape of a place when playing alone: kept for an hour of real time (also between visits), then a new one is generated
Save.world = (id, want) => {
  const W = (Save.data.worlds = Save.data.worlds || {}), now = Date.now(); let w = W[id];
  if (!w || now - w.born >= Sectors.PERIOD || w.born > now + 60000 || (want && w.seed !== want)) w = W[id] = { seed: want || World.randomSeed(), born: now };
  Save.write(); return w;
};
