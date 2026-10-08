// the museum, deeper: parts of different furniture must not run into each other, every frame faces the right way, and every station can be reached on foot
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { Save.data.seenMuseum = true; Save.data.boxes.length = 0; const M = Boxes.MUS;
    for (const t of ['mt', 'ml', 'mr', 'mw']) for (let i = 0; i < M[t]; i++) { const size = t === 'ml' ? 'L' : t === 'mw' ? Boxes.MWCLS(i) : (i % 2 ? 'S' : 'M'); Save.addBox(size, i % 3); const b = Save.data.boxes[Save.data.boxes.length - 1]; b.loc = { t, i }; }
    F0W.fade = 0; F0W.fadeTarget = 0; F0W.toMuseum(); });
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => F0W.screen === 'cabinet' && F0W.cab && F0W.cab.constructor.name === 'Mus').catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.waitForTimeout(500);
  const r = await pg.evaluate(() => {
    const cab = F0W.cab, HX = 12, HZ = 8; cab.scene.updateMatrixWorld(true); const out = {};
    // 1. parts of different units that run into each other (all three overlaps deeper than 6 cm)
    const items = []; cab.furniture.userData.items.forEach(it => { const [x, y, z, w, h, d, ry, unit] = it, c = Math.abs(Math.cos(ry)), s = Math.abs(Math.sin(ry)), ex = (w * c + d * s) / 2, ez = (w * s + d * c) / 2; items.push({ u: unit, a: [x - ex, y - h / 2, z - ez], b: [x + ex, y + h / 2, z + ez] }); });
    const dep = (p, q, k) => Math.min(p.b[k], q.b[k]) - Math.max(p.a[k], q.a[k]); const bad = new Map();
    for (let i = 0; i < items.length; i++) for (let j = i + 1; j < items.length; j++) { const p = items[i], q = items[j]; if (p.u === q.u) continue; if (dep(p, q, 0) > 0.06 && dep(p, q, 1) > 0.06 && dep(p, q, 2) > 0.06) { const k = [p.u, q.u].sort().join(' x '); bad.set(k, (bad.get(k) || 0) + 1); } }
    out.clash = [...bad.entries()].slice(0, 25).map(e => e.join(': '));
    // 2. the frames against the furniture and against each other
    const fr = []; cab.dynamic.children.forEach((g, gi) => g.traverse(o => { if (o.isMesh && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.width > 0.2) { const bb = new THREE.Box3().setFromObject(o); fr.push({ u: 'frame' + gi, a: [bb.min.x, bb.min.y, bb.min.z], b: [bb.max.x, bb.max.y, bb.max.z] }); } }));
    const fclash = []; for (const f of fr) { for (const q of items) if (dep(f, q, 0) > 0.05 && dep(f, q, 1) > 0.05 && dep(f, q, 2) > 0.05) fclash.push(f.u + ' x ' + q.u); }
    for (let i = 0; i < fr.length; i++) for (let j = i + 1; j < fr.length; j++) if (dep(fr[i], fr[j], 0) > 0.05 && dep(fr[i], fr[j], 1) > 0.05 && dep(fr[i], fr[j], 2) > 0.05) fclash.push(fr[i].u + ' x ' + fr[j].u);
    out.frameClash = fclash.slice(0, 15); out.frames = fr.length;
    // 3. every wall frame and rack frame faces into the hall
    const face = [], Mu = Museum.LAYOUT; let k = 0;
    for (const t of ['mt', 'ml', 'mr', 'mw']) Mu.slots[t].forEach((s, i) => { const g = cab.dynamic.children[k++]; const n = new THREE.Vector3(0, 0, 1).applyQuaternion(g.quaternion); if (t === 'mw') { if ((-s.x) * n.x + (-s.z) * n.z <= 0.5) face.push('wall ' + i); } else if (t === 'mr') { const f = Mu.racks[Math.floor(i / 6)].f; if (n.z * f < 0.9) face.push('rack ' + i); } });
    out.facing = face;
    // 4. walking: a grid over the hall with the colliders and the player radius, flood-filled from the spawn
    const pr = 0.3, cell = 0.1, nx = Math.round((HX * 2) / cell), nz = Math.round((HZ * 2) / cell), free = new Uint8Array(nx * nz);
    const isFree = (x, z) => { if (x < -HX + 0.35 || x > HX - 0.35 || z < -HZ + 0.35 || z > HZ - 0.35) return false; for (const k of cab.colliders) if (x > k.x0 - pr && x < k.x1 + pr && z > k.z0 - pr && z < k.z1 + pr) return false; return true; };
    for (let j = 0; j < nz; j++) for (let i = 0; i < nx; i++) free[j * nx + i] = isFree(-HX + (i + 0.5) * cell, -HZ + (j + 0.5) * cell) ? 1 : 0;
    const seen = new Uint8Array(nx * nz), P = cab.player.pos, si = Math.floor((P.x + HX) / cell), sj = Math.floor((P.z + HZ) / cell), st = [sj * nx + si]; seen[st[0]] = 1; let reach = 0;
    while (st.length) { const c = st.pop(); reach++; const i = c % nx, j = (c / nx) | 0; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= nx || b >= nz) continue; const q = b * nx + a; if (free[q] && !seen[q]) { seen[q] = 1; st.push(q); } } }
    let total = 0; for (let q = 0; q < free.length; q++) total += free[q];
    out.reachShare = Math.round(reach / total * 1000) / 10; out.spawnFree = !!free[sj * nx + si];
    out.unreachable = cab.stations.filter(s => { let ok = false; for (let a = -s.r; a <= s.r && !ok; a += 0.1) for (let b = -s.r; b <= s.r && !ok; b += 0.1) { if (Math.hypot(a, b) > s.r * 0.85) continue; const x = s.x + a, z = s.z + b, i = Math.floor((x + HX) / cell), j = Math.floor((z + HZ) / cell); if (i >= 0 && j >= 0 && i < nx && j < nz && seen[j * nx + i]) ok = true; } return !ok; }).map(s => s.id + (s.tab ? ':' + s.tab : '') + '@' + s.x.toFixed(1) + ',' + s.z.toFixed(1));
    out.stations = cab.stations.length;
    return out;
  });
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  T('parts of different furniture do not run into each other', r.clash.length === 0, r.clash);
  T('frames do not run into furniture or each other (' + r.frames + ' frame boxes)', r.frameClash.length === 0, r.frameClash);
  T('every wall and rack frame faces into the hall', r.facing.length === 0, r.facing);
  T('the spawn is free and most of the floor can be reached on foot', r.spawnFree && r.reachShare > 90, r.reachShare);
  T('every station (' + r.stations + ') can be reached', r.unreachable.length === 0, r.unreachable);
  T('no page errors', errs.length === 0, errs.slice(0, 3));
  console.log(bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad ? 1 : 0);
})();
