// ---------------------------------------------------------------- the secret place: a tiny island in the open ocean, night, storm
// Same interface as World.build (scene, heightAt, inWater, flowers, colliders, update, ...) plus a flashlight-friendly dark look.
const Ocean = (() => {
  const V3 = THREE.Vector3, R_PLAY = 40;
  function ctex(w, h, fn, nearest = true) {
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; fn(x, w, h);
    const t = new THREE.CanvasTexture(cv); if (nearest) t.magFilter = t.minFilter = THREE.NearestFilter; return t;
  }
  function build(biome, seedStr) {
    seedStr = seedStr || World.randomSeed();
    const seed = strSeed('ocean:' + seedStr), rng = new Rng(seed), noise = new Noise2(seed ^ 0x77ab), ISL = 44;
    const scene = new THREE.Scene(); const fogCol = new THREE.Color('#04080f'); scene.background = fogCol.clone(); const fog = new THREE.FogExp2(fogCol, 0.03); scene.fog = fog;
    const world = { biome, env: { amb: 'ocean' }, scene, seedStr, flowers: [], baits: [], colliders: [], R: R_PLAY, spawnYaw: rng.range(0, 6.28), updaters: [], waters: [], hasFlash: true, mod: { storm: 1, bright: 0 }, flash: 0, grassMesh: { count: 1 }, sun: { castShadow: false }, landmarks: ['lighthouse', 'doors'] };

    // ---------------- relief: one low island, sea level at y = 0
    const edgeR = (x, z) => ISL * (0.84 + 0.3 * (noise.fbm(x * 0.045 + 3, z * 0.045 + 9, 3) - 0.5) * 1.4);
    const heightAt = (x, z) => {
      const r = Math.hypot(x, z), d = edgeR(x, z) - r; const inl = smooth(0, 14, d);
      return -0.7 + 2.1 * smooth(-3, 9, d) + (noise.fbm(x * 0.11 + 5, z * 0.11 + 1, 3) - 0.5) * 1.1 * inl + smooth(22, 0, r) * 0.7;
    };
    world.heightAt = heightAt;
    world.slopeAt = (x, z) => Math.hypot(heightAt(x + 1, z) - heightAt(x - 1, z), heightAt(x, z + 1) - heightAt(x, z - 1)) / 2;
    world.inWater = (x, z, m = 0) => heightAt(x, z) < 0.12 + m * 0.15; world.sdf = (x, z) => heightAt(x, z) - 0.12;

    // ---------------- lights: almost nothing, the flashlight does the work
    const hemi = new THREE.HemisphereLight('#2a3a5c', '#06080e', 0.55); scene.add(hemi);
    const moon = new THREE.DirectionalLight('#6a86c0', 0.55); moon.position.set(-30, 60, 40); scene.add(moon);
    const mmat = new THREE.SpriteMaterial({ map: ctex(32, 32, (x) => { const g = x.createRadialGradient(16, 16, 2, 16, 16, 15); g.addColorStop(0, 'rgba(235,240,255,0.95)'); g.addColorStop(0.35, 'rgba(180,200,240,0.5)'); g.addColorStop(1, 'rgba(120,150,210,0)'); x.fillStyle = g; x.fillRect(0, 0, 32, 32); }, false), transparent: true, fog: false, depthWrite: false, opacity: 0.55 });
    const moonS = new THREE.Sprite(mmat); moonS.scale.set(70, 70, 1); scene.add(moonS);

    // ---------------- terrain
    const SZ = 140, SEG = 140; const tg = new THREE.PlaneGeometry(SZ, SZ, SEG, SEG); tg.rotateX(-Math.PI / 2); const tp = tg.attributes.position, col = new Float32Array(tp.count * 3);
    for (let i = 0; i < tp.count; i++) {
      const x = tp.getX(i), z = tp.getZ(i), h = heightAt(x, z); tp.setY(i, h); const n = noise.at(x * 0.5, z * 0.5), n2 = noise.fbm(x * 0.06 + 20, z * 0.06, 3);
      let c;
      if (h < 0.35) c = hex2rgb('#2c2a24'); else if (h < 0.7) c = hex2rgb(n2 > 0.5 ? '#3a3a30' : '#34342c'); else c = hex2rgb(n2 > 0.55 ? '#1c3024' : '#243a2a');
      if (world.slopeAt(x, z) > 0.8) c = hex2rgb('#3a3c44'); const k = 0.82 + n * 0.3; col[i * 3] = c[0] / 255 * k; col[i * 3 + 1] = c[1] / 255 * k; col[i * 3 + 2] = c[2] / 255 * k;
    }
    tg.setAttribute('color', new THREE.BufferAttribute(col, 3)); tg.computeVertexNormals();
    scene.add(new THREE.Mesh(tg, new THREE.MeshLambertMaterial({ vertexColors: true })));

    // ---------------- ocean: rolling grid that follows the player (waves are a function of world position, so it never swims)
    const OC = 84, CELL = 3.2; const og = new THREE.PlaneGeometry(OC * CELL, OC * CELL, OC, OC); og.rotateX(-Math.PI / 2);
    const sea = new THREE.Mesh(og, new THREE.MeshPhongMaterial({ color: '#07202e', specular: '#7aa8c0', shininess: 70, flatShading: true })); sea.frustumCulled = false; scene.add(sea);
    const opos = og.attributes.position; const baseXZ = Float32Array.from(opos.array);
    const wave = (x, z, t, a) => (Math.sin(x * 0.13 + t * 0.9) * 0.2 + Math.sin(z * 0.11 - t * 0.7) * 0.17 + Math.sin((x + z) * 0.23 + t * 1.4) * 0.08) * a;

    // ---------------- rain
    const NR = 1100, rg = new THREE.BufferGeometry(), rp = new Float32Array(NR * 6), rd = [];
    for (let i = 0; i < NR; i++) rd.push({ x: rng.range(-16, 16), y: rng.range(0, 14), z: rng.range(-16, 16) });
    rg.setAttribute('position', new THREE.BufferAttribute(rp, 3)); const rain = new THREE.LineSegments(rg, new THREE.LineBasicMaterial({ color: '#a8c4e4', transparent: true, opacity: 0.55, fog: false })); rain.frustumCulled = false; scene.add(rain);

    // ---------------- dressing
    const mDark = new THREE.MeshLambertMaterial({ color: '#2a2c34' }), mWood = new THREE.MeshLambertMaterial({ color: '#4a3a2c' }), mWoodD = new THREE.MeshLambertMaterial({ color: '#2e241c' });
    const placed = [{ x: 0, z: 0, r: 5 }];
    const scatter = (n, r, rmin, rmax, hmin = 0.7) => {
      const out = []; for (let tries = 0; tries < 400 && out.length < n; tries++) {
        const a = rng.range(0, 6.283), d = rng.range(rmin, rmax), x = Math.cos(a) * d, z = Math.sin(a) * d; if (heightAt(x, z) < hmin) continue;
        if (placed.some(p => Math.hypot(p.x - x, p.z - z) < p.r + r)) continue; placed.push({ x, z, r }); out.push({ x, z, y: heightAt(x, z) });
      } return out;
    };
    const add = (m, x, y, z, ry = 0, cast = false) => { m.position.set(x, y, z); m.rotation.y = ry; scene.add(m); return m; };
    // rocks
    scatter(16, 2.2, 8, 40, 0.3).forEach(c => { const g = new THREE.IcosahedronGeometry(rng.range(0.8, 2.0), 1); const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setXYZ(i, p.getX(i) * (0.9 + rng.next() * 0.35), p.getY(i) * (0.7 + rng.next() * 0.3), p.getZ(i) * (0.9 + rng.next() * 0.35)); g.computeVertexNormals(); const m = add(new THREE.Mesh(g, mDark), c.x, c.y + 0.2, c.z, rng.range(0, 6)); world.colliders.push({ x: c.x, z: c.z, r: g.boundingSphere ? 1.1 : 1.1 }); });
    // dead trees
    scatter(7, 2.5, 10, 36, 0.8).forEach(c => {
      const g = new THREE.Group(); const H = rng.range(3.2, 5);
      const tr = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.24, H, 6), mWoodD); tr.position.y = H / 2; tr.rotation.z = rng.range(-0.18, 0.18); g.add(tr);
      for (let i = 0; i < 5; i++) { const L = rng.range(1, 2.2), b = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, L, 5), mWoodD); const y = H * rng.range(0.45, 0.95), a = rng.range(0, 6.28); b.position.set(Math.cos(a) * L * 0.4, y + L * 0.3, Math.sin(a) * L * 0.4); b.rotation.set(Math.sin(a) * 0.9, 0, -Math.cos(a) * 0.9); g.add(b); }
      add(g, c.x, c.y, c.z, rng.range(0, 6)); world.colliders.push({ x: c.x, z: c.z, r: 0.45 });
    });
    // doors standing in the open — each with a room number
    const doorTex = n => ctex(32, 56, (x, w, h) => { x.fillStyle = '#5a3820'; x.fillRect(0, 0, w, h); x.fillStyle = '#6e4a2c'; x.fillRect(3, 3, w - 6, 22); x.fillRect(3, 29, w - 6, 24); x.fillStyle = '#3a2412'; x.fillRect(3, 3, w - 6, 1); x.fillRect(3, 29, w - 6, 1); x.fillStyle = '#c8a040'; x.fillRect(5, 9, 22, 8); x.fillStyle = '#1a1008'; T.draw(x, String(n).padStart(3, '0'), 16, 9, { size: 8, align: 'c', color: '#2a1808' }); x.fillStyle = '#d8b050'; x.fillRect(25, 30, 3, 3); }, true);
    scatter(7, 2.4, 7, 36, 0.8).forEach((c, i) => {
      const g = new THREE.Group(); const dm = new THREE.MeshLambertMaterial({ map: doorTex(rng.int(1, 100) + i * 3), emissive: '#2a2010', emissiveIntensity: 0.4 });
      const slab = new THREE.Mesh(new THREE.BoxGeometry(1.1, 2.1, 0.08), [mWoodD, mWoodD, mWoodD, mWoodD, dm, dm]); slab.position.y = 1.1; g.add(slab);
      for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.12, 2.3, 0.16), mWood); p.position.set(s * 0.62, 1.15, 0); g.add(p); } const top = new THREE.Mesh(new THREE.BoxGeometry(1.36, 0.12, 0.16), mWood); top.position.y = 2.3; g.add(top);
      add(g, c.x, c.y, c.z, rng.range(0, 6)); world.colliders.push({ x: c.x, z: c.z, r: 0.7 });
    });
    // wreck on the beach
    { const c = scatter(1, 5, 28, 40, 0.3)[0]; if (c) { const g = new THREE.Group(); const hull = new THREE.Mesh(new THREE.CylinderGeometry(1.6, 1.2, 8, 8, 1, true, 0, Math.PI), mWood); hull.rotation.set(0, 0, Math.PI / 2); hull.rotation.order = 'ZYX'; hull.rotation.x = Math.PI; hull.scale.y = 1; g.add(hull); for (let i = -3; i <= 3; i++) { const rib = new THREE.Mesh(new THREE.TorusGeometry(1.4, 0.07, 5, 10, Math.PI), mWoodD); rib.position.x = i * 1.1; rib.rotation.y = Math.PI / 2; rib.rotation.z = 0; g.add(rib); } add(g, c.x, c.y + 0.6, c.z, rng.range(0, 6)); g.rotation.z = rng.range(-0.15, 0.15); world.colliders.push({ x: c.x, z: c.z, r: 2.0 }); } }
    // lighthouse with a sweeping beam
    let beam = null, beamLight = null, lampMesh = null;
    { const c = scatter(1, 5, 14, 32, 0.9)[0] || { x: -14, z: -10, y: heightAt(-14, -10) }; const g = new THREE.Group();
      const stripes = ctex(8, 32, (x, w, h) => { for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#c8c8c0' : '#9a2a2a'; x.fillRect(0, i * 4, w, 4); } });
      const body = new THREE.Mesh(new THREE.CylinderGeometry(1.1, 1.8, 12, 10), new THREE.MeshLambertMaterial({ map: stripes })); body.position.y = 6; g.add(body);
      const deck = new THREE.Mesh(new THREE.CylinderGeometry(1.7, 1.2, 0.4, 10), mDark); deck.position.y = 12.2; g.add(deck);
      lampMesh = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.4, 8), new THREE.MeshBasicMaterial({ color: '#fff4c0' })); lampMesh.position.y = 13.1; g.add(lampMesh);
      const roof = new THREE.Mesh(new THREE.ConeGeometry(1.2, 1.2, 8), mDark); roof.position.y = 14.4; g.add(roof);
      beamLight = new THREE.SpotLight('#fff0c0', 4, 90, 0.2, 0.4, 1); beamLight.position.set(0, 13.1, 0); const tgt = new THREE.Object3D(); tgt.position.set(0, 11, -20); g.add(beamLight, tgt); beamLight.target = tgt;
      beam = new THREE.Mesh(new THREE.ConeGeometry(2.6, 30, 12, 1, true), new THREE.MeshBasicMaterial({ color: '#fff0c0', transparent: true, opacity: 0.045, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false }));
      beam.geometry.translate(0, -15, 0); beam.rotation.x = Math.PI / 2 - 0.02; beam.position.set(0, 13.1, 0); const pivot = new THREE.Group(); pivot.position.set(0, 0, 0); pivot.add(beam); g.add(pivot); beam.userData.pivot = pivot; world.lighthouse = { g, pivot, tgt };
      add(g, c.x, c.y, c.z); world.colliders.push({ x: c.x, z: c.z, r: 2.1 }); world.lhPos = new V3(c.x, c.y + 13, c.z); }
    // glowing fungi — perches for the butterflies
    { const NF = 90, caps = new THREE.InstancedMesh(new THREE.SphereGeometry(0.13, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffffff', fog: true }), NF), stalk = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.015, 0.025, 0.28, 4), new THREE.MeshLambertMaterial({ color: '#8aa0a0' }), NF); const m4 = new THREE.Matrix4(); const pal = ['#4af0e0', '#a070ff', '#ff70c0', '#7ae0ff'].map(h => new THREE.Color(h)); let k = 0;
      for (let tries = 0; tries < 2000 && k < NF; tries++) { const a = rng.range(0, 6.283), d = Math.sqrt(rng.next()) * 38, x = Math.cos(a) * d, z = Math.sin(a) * d, y = heightAt(x, z); if (y < 0.55) continue;
        m4.makeScale(1, 0.7, 1); m4.setPosition(x, y + 0.3, z); caps.setMatrixAt(k, m4); caps.setColorAt(k, pal[k % 4]); m4.makeScale(1, 1, 1); m4.setPosition(x, y + 0.14, z); stalk.setMatrixAt(k, m4); world.flowers.push({ x, y: y + 0.32, z, taken: false }); k++; }
      caps.count = k; stalk.count = k; caps.instanceColor.needsUpdate = true; scene.add(caps, stalk); }
    // buoys in the water
    const buoys = []; for (let i = 0; i < 6; i++) { const a = rng.range(0, 6.283), d = rng.range(52, 90); const m = new THREE.Mesh(new THREE.SphereGeometry(0.45, 8, 6), new THREE.MeshBasicMaterial({ color: '#c02a2a' })); m.position.set(Math.cos(a) * d, 0, Math.sin(a) * d); scene.add(m); buoys.push(m); }

    // ---------------- per-frame
    let nextBolt = rng.range(5, 12), boltT = 0, boltAmp = 0, thunderAt = -1;
    world.update = (dt, t, focus) => {
      const storm = world.mod.storm; const amp = 1 + (storm - 1) * 0.8;
      // sea follows the player in whole cells
      const ox = Math.round(focus.x / CELL) * CELL, oz = Math.round(focus.z / CELL) * CELL; sea.position.set(ox, 0, oz);
      for (let i = 0; i < opos.count; i++) { const x = baseXZ[i * 3] + ox, z = baseXZ[i * 3 + 2] + oz; opos.setY(i, wave(x, z, t, amp) - 0.04); }
      opos.needsUpdate = true; og.computeVertexNormals();
      // rain
      const a = rg.attributes.position.array, fall = 20 * dt;
      for (let i = 0; i < NR; i++) { const d = rd[i]; d.y -= fall; d.x -= 2.2 * dt; if (d.y < 0) { d.y += 14; d.x = rng.range(-16, 16); d.z = rng.range(-16, 16); }
        const px = focus.x + d.x, pz = focus.z + d.z; a[i * 6] = px; a[i * 6 + 1] = focus.y - 1.6 + d.y; a[i * 6 + 2] = pz; a[i * 6 + 3] = px - 0.1; a[i * 6 + 4] = focus.y - 1.6 + d.y + 0.65; a[i * 6 + 5] = pz; }
      rg.attributes.position.needsUpdate = true;
      // lightning
      nextBolt -= dt; if (nextBolt <= 0) { nextBolt = rng.range(9, 22) / storm; boltT = 0.5; boltAmp = rng.range(0.7, 1); thunderAt = t + rng.range(0.5, 2.4); }
      if (thunderAt > 0 && t >= thunderAt) { thunderAt = -1; Snd.sfx.thunder(); }
      let fl = 0; if (boltT > 0) { boltT -= dt; fl = boltAmp * (boltT > 0.35 ? 1 : boltT > 0.28 ? 0.1 : boltT > 0.2 ? 0.8 : boltT / 0.25); } world.flash = fl;
      const br = world.mod.bright; hemi.intensity = 0.55 + br * 0.5 + fl * 2.6; moon.intensity = 0.55 + br * 0.45 + fl * 1.8;
      fog.density = 0.03 * (1 - br * 0.45) * (1 - fl * 0.5); fogCol.set('#04080f').lerp(new THREE.Color('#5a6a90'), fl * 0.6 + br * 0.12); scene.background.copy(fogCol); fog.color.copy(fogCol);
      moonS.position.set(focus.x - 120, 140, focus.z - 180);
      // lighthouse sweep
      if (world.lighthouse) { const ang = t * 0.5; world.lighthouse.pivot.rotation.y = ang; world.lighthouse.tgt.position.set(-Math.sin(ang) * 20, 12.4, -Math.cos(ang) * 20); lampMesh.material.color.setScalar(0.85 + 0.15 * Math.sin(t * 3)); }
      buoys.forEach((b, i) => { b.position.y = wave(b.position.x, b.position.z, t, amp) + 0.05; b.material.color.set(Math.sin(t * 2 + i) > 0.6 ? '#ff5a4a' : '#701a1a'); });
      world.updaters.forEach(f => f(dt, t, focus));
    };
    world.dispose = () => { scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); };
    return world;
  }
  return { build };
})();
