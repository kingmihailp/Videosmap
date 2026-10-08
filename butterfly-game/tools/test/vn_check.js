// the Vietnam highlands: the terrain can be climbed from the spawn, the far sides of the gorges are reachable only over the bridges,
// worn bridges snap and drop the player into the gorge (he is thrown out to the map), sound ones hold
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 640, height: 360 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  const seeds = (process.argv[2] || 'VN1,VN2,VN3').split(',');
  for (const sd of seeds) {
    await pg.evaluate(([sd]) => { Save.data.maps = { vietnam: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('vietnam', sd); }, [sd]);
    for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
    const r = await pg.evaluate(() => {
      const w = F0W.play.world, B = w.bridges, I = w.islands, o = {};
      const reach = () => { const N = 233, seen = new Uint8Array(N * N), q = [], id = (i, j) => j * N + i, X = i => (i - 116) / 2;
        const ok = (x, z) => Math.hypot(x, z) <= 58 && w.canWalk(x, z);
        q.push([116, 116]); seen[id(116, 116)] = 1; let n = 0;
        while (q.length) { const [i, j] = q.pop(); n++; for (const [di, dj] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]]) { const a = i + di, b = j + dj; if (a < 0 || b < 0 || a >= N || b >= N || seen[id(a, b)]) continue; const x = X(a), z = X(b); if (!ok(x, z)) continue; if (Math.abs(w.groundAt(x, z) - w.groundAt(X(i), X(j))) > 1.2) continue; seen[id(a, b)] = 1; q.push([a, b]); } }
        return { n: n / 4, at: (x, z) => !!seen[id(Math.round(x * 2) + 116, Math.round(z * 2) + 116)] }; };
      let land = 0; for (let x = -58; x <= 58; x++) for (let z = -58; z <= 58; z++) if (Math.hypot(x, z) <= 58 && !w.inGorge(x, z)) land++;
      o.islands = I.length; o.sizes = I.map(q => Math.round(q.R)); o.land = land;
      let R = reach(); o.with = { n: R.n, isl: I.map(q => R.at(q.x, q.z)) };
      const st = B.map(b => b.state); B.forEach(b => { b.state = 'gone'; }); R = reach(); o.without = { n: R.n, isl: I.map(q => R.at(q.x, q.z)) }; B.forEach((b, i) => { b.state = st[i]; });
      // the bridges that hold the chain together (not worn): are all islands reachable over them alone?
      B.forEach(b => { if (b.weak) b.state = 'gone'; }); R = reach(); o.sound = { n: R.n, isl: I.map(q => R.at(q.x, q.z)) }; B.forEach((b, i) => { b.state = st[i]; });
      o.weak = B.map(b => b.weak); o.leaf = B.map(b => b.leaf); o.loop = B.map(b => b.loop); o.spans = B.map(b => +(2 * b.Lh).toFixed(1)); return o;
    });
    T(`${sd}: an archipelago of islands of different sizes`, r.islands >= 5 && Math.max(...r.sizes) - Math.min(...r.sizes) >= 6, r.sizes);
    T(`${sd}: without bridges only the home island can be reached`, r.without.isl[0] && r.without.isl.slice(1).every(x => !x), r.without.isl);
    T(`${sd}: over the bridges every island can be reached, and most of the land`, r.with.isl.every(x => x) && r.with.n > r.land * 0.8, [r.with.n, r.land]);
    T(`${sd}: the sound bridges alone join every island that is not a dead end behind a worn bridge`, r.sound.isl.every((x, i) => x || r.weak.some((wk, bi) => wk)), r.sound.isl);
    T(`${sd}: at least one bridge is worn`, r.weak.some(x => x), r.weak);
    const g = await pg.evaluate(() => {
      const w = F0W.play.world, o = { blocked: [], hang: [], steep: [] };
      w.bridges.forEach((b, si) => { for (const e of [-1, 1]) for (let k = b.Lh + 1; k <= b.Lh + 3; k += 1) { const x = b.cx + b.nx * e * k, z = b.cz + b.nz * e * k;
        if (!w.canWalk(x, z)) o.blocked.push([si, e, k, 'terrain']); if (w.slopeAt(x, z) > 1.3) o.steep.push([si, e, k, +w.slopeAt(x, z).toFixed(2)]);
        for (const c of w.colliders) if (Math.hypot(c.x - x, c.z - z) < c.r + 0.9) o.blocked.push([si, e, k, 'collider', +c.r.toFixed(1)]); } });
      for (const c of w.colliders) { if (c.r < 2.4) continue; const hs = [w.heightAt(c.x, c.z)]; let gorge = false; for (let i = 0; i < 12; i++) { const a = i * Math.PI / 6, x = c.x + Math.cos(a) * (c.r + 0.2), z = c.z + Math.sin(a) * (c.r + 0.2); hs.push(w.heightAt(x, z)); if (w.inGorge(x, z)) gorge = true; } if (gorge || Math.max(...hs) - Math.min(...hs) > 2.6) o.hang.push([+c.x.toFixed(1), +c.z.toFixed(1), +c.r.toFixed(1), gorge, +(Math.max(...hs) - Math.min(...hs)).toFixed(1)]); }
      return o; });
    T(`${sd}: the way off both ends of each bridge is free for the first metres (no rocks, spires, trees or cliffs)`, g.blocked.length === 0 && g.steep.length === 0, [g.blocked.slice(0, 3), g.steep.slice(0, 3)]);
    T(`${sd}: big structures (spires) stand on level ground, none over a gorge`, g.hang.length === 0, g.hang.slice(0, 4));
    T(`${sd}: at least one bridge is worn`, r.weak.some(x => x), r.weak);
  }
  // crossing a sound bridge and a worn one
  await pg.evaluate(() => { Save.data.maps = { vietnam: true }; F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('vietnam', 'VN1'); });
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  const place = (idx, u) => pg.evaluate(([idx, u]) => { const p = F0W.play, w = p.world, b = w.bridges[idx], P = p.player; F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; const x = b.cx + b.nx * u, z = b.cz + b.nz * u; P.pos.set(x, w.groundAt(x, z) + 1.65, z); P.y = P.pos.y; P.vel.set(0, 0); return { weak: b.weak, state: b.state }; }, [idx, u]);
  const info = await pg.evaluate(() => F0W.play.world.bridges.map(b => ({ weak: b.weak, Lh: b.Lh })));
  const sound = info.findIndex(b => !b.weak), worn = info.findIndex(b => b.weak);
  if (sound >= 0) { await place(sound, 0); await pg.waitForTimeout(3500); const s = await pg.evaluate(() => ({ screen: F0W.screen, st: F0W.play && F0W.play.world.bridges.map(b => b.state) })); T('a sound bridge holds the player in the middle', s.screen === 'play' && s.st[sound] === 'ok', s); }
  await place(worn, -info[worn].Lh + 1); await pg.waitForTimeout(500);
  const s1 = await pg.evaluate((i) => F0W.play.world.bridges[i].touched, worn); T('stepping onto a worn bridge is noticed (it creaks)', s1 === true);
  await place(worn, 0);
  let s2 = null; for (let i = 0; i < 40; i++) { await pg.waitForTimeout(500); s2 = await pg.evaluate((i) => ({ st: F0W.play && F0W.play.world.bridges[i].state, fall: !!(F0W.play && F0W.play.fall), screen: F0W.screen }), worn); if (s2.fall || s2.screen === 'map') break; }
  T('in the middle of a worn bridge it snaps and the player falls', s2.fall || s2.screen === 'map', s2);
  let s3 = null; for (let i = 0; i < 40; i++) { await pg.waitForTimeout(500); s3 = await pg.evaluate(() => ({ screen: F0W.screen, note: F0W.mapNote && F0W.mapNote.text })); if (s3.screen === 'map') break; }
  T('after the fall the player is on the map with a note', s3.screen === 'map' && !!s3.note, s3);
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5) : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
