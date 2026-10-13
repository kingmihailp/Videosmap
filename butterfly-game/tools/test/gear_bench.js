// the workbench with the enthusiast's gear: attaching / detaching attachments (max 3), the cannon cannot be dismantled, gear parts can be assembled, stashes stay consistent
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&lite'); await pg.waitForTimeout(2000);
  for (let i = 0; i < 80; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.ready))) break; await pg.waitForTimeout(250); }
  const ev = (f, a) => pg.evaluate(f, a); let fails = 0; const ok = (name, cond, extra = '') => { console.log((cond ? 'ok   ' : 'FAIL ') + name + (extra ? ' — ' + extra : '')); if (!cond) fails++; };
  await ev(() => { Save.data.coins = 1e7; F0W.fade = 0; F0W.fadeTarget = 0; F0W.toCabinet && F0W.toCabinet(); }); await pg.waitForTimeout(2500);
  await ev(() => { F0W.fade = 0; F0W.fadeTarget = 0; const r = F0W.cab; r.ov = null; Save.buyCannon(); for (const g of ['g_map', 'g_ir', 'g_auto', 'g_map']) Save.buyGadget(g); for (const id of ['h_mech', 'r_shock', 'm_pher', 'h_tung']) Save.buyPart(id); r.open('bench'); Boxes.bench.tab = 'nets'; Boxes.nbench.sel = Save.netList().length; });
  const B = 'Boxes.bench';
  const cannonIdx = await ev(() => Save.netList().findIndex(n => n.cannon) + 1); await ev(i => { Boxes.nbench.sel = i; Boxes.nbench.layout(); }, cannonIdx);
  const lay = await ev(() => ({ g: Boxes.nbench.gbtns.map(b => [b.gid, b.x, b.y, b.w, b.h]), btns: Boxes.nbench.btns.map(b => [b.id, !!b.disabled]) }));
  ok('cannon: «Разобрать» is disabled', lay.btns.find(b => b[0] === 'take')[1]);
  const clickG = gid => ev(gid => { const b = Boxes.nbench.gbtns.find(q => q.gid === gid); Boxes.nbench.click(b.x + 3, b.y + 3); return Save.netList().find(n => n.cannon).g.slice(); }, gid);
  ok('attach the map', (await clickG('g_map')).includes('g_map'));
  ok('attach the scanner', (await clickG('g_ir')).includes('g_ir'));
  ok('attach the autonomy', (await clickG('g_auto')).length === 3);
  const stash = await ev(() => [Save.gadCount('g_map'), Save.gadCount('g_ir'), Save.gadCount('g_auto')]); ok('stash after attaching: map 1 (2 bought, 1 used), others 0', stash.join() === '1,0,0', stash.join());
  await ev(() => { F0W.cab.ov = null; F0W.cab.open('bench'); Boxes.bench.tab = 'nets'; }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/gb_cannon.png' });
  ok('detach the scanner', !(await clickG('g_ir')).includes('g_ir'));
  ok('stash is back', await ev(() => Save.gadCount('g_ir') === 1));
  // assemble a net with gear parts, attach there too
  const made = await ev(() => { const b = Boxes.nbench; b.sel = Save.netList().length + 1; b.layout(); b.draft = { h: 'h_mech', r: 'r_shock', m: 'm_pher' }; b.layout(); const mk = b.btns.find(q => q.id === 'make'); b.click(mk.x + 3, mk.y + 3); const n = Save.netList().find(q => q.h === 'h_mech'); return !!n && n.r === 'r_shock' && n.m === 'm_pher'; });
  ok('assembled a net of gear parts', made);
  ok('parts consumed', await ev(() => Save.partCount('h_mech') === 0 && Save.partCount('r_shock') === 0 && Save.partCount('m_pher') === 0 && Save.partCount('h_tung') === 1));
  const idx2 = await ev(() => Save.netList().findIndex(n => n.h === 'h_mech') + 1); await ev(i => { Boxes.nbench.sel = i; Boxes.nbench.layout(); }, idx2);
  ok('attach the scanner to the new net', await ev(() => { const b = Boxes.nbench.gbtns.find(q => q.gid === 'g_ir'); Boxes.nbench.click(b.x + 3, b.y + 3); return Save.netList().find(n => n.h === 'h_mech').g.includes('g_ir'); }));
  await pg.waitForTimeout(400); await ev(() => { F0W.cab.ov = null; F0W.cab.open('bench'); Boxes.bench.tab = 'nets'; Boxes.nbench.sel = Save.netList().findIndex(n => n.h === 'h_mech') + 1; }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/gb_gear.png' });
  const dis = await ev(() => { const i = Save.netList().findIndex(n => n.h === 'h_mech') + 1; Boxes.nbench.sel = i; Boxes.nbench.layout(); const tk = Boxes.nbench.btns.find(q => q.id === 'take'); Boxes.nbench.click(tk.x + 3, tk.y + 3); return [Save.partCount('h_mech'), Save.partCount('r_shock'), Save.partCount('m_pher'), Save.gadCount('g_ir'), Save.netList().some(n => n.h === 'h_mech')]; });
  ok('dismantle returns parts and attachments to the stash', dis.join() === '1,1,1,1,false', dis.join());
  ok('cannon survives dismantle attempt', await ev(() => { Save.disassembleNet(Save.netList().find(n => n.cannon).uid); return Save.hasCannon(); }));
  ok('cannot buy a second cannon', await ev(() => { const c = Save.data.coins; return !Save.buyCannon() && Save.data.coins === c; }));
  console.log('errors', JSON.stringify(errs)); await br.close(); process.exit(fails || errs.length ? 1 : 0);
})();
