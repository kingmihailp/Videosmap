// ---------------------------------------------------------------- the night fauna: 31 moths per location (data: moths_data.js, generated from tools/moths/data/*.json)
// A moth is a species like any other (same art, journal, economy) with moth: true; a location's moths live in biome.moths, its butterflies in biome.species.
// In a night location (see night.js) the moths replace the butterflies: play.js plays the location through biome.nightB (a copy of the biome whose species are the moths).
(() => {
  const slug = s => s.toLowerCase().replace(/[^a-z]+/g, '_').replace(/^_|_$/g, '');
  const BEHS = { moth: 'moth', hawkm: 'hawkm', giant: 'giant', rester: 'rester' };
  for (const bid in MOTH_DATA) for (const r of MOTH_DATA[bid]) {
    const art = Object.assign({ t: r.shape, f: r.f, h: r.h }, r.opts); if (r.tail !== 'none') { art.tail = true; art.tailMode = r.tail; if (r.tail === 'long') art.longTail = true; }
    SPECIES.push({ id: slug(r.la), la: r.la, ru: r.ru, en: r.en, fam: r.fam, biome: bid, mm: [r.lo, r.hi], hab: r.hab, range: r.range, host: r.host, fact: r.fact, look: r.hab.split(',')[0], rar: r.rar, beh: BEHS[r.beh] || 'moth', art, moth: true });
  }
  rebuildSpeciesIndex();
})();
