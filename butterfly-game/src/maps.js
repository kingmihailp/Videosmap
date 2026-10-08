// ---------------------------------------------------------------- location maps: sold by the hooded trader of the secret market; every player owns his own (personal, stored in the save)
// Whoever owns a map sees its location on the world map and in the journal and may enter it; players who own the same map meet there.
const Maps = (() => {
  const LIST = [
    { id: 'bog', biome: 'bog', name: 'Карта торфяных болот', price: 4500, blurb: 'Васюганское болото в Западной Сибири: кочки, мочажины, пушица и бабочки, которые не летают нигде больше.' },
    { id: 'papua', biome: 'papua', name: 'Карта Новой Гвинеи', price: 10500, blurb: 'Реликтовые джунгли у вулкана Ламингтон: гигантские деревья, застывшая лава и самая крупная бабочка мира.' },
    { id: 'vietnam', biome: 'vietnam', name: 'Карта высокогорий Вьетнама', price: 8000, blurb: 'Скальные горы Хоангльеншон на севере Вьетнама: подъёмы, туман в ущельях, шаткие мосты и золотой кайзер-и-хинд.' },
  ];
  const ids = () => { const d = Save.data; if (!d.maps) d.maps = {}; return d.maps; };
  const api = {
    LIST,
    has: id => !!ids()[id],
    owned: () => LIST.filter(m => ids()[m.id]).map(m => m.id),
    buy(id) { const m = LIST.find(x => x.id === id); if (!m || ids()[id]) return 'have'; if ((Save.data.coins || 0) < m.price) return 'poor'; Save.data.coins -= m.price; ids()[id] = true; Save.write(); return 'ok'; },
    // biomes the player may see/enter: every ordinary one, the ocean, and the secret ones whose map he owns
    visible: () => BIOMES.filter(b => !b.map || ids()[b.map]),
    allowed: biomeId => { const b = BIOME_BY_ID[biomeId]; return !!b && (!b.map || !!ids()[b.map]); },
  };
  return api;
})();
const visibleBiomes = () => Maps.visible();
