// ---------------------------------------------------------------- procedural 3D biome generator
// Every visit gets a fresh seed: terrain, rivers/ponds, groves, clearings, rock outcrops, landmarks, flower meadows,
// light (time of day) and weather all change; each biome follows its own generation recipe.
const World = (() => {
  const SIZE = 180, SEG = 180, HALF = SIZE / 2, PLAY_R = 58, CELL = SIZE / SEG;
  const V3 = THREE.Vector3;

  // ------------------------------------------------------------ biome recipes
  // veg: [treeType, count, field]  fields: grove, clearing, edge, dense, sparse, uniform, riparian, upland, orchard, avenue
  // water: list of 'pond' | 'stream' | 'river'      lm: landmark kinds (2 random picks are built)
  const ENV = {
    russia: {
      sky: ['#5fa6e6', '#cfe6f0'], fog: ['#c4deea', 0.0085], sun: ['#fff1d0', [0.5, 0.8, 0.35]], hemi: ['#cfe6ff', '#6a8a48', 0.85],
      amp: 1.6, freq: 0.022, ground: ['#7aa84a', '#5e8a38', '#8fb85a'], rock: '#8a8a80',
      grass: { col: ['#8cc050', '#6aa03c', '#a4d060'], h: [0.5, 0.95], n: 9000 },
      flowers: [['#ffffff', 'daisy', 1.0], ['#c85a9a', 'cluster', 0.9], ['#ffd23c', 'daisy', 0.8], ['#6a7ae8', 'bell', 0.7], ['#a060d0', 'spike', 0.6], ['#f06aa0', 'spike', 0.6], ['#ffffff', 'umbel', 0.5]],
      veg: [['birch', 90, 'grove'], ['spruce', 22, 'grove'], ['birch', 12, 'sparse'], ['bush', 46, 'edge']], rocks: 8, water: ['pond', 'stream'], waterCol: '#4a90c0', mount: ['#6a8a5a', '#8aa07a', false, 14, 22],
      particles: ['fluff', '#ffffff', 1.0], amb: 'meadow', clouds: 0.9, bait: null, lm: ['logs', 'fence', 'stumps'], tf: 0.5,
    },
    alps: {
      sky: ['#3f86e4', '#cfe2f2'], fog: ['#d4e4f2', 0.0085], sun: ['#ffffff', [0.4, 0.85, 0.3]], hemi: ['#d8eaff', '#7a8a60', 0.95],
      amp: 4.2, freq: 0.024, ground: ['#6a9a4a', '#88a85c', '#7c8a60'], rock: '#8a8c90', slopeRock: true,
      grass: { col: ['#7aaa4a', '#5a8a3c', '#9ac05a'], h: [0.28, 0.55], n: 10000 },
      flowers: [['#3a66e8', 'bell', 1.2], ['#e84a8a', 'cluster', 0.9], ['#ffd23c', 'daisy', 1.0], ['#ffffff', 'daisy', 0.8], ['#a05ad8', 'spike', 0.7], ['#ff8a3a', 'cluster', 0.5]],
      veg: [['larch', 34, 'upland'], ['spruce', 30, 'grove'], ['bush', 24, 'edge']], rocks: 46, water: ['stream', 'pond'], waterCol: '#46b8d0', mount: ['#7a808a', '#c8d4e0', true, 18, 46],
      particles: ['sparkle', '#ffffff', 0.7], amb: 'alpine', clouds: 1.2, bait: null, lm: ['chalet', 'cairn', 'boulders', 'fence'], tf: 0.5,
    },
    med: {
      sky: ['#4a9ef0', '#f0e6cc'], fog: ['#efe4cc', 0.0095], sun: ['#fff0c8', [0.6, 0.75, 0.3]], hemi: ['#f0e8d0', '#a89868', 0.9],
      amp: 2.6, freq: 0.026, ground: ['#b8a870', '#a89860', '#c8b880'], rock: '#c8c0a8',
      grass: { col: ['#c8b45c', '#a89a48', '#d8c470'], h: [0.3, 0.6], n: 8000 },
      flowers: [['#9a6ad8', 'spike', 1.3], ['#e83a2a', 'daisy', 0.9], ['#ffd23c', 'cluster', 1.0], ['#ffffff', 'daisy', 0.8], ['#e86a9a', 'cluster', 0.7], ['#ff9a2a', 'umbel', 0.5]],
      veg: [['olive', 34, 'orchard'], ['cypress', 12, 'avenue'], ['arbutus', 22, 'grove'], ['bush', 54, 'edge']], rocks: 44, water: [], waterCol: '#4aa0c8', mount: ['#9a8a70', '#c4b494', false, 18, 36],
      particles: ['pollen', '#ffe28a', 0.9], amb: 'med', clouds: 0.4, bait: 'fruit', lm: ['ruin', 'wall', 'boulders'], tf: 0.55,
    },
    amazon: {
      sky: ['#5aa8c0', '#cfeadc'], fog: ['#9ac8ae', 0.021], sun: ['#fff4d0', [0.3, 0.9, 0.2]], hemi: ['#bfe8d0', '#2e4a22', 0.7],
      amp: 1.4, freq: 0.03, ground: ['#3e5a2a', '#2e4a22', '#5a4a2e'], rock: '#6a6a5a', litter: true,
      grass: { col: ['#3e9a3a', '#2e7a30', '#58b048'], h: [0.55, 1.15], n: 8500 },
      flowers: [['#e83a2a', 'spike', 1.3], ['#ff9a1a', 'spike', 1.0], ['#a04ad8', 'daisy', 0.9], ['#f06ac8', 'cluster', 0.9], ['#ffffff', 'bell', 0.7], ['#ffd23c', 'daisy', 0.7]],
      veg: [['giant', 42, 'dense'], ['palm', 26, 'riparian'], ['fern', 40, 'dense'], ['bush', 34, 'edge']], rocks: 8, water: ['river'], waterCol: '#2e5a4a', mount: ['#2e5a3a', '#4a7a54', false, 12, 20],
      particles: ['spores', '#e8ffa0', 1.0], amb: 'rainforest', clouds: 0.5, bait: 'fruit', lm: ['biglog', 'logs', 'boulders'], tf: 0.4,
    },
    borneo: {
      sky: ['#6ab4d0', '#d8f0e4'], fog: ['#a0ccb4', 0.020], sun: ['#fff0c8', [0.35, 0.85, 0.3]], hemi: ['#c0e8d4', '#34502a', 0.72],
      amp: 1.6, freq: 0.03, ground: ['#4a5a2a', '#3a4a22', '#6a5a38'], rock: '#7a7468', litter: true,
      grass: { col: ['#44a040', '#2e8030', '#62b84c'], h: [0.5, 1.1], n: 8500 },
      flowers: [['#e8301a', 'daisy', 1.1], ['#ff6a8a', 'spike', 1.2], ['#ffffff', 'bell', 0.9], ['#c06af0', 'cluster', 0.9], ['#ffb02a', 'daisy', 0.8], ['#f8e84a', 'cluster', 0.6]],
      veg: [['dipt', 36, 'dense'], ['palm', 22, 'riparian'], ['fern', 36, 'riparian'], ['bush', 30, 'edge']], rocks: 14, water: ['river'], waterCol: '#3a7a8a', sand: true, mount: ['#3a6a4a', '#7aa08a', false, 16, 34],
      particles: ['spores', '#fff0a0', 1.0], amb: 'rainforest2', clouds: 0.5, bait: ['salt', 'fruit'], lm: ['biglog', 'boulders', 'logs'], tf: 0.4,
    },
    kenya: {
      sky: ['#3f96e6', '#f4ead0'], fog: ['#f0e0b8', 0.0085], sun: ['#fff0c0', [0.7, 0.7, 0.2]], hemi: ['#f4ecd0', '#b89a58', 0.95],
      amp: 1.3, freq: 0.018, ground: ['#c8a860', '#b89850', '#d8b870'], rock: '#9a8468',
      grass: { col: ['#d8b860', '#c09a48', '#e8cc78'], h: [0.7, 1.25], n: 11000 },
      flowers: [['#e84a1a', 'spike', 1.1], ['#e060a0', 'cluster', 1.0], ['#ff9a2a', 'cluster', 1.0], ['#ffffff', 'daisy', 0.7], ['#ffd23c', 'daisy', 0.8], ['#9a5ae0', 'bell', 0.6]],
      veg: [['acacia', 16, 'grove'], ['baobab', 2, 'sparse'], ['bush', 44, 'grove'], ['termite', 8, 'sparse'], ['bush', 18, 'riparian']], rocks: 16, water: ['pond'], waterCol: '#6a8a8a', mount: ['#8a7a5a', '#b4a07a', false, 6, 14],
      particles: ['dust', '#f4e0a0', 0.9], amb: 'savanna', clouds: 0.5, bait: 'salt', lm: ['kopje', 'boulders'], tf: 0.58,
    },
    prairie: {
      sky: ['#55a6f0', '#e0eef4'], fog: ['#d4e6ee', 0.0075], sun: ['#fff4d8', [0.55, 0.8, 0.25]], hemi: ['#d8eeff', '#8aa850', 0.9],
      amp: 1.0, freq: 0.016, ground: ['#8aa84a', '#9ab858', '#7a9a40'], rock: '#8a8a7a',
      grass: { col: ['#a8b858', '#88a048', '#bccb68'], h: [0.7, 1.3], n: 11000 },
      flowers: [['#c060b0', 'daisy', 1.2], ['#ffcc20', 'daisy', 1.2], ['#e87aa0', 'umbel', 1.3], ['#a05ae0', 'spike', 0.9], ['#ffffff', 'daisy', 0.6], ['#ff8a2a', 'cluster', 0.6]],
      veg: [['cotton', 10, 'riparian'], ['willow', 10, 'riparian'], ['cotton', 3, 'sparse'], ['bush', 30, 'riparian'], ['bush', 16, 'sparse']], rocks: 6, water: ['stream'], waterCol: '#5a9ac0', mount: ['#7a9a6a', '#a0b88a', false, 4, 10],
      particles: ['fluff', '#fff4d8', 1.0], amb: 'prairie', clouds: 1.0, bait: null, lm: ['windmill', 'fence'], tf: 0.55,
    },
    // a raised sphagnum bog (Vasyugan mire): overcast, dark, damp; hummocks, brown pools, stunted pines, cotton-grass tussocks, Labrador tea, cranberries
    bog: {
      sky: ['#6c767e', '#a3aeac'], fog: ['#98a49c', 0.0150], sun: ['#cfd6d4', [0.3, 0.9, 0.3]], hemi: ['#a4aeac', '#363e2a', 0.88], overcast: true, bog: true,
      amp: 0.5, freq: 0.045, ground: ['#486234', '#58603a', '#3c4e2c'], rock: '#6a6a62',
      grass: { col: ['#7c7e42', '#62743a', '#948c52', '#52623a'], h: [0.2, 0.5], n: 10000 },
      flowers: [['#f4f2ea', 'cotton', 1.5], ['#f4f2ea', 'cotton', 1.3], ['#f0efe6', 'cotton', 1.4], ['#f2a0b8', 'bell', 0.8], ['#f4f4e8', 'umbel', 0.9], ['#e8607c', 'cluster', 0.6], ['#fbfbf2', 'daisy', 0.6]],
      veg: [['hummock', 240, 'uniform', { variants: 8 }], ['tussock', 150, 'uniform', { variants: 4 }], ['ledum', 46, 'uniform', { variants: 4 }], ['cassandra', 34, 'uniform', { variants: 4 }], ['ryam', 30, 'grove', { variants: 5 }], ['snag', 9, 'sparse', { variants: 4 }], ['dbirch', 26, 'uniform', { variants: 4 }], ['spruce', 10, 'edge', { scale: 0.55 }]],
      rocks: 3, water: ['pool'], waterCol: '#3e3322', shoreCol: ['#3a3a22', '#2c2216'], mount: ['#34423a', '#46564a', false, 3, 8],
      particles: ['fluff', '#e4e8e0', 0.75], amb: 'bog', clouds: 2.6, bait: null, lm: ['boardwalk', 'peatcut', 'boulders', 'stumps'], tf: 0.5,
    },
    // relic rain forest on the slopes of Mount Lamington (Oro province, New Guinea): giant branching trees close the sky, tree ferns and cycads below, frozen black lava flows, a jungle stream
    papua: {
      sky: ['#3f6e64', '#8fb8a4'], fog: ['#5f8a74', 0.0185], sun: ['#f0f4d0', [0.3, 0.9, 0.2]], hemi: ['#b0e0c4', '#2c4a30', 0.9], sunI: 0.5, canopy: true, lava: true,
      amp: 2.3, freq: 0.03, ground: ['#34462a', '#2a3a22', '#4a3c28'], rock: '#38342f', litter: true,
      grass: { col: ['#2a6a30', '#1e5a28', '#3a8038', '#2e7a46'], h: [0.4, 0.95], n: 8500 },
      flowers: [['#e0302a', 'spike', 1.4], ['#f08a22', 'spike', 1.1], ['#b058d0', 'cluster', 1.0], ['#f4f4ea', 'bell', 0.9], ['#f06aa0', 'cluster', 0.8], ['#ffd23c', 'umbel', 0.5]],
      veg: [['relic', 62, 'uniform', { variants: 6, group: 'relic', minSep: 11.5, minR: 4 }], ['fern', 70, 'dense'], ['cycad', 26, 'dense', { variants: 3 }], ['palm', 22, 'riparian'], ['pandan', 14, 'riparian', { variants: 3 }], ['alocasia', 80, 'uniform', { variants: 3 }], ['groundfern', 200, 'uniform', { variants: 4 }], ['lavarock', 52, 'lava', { variants: 5, onLava: true, minR: 4 }], ['lavashard', 150, 'lava', { variants: 4, onLava: true, minR: 4 }], ['bush', 26, 'edge']],
      rocks: 10, water: ['stream'], waterCol: '#2e6a5a', mount: ['#2c4a3a', '#6a7e70', false, 26, 50],
      particles: ['spores', '#dfffb0', 1.0], amb: 'papua', clouds: 0.25, bait: ['fruit', 'sap'], lm: ['lavaflow', 'biglog', 'boulders'], tf: 0.42,
    },
    vietnam: {      // the limestone highlands of Hoang Lien Son (Sa Pa), northern Vietnam: sunny, with mountain mist in the gorges
      sky: ['#2c7fe6', '#c4def2'], fog: ['#e6eef2', 0.0105], sun: ['#fff6e0', [0.3, 0.95, 0.25]], hemi: ['#dcecff', '#5a7a48', 1.0], highland: true, mist: true,
      amp: 3.4, freq: 0.03, ground: ['#5a8a3a', '#4a7a32', '#8a9a4c'], rock: '#a09d90', slopeRock: true,
      grass: { col: ['#6a9a3c', '#527f32', '#8ab04a', '#a6b858'], h: [0.3, 0.7], n: 9500 },
      flowers: [['#e0284a', 'cluster', 1.5], ['#f8f4ec', 'daisy', 1.0], ['#ffcc2a', 'daisy', 0.8], ['#8a4ad8', 'spike', 0.8], ['#ff8a2a', 'spike', 0.7], ['#f080b0', 'bell', 0.9]],
      veg: [['kesiya', 26, 'upland', { variants: 4, maxSlope: 1.1 }], ['montoak', 30, 'grove', { variants: 4, maxSlope: 1.0 }], ['treefern', 44, 'dense', { variants: 3, maxSlope: 1.2 }], ['bamboo', 12, 'grove', { maxSlope: 1.0 }],
        ['rhodo', 50, 'uniform', { variants: 5, maxSlope: 1.3 }], ['musa', 16, 'dense', { variants: 3 }], ['alocasia', 40, 'dense', { variants: 3 }], ['fern', 46, 'dense'], ['groundfern', 160, 'uniform', { variants: 4, maxSlope: 1.5 }], ['bush', 26, 'edge'],
        ['karst', 16, 'uniform', { variants: 4, maxSlope: 0.8, minR: 14 }]],
      rockSlope: 1.05, rocks: 26, water: [], waterCol: '#4a8aa0', mount: ['#4a6a5a', '#9ab0a8', false, 24, 52],
      particles: ['spores', '#fff8d0', 0.6], amb: 'vietnam', clouds: 0.8, bait: ['fruit', 'sap'], lm: ['cairn', 'boulders'], tf: 0.48,
    },
    japan: {
      sky: ['#5ba8dc', '#dcecec'], fog: ['#c8e0e0', 0.013], sun: ['#fff4dc', [0.4, 0.85, 0.3]], hemi: ['#d4ecec', '#4a7a38', 0.82],
      amp: 2.4, freq: 0.026, ground: ['#5a8a42', '#4a7a38', '#6a9a4a'], rock: '#7a7c78', moss: true,
      grass: { col: ['#6aa848', '#4a8a3a', '#82c05a'], h: [0.4, 0.8], n: 9000 },
      flowers: [['#6a7ae8', 'cluster', 1.2], ['#c06ae0', 'cluster', 0.9], ['#ff8a1a', 'bell', 1.0], ['#ffffff', 'daisy', 0.8], ['#f06aa0', 'daisy', 1.0], ['#ffd23c', 'daisy', 0.6]],
      veg: [['crypto', 46, 'upland'], ['maple', 30, 'riparian'], ['maple', 10, 'sparse'], ['bamboo', 8, 'grove'], ['bush', 28, 'edge']], rocks: 20, water: ['stream'], waterCol: '#4a8aa0', mount: ['#4a6a5a', '#8aa4a0', false, 20, 40],
      particles: ['petals', '#ffb8d0', 1.0], amb: 'forest', clouds: 0.7, bait: 'sap', lm: ['torii', 'lanterns', 'stones'], tf: 0.5,
    },
  };

  // ------------------------------------------------------------ geometry toolkit
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
    return new THREE.Matrix4().compose(new V3(x, y, z), new THREE.Quaternion().setFromEuler(new THREE.Euler(rx, ry, rz)), new V3(sx, sy, sz));
  }
  // a tapered limb running from point a to point b (so branches and trunks are always connected)
  function limb(a, b, r0, r1, seg = 6) {
    const len = Math.max(0.01, a.distanceTo(b)); const g = cylG(r1, r0, len, seg);
    const q = new THREE.Quaternion().setFromUnitVectors(new V3(0, 1, 0), b.clone().sub(a).normalize());
    return { g, m: new THREE.Matrix4().compose(a, q, new V3(1, 1, 1)) };
  }
  // a buttress root: a thin ridge that is tall at the trunk (x = 0), falls away in a concave curve and tapers to nothing on the ground; it sways sideways along its length
  function buttressG(L, hb, th, sway, r, segs = 9) {
    const pos = [], idx = [];
    for (let i = 0; i <= segs; i++) {
      const u = i / segs, x = L * u, h = hb * Math.pow(1 - u, 2.3) + 0.06, t = th * (1 - u * 0.75) + 0.02, z0 = Math.sin(u * 2.4) * sway * u + Math.sin(u * 9 + r.range(0, 1)) * 0.03 * u, y0 = -0.15 * u;
      pos.push(x, y0, z0 - t * (1 + 1.6 * (1 - u)), x, h, z0, x, y0, z0 + t * (1 + 1.6 * (1 - u)));
      if (i < segs) { const a = i * 3, b = a + 3; idx.push(a, a + 1, b, a + 1, b + 1, b, a + 1, a + 2, b + 1, a + 2, b + 2, b + 1); }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); return g;
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
  // merge parts [{g, m, c: hex | [bottom, top, y0, y1], j}] into one vertex-coloured, flat-shaded geometry
  function merge(parts, rng) {
    const P = [], Cc = [];
    for (const part of parts) {
      const g = part.g.index ? part.g.toNonIndexed() : part.g.clone(); g.applyMatrix4(part.m || new THREE.Matrix4());
      const a = g.attributes.position; const jit = part.j === undefined ? 0.1 : part.j;
      const c0 = hex2rgb(Array.isArray(part.c) ? part.c[0] : part.c), c1 = Array.isArray(part.c) ? hex2rgb(part.c[1]) : c0;
      const y0 = Array.isArray(part.c) ? part.c[2] : 0, y1 = Array.isArray(part.c) ? part.c[3] : 1;
      for (let i = 0; i < a.count; i += 3) {
        const k = 1 + (rng.next() - 0.5) * 2 * jit;
        for (let v = 0; v < 3; v++) {
          const x = a.getX(i + v), y = a.getY(i + v), z = a.getZ(i + v); const t = clamp((y - y0) / (y1 - y0 || 1));
          P.push(x, y, z); Cc.push(lerp(c0[0], c1[0], t) / 255 * k, lerp(c0[1], c1[1], t) / 255 * k, lerp(c0[2], c1[2], t) / 255 * k);
        }
      }
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(Cc, 3)); g.computeVertexNormals();
    return g;
  }

  // crown = cluster of leaf blobs inside an ellipsoid; inner/lower blobs are darker. Returns the outer blob centres (for branches).
  function crown(parts, r, cx, cy, cz, rx, ry, rz, n, rmin, rmax, cols, squash = 0.85) {
    const out = [];
    parts.push({ g: blobG(rmax * 1.05, r, 0.25, 1), m: M(cx, cy, cz, 0, r.range(0, 6), 0, 1, squash, 1), c: shadeHex(cols[0], 0.82), j: 0.08 });
    for (let i = 0; i < n; i++) {
      let x, y, z; do { x = r.range(-1, 1); y = r.range(-1, 1); z = r.range(-1, 1); } while (x * x + y * y + z * z > 1);
      const px = cx + x * rx, py = cy + y * ry, pz = cz + z * rz, rad = r.range(rmin, rmax); const k = 0.8 + 0.3 * (y * 0.5 + 0.5);
      parts.push({ g: blobG(rad, r, 0.28, 1), m: M(px, py, pz, 0, r.range(0, 6.28), 0, 1, squash, 1), c: shadeHex(r.pick(cols), k), j: 0.1 });
      out.push(new V3(px, py, pz));
    }
    return out;
  }
  // main trunk as a gently curved chain of connected limbs; returns top point
  function trunk(parts, r, H, r0, r1, lean, col, segs = 5, sides = 6) {
    let prev = new V3(0, 0, 0); const dir = r.range(0, 6.28); const pts = [prev];
    for (let i = 1; i <= segs; i++) {
      const t = i / segs; const off = lean * t * t * H; const p = new V3(Math.cos(dir) * off, H * t, Math.sin(dir) * off);
      const L = limb(prev, p, lerp(r0, r1, (i - 1) / segs), lerp(r0, r1, t), sides); parts.push({ g: L.g, m: L.m, c: col, j: 0.06 }); prev = p; pts.push(p);
    }
    prev.pts = pts; prev.r0 = r0; prev.r1 = r1; return prev;
  }

  // a conifer built from whorls of boughs (spruce, larch): trunk, drooping needle-covered branches, cones, a leader
  function boughTree(r, o) {
      const parts = [], H = r.range(...o.H), lean = r.range(-0.03, 0.03);
      const top = trunk(parts, r, H * 0.97, 0.3, 0.035, lean, o.bark, 7, 7);
      parts.push({ g: cylG(0.3, 0.46, 0.5, 8), c: ['#2e2016', '#4a3424', 0, 0.5], j: 0.06 });      // the swollen foot, and shallow surface roots: low ridges that grow out of it and sink into the ground
      { const n = 6, a0 = r.range(0, 6.28); for (let i = 0; i < n; i++) { const a = a0 + i / n * 6.28 + r.range(-0.25, 0.25); parts.push({ g: buttressG(r.range(0.9, 1.5), r.range(0.42, 0.6), 0.075, r.range(-0.3, 0.3), r), m: M(0, 0.02, 0, 0, -a, 0), c: ['#2e2016', '#4a3424', 0, 0.6], j: 0.05 }); } }
      const pool = []; for (let i = 0; i < 4; i++) pool.push(blobG(1, r, 0.3, 0));
      const at = y => { const t = clamp(y / (H * 0.97)), k = Math.min(top.pts.length - 2, Math.floor(t * (top.pts.length - 1))), A = top.pts[k], B = top.pts[k + 1], u = clamp((y - A.y) / (B.y - A.y || 1)); return new V3(lerp(A.x, B.x, u), y, lerp(A.z, B.z, u)); };
      // a dark inner core of overlapping skirts, so the crown has body and no light shows through between the boughs
      for (let i = 0; i < 6; i++) { const t = i / 5; parts.push({ g: coneG(lerp(0.55, 0.14, t), H * lerp(0.26, 0.12, t), 7), m: M(0, H * 0.2 + t * H * 0.62, 0, 0, i * 0.8), c: o.core, j: 0.12 }); }
      const W = o.W, cols = o.cols;
      for (let w = 0; w < W; w++) {
        const t = w / (W - 1), y = H * (0.13 + 0.8 * t) + r.range(-0.12, 0.12), c0 = at(y), nb = Math.round(lerp(o.nb[0], o.nb[1], t)), a0 = r.range(0, 6.28);
        const Lmax = lerp(o.Lmax, 0.4, Math.pow(t, o.taper)), dead = w < o.dead;
        for (let b = 0; b < nb; b++) {
          const a = a0 + b / nb * 6.28 + r.range(-0.25, 0.25), L = Lmax * r.range(0.8, 1.12) * (dead ? 0.4 : 1), dx = Math.cos(a), dz = Math.sin(a), sag = lerp(o.sag[0], o.sag[1], t);
          const pt = u => new V3(c0.x + dx * L * u, c0.y - L * (sag * u - 0.34 * sag * u * u * 1.6) * (u > 0.6 ? 1 : 1), c0.z + dz * L * u);
          const p0 = c0, p1 = pt(0.5), p2 = pt(1);
          const l1 = limb(p0, p1, dead ? 0.07 : 0.05 * (1.2 - t * 0.6), dead ? 0.045 : 0.03, 4), l2 = limb(p1, p2, dead ? 0.045 : 0.03, dead ? 0.02 : 0.012, 4); parts.push({ g: l1.g, m: l1.m, c: '#4a3626', j: 0.05 }, { g: l2.g, m: l2.m, c: '#4a3626', j: 0.05 });
          const nn = dead ? 0 : (t > 0.55 ? 3 : 4);
          for (let k = 0; k < nn; k++) {
            const u = dead ? 0.95 : (t > 0.55 ? [0.45, 0.75, 1.0] : [0.38, 0.6, 0.82, 1.0])[k], p = pt(u), sz = (dead ? 0.22 : 1) * (u > 0.9 ? 0.8 : 1), dp = Math.atan2(p2.y - p0.y, L) * 0.9;
            const col = shadeHex(r.pick(cols), o.lit[0] + o.lit[1] * t + 0.22 * u);
            parts.push({ g: r.pick(pool), m: M(p.x, p.y, p.z, 0, -a, dp, L * 0.2 * sz + 0.12, L * 0.11 * sz + 0.1, L * 0.22 * sz + 0.12), c: col, j: 0.1 });
            if (!dead && u < 1 && L > 0.8) parts.push({ g: r.pick(pool), m: M(p.x, p.y - 0.1 * L, p.z, 0, -a, dp - 0.25, L * 0.13 + 0.06, L * 0.09 + 0.05, L * 0.12 + 0.06), c: shadeHex(cols[0], 0.8 + 0.2 * t), j: 0.08 });   // a darker drooping twig under the bough
          }
          if (t > 0.35 && t < 0.88 && r.next() < o.coneP) { const p = pt(0.95); parts.push({ g: coneG(o.cone[0], o.cone[1], 5), m: M(p.x, p.y, p.z, Math.PI, 0, 0), c: ['#6a4a2a', '#4a3220', 0, 1], j: 0.1 }); }     // a hanging cone
        }
      }
      // the leader: a slim pointed spike with short needle whorls
      // the leader: a small upright tuft of needles (the trunk ends inside it)
      const lead = at(H * 0.93); for (let k = 0; k < 3; k++) { const sc = [1, 0.75, 0.5][k]; parts.push({ g: r.pick(pool), m: M(lead.x, lead.y + k * H * 0.028, lead.z, 0, r.range(0, 6), 0, 0.22 * sc + 0.05, 0.3 * sc + 0.05, 0.22 * sc + 0.05), c: shadeHex(o.cols[k % o.cols.length], 1.1 + k * 0.08), j: 0.08 }); }
      return { g: merge(parts, r), rad: o.rad, h: H };

  }
  // ------------------------------------------------------------ trees
  const TREES = {
    birch(r) {
      const parts = []; const H = r.range(6, 8.6); const Ht = H * 0.8 - 0.3;       // the trunk ends INSIDE the crown (it used to poke out of the top of the foliage)
      const top = trunk(parts, r, Ht, 0.17, 0.08, r.range(-0.05, 0.05), ['#eceadc', '#d8d6c8', 0, Ht]);
      // dark bark marks: thin flat patches lying ON the trunk surface (they follow the leaning trunk and never stick out)
      for (let i = 0; i < 9; i++) {
        const y = 0.6 + i * (Ht - 1.5) / 8 + r.range(-0.15, 0.15), t = y / Ht, k = Math.min(top.pts.length - 2, Math.floor(t * (top.pts.length - 1))), A = top.pts[k], B = top.pts[k + 1], u = clamp((y - A.y) / (B.y - A.y || 1));
        const cx = lerp(A.x, B.x, u), cz = lerp(A.z, B.z, u), rad = lerp(top.r0, top.r1, t) * 0.8, a = r.range(0, 6.28), w = rad * r.range(1.1, 2.0);
        parts.push({ g: new THREE.BoxGeometry(w, 0.05 + r.next() * 0.06, 0.03), m: M(cx + Math.cos(a) * rad, y, cz + Math.sin(a) * rad, 0, Math.PI / 2 - a, 0), c: '#34332e', j: 0 });
      }
      const cy = H * 0.8; const cols = ['#6aa238', '#5a9230', '#7ab444', '#8cc050'];
      const out = crown(parts, r, top.x, cy, top.z, 1.5, 1.7, 1.5, 9, 0.75, 1.15, cols);
      for (let i = 0; i < 4; i++) { const t = out[i]; const a = new V3(top.x * 0.55, H * r.range(0.45, 0.65), top.z * 0.55); const L = limb(a, new V3(t.x, Math.max(t.y - 0.4, a.y + 0.4), t.z), 0.06, 0.03, 5); parts.push({ g: L.g, m: L.m, c: '#e2e0d2', j: 0.05 }); }
      return { g: merge(parts, r), rad: 0.28, h: H + 1.6 };
    },
    spruce(r) { return boughTree(r, { H: [8, 12], bark: ['#3a281c', '#2c3a22', 0, 12], core: ['#10301a', '#1c4426', 0, 12], W: 23, cols: ['#1a4224', '#235030', '#2c5e38'], nb: [7, 3], Lmax: 2.8, taper: 0.85, sag: [0.42, 0.2], dead: 2, cone: [0.07, 0.3], coneP: 0.28, lead: ['#1c4a28', '#2e6a3a', 0, 12], lit: [0.82, 0.34], rad: 0.38 }); },
    larch(r) { return boughTree(r, { H: [7, 10.5], bark: ['#5a4030', '#3a4a26', 0, 12], core: ['#2c4a1c', '#486a2a', 0, 12], W: 20, cols: ['#78a040', '#90b84c', '#a8c85a'], nb: [5, 3], Lmax: 2.2, taper: 0.9, sag: [0.3, 0.12], dead: 2, cone: [0.05, 0.16], coneP: 0.4, lead: ['#78a040', '#a0c452', 0, 12], lit: [0.9, 0.3], rad: 0.34 }); },
    cypress(r) {
      const parts = []; const H = r.range(8, 12);
      parts.push({ g: cylG(0.1, 0.22, 1.4, 6), c: '#4a3828', j: 0.05 });
      parts.push({ g: coneG(1.0, H, 7), m: M(0, 0.4, 0), c: ['#1c4426', '#2c6234', 0, H], j: 0.14 });
      parts.push({ g: blobG(0.85, r), m: M(0, H * 0.34, 0, 0, 0, 0, 1, 2.3, 1), c: '#235a2e', j: 0.1 });
      return { g: merge(parts, r), rad: 0.45, h: H };
    },
    olive(r) {
      const parts = []; const H = r.range(3.0, 4.2); const root = new V3(0, 0, 0);
      const fork = new V3(r.range(-0.1, 0.1), H * 0.38, r.range(-0.1, 0.1)); const Lr = limb(root, fork, 0.34, 0.24, 7); parts.push({ g: Lr.g, m: Lr.m, c: '#6a5a46', j: 0.1 });
      const cols = ['#8a9c6a', '#7a8e5c', '#9aac7a', '#6e8250']; const nl = r.int(2, 3);
      for (let i = 0; i < nl; i++) {
        const a = i / nl * 6.28 + r.range(-0.3, 0.3), tip = new V3(Math.cos(a) * r.range(0.7, 1.1), H * r.range(0.78, 1.0), Math.sin(a) * r.range(0.7, 1.1));
        const L = limb(fork, tip, 0.2, 0.1, 6); parts.push({ g: L.g, m: L.m, c: '#6a5a46', j: 0.1 });
        crown(parts, r, tip.x, tip.y + 0.15, tip.z, 0.85, 0.5, 0.85, 4, 0.55, 0.85, cols, 0.7);
      }
      return { g: merge(parts, r), rad: 0.4, h: H + 1 };
    },
    arbutus(r) {
      const parts = []; const H = r.range(3, 4.2); const top = trunk(parts, r, H * 0.82, 0.26, 0.14, 0.12, '#9a4a30', 4);
      const cols = ['#2e6a34', '#3a7a3c', '#26582e']; const out = crown(parts, r, top.x, H * 0.85, top.z, 1.3, 0.9, 1.3, 7, 0.7, 1.1, cols, 0.8);
      for (let i = 0; i < 8; i++) { const t = r.pick(out); parts.push({ g: new THREE.IcosahedronGeometry(0.08, 0), m: M(t.x + r.range(-0.3, 0.3), t.y - 0.5, t.z + r.range(-0.3, 0.3)), c: '#e8402a', j: 0 }); }
      return { g: merge(parts, r), rad: 0.35, h: H + 1 };
    },
    giant(r) {
      const parts = []; const H = r.range(15, 22);
      const top = trunk(parts, r, H * 0.9, 0.85, 0.5, 0.04, ['#6a5a48', '#5a4a3a', 0, H], 6);
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28; parts.push({ g: new THREE.BoxGeometry(0.16, 3.4, 1.7), m: M(Math.cos(a) * 0.75, 1.5, Math.sin(a) * 0.75, 0, -a, 0.22), c: '#5a4a3a', j: 0.06 }); }
      const cols = ['#2e7a34', '#3a8a3a', '#26682c', '#4a9a40']; const cy = H * 0.93;
      const out = crown(parts, r, top.x, cy, top.z, 5.2, 1.6, 5.2, 13, 1.9, 3.0, cols, 0.65);
      for (let i = 0; i < 5; i++) { const t = out[i * 2]; const a = new V3(top.x * 0.8, H * r.range(0.6, 0.75), top.z * 0.8); const L = limb(a, new V3(t.x * 0.8, t.y - 0.6, t.z * 0.8), 0.3, 0.14, 6); parts.push({ g: L.g, m: L.m, c: '#5a4a3a', j: 0.06 }); }
      for (let i = 0; i < 9; i++) { const t = out[(i * 3) % out.length]; const len = r.range(4, 9); parts.push({ g: cylG(0.035, 0.035, len, 4), m: M(t.x * 0.7, t.y - 1.0 - len, t.z * 0.7), c: '#3a5a2a', j: 0.05 }); }
      return { g: merge(parts, r), rad: 1.0, h: H + 3 };
    },
    dipt(r) {
      const parts = []; const H = r.range(19, 26);
      const top = trunk(parts, r, H * 0.92, 0.5, 0.3, 0.03, ['#a0907a', '#8a7a64', 0, H], 6);
      for (let i = 0; i < 4; i++) { const a = i / 4 * 6.28 + 0.4; parts.push({ g: new THREE.BoxGeometry(0.12, 2.6, 1.2), m: M(Math.cos(a) * 0.55, 1.1, Math.sin(a) * 0.55, 0, -a, 0.15), c: '#8a7a64', j: 0.06 }); }
      const cols = ['#2e8236', '#3a923c', '#28702e', '#4aa244'];
      const out = crown(parts, r, top.x, H * 0.95, top.z, 3.8, 2.0, 3.8, 11, 1.6, 2.6, cols, 0.7);
      for (let i = 0; i < 4; i++) { const t = out[i]; const a = new V3(top.x * 0.9, H * r.range(0.72, 0.84), top.z * 0.9); const L = limb(a, new V3(t.x * 0.8, t.y - 0.5, t.z * 0.8), 0.22, 0.1, 6); parts.push({ g: L.g, m: L.m, c: '#8a7a64', j: 0.06 }); }
      return { g: merge(parts, r), rad: 0.65, h: H + 3 };
    },
    palm(r) {
      const parts = []; const H = r.range(6, 10); const top = trunk(parts, r, H, 0.2, 0.12, r.range(0.1, 0.22), ['#8a7a5a', '#6a5a3a', 0, H], 7);
      for (let i = 0; i < 9; i++) { const a = i / 9 * 6.28 + r.range(-0.2, 0.2); parts.push({ g: frondG(r.range(2.4, 3.4), 0.85, r.range(0.3, 0.7)), m: M(top.x, top.y, top.z, 0, a, r.range(0, 0.15)), c: ['#2a7a30', '#4a9a3c', 0, H + 4], j: 0.1 }); }
      parts.push({ g: blobG(0.24, r), m: M(top.x, top.y - 0.15, top.z), c: '#5a4a2a' });
      return { g: merge(parts, r), rad: 0.28, h: H + 1 };
    },
    fern(r) {
      const parts = []; const H = r.range(1.4, 3.2); const top = trunk(parts, r, H, 0.14, 0.09, r.range(0, 0.1), '#5a4a32', 3);
      for (let i = 0; i < 11; i++) { const a = i / 11 * 6.28 + r.range(-0.15, 0.15); parts.push({ g: frondG(r.range(1.6, 2.4), 0.6, r.range(0.2, 0.55)), m: M(top.x, top.y, top.z, 0, a, r.range(0.05, 0.4)), c: ['#2e8a34', '#58b44a', 0, H + 3], j: 0.12 }); }
      return { g: merge(parts, r), rad: 0.2, h: H + 1 };
    },
    acacia(r) {
      const parts = []; const H = r.range(4.5, 6.5); const fork = new V3(r.range(-0.2, 0.2), H * 0.52, r.range(-0.2, 0.2));
      const L0 = limb(new V3(0, 0, 0), fork, 0.26, 0.17, 6); parts.push({ g: L0.g, m: L0.m, c: '#5a4630', j: 0.1 });
      const cols = ['#6a8a2a', '#7a9a34', '#5a7a24']; const n = r.int(2, 3);
      for (let i = 0; i < n; i++) {
        const a = i / n * 6.28 + r.range(-0.4, 0.4), d = r.range(1.3, 2.3), tip = new V3(fork.x + Math.cos(a) * d, H * r.range(0.95, 1.05), fork.z + Math.sin(a) * d);
        const L = limb(fork, tip, 0.16, 0.08, 6); parts.push({ g: L.g, m: L.m, c: '#5a4630', j: 0.1 });
        crown(parts, r, tip.x, tip.y + 0.15, tip.z, 1.7, 0.28, 1.7, 5, 0.9, 1.5, cols, 0.32);
      }
      return { g: merge(parts, r), rad: 0.3, h: H + 1 };
    },
    baobab(r) {
      const parts = []; const H = r.range(7, 9);
      parts.push({ g: cylG(1.15, 1.65, H * 0.82, 10), c: ['#8a7660', '#7a6650', 0, H], j: 0.08 });
      const cols = ['#6a8a34', '#7a9a3c'];
      for (let i = 0; i < 6; i++) {
        const a = i / 6 * 6.28 + r.range(-0.3, 0.3), a0 = new V3(Math.cos(a) * 0.5, H * 0.76, Math.sin(a) * 0.5), tip = new V3(Math.cos(a) * 2.7, H + r.range(0.8, 1.8), Math.sin(a) * 2.7);
        const L = limb(a0, tip, 0.34, 0.12, 6); parts.push({ g: L.g, m: L.m, c: '#7a6650', j: 0.08 });
        crown(parts, r, tip.x, tip.y + 0.2, tip.z, 0.9, 0.4, 0.9, 2, 0.5, 0.9, cols, 0.6);
      }
      return { g: merge(parts, r), rad: 1.65, h: H + 3 };
    },
    cotton(r) {
      const parts = []; const H = r.range(8, 11); const top = trunk(parts, r, H * 0.72, 0.5, 0.26, 0.05, ['#6a5a46', '#5a4a38', 0, H], 5);
      const cols = ['#7aa83c', '#6a983a', '#8ab848', '#5e8a34']; const out = crown(parts, r, top.x, H * 0.84, top.z, 2.8, 2.1, 2.8, 11, 1.2, 2.0, cols);
      for (let i = 0; i < 4; i++) { const t = out[i]; const a = new V3(top.x * 0.9, H * r.range(0.45, 0.6), top.z * 0.9); const L = limb(a, new V3(t.x * 0.9, t.y - 0.6, t.z * 0.9), 0.2, 0.09, 6); parts.push({ g: L.g, m: L.m, c: '#5a4a38', j: 0.08 }); }
      return { g: merge(parts, r), rad: 0.6, h: H + 2 };
    },
    willow(r) {
      const parts = []; const H = r.range(5, 7); const top = trunk(parts, r, H * 0.62, 0.38, 0.2, 0.1, '#5a4a36', 4);
      const cols = ['#8aaa48', '#7a9a3c', '#9ab858']; const out = crown(parts, r, top.x, H * 0.76, top.z, 2.0, 1.2, 2.0, 7, 1.0, 1.6, cols);
      for (let i = 0; i < 16; i++) { const t = r.pick(out); const len = r.range(2, 3.4); parts.push({ g: cylG(0.045, 0.02, len, 4), m: M(t.x * 1.1, t.y - 0.6 - len, t.z * 1.1), c: '#86a844', j: 0.08 }); }
      return { g: merge(parts, r), rad: 0.5, h: H + 1 };
    },
    crypto(r) {
      const parts = []; const H = r.range(14, 22);
      parts.push({ g: cylG(0.12, 0.55, H * 0.96, 7), c: '#6a4a38', j: 0.08 });
      for (let i = 0; i < 7; i++) { const t = i / 6; parts.push({ g: coneG(lerp(2.1, 0.5, t), H * 0.24, 8), m: M(0, H * 0.14 + t * H * 0.7, 0, 0, i * 0.8), c: ['#1e3e28', '#2e5a34', 0, H], j: 0.1 }); }
      return { g: merge(parts, r), rad: 0.6, h: H };
    },
    maple(r) {
      const parts = []; const H = r.range(5, 7); const top = trunk(parts, r, H * 0.7, 0.26, 0.13, 0.08, '#5a4a3a', 4);
      const autumn = r.chance(0.3); const cols = autumn ? ['#d8401a', '#e8741c', '#c82a18'] : ['#3a8a38', '#4a9a3c', '#2e7a32'];
      const out = crown(parts, r, top.x, H * 0.82, top.z, 1.8, 1.4, 1.8, 8, 0.9, 1.5, cols);
      for (let i = 0; i < 3; i++) { const t = out[i]; const a = new V3(top.x * 0.8, H * r.range(0.45, 0.58), top.z * 0.8); const L = limb(a, new V3(t.x * 0.9, t.y - 0.5, t.z * 0.9), 0.12, 0.06, 5); parts.push({ g: L.g, m: L.m, c: '#5a4a3a', j: 0.06 }); }
      return { g: merge(parts, r), rad: 0.35, h: H + 1 };
    },
    bamboo(r) {
      const parts = []; const n = 9;
      for (let i = 0; i < n; i++) {
        const a = r.range(0, 6.28), d = r.range(0, 1.0), H = r.range(7, 11), x = Math.cos(a) * d, z = Math.sin(a) * d, lx = r.range(-0.3, 0.3), lz = r.range(-0.3, 0.3);
        const L = limb(new V3(x, 0, z), new V3(x + lx, H, z + lz), 0.075, 0.04, 5); parts.push({ g: L.g, m: L.m, c: ['#6aa83a', '#8ac04a', 0, H], j: 0.05 });
        for (let k = 1; k < 6; k++) { const t = k / 6; parts.push({ g: cylG(0.09, 0.09, 0.07, 5), m: M(x + lx * t, H * t, z + lz * t), c: '#4a7a28', j: 0 }); }
        for (let k = 0; k < 4; k++) parts.push({ g: frondG(1.2, 0.35, 0.3, 3), m: M(x + lx * (0.8 + k * 0.05), H * (0.78 + k * 0.05), z + lz * (0.8 + k * 0.05), 0, r.range(0, 6.28), 0.2), c: ['#3e8a30', '#62b043', 0, 12], j: 0.1 });
      }
      return { g: merge(parts, r), rad: 1.0, h: 11 };
    },
    // ---- the raised bog: stunted pine (ryam), a dead pine, dwarf birch, Labrador tea, cassandra, sphagnum hummocks, cotton-grass tussocks
    ryam(r) {
      const parts = []; const H = r.range(2.6, 5.4); const top = trunk(parts, r, H * 0.82, 0.15, 0.07, r.range(0.12, 0.3), ['#6a4a34', '#4a3626', 0, H], 4);
      const cols = ['#2a4628', '#365a2e', '#233e26', '#42663a'], nb = r.int(3, 5);
      for (let i = 0; i < nb; i++) {                                           // crooked side branches, each ends in a flat pad of needles
        const A = top.pts[Math.min(top.pts.length - 1, 1 + Math.floor(r.range(0.3, 1) * (top.pts.length - 2)))], a = r.range(0, 6.28), len = r.range(0.7, 1.5);
        const tip = new V3(A.x + Math.cos(a) * len, A.y + r.range(-0.1, 0.45), A.z + Math.sin(a) * len); const L = limb(A, tip, 0.05, 0.022, 5); parts.push({ g: L.g, m: L.m, c: '#5a4030', j: 0.06 });
        crown(parts, r, tip.x, tip.y + 0.08, tip.z, 0.5, 0.16, 0.5, 4, 0.26, 0.48, cols, 0.42);
      }
      crown(parts, r, top.x, top.y + 0.05, top.z, 0.5, 0.3, 0.5, 5, 0.3, 0.52, cols, 0.55);
      for (let i = 0; i < 3; i++) { const A = top.pts[1 + (i % (top.pts.length - 2))], a = r.range(0, 6.28); const L = limb(A, new V3(A.x + Math.cos(a) * 0.45, A.y + 0.05, A.z + Math.sin(a) * 0.45), 0.025, 0.012, 4); parts.push({ g: L.g, m: L.m, c: '#8a8678', j: 0.05 }); }   // dead grey stubs low on the trunk
      return { g: merge(parts, r), rad: 0.2, h: H + 0.8 };
    },
    snag(r) {
      const parts = []; const H = r.range(3, 6.2); const top = trunk(parts, r, H, 0.17, 0.05, r.range(-0.12, 0.12), ['#8c887c', '#6a665c', 0, H], 5);
      for (let i = 0; i < r.int(3, 5); i++) {                                  // bare branches with a twig or two
        const A = top.pts[Math.min(top.pts.length - 1, 1 + Math.floor(r.range(0.2, 0.95) * (top.pts.length - 2)))], a = r.range(0, 6.28), len = r.range(0.6, 1.4);
        const tip = new V3(A.x + Math.cos(a) * len, A.y + r.range(0.15, 0.6), A.z + Math.sin(a) * len); const L = limb(A, tip, 0.045, 0.015, 4); parts.push({ g: L.g, m: L.m, c: '#7e7a6e', j: 0.05 });
        const T = limb(new V3(lerp(A.x, tip.x, 0.6), lerp(A.y, tip.y, 0.6), lerp(A.z, tip.z, 0.6)), new V3(tip.x + r.range(-0.3, 0.3), tip.y + r.range(0.1, 0.4), tip.z + r.range(-0.3, 0.3)), 0.02, 0.008, 3); parts.push({ g: T.g, m: T.m, c: '#7e7a6e', j: 0.05 });
      }
      for (let i = 0; i < 4; i++) { const y = r.range(0.5, H * 0.7), a = r.range(0, 6.28), tt = y / H, k = Math.min(top.pts.length - 2, Math.floor(tt * (top.pts.length - 1))), P0 = top.pts[k], P1 = top.pts[k + 1], u = clamp((y - P0.y) / (P1.y - P0.y || 1)), rr = lerp(0.17, 0.05, tt) * 0.9; parts.push({ g: blobG(0.09, r, 0.3, 0), m: M(lerp(P0.x, P1.x, u) + Math.cos(a) * rr, y, lerp(P0.z, P1.z, u) + Math.sin(a) * rr, 0, 0, 0, 1.5, 0.5, 1.5), c: '#9aa070', j: 0.1 }); }   // lichen patches on the (leaning) trunk
      return { g: merge(parts, r), rad: 0.2, h: H };
    },
    dbirch(r) {
      const parts = []; const n = r.int(4, 7), cols = ['#4a6a2a', '#5a7a30', '#6a8a38', '#7a9040'];
      for (let i = 0; i < n; i++) {
        const a = r.range(0, 6.28), lean = r.range(0.12, 0.5), H = r.range(0.6, 1.3), tip = new V3(Math.cos(a) * lean, H, Math.sin(a) * lean);
        const L = limb(new V3(Math.cos(a) * 0.06, 0, Math.sin(a) * 0.06), tip, 0.022, 0.01, 4); parts.push({ g: L.g, m: L.m, c: '#5a4636', j: 0.05 });
        for (let k = 0; k < 3; k++) parts.push({ g: blobG(r.range(0.1, 0.17), r, 0.3, 0), m: M(tip.x * (0.6 + k * 0.2) + r.range(-0.06, 0.06), H * (0.65 + k * 0.17), tip.z * (0.6 + k * 0.2) + r.range(-0.06, 0.06), 0, 0, 0, 1, 0.7, 1), c: r.pick(cols), j: 0.12 });
      }
      return { g: merge(parts, r), rad: 0.25, h: 1.5 };
    },
    ledum(r) {      // Labrador tea: woody stems from the ground, a mass of leathery leaves on each, rusty felt underneath, white flower umbels on short stalks
      const parts = []; const cols = ['#33522a', '#3e6030', '#2a4626', '#48683a'], wh = r.chance(0.8);
      for (let i = 0; i < 5; i++) {
        const a = r.range(0, 6.28), d = r.range(0.05, 0.38), hh = r.range(0.4, 0.75), B = new V3(Math.cos(a) * d, hh, Math.sin(a) * d), A = new V3(Math.cos(a) * 0.03, 0, Math.sin(a) * 0.03);
        const L = limb(A, B, 0.032, 0.016, 5); parts.push({ g: L.g, m: L.m, c: '#4a3626', j: 0.05 });
        const R = r.range(0.2, 0.3); parts.push({ g: blobG(R, r, 0.3, 1), m: M(B.x, B.y - 0.02, B.z, 0, 0, 0, 1, 0.8, 1), c: r.pick(cols), j: 0.1 });
        const m = limb(A.clone().lerp(B, 0.5), B.clone().add(new V3(Math.cos(a + 1.3) * R * 0.6, -R * 0.1, Math.sin(a + 1.3) * R * 0.6)), 0.014, 0.01, 4); parts.push({ g: m.g, m: m.m, c: '#4a3626', j: 0.05 });
        parts.push({ g: blobG(R * 0.55, r, 0.3, 0), m: M(B.x + Math.cos(a + 1.3) * R * 0.6, B.y - R * 0.1, B.z + Math.sin(a + 1.3) * R * 0.6, 0, 0, 0, 1, 0.8, 1), c: r.pick(cols), j: 0.1 });
        parts.push({ g: blobG(R * 0.5, r, 0.3, 0), m: M(B.x, B.y - R * 0.5, B.z, 0, 0, 0, 1.2, 0.35, 1.2), c: '#8a5a34', j: 0.1 });          // the rusty felt on the leaf undersides, right under the leaf mass
        if (wh && i < 4) { const T = B.clone().add(new V3(r.range(-0.08, 0.08), R * 0.8 + r.range(0.05, 0.12), r.range(-0.08, 0.08))), P = limb(B, T, 0.012, 0.008, 4); parts.push({ g: P.g, m: P.m, c: '#6a7a40', j: 0.04 });
          for (let k = 0; k < 4; k++) parts.push({ g: blobG(0.06, r, 0.25, 0), m: M(T.x + r.range(-0.07, 0.07), T.y + r.range(0, 0.04), T.z + r.range(-0.07, 0.07)), c: '#f2f2e4', j: 0.04 }); }
      }
      return { g: merge(parts, r), rad: 0, h: 1 };
    },
    cassandra(r) {      // leatherleaf: arching stems with rusty leaves at the tips and white bells hanging from the stems on short stalks
      const parts = []; const cols = ['#8a5a34', '#7a4a2c', '#9a6a3a', '#6a4a2c'];
      for (let i = 0; i < 6; i++) {
        const a = r.range(0, 6.28), d = r.range(0.05, 0.4); const A = new V3(Math.cos(a) * 0.05, 0.0, Math.sin(a) * 0.05), B = new V3(Math.cos(a) * d, r.range(0.35, 0.7), Math.sin(a) * d); const L = limb(A, B, 0.03, 0.015, 4); parts.push({ g: L.g, m: L.m, c: '#4a3426', j: 0.05 });
        parts.push({ g: blobG(r.range(0.1, 0.17), r, 0.3, 0), m: M(B.x, B.y, B.z, 0, 0, 0, 1.2, 0.8, 1.2), c: r.pick(cols), j: 0.1 });
        for (let k = 0; k < 2; k++) { const t = r.range(0.45, 0.9), P = A.clone().lerp(B, t), a2 = a + r.range(-1.2, 1.2), Q = P.clone().add(new V3(Math.cos(a2) * 0.07, 0.03, Math.sin(a2) * 0.07)), S = limb(P, Q, 0.012, 0.008, 4); parts.push({ g: S.g, m: S.m, c: '#5a4030', j: 0.04 });
          parts.push({ g: blobG(0.05, r, 0.2, 0), m: M(Q.x, Q.y - 0.02, Q.z, 0, 0, 0, 1, 1.15, 1), c: '#f6efe6', j: 0.03 }); }
      }
      return { g: merge(parts, r), rad: 0, h: 0.9 };
    },
    hummock(r) {
      const parts = []; const pal = r.pick([['#667f34', '#76903c', '#566e2c'], ['#744030', '#84503a', '#62342a'], ['#9a9444', '#a8a24e', '#868038'], ['#5c7830', '#6c8a38', '#4e6828']]); const R = r.range(0.5, 1.15);
      parts.push({ g: blobG(R, r, 0.28, 1), m: M(0, 0.04, 0, 0, r.range(0, 6), 0, 1.15, 0.42, 1.15), c: [shadeHex(pal[2], 0.8), pal[1], 0, R * 0.5], j: 0.12 });
      for (let i = 0; i < 15; i++) { const a = r.range(0, 6.28), d = r.range(0.05, R * 0.85), k = r.range(0.85, 1.2); parts.push({ g: blobG(r.range(0.1, 0.24), r, 0.3, 0), m: M(Math.cos(a) * d, R * 0.34 * (1 - d / R) + 0.04, Math.sin(a) * d, 0, 0, 0, 1.25, 0.55, 1.25), c: shadeHex(r.pick(pal), k), j: 0.14 }); }    // the heads of sphagnum
      for (let i = 0; i < 4; i++) { const a = r.range(0, 6.28), d = r.range(0, R * 0.6), y = R * 0.4 * (1 - d / R) + 0.05, h = r.range(0.18, 0.4); parts.push({ g: coneG(0.02, h, 3), m: M(Math.cos(a) * d, y, Math.sin(a) * d, r.range(-0.4, 0.4), 0, r.range(-0.4, 0.4)), c: ['#6a7a34', '#b4ac68', 0, h], j: 0.1 }); }   // sedge blades
      if (r.chance(0.7)) for (let i = 0; i < r.int(3, 7); i++) { const a = r.range(0, 6.28), d = r.range(0, R * 0.7); const y = R * 0.42 * (1 - d / R) + 0.04; parts.push({ g: new THREE.IcosahedronGeometry(0.045, 0), m: M(Math.cos(a) * d, y, Math.sin(a) * d), c: '#c0282c', j: 0.04 }); parts.push({ g: blobG(0.07, r, 0.3, 0), m: M(Math.cos(a) * d + 0.05, y - 0.02, Math.sin(a) * d, 0, 0, 0, 1.4, 0.3, 1.4), c: '#3a5a2c', j: 0.1 }); }   // cranberries
      if (r.chance(0.35)) { const a = r.range(0, 6.28), d = r.range(0.05, R * 0.5), y = R * 0.42 * (1 - d / R) + 0.04; for (let k = 0; k < 6; k++) parts.push({ g: new THREE.BoxGeometry(0.1, 0.012, 0.022), m: M(Math.cos(a) * d, y, Math.sin(a) * d, 0, k * 0.52, 0), c: '#b8321e', j: 0.05 }); parts.push({ g: new THREE.IcosahedronGeometry(0.02, 0), m: M(Math.cos(a) * d, y + 0.018, Math.sin(a) * d), c: '#e8a090', j: 0.02 }); }   // a sundew rosette
      return { g: merge(parts, r), rad: 0, h: 0.6 };
    },
    tussock(r) {
      const parts = []; const base = r.pick(['#7a8a38', '#8a8c40', '#6a7c34']);
      parts.push({ g: blobG(0.3, r, 0.3, 1), m: M(0, 0.1, 0, 0, 0, 0, 1.2, 0.7, 1.2), c: shadeHex('#5a4a2a', 1), j: 0.1 });
      for (let i = 0; i < 24; i++) { const a = r.range(0, 6.28), d = r.range(0, 0.22), h = r.range(0.45, 0.95); parts.push({ g: coneG(0.022, h, 3), m: M(Math.cos(a) * d, 0.12, Math.sin(a) * d, Math.sin(a) * r.range(0.15, 0.5), 0, -Math.cos(a) * r.range(0.15, 0.5)), c: [shadeHex(base, 0.8), '#c4bc72', 0, h], j: 0.1 }); }
      for (let i = 0; i < 5; i++) { const a = r.range(0, 6.28), d = r.range(0, 0.2), h = r.range(0.7, 1.05), lx = Math.cos(a) * 0.12, lz = Math.sin(a) * 0.12; const L = limb(new V3(Math.cos(a) * d, 0.12, Math.sin(a) * d), new V3(Math.cos(a) * d + lx, h, Math.sin(a) * d + lz), 0.022, 0.014, 4); parts.push({ g: L.g, m: L.m, c: '#9a9a58', j: 0.04 }); parts.push({ g: blobG(0.085, r, 0.3, 1), m: M(Math.cos(a) * d + lx, h + 0.06, Math.sin(a) * d + lz, 0, 0, 0, 1, 1.2, 1), c: '#f4f2ea', j: 0.05 }); }   // cotton-grass heads
      return { g: merge(parts, r), rad: 0, h: 1.1 };
    },
    // ---- the highlands of northern Vietnam
    kesiya(r) {     // Khasi pine: a tall straight reddish trunk, a few whorls of branches that carry brushes of long needles
      const parts = [], H = r.range(13, 18), top = trunk(parts, r, H, 0.34, 0.06, r.range(-0.05, 0.05), ['#7a4a34', '#4a3a30', 0, H], 6, 7);
      const at = y => { const t = clamp(y / H), k = Math.min(top.pts.length - 2, Math.floor(t * (top.pts.length - 1))), A = top.pts[k], B = top.pts[k + 1], u = clamp((y - A.y) / (B.y - A.y || 1)); return new V3(lerp(A.x, B.x, u), y, lerp(A.z, B.z, u)); };
      const cols = ['#4a7a30', '#5a8a38', '#6a9a44', '#7aa850'];
      for (let i = 0; i < 7; i++) {
        const y = H * (0.5 + i * 0.07) + r.range(-0.2, 0.2), c0 = at(y), nb = r.int(3, 5), a0 = r.range(0, 6.28), Lm = lerp(3.2, 1.0, i / 6) * r.range(0.85, 1.15);
        for (let b = 0; b < nb; b++) {
          const a = a0 + b / nb * 6.28 + r.range(-0.3, 0.3), L = Lm * r.range(0.8, 1.15), tip = new V3(c0.x + Math.cos(a) * L, c0.y + L * r.range(0.15, 0.5), c0.z + Math.sin(a) * L);
          const l = limb(c0, tip, 0.1 * lerp(1, 0.5, i / 6), 0.03, 5); parts.push({ g: l.g, m: l.m, c: '#6a4a38', j: 0.05 });
          for (const u of [0.6, 0.85, 1.0]) { const p = c0.clone().lerp(tip, u), sz = r.range(0.45, 0.75) * (u > 0.9 ? 0.85 : 1); parts.push({ g: blobG(sz, r, 0.35, 0), m: M(p.x, p.y + 0.08, p.z, 0, r.range(0, 6), 0, 1.15, 0.5, 1.15), c: shadeHex(r.pick(cols), 0.85 + 0.3 * (i / 6)), j: 0.1 }); }
          for (let k = 0; k < 4; k++) parts.push({ g: coneG(0.035, r.range(0.7, 1.1), 3), m: M(tip.x, tip.y + 0.05, tip.z, r.range(-0.9, 0.9), r.range(0, 6.28), r.range(-0.9, 0.9)), c: ['#4a7a30', '#9ac05a', 0, 1.1], j: 0.1 });
        }
      }
      for (let i = 0; i < 3; i++) { const y = H * (0.28 + i * 0.07), c0 = at(y), a = r.range(0, 6.28), tip = new V3(c0.x + Math.cos(a) * 0.8, c0.y + 0.2, c0.z + Math.sin(a) * 0.8), l = limb(c0, tip, 0.05, 0.02, 4); parts.push({ g: l.g, m: l.m, c: '#5a4030', j: 0.05 }); }      // dead stubs
      parts.push({ g: coneG(0.3, 0.9, 6), m: M(top.x, H * 0.96, top.z), c: ['#5a8a38', '#8ab850', 0, 1], j: 0.1 });
      return { g: merge(parts, r), rad: 0.42, h: H + 1 };
    },
    montoak(r) {    // a montane evergreen oak: short fluted trunk, broad dark crown, moss on trunk and limbs, grey-green lichen beards hanging from the limbs
      const parts = [], H = r.range(7, 10.5), Ht = H * 0.62, top = trunk(parts, r, Ht, 0.42, 0.2, r.range(-0.08, 0.08), ['#4a3c30', '#6a5a48', 0, Ht], 5, 7);
      const at = y => { const t = clamp(y / Ht), k = Math.min(top.pts.length - 2, Math.floor(t * (top.pts.length - 1))), A = top.pts[k], B = top.pts[k + 1], u = clamp((y - A.y) / (B.y - A.y || 1)); return new V3(lerp(A.x, B.x, u), y, lerp(A.z, B.z, u)); };
      const cols = ['#2e5a2c', '#3a6a32', '#2a502a', '#46783a'];
      for (let i = 0; i < 5; i++) { const a = i / 5 * 6.28 + r.range(-0.3, 0.3), L = r.range(0.7, 1.2); parts.push({ g: buttressG(L, r.range(0.5, 0.8), 0.1, r.range(-0.3, 0.3), r), m: M(top.pts[0].x, 0.02, top.pts[0].z, 0, -a, 0), c: ['#3a2c22', '#5a4a38', 0, 0.8], j: 0.05 }); }
      const A = at(Ht * 0.92);
      parts.push({ g: blobG(r.range(1.6, 2.1), r, 0.3, 1), m: M(top.x, Ht + 0.9, top.z, 0, 0, 0, 1, 0.75, 1), c: r.pick(cols), j: 0.1 });
      for (let i = 0; i < 5; i++) {
        const a = i / 5 * 6.28 + r.range(-0.3, 0.3), tip = new V3(A.x + Math.cos(a) * r.range(1.6, 2.8), A.y + r.range(1.0, 2.2), A.z + Math.sin(a) * r.range(1.6, 2.8)), l = limb(A, tip, 0.16, 0.07, 5); parts.push({ g: l.g, m: l.m, c: '#4a3c30', j: 0.05 });
        parts.push({ g: blobG(r.range(1.3, 1.9), r, 0.3, 1), m: M(tip.x, tip.y + 0.4, tip.z, 0, 0, 0, 1, 0.72, 1), c: r.pick(cols), j: 0.1 });
        const m = A.clone().lerp(tip, 0.5); parts.push({ g: blobG(0.22, r, 0.3, 0), m: M(m.x, m.y + 0.06, m.z, 0, 0, 0, 1.6, 0.55, 1.2), c: '#5a8a3a', j: 0.1 });       // moss on the limb
        for (let k = 0; k < 4; k++) { const p = A.clone().lerp(tip, r.range(0.45, 0.95)); parts.push({ g: coneG(0.07, r.range(0.5, 1.0), 4), m: M(p.x, p.y - 0.04, p.z, Math.PI, 0, 0), c: ['#9ab07a', '#d0dcb0', 0, 1], j: 0.08 }); }      // lichen beards
      }
      for (let i = 0; i < 6; i++) { const y = r.range(0.3, Ht * 0.8), P = at(y), a = r.range(0, 6.28), rr = lerp(0.42, 0.2, y / Ht) * 0.92; parts.push({ g: blobG(0.18, r, 0.3, 0), m: M(P.x + Math.cos(a) * rr, y, P.z + Math.sin(a) * rr, 0, 0, 0, 1.2, 1.1, 1.2), c: '#5a8a3a', j: 0.1 }); }     // moss on the trunk
      return { g: merge(parts, r), rad: 0.55, h: H + 2.5 };
    },
    treefern(r) {   // a tree fern (Cyathea): a slender fibrous trunk and a crown of arching fronds
      const parts = [], H = r.range(1.8, 4.2); parts.push({ g: cylG(0.13, 0.22, H, 6), c: ['#3a2a1e', '#5a4632', 0, H], j: 0.08 });
      for (let k = 0; k < 6; k++) parts.push({ g: new THREE.TorusGeometry(0.17, 0.035, 4, 7), m: M(0, 0.3 + k * H / 6.5, 0, Math.PI / 2, 0, 0), c: '#2a2016', j: 0.04 });
      for (let i = 0; i < 14; i++) { const a = i / 14 * 6.28 + r.range(-0.12, 0.12); parts.push({ g: frondG(r.range(2.0, 2.8), 0.7, r.range(0.35, 0.85), 6), m: M(0, H, 0, 0, a, r.range(0.0, 0.3)), c: ['#1e5a2a', '#5aa844', 0, H + 2], j: 0.1 }); }
      parts.push({ g: coneG(0.1, 0.45, 5), m: M(0, H - 0.02, 0), c: '#8ab048', j: 0.08 });
      return { g: merge(parts, r), rad: 0.25, h: H + 1.8 };
    },
    rhodo(r) {      // a rhododendron: a big shrub with leathery leaves and a truss of flowers at the tip of each branch
      const parts = [], n = r.int(5, 8), fc = r.pick([['#d8203c', '#e8405a', '#f06a80'], ['#f0a0c0', '#f8c0d4', '#e880a8'], ['#fdfaf2', '#f4ead8', '#f8e0e8']]), lc = ['#2a5a30', '#336a38', '#244e2a'];
      for (let i = 0; i < n; i++) {
        const a = r.range(0, 6.28), d = r.range(0.0, 0.7), hh = r.range(1.2, 2.3), B = new V3(Math.cos(a) * d, hh, Math.sin(a) * d), A = new V3(Math.cos(a) * 0.08, 0, Math.sin(a) * 0.08), l = limb(A, B, 0.055, 0.025, 5); parts.push({ g: l.g, m: l.m, c: '#5a4034', j: 0.05 });
        parts.push({ g: blobG(r.range(0.45, 0.7), r, 0.3, 1), m: M(B.x, B.y - 0.12, B.z, 0, 0, 0, 1, 0.7, 1), c: r.pick(lc), j: 0.1 });
        const m = A.clone().lerp(B, 0.65); parts.push({ g: blobG(r.range(0.3, 0.45), r, 0.3, 0), m: M(m.x, m.y, m.z, 0, 0, 0, 1, 0.75, 1), c: r.pick(lc), j: 0.1 });
        if (r.chance(0.85)) { const F = B.clone().add(new V3(r.range(-0.08, 0.08), 0.42, r.range(-0.08, 0.08))), pl = limb(B, F, 0.03, 0.02, 4); parts.push({ g: pl.g, m: pl.m, c: '#6a5a3a', j: 0.04 }); for (let k = 0; k < 6; k++) parts.push({ g: blobG(0.13, r, 0.25, 0), m: M(F.x + r.range(-0.17, 0.17), F.y + r.range(-0.05, 0.12), F.z + r.range(-0.17, 0.17), 0, 0, 0, 1, 0.85, 1), c: r.pick(fc), j: 0.05 }); }
      }
      return { g: merge(parts, r), rad: 0, h: 2.6 };
    },
    musa(r) {       // a wild banana: a pseudostem of leaf sheaths and big torn leaves, a hanging maroon flower bud
      const parts = [], H = r.range(2.2, 3.4); parts.push({ g: cylG(0.17, 0.25, H, 7), c: ['#7a8a4a', '#9aaa5c', 0, H], j: 0.06 });
      for (let i = 0; i < 7; i++) { const a = i / 7 * 6.28 + r.range(-0.2, 0.2); parts.push({ g: frondG(r.range(2.0, 2.8), 1.0, r.range(0.4, 0.9), 6), m: M(0, H, 0, 0, a, r.range(0, 0.2)), c: ['#2a6a2a', '#5aa046', 0, H + 1.6], j: 0.1 }); }
      const E = new V3(0.35, H - 0.7, 0.1), l = limb(new V3(0, H, 0), E, 0.05, 0.035, 4); parts.push({ g: l.g, m: l.m, c: '#5a4a2a', j: 0.04 }); parts.push({ g: blobG(0.17, r, 0.2, 0), m: M(E.x, E.y - 0.12, E.z, 0, 0, 0, 0.8, 1.5, 0.8), c: '#6a1a2a', j: 0.06 });
      return { g: merge(parts, r), rad: 0.35, h: H + 1.8 };
    },
    karst(r) {      // limestone spires: jagged grey towers, stained and striated, with moss, ferns and shrubs on the ledges
      const parts = [], n = r.int(3, 5);
      parts.push({ g: blobG(3.2, r, 0.25, 1), m: M(0, 0.2, 0, 0, 0, 0, 1.15, 0.38, 1.15), c: '#5a6a4a', j: 0.1 });
      for (let i = 0; i < n; i++) {
        const a = r.range(0, 6.28), d = i === 0 ? 0 : r.range(1.5, 3.2), cx = Math.cos(a) * d, cz = Math.sin(a) * d, R0 = r.range(1.1, 2.0), Hh = r.range(4.5, 9.5) * (i === 0 ? 1.2 : 1), nt = 4, th = Hh / nt;
        let lx = 0, lz = 0; for (let k = 0; k < nt; k++) {
          const rb = R0 * (1 - 0.72 * k / nt) * r.range(0.85, 1.12), rt = R0 * (1 - 0.72 * (k + 1) / nt) * r.range(0.8, 1.05); const g = cylG(rt, rb, th, 6); jitterGeo(g, 0.22, r);
          parts.push({ g, m: M(cx + lx, k * th - 0.1, cz + lz), c: k === 0 ? ['#5a6450', '#8a8a7c', 0, th] : ['#7a7a70', '#c4c0b0', 0, th], j: 0.1 });
          if (k < nt - 1 && r.chance(0.8)) { const q = r.range(0, 6.28); parts.push({ g: blobG(rt * 0.55, r, 0.3, 0), m: M(cx + lx + Math.cos(q) * rt * 0.55, (k + 1) * th - 0.05, cz + lz + Math.sin(q) * rt * 0.55, 0, 0, 0, 1, 0.5, 1), c: r.pick(['#3a6a30', '#4a7a38', '#5a8a3a']), j: 0.1 }); }      // a shrub on the ledge
          lx += r.range(-0.12, 0.12); lz += r.range(-0.12, 0.12);
        }
        parts.push({ g: coneG(Math.max(0.2, R0 * 0.3), 1.1, 6), m: M(cx + lx, Hh - 0.15, cz + lz), c: '#c8c4b4', j: 0.1 });
      }
      return { g: merge(parts, r), rad: 2.8, h: 11 };
    },
    // ---- the relic forest of New Guinea
    relic(r) {      // an emergent giant: buttressed trunk, a fork, a few huge limbs that branch again, flat crowns of leaves, epiphytes and lianas
      const parts = []; const H = r.range(28, 38), F = H * r.range(0.4, 0.5);
      const top = trunk(parts, r, F, 1.2, 0.74, r.range(-0.03, 0.03), ['#6e5e4a', '#463a2e', 0, F], 6, 11);
      for (let i = 0; i < 18; i++) {          // bark ridges: thin tapering strands that follow the trunk and wander a little
        const a = i / 18 * 6.28 + r.range(-0.15, 0.15), y0 = r.range(1.5, F * 0.5), y1 = y0 + r.range(F * 0.3, F * 0.55), w = r.range(-0.25, 0.25);
        const rr = y => lerp(1.2, 0.74, y / F) * 0.97, A = new V3(Math.cos(a) * rr(y0), y0, Math.sin(a) * rr(y0)), B = new V3(Math.cos(a + w) * rr(Math.min(y1, F)), Math.min(y1, F), Math.sin(a + w) * rr(Math.min(y1, F)));
        const L = limb(A, B, 0.07, 0.015, 3); parts.push({ g: L.g, m: L.m, c: r.pick(['#5a4c3a', '#4a3e30', '#6a5a46', '#3e342a']), j: 0.1 });
      }
      parts.push({ g: cylG(1.18, 1.95, 2.2, 11), c: ['#5a4c3a', '#6e5e4a', 0, 2.2], j: 0.07 });       // the flared foot of the trunk
      const nb = r.int(6, 8);
      for (let i = 0; i < nb; i++) {          // buttresses: thin curved fins that flare out of the trunk, sway, and sink into the ground
        const a = i / nb * 6.28 + r.range(-0.2, 0.2), hb = r.range(3.4, 6.2), Lb = r.range(2.6, 4.4);
        parts.push({ g: buttressG(Lb, hb, r.range(0.14, 0.26), r.range(-0.5, 0.5), r), m: M(Math.cos(a) * 0.45, -0.1, Math.sin(a) * 0.45, 0, -a, 0), c: ['#4a3e30', '#6e5e4a', 0, hb], j: 0.1 });
      }
      for (let i = 0; i < 6; i++) {           // surface roots snaking away over the ground between the buttresses
        let a = (i + 0.5) / 6 * 6.28 + r.range(-0.25, 0.25), p = new V3(Math.cos(a) * 1.5, 0.5, Math.sin(a) * 1.5); const n = r.int(5, 7), rad0 = r.range(0.28, 0.4);
        for (let k = 0; k < n; k++) { a += r.range(-0.22, 0.22); const q = new V3(p.x + Math.cos(a) * r.range(0.8, 1.2), Math.max(0.04, p.y - r.range(0.04, 0.12)) + r.range(-0.03, 0.05), p.z + Math.sin(a) * r.range(0.8, 1.2)); const L = limb(p, q, lerp(rad0, 0.05, k / n), lerp(rad0, 0.05, (k + 1) / n), 5); parts.push({ g: L.g, m: L.m, c: ['#4a3e30', '#5e5040', 0, 0.6], j: 0.08 }); p = q; }
      }
      for (let i = 0; i < 7; i++) { const a = r.range(0, 6.28), y = r.range(0.6, F * 0.8); parts.push({ g: blobG(0.32, r, 0.3, 0), m: M(Math.cos(a) * 1.0 * (1 - y / F * 0.4), y, Math.sin(a) * 1.0 * (1 - y / F * 0.4), 0, 0, 0, 1.4, 0.45, 1.4), c: '#3a6a30', j: 0.1 }); }      // moss on the trunk
      const cols = ['#1e5a2c', '#2a6a34', '#16482a', '#347a3a', '#245a30'], nL = r.int(3, 4), base = top.clone();
      const crownAt = (p, big) => crown(parts, r, p.x, p.y + 0.4, p.z, big ? 5.4 : 4.6, 1.3, big ? 5.4 : 4.6, big ? 10 : 8, 1.7, big ? 3.1 : 2.8, cols, 0.5);
      const limbs = [];
      for (let k = 0; k < nL; k++) {
        const a = k / nL * 6.28 + r.range(-0.4, 0.4), dir = new V3(Math.cos(a), 0, Math.sin(a));
        const P1 = base.clone().addScaledVector(dir, r.range(5, 8)); P1.y = base.y + r.range(0.12, 0.2) * H; const L1 = limb(base, P1, 0.62, 0.4, 6); parts.push({ g: L1.g, m: L1.m, c: ['#5a4c3a', '#4a3e30', 0, H], j: 0.07 }); limbs.push([base, P1, 0.62]);
        const ns = r.int(2, 3);
        for (let q = 0; q < ns; q++) {
          const a2 = a + (q - (ns - 1) / 2) * 0.9 + r.range(-0.25, 0.25), P2 = P1.clone().add(new V3(Math.cos(a2) * r.range(5, 8), r.range(0.07, 0.16) * H, Math.sin(a2) * r.range(5, 8))); const L2 = limb(P1, P2, 0.4, 0.22, 6); parts.push({ g: L2.g, m: L2.m, c: '#4e4234', j: 0.07 }); limbs.push([P1, P2, 0.4]);
          if (r.chance(0.7)) { const a3 = a2 + r.range(-0.7, 0.7), P3 = P2.clone().add(new V3(Math.cos(a3) * r.range(3, 5), r.range(0.03, 0.08) * H, Math.sin(a3) * r.range(3, 5))); const L3 = limb(P2, P3, 0.22, 0.1, 5); parts.push({ g: L3.g, m: L3.m, c: '#4e4234', j: 0.07 }); crownAt(P3, false); } else crownAt(P2, true);
        }
      }
      crownAt(top.clone().setY(top.y + 2), true);
      for (const [A, B, th] of limbs) {       // epiphytes, orchids and ferns on the limbs
        for (let i = 0; i < 3; i++) { const t = r.range(0.25, 0.9), x = lerp(A.x, B.x, t), y = lerp(A.y, B.y, t) + th * 0.5, z = lerp(A.z, B.z, t);
          for (let f = 0; f < 6; f++) parts.push({ g: frondG(r.range(1.0, 1.7), 0.4, r.range(0.3, 0.6), 4), m: M(x, y, z, 0, f / 6 * 6.28, r.range(0.2, 0.7)), c: ['#2e7a36', '#5ab04a', 0, 4], j: 0.1 });
          if (r.chance(0.5)) parts.push({ g: blobG(0.12, r, 0.3, 0), m: M(x, y + 0.4, z), c: r.pick(['#d060d8', '#f4f0e0', '#e86a3a']), j: 0.05 }); }
        for (let i = 0; i < 2; i++) { const t = r.range(0.3, 0.95), x = lerp(A.x, B.x, t), y = lerp(A.y, B.y, t), z = lerp(A.z, B.z, t), len = r.range(8, Math.max(9, y - 1)); parts.push({ g: cylG(0.035, 0.03, len, 4), m: M(x, y - len, z), c: '#34542a', j: 0.05 }); for (let k = 0; k < 3; k++) parts.push({ g: blobG(0.14, r, 0.3, 0), m: M(x, y - len * (0.25 + k * 0.28), z, 0, 0, 0, 1.3, 0.6, 1.3), c: '#2e6a32', j: 0.1 }); }    // lianas
      }
      return { g: merge(parts, r), rad: 1.3, h: H + 6 };
    },
    cycad(r) {
      const parts = []; const H = r.range(1.2, 3.2); parts.push({ g: cylG(0.32, 0.46, H, 7), c: ['#3a3026', '#5a4a38', 0, H], j: 0.08 });
      for (let k = 0; k < 6; k++) parts.push({ g: new THREE.TorusGeometry(0.4, 0.04, 4, 8), m: M(0, 0.3 + k * H / 6.5, 0, Math.PI / 2, 0, 0), c: '#2a2218', j: 0.04 });     // leaf-scar rings
      for (let i = 0; i < 13; i++) { const a = i / 13 * 6.28 + r.range(-0.1, 0.1); parts.push({ g: frondG(r.range(2.2, 3.0), 0.55, r.range(0.25, 0.7), 6), m: M(0, H, 0, 0, a, r.range(0.0, 0.25)), c: ['#1e5a2a', '#4a9a40', 0, H + 2], j: 0.1 }); }
      parts.push({ g: coneG(0.2, 0.55, 7), m: M(0, H - 0.05, 0), c: '#b4452a', j: 0.1 });
      return { g: merge(parts, r), rad: 0.3, h: H + 1.5 };
    },
    pandan(r) {     // a screw pine on stilt roots with rosettes of long saw-edged leaves
      const parts = []; const H = r.range(3.8, 6.0), lean = r.range(0.1, 0.3); const top = trunk(parts, r, H, 0.2, 0.12, lean, ['#7a6a52', '#5a4c38', 0, H], 4);
      for (let i = 0; i < 6; i++) { const a = i / 6 * 6.28 + r.range(-0.2, 0.2), L = limb(new V3(Math.cos(a) * 0.9, 0, Math.sin(a) * 0.9), new V3(Math.cos(a) * 0.15, H * 0.35, Math.sin(a) * 0.15), 0.04, 0.08, 4); parts.push({ g: L.g, m: L.m, c: '#6a5a44', j: 0.06 }); }
      const rosette = (p, n, len) => { for (let i = 0; i < n; i++) { const a = i / n * 6.28 + r.range(-0.15, 0.15); parts.push({ g: coneG(0.07, len * r.range(0.8, 1.1), 3), m: M(p.x, p.y, p.z, Math.sin(a) * 1.0, 0, -Math.cos(a) * 1.0), c: ['#5a8a2e', '#9ac04a', 0, len], j: 0.1 }); } };
      rosette(top, 16, 2.3); for (let k = 0; k < 2; k++) { const a = r.range(0, 6.28), tip = new V3(top.x + Math.cos(a) * 1.4, H * 0.88, top.z + Math.sin(a) * 1.4); const L = limb(new V3(top.x, H * 0.7, top.z), tip, 0.1, 0.06, 4); parts.push({ g: L.g, m: L.m, c: '#6a5a44', j: 0.06 }); rosette(tip, 12, 1.8); }
      return { g: merge(parts, r), rad: 0.6, h: H + 2 };
    },
    alocasia(r) {   // an elephant-ear: a few huge arrow-shaped leaves on bent stalks
      const parts = []; const n = r.int(4, 6);
      for (let i = 0; i < n; i++) {
        const a = r.range(0, 6.28), lean = r.range(0.25, 0.7), h = r.range(0.7, 1.3), x = Math.cos(a) * lean, z = Math.sin(a) * lean;
        const L = limb(new V3(0, 0, 0), new V3(x * 0.9, h, z * 0.9), 0.03, 0.02, 4); parts.push({ g: L.g, m: L.m, c: '#4a7a3a', j: 0.05 });
        const lg = new THREE.BufferGeometry(), w = r.range(0.5, 0.8), l = r.range(0.8, 1.2); lg.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, w * 0.5, 0.05, l * 0.2, -w * 0.5, 0.05, l * 0.2, w * 0.35, 0.1, l * 0.75, -w * 0.35, 0.1, l * 0.75, 0, 0.14, l, w * 0.52, 0, -l * 0.12, -w * 0.52, 0, -l * 0.12], 3)); lg.setIndex([0, 1, 2, 1, 3, 2, 2, 3, 4, 3, 5, 4, 0, 6, 1, 0, 2, 7]);
        parts.push({ g: lg, m: M(x * 0.9, h, z * 0.9, r.range(-0.5, -0.1), -a + Math.PI / 2, 0), c: ['#1c5a2c', '#3a8a40', 0, 1.6], j: 0.08 });
      }
      return { g: merge(parts, r), rad: 0, h: 1.6 };
    },
    lavarock(r) {   // a heap of cooled lava: dark vesicular crust, ropy ridges, rusty edges, ferns and moss in the cracks
      const parts = []; const R = r.range(0.7, 1.6);
      parts.push({ g: blobG(R, r, 0.45, 1), m: M(0, R * 0.14, 0, 0, r.range(0, 6), 0, 1.3, 0.55, 1.1), c: ['#1c1917', '#3c3631', 0, R], j: 0.16 });
      for (let i = 0; i < r.int(4, 7); i++) { const a = r.range(0, 6.28), d = r.range(0.1, R * 0.8), w = r.range(0.35, 0.8); parts.push({ g: new THREE.BoxGeometry(w, 0.1, w * r.range(0.6, 1.1)), m: M(Math.cos(a) * d, R * 0.5 * (1 - d / (R * 1.2)) + 0.2, Math.sin(a) * d, r.range(-0.2, 0.2), r.range(0, 6), r.range(-0.2, 0.2)), c: r.pick(['#2a2522', '#38322e', '#241f1d', '#443a34']), j: 0.12 }); }      // crust plates
      for (let i = 0; i < 3; i++) { const a = r.range(0, 6.28), A = new V3(Math.cos(a) * R * 0.2, R * 0.45, Math.sin(a) * R * 0.2), B = new V3(Math.cos(a + 0.3) * R * 0.85, R * 0.18, Math.sin(a + 0.3) * R * 0.85); const L = limb(A, B, 0.07, 0.05, 4); parts.push({ g: L.g, m: L.m, c: '#4a2e26', j: 0.08 }); }       // ropy ridges, rusty
      for (let i = 0; i < 4; i++) { const a = r.range(0, 6.28), d = r.range(R * 0.4, R * 0.95); parts.push({ g: blobG(0.12, r, 0.3, 0), m: M(Math.cos(a) * d, R * 0.22, Math.sin(a) * d, 0, 0, 0, 1.4, 0.5, 1.4), c: r.pick(['#3a6a30', '#4a7a38', '#58884a']), j: 0.1 }); }       // moss
      if (r.chance(0.7)) { const a = r.range(0, 6.28), d = R * 0.5; for (let f = 0; f < 5; f++) parts.push({ g: frondG(r.range(0.5, 0.9), 0.2, r.range(0.3, 0.6), 4), m: M(Math.cos(a) * d, R * 0.3, Math.sin(a) * d, 0, f / 5 * 6.28, r.range(0.3, 0.8)), c: ['#2e7a36', '#58b04a', 0, 1], j: 0.1 }); }
      return { g: merge(parts, r), rad: R * 0.8, h: R * 0.7 };
    },
    lavashard(r) {      // loose sharp shards of cooled lava scattered over the crust
      const parts = []; for (let i = 0; i < r.int(3, 6); i++) { const sz = r.range(0.12, 0.34); parts.push({ g: coneG(sz, sz * r.range(1.1, 2.2), r.pick([3, 4, 5])), m: M(r.range(-0.4, 0.4), -0.02, r.range(-0.4, 0.4), r.range(-0.5, 0.5), r.range(0, 6), r.range(-0.5, 0.5)), c: r.pick([['#1a1715', '#3a332e'], ['#2a2420', '#5a4a40'], ['#3a2420', '#6a3a2c']]).concat([0, sz * 2]), j: 0.12 }); }
      return { g: merge(parts, r), rad: 0, h: 0.5 };
    },
    groundfern(r) {      // a low fan of fronds on the forest floor
      const parts = []; const n = r.int(9, 13); for (let i = 0; i < n; i++) { const a = i / n * 6.28 + r.range(-0.2, 0.2); parts.push({ g: frondG(r.range(0.7, 1.4), 0.34, r.range(0.35, 0.9), 5), m: M(0, 0.06, 0, 0, a, r.range(0.35, 0.8)), c: ['#1e5a2c', '#58b04a', 0, 1.2], j: 0.12 }); }
      return { g: merge(parts, r), rad: 0, h: 1.2 };
    },
    bush(r, env) {
      const parts = []; const cols = env._bush;
      for (let i = 0; i < 4; i++) parts.push({ g: blobG(r.range(0.45, 0.8), r), m: M(r.range(-0.5, 0.5), 0.35 + r.range(0, 0.3), r.range(-0.5, 0.5), 0, 0, 0, 1, 0.8, 1), c: r.pick(cols), j: 0.14 });
      return { g: merge(parts, r), rad: 0.55, h: 1.2 };
    },
    termite(r) {
      const parts = [];
      parts.push({ g: coneG(0.9, 2.2, 7), c: ['#8a5a3a', '#a8734a', 0, 2.2], j: 0.16 });
      parts.push({ g: coneG(0.5, 1.6, 6), m: M(0.5, 0, 0.2), c: '#9a6642', j: 0.16 });
      return { g: merge(parts, r), rad: 0.9, h: 2.3 };
    },
    rock(r, env) {
      const parts = []; const base = env.rock;
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
    cotton: ['................', '.......pp.......', '......pppp......', '.....pppppp.....', '.....pppppp.....', '......pppp......', '.......pp.......', '.......s........', '.......s........', '.......s........', '.....s.s........', '......ss.s......', '.......s.s......', '.......s........', '......s.s.......', '.....s...s......'],
  };
  const KINDS = ['daisy', 'bell', 'spike', 'cluster', 'umbel', 'cotton'];
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

  // ------------------------------------------------------------ foliage shader (sway + fog)
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
        col = vCol * t.r + uCenter * t.b + leaf * t.g; col = max(col, vec3(0.0));
      } else {
        col = vCol * (0.55 + 0.7 * clamp(vUv.y, 0.0, 1.0)) * (0.8 + 0.3 * t.r);
      }
      col *= uLight;
      float f = 1.0 - exp(-uFogD * uFogD * vDist * vDist);
      gl_FragColor = vec4(mix(col, uFog, clamp(f, 0.0, 1.0)), 1.0);
    }`;

  const randomSeed = () => Math.random().toString(36).slice(2, 7).toUpperCase();

  // ------------------------------------------------------------ world builder
  function build(biome, seedStr) {
    seedStr = seedStr || randomSeed();
    const env = Object.assign({}, ENV[biome.id]);
    const seed = strSeed(biome.id + ':' + seedStr);
    const rng = new Rng(seed), noise = new Noise2(seed ^ 0x9e37), tnoise = new Noise2(seed ^ 0x51a3);
    env._bush = ({ papua: ['#2a6a30', '#3a7a34'], vietnam: ['#2e6a34', '#3a7a3a'], russia: ['#5a9a38', '#6aaa40'], alps: ['#5a8a3a', '#7aa04a'], med: ['#8a9a5a', '#a89a58', '#9a7ac8'], amazon: ['#2e7a34', '#3e8a3c'], borneo: ['#2e7a34', '#4a9a40'], kenya: ['#9a9a4a', '#b8a850'], prairie: ['#7a9a40', '#8aa84a'], japan: ['#3a7a38', '#e060a0'] }[biome.id]);

    // ---- per-visit variation (time of day, weather, relief)
    const OC = !!env.overcast;      // a grey, overcast day (the bog): no golden hour, no sun disc, soft light
    const golden = OC ? 0 : (rng.chance(0.3) ? rng.range(0.35, 1) : 0), hazy = OC ? rng.range(0.2, 0.45) : (rng.chance(0.3) ? rng.range(0.3, 0.9) : 0);
    const az = rng.range(0, 6.283), elev = golden ? rng.range(0.42, 0.66) : rng.range(0.85, 1.3);
    const sunDir = new V3(Math.cos(elev) * Math.cos(az), Math.sin(elev), Math.cos(elev) * Math.sin(az)).normalize();
    const warm = (hex, k) => mixHex(hex, '#ffb070', k * golden);
    const skyTop = mixHex(warm(env.sky[0], 0.3), '#b8c8d0', hazy * 0.5), skyHor = mixHex(warm(env.sky[1], 0.7), '#e8ecee', hazy * 0.5);
    const fogCol = mixHex(warm(env.fog[0], 0.6), '#d8e0e4', hazy * 0.6), fogDen = env.fog[1] * (1 + hazy * 0.8);
    const sunCol = warm(env.sun[0], 0.9);
    const AMP = env.amp * rng.range(0.7, 1.4), FREQ = env.freq * rng.range(0.8, 1.25);
    const scene = new THREE.Scene(); const fogC = new THREE.Color(fogCol);
    scene.background = fogC.clone(); scene.fog = new THREE.FogExp2(fogC, fogDen);
    const world = { biome, env, scene, seedStr, flowers: [], baits: [], colliders: [], R: PLAY_R, spawn: new V3(0, 0, 0), spawnYaw: 0, updaters: [], waters: [] };

    // ---- a frozen lava flow (raised, rugged crust) running down from the volcano: its course first, the crust is added to the relief
    let lava = null;
    const lSeg = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz, t = L > 0 ? clamp(((px - ax) * dx + (pz - az) * dz) / L) : 0; return [Math.hypot(px - (ax + dx * t), pz - (az + dz * t)), t]; };
    if (env.lava) {
      const a0 = rng.range(0, 6.283), a1 = a0 + Math.PI + rng.range(-0.9, 0.9), Rr = 88, S = new V3(Math.cos(a0) * Rr, 0, Math.sin(a0) * Rr), E = new V3(Math.cos(a1) * Rr, 0, Math.sin(a1) * Rr);
      const NP = 70, pts = [], amp = rng.range(10, 22), no = rng.range(0, 99), dir = E.clone().sub(S), len = dir.length(); dir.normalize(); const nrm = new V3(-dir.z, 0, dir.x), wL = rng.range(4.2, 6.0);
      for (let i = 0; i < NP; i++) { const t = i / (NP - 1), off = (tnoise.fbm(t * 2.4 + no, 5.1, 3) - 0.5) * 2 * amp * Math.sin(Math.PI * t) + Math.sin(t * 7 + no) * 2.5; const p = S.clone().addScaledVector(dir, len * t).addScaledVector(nrm, off); const dd = Math.hypot(p.x, p.z); if (dd < 24) { const k = 24 - dd; p.x += p.x / (dd || 1) * k; p.z += p.z / (dd || 1) * k; } pts.push({ x: p.x, z: p.z, w: wL * (0.8 + 0.4 * tnoise.at(t * 6 + no, 2.2)) }); }
      lava = { pts };
    }
    const lavaNear = (x, z) => { let bd = 1e9, bi = 0, bt = 0; for (let i = 0; i < lava.pts.length - 1; i++) { const A = lava.pts[i], B = lava.pts[i + 1], sd = lSeg(x, z, A.x, A.z, B.x, B.z); if (sd[0] < bd) { bd = sd[0]; bi = i; bt = sd[1]; } } const A = lava.pts[bi], B = lava.pts[bi + 1]; return [bd, bi + bt, lerp(A.w, B.w, bt)]; };
    const reserve = [];          // ground kept free for landmarks planned in advance (the bog's boardwalk and peat cutting, the bridges)
    // ---- the highlands of northern Vietnam: two gorges (each crossed by a rope bridge between two mountains), peaks, rice terraces
    const hl = env.highland ? (() => {
      const sites = [], a0 = rng.range(0, 6.283);
      [a0, a0 + Math.PI + rng.range(-0.6, 0.6)].forEach(a => {
        const cr = 33 + rng.range(-1.5, 1.5), W = rng.range(6.5, 8.2);
        sites.push({ a, cx: Math.cos(a) * cr, cz: Math.sin(a) * cr, nx: Math.cos(a), nz: Math.sin(a), tx: -Math.sin(a), tz: Math.cos(a), W, Hs: 0, Lg: 54, weak: false, state: 'ok', t: 0, touched: false });
      });
      sites[0].weak = rng.chance(0.5); sites[1].weak = rng.chance(0.5); if (!sites[0].weak && !sites[1].weak) sites[rng.int(0, 1)].weak = true;
      const peaks = []; for (let tries = 0; tries < 80 && peaks.length < 4; tries++) { const a = rng.range(0, 6.283), d = rng.range(40, 50), x = Math.cos(a) * d, z = Math.sin(a) * d; if (sites.some(q => Math.abs((x - q.cx) * q.tx + (z - q.cz) * q.tz) < 30 && Math.abs((x - q.cx) * q.nx + (z - q.cz) * q.nz) < 22) || peaks.some(q => Math.hypot(q.x - x, q.z - z) < 22)) continue; peaks.push({ x, z, R: rng.range(9, 13), H: rng.range(7, 11) }); }
      return { sites, peaks };
    })() : null;
    const siteUV = (s, x, z) => [(x - s.cx) * s.nx + (z - s.cz) * s.nz, (x - s.cx) * s.tx + (z - s.cz) * s.tz];
    const gorgeInfo = (x, z) => { let g = 0, Hs = 0; if (hl) for (const s of hl.sites) { const [u, v] = siteUV(s, x, z), q = smooth(s.W + 2.0, s.W, Math.abs(u)) * smooth(s.Lg, s.Lg - 8, Math.abs(v)); if (q > g) { g = q; Hs = s.Hs; } } return [g, Hs]; };
    const gorgeAt = (x, z) => gorgeInfo(x, z)[0];
    const gorgeMargin = (x, z, m) => { for (let k = 0; k < 8; k++) { const a = k * 0.7854; if (gorgeAt(x + Math.cos(a) * m, z + Math.sin(a) * m) > 0.02) return true; } return false; };
    const terraceMask = (x, z, r) => smooth(0.5, 0.62, noise.fbm(x * 0.022 + 7, z * 0.022 + 3, 2)) * smooth(14, 19, r) * smooth(39, 33, r);
    // ---- base relief
    const hlNat = (x, z) => {
      const r = Math.hypot(x, z), ridge = noise.fbm(x * 0.028 + 31, z * 0.028 + 17, 4);
      let h = (noise.fbm(x * FREQ + 11, z * FREQ + 5, 4) - 0.5) * 2 * AMP * smooth(4, 14, r);
      h += smooth(15, 42, r) * (11 + 7 * ridge) + smooth(44, 66, r) * (7 + 5 * noise.fbm(x * 0.035 + 3, z * 0.035 + 9, 3));
      for (const p of hl.peaks) { const d = Math.hypot(x - p.x, z - p.z); if (d < p.R) h += p.H * 0.5 * (1 + Math.cos(Math.PI * d / p.R)); }
      const tm = terraceMask(x, z, r); if (tm > 0.001) { const st = 1.15, t = h / st, fl = Math.floor(t); h = lerp(h, (fl + smooth(0.45, 1, t - fl)) * st, tm * 0.92); }      // rice terraces: flat steps with rounded risers
      return h;
    };
    if (hl) for (const s of hl.sites) { s.Hin = hlNat(s.cx - s.nx * (s.W + 3.5), s.cz - s.nz * (s.W + 3.5)); s.Hout = hlNat(s.cx + s.nx * (s.W + 3.5), s.cz + s.nz * (s.W + 3.5)); s.Hs = (s.Hin + s.Hout) / 2; }      // each end of a bridge rests on the natural height of its own side: the deck slopes, nothing is cut into the mountain
    const hlH = (x, z) => {
      const r = Math.hypot(x, z); let h = hlNat(x, z);
      for (const s of hl.sites) {
        const [u, v] = siteUV(s, x, z), au = Math.abs(u), av = Math.abs(v);
        const wp = smooth(s.W + 1.5, s.W + 2.6, au) * smooth(s.W + 17, s.W + 4.5, au) * smooth(8.5, 3.5, av); if (wp > 0) h = lerp(h, u < 0 ? s.Hin : s.Hout, wp);        // the landing pads at both ends of the bridge
        const g = smooth(s.W + 2.0, s.W, au) * smooth(s.Lg, s.Lg - 8, av); if (g > 0) h = lerp(h, Math.min(s.Hin, s.Hout) - 17.5 + (noise.at(x * 0.4, z * 0.4) - 0.5) * 1.2 + noise.at(x * 0.09 + 4, z * 0.09) * 1.5, g);   // the gorge
      }
      return h + Math.pow(clamp((r - 56) / 30), 2) * (AMP * 2.6 + 12);
    };
    const baseH = (x, z) => {
      if (hl) return hlH(x, z);
      let h = (noise.fbm(x * FREQ + 11, z * FREQ + 5, 4) - 0.5) * 2 * AMP;
      const r = Math.hypot(x, z);
      h *= smooth(5, 16, r);
      h += Math.pow(clamp((r - 56) / 30), 2) * (AMP * 2.6 + 5) * (0.75 + 0.5 * noise.at(x * 0.05 + 40, z * 0.05 + 7));
      if (lava) { const [dc, al, ww] = lavaNear(x, z); if (dc < ww * 1.9) h += smooth(ww * 1.9, ww * 0.7, dc) * (0.55 + Math.sin(al * 2.4 + noise.at(x * 0.15, z * 0.15) * 5) * 0.14 + (noise.at(x * 0.8, z * 0.8) - 0.5) * 0.4); }       // the crust of the lava flow: raised, with ropy ridges across the flow
      if (env.bog) { const hm = noise.at(x * 0.55 + 7, z * 0.55 + 3), rg = Math.sin((x * 0.8 + z * 0.6) * 0.16 + noise.at(x * 0.03, z * 0.03) * 6); h += (Math.max(0, hm - 0.5) * 1.1 + rg * 0.16) * smooth(5, 12, r); }   // sphagnum lawn: low hummocks and long ridge/hollow stripes
      return h;
    };
    const N1 = SEG + 1; const H = new Float32Array(N1 * N1);
    for (let iz = 0; iz < N1; iz++) for (let ix = 0; ix < N1; ix++) H[iz * N1 + ix] = baseH(-HALF + ix * CELL, -HALF + iz * CELL);

    // ---- water features (procedural placement + carved channels so water always sits in the ground)
    const waters = world.waters;
    const segDist = (px, pz, ax, az, bx, bz) => { const dx = bx - ax, dz = bz - az; const L = dx * dx + dz * dz; const t = L > 0 ? clamp(((px - ax) * dx + (pz - az) * dz) / L) : 0; const qx = ax + dx * t, qz = az + dz * t; return [Math.hypot(px - qx, pz - qz), t]; };
    function makePond() {
      for (let tries = 0; tries < 30; tries++) {
        const a = rng.range(0, 6.28), d = rng.range(24, 44), r = rng.range(3.8, 6.2); const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (waters.some(w => w.kind === 'pond' && Math.hypot(w.x - x, w.z - z) < 30)) continue;
        let lvl = 1e9; for (let k = 0; k < 16; k++) { const aa = k / 16 * 6.283; lvl = Math.min(lvl, baseH(x + Math.cos(aa) * r * 2.6, z + Math.sin(aa) * r * 2.6)); }
        lvl = Math.min(lvl, baseH(x, z)) + 0.02; waters.push({ kind: 'pond', x, z, r, level: lvl }); return;
      }
    }
    function makeRiver(kind) {
      const wBase = kind === 'river' ? rng.range(3.2, 4.6) : rng.range(1.7, 2.6);
      const a0 = rng.range(0, 6.283); const a1 = a0 + Math.PI + rng.range(-0.7, 0.7); const Rr = 86;
      const S = new V3(Math.cos(a0) * Rr, 0, Math.sin(a0) * Rr), E = new V3(Math.cos(a1) * Rr, 0, Math.sin(a1) * Rr);
      const NP = 130; const pts = []; const amp = rng.range(14, 26), no = rng.range(0, 99);
      const dir = E.clone().sub(S); const len = dir.length(); dir.normalize(); const nrm = new V3(-dir.z, 0, dir.x);
      for (let i = 0; i < NP; i++) {
        const t = i / (NP - 1);
        const off = (tnoise.fbm(t * 2.6 + no, 3.3, 3) - 0.5) * 2 * amp * Math.sin(Math.PI * t) + Math.sin(t * 9 + no) * 3;
        const p = S.clone().addScaledVector(dir, len * t).addScaledVector(nrm, off);
        const dd = Math.hypot(p.x, p.z); if (dd < 22) { const k = (22 - dd); p.x += p.x / (dd || 1) * k; p.z += p.z / (dd || 1) * k; }
        pts.push({ x: p.x, z: p.z, w: wBase * (0.85 + 0.35 * tnoise.at(t * 8 + no, 1.7)) });
      }
      if (baseH(pts[0].x, pts[0].z) < baseH(pts[NP - 1].x, pts[NP - 1].z)) pts.reverse();   // flow downhill
      let lv = pts.map(p => baseH(p.x, p.z) - 0.45);
      for (let it = 0; it < 3; it++) { const src = lv; lv = src.map((v, i) => { let s = 0, c = 0; for (let k = -6; k <= 6; k++) { s += src[clamp(i + k, 0, NP - 1) | 0]; c++; } return s / c; }); }
      for (let i = 1; i < NP; i++) lv[i] = Math.min(lv[i], lv[i - 1] - 0.004);
      pts.forEach((p, i) => { p.level = lv[i]; });
      waters.push({ kind: 'river', pts, w: wBase });
    }
    function makePools() {      // the open pools (mochazhiny) of a bog: many small round ponds
      const n = rng.int(7, 10);
      for (let i = 0, tries = 0; i < n && tries < 300; tries++) {
        const a = rng.range(0, 6.28), d = rng.range(9, 52), r = rng.range(2.0, 5.4), x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (waters.some(w => Math.hypot(w.x - x, w.z - z) < w.r + r + 7)) continue;
        let lvl = 1e9; for (let k = 0; k < 12; k++) { const aa = k / 12 * 6.283; lvl = Math.min(lvl, baseH(x + Math.cos(aa) * r * 1.8, z + Math.sin(aa) * r * 1.8)); }
        lvl = Math.min(lvl, baseH(x, z)) + 0.02; waters.push({ kind: 'pond', x, z, r, level: lvl }); i++;
      }
    }
    for (const k of env.water) { if (k === 'pond') makePond(); else if (k === 'pool') makePools(); else makeRiver(k); }

    // carve the beds & banks into the relief
    for (let iz = 0; iz < N1; iz++) for (let ix = 0; ix < N1; ix++) {
      const x = -HALF + ix * CELL, z = -HALF + iz * CELL; let h = H[iz * N1 + ix];
      for (const w of waters) {
        if (w.kind === 'pond') {
          const d = Math.hypot(x - w.x, z - w.z), r = w.r; if (d > r * 3.4) continue;
          if (d < r * 1.0) h = w.level - 0.12 - 0.8 * (1 - (d * d) / (r * r));
          else { const tgt = lerp(w.level + 0.16, h, smooth(r * 1.0, r * 3.4, d)); h = Math.max(tgt, w.level + 0.1 + 0.02 * (d - r)); }
        } else {
          let bd = 1e9, bi = 0, bt = 0;
          for (let i = 0; i < w.pts.length - 1; i++) { const A = w.pts[i], B = w.pts[i + 1]; const sd = segDist(x, z, A.x, A.z, B.x, B.z); if (sd[0] < bd) { bd = sd[0]; bi = i; bt = sd[1]; } }
          const A = w.pts[bi], B = w.pts[bi + 1]; const lvl = lerp(A.level, B.level, bt), ww = lerp(A.w, B.w, bt);
          if (bd > ww * 5.5) continue;
          h = lerp(h, lvl + 0.6, 0.85 * smooth(ww * 5.5, ww * 1.6, bd));          // flatten the valley floor
          if (bd < ww) h = lvl - 0.1 - 0.55 * (1 - (bd * bd) / (ww * ww));
          else { const tgt = lerp(lvl + 0.15, h, smooth(ww, ww * 3.0, bd)); h = Math.max(tgt, lvl + 0.1); }
        }
      }
      H[iz * N1 + ix] = h;
    }
    const heightAt = (x, z) => {
      const fx = (x + HALF) / CELL, fz = (z + HALF) / CELL;
      const ix = clamp(Math.floor(fx), 0, SEG - 1), iz = clamp(Math.floor(fz), 0, SEG - 1), tx = clamp(fx - ix), tz = clamp(fz - iz);
      return lerp(lerp(H[iz * N1 + ix], H[iz * N1 + ix + 1], tx), lerp(H[(iz + 1) * N1 + ix], H[(iz + 1) * N1 + ix + 1], tx), tz);
    };
    world.heightAt = heightAt;
    let LDG = null; if (lava) { LDG = new Float32Array(N1 * N1); for (let iz = 0; iz < N1; iz++) for (let ix = 0; ix < N1; ix++) { const [dc, , ww] = lavaNear(-HALF + ix * CELL, -HALF + iz * CELL); LDG[iz * N1 + ix] = dc - ww; } }
    const ld = (x, z) => LDG ? LDG[clamp(Math.round((z + HALF) / CELL), 0, SEG) * N1 + clamp(Math.round((x + HALF) / CELL), 0, SEG)] : 99;
    world.ld = ld; world.lava = lava;
    const slopeAt = (x, z) => Math.hypot(heightAt(x + 1, z) - heightAt(x - 1, z), heightAt(x, z + 1) - heightAt(x, z - 1)) / 2;
    world.slopeAt = slopeAt; world.groundAt = heightAt; world.flyH = heightAt;

    // signed-distance grid to the water edge (1 m cells): negative inside water
    const SD = new Float32Array(N1 * N1).fill(999);
    for (const w of waters) {
      if (w.kind === 'pond') { for (let iz = 0; iz < N1; iz++) for (let ix = 0; ix < N1; ix++) { const d = Math.hypot(-HALF + ix * CELL - w.x, -HALF + iz * CELL - w.z) - w.r * 1.08; if (d < SD[iz * N1 + ix]) SD[iz * N1 + ix] = d; } }
      else {
        for (let i = 0; i < w.pts.length - 1; i++) {
          const A = w.pts[i], B = w.pts[i + 1]; const ix0 = clamp(Math.floor((Math.min(A.x, B.x) - 14 + HALF) / CELL), 0, SEG), ix1 = clamp(Math.ceil((Math.max(A.x, B.x) + 14 + HALF) / CELL), 0, SEG);
          const iz0 = clamp(Math.floor((Math.min(A.z, B.z) - 14 + HALF) / CELL), 0, SEG), iz1 = clamp(Math.ceil((Math.max(A.z, B.z) + 14 + HALF) / CELL), 0, SEG);
          for (let iz = iz0; iz <= iz1; iz++) for (let ix = ix0; ix <= ix1; ix++) { const sd = segDist(-HALF + ix * CELL, -HALF + iz * CELL, A.x, A.z, B.x, B.z); const d = sd[0] - lerp(A.w, B.w, sd[1]) * 1.05; if (d < SD[iz * N1 + ix]) SD[iz * N1 + ix] = d; }
        }
      }
    }
    const sdf = (x, z) => { const ix = clamp(Math.round((x + HALF) / CELL), 0, SEG), iz = clamp(Math.round((z + HALF) / CELL), 0, SEG); return SD[iz * N1 + ix]; };
    const inWater = (x, z, m = 0) => sdf(x, z) < m;
    world.inWater = inWater; world.sdf = sdf;

    // ---- terrain mesh
    const tg = new THREE.PlaneGeometry(SIZE, SIZE, SEG, SEG); tg.rotateX(-Math.PI / 2);
    const tp = tg.attributes.position; const colArr = new Float32Array(tp.count * 3); const gc = env.ground.map(hex2rgb); const rockc = hex2rgb(env.rock);
    const sandc = hex2rgb(env.sand ? '#dcc890' : env.shoreCol ? env.shoreCol[0] : '#a89868'); const mudc = hex2rgb(env.shoreCol ? env.shoreCol[1] : '#5a4630'); const litter = hex2rgb('#5a4228'); const mossc = hex2rgb('#4a8a4a');
    const mixc = (a, b, t) => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
    for (let i = 0; i < tp.count; i++) {
      const x = tp.getX(i), z = tp.getZ(i); tp.setY(i, H[i]);
      const n = noise.fbm(x * 0.07 + 3, z * 0.07 + 9, 3), n2 = noise.at(x * 0.4, z * 0.4);
      let c = n < 0.45 ? mixc(gc[0], gc[1], n / 0.45) : mixc(gc[1], gc[2], (n - 0.45) / 0.55);
      if (env.litter && n2 > 0.45) c = mixc(c, litter, 0.55);
      if (env.moss && n2 > 0.5) c = mixc(c, mossc, 0.4);
      if (LDG) { const l0 = LDG[i]; if (l0 < 4) c = mixc(c, hex2rgb('#2e2c2a'), smooth(4, 0.6, l0) * 0.45); if (l0 < 0.8) { const st = Math.sin(((x * 0.7 + z * 0.4) * 1.9) + n2 * 6) * 0.5 + 0.5; c = mixc(c, hex2rgb(n2 > 0.66 ? '#5a3428' : n2 > 0.5 ? '#403834' : n2 > 0.28 ? '#2c2825' : '#181514'), smooth(0.8, -0.4, l0) * (0.9 + st * 0.08)); if (l0 > -0.3 && l0 < 0.8 && n2 > 0.7) c = mixc(c, hex2rgb('#4a6a36'), 0.5); } }      // black crust with rusty patches
      if (env.bog) { const hv = noise.fbm(x * 0.11 + 20, z * 0.11 + 8, 3), hr = noise.at(x * 0.23 + 50, z * 0.23 + 30), red = smooth(0.6, 0.74, hv); c = mixc(c, hex2rgb('#8a4a30'), red * 0.5); c = mixc(c, hex2rgb('#8e8a44'), smooth(0.5, 0.62, hr) * 0.4 * (1 - red)); c = mixc(c, hex2rgb('#3e3220'), smooth(0.4, 0.3, hv) * 0.6); }   // red / yellow sphagnum, brown peat moss, bare dark peat
      const sl = slopeAt(x, z);
      if (env.slopeRock && sl > (env.rockSlope || 0.55)) c = mixc(c, rockc, clamp((sl - (env.rockSlope || 0.55)) * 2.2)); else if (sl > 0.9) c = mixc(c, rockc, clamp((sl - 0.9) * 1.5));
      if (hl) { const r = Math.hypot(x, z), tm = terraceMask(x, z, r), [g] = gorgeInfo(x, z);
        if (tm > 0.2) { if (sl < 0.5) c = mixc(c, hex2rgb(n2 > 0.62 ? '#d4bc58' : n2 > 0.3 ? '#9cc84e' : '#78b044'), tm * 0.85); else c = mixc(c, hex2rgb('#6c5a3a'), tm * 0.75); }
        if (g > 0.05) c = mixc(c, hex2rgb(n2 > 0.55 ? '#3e4a3a' : '#5a5e50'), clamp(g * 0.9 + (sl > 1.2 ? 0.3 : 0))); else if (H[i] > 24) c = mixc(c, hex2rgb('#b4b2a6'), clamp((H[i] - 24) / 8) * 0.6); }
      const sd = SD[i]; if (sd < 3.2) { c = mixc(c, sandc, smooth(3.2, 0.2, sd) * (env.sand ? 0.95 : 0.55)); if (sd < 0.3) c = mixc(c, mudc, smooth(0.3, -1, sd) * 0.8); }
      const k = 0.92 + n2 * 0.16; colArr[i * 3] = c[0] / 255 * k; colArr[i * 3 + 1] = c[1] / 255 * k; colArr[i * 3 + 2] = c[2] / 255 * k;
    }
    tg.setAttribute('color', new THREE.BufferAttribute(colArr, 3)); tg.computeVertexNormals();
    const gtex = groundTex(rng); gtex.repeat.set(SIZE / 2.4, SIZE / 2.4);
    const terrain = new THREE.Mesh(tg, new THREE.MeshLambertMaterial({ map: gtex, vertexColors: true }));
    terrain.receiveShadow = true; scene.add(terrain);


    // ---- bridges across the gorges (highlands): a plank deck on ropes; a worn one may snap under the player, who then falls into the gorge
    if (hl) {
      const bmat = c => new THREE.MeshLambertMaterial({ color: c });
      for (const b of hl.sites) {
        const brng = new Rng(seed ^ Math.floor(b.a * 1000) ^ (b.weak ? 0x1234 : 0x4321)), Lh = b.W + 3.8, hw = 0.88; b.Lh = Lh; b.hw = hw; b.sag = b.weak ? 0.5 : 0.22; b.planks = []; b.ropes = [];
        const grp = new THREE.Group(); scene.add(grp); b.group = grp;
        b.deckBase = u => b.Hin + (b.Hout - b.Hin) * (u + Lh) / (2 * Lh); const deckY = u => b.deckBase(u) + 0.06 - b.sag * (1 - (u / Lh) * (u / Lh)), W3 = (u, v, y) => new V3(b.cx + b.nx * u + b.tx * v, y, b.cz + b.nz * u + b.tz * v);
        const woods = b.weak ? ['#6a5238', '#5a4630', '#7a6444', '#4a5236'] : ['#9a7a4a', '#a88858', '#8e6e42', '#a07e50'], wm = woods.map(bmat), ropeM = bmat(b.weak ? '#6a5a3c' : '#c4aa72'), postM = bmat('#4a3626');
        const plankG = new THREE.BoxGeometry(0.27, 0.07, 1.78), n = Math.floor(2 * Lh / 0.34), sp = 2 * Lh / n;
        for (let i = 0; i < n; i++) {
          const u = -Lh + (i + 0.5) * sp; if (b.weak && i > 1 && i < n - 2 && brng.chance(0.14)) continue;
          const m = new THREE.Mesh(plankG, wm[brng.int(0, wm.length - 1)]); m.castShadow = true; m.receiveShadow = true; const y0 = deckY(u) + 0.035, pos = W3(u, brng.range(-0.03, 0.03), y0);
          m.userData.noFloat = true; m.position.copy(pos); m.rotation.set(0, -b.a + brng.range(-0.04, 0.04), b.weak && brng.chance(0.25) ? brng.range(-0.12, 0.12) : 0, 'YXZ'); grp.add(m);
          if (b.weak && brng.chance(0.22)) m.scale.z = brng.range(0.5, 0.8);
          b.planks.push({ m, u, y0, vy: 0, vx: 0, sx: brng.range(-3, 3), sz: brng.range(-3, 3), delay: Math.abs(u) * 0.025 + brng.range(0, 0.25) });
        }
        const seg = (A, B, r0, r1, mat, tag, uMid) => { const l = limb(A, B, r0, r1, 4), m = new THREE.Mesh(l.g, mat); m.matrixAutoUpdate = false; m.userData.noFloat = true; m.matrix.copy(l.m); m.castShadow = true; grp.add(m); b.ropes.push({ m, u: uMid, tag }); return m; };
        const NS = 18;
        for (const sd of [-1, 1]) {
          for (let k = 0; k < NS; k++) {                                   // the hand rope and the rope under the deck edge
            const u0 = -Lh + 2 * Lh * k / NS, u1 = -Lh + 2 * Lh * (k + 1) / NS, um = (u0 + u1) / 2;
            const gap = b.weak && k > 2 && k < NS - 3 && brng.chance(0.14);
            if (!gap) seg(W3(u0, sd * 0.95, deckY(u0) + 1.05), W3(u1, sd * 0.95, deckY(u1) + 1.05), 0.032, 0.032, ropeM, 'hand', um);
            else { seg(W3(u0, sd * 0.95, deckY(u0) + 1.05), W3(u0 + 0.12, sd * 0.95, deckY(u0) + 0.45), 0.03, 0.012, ropeM, 'hand', um); seg(W3(u1, sd * 0.95, deckY(u1) + 1.05), W3(u1 - 0.12, sd * 0.95, deckY(u1) + 0.4), 0.03, 0.012, ropeM, 'hand', um); }
            seg(W3(u0, sd * 0.82, deckY(u0) - 0.03), W3(u1, sd * 0.82, deckY(u1) - 0.03), 0.05, 0.05, ropeM, 'edge', um);
            if (k > 0) seg(W3(u0, sd * 0.9, deckY(u0) + 0.04), W3(u0, sd * 0.95, deckY(u0) + 1.05), 0.016, 0.016, ropeM, 'vert', u0);
          }
          for (const e of [-1, 1]) { const u = e * (Lh - 0.2); seg(W3(u, sd * 0.95, b.deckBase(u) - 0.3), W3(u, sd * 0.95, b.deckBase(u) + 1.3), 0.1, 0.09, postM, 'post', u); }
        }
        for (const e of [-1, 1]) for (const sd of [-1, 1]) { const pos = W3(e * (Lh + 0.9), sd * 1.7, 0); const st = new THREE.Mesh(blobG(0.55, brng, 0.3, 1), bmat('#8a877c')); st.position.set(pos.x, heightAt(pos.x, pos.z) + 0.1, pos.z); st.scale.set(1, 0.7, 1); st.castShadow = true; scene.add(st); world.colliders.push({ x: pos.x, z: pos.z, r: 0.45 }); }
        if (b.weak) for (let i = 0; i < 5; i++) { const u = brng.range(-Lh + 2, Lh - 2), m = new THREE.Mesh(blobG(0.16, brng, 0.3, 0), bmat('#5a7a3a')); const pos = W3(u, brng.range(-0.6, 0.6), deckY(u) + 0.1); m.userData.noFloat = true; m.position.copy(pos); m.scale.set(1.4, 0.35, 1.2); grp.add(m); b.planks.push({ m, u, y0: pos.y, vy: 0, sx: 0, sz: 0, delay: Math.abs(u) * 0.025 }); }      // moss on the old planks
        for (let k = -Lh + 3; k < Lh - 2; k += 3) reserve.push({ x: b.cx + b.nx * k, z: b.cz + b.nz * k, r: 2.2 });
        for (const e of [-1, 1]) for (let k = Lh - 1; k < Lh + 17; k += 2.5) reserve.push({ x: b.cx + b.nx * e * k, z: b.cz + b.nz * e * k, r: 3.4 });      // the way off the bridge stays free of trees, rocks and spires
      }
      const deckAt = (x, z) => { for (const b of hl.sites) { if (b.state === 'fall' || b.state === 'gone') continue; const [u, v] = siteUV(b, x, z); if (Math.abs(v) < b.hw && Math.abs(u) < b.Lh) return b.deckBase(u) + 0.06 - b.sag * (1 - (u / b.Lh) * (u / b.Lh)); } return null; };
      world.bridges = hl.sites; world.events = []; world.pendingFall = null;
      world.groundAt = (x, z) => { const d = deckAt(x, z); return d !== null ? d : heightAt(x, z); };
      world.canWalk = (x, z) => deckAt(x, z) !== null || (gorgeAt(x, z) < 0.12 && slopeAt(x, z) < 1.7);
      world.deepMsg = 'Тут не пройти: обрыв. Ищите тропу или мост.';
      world.edgeMsg = 'Дальше — только скалы и туман.';
      world.inGorge = (x, z) => gorgeAt(x, z) > 0.05; world.siteUV = siteUV;
      world.flyH = (x, z) => { const h = heightAt(x, z), [g, Hs] = gorgeInfo(x, z); return g > 0 ? h + g * (Hs - h) : h; };      // butterflies glide across a gorge at the height of its rims
      world.moveK = (x, z, dx, dz) => { const l = Math.hypot(dx, dz); if (l < 1e-4) return 1; const gr = (world.groundAt(x + dx / l * 1.2, z + dz / l * 1.2) - world.groundAt(x, z)) / 1.2; return clamp(1 - 0.5 * gr, 0.42, 1.18); };    // climbing is slow, going down is quick
      hl.sites.forEach((b, i) => { b.i = i; });
      // a bridge that shakes or snaps for one player does so for everybody in the location: the local simulation is the same on every client, and the one who triggers it tells the others (Play sends the event)
      world.setBridge = (i, k, init) => {
        const b = hl.sites[i]; if (!b || b.state === 'gone' || b.state === 'fall') return;
        if (k === 'shake' && b.state === 'ok') { b.state = 'shake'; b.t = 0; b.remote = true; if (!init) world.events.push({ k: 'shake', b, i, remote: true }); }
        else if (k === 'snap') { b.state = 'fall'; b.t = init ? 99 : 0; b.remote = true; b.fallCheck = true; if (!init) world.events.push({ k: 'snap', b, i, remote: true }); }
      };
      world.updaters.push((dt, t, focus) => {
        for (const b of hl.sites) {
          const [u, v] = siteUV(b, focus.x, focus.z), onDeck = Math.abs(v) < b.hw + 0.2 && Math.abs(u) < b.Lh, on = Math.abs(v) < b.hw + 0.4 && Math.abs(u) < b.Lh && b.state !== 'fall' && b.state !== 'gone';
          if (b.fallCheck) { b.fallCheck = false; if (onDeck && b.t < 90) world.pendingFall = b; }          // another player's bridge snapped under my feet
          if (b.state === 'ok') {
            if (on && !b.touched) { b.touched = true; if (b.weak) world.events.push({ k: 'creak', b, i: b.i }); }
            if (b.weak && b.touched && on && Math.abs(u) < 1.2 && Math.abs(v) < b.hw) { b.state = 'shake'; b.t = 0; world.events.push({ k: 'shake', b, i: b.i }); }
          } else if (b.state === 'shake') {
            b.t += dt; for (const p of b.planks) p.m.position.y = p.y0 + Math.sin(t * 38 + p.u * 3) * 0.03 * Math.min(1, b.t * 2);
            if (b.t > 1.2) { b.state = 'fall'; b.t = 0; world.events.push({ k: 'snap', b, i: b.i, remote: !!b.remote }); if (onDeck) world.pendingFall = b; for (const q of b.planks) q.m.position.y = q.y0; }
          } else if (b.state === 'fall') {
            b.t += dt; for (const p of b.planks) { if (Math.abs(p.u) > b.Lh - 1.3 || b.t < p.delay) continue; p.vy -= 13 * dt; p.m.position.y += p.vy * dt; p.m.rotation.x += p.sx * dt; p.m.rotation.z += p.sz * dt; }
            for (const q of b.ropes) if (Math.abs(q.u) < b.Lh - 1.5 && (q.tag === 'hand' || q.tag === 'vert' || q.tag === 'edge') && b.t > 0.15 + Math.abs(q.u) * 0.03) q.m.visible = false;
            if (b.t > 3.2) { b.state = 'gone'; for (const p of b.planks) if (Math.abs(p.u) <= b.Lh - 1.3) p.m.visible = false; }
          }
        }
      });
      // ---- mountain mist: a milky layer in every gorge, soft banks drifting in the valleys
      const mistTex = canvasTex(32, 32, (x, w, h) => { const d = x.createImageData(w, h); for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const dx = (xx + 0.5) / w * 2 - 1, dy = (yy + 0.5) / h * 2 - 1, a = Math.max(0, 1 - Math.hypot(dx, dy)); const i = (yy * w + xx) * 4; d.data[i] = 244; d.data[i + 1] = 248; d.data[i + 2] = 252; d.data[i + 3] = Math.round(Math.pow(a, 0.8) * 255); } x.putImageData(d, 0, 0); });
      const mist = [], mrng = new Rng(seed ^ 0x3157);
      const addMist = (x, y, z, w, h, op) => { const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: mistTex, transparent: true, depthWrite: false, opacity: op, color: 0xffffff })); sp.position.set(x, y, z); sp.scale.set(w, h, 1); sp.userData = { x, z, ph: mrng.range(0, 6.28), sp: mrng.range(0.05, 0.12), amp: mrng.range(2, 5) }; scene.add(sp); mist.push(sp); };
      for (const b of hl.sites) { const fy = b.Hs - 17.5; for (let v = -b.Lg; v <= b.Lg; v += 6) for (let k = 0; k < 2; k++) { const p = new V3(b.cx + b.tx * v + b.nx * mrng.range(-3, 3), 0, b.cz + b.tz * v + b.nz * mrng.range(-3, 3)); if (Math.hypot(p.x, p.z) > 62) continue; addMist(p.x, fy + (k ? 11 : 6.5) + mrng.range(-1, 1), p.z, mrng.range(20, 30), mrng.range(7, 11), k ? 0.38 : 0.52); } }
      for (let i = 0; i < 30; i++) { const a = mrng.range(0, 6.28), d = mrng.range(14, 54), x = Math.cos(a) * d, z = Math.sin(a) * d; if (gorgeAt(x, z) > 0.1) continue; addMist(x, heightAt(x, z) + mrng.range(0.9, 2.8), z, mrng.range(16, 28), mrng.range(4, 8), mrng.range(0.2, 0.34)); }
      world.updaters.push((dt, t) => { for (const sp of mist) { const d = sp.userData; sp.position.x = d.x + Math.sin(t * d.sp + d.ph) * d.amp; sp.position.z = d.z + Math.cos(t * d.sp * 0.8 + d.ph) * d.amp * 0.7; } });
    }

    // ---- lights
    const hemi = new THREE.HemisphereLight(mixHex(env.hemi[0], '#ffd8b0', golden * 0.5), env.hemi[1], env.hemi[2] * (1 - golden * 0.12)); scene.add(hemi);
    const sun = new THREE.DirectionalLight(sunCol, env.sunI || (OC ? 0.5 : 1.05)); sun.castShadow = true; sun.shadow.mapSize.set(1536, 1536);
    const sc = sun.shadow.camera; sc.left = -34; sc.right = 34; sc.top = 34; sc.bottom = -34; sc.near = 1; sc.far = 220;
    sun.shadow.bias = -0.0006; sun.shadow.normalBias = 0.06; scene.add(sun, sun.target);
    world.sun = sun; world.sunDir = sunDir;
    const lightTint = new THREE.Color(sunCol).multiplyScalar(0.55).add(new THREE.Color(env.hemi[0]).multiplyScalar(0.55));

    // ---- sky dome + clouds
    const skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uTop: { value: new THREE.Color(skyTop) }, uHor: { value: new THREE.Color(skyHor) }, uSun: { value: sunDir.clone() }, uSunCol: { value: new THREE.Color(OC ? '#101416' : sunCol) } },
      vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
      fragmentShader: `uniform vec3 uTop; uniform vec3 uHor; uniform vec3 uSun; uniform vec3 uSunCol; varying vec3 vDir;
        void main(){ float h = clamp(vDir.y, 0.0, 1.0); vec3 c = mix(uHor, uTop, pow(h, 0.55));
          float s = max(dot(normalize(vDir), normalize(uSun)), 0.0);
          c += uSunCol * (pow(s, 380.0) * 1.2 + pow(s, 14.0) * 0.18);
          gl_FragColor = vec4(c, 1.0); }`,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(420, 24, 16), skyMat); sky.renderOrder = -10; scene.add(sky);
    const cloudTex = canvasTex(64, 24, (x, w, h) => {
      x.fillStyle = '#fff'; const r = new Rng(77);
      for (let i = 0; i < 9; i++) { const cx = 10 + r.range(0, 44), cy = 12 + r.range(-3, 3), rr = r.range(4, 9); for (let yy = -rr; yy <= rr; yy++) { const hw = Math.sqrt(Math.max(0, rr * rr - yy * yy)) * 1.5; x.fillRect(Math.round(cx - hw), Math.round(cy + yy * 0.6), Math.round(hw * 2), 1); } }
      const d = x.getImageData(0, 0, w, h);
      for (let i = 0; i < w * h; i++) { const yy = Math.floor(i / w); const shade = 255 - Math.max(0, (yy - 12)) * 6; d.data[i * 4] = shade; d.data[i * 4 + 1] = shade; d.data[i * 4 + 2] = Math.min(255, shade + 8); }
      x.putImageData(d, 0, 0);
    });
    const clouds = []; const nCl = Math.round(14 * env.clouds * (1 + hazy * 0.7));
    for (let i = 0; i < nCl; i++) {
      const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: cloudTex, transparent: true, fog: false, depthWrite: false, opacity: 0.92, color: OC ? 0x8f989e : golden ? 0xffd8c0 : 0xffffff }));
      const a = rng.range(0, 6.28), el = rng.range(0.18, 0.7);
      sp.position.set(Math.cos(a) * 330 * Math.cos(el), 330 * Math.sin(el) + 20, Math.sin(a) * 330 * Math.cos(el)); sp.scale.set(rng.range(70, 130) * (OC ? 1.6 : 1), rng.range(26, 46) * (OC ? 1.4 : 1), 1); sp.userData.a = a; sp.userData.el = el; sp.userData.sp = rng.range(0.002, 0.006);
      scene.add(sp); clouds.push(sp);
    }

    // ---- shafts of light that fall through the gaps of the canopy
    if (env.canopy) {
      const sTex = canvasTex(8, 64, (x, w, h) => { const d = x.createImageData(w, h); for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { const u = 1 - Math.abs(xx / (w - 1) * 2 - 1), v = yy / (h - 1), a = Math.pow(u, 1.4) * (0.25 + 0.75 * Math.sin(v * Math.PI)) * 255; const i = (yy * w + xx) * 4; d.data[i] = 255; d.data[i + 1] = 250; d.data[i + 2] = 200; d.data[i + 3] = a; } x.putImageData(d, 0, 0); });
      for (let i = 0; i < 8; i++) { const a = rng.range(0, 6.28), d = rng.range(8, 44), m = new THREE.Mesh(new THREE.PlaneGeometry(rng.range(2.4, 4.4), 34), new THREE.MeshBasicMaterial({ map: sTex, transparent: true, opacity: rng.range(0.1, 0.2), blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, fog: false })); m.position.set(Math.cos(a) * d, 15, Math.sin(a) * d); m.rotation.set(0.0, rng.range(0, 3.14), 0.22 * (rng.chance(0.5) ? 1 : -1)); scene.add(m); }
    }
    // ---- far mountains
    const [mc0, mc1, snow, hMin, hMax] = env.mount; const mparts = []; const mrng = new Rng(seed ^ 0x77);
    for (let i = 0; i < 46; i++) {
      const a = i / 46 * 6.283 + mrng.range(-0.05, 0.05), d = mrng.range(235, 300), h = mrng.range(hMin, hMax) * (snow ? 2.0 : 1.8), w = Math.min(h * mrng.range(0.6, 0.95), 62);
      const g = new THREE.ConeGeometry(w, h, 5 + mrng.int(0, 2), 3); g.translate(0, h / 2, 0); jitterGeo(g, w * 0.14, mrng);
      mparts.push({ g, m: M(Math.cos(a) * d, -6, Math.sin(a) * d, 0, mrng.range(0, 6)), c: [mc0, snow ? '#f2f6fa' : mc1, 0, h * (snow ? 0.95 : 1.0)], j: 0.07 });
    }
    const mg = merge(mparts, mrng);
    if (snow) { const p = mg.attributes.position, c = mg.attributes.color; for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > hMax * 0.9) { const t = smooth(hMax * 0.9, hMax * 1.6, y); c.setXYZ(i, lerp(c.getX(i), 0.96, t), lerp(c.getY(i), 0.97, t), lerp(c.getZ(i), 1.0, t)); } } }
    scene.add(new THREE.Mesh(mg, new THREE.MeshLambertMaterial({ vertexColors: true })));

    // ---- placement helpers ---------------------------------------------------
    const placed = []; const tox = rng.range(0, 99), toz = rng.range(0, 99);
    const tf = (x, z) => tnoise.fbm(x * 0.04 + tox, z * 0.04 + toz, 3);                    // tree-density field
    const bell = (v, c, w) => Math.exp(-Math.pow((v - c) / w, 2));
    const TH = env.tf;
    const FIELD = {
      uniform: () => 1,
      sparse: () => 0.5,
      grove: (x, z) => smooth(TH - 0.02, TH + 0.1, tf(x, z)) * 0.95 + 0.04,
      clearing: (x, z) => 1 - smooth(TH - 0.1, TH, tf(x, z)),
      edge: (x, z) => bell(tf(x, z), TH, 0.07) * 0.9 + 0.08,
      dense: (x, z) => 0.3 + 0.7 * smooth(TH - 0.18, TH - 0.02, tf(x, z)),
      riparian: (x, z) => { const d = sdf(x, z); return waters.length ? bell(d, 6, 4) * 0.95 + 0.02 : 0.4; },
      lava: (x, z) => LDG ? 0.08 + 0.92 * smooth(3.5, 0.2, ld(x, z)) : 0.3,
      upland: (x, z, y) => 0.12 + 0.88 * smooth(-0.5, 1.8, y + (tf(x, z) - 0.5) * 3),
    };
    const groups = {};
    function scatter(count, rad, minR, maxR, opts = {}) {
      const out = []; let tries = 0; const f = FIELD[opts.field || 'uniform'] || FIELD.uniform;
      while (out.length < count && tries++ < count * 90) {
        const a = rng.range(0, 6.2832), d = Math.sqrt(rng.range(minR * minR, maxR * maxR)); const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (d < (opts.clear === undefined ? 6 : opts.clear)) continue;
        if (inWater(x, z, opts.waterGap === undefined ? 1.4 : opts.waterGap)) continue;
        if (hl && (gorgeAt(x, z) > 0.02 || gorgeMargin(x, z, rad + 0.8))) continue;       // nothing stands with a part of it over the edge of a gorge
        const y = heightAt(x, z);
        if (!opts.anySlope && slopeAt(x, z) > (opts.maxSlope || 0.75)) continue;
        if (rng.next() > f(x, z, y)) continue;
        if (reserve.length && reserve.some(q => (q.x - x) ** 2 + (q.z - z) ** 2 < (q.r + 0.4) ** 2)) continue;
        if (LDG && !opts.onLava && ld(x, z) < 1.2) continue;
        if (opts.group) { const G = groups[opts.group] || (groups[opts.group] = []); if (G.some(q => (q[0] - x) ** 2 + (q[1] - z) ** 2 < opts.minSep * opts.minSep)) continue; }
        let ok = true; for (const p of placed) { const dd = (p.x - x) ** 2 + (p.z - z) ** 2; if (dd < (p.r + rad) ** 2) { ok = false; break; } }
        if (!ok) continue;
        out.push({ x, z, y }); placed.push({ x, z, r: rad }); if (opts.group) groups[opts.group].push([x, z]);
      }
      return out;
    }
    const plan = {};
    if (env.bog) {          // plan the boardwalk (a winding duckboard path) and the peat cutting first, so that no vegetation grows through them
      for (let tries = 0; tries < 40 && !plan.walk; tries++) {
        const a0 = rng.range(0, 6.28), d0 = rng.range(10, 30); let x = Math.cos(a0) * d0, z = Math.sin(a0) * d0, ang = rng.range(0, 6.28); const pts = [[x, z, ang]], n = rng.int(18, 26);
        for (let i = 0; i < n; i++) { ang += rng.range(-0.07, 0.07); const nx = x + Math.cos(ang), nz = z + Math.sin(ang); if (inWater(nx, nz, 1.2) || Math.hypot(nx, nz) > 50) break; x = nx; z = nz; pts.push([x, z, ang]); }
        if (pts.length >= 14) plan.walk = pts;
      }
      if (plan.walk) plan.walk.forEach((q, i) => { if (i % 2 === 0) reserve.push({ x: q[0], z: q[1], r: 1.6 }); });
      for (let tries = 0; tries < 60 && !plan.cut; tries++) { const a = rng.range(0, 6.28), d = rng.range(16, 40), x = Math.cos(a) * d, z = Math.sin(a) * d; if (inWater(x, z, 7) || reserve.some(q => Math.hypot(q.x - x, q.z - z) < 9)) continue; plan.cut = { x, z, ry: rng.range(0, 6.28) }; reserve.push({ x, z, r: 6.2 }); }
    }
    const treeMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
    function instanceAt(builderKey, pts, opts = {}) {
      if (!pts.length) return; const trng = new Rng(seed + strSeed(builderKey) + pts.length); const nv = opts.variants || 3;
      const variants = []; for (let i = 0; i < nv; i++) variants.push(TREES[builderKey](trng, env));
      const per = variants.map(() => []); pts.forEach((p, i) => per[i % nv].push(p));
      variants.forEach((v, vi) => {
        const list = per[vi]; if (!list.length) return; const im = new THREE.InstancedMesh(v.g, treeMat, list.length); const col = new THREE.Color();
        list.forEach((p, i) => {
          const s = trng.range(0.85, 1.25) * (opts.scale || 1);
          im.setMatrixAt(i, M(p.x, p.y - 0.1, p.z, 0, trng.range(0, 6.28), 0, s));
          const k = trng.range(0.9, 1.1); col.setRGB(k, k, k); im.setColorAt(i, col);
          if (v.rad > 0.2 && !opts.noCollide) world.colliders.push({ x: p.x, z: p.z, r: v.rad * s });
        });
        im.castShadow = !opts.noShadow; im.receiveShadow = true; im.frustumCulled = false; scene.add(im);
      });
    }
    const spacing = { bush: 0.5, rock: 0.5, giant: 2.4, dipt: 2.0, baobab: 3.2, crypto: 1.6, hummock: 1.3, tussock: 0.55, ledum: 0.7, cassandra: 0.6, dbirch: 0.7, ryam: 1.8, snag: 1.6, relic: 1.6, cycad: 0.9, pandan: 1.1, alocasia: 0.8, kesiya: 2.0, montoak: 2.6, treefern: 1.0, rhodo: 1.1, musa: 1.0, karst: 3.6, lavashard: 0.35, groundfern: 0.5, lavarock: 1.2 };
    function addTrees(type, count, opts = {}) { instanceAt(type, scatter(count, spacing[type] || 1.6, opts.minR || 6, opts.maxR || 56, opts), opts); }

    // vegetation recipe
    const lowOpts = { noShadow: true, noCollide: true }; const LOW_BOG = { lavashard: 1, groundfern: 1, hummock: 1, tussock: 1, ledum: 1, cassandra: 1, dbirch: 1, alocasia: 1 };
    for (const [type, n, field, vo] of env.veg) {
      if (field === 'orchard') { // rows of trees on terraces
        const nPatch = rng.int(2, 3);
        for (let pI = 0; pI < nPatch; pI++) {
          const a = rng.range(0, 6.28), d = rng.range(18, 40), cx = Math.cos(a) * d, cz = Math.sin(a) * d, rot = rng.range(0, 3.14), sp = rng.range(5.2, 7), pts = [];
          for (let i = -2; i <= 2; i++) for (let j = -2; j <= 2; j++) { const lx = i * sp + rng.range(-0.7, 0.7), lz = j * sp + rng.range(-0.7, 0.7); const x = cx + lx * Math.cos(rot) - lz * Math.sin(rot), z = cz + lx * Math.sin(rot) + lz * Math.cos(rot); if (Math.hypot(x, z) < 8 || Math.hypot(x, z) > 56 || inWater(x, z, 2) || slopeAt(x, z) > 0.6) continue; pts.push({ x, z, y: heightAt(x, z) }); placed.push({ x, z, r: 2 }); }
          instanceAt(type, pts, {});
        }
      } else if (field === 'avenue') { // a line of cypresses
        const a = rng.range(0, 6.28); let x = Math.cos(a) * rng.range(14, 24), z = Math.sin(a) * rng.range(14, 24), dir = rng.range(0, 6.28); const pts = [];
        for (let i = 0; i < n; i++) { dir += rng.range(-0.12, 0.12); x += Math.cos(dir) * 5.4; z += Math.sin(dir) * 5.4; if (Math.hypot(x, z) > 54 || Math.hypot(x, z) < 7 || inWater(x, z, 2)) break; for (const s of [-1, 1]) { const px = x + Math.cos(dir + 1.5708) * 2.1 * s, pz = z + Math.sin(dir + 1.5708) * 2.1 * s; pts.push({ x: px, z: pz, y: heightAt(px, pz) }); placed.push({ x: px, z: pz, r: 1.2 }); } }
        instanceAt(type, pts, {});
      } else addTrees(type, n, Object.assign({ field }, vo || {}, (type === 'bush' || LOW_BOG[type]) ? Object.assign({ minR: 4, anySlope: true }, lowOpts) : {}));
    }
    // rocks (+ big outcrops in the Alps, kopje in Kenya)
    instanceAt('rock', scatter(env.rocks, 1.2, 6, 56, { anySlope: true, field: env.slopeRock ? 'upland' : 'sparse' }), {});
    if (biome.id === 'alps') instanceAt('rock', scatter(10, 2.4, 20, 56, { anySlope: true }), { scale: 2.2, variants: 2 });
    if (env.lm.includes('kopje')) {
      const nK = rng.int(1, 2);
      for (let k = 0; k < nK; k++) { const c = scatter(1, 8, 24, 48, { waterGap: 4 })[0]; if (!c) continue; const pts = []; for (let i = 0; i < 9; i++) { const aa = rng.range(0, 6.28), dd = rng.range(0, 4.2); const px = c.x + Math.cos(aa) * dd, pz = c.z + Math.sin(aa) * dd; pts.push({ x: px, z: pz, y: heightAt(px, pz) + rng.range(0, 1.2) }); } instanceAt('rock', pts, { scale: rng.range(2.3, 3.6), variants: 3 }); }
    }

    // ---- landmarks (two picked at random per visit)
    const mat = c => new THREE.MeshLambertMaterial({ color: c }); const mWood = mat('#8a6a42'), mDark = mat('#5a4430'), mStone = mat('#9a9a92'), mRed = mat('#c83a22'), mBlk = mat('#22201e'), mMoss = mat('#5a7a3a'), mWhite = mat('#e8e0d0'), mRoof = mat('#8a3a2a');
    const addMesh = (m, x, y, z, ry = 0, shadow = true) => { m.position.set(x, y, z); m.rotation.y = ry; m.castShadow = shadow; m.receiveShadow = true; scene.add(m); return m; };
    const LM = {
      logs() { const c = scatter(1, 3, 12, 50, { waterGap: 3 })[0]; if (!c) return; const n = rng.int(1, 3); for (let i = 0; i < n; i++) { const x = c.x + rng.range(-2, 2), z = c.z + rng.range(-2, 2), y = heightAt(x, z), len = rng.range(2.6, 4.4), ry = rng.range(0, 3.14); const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.34, len, 7), mWood); m.rotation.z = Math.PI / 2; const mo = new THREE.Mesh(new THREE.CylinderGeometry(0.31, 0.35, len * 0.55, 6), mMoss); mo.rotation.z = Math.PI / 2; mo.position.y = 0.06; g.add(m, mo); g.position.set(x, y + 0.28, z); g.rotation.y = ry; g.traverse(o => { o.castShadow = true; }); scene.add(g); world.colliders.push({ x, z, r: 0.5 }); } },
      biglog() { const c = scatter(1, 4, 12, 46, { waterGap: 3 })[0]; if (!c) return; const len = rng.range(7, 11), ry = rng.range(0, 3.14), g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.85, len, 8), mDark); m.rotation.z = Math.PI / 2; const mo = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.87, len * 0.6, 8), mMoss); mo.rotation.z = Math.PI / 2; mo.position.y = 0.08; g.add(m, mo); g.position.set(c.x, heightAt(c.x, c.z) + 0.6, c.z); g.rotation.y = ry; g.traverse(o => { o.castShadow = true; }); scene.add(g); for (let i = -2; i <= 2; i++) world.colliders.push({ x: c.x + Math.cos(ry) * i * 1.6, z: c.z - Math.sin(ry) * i * 1.6, r: 0.8 }); },
      stumps() { scatter(5, 1, 8, 50, { waterGap: 3 }).forEach(c => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.36, 0.5, 7), mWood); addMesh(m, c.x, c.y + 0.22, c.z); world.colliders.push({ x: c.x, z: c.z, r: 0.4 }); }); },
      fence() { const c = scatter(1, 4, 14, 48, { waterGap: 3 })[0]; if (!c) return; const ry = rng.range(0, 3.14), n = rng.int(7, 12); for (let i = 0; i < n; i++) { const x = c.x + Math.cos(ry) * i * 2.2, z = c.z - Math.sin(ry) * i * 2.2; if (inWater(x, z, 1) || Math.hypot(x, z) > 56) continue; const y = heightAt(x, z); addMesh(new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.2, 0.16), mWood), x, y + 0.55, z); if (i < n - 1) { const x2 = x + Math.cos(ry) * 1.1, z2 = z - Math.sin(ry) * 1.1, y2 = heightAt(x2, z2); addMesh(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.08), mWood), x2, y2 + 0.95, z2, ry); addMesh(new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.1, 0.08), mWood), x2, y2 + 0.55, z2, ry); } } },
      chalet() {      // the old abandoned chalet (always present in the Alps): door towards the spawn point, a door spot the player can enter
        let c = scatter(1, 5, 20, 40, { waterGap: 4, maxSlope: 0.2 })[0] || scatter(1, 5, 20, 44, { waterGap: 4, maxSlope: 0.4 })[0]; if (!c) return;
        const ry = Math.atan2(-c.x, -c.z), built = Chalet.build(rng, { heightAt, cx: c.x, cy: c.y, cz: c.z, ry });
        built.mesh.position.set(c.x, c.y, c.z); built.mesh.rotation.y = ry; scene.add(built.mesh); const co = Math.cos(ry), si = Math.sin(ry);
        for (const lx of [-2.7, -0.9, 0.9, 2.7]) for (const lz of [-1.8, 0, 1.8]) world.colliders.push({ x: c.x + lx * co + lz * si, z: c.z - lx * si + lz * co, r: 1.3 });
        for (const lx of [-1.8, 1.8]) world.colliders.push({ x: c.x + lx * co + (built.D / 2 + 1.7) * si, z: c.z - lx * si + (built.D / 2 + 1.7) * co, r: 0.3 });
        const dl = built.door; world.door = { x: c.x + dl.lx * co + dl.lz * si, z: c.z - dl.lx * si + dl.lz * co, yaw: ry };
      },
      cairn() { const c = scatter(1, 2, 14, 50, { waterGap: 3 })[0]; if (!c) return; for (let i = 0; i < 5; i++) addMesh(new THREE.Mesh(new THREE.DodecahedronGeometry(0.6 - i * 0.09, 0), mStone), c.x + rng.range(-0.1, 0.1), c.y + 0.35 + i * 0.5, c.z + rng.range(-0.1, 0.1), rng.range(0, 6)); world.colliders.push({ x: c.x, z: c.z, r: 0.7 }); },
      boulders() { scatter(rng.int(3, 5), 2, 10, 50, { anySlope: true }).forEach(c => { const m = new THREE.Mesh(blobG(rng.range(1.0, 1.9), rng, 0.4, 1), mat(shadeHex(env.rock, rng.range(0.85, 1.1)))); addMesh(m, c.x, c.y + 0.5, c.z, rng.range(0, 6)); m.scale.y = 0.7; world.colliders.push({ x: c.x, z: c.z, r: 1.4 }); }); },
      ruin() { const c = scatter(1, 5, 16, 48, { waterGap: 4, maxSlope: 0.5 })[0]; if (!c) return; const nC = rng.int(4, 6); for (let i = 0; i < nC; i++) { const x = c.x + (i - nC / 2) * 1.9, z = c.z + rng.range(-0.3, 0.3), y = heightAt(x, z), h = rng.range(1.2, 3.4); addMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.4, h, 10), mWhite), x, y + h / 2, z); addMesh(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.2, 0.9), mWhite), x, y + h + 0.1, z); world.colliders.push({ x, z, r: 0.5 }); } for (let i = 0; i < 4; i++) { const bx = c.x + rng.range(-4, 4), bz = c.z + rng.range(-2, 2); addMesh(new THREE.Mesh(new THREE.BoxGeometry(rng.range(0.8, 1.6), 0.5, 0.7), mWhite), bx, heightAt(bx, bz) + 0.25, bz, rng.range(0, 6)); } },
      wall() { const c = scatter(1, 4, 14, 48, { waterGap: 3 })[0]; if (!c) return; const ry = rng.range(0, 3.14), n = rng.int(6, 10); for (let i = 0; i < n; i++) { const x = c.x + Math.cos(ry) * i * 1.4, z = c.z - Math.sin(ry) * i * 1.4; if (inWater(x, z, 1) || Math.hypot(x, z) > 56) continue; addMesh(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.7 + rng.range(0, 0.2), 0.6), mat(shadeHex('#b8b0a0', rng.range(0.9, 1.1)))), x, heightAt(x, z) + 0.35, z, ry); world.colliders.push({ x, z, r: 0.6 }); } },
      windmill() { const c = scatter(1, 5, 20, 46, { waterGap: 4, maxSlope: 0.4 })[0]; if (!c) return; const g = new THREE.Group(); for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const leg = limb(new V3(sx * 1.4, 0, sz * 1.4), new V3(sx * 0.5, 9, sz * 0.5), 0.14, 0.09, 5); const m = new THREE.Mesh(leg.g, mWood); m.applyMatrix4(leg.m); g.add(m); } const head = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.1, 1.8), mDark); head.position.y = 9.4; g.add(head); const hub = new THREE.Group(); hub.position.set(0, 9.4, 1.0); for (let i = 0; i < 8; i++) { const bl = new THREE.Mesh(new THREE.BoxGeometry(0.5, 2.8, 0.05), mWhite); bl.position.y = 1.7; const arm = new THREE.Group(); arm.rotation.z = i * Math.PI / 4; arm.add(bl); hub.add(arm); } g.add(hub); const tail = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.3, 1.6), mWhite); tail.position.set(0, 9.4, -1.7); g.add(tail); g.position.set(c.x, c.y, c.z); g.rotation.y = rng.range(0, 6.28); g.traverse(o => { o.castShadow = true; }); scene.add(g); world.colliders.push({ x: c.x, z: c.z, r: 1.7 }); world.updaters.push(dt => { hub.rotation.z += dt * 0.7; }); },
      torii() { const c = scatter(1, 4, 14, 44, { waterGap: 4, maxSlope: 0.45 })[0]; if (!c) return; const g = new THREE.Group(); for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.3, 5.4, 8), mRed); p.position.set(s * 2.1, 2.7, 0); g.add(p); } const top = new THREE.Mesh(new THREE.BoxGeometry(6.6, 0.42, 0.5), mBlk); top.position.y = 5.5; const top2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.3, 0.4), mRed); top2.position.y = 4.7; g.add(top, top2); const ry = rng.range(0, 6.28); g.position.set(c.x, c.y, c.z); g.rotation.y = ry; g.traverse(o => { o.castShadow = true; }); scene.add(g); for (const s of [-1, 1]) world.colliders.push({ x: c.x + Math.cos(ry) * 2.1 * s, z: c.z - Math.sin(ry) * 2.1 * s, r: 0.4 }); },
      lanterns() { const c = scatter(1, 4, 12, 46, { waterGap: 3 })[0]; if (!c) return; const ry = rng.range(0, 3.14), n = rng.int(3, 5); for (let i = 0; i < n; i++) { const x = c.x + Math.cos(ry) * i * 4.5, z = c.z - Math.sin(ry) * i * 4.5; if (inWater(x, z, 1.5) || Math.hypot(x, z) > 56) continue; const y = heightAt(x, z); const g = new THREE.Group(); const base = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.9, 6), mStone); base.position.y = 0.45; const box = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.6), mStone); box.position.y = 1.15; const roof = new THREE.Mesh(new THREE.ConeGeometry(0.62, 0.4, 4), mStone); roof.position.y = 1.6; roof.rotation.y = Math.PI / 4; const glow = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.26, 0.62), new THREE.MeshBasicMaterial({ color: '#ffd890' })); glow.position.y = 1.15; g.add(base, box, roof, glow); g.position.set(x, y, z); g.traverse(o => { o.castShadow = true; }); scene.add(g); world.colliders.push({ x, z, r: 0.5 }); } },
      boardwalk() {       // a duckboard path laid on log sleepers across the moss (the path of a nature reserve)
        if (!plan.walk) return; const parts = []; const pts = plan.walk; world.lmPos = Object.assign(world.lmPos || {}, { boardwalk: [pts[0][0], pts[0][1], pts[0][2]] });
        for (let i = 1; i < pts.length; i++) {
          const [px, pz, pa] = pts[i - 1], [nx, nz, ang] = pts[i], py = heightAt(px, pz) + 0.07, ny = heightAt(nx, nz) + 0.07;
          parts.push({ g: new THREE.BoxGeometry(0.24, 0.05, 1.15), m: M(nx, ny, nz, 0, -ang + Math.PI / 2 + rng.range(-0.04, 0.04), 0), c: ['#8a6a46', '#7a5a3a', '#94744c'][i % 3], j: 0.08 });
          for (const sd of [-0.42, 0.42]) { const ox = -Math.sin(ang) * sd, oz = Math.cos(ang) * sd; const L = limb(new V3(px + ox, py - 0.045, pz + oz), new V3(nx + ox, ny - 0.045, nz + oz), 0.07, 0.07, 6); parts.push({ g: L.g, m: L.m, c: '#5a4430', j: 0.08 }); }
        }
        const m = new THREE.Mesh(merge(parts, rng), treeMat); m.castShadow = false; m.receiveShadow = true; scene.add(m);
        const [sx, sz, sa] = pts[0], sp = new THREE.Group(); const post = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 1.3, 6), mWood); post.position.y = 0.65; const board = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.45, 0.04), mat('#4a6a44')); board.position.set(0, 1.15, 0.05); sp.add(post, board);
        addMesh(sp, sx - Math.sin(sa) * 0.9, heightAt(sx, sz), sz + Math.cos(sa) * 0.9, -sa, true);    // a trail sign at the start
      },
      peatcut() {         // an old peat cutting: a wet dark trench in the moss
        if (!plan.cut) return; const c = plan.cut; c.y = heightAt(c.x, c.z); world.lmPos = Object.assign(world.lmPos || {}, { peatcut: [c.x, c.z] }); const ry = c.ry;
        const trench = new THREE.Mesh(new THREE.PlaneGeometry(6.5, 2.2).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#2a2016' })); addMesh(trench, c.x, heightAt(c.x, c.z) + 0.05, c.z, -ry, false);
      },
      lavaflow() {        // columnar basalt: a cluster of hexagonal columns of cooled lava standing at the edge of the flow, moss and ferns on their tops
        if (!lava) return; const idx = rng.int(14, lava.pts.length - 14), P = lava.pts[idx], Q = lava.pts[idx + 1], ang = Math.atan2(Q.z - P.z, Q.x - P.x) + Math.PI / 2, off = P.w * 1.3; const cx = P.x + Math.cos(ang) * off, cz = P.z + Math.sin(ang) * off;
        world.lmPos = Object.assign(world.lmPos || {}, { lavatube: [cx, cz] }); const parts = [];
        for (let i = 0; i < 30; i++) {
          const a = rng.range(0, 6.28), d = Math.sqrt(rng.next()) * 3.4, x = cx + Math.cos(a) * d, z = cz + Math.sin(a) * d, y0 = heightAt(x, z), h = Math.max(0.5, (3.4 - d) * rng.range(0.6, 1.0) + rng.range(0.3, 1.1)), r0 = rng.range(0.34, 0.55);
          if (inWater(x, z, 0.5)) continue; const tilt = rng.range(-0.06, 0.06), tz = rng.range(-0.06, 0.06);
          parts.push({ g: new THREE.CylinderGeometry(r0 * 0.96, r0, h + 0.6, 6), m: M(x, y0 + h / 2 - 0.3, z, tilt, rng.range(0, 1), tz), c: ['#201c1a', '#4a423b', y0 - 0.3, y0 + h], j: 0.1 });
          parts.push({ g: new THREE.CylinderGeometry(r0 * 0.9, r0 * 0.96, 0.08, 6), m: M(x, y0 + h + 0.02 + Math.sin(tilt) * r0, z, tilt, 0.3, tz), c: rng.chance(0.55) ? '#3a5a2e' : '#5a4a3e', j: 0.1 });     // the top: moss or bare rock
          if (rng.chance(0.4)) for (let f = 0; f < 4; f++) parts.push({ g: frondG(rng.range(0.5, 0.9), 0.2, rng.range(0.3, 0.6), 4), m: M(x, y0 + h + 0.06, z, 0, f / 4 * 6.28, rng.range(0.4, 0.8)), c: ['#2e7a36', '#58b04a', 0, 1], j: 0.1 });
          world.colliders.push({ x, z, r: r0 * 1.05 });
        }
        const m = new THREE.Mesh(merge(parts, rng), treeMat); m.castShadow = true; m.receiveShadow = true; scene.add(m);
      },
      stones() { const wt = waters.find(w => w.kind === 'river'); if (!wt) return; for (let k = 0; k < 14; k++) { const p = wt.pts[rng.int(8, wt.pts.length - 9)]; addMesh(new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.46, 0.16, 7), mStone), p.x + rng.range(-0.6, 0.6), p.level + 0.03, p.z + rng.range(-0.6, 0.6), rng.range(0, 6), false); } },
    };
    const pool = (env.lm || []).filter(k => LM[k]); const picks = []; if (biome.id === 'alps' && pool.includes('chalet')) picks.push(pool.splice(pool.indexOf('chalet'), 1)[0]);
    if (biome.id === 'papua' && pool.includes('lavaflow')) picks.push(pool.splice(pool.indexOf('lavaflow'), 1)[0]);
    while (picks.length < 2 && pool.length) picks.push(pool.splice(rng.int(0, pool.length - 1), 1)[0]);
    picks.forEach(k => { try { LM[k](); } catch (e) { console.warn('landmark failed', k, e); } });
    world.landmarks = picks;

    // ---- grass, flowers, reeds (instanced crossed quads, custom shader)
    const grassGeo = (() => {
      const g = new THREE.BufferGeometry(); const p = [], uv = [], ix = [];
      for (let q = 0; q < 2; q++) { const a = q * Math.PI / 2, cx = Math.cos(a) * 0.5, cz = Math.sin(a) * 0.5; const b = q * 4; p.push(-cx, 0, -cz, cx, 0, cz, -cx, 1, -cz, cx, 1, cz); uv.push(0, 0, 1, 0, 0, 1, 1, 1); ix.push(b, b + 1, b + 2, b + 1, b + 3, b + 2); }
      g.setAttribute('position', new THREE.Float32BufferAttribute(p, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(ix); return g;
    })();
    const shared = { uTime: { value: 0 }, uWind: { value: biome.id === 'amazon' || biome.id === 'borneo' ? 0.35 : biome.id === 'bog' ? 0.55 : 1.0 }, uFog: { value: fogC }, uFogD: { value: fogDen }, uLight: { value: lightTint.clone() }, uCenter: { value: new THREE.Color('#ffd23c') } };
    const foliageMat = (map, flower, n) => new THREE.ShaderMaterial({ vertexShader: FOLIAGE_VS, fragmentShader: FOLIAGE_FS, side: THREE.DoubleSide, uniforms: Object.assign({}, shared, { uMap: { value: map }, uFlower: { value: flower ? 1 : 0 }, uAtlasN: { value: n } }) });
    const withKind = (geo, arr) => { const g = geo.clone(); g.setAttribute('aKind', new THREE.InstancedBufferAttribute(arr, 1)); return g; };
    const gAtlas = grassAtlas(rng);
    {
      const gcols = env.grass.col.map(c => new THREE.Color(c)); const n = env.grass.n;
      const im = new THREE.InstancedMesh(grassGeo, foliageMat(gAtlas, false, 1), n); let cnt = 0, tries = 0; const c = new THREE.Color();
      while (cnt < n && tries++ < n * 3) {
        const a = rng.range(0, 6.28), d = Math.sqrt(rng.range(0, PLAY_R * PLAY_R * 1.1)); const x = Math.cos(a) * d, z = Math.sin(a) * d;
        if (inWater(x, z, 0.6)) continue; if (LDG && ld(x, z) < 0.5 && rng.chance(0.93)) continue; if (env.slopeRock && slopeAt(x, z) > (env.rockSlope || 0.7) && rng.chance(0.8)) continue; if (hl && gorgeAt(x, z) > 0.04) continue;
        const s = rng.range(env.grass.h[0], env.grass.h[1]) * (0.8 + 0.4 * (1 - tf(x, z))); const w = rng.range(0.55, 1.0) * (0.6 + s * 0.6);
        im.setMatrixAt(cnt, M(x, heightAt(x, z) - 0.05, z, 0, rng.range(0, 3.14), 0, w, s, w));
        c.copy(rng.pick(gcols)).lerp(rng.pick(gcols), rng.next()); im.setColorAt(cnt, c); cnt++;
      }
      im.count = cnt; im.geometry = withKind(grassGeo, new Float32Array(n)); im.frustumCulled = false; scene.add(im); world.grassMesh = im;
    }
    if (waters.length) { // reeds / cattails along the shore
      const nR = 700; const im = new THREE.InstancedMesh(grassGeo, foliageMat(gAtlas, false, 1), nR); let cnt = 0, tries = 0; const c = new THREE.Color();
      while (cnt < nR && tries++ < nR * 40) {
        const a = rng.range(0, 6.28), d = Math.sqrt(rng.range(0, PLAY_R * PLAY_R)); const x = Math.cos(a) * d, z = Math.sin(a) * d; const sd = sdf(x, z);
        if (sd < -0.1 || sd > 1.6 || rng.next() > 0.9 - sd * 0.4) continue;
        const s = rng.range(1.1, 1.9), w = rng.range(0.7, 1.1); im.setMatrixAt(cnt, M(x, heightAt(x, z) - 0.05, z, 0, rng.range(0, 3.14), 0, w, s, w)); c.set(rng.pick(['#6a7a38', '#7a8a40', '#58702e'])); im.setColorAt(cnt, c); cnt++;
      }
      im.count = cnt; im.geometry = withKind(grassGeo, new Float32Array(nR)); im.frustumCulled = false; scene.add(im);
    }
    {
      // flower meadows: biased to clearings, shores and the area around the spawn
      const patches = []; const np = 24;
      const wantPatch = (x, z) => { const t = tf(x, z); let w = 0.35 + 0.65 * (1 - smooth(TH - 0.05, TH + 0.1, t)); if (sdf(x, z) < 14) w += 0.35; return w; };
      for (let i = 0, tries = 0; i < np && tries < 600; tries++) {
        let x, z; if (i < 3) { const a = rng.range(0, 6.28), d = rng.range(6, 15); x = Math.cos(a) * d; z = Math.sin(a) * d; } else { const a = rng.range(0, 6.28), d = Math.sqrt(rng.range(30, PLAY_R * PLAY_R * 0.8)); x = Math.cos(a) * d; z = Math.sin(a) * d; }
        if (inWater(x, z, 1.5) || rng.next() > wantPatch(x, z)) continue; patches.push({ x, z, r: rng.range(3, 7), f: rng.pick(env.flowers) }); i++;
      }
      if (!patches.length) patches.push({ x: 8, z: 4, r: 5, f: env.flowers[0] });
      const nF = biome.id === 'bog' ? 1500 : biome.id === 'papua' ? 1700 : 2800; const im = new THREE.InstancedMesh(grassGeo, foliageMat(flowerAtlas(), true, KINDS.length), nF); const kind = new Float32Array(nF); const c = new THREE.Color(); let cnt = 0, tries = 0;
      while (cnt < nF && tries++ < nF * 4) {
        let x, z, f;
        if (rng.chance(0.82)) { const p = rng.pick(patches); const a = rng.range(0, 6.28), d = Math.abs(rng.next() + rng.next() - 1) * p.r * 1.3; x = p.x + Math.cos(a) * d; z = p.z + Math.sin(a) * d; f = rng.chance(0.75) ? p.f : rng.pick(env.flowers); }
        else { const a = rng.range(0, 6.28), d = Math.sqrt(rng.range(4, PLAY_R * PLAY_R)); x = Math.cos(a) * d; z = Math.sin(a) * d; f = rng.pick(env.flowers); }
        if (Math.hypot(x, z) > PLAY_R || inWater(x, z, 0.8) || (LDG && ld(x, z) < 0.5) || (hl && gorgeAt(x, z) > 0.04)) continue;
        const sz = rng.range(0.5, 0.85) * (f[1] === 'spike' ? 1.5 : 1) * (biome.id === 'kenya' || biome.id === 'prairie' ? 1.4 : biome.id === 'bog' ? 0.72 : biome.id === 'papua' ? 0.8 : 1); const y = heightAt(x, z) - 0.04;
        im.setMatrixAt(cnt, M(x, y, z, 0, rng.range(0, 3.14), 0, sz, sz, sz)); c.set(f[0]).multiplyScalar(rng.range(0.9, 1.1)); im.setColorAt(cnt, c); kind[cnt] = KINDS.indexOf(f[1]);
        if (rng.chance(0.4)) world.flowers.push({ x, y: y + sz * 0.78, z, kind: f[1], size: sz, taken: false });
        cnt++;
      }
      im.count = cnt; im.geometry = withKind(grassGeo, kind); im.frustumCulled = false; scene.add(im);
      let best = null, bd = 1e9; patches.forEach(p => { const d = Math.hypot(p.x, p.z); if (d < bd && d > 4) { bd = d; best = p; } });
      world.spawnYaw = best ? Math.atan2(-best.x, -best.z) : rng.range(0, 6.28);   // first view: a flower meadow
    }

    // ---- water meshes (ponds as discs, rivers as ribbons) — every surface follows its own carved level
    const waterMat = new THREE.ShaderMaterial({
      transparent: true, side: THREE.DoubleSide, depthWrite: false, uniforms: { uTime: { value: 0 }, uCol: { value: new THREE.Color(env.waterCol) }, uFog: { value: fogC }, uFogD: { value: fogDen }, uSky: { value: new THREE.Color(OC ? mixHex(skyHor, '#3a3a30', 0.55) : skyHor) } },
      vertexShader: 'varying vec2 vP; varying float vD; void main(){ vP = position.xz; vec4 mv = modelViewMatrix * vec4(position,1.0); vD = -mv.z; gl_Position = projectionMatrix * mv; }',
      fragmentShader: `uniform float uTime; uniform vec3 uCol; uniform vec3 uFog; uniform float uFogD; uniform vec3 uSky; varying vec2 vP; varying float vD;
        void main(){ float w = sin(vP.x*3.1 + uTime*1.2) * sin(vP.y*2.7 - uTime*0.9) + sin((vP.x+vP.y)*5.0 + uTime*1.7)*0.5;
          float band = floor(w * 2.0 + 0.5) / 2.0; vec3 c = mix(uCol, uSky, 0.25 + 0.2 * band); c += step(0.92, w * 0.5 + 0.5) * 0.25;
          float f = 1.0 - exp(-uFogD*uFogD*vD*vD); gl_FragColor = vec4(mix(c, uFog, clamp(f,0.0,1.0)), 0.88); }`,
    });
    waters.forEach(w => {
      if (w.kind === 'pond') { const m = new THREE.Mesh(new THREE.CircleGeometry(w.r * 1.08, 28).rotateX(-Math.PI / 2), waterMat); m.position.set(w.x, w.level - 0.02, w.z); scene.add(m); }
      else {
        const P = [], I = []; const n = w.pts.length;
        for (let i = 0; i < n; i++) { const A = w.pts[Math.max(0, i - 1)], B = w.pts[Math.min(n - 1, i + 1)]; let tx = B.x - A.x, tz = B.z - A.z; const l = Math.hypot(tx, tz) || 1; tx /= l; tz /= l; const p = w.pts[i], hw = p.w * 1.05; P.push(p.x - tz * hw, p.level - 0.04, p.z + tx * hw, p.x + tz * hw, p.level - 0.04, p.z - tx * hw); if (i < n - 1) { const a = i * 2; I.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setIndex(I); scene.add(new THREE.Mesh(g, waterMat));
      }
    });

    // ---- bait spots (salt licks, fallen fruit, tree sap)
    function addBait(type, x, z) {
      const y = heightAt(x, z);
      if (type === 'salt') {
        const m = new THREE.Mesh(new THREE.CircleGeometry(1.1, 10).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#cdb98a' })); m.position.set(x, y + 0.05, z); m.receiveShadow = true; scene.add(m);
        const r2 = new Rng(Math.floor(x * 31 + z * 7)); for (let i = 0; i < 12; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.04, 0.07), new THREE.MeshLambertMaterial({ color: '#f2ecd8' })); const sx = x + r2.range(-0.9, 0.9), sz = z + r2.range(-0.9, 0.9); s.position.set(sx, heightAt(sx, sz) + 0.08, sz); scene.add(s); }
      } else if (type === 'fruit') {
        const cols = ['#e8802a', '#d8c030', '#b8402a', '#e8a838'];
        for (let i = 0; i < 6; i++) { const s = new THREE.Mesh(new THREE.IcosahedronGeometry(0.17, 0), new THREE.MeshLambertMaterial({ color: cols[i % 4] })); const sx = x + Math.cos(i * 1.1) * 0.35, sz = z + Math.sin(i * 1.1) * 0.35; s.position.set(sx, heightAt(sx, sz) + 0.13 + (i > 3 ? 0.18 : 0), sz); s.castShadow = true; scene.add(s); }
      } else if (type === 'sap') {
        const s = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.4, 1.0, 7), new THREE.MeshLambertMaterial({ color: '#5a4030' })); s.position.set(x, y + 0.45, z); s.castShadow = true; scene.add(s);
        const wet = new THREE.Mesh(new THREE.CircleGeometry(0.24, 8), new THREE.MeshLambertMaterial({ color: '#d8a838' })); wet.position.set(x, y + 0.96, z); wet.rotation.x = -Math.PI / 2; scene.add(wet);
      }
      world.baits.push({ x, y: y + 0.42, z, type });
    }
    if (env.bait) {
      const types = Array.isArray(env.bait) ? env.bait : [env.bait]; const spots = scatter(6, 2.0, 8, 44, { clear: 7 });
      spots.forEach((s, i) => addBait(types[i % types.length], s.x, s.z));
      if (env.sand) waters.forEach(w => { const p = w.kind === 'pond' ? w : w.pts[Math.floor(w.pts.length * 0.5)]; for (let i = 0; i < 2; i++) { const a = rng.range(0, 6.28), rr = (w.kind === 'pond' ? w.r : p.w) + 2.2; const x = p.x + Math.cos(a) * rr, z = p.z + Math.sin(a) * rr; if (!inWater(x, z, 0.5) && Math.hypot(x, z) < 56) addBait('salt', x, z); } });
    }

    // ---- ambient particles
    const [pk, pc] = env.particles; const nP = 160; const pg = new THREE.BufferGeometry(); const pp = new Float32Array(nP * 3); const pr = new Rng(seed ^ 0x55); const pdata = [];
    for (let i = 0; i < nP; i++) pdata.push({ x: pr.range(-30, 30), y: pr.range(0.2, 9), z: pr.range(-30, 30), vx: pr.range(-0.3, 0.3), vy: pr.range(-0.1, 0.25), vz: pr.range(-0.3, 0.3), ph: pr.range(0, 6.28) });
    pg.setAttribute('position', new THREE.BufferAttribute(pp, 3));
    const points = new THREE.Points(pg, new THREE.PointsMaterial({ color: pc, size: pk === 'petals' ? 3 : 2, sizeAttenuation: false, fog: false, transparent: true, opacity: 0.9 })); points.frustumCulled = false; scene.add(points);
    world.updaters.push((dt, t, focus) => {
      const a = pg.attributes.position.array;
      for (let i = 0; i < nP; i++) {
        const d = pdata[i];
        if (pk === 'petals') { d.x += (d.vx * 0.6 + Math.sin(t * 0.7 + d.ph) * 0.4) * dt; d.y -= (0.35 + 0.1 * Math.sin(d.ph)) * dt; d.z += (d.vz * 0.6 + Math.cos(t * 0.6 + d.ph) * 0.3) * dt; if (d.y < 0.1) d.y = 9; }
        else if (pk === 'spores') { d.x += Math.sin(t * 0.5 + d.ph) * 0.15 * dt; d.y += (d.vy * 0.5) * dt; d.z += Math.cos(t * 0.45 + d.ph) * 0.15 * dt; if (d.y > 9) d.y = 0.3; }
        else if (pk === 'dust') { d.x += (0.9 + d.vx) * dt; d.y += Math.sin(t + d.ph) * 0.1 * dt; d.z += d.vz * dt; }
        else { d.x += (d.vx + Math.sin(t * 0.4 + d.ph) * 0.2) * dt; d.y += (d.vy * 0.5 + Math.sin(t * 0.8 + d.ph) * 0.15) * dt; d.z += (d.vz + Math.cos(t * 0.35 + d.ph) * 0.2) * dt; if (d.y > 9 || d.y < 0.1) d.vy = -d.vy; }
        const dx = d.x - focus.x, dz = d.z - focus.z; if (dx > 30) d.x -= 60; else if (dx < -30) d.x += 60; if (dz > 30) d.z -= 60; else if (dz < -30) d.z += 60;
        a[i * 3] = d.x; a[i * 3 + 1] = Math.max(d.y, 0.1) + heightAt(d.x, d.z); a[i * 3 + 2] = d.z;
      }
      pg.attributes.position.needsUpdate = true;
    });

    // ---- per-frame update
    world.update = (dt, t, focus) => {
      shared.uTime.value = t; waterMat.uniforms.uTime.value = t;
      sun.position.copy(focus).addScaledVector(sunDir, 90); sun.target.position.copy(focus); sun.target.updateMatrixWorld();
      sky.position.copy(focus);
      clouds.forEach(s => { s.userData.a += s.userData.sp * dt; const a = s.userData.a, el = s.userData.el; s.position.set(focus.x + Math.cos(a) * 330 * Math.cos(el), 330 * Math.sin(el) + 20, focus.z + Math.sin(a) * 330 * Math.cos(el)); });
      world.updaters.forEach(f => f(dt, t, focus));
    };
    world.dispose = () => { scene.traverse(o => { if (o.geometry) o.geometry.dispose(); }); };
    return world;
  }

  return { build, ENV, PLAY_R, randomSeed, TREES };
})();
