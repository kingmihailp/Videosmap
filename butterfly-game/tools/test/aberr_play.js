const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); pg.on('pageerror', e => console.log('ERR', e.message)); pg.on('console', m => { if (m.type() === 'error') console.log('console', m.text().slice(0, 140)); });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&biome=russia'); for (let i = 0; i < 60; i++) { if (await pg.evaluate(() => !!(window.F0W && F0W.play)).catch(() => false)) break; await pg.waitForTimeout(500); }
  await pg.evaluate(() => { F0W.overlay = null; F0W.fade = 0; F0W.fadeTarget = 0; });
  // natural spawn rate over many rolls
  console.log('rate', await pg.evaluate(() => { let n = 0; const sp = SPECIES[0]; for (let i = 0; i < 20000; i++) if (Aberr.roll(sp).ab) n++; return n / 20000; }));
  // spawn an aberrant right in front of the player, catch it
  const r = await pg.evaluate(() => { const p = F0W.play, base = p.pool[0], ab = SPECIES_BY_ID[base.id + '~K3F9A']; const f = new Fly(p, ab, false); p.flies.push(f); f.pos.set(p.player.pos.x, p.player.pos.y - 0.2, p.player.pos.z - 2.2); p.onCatch(f); const ab2 = SPECIES_BY_ID[base.id + '~ZZ12Q']; const f2 = new Fly(p, ab2, false); p.flies.push(f2); p.onCatch(f2); return { base: base.id, caught: Save.has(base.id), list: Save.aberrants(base.id), spec: Save.data.specimens.length, total: Save.total(), ab: Save.aberrTotal(), respawn: p.respawns.map(x => x.sp.id) }; });
  console.log(JSON.stringify(r)); await pg.waitForTimeout(600); await pg.screenshot({ path: '/tmp/ab_card.png' });
  await pg.evaluate(() => { F0W.overlay = 'journal'; Screens.journal.tab = 0; Screens.journal.sel = BIOMES[0].species.findIndex(s => s.id === F0W.play.pool[0].id); }); await pg.waitForTimeout(500); await pg.screenshot({ path: '/tmp/ab_journal.png' });
  await pg.mouse.click(592, 502); await pg.waitForTimeout(500); console.log('ab view', await pg.evaluate(() => JSON.stringify(Screens.journal.ab))); await pg.screenshot({ path: '/tmp/ab_list.png' });
  await pg.keyboard.press('Escape'); await pg.waitForTimeout(300); console.log('after esc', await pg.evaluate(() => JSON.stringify({ ab: Screens.journal.ab, ov: F0W.overlay })));
  await br.close();
})();
