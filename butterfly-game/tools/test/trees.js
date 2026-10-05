// tree gallery: every tree type side by side on flat ground
(() => new Promise(r => setTimeout(() => {
  F0W.overlay = null; F0W.screen = 'play'; const p = F0W.play; p.draw = () => {}; p.update = () => {}; p.netGroup.visible = false; p.flies.forEach(f => { f.mesh.visible = false; f.shadow.visible = false; });
  const sc = new THREE.Scene(); sc.background = new THREE.Color('#bcd8ec'); sc.add(new THREE.HemisphereLight('#dfefff', '#6a7a50', 0.9)); const sun = new THREE.DirectionalLight('#fff4dc', 1.0); sun.position.set(30, 60, 20); sc.add(sun);
  const gnd = new THREE.Mesh(new THREE.PlaneGeometry(400, 400).rotateX(-Math.PI / 2), new THREE.MeshLambertMaterial({ color: '#7a9a50' })); sc.add(gnd);
  const keys = (window.__keys || ['birch', 'spruce', 'larch', 'cypress', 'olive', 'arbutus', 'giant', 'dipt']);
  const env = World.ENV.russia; env._bush = ['#5a9a38'];
  const treeMat = new THREE.MeshLambertMaterial({ vertexColors: true, side: THREE.DoubleSide });
  keys.forEach((k, i) => { const rr = new Rng(i + 5); const t = World.TREES[k](rr, env); const m = new THREE.Mesh(t.g, treeMat); const big = (k === 'giant' || k === 'dipt'); m.position.set((i - (keys.length - 1) / 2) * (big ? 14 : 8), 0, 0); if (big) m.scale.setScalar(0.45); sc.add(m); });
  const cam = new THREE.PerspectiveCamera(46, 16 / 9, 0.1, 500); cam.position.set(0, 7, 38); cam.lookAt(0, 6, 0);
  p.scene = sc; p.camera = cam;
  setTimeout(() => r(keys), 300);
}, 1500)))()
