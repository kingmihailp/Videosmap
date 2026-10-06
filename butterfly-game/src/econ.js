// ---------------------------------------------------------------- the butterfly economy: what the merchant at the insect market pays for a specimen (coins)
// price = species value (from its rarity in nature) x aberration multiplier x condition multiplier
//  * species value: common ~6, uncommon ~16, rare ~42 coins (+-15% per species, stable); the secret ocean butterflies are worth ~150-250
//  * aberrants are worth several times more than the regular form of their species
//  * a specimen that was spread and pinned (minigame quality q) is worth more than a raw one
const Econ = (() => {
  const BASE = { 1: 6, 2: 16, 3: 42 }, RAW_K = 0.55, AB_K = 6;
  const h = id => (strSeed(id) % 1000) / 1000;
  const baseValue = sp => (sp.biome === 'ocean' || sp.mystery) ? Math.round(150 + h(sp.id) * 100) : Math.round(BASE[sp.rar || 1] * (0.85 + 0.3 * h(sp.id)));
  const condK = spec => spec.q === null || spec.q === undefined ? RAW_K : 0.8 + 0.9 * clamp(spec.q / 100);
  // full breakdown for one specimen
  function info(spec) {
    const sp = SPECIES_BY_ID[spec.sp]; if (!sp) return null;
    const species = sp.base ? RAW_BY_ID[sp.base] : sp, base = baseValue(species);
    const ab = sp.ab ? AB_K * (0.9 + 0.2 * h(sp.ab.code)) : 1, cond = condK(spec);
    return { sp, species, base, ab, cond, isAb: !!sp.ab, isOcean: species.biome === 'ocean', spread: spec.q !== null && spec.q !== undefined, price: Math.max(1, Math.round(base * ab * cond)) };
  }
  const price = spec => { const i = info(spec); return i ? i.price : 0; };
  // regular (non-aberrant, non-ocean) specimens: the ones "sell all" is allowed to take
  const bulkOk = spec => { const i = info(spec); return !!i && !i.isAb && !i.isOcean; };
  return { info, price, bulkOk, baseValue };
})();
