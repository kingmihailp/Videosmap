// ---------------------------------------------------------------- the old abandoned chalet of the Alps: a weathered log house with a collapsing roof, broken windows, a rotten porch
// and overgrown surroundings. Built from a few hundred small coloured parts merged into one mesh. Local frame: origin = centre of the house at ground level, +z = front (door).
const Chalet = (() => {
  const W = 7.0, D = 5.6, WALL_Y0 = 0.5, ROW = 0.33, ROWS = 8, EAVE = WALL_Y0 + ROW * ROWS + 0.05, RISE = 2.8;   // eave height ~3.2 m
  const LOGS = ['#6b5f52', '#5e5449', '#756a5c', '#4f463d', '#7a6f61', '#625648'], DARK = '#2a241f', MOSS = ['#4c6a38', '#587a3e', '#3f5c30'], STONE = ['#8a8a84', '#7a7a76', '#96948c', '#6e6e6a'], SHING = ['#4e4036', '#5a4a3c', '#3e342c', '#665444', '#4a3c32'], IRON = '#3a2e28', RUST = '#7a4a2a';
  const OPEN_FRONT = [[-0.55, 0.55, 0.5, 2.55, 'door'], [-2.8, -1.55, 1.05, 2.25, 'win'], [1.55, 2.8, 1.05, 2.25, 'win']];
  const OPEN_BACK = [[-0.65, 0.65, 1.1, 2.2, 'win']];
  const OPEN_L = [[-0.6, 0.6, 1.1, 2.1, 'win']];
  const OPEN_R = [[0.5, 2.1, 0.5, 2.4, 'collapse']];

  function build(rng, o) {            // o: { heightAt(wx, wz), cx, cy, cz, ry }
    const B = new Batch(rng.int(1, 1e6)), pick = a => a[Math.floor(rng.next() * a.length)], cosr = Math.cos(o.ry), sinr = Math.sin(o.ry);
    const wx = (lx, lz) => o.cx + lx * cosr + lz * sinr, wz = (lx, lz) => o.cz - lx * sinr + lz * cosr, gy = (lx, lz) => o.heightAt(wx(lx, lz), wz(lx, lz)) - o.cy;     // ground height (local) below a local point
    // ---------------------------------------------------------------- foundation: rough stone blocks, deep enough to hide the slope
    for (let side = 0; side < 4; side++) {
      const along = side < 2 ? W : D, z = side < 2 ? (side ? -1 : 1) * (D / 2 + 0.1) : 0, x = side < 2 ? 0 : (side === 2 ? -1 : 1) * (W / 2 + 0.1);
      for (let t = -along / 2 - 0.2; t < along / 2 + 0.2; t += 0.55) { const bw = rng.range(0.5, 0.65), bh = rng.range(1.4, 1.9), px = side < 2 ? t + 0.27 : x, pz = side < 2 ? z : t + 0.27; B.box(side < 2 ? bw : 0.6, bh, side < 2 ? 0.6 : bw, px, 0.5 - bh / 2 + rng.range(-0.05, 0.05), pz, pick(STONE), 0, rng.range(-0.05, 0.05), 0, 0.12); }
    }
    // the dark inside (seen through holes in the roof, windows and the doorway)
    B.box(W - 0.45, EAVE - 0.25, D - 0.45, 0, (EAVE - 0.25) / 2 + 0.1, 0, '#0a0806', 0, 0, 0, 0);
    B.box(W - 0.6, 0.12, D - 0.6, 0, 0.45, 0, '#2a2018', 0, 0, 0, 0.1);                                                                    // rotten floor
    // ---------------------------------------------------------------- log walls with openings
    const wall = (axis, sgn, openings) => {
      const half = axis === 'x' ? W / 2 + 0.28 : D / 2 + 0.28;
      for (let r = 0; r < ROWS; r++) {
        const y = WALL_Y0 + LOG_R() + r * ROW; const cuts = openings.filter(op => y + 0.17 > op[2] && y - 0.17 < op[3]).map(op => [op[0], op[1]]).sort((a, b) => a[0] - b[0]);
        let cur = -half; const segs = []; for (const [a, b] of cuts) { if (a > cur) segs.push([cur, a]); cur = Math.max(cur, b); } if (cur < half) segs.push([cur, half]);
        for (const [a, b] of segs) {
          if (b - a < 0.18) continue; if (rng.chance(0.03 + (r > 5 ? 0.04 : 0))) continue;                                          // a missing log segment
          const len = b - a, mid = (a + b) / 2, rad = LOG_R() * rng.range(0.9, 1.05), sag = rng.range(-0.02, 0.02), col = rng.chance(0.12) ? '#3a322a' : pick(LOGS);
          if (axis === 'x') B.cyl(rad, rad, len, mid, y, sgn * (D / 2), col, 7, sag, 0, Math.PI / 2); else B.cyl(rad, rad, len, sgn * (W / 2), y, mid, col, 7, Math.PI / 2, 0, sag);
          if (rng.chance(0.05)) { const mx = axis === 'x' ? mid + rng.range(-0.3, 0.3) : sgn * (W / 2), mz = axis === 'x' ? sgn * (D / 2) : mid + rng.range(-0.3, 0.3); B.box(0.5, 0.06, 0.34, mx, y + rad, mz, pick(MOSS), 0, rng.range(0, 3), 0); }   // moss
        }
      }
    };
    wall('x', 1, OPEN_FRONT); wall('x', -1, OPEN_BACK); wall('z', -1, OPEN_L); wall('z', 1, OPEN_R);
    // gable ends: vertical weathered planks (some missing), a loft window in the middle
    for (const sx of [-1, 1]) for (let z = -D / 2 + 0.1; z < D / 2; z += 0.23) {
      const h = RISE * (1 - Math.abs(z) / (D / 2)) - 0.08; if (h < 0.15 || rng.chance(0.1)) continue; const px = sx * (W / 2 + 0.04);
      if (Math.abs(z) < 0.5) { B.box(0.09, Math.min(h, 1.0), 0.2, px, EAVE + Math.min(h, 1.0) / 2, z, pick(LOGS), 0, 0, rng.range(-0.03, 0.03)); if (h > 2.0) B.box(0.09, h - 1.9, 0.2, px, EAVE + 1.9 + (h - 1.9) / 2, z, pick(LOGS)); }
      else B.box(0.09, h, 0.2, px, EAVE + h / 2, z, pick(LOGS), 0, 0, rng.range(-0.03, 0.03), 0.1);
    }
    // loft window frames in the gable ends
    for (const sx of [-1, 1]) { const px = sx * (W / 2 + 0.07); B.box(0.1, 0.1, 1.0, px, EAVE + 1.0, 0, DARK); B.box(0.1, 0.1, 1.0, px, EAVE + 1.9, 0, DARK); B.box(0.1, 0.9, 0.1, px, EAVE + 1.45, -0.5, DARK); B.box(0.1, 0.9, 0.1, px, EAVE + 1.45, 0.5, DARK); }
    // ---------------------------------------------------------------- roof: shingle rows with holes, rafters, a collapsed patch, moss
    const run = D / 2 + 0.95, yE = EAVE - 0.4, rise = EAVE + RISE - yE, slopeLen = Math.hypot(run, rise), th = Math.atan2(rise, run), nR = 17, nSeg = 15, segL = (W + 2.2) / nSeg, rowL = slopeLen / nR;
    for (const s of [1, -1]) {
      // chaotic holes: irregular outlines (angular noise), overlapping, in random places of the slope
      const holes = []; for (let h = 0; h < (s === 1 ? 7 : 6); h++) holes.push({ x: rng.range(-3.9, 3.9), l: rng.range(0.12, 0.92) * slopeLen, rx: rng.range(0.3, 1.2), rl: rng.range(0.28, 0.9), n: rng.range(0, 6.28) });
      const inHole = (x, l) => holes.some(h => { const dx = (x - h.x) / h.rx, dl = (l - h.l) / h.rl, a = Math.atan2(dl, dx), nz = 1 + 0.32 * Math.sin(a * 3 + h.n) + 0.2 * Math.sin(a * 7 + h.n * 2); return dx * dx + dl * dl < nz * nz * 0.9; });
      const at = (x, l) => { const t = l / slopeLen; return [x, yE + rise * t + 0.03, s * run * (1 - t)]; };
      for (let i = 0; i < nR; i++) {
        const t = (i + 0.5) / nR, l = t * slopeLen, zc = s * (run * (1 - t)), yc = yE + rise * t + 0.03;
        for (let k = 0; k < nSeg; k++) {
          const xc = -(W + 2.2) / 2 + k * segL + segL / 2; if (inHole(xc, l) || rng.chance(0.03 + 0.04 * t)) continue;
          const moss = rng.chance(0.12); B.box(segL * 1.04, 0.05, rowL * 1.25, xc, yc + rng.range(-0.025, 0.025), zc, moss ? pick(MOSS) : pick(SHING), s * th + rng.range(-0.04, 0.04), 0, rng.range(-0.03, 0.03), 0.1);
        }
      }
      for (let x = -(W + 2.0) / 2; x <= (W + 2.0) / 2 + 0.01; x += 0.78) { if (inHole(x, slopeLen * 0.5) && rng.chance(0.55)) continue; if (rng.chance(0.05)) continue; B.box(0.11, 0.13, slopeLen, x, yE + rise / 2 - 0.08, s * run / 2, DARK, s * th, 0, 0, 0.1); }
      for (const t of [0.3, 0.55, 0.8]) B.box(W + 2.1, 0.09, 0.09, 0, yE + rise * t - 0.12, s * run * (1 - t), DARK, 0, 0, 0);                      // purlins
      B.box(W + 2.4, 0.07, 0.34, 0, yE + 0.02, s * (run + 0.02), '#3a2e26', s * th, 0, 0);                                                         // eave board
      // boards hanging from the edges of the holes (by one nail), swinging down at random angles; broken rafters poking out
      for (const h of holes) {
        const nb = rng.int(2, 5); for (let j = 0; j < nb; j++) {
          const a = rng.range(0, 6.28), P = at(h.x + Math.cos(a) * h.rx * 0.9, clamp(h.l + Math.sin(a) * h.rl * 0.9, 0.2, slopeLen - 0.2)), L = rng.range(0.8, 1.9), tilt = rng.range(0.1, 0.8) * (rng.chance(0.5) ? 1 : -1), roll = rng.range(-0.35, 0.35);
          B.box(0.04, 0.04, 0.09, P[0], P[1] + 0.05, P[2], IRON);
          B.box(rng.range(0.14, 0.24), L, 0.05, P[0] + Math.sin(roll) * L / 2, P[1] - Math.cos(tilt) * L / 2 * 0.95, P[2] + Math.sin(tilt) * L / 2 * s * 0.0 + rng.range(-0.1, 0.1), pick(rng.chance(0.5) ? SHING : LOGS), tilt, 0, roll, 0.12);
        }
        for (let j = 0; j < 2; j++) { const P = at(h.x + rng.range(-h.rx, h.rx) * 0.6, clamp(h.l + rng.range(-h.rl, h.rl) * 0.6, 0.2, slopeLen - 0.2)); B.box(0.11, 0.13, rng.range(0.5, 1.3), P[0], P[1] - 0.05, P[2], DARK, s * th + rng.range(-0.7, 0.7), rng.range(-0.3, 0.3), rng.range(-0.2, 0.2)); }
      }
      for (let j = 0; j < 7; j++) { const x = rng.range(-W / 2 - 0.8, W / 2 + 0.8), L = rng.range(0.7, 1.5); B.box(0.2, 0.05, L, x, yE - 0.12 - L * 0.22, s * (run + L * 0.4), pick(SHING), s * (th + rng.range(0.7, 1.3)), 0, rng.range(-0.15, 0.15), 0.1); }     // eave boards drooping over the edge
    }
    B.box(W + 2.3, 0.22, 0.22, 0, EAVE + RISE + 0.08, 0, '#3a322a', 0, 0, rng.range(-0.01, 0.01));                                                   // ridge beam
    for (let x = -3.4; x <= 3.5; x += 0.55) if (rng.chance(0.85)) B.box(0.34, 0.1, 0.34, x, EAVE + RISE + 0.22, 0, pick(SHING), 0, rng.range(-0.3, 0.3), 0);   // ridge cap
    // ---------------------------------------------------------------- chimney (partly collapsed) and a rusty weathervane
    { const cx = -1.9, cz = -0.9, top = EAVE + RISE + 1.3; for (let y = 2.5; y < top; y += 0.28) { const broken = y > top - 0.9; for (const [dx, dz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3], [0, 0]]) { if (broken && rng.chance(0.4)) continue; B.box(0.45, 0.27, 0.45, cx + dx, y, cz + dz, pick(STONE), 0, rng.range(-0.15, 0.15), 0, 0.14); } } B.box(0.5, 0.2, 0.5, 2.1, 0.5, -0.9, pick(STONE)); B.box(0.5, 0.2, 0.5, 2.5, 0.35, -0.2, pick(STONE)); }
    { const vx = 2.6, vy = EAVE + RISE + 0.2; B.box(0.04, 0.9, 0.04, vx, vy + 0.45, 0, IRON); B.box(0.8, 0.04, 0.04, vx, vy + 0.95, 0, RUST, 0, 0.5, 0); B.tri([vx + 0.35, vy + 0.95, 0.15], [vx + 0.35, vy + 0.95, -0.15], [vx + 0.6, vy + 0.95, 0], RUST); }
    // ---------------------------------------------------------------- front: door, windows, shutters, porch
    const frame = (x0, x1, y0, y1, z, depth = 0.1) => { const c = '#3a3028'; B.box(x1 - x0 + 0.2, 0.12, depth + 0.1, (x0 + x1) / 2, y1 + 0.06, z, c); B.box(0.12, y1 - y0, depth, x0 - 0.06, (y0 + y1) / 2, z, c); B.box(0.12, y1 - y0, depth, x1 + 0.06, (y0 + y1) / 2, z, c); if (y0 > 0.8) B.box(x1 - x0 + 0.3, 0.1, depth + 0.16, (x0 + x1) / 2, y0 - 0.05, z + (depth > 0 ? 0.04 : 0), '#4a3a2c'); };
    const windowAt = (x0, x1, y0, y1, z, nz, hang) => {      // frame + cross + a few glass shards + shutters (one hanging askew, one lost)
      frame(x0, x1, y0, y1, z); B.box(0.05, y1 - y0, 0.06, (x0 + x1) / 2, (y0 + y1) / 2, z, '#3a3028'); B.box(x1 - x0, 0.05, 0.06, (x0 + x1) / 2, (y0 + y1) / 2 + 0.1, z, '#3a3028');
      for (let i = 0; i < 4; i++) if (rng.chance(0.55)) { const sx = rng.range(x0 + 0.08, x1 - 0.08), sy = rng.pick ? 0 : 0; B.tri([sx, rng.chance(0.5) ? y0 + 0.05 : y1 - 0.05, z + 0.02 * nz], [sx + rng.range(0.1, 0.22), y0 + rng.range(0.05, 0.3), z + 0.02 * nz], [sx + rng.range(-0.05, 0.1), y0 + rng.range(0.25, 0.5), z + 0.02 * nz], '#8aa4aa'); }
      const sh = (x, ax) => { const w = (x1 - x0) / 2 - 0.02, h = y1 - y0; if (hang === 0) { B.box(w, h, 0.05, x, (y0 + y1) / 2, z + 0.14 * nz, '#7a4a38', 0, 0, ax * 0.0, 0.1); for (let k = 0; k < 3; k++) B.box(w, 0.04, 0.02, x, y0 + 0.2 + k * (h - 0.35) / 2, z + 0.17 * nz, '#4a3228'); } };
      // left shutter hangs from its top hinge, tilted; right one fell to the ground and leans on the wall
      B.box((x1 - x0) / 2 - 0.02, y1 - y0, 0.05, x0 - (x1 - x0) / 4 - 0.04, (y0 + y1) / 2 - 0.12, z + 0.12 * nz, '#7a4a38', 0, 0, rng.range(0.25, 0.5) * (nz > 0 ? 1 : -1), 0.1);
      B.box((x1 - x0) / 2 - 0.02, y1 - y0, 0.05, x1 + (x1 - x0) / 4 + 0.1, 0.55 + gy((x0 + x1) / 2, z + 0.5 * nz) * 0, z + 0.32 * nz, '#6a4030', -0.35 * nz, rng.range(-0.2, 0.2), 0.06, 0.1);
    };
    const zf = D / 2, zb = -D / 2;
    // door: rotten frame, the leaf hangs ajar on its left hinge, a threshold slab and a broken step
    { frame(-0.55, 0.55, 0.5, 2.55, zf + 0.02, 0.2); const leaf = (w, h) => { const m = new THREE.Matrix4().compose(new THREE.Vector3(-0.58, 0.5 + h / 2, zf + 0.08), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 1.15, 0.03)), new THREE.Vector3(1, 1, 1)); B.geo(new THREE.BoxGeometry(w, h, 0.07), m.multiply(new THREE.Matrix4().makeTranslation(w / 2, 0, 0)), '#4a3a2e', 0.1); }; leaf(1.0, 1.95); for (let k = 0; k < 3; k++) { const m = new THREE.Matrix4().compose(new THREE.Vector3(-0.58, 0.9 + k * 0.65, zf + 0.08), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 1.15, 0.03)), new THREE.Vector3(1, 1, 1)); B.geo(new THREE.BoxGeometry(0.95, 0.07, 0.1), m.multiply(new THREE.Matrix4().makeTranslation(0.5, 0, 0.0)), IRON, 0.05); } B.box(1.3, 0.12, 0.5, 0, 0.45, zf + 0.32, '#4a4038'); }
    windowAt(-2.8, -1.55, 1.05, 2.25, zf + 0.02, 1, 0); windowAt(1.55, 2.8, 1.05, 2.25, zf + 0.02, 1, 0); windowAt(-0.65, 0.65, 1.1, 2.2, zb - 0.02, -1, 0);
    // side windows
    for (const [sx, a, b] of [[-1, -0.6, 0.6]]) { const x = sx * (W / 2 + 0.02); B.box(0.2, 0.12, 1.4, x, 2.16, 0, '#3a3028'); B.box(0.1, 1.0, 0.12, x, 1.6, -0.66, '#3a3028'); B.box(0.1, 1.0, 0.12, x, 1.6, 0.66, '#3a3028'); B.box(0.12, 0.08, 1.4, x, 1.05, 0, '#4a3a2c'); B.box(0.1, 1.0, 0.05, x, 1.6, 0, '#3a3028'); }
    // porch: sagging boards, two posts (one snapped), a lean-to roof with holes, steps
    const pz0 = zf + 0.55, pL = 1.7;
    for (let i = 0; i < 6; i++) { if (i === 3 && rng.chance(0.7)) continue; const bx = -1.75 + i * 0.62; B.box(0.58, 0.07, pL, bx + 0.3 - 0.0, 0.32 + (i === 2 ? -0.05 : 0), zf + 0.2 + pL / 2, pick(LOGS), rng.range(-0.04, 0.04), rng.range(-0.02, 0.02), rng.range(-0.03, 0.03), 0.1); }
    for (const x of [-1.8, 1.8]) B.box(0.3, 0.6, 0.15, x, 0.2, zf + 0.2 + pL - 0.1, pick(STONE));
    const post = (x, broken) => { const hh = broken ? 1.3 : 2.5; B.box(0.16, hh, 0.16, x, 0.33 + hh / 2, zf + 0.2 + pL - 0.1, '#5a4a3a', 0, 0, broken ? 0.06 : 0.0); if (broken) B.box(0.14, 0.9, 0.14, x + 0.55, 0.3, zf + 0.2 + pL + 0.25, '#4a3a2e', 0.1, 0.3, 1.4); };      // the broken top lies on the ground
    post(-1.8, false); post(1.8, true);
    for (let x = -1.8; x <= 1.0; x += 0.35) if (rng.chance(0.75)) B.box(0.08, 0.7, 0.08, x, 0.7, zf + 0.2 + pL - 0.1, '#5a4a3a', 0, 0, rng.range(-0.1, 0.1));      // balusters (some missing)
    B.box(3.8, 0.1, 0.12, -0.1, 1.08, zf + 0.2 + pL - 0.1, '#4a3a2e', 0, 0, 0.06);
    for (let i = 0; i < 6; i++) for (let k = 0; k < 4; k++) { if (rng.chance(0.22)) continue; B.box(0.9, 0.05, 0.5, -1.35 + k * 0.9, 2.95 - (i * 0.08), zf + 0.15 + i * 0.3 + 0.2, pick(SHING), 0.12, 0, rng.range(-0.04, 0.04), 0.1); }
    B.box(4.0, 0.1, 0.1, 0, 2.62, zf + 0.2 + pL + 0.0, '#4a3a2e', 0, 0, 0.02);
    for (let i = 0; i < 2; i++) B.box(1.4 + i * 0.2, 0.2, 0.45 + i * 0.25, 0, 0.1 - i * 0.12 + 0.0, zf + 0.2 + pL + 0.35 + i * 0.35, pick(STONE), 0, rng.range(-0.1, 0.1), 0);                // steps
    // ---------------------------------------------------------------- the yard: debris, woodpile, barrel, wheel, fence, bench
    for (let r = 0; r < 4; r++) for (let k = 0; k < 6 - r; k++) { if (rng.chance(0.08)) continue; B.cyl(0.14, 0.14, 1.2, -W / 2 - 1.0 - 0.0, gy(-W / 2 - 1.0, -0.9 + k * 0.3 + r * 0.15) + 0.15 + r * 0.26, -0.9 + k * 0.3 + r * 0.15, rng.chance(0.15) ? '#3a322a' : pick(LOGS), 6, 0, 0, Math.PI / 2); }
    B.box(0.12, 1.15, 0.12, -W / 2 - 1.6, 0.58 + gy(-W / 2 - 1.6, -1.1) * 0, -1.1, '#4a3a2e'); B.box(0.12, 1.15, 0.12, -W / 2 - 1.6, 0.58, 1.0, '#4a3a2e');
    { const bx = W / 2 + 1.3, bz = zf - 0.4, g0 = gy(bx, bz); B.cyl(0.38, 0.34, 0.85, bx, g0 + 0.43, bz, '#5a4634', 10); for (const yy of [0.2, 0.62]) B.cyl(0.395, 0.395, 0.05, bx, g0 + yy, bz, RUST, 10); B.cyl(0.3, 0.3, 0.05, bx, g0 + 0.82, bz, '#1a1410', 10); }
    { const bx = W / 2 + 0.45, bz = zf + 1.2, g0 = gy(bx, bz); B.cyl(0.14, 0.11, 0.26, bx, g0 + 0.13, bz, RUST, 8, 0.3, 0, 0.4); }
    { const wx0 = -2.2, wz0 = zb - 0.35, g0 = gy(wx0, wz0); B.cyl(0.55, 0.55, 0.07, wx0, g0 + 0.62, wz0, '#5a4634', 14, 0.18, 0, 0); B.cyl(0.1, 0.1, 0.12, wx0, g0 + 0.62, wz0, IRON, 6, 0.18, 0, 0); for (let k = 0; k < 4; k++) B.box(0.05, 1.05, 0.05, wx0, g0 + 0.62, wz0, '#4a3a2e', 0.18, 0, k * Math.PI / 4); }
    // old fence: leaning posts, some rails fallen
    for (let i = 0; i < 7; i++) { const fx = W / 2 + 2.4 + i * 0.0, fz = -5.0 + i * 1.6 - 1.0, g0 = gy(fx, fz); B.box(0.12, 1.1, 0.12, fx, g0 + 0.5, fz, '#4a3a2e', rng.range(-0.15, 0.15), 0, rng.range(-0.25, 0.25), 0.1); if (i < 6 && rng.chance(0.6)) B.box(0.07, 0.1, 1.6, fx, g0 + 0.8 - (rng.chance(0.3) ? 0.5 : 0), fz + 0.8, '#5a4a3a', rng.range(-0.2, 0.2), 0, rng.range(-0.2, 0.2)); }
    // bench by the wall with missing slats
    { const bx = 2.2, bz = zf + 0.2 + pL + 1.6, g0 = gy(bx, bz); for (let k = 0; k < 3; k++) if (k !== 1) B.box(1.4, 0.05, 0.14, bx, g0 + 0.45, bz + (k - 1) * 0.17, '#5a4a3a', 0, 0, 0.02); B.box(0.08, 0.45, 0.5, bx - 0.6, g0 + 0.22, bz, '#4a3a2e'); B.box(0.08, 0.45, 0.5, bx + 0.6, g0 + 0.22, bz, '#4a3a2e', 0, 0, 0.25); }
    // scattered planks and shingles, fallen logs
    for (let i = 0; i < 12; i++) { const a = rng.range(0, 6.28), d = rng.range(3.4, 5.4), lx = Math.cos(a) * d * 1.1, lz = Math.sin(a) * d, g0 = gy(lx, lz); if (i < 6) B.box(rng.range(0.9, 1.7), 0.05, 0.2, lx, g0 + 0.05, lz, pick(LOGS), rng.range(-0.1, 0.1), rng.range(0, 6), rng.range(-0.1, 0.1)); else B.box(0.35, 0.03, 0.2, lx, g0 + 0.03, lz, pick(SHING), 0, rng.range(0, 6), 0); }
    // overgrown: dry grass tufts, nettles and small bushes hugging the walls
    for (let i = 0; i < 150; i++) {
      const a = rng.range(0, 6.28), d = rng.range(0, 1) ** 0.6 * 3.0, lx = Math.cos(a) * (W / 2 + 0.6 + d * 1.1), lz = Math.sin(a) * (D / 2 + 0.7 + d), g0 = gy(lx, lz);
      if (lz > zf + 0.3 && Math.abs(lx) < 1.6 && lz < zf + 3.2) continue;        // keep the path to the door clear
      const col = pick(['#6a7a3a', '#8a8a48', '#7a6a38', '#5a7a3a', '#9a8a4a']), h = rng.range(0.35, 0.95);
      for (let k = 0; k < 3; k++) B.box(0.035, h, 0.035, lx + rng.range(-0.1, 0.1), g0 + h / 2 - 0.02, lz + rng.range(-0.1, 0.1), col, rng.range(-0.3, 0.3), 0, rng.range(-0.3, 0.3), 0.15);
    }
    for (let i = 0; i < 9; i++) { const a = rng.range(0, 6.28), lx = Math.cos(a) * (W / 2 + 1.8), lz = Math.sin(a) * (D / 2 + 1.6), g0 = gy(lx, lz); if (lz > zf - 0.2 && Math.abs(lx) < 2.2) continue; const r = rng.range(0.35, 0.65); B.sph(r, lx, g0 + r * 0.7, lz, pick(MOSS), 1.2, 0.9, 1.1, 6, 5); B.sph(r * 0.7, lx + r * 0.6, g0 + r * 0.5, lz + 0.1, pick(['#5a7a3a', '#6a8a40']), 1, 0.9, 1, 6, 5); }
    // ivy creeping up the corners
    for (const [lx, lz] of [[-W / 2, zf], [W / 2, zb], [-W / 2, zb]]) for (let k = 0; k < 14; k++) B.box(rng.range(0.14, 0.26), rng.range(0.12, 0.2), 0.06, lx + rng.range(-0.1, 0.1), 0.6 + k * 0.17 + rng.range(-0.05, 0.05), lz + rng.range(-0.1, 0.1), pick(MOSS), 0, rng.range(0, 3), rng.range(-0.5, 0.5), 0.15);
    // a rusty lantern hanging by the door and a faded, crooked sign
    B.box(0.06, 0.5, 0.06, 0.95, 2.2, zf + 0.45, '#3a2e28'); B.box(0.4, 0.05, 0.05, 0.95, 2.45, zf + 0.45, '#3a2e28', 0, 0, 0.0); B.cyl(0.09, 0.09, 0.3, 1.14, 2.12, zf + 0.45, RUST, 6); B.cyl(0.02, 0.02, 0.2, 1.14, 2.35, zf + 0.45, IRON, 4);
    const mesh = B.build(new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide }), true);
    return { mesh, door: { lx: 0, lz: zf + 1.9 }, W, D };
  }
  function LOG_R() { return 0.17; }
  return { build, W, D };
})();
