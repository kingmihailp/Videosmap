// finds texts that run out of the plate (UIK.panel / button / filled rectangle) they start in: node ui_overflow.js -> list
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--no-sandbox'] });
  const pg = await br.newPage({ viewport: { width: 960, height: 540 } }); const errs = []; pg.on('pageerror', e => errs.push(e.stack.split('\n').slice(0, 3).join(' <- ')));
  await pg.addInitScript(() => {
    window.__rects = []; window.__over = new Map(); window.__tag = '';
    const raf = window.requestAnimationFrame.bind(window); window.requestAnimationFrame = cb => raf(t => { window.__rects.length = 0; cb(t); });
    const add = (x, y, w, h) => { if (w >= 24 && h >= 9 && w < 420 && h < 250) window.__rects.push([x, y, w, h]); };
    const fr = CanvasRenderingContext2D.prototype.fillRect; CanvasRenderingContext2D.prototype.fillRect = function (x, y, w, h) { const m = this.getTransform(); if (this.canvas.id === 'ui') add(x + m.e / m.a, y + m.f / m.d, w, h); return fr.call(this, x, y, w, h); };
    window.__arm = () => { const T0 = T; if (T0.__p) return; T0.__p = 1; const d = T0.draw; T0.draw = function (ctx, str, x, y, opt = {}) { try { if (ctx.canvas.id !== 'ui' && ctx.canvas.width !== SW) return d.apply(this, arguments); const size = opt.size || 8, w = T0.width(str, size); let l = Math.round(x); if (opt.align === 'c') l -= Math.round(w / 2); else if (opt.align === 'r') l -= w; const r = l + w, ym = y + 4; let best = null; for (const q of window.__rects) { if (l + 1 >= q[0] && l + 1 <= q[0] + q[2] && ym >= q[1] && ym <= q[1] + q[3] && (!best || true)) best = q; } window.__st = window.__st || { n: 0, hit: 0 }; window.__st.n++; if (best) window.__st.hit++; if (best && (r > best[0] + best[2] + 0.5 || l < best[0] - 0.5)) { const k = window.__tag + '|' + str; if (!window.__over.has(k)) window.__over.set(k, { tag: window.__tag, str, over: Math.round(r - best[0] - best[2]), rect: best.map(Math.round) }); } } catch (e) {} return d.apply(this, arguments); }; };
  });
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2500);
  await pg.evaluate(() => { __arm(); Save.data.maps = { bog: true, papua: true, vietnam: true }; Save.data.coins = 123456; for (const sp of SPECIES) if (!sp.mystery) Save.data.caught[sp.id] = { count: 3, first: Date.now(), place: sp.biome === 'ocean' ? 'ocean' : sp.biome, best: 90 }; F0W.fade = 0; F0W.fadeTarget = 0; });
  const tag = t => pg.evaluate(t => { window.__tag = t; }, t), wait = ms => pg.waitForTimeout(ms);
  await tag('title'); await pg.evaluate(() => F0W.toTitle()); await wait(600); await tag('map'); await pg.evaluate(() => F0W.toMap()); await wait(800);
  await pg.evaluate(() => { F0W.screen = 'journal'; F0W.journalFrom = 'title'; }); const nb = await pg.evaluate(() => visibleBiomes().length);
  for (let i = 0; i < nb; i++) { await pg.evaluate(i => { Screens.journal.tab = i; Screens.journal.sel = 0; }, i); const pages = await pg.evaluate(() => Screens.journal.pages || 1); for (let p = 0; p < pages; p++) { await pg.evaluate(p => { Screens.journal.page = p; }, p); await tag('journal ' + i + ' p' + p); await wait(250); const n = await pg.evaluate(() => Screens.journal.slots ? Screens.journal.slots.length : 9); for (let k = 0; k < Math.min(n, 12); k++) { await pg.evaluate(k => { Screens.journal.sel = k; }, k); await wait(120); } } }

  // ---- cabinet, market, secret room, play, modals
  await pg.evaluate(() => { Save.data.specimens.length = 0; let q = 0; for (const sp of SPECIES) { if (sp.mystery) continue; const id = Save.nextUid(); Save.data.specimens.push({ uid: id, sp: sp.id, biome: sp.biome, date: Date.now(), q: (q++ % 3) ? 70 : null, pose: null, box: null }); } Save.addBox('M', 0); Save.addBox('S', 1); });
  const ovs = async (label, ovList, open) => { await tag(label); await pg.evaluate(open); await wait(2500); for (const o of ovList) { await tag(label + ' ' + o); await pg.evaluate(o => { const c = F0W.cab; c.ov = o; if (o === 'pick') Spread.pick.open(); if (o === 'bench') Boxes.bench.open(); if (o === 'sell' && c.sellOpen) c.sellOpen(); if (o === 'shop' && c.shopOpen) c.shopOpen(); }, o); await wait(500); } };
  await ovs('cabinet', ['help', 'pause', 'journal', 'pick', 'bench', 'place'], () => F0W.toCabinet());
  await pg.evaluate(() => { const c = F0W.cab; if (Save.rawList().length) { c.ov = 'spread'; Spread.G.begin(Save.rawList()[0]); } }); await tag('cabinet spread'); await wait(600);
  await ovs('market', ['help', 'pause', 'journal', 'sell', 'shop', 'talk', 'code'], () => F0W.toMarket());
  await ovs('secret', ['pause', 'shop'], () => F0W.toSecret());
  for (const m of ['settings', 'keys', 'stash']) { await tag('modal ' + m); await pg.evaluate(m => { F0W.modal = m; }, m); await wait(500); await pg.evaluate(() => { F0W.modal = null; }); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.start('vietnam', 'VN1'); }); for (let i = 0; i < 120; i++) { if (await pg.evaluate(() => !!(F0W.play && F0W.screen === 'play')).catch(() => false)) break; await wait(500); }
  await pg.evaluate(() => { F0W.fade = 0; F0W.fadeTarget = 0; F0W.overlay = null; const p = F0W.play; for (const id of ['teinopalpus_aureus', 'ornithoptera_alexandrae', 'coenonympha_oedippus']) p.cards.push({ sp: SPECIES_BY_ID[id], first: true, t: 4.5, d: 9, count: 12 }); const ab = Aberr.make(SPECIES_BY_ID.ornithoptera_alexandrae, 'ABCDE'); p.cards.push({ sp: ab, first: false, t: 4.5, d: 9, count: 1 }); }); await tag('play cards'); await wait(1500);
  for (const o of ['pause', 'help', 'journal']) { await tag('play ' + o); await pg.evaluate(o => { F0W.overlay = o; }, o); await wait(600); }
  console.log('self-test:', await pg.evaluate(() => { const cv = document.createElement('canvas'); cv.width = SW; cv.height = SH; const c = cv.getContext('2d'); window.__tag = 'selftest'; UIK.panel(c, 10, 10, 40, 14, {}); c.fillRect(10, 10, 40, 14); T.draw(c, 'очень длинный текст в узкой плашке', 12, 12, { size: 8 }); return window.__over.has('selftest|очень длинный текст в узкой плашке'); }));
  console.log('stats', await pg.evaluate(() => window.__st));
  const res = await pg.evaluate(() => [...window.__over.values()]); console.log(JSON.stringify(res, null, 0).replace(/\},\{/g, '},\n{')); console.log('errors', errs.slice(0, 3)); await br.close();
})();
