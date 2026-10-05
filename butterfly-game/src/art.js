// ---------------------------------------------------------------- butterfly art: procedural pixel wings, specimens, 3D models
const Art = (() => {
  const N = 40; // wing canvas: right half-wing, body edge at x=0, fore at top, hind below

  const SHAPES = {
    std:      { f: [[0, 17], [2, 8], [12, 2.5], [27, 4], [36, 10], [34, 19], [22, 20], [10, 20]], h: [[0, 19], [12, 20], [27, 21], [34, 27], [29, 35], [17, 38], [7, 34], [2, 27]] },
    swallow:  { f: [[0, 17], [2, 8], [12, 2.5], [27, 4], [36, 10], [34, 19], [22, 20], [10, 20]], h: [[0, 19], [12, 20], [27, 21], [32, 26], [32, 32], [26, 35], [14, 36], [6, 33], [2, 27]],
                tail: [[24, 30], [30, 29], [31, 38], [28, 39]], longTail: [[23, 30], [30, 29], [33, 39.5], [29.5, 39.5]] },
    pierid:   { f: [[0, 19], [4, 6], [18, 2.5], [30, 6], [35, 14], [30, 20], [12, 21]], h: [[0, 20], [15, 21], [27, 22], [30, 29], [23, 34], [10, 34], [3, 28]] },
    blue:     { f: [[0, 17], [3, 7], [15, 3], [28, 5], [33, 12], [30, 19], [10, 20]], h: [[0, 19], [13, 20], [26, 21], [31, 27], [26, 33], [14, 34], [5, 30]] },
    long:     { f: [[0, 18], [4, 10], [18, 4], [37, 6], [39, 12], [30, 19], [10, 20]], h: [[0, 20], [15, 20], [25, 24], [23, 31], [11, 34], [3, 28]] },
    birdwing: { f: [[0, 18], [5, 10], [22, 3], [39, 4], [38, 10], [26, 17], [10, 20]], h: [[0, 19], [18, 20], [30, 23], [33, 30], [24, 35], [10, 34], [3, 28]] },
    round:    { f: [[0, 18], [4, 8], [15, 3], [30, 5], [36, 12], [32, 20], [12, 21]], h: [[0, 20], [15, 21], [30, 23], [35, 30], [28, 37], [12, 38], [4, 31]] },
  };

  const cache = {};

  function maskOf(poly) {
    const c = document.createElement('canvas'); c.width = c.height = N;
    const x = c.getContext('2d'); x.fillStyle = '#fff'; x.beginPath();
    poly.forEach(([px, py], i) => (i ? x.lineTo(px, py) : x.moveTo(px, py))); x.closePath(); x.fill();
    const d = x.getImageData(0, 0, N, N).data; const m = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) m[i] = d[i * 4 + 3] > 110 ? 1 : 0;
    return m;
  }
  function distMap(m) { // manhattan distance to outside, capped
    const d = new Uint8Array(N * N);
    for (let i = 0; i < N * N; i++) d[i] = m[i] ? 99 : 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (!m[i]) continue; const l = x ? d[i - 1] : 0, u = y ? d[i - N] : 0; d[i] = Math.min(d[i], l + 1, u + 1); }
    for (let y = N - 1; y >= 0; y--) for (let x = N - 1; x >= 0; x--) { const i = y * N + x; if (!m[i]) continue; const r = x < N - 1 ? d[i + 1] : 0, b = y < N - 1 ? d[i + N] : 0; d[i] = Math.min(d[i], r + 1, b + 1); }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (!m[i]) continue; if (x === 0) d[i] = Math.max(d[i], 3); } // body edge is not an outline
    return d;
  }
  function bbox(m) {
    let x0 = N, x1 = 0, y0 = N, y1 = 0;
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (m[y * N + x]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
    return { x0, x1, y0, y1, w: x1 - x0 + 1, h: y1 - y0 + 1 };
  }

  const C = h => hex2rgb(h);
  const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];

  function wingCanvas(sp) {
    if (cache[sp.id]) return cache[sp.id];
    const a = sp.art; const sh = SHAPES[a.t] || SHAPES.std;
    const fM = maskOf(sh.f), hM = maskOf(sh.h);
    let tM = null;
    if (a.tail !== undefined && a.tail !== false && sh.tail) tM = maskOf(a.longTail ? sh.longTail : sh.tail);
    const fD = distMap(fM), hD = distMap(hM), tD = tM ? distMap(tM) : null;
    const fB = bbox(fM), hB = bbox(hM);
    const cv = document.createElement('canvas'); cv.width = cv.height = N;
    const ctx = cv.getContext('2d'); const img = ctx.createImageData(N, N); const px = img.data;
    const imgF = ctx.createImageData(N, N), imgH = ctx.createImageData(N, N);
    const edgeC = C(a.edge ? a.edge[0] : '#222'), edgeW = a.edge ? a.edge[1] : 1;
    const dotsC = a.dots ? C(a.dots) : null;
    const veinC = a.veins ? C(a.veins) : null;
    const fIn = C(a.f[0]), fOut = C(a.f[1]), hIn = C(a.h[0]), hOut = C(a.h[1]);

    function circ(x, y, wing, u, v, B, cx, cy, r) { const dx = x - (B.x0 + cx * B.w), dy = y - (B.y0 + cy * B.h); return dx * dx + dy * dy <= r * r ? Math.sqrt(dx * dx + dy * dy) / r : -1; }

    function colorAt(x, y, wing, d) {
      const B = wing === 'f' ? fB : hB; const u = (x - B.x0 + 0.5) / B.w, v = (y - B.y0 + 0.5) / B.h;
      const inn = wing === 'f' ? fIn : hIn, out = wing === 'f' ? fOut : hOut;
      let c = mixc(inn, out, Math.pow(clamp(u), 1.15));
      if (a.checker) { const k = (((x >> 2) + (y >> 2)) & 1); c = C(k ? a.checker[1] : a.checker[0]); }
      if (a.sheen) { const s = a.sheen[1] * Math.exp(-Math.pow((u - 0.34) / 0.28, 2)) * (1 - v * 0.5); c = mixc(c, C(a.sheen[0]), clamp(s)); }
      if (a.band && a.band[0].includes(wing)) { const uu = u + (v - 0.5) * 0.16; if (uu > a.band[1] && uu < a.band[2]) c = C(a.band[3]); }
      if (a.tip && wing === 'f' && u + (1 - v) * 0.12 > a.tip[1]) c = C(a.tip[0]);
      if (a.rays && a.rays[0] === wing) { const ang = Math.atan2(y - (B.y0 + B.h * 0.2), x + 2); for (let k = 0; k < 5; k++) { const ta = 0.35 + k * 0.28; if (Math.abs(ang - ta) < 0.07 && u > 0.12 && d > 1) c = C(a.rays[1]); } }
      if (a.arc && a.arc[0] === wing) { if (Math.abs(u - (0.58 + 0.14 * Math.sin(v * Math.PI))) < 0.03) c = C(a.arc[1]); }
      if (a.bars && wing === 'f') { const t = (u * 0.9 + v * 0.5) * a.bars[1] * 1.55; if ((t % 1) < 0.27 && v < 0.88 && u > 0.1) c = C(a.bars[0]); }
      if (a.bars && wing === 'h') { if (u < 0.22 && v < 0.6) c = mixc(c, C(a.bars[0]), 0.55); }
      if (a.wedges && wing === 'f') {
        for (let i = 0; i < a.wedges[1]; i++) {
          const wu = 0.18 + 0.72 * (i / (a.wedges[1] - 1)); const wv = 0.78 - 0.5 * (i / (a.wedges[1] - 1));
          const cx = B.x0 + wu * B.w, cy = B.y0 + wv * B.h; const dx = x - cx, dy = y - cy;
          const ang = Math.atan2(0.5 * B.h + B.y0 - cy, B.x0 - cx);
          const rx = dx * Math.cos(ang) + dy * Math.sin(ang), ry = -dx * Math.sin(ang) + dy * Math.cos(ang);
          if ((rx * rx) / 18 + (ry * ry) / 3.2 <= 1) c = C(a.wedges[0]);
        }
      }
      if (a.patch && a.patch[0] === wing) { const q = circ(x, y, wing, u, v, B, a.patch[1], a.patch[2], a.patch[3]); if (q >= 0) c = C(a.patch[4]); }
      if (a.sp) for (const s of a.sp) { if (s[0].includes(wing) || s[0] === 'fh') { const q = circ(x, y, wing, u, v, B, s[1], s[2], s[3]); if (q >= 0) c = C(s[4]); } }
      if (a.eye) for (const e of a.eye) {
        if (e[0] === wing) {
          const q = circ(x, y, wing, u, v, B, e[1], e[2], e[3]);
          if (q >= 0) {
            c = q < 0.45 ? C(e[5]) : C(e[4]);
            if (q < 0.9 && q > 0.7) c = mixc(c, [8, 8, 10], 0.5);
          }
        }
      }
      if (veinC) { const ang = Math.atan2(y - (wing === 'f' ? 17 : 21), x + 1.5); const k = ((ang + 3.2) * 6.3) % 1; if (k < 0.1 && u > 0.1) c = mixc(c, veinC, 0.8); }
      // margin
      if (d < edgeW) c = edgeC.slice();
      else if (dotsC && d === Math.floor(edgeW) && ((x + y * 2) % 5 === 0) && edgeW >= 2) c = dotsC;
      if (d === 0) { c = mixc(c, [10, 8, 8], 0.55); if (dotsC && edgeW <= 1 && ((x + y) % 3 === 0)) c = dotsC; }
      return c;
    }
    const put = (x, y, c, part) => { const i = (y * N + x) * 4; px[i] = c[0]; px[i + 1] = c[1]; px[i + 2] = c[2]; px[i + 3] = 255; const q = part.data; q[i] = c[0]; q[i + 1] = c[1]; q[i + 2] = c[2]; q[i + 3] = 255; };
    // hind first, tail, then fore on top
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (hM[i]) put(x, y, colorAt(x, y, 'h', hD[i]), imgH); }
    if (tM) { const tc = C(typeof a.tail === 'string' ? a.tail : '#111'); for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (tM[i]) put(x, y, tD[i] === 0 ? mixc(tc, [0, 0, 0], 0.4) : tc, imgH); } }
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (fM[i]) put(x, y, colorAt(x, y, 'f', fD[i]), imgF); }
    // soft darkening where forewing overlaps hindwing (depth cue)
    for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) { const i = y * N + x; if (fM[i] && hM[i] && fD[i] === 1 && y > 17) { const k = (y * N + x) * 4; px[k] *= 0.75; px[k + 1] *= 0.75; px[k + 2] *= 0.75; } }
    ctx.putImageData(img, 0, 0);
    const part = im => { const c2 = document.createElement('canvas'); c2.width = c2.height = N; c2.getContext('2d').putImageData(im, 0, 0); return c2; };
    const tipOf = (m, py) => { let bx = 0, by = py, bd = -1; for (let y = 0; y < N; y++) for (let x = 0; x < N; x++) if (m[y * N + x]) { const d = (x + 0.5) * (x + 0.5) + (y + 0.5 - py) * (y + 0.5 - py); if (d > bd) { bd = d; bx = x + 0.5; by = y + 0.5; } } return [bx, by - py]; };
    partsCache[sp.id] = { f: part(imgF), h: part(imgH), tf: tipOf(fM, PIV.f), th: tipOf(hM, PIV.h) };
    cache[sp.id] = cv;
    return cv;
  }

  // ---- spread poses: every wing is rotated by a (rad) about its root and compressed along its own length by s
  const PIV = { f: 18, h: 21 };
  const partsCache = {};
  const RAW = { rf: { a: -0.85, s: 0.62 }, lf: { a: -0.85, s: 0.62 }, rh: { a: -1.4, s: 0.6 }, lh: { a: -1.4, s: 0.6 } };
  const IDEAL = { rf: { a: 0, s: 1 }, lf: { a: 0, s: 1 }, rh: { a: 0, s: 1 }, lh: { a: 0, s: 1 } };
  function wingParts(sp) { wingCanvas(sp); return partsCache[sp.id]; }
  function drawBody(ctx, cx, cy, sc, silhouette) {
    const r = (x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(Math.round(cx + x * sc), Math.round(cy + (y - 20) * sc), Math.round(w * sc), Math.round(h * sc)); };
    const bc = silhouette ? '#000' : '#1e1612';
    r(-1, 11, 2, 19, bc); r(-1, 8, 2, 3, bc); r(-2, 12, 4, 4, bc); r(-1, 29, 2, 2, bc); r(-2, 14, 1, 1, silhouette ? '#000' : '#4a3a30');
    r(-2, 6, 1, 2, bc); r(1, 6, 1, 2, bc); r(-3, 4, 1, 2, bc); r(2, 4, 1, 2, bc);
  }
  function drawPose(ctx, sp, pose, cx, cy, sc, o = {}) {
    const P = wingParts(sp); pose = pose || RAW; ctx.imageSmoothingEnabled = false;
    if (o.alpha !== undefined) ctx.globalAlpha = o.alpha;
    for (const [k, part, m] of [['lh', 'h', -1], ['rh', 'h', 1], ['lf', 'f', -1], ['rf', 'f', 1]]) {
      const w = pose[k]; if (!w) continue; const piv = PIV[part];
      ctx.save(); ctx.translate(cx, cy + (piv - 20) * sc); ctx.scale(m * sc, sc); ctx.rotate(w.a); ctx.scale(w.s, 1); ctx.drawImage(P[part], 0, -piv); ctx.restore();
    }
    drawBody(ctx, cx, cy, sc, false);
    ctx.globalAlpha = 1;
  }
  // tip of a wing (relative to its root, in wing units) for a given pose entry
  function tipPos(sp, k, w) { const P = wingParts(sp); const t = k[1] === 'f' ? P.tf : P.th; const x = t[0] * w.s, y = t[1]; const c = Math.cos(w.a), s2 = Math.sin(w.a); return [x * c - y * s2, x * s2 + y * c]; }

  // full spread specimen: 2N wide, body in the middle
  function specimen(sp, silhouette, tint) {
    const key = sp.id + (silhouette ? '_sil' + (tint || '') : '_col'); if (cache[key]) return cache[key];
    const w = wingCanvas(sp); const cv = document.createElement('canvas'); cv.width = N * 2; cv.height = N;
    const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
    x.drawImage(w, N, 0);
    x.save(); x.translate(N, 0); x.scale(-1, 1); x.drawImage(w, 0, 0); x.restore();
    // body
    const bc = silhouette ? '#000' : '#1e1612';
    x.fillStyle = bc; x.fillRect(N - 1, 11, 2, 19); x.fillRect(N - 1, 8, 2, 3); x.fillRect(N - 2, 12, 4, 4);
    x.fillRect(N - 1, 29, 2, 2);
    x.fillStyle = silhouette ? '#000' : '#4a3a30'; x.fillRect(N - 2, 14, 1, 1);
    x.fillStyle = bc; x.fillRect(N - 2, 6, 1, 2); x.fillRect(N + 1, 6, 1, 2); x.fillRect(N - 3, 4, 1, 2); x.fillRect(N + 2, 4, 1, 2);
    if (silhouette) {
      const d = x.getImageData(0, 0, cv.width, cv.height); for (let i = 0; i < d.data.length; i += 4) { if (d.data[i + 3]) { const tc = hex2rgb(tint || '#221c18'); d.data[i] = tc[0]; d.data[i + 1] = tc[1]; d.data[i + 2] = tc[2]; d.data[i + 3] = 255; } }
      x.putImageData(d, 0, 0);
    }
    cache[key] = cv;
    return cv;
  }

  // ------------------------------------------------------------ 3D model
  const SF = 5.0; // world scale exaggeration so butterflies stay visible at 480x270
  const texCache = {};
  function wingTexture(sp) {
    if (texCache[sp.id]) return texCache[sp.id];
    const t = new THREE.CanvasTexture(wingCanvas(sp)); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    texCache[sp.id] = t; return t;
  }
  const bodyMat = new THREE.MeshBasicMaterial({ color: 0x1e1612 });
  const headMat = new THREE.MeshBasicMaterial({ color: 0x2a201a });
  const antMat = new THREE.MeshBasicMaterial({ color: 0x120e0a });

  function makeButterfly(sp) {
    const span = ((sp.mm[0] + sp.mm[1]) / 2) / 1000 * SF; // metres (exaggerated)
    const half = span / 2 / 0.9;
    const mat = new THREE.MeshBasicMaterial({ map: wingTexture(sp), transparent: true, alphaTest: 0.5, side: THREE.DoubleSide });
    const geo = new THREE.PlaneGeometry(half, half); geo.rotateX(-Math.PI / 2); geo.translate(half / 2, 0, 0);
    const g = new THREE.Group();
    const L = new THREE.Group(), R = new THREE.Group();
    const wr = new THREE.Mesh(geo, mat), wl = new THREE.Mesh(geo, mat); wl.scale.x = -1;
    wr.position.z = -half * 0.04; wl.position.z = -half * 0.04;
    R.add(wr); L.add(wl); g.add(L, R);
    const bl = span * 0.5;
    const th = new THREE.Mesh(new THREE.BoxGeometry(span * 0.07, span * 0.07, span * 0.14), bodyMat); th.position.z = -bl * 0.05;
    const ab = new THREE.Mesh(new THREE.BoxGeometry(span * 0.05, span * 0.05, span * 0.34), bodyMat); ab.position.z = bl * 0.36;
    const hd = new THREE.Mesh(new THREE.BoxGeometry(span * 0.06, span * 0.06, span * 0.06), headMat); hd.position.z = -bl * 0.22;
    g.add(th, ab, hd);
    for (const s of [-1, 1]) {
      const an = new THREE.Mesh(new THREE.BoxGeometry(span * 0.012, span * 0.012, span * 0.22), antMat);
      an.position.set(s * span * 0.07, span * 0.03, -bl * 0.42); an.rotation.y = s * 0.45; an.rotation.x = -0.2; g.add(an);
    }
    g.userData = { L, R, span };
    return g;
  }
  function setFlap(g, ang) { g.userData.R.rotation.z = ang; g.userData.L.rotation.z = -ang; }

  return { wingCanvas, specimen, makeButterfly, setFlap, SF, N, wingParts, drawPose, drawBody, tipPos, RAW, IDEAL, PIV };
})();
