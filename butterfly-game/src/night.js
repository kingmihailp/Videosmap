// ---------------------------------------------------------------- which generations of a location are night ones: decided by the seed, so everybody who shares the seed (multiplayer) agrees
const Night = (() => {
  const CHANCE = 0.3;                                                            // a share of the new generations of every location (except the ocean, which is always night)
  const forced = () => { const h = typeof location !== 'undefined' ? location.hash : ''; return /[#&]night\b/.test(h) ? true : /[#&]day\b/.test(h) ? false : null; };       // #night / #day in the address: for tests
  const is = (biomeId, seed) => { if (biomeId === 'ocean') return false; const f = forced(); if (f !== null) return f; return (strSeed('night:' + biomeId + ':' + seed) % 10000) / 10000 < CHANCE; };
  return { is, CHANCE };
})();
