// ---------------------------------------------------------------- the butterfly economy: what the merchant at the insect market pays for a specimen (coins)
// price = species value (from its rarity in nature) x aberration multiplier x condition multiplier
//  * species value: common ~6, uncommon ~16, rare ~42 coins (+-15% per species, stable); the secret ocean butterflies are worth ~150-250
//  * aberrants are worth several times more than the regular form of their species
//  * a spread and pinned specimen is worth more than a raw one of the same species: from 1.45x (poorly spread) up to 3x (perfect, quality 100)
//  * the butterflies of the secret locations Bog and New Guinea are worth twice as much (except Queen Alexandra's birdwing, which has a fixed price)
const Econ = (() => {
  const BASE = { 1: 6, 2: 16, 3: 42 }, RAW_K = 0.55, SPREAD_LO = 1.45, SPREAD_HI = 3, AB_K = 6, LOC_K = { bog: 2, papua: 2 };
  const h = id => (strSeed(id) % 1000) / 1000;
  const baseValue = sp => sp.fixedPrice ? sp.fixedPrice : (sp.biome === 'ocean' || sp.mystery) ? Math.round(150 + h(sp.id) * 100) : Math.round(BASE[sp.rar || 1] * (0.85 + 0.3 * h(sp.id)));
  const isSpread = spec => spec.q !== null && spec.q !== undefined;
  const spreadX = spec => lerp(SPREAD_LO, SPREAD_HI, clamp(spec.q / 100));       // how many times a raw specimen the spread one is worth
  const condK = spec => isSpread(spec) ? RAW_K * spreadX(spec) : RAW_K;
  const locK = sp => sp.fixedPrice ? 1 : (LOC_K[sp.biome] || 1);
  // full breakdown for one specimen
  function info(spec) {
    const sp = SPECIES_BY_ID[spec.sp]; if (!sp) return null;
    const species = sp.base ? RAW_BY_ID[sp.base] : sp, base = baseValue(species);
    const ab = sp.ab ? AB_K * (0.9 + 0.2 * h(sp.ab.code)) : 1, cond = species.fixedPrice ? (isSpread(spec) ? spreadX(spec) : 1) : condK(spec), loc = locK(species);       // a species with a fixed price (Queen Alexandra's birdwing, 1500) is paid exactly that, whatever the condition; an aberration multiplies it
    return { sp, species, base, loc, ab, cond, isAb: !!sp.ab, isOcean: species.biome === 'ocean', spread: spec.q !== null && spec.q !== undefined, price: Math.max(1, Math.round(base * loc * ab * cond)) };
  }
  const price = spec => { const i = info(spec); return i ? i.price : 0; };
  // regular (non-aberrant, non-ocean) specimens: the ones "sell all" is allowed to take
  const bulkOk = spec => { const i = info(spec); return !!i && !i.isAb && !i.isOcean && !i.species.fixedPrice; };
  return { info, price, bulkOk, baseValue };
})();
