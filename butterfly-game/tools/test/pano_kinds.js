// a contact sheet of single panorama objects (houses, windmill, torii, agave, trees) at 3x
const { chromium } = require(process.env.PW_CORE || 'playwright-core');
(async () => {
  const br = await chromium.launch({ executablePath: process.env.CHROME, args: ['--no-sandbox'] }); const pg = await br.newPage(); pg.on('pageerror', e => console.log('ERR', e.message));
  await pg.goto('file:///home/user/Videosmap/butterfly-game/Flora0world_Butterflies.html#debug&nolock'); await pg.waitForTimeout(2000);
  const u = await pg.evaluate(() => { const K = Panorama.KINDS, items = [['hut', 28, 34, '#9a6a44', '#7a3a2a'], ['hut', 28, 34, '#d8c8a8', '#4a3a40'], ['chalet', 30, 34, '#8a5a3a', '#6a4a3a'], ['cube', 34, 34, '#f8f4ec', '#3a78c8'], ['stilt', 24, 36, '#a8884e', '#c8a858'], ['barn', 48, 40, '#b03a2a', '#4a2a22'], ['windmill', 26, 62, '#d8d0bc', '#8a6a48'], ['torii', 26, 34, '#c82a1c'], ['agave', 30, 18, '#5a8a74', '#7aaa96'], ['oak', 30, 50, '#2e6a2a', '#4a8a38'], ['bamboo', 12, 56, '#4a8a4a', '#6aa858'], ['yucca', 22, 34, '#6a8a4a', '#f4eed6']];
    const S = 3, W = 4, cv = document.createElement('canvas'); cv.width = W * 120; cv.height = 3 * 100; const c = cv.getContext('2d'); c.fillStyle = '#a8c8e8'; c.fillRect(0, 0, cv.width, cv.height); c.fillStyle = '#6a9a48'; for (let r = 0; r < 3; r++) c.fillRect(0, r * 100 + 78, cv.width, 22);
    items.forEach(([k, w, h, c1, c2], i) => { const cx = (i % W) * 120 + 60, cy = ((i / W) | 0) * 100 + 84; K[k](c, cx, cy, h, w, c1, c2, 3.1, i); }); return cv.toDataURL(); });
  require('fs').writeFileSync('/tmp/claude-0/-home-user-Videosmap/f48094eb-42f2-5834-9ed0-7ec7af5f2a95/scratchpad/kinds.png', Buffer.from(u.split(',')[1], 'base64')); await br.close();
})();
