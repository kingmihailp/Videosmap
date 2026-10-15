// English UI: tours the screens in English and lists every text that still has Russian in it, and texts that run off the 480x270 canvas.  node i18n_cover.js [shots]
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock&lang=en'); await pg.waitForTimeout(2500);
  const SH = '/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/en_';
  await pg.evaluate(() => {
    window.__res = new Map(); window.__off = new Map(); window.__wide = new Map(); const tr0 = I18N.tr.bind(I18N), CY = /[А-Яа-яЁё]/;
    I18N.tr = s => { const r = tr0(s); if (typeof r === 'string' && CY.test(r) && !window.__res.has(s)) window.__res.set(s, r); return r; };
    window.__scr = ''; const d0 = T.draw; const b0 = UIK.btn.bind(UIK); UIK.btn = (ctx, b, h) => { try { const w = T.width(b.label || '', b.size || 8); if (w > b.w - 4 && !window.__off.has('BTN|' + b.label)) window.__off.set('BTN|' + window.__scr + '|' + b.label, [w, b.w]); } catch (e) {} return b0(ctx, b, h); };
    T.draw = (ctx, str, x, y, o = {}) => { const r = d0(ctx, str, x, y, o); try { if (!o.raw && typeof str === 'string' && /[А-Яа-яЁё]/.test(str)) { window.__cmp = (window.__cmp || 0) + 1; const wr = T.width(str, o.size || 8, true); if (r > wr + 1 && !window.__wide.has(str)) window.__wide.set(str, [wr, r, window.__scr]); } const t = tr0(str), w = r; let l = Math.round(x), rr = l + w; if (o.align === 'c') { l = Math.round(x) - Math.round(w / 2); rr = l + w; } else if (o.align === 'r') { l = Math.round(x) - w; rr = Math.round(x); } if ((l < -1 || rr > 481) && w > 0 && !(ctx.canvas && ctx.canvas.width !== 480)) { const k = window.__scr + '|' + t; if (!window.__off.has(k)) window.__off.set(k, [l, rr]); } } catch (e) {} return r; };
    Save.data.maps = Object.fromEntries(BIOMES.map(b => [b.id, true])); SPECIES.forEach((s, i) => { if (i % 2 === 0 && !s.mystery) Save.data.caught[s.id] = { count: 1 + (i % 4), first: Date.now(), place: BIOMES[i % 12].id }; });
    I18N.set('en'); F0W.fade = 0; F0W.fadeTarget = 0; });
  const to = async (name, js, wait = 700) => { await pg.evaluate(([n, js]) => { window.__scr = n; eval(js); F0W.fade = 0; F0W.fadeTarget = 0; }, [name, js]); await pg.waitForTimeout(wait); if (process.argv[2] === 'shots') await pg.screenshot({ path: SH + name + '.png' }); };
  await to('title', "F0W.screen='title'"); await to('settings', "F0W.screen='settings'"); await to('keys', "F0W.screen='keys'"); await to('mp', "F0W.screen='mp'"); await to('help', "F0W.screen='title'; F0W.helpFromTitle = true; F0W.overlay='help'");
  await pg.evaluate(() => { F0W.helpFromTitle = false; F0W.overlay = null; });
  await to('map', "F0W.screen='map'"); 
  for (let i = 0; i < 12; i++) await to('map' + i, `F0W.screen='map'; Screens.wmap.sel = ${i}`, 250);
  await to('journal', "F0W.screen='journal'"); for (let i = 0; i < 12; i++) await to('journal' + i, `Screens.journal.tab = ${i}; Screens.journal.sel = 0`, 250);
  // data audit: every text field of every species / location, and the derived 'look' hint, through the translator
  const au = await pg.evaluate(() => { const bad = []; const chk = (w, s) => { if (typeof s === 'string' && /[А-Яа-яЁё]/.test(s)) { const r = I18N.tr(s); if (/[А-Яа-яЁё]/.test(r)) bad.push(w + ': ' + s.slice(0, 70) + ' => ' + r.slice(0, 70)); } };
    for (const s of SPECIES) for (const k of ['ru', 'fam', 'hab', 'range', 'host', 'fact', 'look']) chk(s.id + '.' + k, s[k]);
    for (const b of BIOMES) for (const k of Object.keys(b)) chk(b.id + '.' + k, b[k]); return bad; });
  console.log('DATA RESIDUAL', au.length); au.slice(0, 25).forEach(x => console.log('  ', x));
  console.log('screens done');
  const play = async (id, tag) => { await pg.evaluate(([id, tag]) => { window.__scr = tag; F0W.fade = 0; F0W.fadeTarget = 0; F0W.screen = 'title'; F0W.start(id, 'EN1'); }, [id, tag]);
    for (let i = 0; i < 200; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await pg.waitForTimeout(500); }
    await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; F0W.locked = true; }); await pg.waitForTimeout(1200); if (process.argv[2] === 'shots') await pg.screenshot({ path: SH + tag + '.png' }); };
  const ov = async (name, js) => { await to(name, js, 600); await pg.evaluate(() => { F0W.overlay = null; }); };
  for (const id of ['russia', 'chihuahua', 'borneo', 'ocean']) { await play(id, 'play_' + id); await ov('pause_' + id, "F0W.overlay='pause'"); await ov('help_play', "F0W.overlay='help'"); await ov('journal_ov', "F0W.overlay='journal'"); await ov('cardpos', "F0W.overlay='cardpos'"); await ov('settings_play', "F0W.overlay='pause'; F0W.screen='play'; Screens.settings && 0"); }
  for (const [n, js] of [['cabinet', 'F0W.toCabinet()'], ['market', 'F0W.toMarket()'], ['museum', 'F0W.toMuseum()'], ['secret', 'F0W.toSecret()']]) { await to(n, js, 3500); await ov(n + '_pause', "F0W.overlay='pause'"); }

  const res = await pg.evaluate(() => ({ res: [...window.__res.entries()], off: [...window.__off.entries()], wide: [...window.__wide.entries()] }));
  console.log('RESIDUAL', res.res.length); res.res.slice(0, 80).forEach(([a, b]) => console.log('  ', JSON.stringify(a).slice(0, 110), '=>', JSON.stringify(b).slice(0, 80)));
  console.log('OFFSCREEN', res.off.length); res.off.slice(0, 40).forEach(([k, v]) => console.log('  ', k.slice(0, 110), v));
  console.log('WIDER THAN RUSSIAN', res.wide.length, 'compared', await pg.evaluate(() => window.__cmp)); res.wide.forEach(([k, v]) => console.log('  ', JSON.stringify(k).slice(0, 80), v));
  console.log('errors', JSON.stringify(errs.slice(0, 5))); await br.close();
})();
