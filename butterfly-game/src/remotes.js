// A real butterfly net: the pole lies IN the plane of the hoop and ends at its rim; the bag hangs off the rim. Origin = the grip, pole along -z.
// the 3D model of a net (first person and the avatars of other players): pole, hoop, bag; the odd gear of the enthusiast changes it:
//  telescoping motorised handle, handle with a piston, shocker hoop with a copper coil and electrodes, rope bag soaked in pheromone, tungsten parts,
//  attachments on the pole (map screen, infrared emitter, autonomy servo) and the net cannon.   Returns { g, root, roll, setExt(k), setPiston(k), mats }
function mergeGeos(list) {
  let n = 0, ni = 0; for (const g of list) { n += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const P = new Float32Array(n * 3), N = new Float32Array(n * 3), I = []; let o = 0;
  for (const g of list) { P.set(g.attributes.position.array, o * 3); if (g.attributes.normal) N.set(g.attributes.normal.array, o * 3); if (g.index) for (let i = 0; i < g.index.count; i++) I.push(g.index.array[i] + o); else for (let i = 0; i < g.attributes.position.count; i++) I.push(i + o); o += g.attributes.position.count; }
  const m = new THREE.BufferGeometry(); m.setAttribute('position', new THREE.BufferAttribute(P, 3)); m.setAttribute('normal', new THREE.BufferAttribute(N, 3)); m.setIndex(I); return m;
}
// the autonomy module on the handle: a housing, a slotted steel plate with a toggle lever that flips between ON and OFF (mats.autoLever), two lamps (mats.autoOnLamp / autoOffLamp),
// four brass screws, a status LED (mats.autoLed), a cable loop
function autoSwitch3d(g, x, y, z, mats, dark, steel, brass) {
  const box = (w, h, d, m, px, py, pz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x + px, y + py, z + pz); g.add(o); return o; };
  box(0.08, 0.055, 0.135, dark, 0, 0, 0);                                       // the housing
  box(0.074, 0.005, 0.125, steel, 0, 0.03, 0);                                  // the plate on top
  box(0.018, 0.004, 0.085, new THREE.MeshBasicMaterial({ color: '#05080a' }), 0, 0.0335, 0);          // the slot the lever runs in
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.004, 6), brass); sc.position.set(x + sx * 0.032, y + 0.0335, z + sz * 0.054); g.add(sc); }
  const piv = new THREE.Group(); piv.position.set(x, y + 0.034, z); g.add(piv);
  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.0055, 0.034, 6), steel); stem.position.y = 0.017; piv.add(stem);
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.0115, 8, 6), new THREE.MeshLambertMaterial({ color: '#d84a30' })); knob.position.y = 0.037; piv.add(knob);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.0085, 0.0022, 4, 8), brass); ring.rotation.x = Math.PI / 2; ring.position.y = 0.011; piv.add(ring);
  piv.rotation.x = 0.6; mats.autoLever = piv;
  const onM = new THREE.MeshBasicMaterial({ color: '#1e3a24' }), offM = new THREE.MeshBasicMaterial({ color: '#ff4a3a' });
  const lo = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.005, 0.012), onM); lo.position.set(x - 0.026, y + 0.0345, z - 0.045); g.add(lo);          // the ON lamp (front)
  const lf = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.005, 0.012), offM); lf.position.set(x - 0.026, y + 0.0345, z + 0.045); g.add(lf);         // the OFF lamp (back)
  mats.autoOnLamp = onM; mats.autoOffLamp = offM;
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.0095, 6, 4), new THREE.MeshBasicMaterial({ color: '#c83a2a' })); led.position.set(x, y + 0.012, z - 0.072); g.add(led); mats.autoLed = led.material;
  const cab = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 4, 10, Math.PI), dark); cab.position.set(x, y - 0.03, z + 0.072); cab.rotation.z = Math.PI; g.add(cab);         // a cable loop at the back
}
function makeNetModel(cfg) {
  if (cfg && cfg.cannon) return makeCannonModel(cfg);
  const V = NetParts.vis(cfg), gads = (cfg && cfg.g) || [], mats = {};
  const g = new THREE.Group(); const wood = new THREE.MeshLambertMaterial({ color: V.handle }), dark = new THREE.MeshLambertMaterial({ color: V.grip }), metal = new THREE.MeshBasicMaterial({ color: V.hoop });
  const steel = new THREE.MeshLambertMaterial({ color: '#8a929e' }), brass = new THREE.MeshLambertMaterial({ color: '#c8a040' }), copper = new THREE.MeshLambertMaterial({ color: '#c8683a' });
  if (cfg && cfg.pv) V.len = 0.5;      // a short pole: the shop pictures show the hoop and the bag, not the whole length
  const POLE = 1.2 * V.len, R = 0.3 * V.R, BAG = 0.9 * V.bag;
  const root = new THREE.Group(); g.add(root); const roll = new THREE.Group(); root.add(roll);
  // ---- the pole (single, or three telescoping tubes with brass collars)
  const ext = { k: 1 }; let setPole;
  if (V.mech) {
    const segs = [0, 1, 2].map(i => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.03 - i * 0.0075, 0.03 - i * 0.0075, 1, 8), i % 2 ? steel : wood); m.rotation.x = Math.PI / 2; g.add(m); return m; });
    const collars = [0, 1].map(() => { const c = new THREE.Mesh(new THREE.TorusGeometry(0.034, 0.008, 5, 10), brass); g.add(c); return c; });
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 1, 5), steel); strut.rotation.x = Math.PI / 2; strut.position.y = 0.05; g.add(strut);        // a hydraulic strut along the tubes
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 1, 4), new THREE.MeshLambertMaterial({ color: '#c83a2a' })); cable.rotation.x = Math.PI / 2; cable.position.set(0.035, 0.02, 0); g.add(cable);
    setPole = k => { const L = POLE * k; segs.forEach((m, i) => { m.scale.y = L / 3 + 0.02; m.position.z = -(i + 0.5) * L / 3; }); collars.forEach((c, i) => { c.position.z = -(i + 1) * L / 3; }); strut.scale.y = L * 0.55; strut.position.z = -L * 0.32; cable.scale.y = L * 0.9; cable.position.z = -L * 0.5; root.position.z = -L - R; };
    // the motor box at the grip: vents, a cog, a warm LED
    const mb = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.075, 0.16), dark); mb.position.set(0, 0.062, -0.2); g.add(mb);
    for (let i = 0; i < 4; i++) { const v = new THREE.Mesh(new THREE.BoxGeometry(0.102, 0.008, 0.02), steel); v.position.set(0, 0.1, -0.14 - i * 0.03); g.add(v); }
    const cog = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.02, 10), brass); cog.rotation.z = Math.PI / 2; cog.position.set(0.06, 0.062, -0.2); g.add(cog); mats.cog = cog;
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.009, 6, 4), new THREE.MeshBasicMaterial({ color: '#ffa030' })); led.position.set(0, 0.104, -0.27); g.add(led); mats.mechLed = led.material;
  } else {
    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.016 * V.th, 0.021 * V.th, 1, 6), wood); pole.rotation.x = Math.PI / 2; g.add(pole);
    setPole = k => { const L = POLE * k; pole.scale.y = L; pole.position.z = -L / 2; root.position.z = -L - R; };
  }
  const grip = new THREE.Mesh(new THREE.CylinderGeometry(0.026, 0.026, 0.34, 6), dark); grip.rotation.x = Math.PI / 2; grip.position.z = -0.12; g.add(grip);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.032, 6, 5), dark); cap.position.z = 0.05; g.add(cap);
  // ---- the pneumatic piston handle: a steel housing with fins and a gauge, and a rod that slides out of its back
  let setPiston = () => {};
  if (V.piston) {
    const hz = -0.62, house = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 12), steel); house.rotation.x = Math.PI / 2; house.position.z = hz; g.add(house);
    for (let i = 0; i < 6; i++) { const fin = new THREE.Mesh(new THREE.TorusGeometry(0.052, 0.006, 4, 12), dark); fin.position.z = hz - 0.12 + i * 0.048; g.add(fin); }
    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.014, 12), brass); gauge.position.set(0, 0.062, hz); g.add(gauge); const face = new THREE.Mesh(new THREE.CircleGeometry(0.024, 12), new THREE.MeshBasicMaterial({ color: '#f2ecd8' })); face.rotation.x = -Math.PI / 2; face.position.set(0, 0.0705, hz); g.add(face);
    const needle = new THREE.Mesh(new THREE.BoxGeometry(0.003, 0.001, 0.02), new THREE.MeshBasicMaterial({ color: '#c83a2a' })); needle.position.set(0, 0.0712, hz); g.add(needle); mats.needle = needle;
    const rod = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.26, 8), new THREE.MeshLambertMaterial({ color: '#d8dee6' })); rod.rotation.x = Math.PI / 2; g.add(rod); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), dark); g.add(knob);
    const hose = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.006, 4, 10, Math.PI * 1.3), new THREE.MeshLambertMaterial({ color: '#2a2e34' })); hose.position.set(0.05, -0.03, hz + 0.05); hose.rotation.set(0.4, 0.9, 0); g.add(hose);
    setPiston = k => { rod.position.z = hz + 0.14 + 0.13 + k * 0.12; knob.position.z = rod.position.z + 0.14; needle.rotation.y = -0.9 + k * 1.8; }; setPiston(0);
  }
  // ---- the hoop (a plain ring, or the shocker: a copper coil, studs on the ring, a battery box with warning stripes)
  const torus = new THREE.TorusGeometry(R, 0.015 * V.hth, 5, 26); torus.rotateY(Math.PI / 2); roll.add(new THREE.Mesh(torus, metal));   // ring normal = +x
  if (V.shock) {
    const pts = [], turns = 46; for (let i = 0; i <= 320; i++) { const a = i / 320 * 6.2832, bb = a * turns, rr = R + Math.sin(bb) * 0.026; pts.push(new THREE.Vector3(Math.cos(bb) * 0.026, Math.cos(a) * rr, Math.sin(a) * rr)); }       // a copper wire wound round the ring
    roll.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 420, 0.0042, 4, true), copper));
    mats.stud = []; for (let i = 0; i < 8; i++) { const a = i / 8 * 6.2832, st = new THREE.Mesh(new THREE.ConeGeometry(0.014, 0.05, 5), brass); st.position.set(0, Math.cos(a) * (R + 0.03), Math.sin(a) * (R + 0.03)); st.rotation.x = a; roll.add(st); const tip = new THREE.Mesh(new THREE.SphereGeometry(0.008, 5, 4), new THREE.MeshBasicMaterial({ color: '#9ae8ff' })); tip.position.set(0, Math.cos(a) * (R + 0.062), Math.sin(a) * (R + 0.062)); roll.add(tip); mats.stud.push(tip.material); }
    const bat = new THREE.Mesh(new THREE.BoxGeometry(0.07, 0.05, 0.1), new THREE.MeshLambertMaterial({ color: '#e8c030' })); bat.position.set(0, -R - 0.045, 0); roll.add(bat);
    for (let i = 0; i < 3; i++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.072, 0.052, 0.012), new THREE.MeshLambertMaterial({ color: '#2a2a2a' })); st.position.set(0, -R - 0.045, -0.035 + i * 0.035); roll.add(st); }
  }
  // ---- the bag: translucent cone with wire, or soaked ropes (longitudinal cords, rings, glinting beads)
  const cone = new THREE.ConeGeometry(R, BAG, 16, 5, true); cone.rotateZ(-Math.PI / 2); cone.translate(BAG / 2, 0, 0);      // base on the ring, apex along +x
  const pos = cone.attributes.position; for (let i = 0; i < pos.count; i++) { const t = pos.getX(i) / BAG; pos.setY(i, pos.getY(i) - 0.16 * t * t * R * 2); }   // the bag sags a little
  cone.computeVertexNormals();
  roll.add(new THREE.Mesh(cone, new THREE.MeshBasicMaterial({ color: V.mesh, transparent: true, opacity: V.op, side: THREE.DoubleSide, depthWrite: false })));
  if (V.rope) {
    const at = (a, t) => new THREE.Vector3(t * BAG, Math.cos(a) * R * (1 - t) - 0.16 * t * t * R * 2, Math.sin(a) * R * (1 - t)), cords = [], beads = [];
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832, pts = []; for (let k = 0; k <= 8; k++) pts.push(at(a, k / 8 * 0.98)); cords.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 12, 0.0085, 4, false)); }
    for (const t of [0.25, 0.5, 0.75]) { const pts = []; for (let k = 0; k <= 24; k++) pts.push(at(k / 24 * 6.2832, t)); cords.push(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 32, 0.0075, 4, true)); }
    roll.add(new THREE.Mesh(mergeGeos(cords), new THREE.MeshLambertMaterial({ color: '#8a6a44' })));
    for (let i = 0; i < 16; i += 2) for (const t of [0.25, 0.5, 0.75]) { const bg = new THREE.SphereGeometry(0.014, 5, 4); const p = at(i / 16 * 6.2832, t); bg.translate(p.x, p.y, p.z); beads.push(bg); }
    const bm = new THREE.MeshBasicMaterial({ color: '#c890ff' }); roll.add(new THREE.Mesh(mergeGeos(beads), bm)); mats.beads = bm;
  } else roll.add(new THREE.Mesh(cone, new THREE.MeshBasicMaterial({ color: V.wire, wireframe: true, transparent: true, opacity: 0.85 })));
  // ---- attachments on the pole
  gads.forEach((id, i) => {
    const gz = -0.42 - i * 0.2;
    if (id === 'g_map') {          // a small CRT with a bracket: the map screen
      const cv = document.createElement('canvas'); cv.width = 24; cv.height = 18; const x = cv.getContext('2d'); x.fillStyle = '#10301c'; x.fillRect(0, 0, 24, 18); x.fillStyle = '#3ad870'; for (let k = 0; k < 20; k++) x.fillRect(2 + (k * 7) % 20, 2 + (k * 5) % 14, 2, 1); x.strokeStyle = '#7affa0'; x.strokeRect(5.5, 4.5, 13, 9);
      const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.068), new THREE.MeshBasicMaterial({ map: tex })); sc.position.set(0, 0.11, gz + 0.027);
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.09, 0.05), dark); box.position.set(0, 0.105, gz); const br = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.07, 0.03), steel); br.position.set(0, 0.04, gz);
      const ant = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.1, 4), steel); ant.position.set(0.045, 0.19, gz); ant.rotation.z = -0.3; g.add(box, sc, br, ant); mats.mapScreen = sc.material;       // the screen faces the player (+z)
    } else if (id === 'g_ir') {    // an infrared emitter: a barrel with cooling fins and a red lens
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.2, 10), dark); tube.rotation.x = Math.PI / 2; tube.position.set(0, 0.075, gz); g.add(tube);
      for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(new THREE.TorusGeometry(0.042, 0.005, 4, 10), steel); f.position.set(0, 0.075, gz + 0.06 - k * 0.04); g.add(f); }
      const lens = new THREE.Mesh(new THREE.CircleGeometry(0.03, 10), new THREE.MeshBasicMaterial({ color: '#ff3a20' })); lens.position.set(0, 0.075, gz - 0.101); lens.rotation.y = Math.PI; g.add(lens); mats.irLens = lens.material;
      const br = new THREE.Mesh(new THREE.BoxGeometry(0.014, 0.05, 0.03), steel); br.position.set(0, 0.03, gz); g.add(br);
    } else if (id === 'g_auto') {  // the autonomy module: a housing with a toggle lever on a slotted plate, ON / OFF lamps, screws, a status LED
      autoSwitch3d(g, 0.055, 0.0, gz, mats, dark, steel, brass);
    }
  });
  g.userData.mats = mats;
  const setExt = k => { ext.k = k; setPole(k); }; setExt(1);
  return { g, root, roll, setExt, setPiston, mats, R, POLE };
}

