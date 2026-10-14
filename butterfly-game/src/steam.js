// Steam hooks (only active inside the desktop build, where preload.js provides window.F0WNative.steam): achievements from the journal
(() => {
  const N = window.F0WNative; if (!N || !N.steam) return;
  const caught = () => SPECIES.filter(s => Save.has(s.id));
  const done = new Set();
  const ACH = [   // [steam API name, condition]
    ['ACH_FIRST_CATCH', () => caught().length >= 1],
    ['ACH_TEN_SPECIES', () => caught().length >= 10],
    ['ACH_FIFTY_SPECIES', () => caught().length >= 50],
    ['ACH_HUNDRED_SPECIES', () => caught().length >= 100],
    ['ACH_RARE', () => caught().some(s => Rare.is(s))],
    ['ACH_ALL_RARE', () => [...Rare.ids].every(id => Save.has(id))],
    ['ACH_LOCATION_COMPLETE', () => BIOMES.some(b => b.species.length && Save.biomeCount(b) >= b.species.length)],
    ['ACH_FIVE_LOCATIONS', () => BIOMES.filter(b => b.species.length && Save.biomeCount(b) >= b.species.length).length >= 5],
    ['ACH_DESERT', () => Save.biomeCount(BIOME_BY_ID.chihuahua) > 0],
    ['ACH_RICH', () => (Save.data.coins || 0) >= 100000],
    ['ACH_COLLECTOR', () => (Save.data.specimens || []).length >= 25],
  ];
  setInterval(() => { try { for (const [id, ok] of ACH) if (!done.has(id) && ok()) { done.add(id); N.steam.unlock(id); } } catch (e) {} }, 3000);
})();
