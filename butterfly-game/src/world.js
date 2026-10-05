// ---------------------------------------------------------------- 3D biome generator
const World = (() => {
  const SIZE = 180, SEG = 120, HALF = SIZE / 2, PLAY_R = 58;

  // ------------------------------------------------------------ biome visual presets
  const ENV = {
    russia: {
      sky: ['#5fa6e6', '#cfe6f0'], fog: ['#c4deea', 0.0085], sun: ['#fff1d0', [0.5, 0.8, 0.35]], hemi: ['#cfe6ff', '#6a8a48', 0.85],
      amp: 1.6, freq: 0.022, ground: ['#7aa84a', '#5e8a38', '#8fb85a'], rock: '#8a8a80',
      grass: { col: ['#8cc050', '#6aa03c', '#a4d060'], h: [0.5, 0.95], n: 9000 },
      flowers: [['#ffffff', 'daisy', 1.0], ['#c85a9a', 'cluster', 0.9], ['#ffd23c', 'daisy', 0.8], ['#6a7ae8', 'bell', 0.7], ['#a060d0', 'spike', 0.6], ['#f06aa0', 'spike', 0.6], ['#ffffff', 'umbel', 0.5]],
      trees: [['birch', 62], ['spruce', 14], ['bush', 24]], rocks: 8, ponds: 1, pondCol: '#4a90c0', mount: ['#6a8a5a', '#8aa07a', false, 14, 22], particles: ['fluff', '#ffffff', 1.0],
      amb: 'meadow', clouds: 0.9, bait: null,
    },
    alps: {
      sky: ['#3f86e4', '#cfe2f2'], fog: ['#d4e4f2', 0.0085], sun: ['#ffffff', [0.4, 0.85, 0.3]], hemi: ['#d8eaff', '#7a8a60', 0.95],
      amp: 4.2, freq: 0.024, ground: ['#6a9a4a', '#88a85c', '#7c8a60'], rock: '#8a8c90', slopeRock: true,
      grass: { col: ['#7aaa4a', '#5a8a3c', '#9ac05a'], h: [0.28, 0.55], n: 10000 },
      flowers: [['#3a66e8', 'bell', 1.2], ['#e84a8a', 'cluster', 0.9], ['#ffd23c', 'daisy', 1.0], ['#ffffff', 'daisy', 0.8], ['#a05ad8', 'spike', 0.7], ['#ff8a3a', 'cluster', 0.5]],
      trees: [['larch', 24], ['spruce', 20], ['bush', 16]], rocks: 46, ponds: 1, pondCol: '#46b8d0', mount: ['#7a808a', '#c8d4e0', true, 18, 46], particles: ['sparkle', '#ffffff', 0.7],
      amb: 'alpine', clouds: 1.2, bait: null,
    },
    med: {
      sky: ['#4a9ef0', '#f0e6cc'], fog: ['#efe4cc', 0.0095], sun: ['#fff0c8', [0.6, 0.75, 0.3]], hemi: ['#f0e8d0', '#a89868', 0.9],
      amp: 2.6, freq: 0.026, ground: ['#b8a870', '#a89860', '#c8b880'], rock: '#c8c0a8',
      grass: { col: ['#c8b45c', '#a89a48', '#d8c470'], h: [0.3, 0.6], n: 8000 },
      flowers: [['#9a6ad8', 'spike', 1.3], ['#e83a2a', 'daisy', 0.9], ['#ffd23c', 'cluster', 1.0], ['#ffffff', 'daisy', 0.8], ['#e86a9a', 'cluster', 0.7], ['#ff9a2a', 'umbel', 0.5]],
      trees: [['olive', 24], ['cypress', 16], ['arbutus', 16], ['bush', 30]], rocks: 44, ponds: 0, pondCol: '#4aa0c8', mount: ['#9a8a70', '#c4b494', false, 18, 36], particles: ['pollen', '#ffe28a', 0.9],
      amb: 'med', clouds: 0.4, bait: 'fruit',
    },
    amazon: {
      sky: ['#5aa8c0', '#cfeadc'], fog: ['#9ac8ae', 0.021], sun: ['#fff4d0', [0.3, 0.9, 0.2]], hemi: ['#bfe8d0', '#2e4a22', 0.7],
      amp: 1.4, freq: 0.03, ground: ['#3e5a2a', '#2e4a22', '#5a4a2e'], rock: '#6a6a5a', litter: true,
      grass: { col: ['#3e9a3a', '#2e7a30', '#58b048'], h: [0.55, 1.15], n: 8500 },
      flowers: [['#e83a2a', 'spike', 1.3], ['#ff9a1a', 'spike', 1.0], ['#a04ad8', 'daisy', 0.9], ['#f06ac8', 'cluster', 0.9], ['#ffffff', 'bell', 0.7], ['#ffd23c', 'daisy', 0.7]],
      trees: [['giant', 30], ['palm', 18], ['fern', 24], ['bush', 24]], rocks: 8, ponds: 1, pondCol: '#2e5a4a', mount: ['#2e5a3a', '#4a7a54', false, 12, 20], particles: ['spores', '#e8ffa0', 1.0],
      amb: 'rainforest', clouds: 0.5, bait: 'fruit',
    },
    borneo: {
      sky: ['#6ab4d0', '#d8f0e4'], fog: ['#a0ccb4', 0.020], sun: ['#fff0c8', [0.35, 0.85, 0.3]], hemi: ['#c0e8d4', '#34502a', 0.72],
      amp: 1.6, freq: 0.03, ground: ['#4a5a2a', '#3a4a22', '#6a5a38'], rock: '#7a7468', litter: true,
      grass: { col: ['#44a040', '#2e8030', '#62b84c'], h: [0.5, 1.1], n: 8500 },
      flowers: [['#e8301a', 'daisy', 1.1], ['#ff6a8a', 'spike', 1.2], ['#ffffff', 'bell', 0.9], ['#c06af0', 'cluster', 0.9], ['#ffb02a', 'daisy', 0.8], ['#f8e84a', 'cluster', 0.6]],
      trees: [['dipt', 28], ['palm', 16], ['fern', 22], ['bush', 24]], rocks: 14, ponds: 1, pondCol: '#3a7a8a', sand: true, mount: ['#3a6a4a', '#7aa08a', false, 16, 34], particles: ['spores', '#fff0a0', 1.0],
      amb: 'rainforest2', clouds: 0.5, bait: ['salt', 'fruit'],
    },
    kenya: {
      sky: ['#3f96e6', '#f4ead0'], fog: ['#f0e0b8', 0.0085], sun: ['#fff0c0', [0.7, 0.7, 0.2]], hemi: ['#f4ecd0', '#b89a58', 0.95],
      amp: 1.3, freq: 0.018, ground: ['#c8a860', '#b89850', '#d8b870'], rock: '#9a8468',
      grass: { col: ['#d8b860', '#c09a48', '#e8cc78'], h: [0.7, 1.25], n: 11000 },
      flowers: [['#e84a1a', 'spike', 1.1], ['#e060a0', 'cluster', 1.0], ['#ff9a2a', 'cluster', 1.0], ['#ffffff', 'daisy', 0.7], ['#ffd23c', 'daisy', 0.8], ['#9a5ae0', 'bell', 0.6]],
      trees: [['acacia', 12], ['baobab', 2], ['bush', 32], ['termite', 6]], rocks: 14, ponds: 1, pondCol: '#6a8a8a', mount: ['#8a7a5a', '#b4a07a', false, 6, 14], particles: ['dust', '#f4e0a0', 0.9],
      amb: 'savanna', clouds: 0.5, bait: 'salt',
    },
    prairie: {
      sky: ['#55a6f0', '#e0eef4'], fog: ['#d4e6ee', 0.0075], sun: ['#fff4d8', [0.55, 0.8, 0.25]], hemi: ['#d8eeff', '#8aa850', 0.9],
      amp: 1.0, freq: 0.016, ground: ['#8aa84a', '#9ab858', '#7a9a40'], rock: '#8a8a7a',
      grass: { col: ['#a8b858', '#88a048', '#bccb68'], h: [0.7, 1.3], n: 11000 },
      flowers: [['#c060b0', 'daisy', 1.2], ['#ffcc20', 'daisy', 1.2], ['#e87aa0', 'umbel', 1.3], ['#a05ae0', 'spike', 0.9], ['#ffffff', 'daisy', 0.6], ['#ff8a2a', 'cluster', 0.6]],
      trees: [['cotton', 7], ['willow', 7], ['bush', 24]], rocks: 6, ponds: 1, pondCol: '#5a9ac0', mount: ['#7a9a6a', '#a0b88a', false, 4, 10], particles: ['fluff', '#fff4d8', 1.0],
      amb: 'prairie', clouds: 1.0, bait: null,
    },
    japan: {
      sky: ['#5ba8dc', '#dcecec'], fog: ['#c8e0e0', 0.013], sun: ['#fff4dc', [0.4, 0.85, 0.3]], hemi: ['#d4ecec', '#4a7a38', 0.82],
      amp: 2.4, freq: 0.026, ground: ['#5a8a42', '#4a7a38', '#6a9a4a'], rock: '#7a7c78', moss: true,
      grass: { col: ['#6aa848', '#4a8a3a', '#82c05a'], h: [0.4, 0.8], n: 9000 },
      flowers: [['#6a7ae8', 'cluster', 1.2], ['#c06ae0', 'cluster', 0.9], ['#ff8a1a', 'bell', 1.0], ['#ffffff', 'daisy', 0.8], ['#f06aa0', 'daisy', 1.0], ['#ffd23c', 'daisy', 0.6]],
      trees: [['crypto', 34], ['maple', 22], ['bamboo', 8], ['bush', 18]], rocks: 20, ponds: 1, pondCol: '#4a8aa0', torii: true, mount: ['#4a6a5a', '#8aa4a0', false, 20, 40], particles: ['petals', '#ffb8d0', 1.0],
      amb: 'forest', clouds: 0.7, bait: 'sap',
    },
  };

  // ------------------------------------------------------------ small geometry toolkit
  function jitterGeo(g, amt, rng) {
    const p = g.attributes.position, map = {};
    for (let i = 0; i < p.count; i++) {
      const k = Math.round(p.getX(i) * 100) + '_' + Math.round(p.getY(i) * 100) + '_' + Math.round(p.getZ(i) * 100);
      let d = map[k]; if (!d) d = map[k] = [(rng.next() - 0.5) * amt, (rng.next() - 0.5) * amt, (rng.next() - 0.5) * amt];
      p.setXYZ(i, p.getX(i) + d[0], p.getY(i) + d[1], p.getZ(i) + d[2]);
    }
    return g;
  }
  const blobG = (r, rng, jit = 0.3, detail = 1) => jitterGeo(new THREE.IcosahedronGeometry(r, detail), r * jit, rng);
  const cylG = (rt, rb, h, seg = 6) => { const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1); g.translate(0, h / 2, 0); return g; };
  const coneG = (r, h, seg = 7) => { const g = new THREE.ConeGeometry(r, h, seg, 1); g.translate(0, h / 2, 0); return g; };
  function M(x, y, z, rx = 0, ry = 0, rz = 0, sx = 1, sy = sx, sz = sx) {
    return new THREE.Matrix4().compose(new THREE.Vector3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new THREE.Vector3(sx, sy, sz));
  }
  function frondG(len, wid, bend, segs = 6) {
    const pos = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const t = i / segs, x = len * t, y = len * 0.18 * Math.sin(t * 2.2) - bend * len * t * t, w = wid * (Math.pow(Math.sin(Math.PI * (0.12 + t * 0.88)), 0.7) + 0.06);
      pos.push(x, y, -w / 2, x, y, w / 2);
      if (i < segs) { const a = i * 2; idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
  }
  // merge parts [{g, m, c:hex | [bottom, top, y0, y1], j}] into one vertex-coloured, flat-shaded geometry
  function merge(parts, rng) {
    const P = [], Cc = [];
    for (const part of parts) {
      let g = part.g.index ? part.g.toNonIndexed() : part.g.clone(); g.applyMatrix4(part.m || new THREE.Matrix4());
      const a = g.attributes.position; const jit = part.j === undefined ? 0.1 : part.j;
      const c0 = hex2rgb(Array.isArray(part.c) ? part.c[0] : part.c), c1 = Array.isArray(part.c) ? hex2rgb(part.c[1]) : c0;
      const y0 = Array.isArray(part.c) ? part.c[2] : 0, y1 = Array.isArray(part.c) ? part.c[3] : 1;
      for (let i = 0; i < a.count; i += 3) {
        const k = 1 + (rng.next() - 0.5) * 2 * jit;
        for (let v = 0; v < 3; v++) {
          const x = a.getX(i + v), y = a.getY(i + v), z = a.getZ(i + v);
          const t = clamp((y - y0) / (y1 - y0 || 1));
          P.push(x, y, z); Cc.push(lerp(c0[0], c1[0], t) / 255 * k, lerp(c0[1], c1[1], t) / 255 * k, lerp(c0[2], c1[2], t) / 255 * k);
        }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.computeVertexNormals();
    return g;
  }

  // ------------------------------------------------------------ tree builders (return merged geometry + collision radius + height)
  const TREES = {
    birch(r) {
      const parts = []; const H = r.range(5.5, 8);
      parts.push({ g: cylG(0.1, 0.16, H, 6), c: '#e6e4d8', j: 0.05 });
      for (let i = 0; i < 6; i++) parts.push({ g: new THREE.BoxGeometry(0.34, 0.09, 0.34), m: M(0, 0.6 + i * (H / 7), 0, 0, i, 0), c: '#2a2a28', j: 0 });
      const cols = ['#6aa238', '#5a9230', '#7ab444', '#8cc050'];
      for (let i = 0; i < 7; i++) { const a = r.range(0, 6.28), d = r.range(0, 1.3), y = H * 0.62 + r.range(0, H * 0.4); parts.push({ g: blobG(r.range(0.9, 1.5), r), m: M(Math.cos(a) * d, y, Math.sin(a) * d), c: r.pick(cols), j: 0.12 }); }
      return { g: merge(parts, r), rad: 0.3, h: H + 1 };
    },
    spruce(r) {
      const parts = []; const H = r.range(7, 11);
      parts.push({ g: cylG(0.14, 0.24, H * 0.3, 6), c: '#4a3424', j: 0.05 });
      const tiers = 6;
      for (let i = 0; i < tiers; i++) { const t = i / (tiers - 1); parts.push({ g: coneG(lerp(2.0, 0.6, t), H * 0.28, 8), m: M(0, H * 0.14 + t * H * 0.66, 0, 0, i * 0.7), c: ['#1e4a2c', '#2e6a3a', 0, H], j: 0.1 }); }
      return { g: merge(parts, r), rad: 0.35, h: H };
    },
    larch(r) {
      const parts = []; const H = r.range(6, 9);
      parts.push({ g: cylG(0.1, 0.18, H * 0.4, 6), c: '#5a4030', j: 0.05 });
      for (let i = 0; i < 5; i++) { const t = i / 4; parts.push({ g: coneG(lerp(1.5, 0.5, t), H * 0.3, 7), m: M(0, H * 0.18 + t * H * 0.6, 0, 0, i), c: ['#78a040', '#9cc050', 0, H], j: 0.15 }); }
      return { g: merge(parts, r), rad: 0.3, h: H };
    },
    cypress(r) {
      const parts = []; const H = r.range(8, 12);
      parts.push({ g: cylG(0.14, 0.2, 0.8, 6), c: '#4a3828', j: 0.05 });
      parts.push({ g: coneG(1.05, H, 7), m: M(0, 0.5, 0), c: ['#1c4426', '#2c6234', 0, H], j: 0.14 });
      parts.push({ g: blobG(0.9, r), m: M(0, H * 0.35, 0, 0, 0, 0, 1, 2.2, 1), c: '#235a2e', j: 0.1 });
      return { g: merge(parts, r), rad: 0.45, h: H };
    },
    olive(r) {
      const parts = []; const H = r.range(3.2, 4.6);
      parts.push({ g: cylG(0.22, 0.34, H * 0.55, 7), m: M(0, 0, 0, 0, 0, 0.12), c: '#6a5a46', j: 0.12 });
      parts.push({ g: cylG(0.14, 0.22, H * 0.5, 6), m: M(0.1, H * 0.35, 0, 0, 0, -0.55), c: '#6a5a46', j: 0.12 });
      parts.push({ g: cylG(0.14, 0.22, H * 0.5, 6), m: M(-0.1, H * 0.35, 0.05, 0.2, 0, 0.6), c: '#6a5a46', j: 0.12 });
      const cols = ['#8a9c6a', '#7a8e5c', '#9aac7a', '#6e8250'];
      for (let i = 0; i < 6; i++) { const a = r.range(0, 6.28), d = r.range(0.2, 1.4); parts.push({ g: blobG(r.range(0.9, 1.4), r), m: M(Math.cos(a) * d, H * 0.75 + r.range(-0.3, 0.6), Math.sin(a) * d, 0, 0, 0, 1, 0.7, 1), c: r.pick(cols), j: 0.1 }); }
      return { g: merge(parts, r), rad: 0.4, h: H + 1 };
    },
    arbutus(r) {
      const parts = []; const H = r.range(3, 4.4);
      parts.push({ g: cylG(0.16, 0.26, H * 0.6, 6), m: M(0, 0, 0, 0, 0, -0.1), c: '#9a4a30', j: 0.1 });
      const cols = ['#2e6a34', '#3a7a3c', '#26582e'];
      for (let i = 0; i < 6; i++) { const a = r.range(0, 6.28), d = r.range(0.1, 1.2); parts.push({ g: blobG(r.range(0.8, 1.3), r), m: M(Math.cos(a) * d, H * 0.72 + r.range(-0.2, 0.7), Math.sin(a) * d), c: r.pick(cols), j: 0.1 }); }
      for (let i = 0; i < 7; i++) { const a = r.range(0, 6.28), d = r.range(0.4, 1.4); parts.push({ g: new THREE.IcosahedronGeometry(0.08, 0), m: M(Math.cos(a) * d, H * 0.7 + r.range(-0.2, 0.5), Math.sin(a) * d), c: '#e8402a', j: 0 }); }
      return { g: merge(parts, r), rad: 0.35, h: H + 1 };
    },
    giant(r) {
      const parts = []; const H = r.range(15, 22);
      parts.push({ g: cylG(0.55, 0.85, H, 8), c: ['#6a5a48', '#5a4a3a', 0, H], j: 0.08 });
      for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28; parts.push({ g: new THREE.BoxGeometry(0.15, 3.2, 1.6), m: M(Math.cos(a) * 0.7, 1.4, Math.sin(a) * 0.7, 0, -a, 0.2), c: '#5a4a3a', j: 0.06 }); }
      const cols = ['#2e7a34', '#3a8a3a', '#26682c', '#4a9a40'];
      for (let i = 0; i < 9; i++) { const a = r.range(0, 6.28), d = r.range(1.5, 4.5); parts.push({ g: blobG(r.range(2.2, 3.6), r), m: M(Math.cos(a) * d, H * 0.88 + r.range(-1.2, 1.5), Math.sin(a) * d, 0, 0, 0, 1, 0.65, 1), c: r.pick(cols), j: 0.1 }); }
      for (let i = 0; i < 6; i++) { const a = r.range(0, 6.28), d = r.range(0.6, 1.1); parts.push({ g: cylG(0.04, 0.04, r.range(5, 9), 4), m: M(Math.cos(a) * d, H * 0.55, Math.sin(a) * d), c: '#3a5a2a', j: 0.05 }); }
      return { g: merge(parts, r), rad: 1.0, h: H + 3 };
    },
    dipt(r) {
      const parts = []; const H = r.range(18, 26);
      parts.push({ g: cylG(0.38, 0.55, H, 8), c: ['#9a8a74', '#8a7a64', 0, H], j: 0.07 });
      for (let i = 0; i < 4; i++) { const a = i / 4 * 6.28 + 0.4; parts.push({ g: new THREE.BoxGeometry(0.12, 2.4, 1.1), m: M(Math.cos(a) * 0.5, 1.0, Math.sin(a) * 0.5, 0, -a, 0.15), c: '#8a7a64', j: 0.06 }); }
      const cols = ['#2e8236', '#3a923c', '#28702e', '#4aa244'];
      for (let i = 0; i < 8; i++) { const a = r.range(0, 6.28), d = r.range(1.2, 3.8); parts.push({ g: blobG(r.range(1.8, 3.0), r), m: M(Math.cos(a) * d, H * 0.9 + r.range(-1, 1.5), Math.sin(a) * d, 0, 0, 0, 1, 0.7, 1), c: r.pick(cols), j: 0.1 }); }
      return { g: merge(parts, r), rad: 0.7, h: H + 3 };
    },
    palm(r) {
      const parts = []; const H = r.range(6, 10); const lean = r.range(-0.18, 0.18);
      const segs = 7; let px = 0;
      for (let i = 0; i < segs; i++) { const y = i * H / segs; const x = lean * y * y / H; parts.push({ g: cylG(0.14, 0.17, H / segs + 0.05, 6), m: M(x, y, 0, 0, 0, lean * 0.4), c: i % 2 ? '#8a7a5a' : '#7a6a4a', j: 0.04 }); px = x; }
      for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 + r.range(-0.2, 0.2); parts.push({ g: frondG(r.range(2.4, 3.4), 0.85, r.range(0.3, 0.7)), m: M(px, H, 0, 0, a), c: ['#2a7a30', '#4a9a3c', 0, 4], j: 0.1 }); }
      parts.push({ g: blobG(0.22, r), m: M(px, H - 0.2, 0), c: '#5a4a2a' });
      return { g: merge(parts, r), rad: 0.28, h: H + 1 };
    },
    fern(r) {
      const parts = []; const H = r.range(1.4, 3.2);
      parts.push({ g: cylG(0.1, 0.14, H, 6), c: '#5a4a32', j: 0.08 });
      for (let i = 0; i < 11; i++) { const a = i / 11 * 6.28 + r.range(-0.15, 0.15); parts.push({ g: frondG(r.range(1.6, 2.4), 0.6, r.range(0.2, 0.55)), m: M(0, H, 0, 0, a, r.range(0.05, 0.4)), c: ['#2e8a34', '#58b44a', 0, 3.5], j: 0.12 }); }
      return { g: merge(parts, r), rad: 0.2, h: H + 1 };
    },
    acacia(r) {
      const parts = []; const H = r.range(4.5, 6.5);
      parts.push({ g: cylG(0.14, 0.24, H * 0.7, 6), m: M(0, 0, 0, 0, 0, 0.08), c: '#5a4630', j: 0.1 });
      parts.push({ g: cylG(0.1, 0.16, H * 0.5, 6), m: M(0.1, H * 0.45, 0, 0, 0, -0.7), c: '#5a4630', j: 0.1 });
      parts.push({ g: cylG(0.1, 0.16, H * 0.5, 6), m: M(-0.1, H * 0.45, 0, 0.5, 0, 0.6), c: '#5a4630', j: 0.1 });
      const cols = ['#6a8a2a', '#7a9a34', '#5a7a24'];
      for (let i = 0; i < 6; i++) { const a = r.range(0, 6.28), d = r.range(0.3, 3.0); parts.push({ g: blobG(r.range(1.2, 2.0), r), m: M(Math.cos(a) * d, H * 0.98 + r.range(-0.15, 0.25), Math.sin(a) * d, 0, 0, 0, 1.3, 0.32, 1.3), c: r.pick(cols), j: 0.08 }); }
      return { g: merge(parts, r), rad: 0.3, h: H + 1 };
    },
    baobab(r) {
      const parts = []; const H = r.range(7, 9);
      parts.push({ g: cylG(1.2, 1.7, H * 0.8, 9), c: ['#8a7660', '#7a6650', 0, H], j: 0.08 });
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; parts.push({ g: cylG(0.2, 0.45, 3.2, 6), m: M(Math.cos(a) * 0.5, H * 0.74, Math.sin(a) * 0.5, Math.sin(a) * 0.8, 0, -Math.cos(a) * 0.8), c: '#7a6650', j: 0.08 }); }
      for (let i = 0; i < 5; i++) { const a = r.range(0, 6.28), d = r.range(1, 3); parts.push({ g: blobG(1.1, r), m: M(Math.cos(a) * d, H + 1.8 + r.range(-0.4, 0.6), Math.sin(a) * d, 0, 0, 0, 1, 0.55, 1), c: '#6a8a34', j: 0.1 }); }
      return { g: merge(parts, r), rad: 1.7, h: H + 3 };
    },
    cotton(r) {
      const parts = []; const H = r.range(8, 11);
      parts.push({ g: cylG(0.3, 0.5, H * 0.6, 7), c: '#6a5a46', j: 0.1 });
      const cols = ['#7aa83c', '#6a983a', '#8ab848', '#5e8a34'];
      for (let i = 0; i < 9; i++) { const a = r.range(0, 6.28), d = r.range(0.4, 2.8); parts.push({ g: blobG(r.range(1.3, 2.1), r), m: M(Math.cos(a) * d, H * 0.7 + r.range(0, H * 0.35), Math.sin(a) * d), c: r.pick(cols), j: 0.12 }); }
      return { g: merge(parts, r), rad: 0.6, h: H + 2 };
    },
    willow(r) {
      const parts = []; const H = r.range(5, 7);
      parts.push({ g: cylG(0.22, 0.4, H * 0.5, 7), c: '#5a4a36', j: 0.1 });
      const cols = ['#8aaa48', '#7a9a3c', '#9ab858'];
      for (let i = 0; i < 6; i++) { const a = r.range(0, 6.28), d = r.range(0.4, 2.0); parts.push({ g: blobG(r.range(1.2, 1.8), r), m: M(Math.cos(a) * d, H * 0.7, Math.sin(a) * d), c: r.pick(cols), j: 0.1 }); }
      for (let i = 0; i < 14; i++) { const a = r.range(0, 6.28), d = r.range(1.2, 2.6); parts.push({ g: cylG(0.04, 0.03, r.range(2, 3.4), 4), m: M(Math.cos(a) * d, H * 0.7 - 2.6, Math.sin(a) * d), c: '#8aaa48', j: 0.08 }); }
      return { g: merge(parts, r), rad: 0.5, h: H + 1 };
    },
    crypto(r) {
      const parts = []; const H = r.range(14, 22);
      parts.push({ g: cylG(0.3, 0.55, H * 0.7, 7), c: '#6a4a38', j: 0.08 });
      for (let i = 0; i < 6; i++) { const t = i / 5; parts.push({ g: coneG(lerp(2.0, 0.6, t), H * 0.26, 8), m: M(0, H * 0.18 + t * H * 0.68, 0, 0, i * 0.8), c: ['#1e3e28', '#2e5a34', 0, H], j: 0.1 }); }
      return { g: merge(parts, r), rad: 0.6, h: H };
    },
    maple(r) {
      const parts = []; const H = r.range(5, 7);
      parts.push({ g: cylG(0.14, 0.26, H * 0.55, 6), c: '#5a4a3a', j: 0.1 });
      const autumn = r.chance(0.3);
      const cols = autumn ? ['#d8401a', '#e8741c', '#c82a18'] : ['#3a8a38', '#4a9a3c', '#2e7a32'];
      for (let i = 0; i < 7; i++) { const a = r.range(0, 6.28), d = r.range(0.2, 1.8); parts.push({ g: blobG(r.range(1.0, 1.7), r), m: M(Math.cos(a) * d, H * 0.7 + r.range(0, H * 0.3), Math.sin(a) * d), c: r.pick(cols), j: 0.14 }); }
      return { g: merge(parts, r), rad: 0.35, h: H + 1 };
    },
    bamboo(r) {
      const parts = []; const n = 9;
      for (let i = 0; i < n; i++) {
        const a = r.range(0, 6.28), d = r.range(0, 1.0), H = r.range(7, 11), x = Math.cos(a) * d, z = Math.sin(a) * d;
        parts.push({ g: cylG(0.05, 0.07, H, 5), m: M(x, 0, z, r.range(-0.04, 0.04), 0, r.range(-0.04, 0.04)), c: ['#6aa83a', '#8ac04a', 0, H], j: 0.05 });
        for (let k = 1; k < 6; k++) parts.push({ g: cylG(0.085, 0.085, 0.07, 5), m: M(x, k * H / 6, z), c: '#4a7a28', j: 0 });
        for (let k = 0; k < 4; k++) parts.push({ g: frondG(1.2, 0.35, 0.3, 3), m: M(x, H * (0.78 + k * 0.05), z, 0, r.range(0, 6.28), 0.2), c: ['#3e8a30', '#62b043', 0, 12], j: 0.1 });
      }
      return { g: merge(parts, r), rad: 1.0, h: 11 };
    },
    bush(r, env) {
      const parts = []; const cols = env._bush;
      for (let i = 0; i < 4; i++) parts.push({ g: blobG(r.range(0.45, 0.8), r), m: M(r.range(-0.5, 0.5), 0.4 + r.range(0, 0.3), r.range(-0.5, 0.5), 0, 0, 0, 1, 0.8, 1), c: r.pick(cols), j: 0.14 });
      return { g: merge(parts, r), rad: 0.55, h: 1.2 };
    },
    termite(r) {
      const parts = [];
      parts.push({ g: coneG(0.9, 2.2, 7), c: ['#8a5a3a', '#a8734a', 0, 2.2], j: 0.16 });
      parts.push({ g: coneG(0.5, 1.6, 6), m: M(0.5, 0, 0.2), c: '#9a6642', j: 0.16 });
      return { g: merge(parts, r), rad: 0.9, h: 2.3 };
    },
    rock(r, env) {
      const parts = [];
      const base = env.rock;
      parts.push({ g: blobG(r.range(0.7, 1.4), r, 0.5, 0), m: M(0, 0.25, 0, 0, r.range(0, 6), 0, 1.2, 0.7, 1), c: [shadeHex(base, 0.8), shadeHex(base, 1.15), 0, 1.4], j: 0.16 });
      if (r.chance(0.5)) parts.push({ g: blobG(r.range(0.4, 0.8), r, 0.5, 0), m: M(r.range(-0.8, 0.8), 0.15, r.range(-0.8, 0.8), 0, 0, 0, 1.1, 0.7, 1), c: shadeHex(base, 0.95), j: 0.16 });
      return { g: merge(parts, r), rad: 0.8, h: 1.2 };
    },
  };

  // ------------------------------------------------------------ textures
  function canvasTex(w, h, fn, repeat) {
    const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d'); fn(x, w, h);
    const t = new THREE.CanvasTexture(c); t.magFilter = THREE.NearestFilter; t.minFilter = THREE.NearestFilter; t.generateMipmaps = false;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } return t;
  }
  function groundTex(rng) {
    return canvasTex(32, 32, (x, w, h) => {
      const d = x.createImageData(w, h);
      for (let i = 0; i < w * h; i++) { const k = 205 + rng.range(-34, 34) + (rng.chance(0.08) ? -40 : 0); d.data[i * 4] = d.data[i * 4 + 1] = d.data[i * 4 + 2] = k; d.data[i * 4 + 3] = 255; }
      x.putImageData(d, 0, 0);
    }, true);
  }
  // sprite grids: p = petal (R), s = stem/leaf (G), c = centre (B)
  const FLOWER_GRIDS = {
    daisy: ['................', '................', '.....pp..pp.....', '....pppppppp....', '....ppccccpp....', '...pppccccppp...', '....ppccccpp....', '....pppppppp....', '.....pp..pp.....', '.......s........', '.......s........', '.....s.s........', '......ss...s....', '.......s..s.....', '.......ss.s.....', '.......sss......'],
    bell: ['................', '................', '.......ss.......', '.....pp.s.pp....', '....pppps.ppp...', '....pppp.pppp...', '...ppppp.pppp...', '...pp.pp..pp....', '.......s........', '.......s........', '.......s........', '......ss........', '.....s.s.s......', '......ss.s......', '.......sss......', '.......sss......'],
    spike: ['.......p........', '......ppp.......', '.....pppp.......', '......pppp......', '.....ppppp......', '......pppp......', '.....ppppp......', '......ppp.......', '.......ps.......', '.......s........', '.....s.s........', '......ss..s.....', '.......s.s......', '.......ss.......', '.......sss......', '.......sss......'],
    cluster: ['................', '....pp...pp.....', '...pppp.pppp....', '...pppp.pppp....', '....pp.pp.pp....', '.....pppppp.....', '......pppp......', '.......ps.......', '.......s........', '.....s.s........', '......ss.s......', '.......s.s......', '.......ss.......', '.......ss.......', '.......sss......', '.......sss......'],
    umbel: ['................', '..p.p.pp.p.p....', '.pppppppppppp...', '..pppppppppp....', '...pp.pp.pp.....', '.....pp.pp......', '......p.p.......', '.......s........', '.......s........', '.....s.s........', '......ss........', '.......s.s......', '.......ss.......', '.......sss......', '.......sss......', '.......sss......'],
  };
  const KINDS = ['daisy', 'bell', 'spike', 'cluster', 'umbel'];
  function flowerAtlas() {
    return canvasTex(16 * KINDS.length, 16, (x, w, h) => {
      const d = x.createImageData(w, h);
      KINDS.forEach((k, ki) => {
        FLOWER_GRIDS[k].forEach((row, y) => { for (let xx = 0; xx < 16; xx++) { const ch = row[xx]; const i = (y * w + ki * 16 + xx) * 4; if (ch === 'p') { d.data[i] = 255; d.data[i + 3] = 255; } else if (ch === 'c') { d.data[i + 2] = 255; d.data[i + 3] = 255; } else if (ch === 's') { d.data[i + 1] = 255; d.data[i + 3] = 255; } } });
      });
      x.putImageData(d, 0, 0);
    });
  }
  function grassAtlas(rng) {
    return canvasTex(16, 16, (x, w, h) => {
      const d = x.createImageData(w, h);
      for (let b = 0; b < 5; b++) {
        const bx = 2 + b * 3 + rng.int(-1, 1), top = rng.int(1, 6), lean = rng.range(-0.25, 0.25);
        for (let y = top; y < 16; y++) { const t = (y - top) / 15; const xx = Math.round(bx + lean * (15 - y) * 0.5); for (let k = 0; k < (y < top + 3 ? 1 : 2); k++) { const i = (y * w + clamp(xx + k, 0, 15)) * 4; d.data[i + 1] = 255; d.data[i + 3] = 255; d.data[i] = Math.round(t * 200); } }
      }
      x.putImageData(d, 0, 0);
    });
  }

  // ------------------------------------------------------------ shaders for foliage
  const FOLIAGE_VS = `
    uniform float uTime; uniform float uWind;
    attribute float aKind;
    varying vec2 vUv; varying vec3 vCol; varying float vDist; varying float vH; varying float vKind;
    void main(){
      vUv = uv; vKind = aKind; vH = position.y;
      vec4 wp = instanceMatrix * vec4(position, 1.0);
      float h = position.y;
      float sw = sin(uTime*1.7 + wp.x*0.33 + wp.z*0.27) * 0.16 * h * h + sin(uTime*3.3 + wp.x*1.3 + wp.z*0.9) * 0.04 * h;
      wp.x += sw * uWind; wp.z += sw * 0.6 * uWind;
      vec4 mv = viewMatrix * wp; vDist = -mv.z;
      #ifdef USE_INSTANCING_COLOR
      vCol = instanceColor;
      #else
      vCol = vec3(1.0);
      #endif
      gl_Position = projectionMatrix * mv;
    }`;
  const FOLIAGE_FS = `
    uniform sampler2D uMap; uniform vec3 uFog; uniform float uFogD; uniform vec3 uLight; uniform vec3 uCenter; uniform float uFlower; uniform float uAtlasN;
    varying vec2 vUv; varying vec3 vCol; varying float vDist; varying float vH; varying float vKind;
    void main(){
      vec2 uv = vec2((vUv.x + vKind) / uAtlasN, vUv.y);
      vec4 t = texture2D(uMap, uv);
      if (t.a < 0.5) discard;
      vec3 col;
      if (uFlower > 0.5) {
        vec3 leaf = vec3(0.30, 0.55, 0.20) * (0.7 + 0.3 * vUv.y);
        col = vCol * t.r + vec3(0.9,0.8,0.2) * 0.0 + uCenter * t.b + leaf * t.g;
        col = max(col, vec3(0.0));
      } else {
        col = vCol * (0.55 + 0.7 * clamp(vUv.y, 0.0, 1.0)) * (0.8 + 0.3 * t.r);
      }
      col *= uLight;
      float f = 1.0 - exp(-uFogD * uFogD * vDist * vDist);
      gl_FragColor = vec4(mix(col, uFog, clamp(f, 0.0, 1.0)), 1.0);
    }`;

  // ------------------------------------------------------------ world builder
  function build(biome) {
    const env = ENV[biome.id]; const seed = strSeed(biome.id + '_world');
    const rng = new Rng(seed), noise = new Noise2(seed ^ 0x9e37);
    env._bush = env.trees.some(t => t[0] === 'bush') ? ({ russia: ['#5a9a38', '#6aaa40'], alps: ['#5a8a3a', '#7aa04a'], med: ['#8a9a5a', '#a89a58', '#9a7ac8'], amazon: ['#2e7a34', '#3e8a3c'], borneo: ['#2e7a34', '#4a9a40'], kenya: ['#9a9a4a', '#b8a850'], prairie: ['#7a9a40', '#8aa84a'], japan: ['#3a7a38', '#e060a0'] }[biome.id]) : ['#4a8a38'];
    const scene = new THREE.Scene();
    const fogCol = new THREE.Color(env.fog[0]);
    scene.background = fogCol.clone(); scene.fog = new THREE.FogExp2(fogCol, env.fog[1]);
    const world = { biome, env, scene, flowers: [], baits: [], colliders: [], R: PLAY_R, spawn: new THREE.Vector3(0, 0, 0), updaters: [], water: [] };

    // ---- terrain heightfield
    const N1 = SEG + 1; const H = new Float32Array(N1 * N1);
    const ponds = [];
    for (let i = 0; i < env.ponds; i++) { const a = rng.range(0, 6.28), d = rng.range(18, 36); ponds.push({ x: Math.cos(a) * d, z: Math.sin(a) * d, r: rng.range(4.5, 7), }); }
    const baseH = (x, z) => {
      let h = (noise.fbm(x * env.freq + 11, z * env.freq + 5, 4) - 0.5) * 2 * env.amp;
      const r = Math.hypot(x, z);
      h *= smooth(5, 16, r);
      h += Math.pow(clamp((r - 56) / 30), 2) * (env.amp * 2.6 + 5) * (0.75 + 0.5 * noise.at(x * 0.05 + 40, z * 0.05 + 7));
      return h;
    };
    for (const p of ponds) { p.h0 = baseH(p.x, p.z); p.level = p.h0 - 0.25; }
    for (let iz = 0; iz < N1; iz++) for (let ix = 0; ix < N1; ix++) {
      const x = -HALF + ix * SIZE / SEG, z = -HALF + iz * SIZE / SEG;
      let h = baseH(x, z);
      for (const p of ponds) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r * 1.9) h = lerp(h, p.h0 - 0.9, smooth(p.r * 1.9, p.r * 0.8, d)); }
      H[iz * N1 + ix] = h;
    }
    const heightAt = (x, z) => {
      const fx = (x + HALF) / SIZE * SEG, fz = (z + HALF) / SIZE * SEG;
      const ix = clamp(Math.floor(fx), 0, SEG - 1), iz = clamp(Math.floor(fz), 0, SEG - 1), tx = clamp(fx - ix), tz = clamp(fz - iz);
      return lerp(lerp(H[iz * N1 + ix], H[iz * N1 + ix + 1], tx), lerp(H[(iz + 1) * N1 + ix], H[(iz + 1) * N1 + ix + 1], tx), tz);
    };
    world.heightAt = heightAt;
    const slopeAt = (x, z) => Math.hypot(heightAt(x + 1, z) - heightAt(x - 1, z), heightAt(x, z + 1) - heightAt(x, z - 1)) / 2;
    const inWater = (x, z, m = 0) => ponds.some(p => Math.hypot(x - p.x, z - p.z) < p.r * 1.15 + m);
    world.inWater = inWater;
    // terrain mesh
    const tg = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); tg.rotateX(-Math.PI / 2);
    const tp = tg.attributes.position; const colArr = new Float32Array(tp.count * 3); const gc = env.ground.map(hex2rgb); const rockc = hex2rgb(env.rock);
    const sandc = hex2rgb('#d4c08a'); const litter = hex2rgb('#5a4228'); const mossc = hex2rgb('#4a8a4a');
    for (let i = 0; i < tp.count; i++) {
      const x = tp.getX(i), z = tp.getZ(i); const h = H[i]; tp.setY(i, h);
      const n = noise.fbm(x * 0.07 + 3, z * 0.07 + 9, 3), n2 = noise.at(x * 0.4, z * 0.4);
      let c = n < 0.45 ? mixc(gc[0], gc[1], n / 0.45) : mixc(gc[1], gc[2], (n - 0.45) / 0.55);
      if (env.litter && n2 > 0.45) c = mixc(c, litter, 0.55);
      if (env.moss && n2 > 0.5) c = mixc(c, mossc, 0.4);
      const sl = slopeAt(x, z);
      if (env.slopeRock && sl > 0.55) c = mixc(c, rockc, clamp((sl - 0.55) * 2.2));
      else if (sl > 0.9) c = mixc(c, rockc, clamp((sl - 0.9) * 1.5));
      for (const p of ponds) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.r * 1.5) c = mixc(c, sandc, smooth(p.r * 1.5, p.r * 1.1, d) * (env.sand ? 0.9 : 0.45)); }
      const k = 0.92 + n2 * 0.16; colArr[i * 3] = c[0] / 255 * k; colArr[i * 3 + 1] = c[1] / 255 * k; colArr[i * 3 + 2] = c[2] / 255 * k;
    }
    tg.setAttribute('color', new THREE.BufferAttribute(colArr, 3)); tg.computeVertexNormals();
    const gtex = groundTex(rng); gtex.repeat.set(SIZE / 2.4, SIZE / 2.4);
    const terrain = new THREE.Mesh(tg, new THREE.MeshLambertMaterial({ map: gtex, vertexColors: true }));
    terrain.receiveShadow = true; scene.add(terrain);
    function mixc(a, b, t) { return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]; }

    // ---- lights
    const hemi = new THREE.HemisphereLight(env.hemi[0], env.hemi[1], env.hemi[2]); scene.add(hemi);
    const sun = new THREE.DirectionalLight(env.sun[0], 1.05); const sd = new THREE.Vector3(...env.sun[1]).normalize();
    sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536); const sc = sun.shadow.camera; sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 1; sc.far = 220;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.06; scene.add(sun, sun.target);
    world.sun = sun; world.sunDir = sd;
    const lightTint = new THREE.Color(env.sun[0]).multiplyScalar(0.55).add(new THREE.Color(env.hemi[0]).multiplyScalar(0.55));

    // ---- sky dome + clouds
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uTop: { value: new THREE.Color(env.sky[0]) }, uHor: { value: new THREE.Color(env.sky[1]) }, uSun: { value: sd.clone() }, uSunCol: { value: new THREE.Color(env.sun[0]) } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; uniform vec3 uSunCol; varying vec3 vDir;
        void main(){ float h = clamp(vDir.y, 0.0, 1.0); vec3 c = mix(uHor, uTop, pow(h, 0.55));
          float s = max(dot(normalize(vDir), normalize(uSun)), 0.0);
          c += uSunCol * (pow(s, 380.0) * 1.2 + pow(s, 14.0) * 0.18);
          gl_FragColor = vec4(c, 1.0); }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 24, 16), skyMat); sky.renderOrder = -10; scene.add(sky);
    world.sky = sky;
    const cloudTex = canvasTex(64, 24, (x, w, h) => {
      x.fillStyle = '#fff';
      const r = new Rng(77);
      for (let i = 0; i < 9; i++) { const cx = 10 + r.range(0, 44), cy = 12 + r.range(-3, 3), rr = r.range(4, 9); for (let yy = -rr; yy <= rr; yy++) { const hw = Math.sqrt(Math.max(0, rr * rr - yy * yy)) * 1.5; x.fillRect(Math.round(cx - hw), Math.round(cy + yy * 0.6), Math.round(hw * 2), 1); } }
      const d = x.getImageData(0, 0, w, h);
      for (let i = 0; i < w * h; i++) { const yy = Math.floor(i / w); const shade = 255 - Math.max(0, (yy - 12)) * 6; d.data[i * 4] = shade; d.data[i * 4 + 1] = shade; d.data[i * 4 + 2] = Math.min(255, shade + 8); }
      x.putImageData(d, 0, 0);
    });
    const clouds = [];
    const nCl = Math.round(14 * env.clouds);
    for (let i = 0; i < nCl; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, fog: false, depthWrite: false, opacity: 0.92 }));
      const a = rng.range(0, 6.28), el = rng.range(0.18, 0.7);
      sp.position.set(Math.cos(a) * 330 * Math.cos(el), 330 * Math.sin(el) + 20, Math.sin(a) * 330 * Math.cos(el)); sp.scale.set(rng.range(70, 130), rng.range(26, 46), 1); sp.userData.a = a; sp.userData.el = el; sp.userData.sp = rng.range(0.002, 0.006);
      scene.add(sp); clouds.push(sp);
    }

    // ---- far mountains ring
    const [mc0, mc1, snow, hMin, hMax] = env.mount;
    const mparts = [];
    const mrng = new Rng(seed ^ 0x77);
    for (let i = 0; i < 46; i++) {
      const a = i / 46 * 6.283 + mrng.range(-0.05, 0.05), d = mrng.range(235, 300), h = mrng.range(hMin, hMax) * (snow ? 2.0 : 1.8), w = Math.min(h * mrng.range(0.6, 0.95), 62);
      const g = new THREE.ConeGeometry(w, h, 5 + mrng.int(0, 2), 3); g.translate(0, h / 2, 0);
      jitterGeo(g, w * 0.14, mrng);
      const c0 = mc0, c1 = mc1;
      const parts = [{ g, m: M(Math.cos(a) * d, -6, Math.sin(a) * d, 0, mrng.range(0, 6)), c: [c0, snow ? '#f2f6fa' : c1, 0, h * (snow ? 0.95 : 1.0)], j: 0.07 }];
      mparts.push(...parts);
    }
    const mg = merge(mparts, mrng);
    if (snow) { // snow line: recolour upper vertices
      const p = mg.attributes.position, c = mg.attributes.color; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > hMax * 0.9) { const t = smooth(hMax * 0.9, hMax * 1.6, y); c.setXYZ(i, lerp(c.getX(i), 0.96, t), lerp(c.getY(i), 0.97, t), lerp(c.getZ(i), 1.0, t)); } }
    }
    scene.add(new THREE.Mesh(mg, new THREE.MeshLambertMaterial({ vertexColors: true })));

    // ---- spawn collision-free scatter
    const placed = [];
    function scatter(count, rad, minR, maxR, opts = {}) {
      const out = []; let tries = 0;
      while (out.length < count && tries++ < count * 60) {
        const a = rng.range(0, 6.2832), d = Math.sqrt(rng.range(minR * minR, maxR * maxR));
        const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (Math.hypot(x, z) < (opts.clear === undefined ? 5 : opts.clear)) continue;
        if (inWater(x, z, 1.2)) continue;
        if (!opts.anySlope && slopeAt(x, z) > (opts.maxSlope || 0.7)) continue;
        let ok = true; for (const p of placed) { const dd = (p.x - x) ** 2 + (p.z - z) ** 2; if (dd < (p.r + rad) ** 2) { ok = false; break; } }
        if (!ok) continue;
        out.push({ x, z, y: heightAt(x, z) }); placed.push({ x, z, r: rad });
      }
      return out;
    }
    const treeMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    function addInstanced(builderKey, count, opts = {}) {
      if (!count) return;
      const trng = new Rng(seed + strSeed(builderKey));
      // build up to 3 geometry variants per type
      const variants = []; const nv = opts.variants || 3;
      for (let i = 0; i < nv; i++) variants.push(TREES[builderKey](trng, env));
      const pts = scatter(count, variants[0].rad + (opts.gap || 1.2), opts.minR || 6, opts.maxR || 56, opts);
      const per = variants.map(() => []);
      pts.forEach((p, i) => per[i % nv].push(p));
      variants.forEach((v, vi) => {
        const list = per[vi]; if (!list.length) return;
        const im = new THREE.InstancedMesh(v.g, treeMat, list.length);
        const col = new THREE.Color();
        list.forEach((p, i) => {
          const s = trng.range(0.85, 1.25) * (opts.scale || 1);
          im.setMatrixAt(i, M(p.x, p.y - 0.12, p.z, 0, trng.range(0, 6.28), 0, s));
          col.setHSL(0, 0, trng.range(0.9, 1.08)); col.r = col.g = col.b = trng.range(0.9, 1.1); im.setColorAt(i, col);
          if (v.rad > 0.2 && !opts.noCollide) world.colliders.push({ x: p.x, z: p.z, r: v.rad * s });
        });
        im.castShadow = !opts.noShadow; im.receiveShadow = true; im.frustumCulled = false; scene.add(im);
      });
    }
    for (const [type, n] of env.trees) addInstanced(type, n, type === 'bush' ? { minR: 4, noShadow: true, noCollide: true, gap: 0.4, variants: 3 } : { variants: 3, gap: 1.5 });
    addInstanced('rock', env.rocks, { minR: 6, maxR: 56, anySlope: true, gap: 0.4, variants: 3 });
    if (biome.id === 'alps') addInstanced('rock', 10, { minR: 20, maxR: 56, scale: 2.2, anySlope: true, gap: 1, variants: 2 });

    // ---- grass + flowers (instanced crossed quads, custom shader)
    const grassGeo = (() => { // two crossed quads, height 1
      const g = new THREE.BufferGeometry(); const p = [], uv = [], ix = [];
      for (let q = 0; q < 2; q++) { const a = q * Math.PI / 2, cx = Math.cos(a) * 0.5, cz = Math.sin(a) * 0.5; const b = q * 4;
        p.push(-cx, 0, -cz, cx, 0, cz, -cx, 1, -cz, cx, 1, cz); uv.push(0, 0, 1, 0, 0, 1, 1, 1); ix.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix); return g;
    })();
    const fogC = new THREE.Color(env.fog[0]);
    const shared = { uTime: { value: 0 }, uWind: { value: biome.id === 'amazon' || biome.id === 'borneo' ? 0.35 : 1.0 }, uFog: { value: fogC }, uFogD: { value: env.fog[1] }, uLight: { value: lightTint.clone() }, uCenter: { value: new THREE.Color('#ffd23c') } };
    function foliageMat(map, flower, n) {
      return new THREE.ShaderMaterial({ vertexShader: FOLIAGE_VS, fragmentShader: FOLIAGE_FS, side: THREE.DoubleSide, uniforms: Object.assign({}, shared, { uMap: { value: map }, uFlower: { value: flower ? 1 : 0 }, uAtlasN: { value: n } }) });
    }
    {
      const gcols = env.grass.col.map(c => new THREE.Color(c));
      const n = env.grass.n; const im = new THREE.InstancedMesh(grassGeo, foliageMat(grassAtlas(rng), false, 1), n); const kind = new Float32Array(n);
      let cnt = 0; const c = new THREE.Color(); let tries = 0;
      while (cnt < n && tries++ < n * 3) {
        const a = rng.range(0, 6.28), d = Math.sqrt(rng.range(0, PLAY_R * PLAY_R * 1.1)); const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (inWater(x, z)) continue;
        if (env.slopeRock && slopeAt(x, z) > 0.7 && rng.chance(0.8)) continue;
        const s = rng.range(env.grass.h[0], env.grass.h[1]); const w = rng.range(0.55, 1.0) * (0.6 + s * 0.6);
        im.setMatrixAt(cnt, M(x, heightAt(x, z) - 0.05, z, 0, rng.range(0, 3.14), 0, w, s, w));
        const g1 = rng.pick(gcols), g2 = rng.pick(gcols); c.copy(g1).lerp(g2, rng.next()); im.setColorAt(cnt, c); cnt++;
      }
      im.count = cnt; im.frustumCulled = false; scene.add(im); world.grassMesh = im;
    }
    {
      // flower patches
      const patches = []; const np = 22;
      for (let i = 0; i < np; i++) { const a = rng.range(0, 6.28), d = Math.sqrt(rng.range(30, PLAY_R * PLAY_R * 0.8)); const x = Math.cos(a) * d, z = Math.sin(a) * d; if (inWater(x, z, 1)) { i--; continue; } patches.push({ x, z, r: rng.range(3, 7), f: rng.pick(env.flowers) }); }
      const nF = 2600; const atlas = flowerAtlas();
      const im = new THREE.InstancedMesh(grassGeo, foliageMat(atlas, true, KINDS.length), nF); const kind = new Float32Array(nF); const c = new THREE.Color(); let cnt = 0, tries = 0;
      while (cnt < nF && tries++ < nF * 4) {
        let x, z, f;
        if (rng.chance(0.8)) { const p = rng.pick(patches); const a = rng.range(0, 6.28), d = Math.abs(rng.next() + rng.next() - 1) * p.r * 1.3; x = p.x + Math.cos(a) * d; z = p.z + Math.sin(a) * d; f = rng.chance(0.75) ? p.f : rng.pick(env.flowers); }
        else { const a = rng.range(0, 6.28), d = Math.sqrt(rng.range(4, PLAY_R * PLAY_R)); x = Math.cos(a) * d; z = Math.sin(a) * d; f = rng.pick(env.flowers); }
        if (Math.hypot(x, z) > PLAY_R || inWater(x, z, 0.5)) continue;
        const sz = rng.range(0.5, 0.85) * (f[1] === 'spike' ? 1.5 : 1) * (biome.id === 'kenya' || biome.id === 'prairie' ? 1.4 : 1);
        const y = heightAt(x, z) - 0.04;
        im.setMatrixAt(cnt, M(x, y, z, 0, rng.range(0, 3.14), 0, sz, sz, sz));
        c.set(f[0]).multiplyScalar(rng.range(0.9, 1.1)); im.setColorAt(cnt, c); kind[cnt] = KINDS.indexOf(f[1]);
        if (rng.chance(0.4)) world.flowers.push({ x, y: y + sz * 0.78, z, kind: f[1], size: sz, taken: false });
        cnt++;
      }
      im.geometry = im.geometry.clone(); im.geometry.setAttribute('aKind', new THREE.InstancedBufferAttribute(kind, 1));
      im.count = cnt; im.frustumCulled = false; scene.add(im);
      // grass also needs aKind attr (0)
      world.grassMesh.geometry = world.grassMesh.geometry.clone(); world.grassMesh.geometry.setAttribute('aKind', new THREE.InstancedBufferAttribute(new Float32Array(world.grassMesh.count), 1));
    }

    // ---- ponds
    const waterMat = new THREE.ShaderMaterial({
      transparent: true, uniforms: { uTime: { value: 0 }, uCol: { value: new THREE.Color(env.pondCol) }, uFog: { value: fogC }, uFogD: { value: env.fog[1] }, uSky: { value: new THREE.Color(env.sky[1]) } },
      vertexShader: 'varying vec2 vP; varying float vD; void main(){ vP = position.xz; vec4 mv = modelViewMatrix * vec4(position,1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform float uTime; uniform vec3 uCol; uniform vec3 uFog; uniform float uFogD; uniform vec3 uSky; varying vec2 vP; varying float vD;
        void main(){ float w = sin(vP.x*3.1 + uTime*1.2) * sin(vP.y*2.7 - uTime*0.9) + sin((vP.x+vP.y)*5.0 + uTime*1.7)*0.5;
          float band = floor(w * 2.0 + 0.5) / 2.0; vec3 c = mix(uCol, uSky, 0.25 + 0.2 * band); c += step(0.92, w * 0.5 + 0.5) * 0.25;
          float f = 1.0 - exp(-uFogD*uFogD*vD*vD); gl_FragColor = vec4(mix(c, uFog, clamp(f,0.0,1.0)), 0.88); }`,
    });
    ponds.forEach(p => { const m = new THREE.Mesh(new THREE.CircleGeometry(p.r * 1.15, 28).rotateX(-Math.PI / 2), waterMat); m.position.set(p.x, p.level, p.z); scene.add(m); world.water.push(p); });
    world.ponds = ponds;

    // ---- sand / bait spots (butterflies of salt-lickers and fruit-feeders sit here)
    function addBait(type, x, z) {
      const y = heightAt(x, z);
      if (type === 'salt') {
        const m = new THREE.Mesh(new THREE.CircleGeometry(1.1, 10).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#cdb98a' })); m.position.set(x, y + 0.04, z); m.receiveShadow = true; scene.add(m);
        const r2 = new Rng(Math.floor(x * 31 + z)); for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.07), new THREE.MeshLambertMaterial({ color: '#f2ecd8' })); s.position.set(x + r2.range(-0.9, 0.9), y + 0.07, z + r2.range(-0.9, 0.9)); scene.add(s); }
      } else if (type === 'fruit') {
        const cols = ['#e8802a', '#d8c030', '#b8402a', '#e8a838'];
        for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), new THREE.MeshLambertMaterial({ color: cols[i % 4] })); s.position.set(x + Math.cos(i * 1.1) * 0.35, y + 0.13 + (i > 3 ? 0.18 : 0), z + Math.sin(i * 1.1) * 0.35); s.castShadow = true; scene.add(s); }
      } else if (type === 'sap') {
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 1.0, 7), new THREE.MeshLambertMaterial({ color: '#5a4030' })); s.position.set(x, y + 0.45, z); s.castShadow = true; scene.add(s);
        const wet = new THREE.Mesh(new THREE.CircleGeometry(0.24, 8), new THREE.MeshLambertMaterial({ color: '#d8a838' })); wet.position.set(x, y + 0.96, z); wet.rotation.x = -Math.PI / 2; scene.add(wet);
      }
      world.baits.push({ x, y: y + 0.42, z, type });
    }
    if (env.bait) {
      const types = Array.isArray(env.bait) ? env.bait : [env.bait];
      const spots = scatter(6, 2.0, 8, 44, { gap: 0.5, clear: 7 });
      spots.forEach((s, i) => addBait(types[i % types.length], s.x, s.z));
      if (env.sand) { // wide sandy bank beside the water
        ponds.forEach(p => { for (let i = 0; i < 2; i++) { const a = rng.range(0, 6.28); addBait('salt', p.x + Math.cos(a) * (p.r + 1.8), p.z + Math.sin(a) * (p.r + 1.8)); } });
      }
    }

    // ---- Japan: torii gate + stone lantern landmarks
    if (env.torii) {
      const g = new THREE.Group(); const red = new THREE.MeshLambertMaterial({ color: '#c83a22' }), blk = new THREE.MeshLambertMaterial({ color: '#22201e' });
      const x = 12, z = -14, y = heightAt(x, z);
      for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 5.4, 8), red); p.position.set(s * 2.1, 2.7, 0); p.castShadow = true; g.add(p); }
      const top = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.42, 0.5), blk); top.position.y = 5.5; g.add(top);
      const top2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.3, 0.4), red); top2.position.y = 4.7; g.add(top2);
      g.position.set(x, y, z); g.rotation.y = 0.5; scene.add(g); world.colliders.push({ x: x + Math.cos(0.5) * 2.1, z: z - Math.sin(0.5) * 2.1, r: 0.4 }, { x: x - Math.cos(0.5) * 2.1, z: z + Math.sin(0.5) * 2.1, r: 0.4 });
      const lan = new THREE.Group(); const stone = new THREE.MeshLambertMaterial({ color: '#8a8a84' });
      const base = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.34, 0.9, 6), stone); base.position.y = 0.45; const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), stone); box.position.y = 1.15;
      const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.4, 4), stone); roof.position.y = 1.6; roof.rotation.y = Math.PI / 4; const glow = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.62), new THREE.MeshBasicMaterial({ color: '#ffd890' })); glow.position.y = 1.15;
      lan.add(base, box, roof, glow); const lx = 8, lz = -10; lan.position.set(lx, heightAt(lx, lz), lz); lan.traverse(o => { o.castShadow = true; }); scene.add(lan); world.colliders.push({ x: lx, z: lz, r: 0.5 });
    }

    // ---- ambient particles
    const [pk, pc, pd] = env.particles; const nP = 160; const pg = new THREE.BufferGeometry(); const pp = new Float32Array(nP * 3); const pr = new Rng(seed ^ 0x55);
    const pdata = [];
    for (let i = 0; i < nP; i++) { pdata.push({ x: pr.range(-30, 30), y: pr.range(0.2, 9), z: pr.range(-30, 30), vx: pr.range(-0.3, 0.3), vy: pr.range(-0.1, 0.25), vz: pr.range(-0.3, 0.3), ph: pr.range(0, 6.28) }); }
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const pmat = new THREE.PointsMaterial({ color: pc, size: pk === 'petals' ? 3 : 2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9 });
    const points = new THREE.Points(pg, pmat); points.frustumCulled = false; scene.add(points);
    world.updaters.push((dt, t, focus) => {
      const a = pg.attributes.position.array;
      for (let i = 0; i < nP; i++) {
        const d = pdata[i];
        if (pk === 'petals') { d.x += (d.vx * 0.6 + Math.sin(t * 0.7 + d.ph) * 0.4) * dt; d.y -= (0.35 + 0.1 * Math.sin(d.ph)) * dt; d.z += (d.vz * 0.6 + Math.cos(t * 0.6 + d.ph) * 0.3) * dt; if (d.y < 0.1) d.y = 9; }
        else if (pk === 'spores') { d.x += Math.sin(t * 0.5 + d.ph) * 0.15 * dt; d.y += (d.vy * 0.5) * dt; d.z += Math.cos(t * 0.45 + d.ph) * 0.15 * dt; if (d.y > 9) d.y = 0.3; }
        else if (pk === 'dust') { d.x += (0.9 + d.vx) * dt; d.y += Math.sin(t + d.ph) * 0.1 * dt; d.z += d.vz * dt; }
        else { d.x += (d.vx + Math.sin(t * 0.4 + d.ph) * 0.2) * dt; d.y += (d.vy * 0.5 + Math.sin(t * 0.8 + d.ph) * 0.15) * dt; d.z += (d.vz + Math.cos(t * 0.35 + d.ph) * 0.2) * dt; if (d.y > 9 || d.y < 0.1) d.vy = -d.vy; }
        let dx = d.x - focus.x, dz = d.z - focus.z;
        if (dx > 30) d.x -= 60; else if (dx < -30) d.x += 60; if (dz > 30) d.z -= 60; else if (dz < -30) d.z += 60;
        a[i * 3] = d.x; a[i * 3 + 1] = Math.max(d.y, 0.1) + heightAt(d.x, d.z); a[i * 3 + 2] = d.z;
      }
      pg.attributes.position.needsUpdate = true;
    });

    // ---- per-frame update
    world.update = (dt, t, focus) => {
      shared.uTime.value = t; waterMat.uniforms.uTime.value = t;
      sun.position.copy(focus).addScaledVector(sd, 90); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
      sky.position.copy(focus);
      clouds.forEach(s => { s.userData.a += s.userData.sp * dt; const a = s.userData.a, el = s.userData.el; s.position.set(focus.x + Math.cos(a) * 330 * Math.cos(el), 330 * Math.sin(el) + 20, focus.z + Math.sin(a) * 330 * Math.cos(el)); });
      world.updaters.forEach(f => f(dt, t, focus));
    };
    world.dispose = () => { scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); };
    world.slopeAt = slopeAt;
    return world;
  }

  return { build, ENV, PLAY_R };
})();
