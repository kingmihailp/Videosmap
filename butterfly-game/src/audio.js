// ---------------------------------------------------------------- procedural audio (WebAudio, no files)
const Snd = (() => {
  let ac = null, master, sfxG, ambG, musG, noiseBuf, timer = null, ambKind = null, nextEvt = 0, musNext = 0, musStep = 0, amb = null, lastT = 0;
  const A = { enabled: true, music: true };

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { ac = null; return; }
    master = ac.createGain(); master.gain.value = 0.8; master.connect(ac.destination);
    sfxG = ac.createGain(); sfxG.gain.value = 0.9; sfxG.connect(master);
    ambG = ac.createGain(); ambG.gain.value = 0.0; ambG.connect(master);
    musG = ac.createGain(); musG.gain.value = 0.0; musG.connect(master);
    noiseBuf = ac.createBuffer(1, ac.sampleRate * 2, ac.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    timer = setInterval(tick, 120);
    applySettings();
  }
  function applySettings() {
    if (!ac) return;
    const s = Save.data.settings; A.enabled = s.sound; A.music = s.music;
    master.gain.setTargetAtTime(A.enabled ? 0.8 : 0, ac.currentTime, 0.05);
    musG.gain.setTargetAtTime(A.music && ambKind ? 0.5 : 0, ac.currentTime, 0.4);
  }
  const now = () => ac.currentTime;
  function noiseSrc(loop = false) { const s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = loop; if (loop) s.loopStart = Math.random(); return s; }
  function env(g, t, a, d, peak, sus = 0) { g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(Math.max(sus, 0.0002), t + a + d); }
  function osc(type, f, t, dur, vol, dest, f2) {
    const o = ac.createOscillator(), g = ac.createGain(); o.type = type; o.frequency.setValueAtTime(f, t); if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + dur);
    env(g, t, 0.004, dur, vol); o.connect(g); g.connect(dest || sfxG); o.start(t); o.stop(t + dur + 0.05); return o;
  }
  function bell(f, t, vol, dur = 1.2, dest) {
    const c = ac.createOscillator(), m = ac.createOscillator(), mg = ac.createGain(), g = ac.createGain();
    c.frequency.value = f; m.frequency.value = f * 3.5; mg.gain.setValueAtTime(f * 1.4, t); mg.gain.exponentialRampToValueAtTime(1, t + dur * 0.5);
    m.connect(mg); mg.connect(c.frequency); env(g, t, 0.003, dur, vol); c.connect(g); g.connect(dest || sfxG); c.start(t); m.start(t); c.stop(t + dur + 0.1); m.stop(t + dur + 0.1);
  }
  function noiseBurst(t, dur, f0, f1, vol, type = 'bandpass', q = 1, dest) {
    const s = noiseSrc(), fl = ac.createBiquadFilter(), g = ac.createGain(); fl.type = type; fl.Q.value = q; fl.frequency.setValueAtTime(f0, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur);
    env(g, t, Math.min(0.02, dur * 0.3), dur, vol); s.connect(fl); fl.connect(g); g.connect(dest || sfxG); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  const midi = n => 440 * Math.pow(2, (n - 69) / 12);

  const sfx = {
    click() { if (!ac) return; const t = now(); osc('square', 880, t, 0.06, 0.07); osc('square', 1320, t + 0.045, 0.07, 0.06); },
    hover() { if (!ac) return; osc('square', 1320, now(), 0.03, 0.025); },
    step(kind) { if (!ac) return; const t = now(); const f = kind === 'sand' ? 900 : kind === 'rock' ? 1400 : kind === 'wood' ? 760 : 520; noiseBurst(t, 0.07, f, f * 0.6, 0.12, 'lowpass', 0.7); },
    swing() { if (!ac) return; const t = now(); noiseBurst(t, 0.28, 500, 2200, 0.32, 'bandpass', 1.2); },
    miss() { if (!ac) return; const t = now(); osc('triangle', 220, t, 0.18, 0.08, null, 140); },
    flutter() { if (!ac) return; const t = now(); noiseBurst(t, 0.09, 3000, 5200, 0.05, 'bandpass', 3); },
    catchSp(first, rar) {
      if (!ac) return; const t = now(); const sc = [0, 2, 4, 7, 9, 12, 14, 16];
      const n = first ? 7 : 4; const root = 72 + (rar === 3 ? 0 : rar === 2 ? -2 : -5);
      for (let i = 0; i < n; i++) bell(midi(root + sc[i]), t + i * 0.085, first ? 0.2 : 0.16, first ? 1.8 : 1.0);
      if (first) { for (let i = 0; i < 6; i++) osc('triangle', midi(root + 12 + sc[i % 5]) * 2, t + 0.65 + i * 0.07, 0.4, 0.04); }
    },
    complete() { if (!ac) return; const t = now(); [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => { bell(midi(67 + n), t + i * 0.1, 0.2, 2.2); }); osc('triangle', midi(43), t, 1.6, 0.12); osc('triangle', midi(50), t, 1.6, 0.1); },
    pin() { if (!ac) return; const t = now(); osc('sine', 900, t, 0.2, 0.15, null, 300); bell(midi(88), t + 0.14, 0.12, 0.8); },
    page() { if (!ac) return; noiseBurst(now(), 0.12, 2400, 900, 0.1, 'bandpass', 0.8); },
    grab() { if (!ac) return; osc('triangle', 520, now(), 0.05, 0.05, null, 700); },
    stick(q) { if (!ac) return; const t = now(); noiseBurst(t, 0.05, 3200, 1200, 0.22, 'bandpass', 2); osc('sine', 150, t, 0.12, 0.2, null, 70); if (q > 0.75) bell(midi(96), t + 0.05, 0.05, 0.6); },
    tear() { if (!ac) return; noiseBurst(now(), 0.22, 2600, 5200, 0.16, 'highpass', 0.8); },
    thud() { if (!ac) return; const t = now(); osc('sine', 120, t, 0.16, 0.25, null, 55); noiseBurst(t, 0.06, 700, 300, 0.12, 'lowpass', 0.7); },
    grade(q) { if (!ac) return; const t = now(); const n = q >= 95 ? 7 : q >= 85 ? 5 : q >= 70 ? 4 : q >= 50 ? 3 : 2; const sc = [0, 4, 7, 12, 16, 19, 24]; for (let i = 0; i < n; i++) bell(midi(60 + sc[i] + (q < 50 ? -5 : 0)), t + i * 0.11, 0.17, 1.8); },
    door() { if (!ac) return; const t = now(); noiseBurst(t, 0.3, 300, 120, 0.18, 'lowpass', 0.7); osc('sine', 90, t, 0.25, 0.15, null, 60); },
    deny() { if (!ac) return; const t = now(); osc('square', 180, t, 0.12, 0.08); osc('square', 140, t + 0.1, 0.16, 0.08); },
  };

  // --- ambience -------------------------------------------------------------
  const AMB = {
    meadow:     { wind: 0.5, bird: 'song', insect: ['cricket', 4400, 0.05], base: 57, scale: [0, 2, 4, 7, 9], mus: 0.9 },
    alpine:     { wind: 1.0, bird: 'sparse', insect: null, bell: true, base: 55, scale: [0, 2, 5, 7, 9], mus: 0.9 },
    med:        { wind: 0.35, bird: 'sparse', insect: ['cicada', 6200, 0.1], base: 52, scale: [0, 1, 4, 5, 7, 8, 11], mus: 0.8 },
    rainforest: { wind: 0.2, bird: 'tropic', insect: ['cicada', 4200, 0.06], frog: true, base: 50, scale: [0, 3, 5, 7, 10], mus: 0.8 },
    rainforest2:{ wind: 0.2, bird: 'tropic', insect: ['cicada', 5200, 0.07], frog: true, base: 53, scale: [0, 2, 4, 7, 9], mus: 0.8 },
    savanna:    { wind: 0.55, bird: 'dove', insect: ['cricket', 3800, 0.04], base: 50, scale: [0, 2, 5, 7, 10], mus: 0.8 },
    prairie:    { wind: 0.65, bird: 'lark', insect: ['cricket', 4000, 0.05], base: 55, scale: [0, 2, 4, 7, 9], mus: 0.9 },
    cabinet:    { wind: 0.07, bird: 'sparse', insect: null, clock: true, base: 48, scale: [0, 3, 5, 7, 10], mus: 0.7 },
    forest:     { wind: 0.3, bird: 'song', insect: ['cicada', 5600, 0.06], water: true, base: 54, scale: [0, 2, 5, 7, 9], mus: 0.9 },
  };
  function startAmbient(kind) {
    if (!ac) return; stopAmbient(); const cfg = AMB[kind] || AMB.meadow; ambKind = kind; amb = { cfg, nodes: [] };
    const t = now();
    // wind
    const w = noiseSrc(true), wf = ac.createBiquadFilter(), wg = ac.createGain(); wf.type = 'bandpass'; wf.frequency.value = 420; wf.Q.value = 0.6;
    const lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.13; lg.gain.value = 0.35 * cfg.wind; lfo.connect(lg); lg.connect(wg.gain); wg.gain.value = 0.28 * cfg.wind; w.connect(wf); wf.connect(wg); wg.connect(ambG); w.start(); lfo.start(); amb.nodes.push(w, lfo);
    if (cfg.water) { const s = noiseSrc(true), f = ac.createBiquadFilter(), g = ac.createGain(); f.type = 'bandpass'; f.frequency.value = 1800; f.Q.value = 0.9; g.gain.value = 0.07; s.connect(f); f.connect(g); g.connect(ambG); s.start(); amb.nodes.push(s); }
    if (cfg.insect) { // constant insect bed
      const [kind2, fq, vol] = cfg.insect; const o = ac.createOscillator(), g = ac.createGain(), am = ac.createOscillator(), amg = ac.createGain();
      o.frequency.value = fq; am.frequency.value = kind2 === 'cicada' ? 38 : 9; amg.gain.value = vol * 0.5; g.gain.value = vol * 0.5; am.connect(amg); amg.connect(g.gain); o.connect(g); g.connect(ambG); o.start(); am.start(); amb.nodes.push(o, am);
    }
    ambG.gain.cancelScheduledValues(t); ambG.gain.setValueAtTime(0.0001, t); ambG.gain.linearRampToValueAtTime(0.9, t + 2.0);
    musG.gain.cancelScheduledValues(t); musG.gain.setTargetAtTime(A.music ? 0.5 : 0, t, 0.8);
    nextEvt = t + 1; musNext = t + 1.5; musStep = 0;
  }
  function stopAmbient() {
    if (!ac) return; const t = now(); ambG.gain.cancelScheduledValues(t); ambG.gain.setTargetAtTime(0.0001, t, 0.25);
    if (amb) { const nodes = amb.nodes; setTimeout(() => nodes.forEach(n => { try { n.stop(); } catch (e) {} }), 900); }
    amb = null; ambKind = null; musG.gain.setTargetAtTime(0, t, 0.3);
  }
  function chirp(t, base, n, vol) {
    for (let i = 0; i < n; i++) { const f = base * (0.9 + Math.random() * 0.4); const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; const tt = t + i * 0.085; o.frequency.setValueAtTime(f, tt); o.frequency.exponentialRampToValueAtTime(f * (Math.random() < 0.5 ? 1.35 : 0.7), tt + 0.06); env(g, tt, 0.006, 0.07, vol); o.connect(g); g.connect(ambG); o.start(tt); o.stop(tt + 0.1); }
  }
  function ambientEvents(t) {
    const c = amb.cfg;
    if (c.bird === 'song') chirp(t + Math.random() * 0.4, 2600 + Math.random() * 1800, 2 + (Math.random() * 5 | 0), 0.07);
    else if (c.bird === 'sparse' && Math.random() < 0.5) chirp(t, 3200 + Math.random() * 800, 2, 0.05);
    else if (c.bird === 'tropic') { if (Math.random() < 0.5) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(700, t); o.frequency.exponentialRampToValueAtTime(1500, t + 0.25); o.frequency.exponentialRampToValueAtTime(900, t + 0.4); env(g, t, 0.02, 0.42, 0.08); o.connect(g); g.connect(ambG); o.start(t); o.stop(t + 0.5); } else chirp(t, 3800, 3, 0.05); }
    else if (c.bird === 'dove') { [0, 0.28, 0.5].forEach((d, i) => osc('sine', 420 - i * 20, t + d, 0.22, 0.06, ambG)); }
    else if (c.bird === 'lark') { [0, 0.18, 0.34, 0.56, 0.7].forEach((d, i) => osc('sine', [1700, 2100, 1900, 2400, 2100][i], t + d, 0.15, 0.06, ambG)); }
    if (c.frog && Math.random() < 0.6) { for (let i = 0; i < 3; i++) { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'square'; o.frequency.value = 170 + Math.random() * 60; env(g, t + i * 0.13, 0.01, 0.1, 0.03); const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 600; o.connect(f); f.connect(g); g.connect(ambG); o.start(t + i * 0.13); o.stop(t + i * 0.13 + 0.14); } }
    if (c.bell && Math.random() < 0.35) { bell(midi(76 + (Math.random() * 3 | 0) * 2), t, 0.035, 2.2, ambG); }
  }
  function music(t) {
    const c = amb.cfg; const sc = c.scale;
    if (t >= musNext) {
      const step = musStep++; const beat = 1.8;
      if (step % 4 === 0) { // pad chord
        const root = c.base + [0, 5, 7, 3][(step / 4 | 0) % 4];
        [0, 7, 12].forEach(i => { const o = ac.createOscillator(), g = ac.createGain(); o.type = 'triangle'; o.frequency.value = midi(root + i); g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(0.09, t + 1.4); g.gain.linearRampToValueAtTime(0.0001, t + beat * 4); o.connect(g); g.connect(musG); o.start(t); o.stop(t + beat * 4 + 0.1); });
      }
      if (Math.random() < 0.7) bell(midi(c.base + 12 + sc[(Math.random() * sc.length) | 0] + (Math.random() < 0.3 ? 12 : 0)), t + 0.2, 0.05, 1.6, musG);
      musNext = t + beat;
    }
  }
  function tick() {
    if (!ac || !amb) return; const t = now();
    if (t >= nextEvt) { ambientEvents(t + 0.05); nextEvt = t + 1.2 + Math.random() * 3.2; }
    music(t + 0.05);
    if (amb.cfg.clock) { if (!amb.clockNext || amb.clockNext < t - 1) amb.clockNext = t; while (amb.clockNext < t + 0.2) { amb.clockHi = !amb.clockHi; osc('square', amb.clockHi ? 1900 : 1500, amb.clockNext, 0.025, 0.035, ambG); amb.clockNext += 1; } }
  }
  return { init, sfx, startAmbient, stopAmbient, applySettings, get ready() { return !!ac; }, resume() { if (ac && ac.state === 'suspended') ac.resume(); } };
})();
