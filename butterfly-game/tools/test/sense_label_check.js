// the sense (H) is blue; every trap carries «сломается в m:ss» that counts down
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  let bad = 0; const T = (n, c, x) => { if (!c) bad++; console.log(c ? 'PASS' : 'FAIL', n, x === undefined ? '' : JSON.stringify(x)); };
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('russia', 'SENSE1'); });
  for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
  // the sense marker is drawn into a recording context: its colours
  const r = await pg.evaluate(() => {
    F0W.overlay = null; const p = F0W.play, cols = new Set(); const rec = { globalAlpha: 1, set fillStyle(v) { cols.add(String(v)); }, get fillStyle() { return ''; }, fillRect() {}, save() {}, restore() {}, translate() {}, rotate() {}, beginPath() {}, moveTo() {}, lineTo() {}, closePath() {}, fill() {}, measureText: () => ({ width: 10 }) };
    const old = T.draw, texts = []; T.draw = (c, str, x, y, o) => { texts.push(o && o.color); }; p.sense = true; p.player.pos.set(0, p.world.groundAt(0, 0) + 1.65, 0); p.drawSense(rec); T.draw = old; return { cols: [...cols], texts, flies: p.flies.length };
  });
  T('the sense markers (outline / arrow) are blue and the distance text too', r.cols.length > 0 && r.cols.every(c => c.toLowerCase() === '#4aa8ff') && r.texts.every(c => /^#[0-9a-f]{6}$/i.test(c) && parseInt(c.slice(5, 7), 16) > 200), r);
  const lab = await pg.evaluate(() => { const p = F0W.play, w = p.world; const t = p.traps.mk({ tid: 'L1', owner: 0, name: 'Вы', type: 'std', x: 0, y: w.groundAt(0, -5), z: -5, yaw: 0, age: 0 }, true); const key0 = t.label.userData.key; p.traps.update(1.05); const key1 = t.label.userData.key; t.t = t.life - 10; p.traps.update(0.05); const key2 = t.label.userData.key; return { key0, key1, key2, n: p.traps.list.length }; });
  T('the label says «сломается в 2:00», then counts down, and turns red in the last seconds', /сломается в 2:00/.test(lab.key0) && /сломается в 1:59/.test(lab.key1) && /сломается в 0:10/.test(lab.key2) && /true$/.test(lab.key2), lab);
  console.log(errs.length ? 'ERRORS ' + errs.slice(0, 5) : bad ? 'FAILED ' + bad : 'ALL PASS'); await br.close(); process.exit(bad || errs.length ? 1 : 0);
})();
