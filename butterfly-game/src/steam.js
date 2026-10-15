// Achievements: checked in the game itself (saved in Save.data.ach, a message when a new one is earned) and, in the desktop build,
// reported to Steam (window.F0WNative.steam, see desktop/preload.js). The Steam API names must match steam/achievements.json.
(() => {
  const N = window.F0WNative, steam = N && N.steam;
  const caught = () => SPECIES.filter(s => Save.has(s.id));
  // a large frame (box) filled completely with Queen Alexandra's birdwing aberrants, every one spread to 100 %
  const pro = () => (Save.data.boxes || []).some(b => b.size === 'L' && b.items.length === Save.CAP.L && b.items.every(u => { const s = u && Save.spec(u), a = s && Aberr.parse(s.sp); return !!a && a.base === 'ornithoptera_alexandrae' && s.q >= 100; }));
  const ACH = [   // [steam API name, name shown in the game, condition]
    ['ACH_FIRST_CATCH', 'Первая бабочка', () => caught().length >= 1],
    ['ACH_TEN_SPECIES', 'Начинающий коллекционер', () => caught().length >= 10],
    ['ACH_FIFTY_SPECIES', 'Опытный энтомолог', () => caught().length >= 50],
    ['ACH_HUNDRED_SPECIES', 'Хранитель коллекции', () => caught().length >= 100],
    ['ACH_RARE', 'Красная книга', () => caught().some(s => Rare.is(s))],
    ['ACH_ALL_RARE', 'Охотник за легендами', () => [...Rare.ids].every(id => Save.has(id))],
    ['ACH_LOCATION_COMPLETE', 'Полный набор', () => BIOMES.some(b => b.species.length && Save.biomeCount(b) >= b.species.length)],
    ['ACH_FIVE_LOCATIONS', 'Кругосветка', () => BIOMES.filter(b => b.species.length && Save.biomeCount(b) >= b.species.length).length >= 5],
    ['ACH_DESERT', 'Песок и крылья', () => Save.biomeCount(BIOME_BY_ID.chihuahua) > 0],
    ['ACH_RICH', 'Богатый энтомолог', () => (Save.data.coins || 0) >= 100000],
    ['ACH_COLLECTOR', 'Кабинет редкостей', () => (Save.data.specimens || []).length >= 25],
    ['ACH_PROFESSIONAL', 'Профессионал своего дела', pro],
  ];
  const sent = new Set(), queue = []; let first = true, shownAt = 0;
  setInterval(() => {
    try {
      if (!Save.data.ach) Save.data.ach = {};
      for (const [id, name, ok] of ACH) {
        if (!ok()) continue;
        if (steam && !sent.has(id)) { sent.add(id); steam.unlock(id); }
        if (!Save.data.ach[id]) { Save.data.ach[id] = Date.now(); Save.write(); if (!first) queue.push(name); }   // the first pass only records what an older save had already earned
      }
      first = false;
      const A = window.F0W, o = A && (A.play || A.cab);
      if (queue.length && o && o.toast && Date.now() - shownAt > 4500) { o.toast('Достижение: ' + queue.shift(), 4.5); shownAt = Date.now(); if (Snd && Snd.sfx && Snd.sfx.complete) Snd.sfx.complete(); }
    } catch (e) {}
  }, 1500);
})();
