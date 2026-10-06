// ---------------------------------------------------------------- aberrations: rare, procedurally generated colour / pattern / size variants of every real species
// An aberrant is a species-like object derived from its base species and a short code (the seed): id = "<base id>~<CODE>".
// Everything is a pure function of (base species, code), so any client (or an old save) can rebuild it from the id alone.
// Deviations are deliberately bounded: hue moves by at most ~22 degrees, lightness / saturation by modest factors, so a peacock
// stays red (another shade of red or bordeaux), a blue stays blue, a white stays whitish -- but the change is always visible.
const Aberr = (() => {
  const SEP = '~', CODE_RE = /^[0-9A-Z]{4,6}$/, ALPHA = '0123456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  const AB_CHANCE = 0.035;                         // chance that a freshly spawned butterfly of a real species is an aberrant
  const made = new Map();

  function toHsl(c) { const r = c[0] / 255, g = c[1] / 255, b = c[2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0; if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h *= 60; } return [h, s, l]; }
  function fromHsl(h, s, l) { h = ((h % 360) + 360) % 360 / 360; const f = (p, q, t) => { t = (t + 1) % 1; if (t < 1 / 6) return p + (q - p) * 6 * t; if (t < 1 / 2) return q; if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6; return p; }; if (s === 0) { const v = l * 255; return rgb2hex(v, v, v); } const q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q; return rgb2hex(f(p, q, h + 1 / 3) * 255, f(p, q, h) * 255, f(p, q, h - 1 / 3) * 255); }

  // the genome of one aberration (all values bounded)
  function genome(base, rng) {
    const r = x => rng.range(x[0], x[1]);
    const mode = rng.pick(['shift', 'shift', 'shift', 'dark', 'dark', 'pale', 'pale', 'vivid']);
    const g = { mode, hs: (rng.chance(0.5) ? 1 : -1) * (mode === 'shift' ? r([8, 18]) : r([0, 7])), hs2: r([-4, 4]), lf: r([0.68, 0.84]), pl: r([0.2, 0.42]), vv: r([0.18, 0.38]), tintHue: rng.pick([34, 44, 24, 205, 218, 330]), tintS: r([0.1, 0.2]) };
    const a = base.art, nSp = (a.sp || []).length, nEye = (a.eye || []).length;
    g.spotK = (nSp + nEye > 0 && rng.chance(0.6)) ? r([0.7, 1.34]) : 1;
    g.drop = nSp >= 3 && rng.chance(0.22) ? rng.int(0, nSp - 1) : -1;
    g.dots = rng.chance(0.4) ? rng.int(2, 4) : 0; g.dotSeed = rng.int(1, 1e6);
    g.edge = a.edge && rng.chance(0.38) ? (a.edge[1] >= 3 ? -1 : (rng.chance(0.5) ? 1 : -1)) : 0;
    g.shiftBand = (a.band || a.bars) && rng.chance(0.4) ? r([-0.05, 0.05]) : 0; g.barsN = a.bars && rng.chance(0.4) ? (rng.chance(0.5) ? 1 : -1) : 0;
    g.size = r([0.9, 1.12]); if (Math.abs(g.size - 1) < 0.04) g.size = g.size < 1 ? 0.93 : 1.07;
    g.sheenK = a.sheen ? r([0.7, 1.3]) : 1;
    return g;
  }

  function recolor(hex, role, g) {                 // role: 'main' | 'acc' | 'dark'
    const w = role === 'acc' ? 0.7 : 1; const [h0, s0, l0] = toHsl(hex2rgb(hex)); let h = h0, s = s0, l = l0;
    if (l0 < 0.16) {                                // near-black: a visible gloss (brownish / bluish black), so black-and-white species still change
      h = g.tintHue; s = 0.27; l = l0 + (g.mode === 'pale' ? 0.09 : 0.065) * (0.6 + 0.4 * w);
    } else if (s0 >= 0.14 && l0 < 0.93) {           // chromatic: hue moves a little, the rest is a bounded tone change
      h = h0 + (g.hs + g.hs2) * w;
      if (g.mode === 'dark') { l = l0 * lerp(1, g.lf, w); s = s0 * (l0 > 0.7 ? 0.62 : 0.92); }
      else if (g.mode === 'pale') { l = l0 + (1 - l0) * g.pl * w; s = s0 * (1 - 0.22 * w); }
      else if (g.mode === 'vivid') { s = Math.min(1, s0 * (1 + g.vv * w)); l = l0 * 0.97; }
      else { s = clamp(s0 * (1 + 0.05 * (g.hs > 0 ? 1 : -1)), 0, 1); }
    } else if (l0 > 0.8) {                          // whites: a cream / cool tint, or smoky grey
      if (g.mode === 'dark') { l = l0 * lerp(1, g.lf, w); }
      else { h = g.tintHue; s = (g.mode === 'pale' ? 0.28 : 0.4) * (0.6 + 0.4 * w); l = Math.min(l0, g.mode === 'pale' ? 0.9 : 0.86); }
    } else {                                        // mid greys / browns
      if (g.mode === 'dark') l = l0 * lerp(1, g.lf, w); else if (g.mode === 'pale') l = l0 + (1 - l0) * 0.28 * w; else { h = g.tintHue; s = Math.max(s0, 0.3 * w); }
    }
    let out = fromHsl(h, clamp(s, 0, 1), clamp(l, 0.03, 0.97));
    if (role !== 'dark') {                          // safeguard: a main colour must always visibly change (nudge the lightness, never the hue)
      const o = hex2rgb(hex), min = role === 'acc' ? 34 : 46; for (let k = 0; k < 3; k++) { const n = hex2rgb(out); if (Math.abs(o[0] - n[0]) + Math.abs(o[1] - n[1]) + Math.abs(o[2] - n[2]) >= min) break; l = clamp(l + (l < 0.5 ? 0.06 : -0.06), 0.03, 0.97); out = fromHsl(h, clamp(s, 0, 1), l); }
    }
    return out;
  }

  function mutateArt(base, g) {
    const a = JSON.parse(JSON.stringify(base.art)), M = c => recolor(c, 'main', g), A = c => recolor(c, 'acc', g), D = c => recolor(c, 'dark', g);
    a.f = a.f.map(M); a.h = a.h.map(M);
    if (a.edge) { a.edge[0] = D(a.edge[0]); a.edge[1] = clamp(a.edge[1] + g.edge, 1, 4); }
    if (a.dots) a.dots = A(a.dots); if (a.veins) a.veins = D(a.veins); if (typeof a.tail === 'string') a.tail = D(a.tail);
    if (a.bars) { a.bars[0] = D(a.bars[0]); a.bars[1] = Math.max(2, a.bars[1] + g.barsN); }
    if (a.band) { a.band[3] = M(a.band[3]); a.band[1] = clamp(a.band[1] + g.shiftBand, 0, 0.95); a.band[2] = clamp(a.band[2] + g.shiftBand, 0.05, 1); }
    if (a.tip) a.tip[0] = M(a.tip[0]); if (a.sheen) { a.sheen[0] = M(a.sheen[0]); a.sheen[1] = a.sheen[1] * g.sheenK; }
    if (a.checker) a.checker = a.checker.map(M); if (a.rays) a.rays[1] = A(a.rays[1]); if (a.arc) a.arc[1] = A(a.arc[1]); if (a.wedges) a.wedges[0] = A(a.wedges[0]);
    if (a.patch) { a.patch[4] = A(a.patch[4]); a.patch[3] *= g.spotK; }
    if (a.sp) { a.sp.forEach(s => { s[4] = A(s[4]); s[3] *= g.spotK; }); if (g.drop >= 0 && a.sp.length >= 3) a.sp.splice(g.drop, 1); }
    if (a.eye) a.eye.forEach(e => { e[4] = A(e[4]); e[3] *= g.spotK; });
    if (g.dots) {                                   // a few extra small spots, dark on a bright wing and pale on a dark one
      const r = new Rng(g.dotSeed), light = toHsl(hex2rgb(a.f[0]))[2] > 0.5, col = light ? '#1c140c' : '#f2e8c8'; a.sp = a.sp || [];
      for (let i = 0; i < g.dots; i++) a.sp.push([r.chance(0.5) ? 'f' : 'h', r.range(0.3, 0.88), r.range(0.2, 0.8), r.range(0.8, 1.25), col]);
    }
    return a;
  }

  function describe(base, g) {
    const d = [], nm = [];
    if (g.mode === 'dark') { d.push('тёмная форма (меланизм)'); nm.push('nigrescens'); } else if (g.mode === 'pale') { d.push('бледная форма'); nm.push('pallida'); } else if (g.mode === 'vivid') { d.push('насыщенная окраска'); nm.push('saturata'); } else { d.push('сдвинутый оттенок'); nm.push('discolor'); }
    if (g.spotK > 1.12) { d.push('крупные пятна'); nm.push('maxima'); } else if (g.spotK < 0.88) { d.push('мелкие пятна'); nm.push('parva'); }
    if (g.drop >= 0) { d.push('нет одного пятна'); nm.push('defecta'); }
    if (g.dots) { d.push('лишние точки'); nm.push('punctata'); }
    if (g.edge > 0) { d.push('широкая кайма'); nm.push('marginata'); } else if (g.edge < 0) { d.push('узкая кайма'); nm.push('angusta'); }
    if (g.shiftBand || g.barsN) d.push('смещённый рисунок');
    const pc = Math.round((g.size - 1) * 100); d.push(pc > 0 ? `крупнее на ${pc}%` : `мельче на ${-pc}%`);
    return { desc: d, name: nm.slice(0, 2).join('-') };
  }

  function make(base, code) {
    const id = base.id + SEP + code; let sp = made.get(id); if (sp) return sp;
    const g = genome(base, new Rng(strSeed(id))), info = describe(base, g);
    sp = Object.assign({}, base, {
      id, base: base.id, rar: 3, art: mutateArt(base, g),
      ru: base.ru + ' · аберрант', la: base.la + ' ab. ' + info.name, en: base.en + ' (aberration)',
      mm: base.mm.map(v => Math.round(v * g.size)), fact: 'Аберрант: редкое отклонение окраски, рисунка или размера от обычной формы вида.',
      ab: { code, name: info.name, desc: info.desc, size: g.size },
    });
    made.set(id, sp); return sp;
  }

  const parse = id => { if (typeof id !== 'string') return null; const i = id.indexOf(SEP); if (i < 1) return null; const code = id.slice(i + 1); return CODE_RE.test(code) ? { base: id.slice(0, i), code } : null; };
  const eligible = sp => !!sp && !sp.base && !sp.mystery && sp.biome !== 'ocean' && !(BEH[sp.beh] && BEH[sp.beh].light);
  const randomCode = () => { let s = ''; for (let i = 0; i < 5; i++) s += ALPHA[Math.floor(Math.random() * ALPHA.length)]; return s; };
  const get = id => { const p = parse(id); if (!p) return undefined; const base = RAW_BY_ID[p.base]; return eligible(base) ? make(base, p.code) : undefined; };
  const roll = (sp, p = AB_CHANCE) => (eligible(sp) && Math.random() < p) ? make(sp, randomCode()) : sp;
  return { make, parse, get, roll, eligible, randomCode, AB_CHANCE, genome };
})();

// every lookup by species id also understands aberration ids ("<base>~CODE")
const RAW_BY_ID = SPECIES_BY_ID;
SPECIES_BY_ID = new Proxy(RAW_BY_ID, { get(t, k) { return typeof k === 'string' && k.indexOf('~') > 0 ? Aberr.get(k) : t[k]; } });
