// ---------------------------------------------------------------- pixel portraits of the market traders (40 x 48 px, shaded, blinking, talking)
const Portrait = (() => {
  const R = (ctx, ox, oy, x, y, w, h, col) => { ctx.fillStyle = col; ctx.fillRect(ox + x, oy + y, w, h); };
  // head silhouette: [y, x0, x1]
  const HEAD = [[12, 14, 26], [13, 12, 28], [14, 11, 29], [15, 10, 30], [16, 10, 30], [17, 10, 30], [18, 10, 30], [19, 10, 30], [20, 10, 30], [21, 10, 30], [22, 10, 30], [23, 10, 30], [24, 11, 29], [25, 11, 29], [26, 12, 28], [27, 14, 26], [28, 16, 24]];
  function head(ctx, ox, oy, o) {
    const sk = o.skin, lt = o.light, dk = o.dark;
    R(ctx, ox, oy, 17, 28, 6, 8, dk);                                                      // neck
    R(ctx, ox, oy, 17, 28, 6, 2, '#8a5a3a');                                              // shadow under the chin
    for (const [y, a, b] of HEAD) { R(ctx, ox, oy, a, y, b - a, 1, sk); R(ctx, ox, oy, a, y, 2, 1, lt); R(ctx, ox, oy, b - 3, y, 3, 1, dk); }   // lit left, shaded right
    R(ctx, ox, oy, 9, 19, 2, 5, dk); R(ctx, ox, oy, 29, 19, 2, 5, dk); R(ctx, ox, oy, 9, 20, 1, 3, '#a87050'); R(ctx, ox, oy, 30, 20, 1, 3, '#a87050');   // ears
    R(ctx, ox, oy, 13, 24, 3, 2, o.blush); R(ctx, ox, oy, 25, 24, 3, 2, o.blush);          // cheeks
    // nose
    R(ctx, ox, oy, 19, 20, 2, 5, lt); R(ctx, ox, oy, 21, 21, 1, 4, dk); R(ctx, ox, oy, 18, 25, 4, 1, '#b87858'); R(ctx, ox, oy, 19, 25, 1, 1, '#8a5030');
    // brows and eyes
    R(ctx, ox, oy, 13, 16, 6, 2, o.brow); R(ctx, ox, oy, 22, 16, 6, 2, o.brow); R(ctx, ox, oy, 12, 17, 1, 1, o.brow); R(ctx, ox, oy, 28, 17, 1, 1, o.brow);
    if (o.blink) { R(ctx, ox, oy, 14, 20, 5, 1, '#3a2418'); R(ctx, ox, oy, 23, 20, 5, 1, '#3a2418'); }
    else for (const ex of [14, 23]) { R(ctx, ox, oy, ex, 19, 5, 3, '#f4f0e8'); R(ctx, ox, oy, ex + 1, 19, 3, 3, o.iris); R(ctx, ox, oy, ex + 2, 20, 1, 2, '#101010'); R(ctx, ox, oy, ex + 1, 19, 1, 1, '#ffffff'); R(ctx, ox, oy, ex, 18, 5, 1, '#5a3a28'); R(ctx, ox, oy, ex, 22, 5, 1, dk); }
  }
  function mouth(ctx, ox, oy, o) {
    if (o.mustache) { R(ctx, ox, oy, 14, 26, 13, 2, o.mustache); R(ctx, ox, oy, 13, 27, 2, 2, o.mustache); R(ctx, ox, oy, 26, 27, 2, 2, o.mustache); R(ctx, ox, oy, 19, 25, 3, 1, o.mustache); }
    if (o.talk) { R(ctx, ox, oy, 17, 28, 7, 2, '#5a1a18'); R(ctx, ox, oy, 18, 28, 5, 1, '#f4f0e8'); R(ctx, ox, oy, 18, 29, 5, 1, '#c8584a'); }
    else { R(ctx, ox, oy, 17, 28, 7, 1, '#8a3a2a'); R(ctx, ox, oy, 16, 27, 1, 1, '#8a3a2a'); R(ctx, ox, oy, 24, 27, 1, 1, '#8a3a2a'); }
    if (o.stubble) for (let i = 0; i < 16; i++) R(ctx, ox, oy, 12 + (i * 7) % 17, 26 + (i * 3) % 4, 1, 1, 'rgba(60,40,30,0.55)');
  }
  const KINDS = {
    // the buyer of butterflies: top hat, red coat, bow tie, moustache, round glasses
    buyer(ctx, ox, oy, o) {
      R(ctx, ox, oy, 0, 0, 40, 48, '#c8b68a'); R(ctx, ox, oy, 0, 30, 40, 18, '#b8a478'); for (let i = 0; i < 40; i += 8) R(ctx, ox, oy, i, 0, 1, 30, 'rgba(90,60,30,0.12)');
      R(ctx, ox, oy, 3, 37, 34, 11, '#7a2a3a'); R(ctx, ox, oy, 5, 35, 30, 3, '#7a2a3a'); R(ctx, ox, oy, 3, 37, 3, 11, '#5a1a28'); R(ctx, ox, oy, 34, 37, 3, 11, '#5a1a28');    // coat and shoulders
      R(ctx, ox, oy, 15, 35, 10, 13, '#f0e8d4'); R(ctx, ox, oy, 15, 35, 2, 13, '#d8d0b8'); R(ctx, ox, oy, 14, 37, 2, 11, '#5a1a28'); R(ctx, ox, oy, 24, 37, 2, 11, '#5a1a28');       // shirt, lapels
      R(ctx, ox, oy, 18, 36, 4, 3, '#2a1a1c'); R(ctx, ox, oy, 15, 36, 3, 3, '#a02a3a'); R(ctx, ox, oy, 22, 36, 3, 3, '#a02a3a'); R(ctx, ox, oy, 19, 37, 2, 1, '#e86a7a');         // bow tie
      R(ctx, ox, oy, 20, 41, 1, 1, '#e8c040'); R(ctx, ox, oy, 20, 44, 1, 1, '#e8c040');
      head(ctx, ox, oy, { skin: '#e8c8a0', light: '#f4dcba', dark: '#c89870', blush: 'rgba(230,110,100,0.35)', brow: '#6a6a70', iris: '#4a6a8a', blink: o.blink });
      R(ctx, ox, oy, 9, 14, 3, 8, '#8a8a90'); R(ctx, ox, oy, 28, 14, 3, 8, '#8a8a90');                                     // grey sideburns
      mouth(ctx, ox, oy, { mustache: '#8a8a90', talk: o.talk });
      ctx.strokeStyle = '#d8a830'; ctx.lineWidth = 1; ctx.strokeRect(ox + 13.5, oy + 18.5, 6, 5); ctx.strokeRect(ox + 22.5, oy + 18.5, 6, 5); R(ctx, ox, oy, 20, 20, 2, 1, '#d8a830'); R(ctx, ox, oy, 11, 19, 3, 1, '#d8a830'); R(ctx, ox, oy, 28, 19, 3, 1, '#d8a830');   // glasses
      R(ctx, ox, oy, 6, 10, 28, 3, '#1c1820'); R(ctx, ox, oy, 11, 0, 18, 11, '#1c1820'); R(ctx, ox, oy, 11, 7, 18, 3, '#a02a3a'); R(ctx, ox, oy, 13, 1, 2, 7, '#3a3440'); R(ctx, ox, oy, 6, 12, 28, 1, '#0c0a10'); R(ctx, ox, oy, 24, 7, 3, 3, '#e8c040'); R(ctx, ox, oy, 25, 8, 1, 1, '#a07810');   // top hat with band and buckle
    },
    // the net seller: green cap, brown apron, friendly stubble, a net behind his shoulder
    seller(ctx, ox, oy, o) {
      R(ctx, ox, oy, 0, 0, 40, 48, '#b8c8a0'); R(ctx, ox, oy, 0, 30, 40, 18, '#a8b890'); for (let i = 0; i < 40; i += 8) R(ctx, ox, oy, i, 0, 1, 30, 'rgba(60,90,40,0.12)');
      // the net leans on his shoulder: the pole runs up along the hoop's axis and ends at its rim, the bag hangs down from the ring
      const L = (x0, y0, x1, y1, col) => { ctx.fillStyle = col; const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))); for (let k = 0; k <= n; k++) ctx.fillRect(ox + Math.round(x0 + (x1 - x0) * k / n), oy + Math.round(y0 + (y1 - y0) * k / n), 1, 1); };
      const P0 = { x: 29, y: 47 }, P1 = { x: 35, y: 17 }, dx = 6 / 30.6, dy = -30 / 30.6, rr = 5.5, cx0 = P1.x + dx * rr, cy0 = P1.y + dy * rr, ring = [];
      for (let i = 0; i < 20; i++) { const a2 = i / 20 * 6.2832; ring.push({ x: cx0 + dx * Math.cos(a2) * rr - dy * Math.sin(a2) * 3.2, y: cy0 + dy * Math.cos(a2) * rr + dx * Math.sin(a2) * 3.2 }); }
      const ap = { x: 37, y: 31 }; ctx.save(); ctx.globalAlpha = 0.42; ctx.fillStyle = '#dff0e8'; ctx.beginPath(); ring.forEach((q, i) => i ? ctx.lineTo(ox + q.x + 0.5, oy + q.y + 0.5) : ctx.moveTo(ox + q.x + 0.5, oy + q.y + 0.5)); ctx.lineTo(ox + ap.x + 0.5, oy + ap.y + 0.5); ctx.closePath(); ctx.fill(); ctx.restore();
      for (let i = 0; i < 20; i += 3) L(ring[i].x, ring[i].y, ap.x, ap.y, 'rgba(90,130,120,0.9)'); L(ring[3].x + (ap.x - ring[3].x) * 0.5, ring[3].y + (ap.y - ring[3].y) * 0.5, ring[13].x + (ap.x - ring[13].x) * 0.5, ring[13].y + (ap.y - ring[13].y) * 0.5, 'rgba(90,130,120,0.8)');
      L(P0.x, P0.y, P1.x, P1.y, '#8a5a2a'); L(P0.x + 1, P0.y, P1.x + 1, P1.y, '#b07a40'); ring.forEach((q, i) => { const n2 = ring[(i + 1) % 20]; L(q.x, q.y, n2.x, n2.y, '#eef2f4'); });
      R(ctx, ox, oy, 3, 37, 34, 11, '#8a6a3a'); R(ctx, ox, oy, 5, 35, 30, 3, '#8a6a3a'); R(ctx, ox, oy, 3, 37, 3, 11, '#6a4a28'); R(ctx, ox, oy, 34, 37, 3, 11, '#6a4a28');   // work shirt
      R(ctx, ox, oy, 14, 35, 12, 13, '#e8e0c8'); R(ctx, ox, oy, 14, 35, 2, 13, '#d0c8aa'); R(ctx, ox, oy, 16, 40, 8, 8, '#5a4028'); R(ctx, ox, oy, 15, 36, 1, 12, '#5a4028'); R(ctx, ox, oy, 24, 36, 1, 12, '#5a4028'); R(ctx, ox, oy, 18, 42, 4, 3, '#4a3420'); R(ctx, ox, oy, 19, 43, 2, 1, '#8a6a48');   // apron with a pocket
      head(ctx, ox, oy, { skin: '#d8a878', light: '#e8c090', dark: '#b88858', blush: 'rgba(210,90,70,0.3)', brow: '#4a3020', iris: '#5a7a3a', blink: o.blink });
      R(ctx, ox, oy, 9, 14, 3, 6, '#5a3a28'); R(ctx, ox, oy, 28, 14, 3, 6, '#5a3a28');                                     // sideburns
      mouth(ctx, ox, oy, { talk: o.talk, stubble: true });
      R(ctx, ox, oy, 8, 9, 24, 4, '#4a6a2a'); R(ctx, ox, oy, 10, 3, 20, 7, '#5a7a3a'); R(ctx, ox, oy, 12, 3, 4, 5, '#6a8a48'); R(ctx, ox, oy, 6, 11, 14, 2, '#3a5a20'); R(ctx, ox, oy, 8, 12, 24, 1, '#3a5a20'); R(ctx, ox, oy, 19, 5, 3, 3, '#e8d070');   // cap with visor and badge
    },
    // the collector of framed collections: bald with white side tufts, a monocle with a chain, green waistcoat, a pinned butterfly on the lapel
    collector(ctx, ox, oy, o) {
      R(ctx, ox, oy, 0, 0, 40, 48, '#a8bca0'); R(ctx, ox, oy, 0, 30, 40, 18, '#98ac90'); for (let i = 0; i < 40; i += 8) R(ctx, ox, oy, i, 0, 1, 30, 'rgba(40,70,40,0.12)');
      R(ctx, ox, oy, 4, 6, 9, 11, '#6a4a2c'); R(ctx, ox, oy, 5, 7, 7, 9, '#e8d8a8'); R(ctx, ox, oy, 6, 9, 5, 4, '#6a9ac8'); R(ctx, ox, oy, 8, 8, 1, 7, '#2a2018');     // a little framed butterfly on the wall
      R(ctx, ox, oy, 3, 37, 34, 11, '#2c3a2a'); R(ctx, ox, oy, 5, 35, 30, 3, '#2c3a2a'); R(ctx, ox, oy, 3, 37, 3, 11, '#1c281c'); R(ctx, ox, oy, 34, 37, 3, 11, '#1c281c');    // coat
      R(ctx, ox, oy, 14, 35, 12, 13, '#7a2a2a'); R(ctx, ox, oy, 14, 35, 2, 13, '#5a1a1a'); R(ctx, ox, oy, 15, 36, 10, 2, '#f0e8d4'); R(ctx, ox, oy, 19, 36, 2, 3, '#2a2a2a');   // waistcoat, collar, tie knot
      R(ctx, ox, oy, 17, 42, 1, 1, '#e8c040'); R(ctx, ox, oy, 22, 42, 1, 1, '#e8c040'); R(ctx, ox, oy, 17, 45, 1, 1, '#e8c040'); R(ctx, ox, oy, 22, 45, 1, 1, '#e8c040');
      R(ctx, ox, oy, 29, 38, 4, 3, '#6aa0e0'); R(ctx, ox, oy, 28, 38, 1, 2, '#2a4a8a'); R(ctx, ox, oy, 33, 38, 1, 2, '#2a4a8a'); R(ctx, ox, oy, 30, 39, 1, 1, '#f4f0e8'); // pinned butterfly
      head(ctx, ox, oy, { skin: '#e4c09a', light: '#f2d8b6', dark: '#c49468', blush: 'rgba(225,110,100,0.3)', brow: '#d8d8d8', iris: '#3a6a4a', blink: o.blink });
      R(ctx, ox, oy, 8, 13, 4, 9, '#e8e8ea'); R(ctx, ox, oy, 28, 13, 4, 9, '#e8e8ea'); R(ctx, ox, oy, 7, 15, 2, 5, '#d0d0d4'); R(ctx, ox, oy, 31, 15, 2, 5, '#d0d0d4');              // white tufts
      R(ctx, ox, oy, 12, 11, 16, 2, '#f0d4b0'); R(ctx, ox, oy, 15, 10, 10, 1, '#f6e0c4'); R(ctx, ox, oy, 18, 11, 4, 1, '#fff0dc');                                                  // bald crown
      mouth(ctx, ox, oy, { mustache: '#e0e0e2', talk: o.talk });
      ctx.strokeStyle = '#d8a830'; ctx.lineWidth = 1; ctx.strokeRect(ox + 22.5, oy + 18.5, 6, 5); R(ctx, ox, oy, 24, 19, 2, 1, 'rgba(255,255,255,0.7)');                                   // monocle
      for (let k = 0; k < 14; k++) R(ctx, ox, oy, 28 + Math.min(4, k >> 1), 23 + k * 1, 1, 1, '#d8a830');                                                                              // its chain
    },
    // the hooded trader: a deep hood with nothing but darkness inside, pale folded hands holding a glowing orb
    hooded(ctx, ox, oy, o) {
      R(ctx, ox, oy, 0, 0, 40, 48, '#2a2238'); R(ctx, ox, oy, 0, 30, 40, 18, '#1c1628'); for (let i = 0; i < 40; i += 6) R(ctx, ox, oy, i, 0, 1, 30, 'rgba(160,120,220,0.07)');
      R(ctx, ox, oy, 0, 38, 12, 10, 'rgba(255,170,70,0.12)'); R(ctx, ox, oy, 2, 40, 6, 8, 'rgba(255,170,70,0.12)');                 // candle glow from the left
      R(ctx, ox, oy, 3, 33, 34, 15, '#241a30'); R(ctx, ox, oy, 6, 31, 28, 4, '#241a30'); R(ctx, ox, oy, 3, 35, 3, 13, '#3a2c4c'); R(ctx, ox, oy, 34, 35, 3, 13, '#140e1c');   // cloak and shoulders
      for (const [fx, fy, fh] of [[10, 36, 12], [16, 38, 10], [24, 38, 10], [30, 36, 12]]) R(ctx, ox, oy, fx, fy, 1, fh, '#16101e');                   // folds
      const HOOD = [[3, 17, 23], [4, 14, 26], [5, 12, 28], [6, 10, 30], [7, 9, 31], [8, 8, 32], [9, 8, 32], [10, 7, 33], [11, 7, 33], [12, 6, 34], [13, 6, 34], [14, 6, 34], [15, 6, 34], [16, 6, 34], [17, 6, 34], [18, 6, 34], [19, 6, 34], [20, 6, 34], [21, 6, 34], [22, 6, 34], [23, 6, 34], [24, 6, 34], [25, 7, 33], [26, 7, 33], [27, 8, 32], [28, 8, 32], [29, 9, 31], [30, 10, 30], [31, 11, 29], [32, 12, 28]];
      for (const [y, a, b] of HOOD) { R(ctx, ox, oy, a, y, b - a, 1, '#2e2440'); R(ctx, ox, oy, a, y, 2, 1, '#4a3a62'); R(ctx, ox, oy, b - 3, y, 3, 1, '#1a1224'); }
      R(ctx, ox, oy, 17, 3, 6, 1, '#5a4a74'); R(ctx, ox, oy, 12, 5, 2, 1, '#5a4a74');                                                                       // light on the crown
      for (const [fx, fy, fh] of [[10, 10, 8], [30, 10, 8], [8, 20, 6], [32, 20, 6]]) R(ctx, ox, oy, fx, fy, 1, fh, '#1c1428');                          // folds of the hood
      // the opening: pure darkness
      const VOID = [[10, 15, 25], [11, 13, 27], [12, 12, 28], [13, 11, 29], [14, 11, 29], [15, 11, 29], [16, 11, 29], [17, 11, 29], [18, 11, 29], [19, 11, 29], [20, 12, 28], [21, 12, 28], [22, 13, 27], [23, 14, 26], [24, 15, 25], [25, 16, 24], [26, 18, 22]];
      for (const [y, a, b] of VOID) { R(ctx, ox, oy, a - 1, y, b - a + 2, 1, '#3a2c52'); R(ctx, ox, oy, a, y, b - a, 1, '#050308'); }
      R(ctx, ox, oy, 15, 10, 10, 1, '#14101c');
      // hands and the orb
      R(ctx, ox, oy, 13, 40, 14, 5, '#241a30'); R(ctx, ox, oy, 15, 39, 4, 3, '#b8a898'); R(ctx, ox, oy, 21, 39, 4, 3, '#b8a898'); R(ctx, ox, oy, 15, 41, 10, 2, '#a89888');
      const glow = o.talk ? '#d8b8ff' : '#a880f0'; R(ctx, ox, oy, 17, 35, 6, 5, glow); R(ctx, ox, oy, 18, 34, 4, 7, glow); R(ctx, ox, oy, 18, 35, 2, 2, '#f4e8ff'); R(ctx, ox, oy, 16, 34, 8, 8, o.talk ? 'rgba(200,150,255,0.22)' : 'rgba(170,120,240,0.14)');
    },
  };
  // x, y: top-left corner; the frame is drawn around the picture
  function draw(ctx, kind, x, y, t, talking) {
    const blink = (t % 4.3) > 4.15, bob = Math.round(Math.sin(t * 1.6) * 0.5 + 0.5), talk = !!talking && Math.floor(t * 7) % 2 === 0;
    ctx.fillStyle = '#3a2412'; ctx.fillRect(x - 2, y - 2, 44, 52); ctx.fillStyle = '#a07838'; ctx.fillRect(x - 1, y - 1, 42, 50); ctx.fillStyle = '#1a1008'; ctx.fillRect(x, y, 40, 48);
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, 40, 48); ctx.clip(); (KINDS[kind] || KINDS.buyer)(ctx, x, y + bob, { blink, talk }); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.14)'; ctx.fillRect(x, y, 40, 1); ctx.fillRect(x, y, 1, 48);
  }
  return { draw };
})();
