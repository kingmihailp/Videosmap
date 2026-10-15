// ---------------------------------------------------------------- which generations of a location are night ones: decided by the seed, so everybody who shares the seed (multiplayer) agrees
const Night = (() => {
  const CHANCE = 0.3;                                                            // a share of the new generations of every location (except the ocean, which is always night)
  const forced = () => { const h = typeof location !== 'undefined' ? location.hash : ''; return /[#&]night\b/.test(h) ? true : /[#&]day\b/.test(h) || /[#&]debug\b/.test(h) ? false : null; };       // #night / #day in the address: for tests (a #debug page is always a day one unless #night is given)
  const raw = (biomeId, seed) => biomeId !== 'ocean' && (strSeed('night:' + biomeId + ':' + seed) % 10000) / 10000 < CHANCE;
  const is = (biomeId, seed) => { if (biomeId === 'ocean') return false; const f = forced(); return f !== null ? f : raw(biomeId, seed); };
  return { is, raw, CHANCE };
})();