// the net cannon: a brass-and-steel gun with a flared muzzle that holds the folded net, a rope drum, a pressure tank with a gauge, a pistol grip.
function makeCannonModel(cfg) {
  const g = new THREE.Group(), mats = {}, gads = (cfg && cfg.g) || [];
  const steel = new THREE.MeshLambertMaterial({ color: '#7e8794' }), dark = new THREE.MeshLambertMaterial({ color: '#2a2e36' }), brass = new THREE.MeshLambertMaterial({ color: '#c8a040' }), wood = new THREE.MeshLambertMaterial({ color: '#7a5030' }), rope = new THREE.MeshLambertMaterial({ color: '#c8b078' }), red = new THREE.MeshLambertMaterial({ color: '#b83a2a' });
  const cyl = (r0, r1, L, mat, x, y, z) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r0, r1, L, 12), mat); m.rotation.x = Math.PI / 2; m.position.set(x, y, z); g.add(m); return m; };
  cyl(0.055, 0.06, 0.62, steel, 0, 0, -0.38);                                              // barrel
  for (const z of [-0.12, -0.3, -0.5, -0.68]) { const r = new THREE.Mesh(new THREE.TorusGeometry(0.063, 0.01, 5, 14), brass); r.position.z = z; g.add(r); }
  const mz = cyl(0.14, 0.06, 0.2, steel, 0, 0, -0.8); mz.userData.muzzle = 1;               // the flared muzzle
  const lip = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.012, 5, 18), brass); lip.position.z = -0.9; g.add(lip);
  const folded = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.05, 0.14, 12), new THREE.MeshLambertMaterial({ color: '#d8ecdc' })); folded.rotation.x = Math.PI / 2; folded.position.z = -0.83; g.add(folded);
  cyl(0.07, 0.07, 0.34, dark, 0, -0.01, -0.0);                                              // the breech block
  const grip = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, 0.07), wood); grip.position.set(0, -0.14, 0.02); grip.rotation.x = 0.25; g.add(grip);
  const guard = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.006, 4, 10, Math.PI), dark); guard.position.set(0, -0.07, -0.08); guard.rotation.set(0, Math.PI / 2, Math.PI); g.add(guard);
  const trig = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.04, 0.012), red); trig.position.set(0, -0.085, -0.06); g.add(trig);
  const stock = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.08, 0.2), wood); stock.position.set(0, -0.02, 0.2); g.add(stock);
  // the rope drum on top: a spool with rope turns
  const drum = new THREE.Group(); drum.position.set(0, 0.13, -0.28); g.add(drum); const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.16, 14), steel); sp.rotation.z = Math.PI / 2; drum.add(sp);
  for (let i = 0; i < 6; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(0.068, 0.012, 5, 14), rope); t.rotation.y = Math.PI / 2; t.position.x = -0.06 + i * 0.024; drum.add(t); }
  for (const sx of [-1, 1]) { const fl = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.012, 14), brass); fl.rotation.z = Math.PI / 2; fl.position.x = sx * 0.088; drum.add(fl); }
  const crank = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.012, 0.012), dark); crank.position.set(0.12, 0, 0); drum.add(crank); mats.drum = drum;
  // the pressure tank on the side with a gauge and a hose
  const tank = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.3, 12), red); tank.rotation.x = Math.PI / 2; tank.position.set(0.12, -0.03, -0.18); g.add(tank);
  for (const z of [-0.06, -0.3]) { const b = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.007, 4, 12), steel); b.position.set(0.12, -0.03, z); g.add(b); }
  const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.014, 12), brass); gauge.rotation.z = Math.PI / 2; gauge.position.set(0.178, -0.03, -0.18); g.add(gauge); const gf = new THREE.Mesh(new THREE.CircleGeometry(0.024, 12), new THREE.MeshBasicMaterial({ color: '#f2ecd8' })); gf.rotation.y = Math.PI / 2; gf.position.set(0.186, -0.03, -0.18); g.add(gf);
  const nd = new THREE.Mesh(new THREE.BoxGeometry(0.001, 0.02, 0.003), new THREE.MeshBasicMaterial({ color: '#c83a2a' })); nd.position.set(0.187, -0.03, -0.18); g.add(nd); mats.needle = nd;
  const hose = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.007, 4, 12, Math.PI), dark); hose.position.set(0.07, -0.03, -0.3); hose.rotation.set(0, 0, Math.PI * 0.5); g.add(hose);
  // sights
  const fs = new THREE.Mesh(new THREE.BoxGeometry(0.008, 0.03, 0.008), dark); fs.position.set(0, 0.09, -0.62); g.add(fs); const rs = new THREE.Mesh(new THREE.TorusGeometry(0.022, 0.004, 4, 10), dark); rs.position.set(0, 0.095, -0.05); g.add(rs);
  // glowing charge cells along the barrel (they light up when it is loaded)
  mats.cells = []; for (let i = 0; i < 4; i++) { const c = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.012, 0.05), new THREE.MeshBasicMaterial({ color: '#58d8ff' })); c.position.set(0.058, 0.0, -0.22 - i * 0.1); g.add(c); mats.cells.push(c.material); }
  // ---- more detail: cooling fins, a top rail with a scope, a bolt handle and an ammo window, the pump slide and a foregrip, the stock with a rubber pad, pipes, valves, net pleats and rim weights
  { const M = (c, o) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o)), rubber = M('#1a1c20'), chrome = M('#c8d0d8'), bk = (w, h, d, mat, x, y, z, rx = 0, ry = 0, rz = 0) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m; };
    for (let i = 0; i < 7; i++) { const f = new THREE.Mesh(new THREE.CylinderGeometry(0.074, 0.074, 0.008, 14), i % 2 ? steel : dark); f.rotation.x = Math.PI / 2; f.position.set(0, 0, -0.04 - i * 0.022); g.add(f); }                // cooling fins behind the breech
    for (const z of [-0.12, -0.3, -0.5, -0.68]) for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + 0.4, nut = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.01, 6), dark); nut.position.set(Math.cos(a) * 0.072, Math.sin(a) * 0.072, z + 0.012); nut.rotation.set(Math.sin(a) * 1.57, 0, -Math.cos(a) * 1.57); g.add(nut); }       // hex bolts on the brass rings
    bk(0.034, 0.012, 0.66, dark, 0, 0.066, -0.36); for (let i = 0; i < 14; i++) bk(0.036, 0.008, 0.012, steel, 0, 0.074, -0.06 - i * 0.045);                                // the top rail with its ribs
    { const sc = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.024, 0.2, 10), dark); sc.rotation.x = Math.PI / 2; sc.position.set(0, 0.105, -0.2); g.add(sc); for (const z of [-0.12, -0.28]) { const rg = new THREE.Mesh(new THREE.TorusGeometry(0.024, 0.005, 4, 10), brass); rg.position.set(0, 0.105, z); g.add(rg); } for (const [z, c, r] of [[-0.3, '#58d8ff', 0.017], [-0.1, '#ffe08a', 0.014]]) { const ln = new THREE.Mesh(new THREE.CircleGeometry(r, 10), new THREE.MeshBasicMaterial({ color: c })); ln.position.set(0, 0.105, z + (z < -0.2 ? -0.001 : 0.001)); ln.rotation.y = z < -0.2 ? Math.PI : 0; g.add(ln); } bk(0.012, 0.026, 0.02, dark, 0, 0.085, -0.2); }       // an optical scope on the rail
    { const eject = bk(0.062, 0.03, 0.09, dark, 0.045, 0.02, -0.06); void eject; const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.07, 6), chrome); bolt.rotation.z = Math.PI / 2; bolt.position.set(0.095, 0.03, -0.02); g.add(bolt); const knob = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), brass); knob.position.set(0.135, 0.03, -0.02); g.add(knob); }                  // the bolt handle
    { const win = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.022), new THREE.MeshBasicMaterial({ color: '#10343c' })); win.position.set(0.0705, 0.0, -0.12); win.rotation.y = Math.PI / 2; g.add(win); for (let i = 0; i < 4; i++) { const cl = new THREE.Mesh(new THREE.PlaneGeometry(0.018, 0.012), new THREE.MeshBasicMaterial({ color: '#58d8ff' })); cl.position.set(0.0712, 0.0, -0.085 - i * 0.025); cl.rotation.y = Math.PI / 2; g.add(cl); } }       // an ammo window
    { const slide = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.22, 10), wood); slide.rotation.x = Math.PI / 2; slide.position.set(0, -0.075, -0.5); g.add(slide); for (let i = 0; i < 6; i++) { const gr = new THREE.Mesh(new THREE.TorusGeometry(0.031, 0.003, 4, 10), dark); gr.position.set(0, -0.075, -0.42 - i * 0.032); g.add(gr); } for (const z of [-0.38, -0.62]) bk(0.016, 0.03, 0.016, steel, 0, -0.058, z);          // the pump slide
      const fg = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.017, 0.12, 8), rubber); fg.position.set(0, -0.13, -0.5); g.add(fg); bk(0.03, 0.012, 0.03, steel, 0, -0.095, -0.5); }                                                 // a vertical foregrip
    bk(0.052, 0.088, 0.02, rubber, 0, -0.025, 0.31); bk(0.054, 0.09, 0.006, brass, 0, -0.025, 0.322); bk(0.044, 0.02, 0.1, wood, 0, 0.03, 0.2); bk(0.05, 0.012, 0.06, steel, 0, -0.07, 0.12);                  // the stock: rubber pad, butt plate, cheek rest, a strut
    for (let i = 0; i < 5; i++) { const gr = new THREE.Mesh(new THREE.TorusGeometry(0.0335, 0.0025, 4, 8), dark); gr.position.set(0, -0.14, 0.03); gr.rotation.x = 0.25; gr.position.y = -0.1 - i * 0.03; gr.position.z = 0.01 + i * 0.0075; g.add(gr); }          // grooves on the grip
    bk(0.014, 0.02, 0.012, brass, 0.034, -0.065, -0.08);                                                                                                                                                   // the safety switch
    // the tank: warning stripes, a valve wheel, a pipe to the breech, brackets
    for (let i = 0; i < 5; i++) bk(0.002, 0.044, 0.02, i % 2 ? '#e8c040' : '#1a1c20', 0.1765 - 0.0, -0.03, -0.1 - i * 0.04, 0, 0, 0).material = M(i % 2 ? '#e8c040' : '#1a1c20');
    { const vw = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.004, 4, 12), brass); vw.position.set(0.12, 0.04, -0.06); vw.rotation.x = Math.PI / 2; g.add(vw); const vs = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.04, 5), steel); vs.position.set(0.12, 0.025, -0.06); g.add(vs); for (let k = 0; k < 3; k++) bk(0.036, 0.004, 0.004, brass, 0.12, 0.04, -0.06, 0, k * 1.05, 0); }
    { const pipe = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.007, 5, 12, Math.PI * 0.9), steel); pipe.position.set(0.075, -0.02, -0.06); pipe.rotation.set(0, Math.PI / 2, 0.3); g.add(pipe); }
    for (const z of [-0.05, -0.31]) bk(0.014, 0.014, 0.014, brass, 0.0, 0.0, 0.0).position.set(0.065, -0.03, z);
    // the muzzle: net pleats around the folded net, weights on the rim, a rope guide eyelet
    for (let k = 0; k < 8; k++) { const a = k * Math.PI / 4, pl = bk(0.01, 0.045, 0.1, M('#c8e0d0'), Math.cos(a) * 0.1, Math.sin(a) * 0.1, -0.86, 0, 0, a - Math.PI / 2); pl.rotation.x = 0; pl.rotation.order = 'ZYX'; pl.rotation.z = a + Math.PI / 2; }
    for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4, w = new THREE.Mesh(new THREE.SphereGeometry(0.014, 8, 6), brass); w.position.set(Math.cos(a) * 0.14, Math.sin(a) * 0.14, -0.9); g.add(w); }
    { const ey = new THREE.Mesh(new THREE.TorusGeometry(0.014, 0.004, 4, 10), brass); ey.position.set(0, 0.07, -0.74); g.add(ey); const ey2 = ey.clone(); ey2.position.set(0, 0.07, -0.4); g.add(ey2); const rp = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.36, 5), rope); rp.rotation.x = Math.PI / 2; rp.position.set(0, 0.07, -0.57); g.add(rp); const rp2 = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.2, 5), rope); rp2.rotation.x = Math.PI / 2 - 0.62; rp2.position.set(0, 0.095, -0.34); g.add(rp2); }       // the rope from the drum along the top to the muzzle
    bk(0.05, 0.012, 0.03, brass, 0, 0.03, -0.43).rotation.set(0, 0, 0);                                                                                                                                       // a maker's plate
  }
  const root = new THREE.Group(); root.position.set(0, 0, -0.92); g.add(root); const roll = new THREE.Group(); root.add(roll);
  // attachments on top / side
  gads.forEach((id, i) => {
    const gz = -0.5 - i * 0.12;
    if (id === 'g_map') { const box = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.08, 0.05), dark); box.position.set(-0.1, 0.07, gz); g.add(box); const sc = new THREE.Mesh(new THREE.PlaneGeometry(0.09, 0.062), new THREE.MeshBasicMaterial({ color: '#2ad060' })); sc.position.set(-0.1, 0.07, gz + 0.027); sc.scale.x = -1; g.add(sc); mats.mapScreen = sc.material; }
    else if (id === 'g_ir') { const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.18, 10), dark); tube.rotation.x = Math.PI / 2; tube.position.set(-0.11, 0.0, gz); g.add(tube); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.026, 10), new THREE.MeshBasicMaterial({ color: '#ff3a20' })); lens.position.set(-0.11, 0, gz - 0.091); lens.rotation.y = Math.PI; g.add(lens); mats.irLens = lens.material; }
    else if (id === 'g_auto') autoSwitch3d(g, -0.1, -0.06, gz, mats, dark, steel, brass);
  });
  g.userData.mats = mats;
  return { g, root, roll, setExt() {}, setPiston() {}, mats, R: 0.14, POLE: 0.9, cannon: true };
}

