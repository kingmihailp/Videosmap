const path = require('path'); const { spawn } = require('child_process');
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
const PORT = 3700 + Math.floor(Math.random() * 300), SRV = path.resolve(__dirname, '../../server');
try { require('fs').rmSync(path.join(SRV, 'data'), { recursive: true, force: true }); } catch (e) {}
const ok = (c, m) => console.log((c ? 'PASS ' : 'FAIL ') + m);
(async () => {
  const srv = spawn('node', ['server.js', String(PORT)], { cwd: SRV, stdio: 'pipe' }); await new Promise(r => setTimeout(r, 1500));
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const open = async (n) => { const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', n, e.message)); await pg.goto(`http://localhost:${PORT}/#debug&nolock&mp=${n}&biome=russia`); for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(500); } await pg.evaluate(() => { F0W.overlay = null; F0W.locked = true; F0W.fade = 0; F0W.fadeTarget = 0; }); return pg; };
  const A = await open('Alice'), B = await open('Bob'); await B.waitForTimeout(1500);
  // the host (Alice) spawns an aberrant; Bob must see the very same aberrant as a puppet and be able to catch it
  const id = await A.evaluate(() => { const p = F0W.play, base = p.pool[0], ab = SPECIES_BY_ID[base.id + '~MP7Q2']; const f = new Fly(p, ab, false); p.flies.push(f); return f.id; });
  for (let i = 0; i < 20; i++) { if (await B.evaluate(id => !!F0W.play.flies.find(x => x.id === id), id)) break; await B.waitForTimeout(500); }
  const seen = await B.evaluate(id => { const f = F0W.play.flies.find(x => x.id === id); return f ? { sp: f.sp.id, ab: !!f.sp.ab, puppet: f.puppet } : null; }, id); console.log(JSON.stringify(seen));
  ok(seen && seen.ab && seen.puppet && seen.sp.endsWith('~MP7Q2'), 'Bob sees the same aberrant as a puppet');
  await B.evaluate(id => { const p = F0W.play; const f = p.flies.find(x => x.id === id); p.netCatch(f); }, id); await A.waitForTimeout(1200);
  const res = await Promise.all([A, B].map(pg => pg.evaluate(() => ({ ab: Save.aberrTotal(), spec: Save.data.specimens.map(s => s.sp), journal: Save.total() }))));
  console.log(JSON.stringify(res));
  ok(res[1].ab === 1 && res[0].ab === 0, 'only the catcher records the aberrant in the personal journal');
  ok(res[0].spec.length === 1 && res[0].spec[0].endsWith('~MP7Q2') && res[1].spec.length === 1, 'the aberrant specimen is in the shared cabinet for both');
  // cabinet: spread the aberrant specimen (loads its wings), no errors
  await A.evaluate(() => F0W.toCabinet()); await A.waitForTimeout(3500);
  const cab = await A.evaluate(() => { const s = Save.rawList()[0]; const sp = SPECIES_BY_ID[s.sp]; Spread.G.begin(s); return { ok: !!sp, ab: !!sp.ab, name: sp.ru }; }); console.log(JSON.stringify(cab)); ok(cab.ok && cab.ab, 'aberrant specimen opens in the spreading minigame');
  await br.close(); srv.kill();
})();
