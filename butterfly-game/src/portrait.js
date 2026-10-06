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
      ctx.fillStyle = '#9a6a38'; for (let k = 0; k < 30; k++) ctx.fillRect(ox + 36 - k * 0.3, oy + 40 - k, 1, 1);                       // net pole behind
      ctx.strokeStyle = '#eef2f4'; ctx.lineWidth = 1; ctx.beginPath(); ctx.ellipse(ox + 33, oy + 6, 5, 4, 0.5, 0, 6.3); ctx.stroke(); ctx.fillStyle = 'rgba(210,235,225,0.35)'; ctx.beginPath(); ctx.moveTo(ox + 28, oy + 8); ctx.lineTo(ox + 36, oy + 16); ctx.lineTo(ox + 38, oy + 6); ctx.fill();
      R(ctx, ox, oy, 3, 37, 34, 11, '#8a6a3a'); R(ctx, ox, oy, 5, 35, 30, 3, '#8a6a3a'); R(ctx, ox, oy, 3, 37, 3, 11, '#6a4a28'); R(ctx, ox, oy, 34, 37, 3, 11, '#6a4a28');   // work shirt
      R(ctx, ox, oy, 14, 35, 12, 13, '#e8e0c8'); R(ctx, ox, oy, 14, 35, 2, 13, '#d0c8aa'); R(ctx, ox, oy, 16, 40, 8, 8, '#5a4028'); R(ctx, ox, oy, 15, 36, 1, 12, '#5a4028'); R(ctx, ox, oy, 24, 36, 1, 12, '#5a4028'); R(ctx, ox, oy, 18, 42, 4, 3, '#4a3420'); R(ctx, ox, oy, 19, 43, 2, 1, '#8a6a48');   // apron with a pocket
      head(ctx, ox, oy, { skin: '#d8a878', light: '#e8c090', dark: '#b88858', blush: 'rgba(210,90,70,0.3)', brow: '#4a3020', iris: '#5a7a3a', blink: o.blink });
      R(ctx, ox, oy, 9, 14, 3, 6, '#5a3a28'); R(ctx, ox, oy, 28, 14, 3, 6, '#5a3a28');                                     // sideburns
      mouth(ctx, ox, oy, { talk: o.talk, stubble: true });
      R(ctx, ox, oy, 8, 9, 24, 4, '#4a6a2a'); R(ctx, ox, oy, 10, 3, 20, 7, '#5a7a3a'); R(ctx, ox, oy, 12, 3, 4, 5, '#6a8a48'); R(ctx, ox, oy, 6, 11, 14, 2, '#3a5a20'); R(ctx, ox, oy, 8, 12, 24, 1, '#3a5a20'); R(ctx, ox, oy, 19, 5, 3, 3, '#e8d070');   // cap with visor and badge
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