// ---------------------------------------------------------------- other players: simple pixel-style avatars with a name tag, net and flashlight
class Remotes {
  constructor(scene, opts = {}) { this.scene = scene; this.flash = !!opts.flash; this.av = {}; this.t = 0; }
  make(r) {
    const g = new THREE.Group(); let h = 0; for (const ch of r.name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const jacket = new THREE.Color().setHSL((h % 360) / 360, 0.55, 0.42), skin = '#e8c8a0';
    const lm = new THREE.MeshLambertMaterial({ color: '#2a2a34' }), jm = new THREE.MeshLambertMaterial({ color: jacket });
    const up = new THREE.Group(); g.add(up);   // everything above the hips (lowers when sitting down)
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.66, 8), jm); body.position.y = 1.03; up.add(body);
    const hips = new THREE.Group(); hips.position.y = 0.72; g.add(hips); const legs = [];
    for (const sx of [-0.1, 0.1]) { const th = new THREE.Group(); th.position.x = sx; hips.add(th); const t1 = new THREE.Mesh(new THREE.CylinderGeometry(0.085, 0.075, 0.38, 6), lm); t1.position.y = -0.19; th.add(t1); const sh = new THREE.Group(); sh.position.y = -0.38; th.add(sh); const t2 = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.06, 0.36, 6), lm); t2.position.y = -0.18; sh.add(t2); const ft = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.2), new THREE.MeshLambertMaterial({ color: '#1c1c22' })); ft.position.set(0, -0.37, -0.04); sh.add(ft); legs.push({ th, sh }); }
    const head = new THREE.Group(); head.position.y = 1.52; up.add(head);
    head.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 8, 6), new THREE.MeshLambertMaterial({ color: skin })));
    const hat = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.04, 10), new THREE.MeshLambertMaterial({ color: '#c8b070' })); hat.position.y = 0.12; head.add(hat);
    const crown = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.1, 10), new THREE.MeshLambertMaterial({ color: '#b09858' })); crown.position.y = 0.18; head.add(crown);
    const nose = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, 0.06), new THREE.MeshLambertMaterial({ color: '#d8a888' })); nose.position.set(0, -0.01, -0.17); head.add(nose);
    // the same net model as in the first-person view, held in the right hand (pole forward and up, bag hanging), with arms
    const net = this.mkNet(NetParts.parse(r.nt), up);
    const limb2 = (A, B, rad) => { const d = B.clone().sub(A), m = new THREE.Mesh(new THREE.CylinderGeometry(rad, rad * 0.85, d.length(), 6), jm); m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); up.add(m); return m; };
    limb2(new THREE.Vector3(-0.25, 1.27, 0), new THREE.Vector3(-0.3, 0.8, -0.04), 0.06); limb2(new THREE.Vector3(0.25, 1.27, 0), new THREE.Vector3(0.33, 1.02, -0.12), 0.06);
    for (const [hx, hy, hz] of [[-0.3, 0.78, -0.04], [0.33, 1.02, -0.12]]) { const hd = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 5), new THREE.MeshLambertMaterial({ color: skin })); hd.position.set(hx, hy, hz); up.add(hd); }
    let lens = null;                                  // the torch (only where the biome allows one) is held in the left hand; its lens glows while it is on
    if (this.flash) {
      const tb = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.03, 0.2, 6), new THREE.MeshLambertMaterial({ color: '#2a2a30' })); tb.rotation.x = Math.PI / 2; tb.position.set(-0.3, 0.78, -0.12); up.add(tb);
      lens = new THREE.Mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.02, 6), new THREE.MeshBasicMaterial({ color: '#ffe9a0' })); lens.rotation.x = Math.PI / 2; lens.position.set(-0.3, 0.78, -0.225); lens.visible = false; up.add(lens);
    }
    const cv = document.createElement('canvas'); const w = Math.max(24, T.width(r.name, 8) + 8); cv.width = w; cv.height = 12; const x = cv.getContext('2d'); x.imageSmoothingEnabled = false; x.fillStyle = 'rgba(8,16,14,0.7)'; x.fillRect(0, 0, w, 12); T.draw(x, r.name, w / 2, 2, { size: 8, align: 'c', color: '#f0f0dc' });
    const tex = new THREE.CanvasTexture(cv); tex.magFilter = tex.minFilter = THREE.NearestFilter; tex.generateMipmaps = false;
    const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: tex, transparent: true, fog: false, depthWrite: false })); sp.scale.set(w / 40, 12 / 40, 1); sp.position.y = 2.1; up.add(sp);
    let light = null; if (this.flash) { light = new THREE.SpotLight('#fff2d4', 2.2, 36, 0.46, 0.5, 1.05); light.position.set(-0.3, 0.8, -0.24); const tg = new THREE.Object3D(); tg.position.set(-0.3, 0.8, -6); up.add(light, tg); light.target = tg; }
    this.scene.add(g); return { g, up, hips, legs, head, net, nt: r.nt || '', light, lens, sitK: 0, lastPos: new THREE.Vector3() };
  }
  mkNet(cfg, up) { const nm = makeNetModel(cfg), net = nm.g; net.scale.setScalar(0.9); net.position.set(0.33, 1.02, -0.12); up.add(net); nm.roll.rotation.z = -Math.PI / 2; return net; }
  update(dt) {
    this.t += dt; const now = performance.now(), R = Net.remote;
    for (const id in R) {
      const r = R[id]; let a = this.av[id]; if (!a) a = this.av[id] = this.make(r);
      const alive = now - r.t < 4000 && r.t > 0; a.g.visible = alive;
      if (!alive) continue;
      const k = Math.min(1, dt * 12); a.g.position.x += (r.pos.x - a.g.position.x) * k; a.g.position.z += (r.pos.z - a.g.position.z) * k; a.g.position.y += (r.pos.y - 1.65 - a.g.position.y) * k;
      let dy = r.yaw - a.g.rotation.y; dy = Math.atan2(Math.sin(dy), Math.cos(dy)); a.g.rotation.y += dy * k; a.head.rotation.x = clamp(r.pitch, -1, 1) * 0.8;
      if ((r.nt || '') !== a.nt) { a.up.remove(a.net); a.net = this.mkNet(NetParts.parse(r.nt), a.up); a.nt = r.nt || ''; }     // the player changed the net (in the cabinet)
      const sw = r.swinging ? 1 : 0; a.swv = (a.swv || 0) + (sw - (a.swv || 0)) * Math.min(1, dt * 14); const v = a.swv;
      a.net.rotation.set(0.5 - v * 0.7 + Math.sin(this.t * 2 + id) * 0.015, -0.12 + v * 0.8, v * 0.3, 'YXZ');
      // legs: walking swing, or sitting down on the chair (r.sit = 0..1, sent by the player)
      const stT = clamp(r.sit || 0, 0, 1); a.sitK += (stT - a.sitK) * Math.min(1, dt * 10); const sk = a.sitK, e = sk * sk * (3 - 2 * sk);
      const walk = Math.min(1, (r.speedNow || 0) / 2.5) * (1 - e); a.ph = (a.ph || 0) + dt * (2 + (r.speedNow || 0) * 1.6) * walk;
      a.up.position.y = -0.17 * e; a.hips.position.y = 0.72 - 0.17 * e;
      a.legs.forEach((L, i) => { const sw = Math.sin(a.ph * 2 + i * Math.PI) * 0.6 * walk; L.th.rotation.x = sw + e * (Math.PI / 2 - sw); L.sh.rotation.x = -e * Math.PI / 2 + Math.max(0, -sw) * 0.7 * (1 - e); });
      a.up.rotation.x = e * 0.12;
      if (a.lens) a.lens.visible = !!r.flashOn;
      if (a.light) { a.light.visible = r.flashOn; a.light.intensity = r.flashOn ? 2.2 : 0; }
    }
    for (const id in this.av) if (!R[id]) { this.scene.remove(this.av[id].g); delete this.av[id]; }
  }
  dispose() { for (const id in this.av) this.scene.remove(this.av[id].g); this.av = {}; }
}
